from django.db import connection
from .models import Job
from .embeddings import get_embedding

def get_related_jobs(job_id, top_n=5):
    """
    Get top_n related jobs for a given job_id using pgvector cosine similarity.
    Prioritizes jobs in the same category first, then falls back to other categories.
    """
    # 1. Fetch the target job
    try:
        job = Job.objects.get(id=job_id)
        category_id = job.categoryid
    except Job.DoesNotExist:
        return []

    # 2. Get the target job's embedding. If not exists, create it.
    target_embedding = None
    with connection.cursor() as cursor:
        cursor.execute("SELECT embedding FROM job_embeddings WHERE job_id = %s", [job_id])
        row = cursor.fetchone()
        if row:
            val = row[0]
            # Keep it as a string to avoid string formatting issues in psycopg2 with long lists
            if isinstance(val, str):
                target_embedding = val
            elif isinstance(val, list):
                target_embedding = '[' + ','.join(map(str, val)) + ']'
            else:
                target_embedding = str(val)

    if not target_embedding:
        try:
            combined_text = f"Tiêu đề: {job.title}\nMô tả: {job.description or ''}\nYêu cầu: {job.requirements or ''}\nQuyền lợi: {job.benefits or ''}"
            vector_list = get_embedding(combined_text)
            target_embedding = '[' + ','.join(map(str, vector_list)) + ']'
            
            with connection.cursor() as cursor:
                cursor.execute(
                    "INSERT INTO job_embeddings (job_id, embedding) VALUES (%s, %s::vector) ON CONFLICT (job_id) DO UPDATE SET embedding = EXCLUDED.embedding",
                    [job_id, target_embedding]
                )
        except Exception as e:
            print(f"Error generating target embedding: {e}")
            return []

    # 3. Query similar jobs
    related_jobs = []
    
    # Step 3a: Query similar jobs in the SAME category first
    try:
        query_same_cat = """
            SELECT 
                j.id, j.title, j.description, j.requirements, j.benefits, 
                j.slug, j.type, j.experience, j.level, j."salaryMin", j."salaryMax",
                (1 - (je.embedding <=> %s::vector)) AS similarity_score
            FROM job_embeddings je
            JOIN jobs j ON je.job_id = j.id
            WHERE j.id != %s AND j."isVisible" = TRUE AND j."categoryId" = %s
            ORDER BY je.embedding <=> %s::vector
            LIMIT %s
        """
        with connection.cursor() as cursor:
            cursor.execute(query_same_cat, [target_embedding, job_id, category_id, target_embedding, top_n])
            rows = cursor.fetchall()
            for row in rows:
                score = float(row[11])
                if score <= 0.0:
                    continue
                related_jobs.append({
                    'id': row[0],
                    'title': row[1],
                    'description': row[2] or '',
                    'requirements': row[3] or '',
                    'benefits': row[4] or '',
                    'slug': row[5],
                    'type': row[6],
                    'experience': row[7],
                    'level': row[8],
                    'salarymin': row[9],
                    'salarymax': row[10],
                    'similarity_score': score
                })
    except Exception as e:
        print(f"Error querying similar jobs in same category: {e}")

    # Step 3b: If not enough related jobs, fill from other categories
    if len(related_jobs) < top_n:
        try:
            exclude_ids = [r['id'] for r in related_jobs] + [job_id]
            remaining = top_n - len(related_jobs)
            
            # Format placeholders for SQL NOT IN
            placeholders = ', '.join(['%s'] * len(exclude_ids))
            query_other_cats = f"""
                SELECT 
                    j.id, j.title, j.description, j.requirements, j.benefits, 
                    j.slug, j.type, j.experience, j.level, j."salaryMin", j."salaryMax",
                    (1 - (je.embedding <=> %s::vector)) AS similarity_score
                FROM job_embeddings je
                JOIN jobs j ON je.job_id = j.id
                WHERE j.id NOT IN ({placeholders}) AND j."isVisible" = TRUE
                ORDER BY je.embedding <=> %s::vector
                LIMIT %s
            """
            params = [target_embedding] + exclude_ids + [target_embedding, remaining]
            
            with connection.cursor() as cursor:
                cursor.execute(query_other_cats, params)
                rows = cursor.fetchall()
                for row in rows:
                    score = float(row[11])
                    if score <= 0.0:
                        continue
                    related_jobs.append({
                        'id': row[0],
                        'title': row[1],
                        'description': row[2] or '',
                        'requirements': row[3] or '',
                        'benefits': row[4] or '',
                        'slug': row[5],
                        'type': row[6],
                        'experience': row[7],
                        'level': row[8],
                        'salarymin': row[9],
                        'salarymax': row[10],
                        'similarity_score': score
                    })
        except Exception as e:
            print(f"Error querying similar jobs from other categories: {e}")

    return related_jobs

