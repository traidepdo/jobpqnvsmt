from django.db import connection
from .models import Job
from .embeddings import get_embedding

TECH_KEYWORDS = {'it', 'developer', 'dev', 'frontend', 'backend', 'fullstack', 'react', 'nextjs', 'node', 'python', 'lập trình', 'tester', 'qa', 'qc', 'devops', 'software', 'phần mềm', 'ux/ui', 'designer', 'thiết kế', 'nhập liệu'}

def get_related_jobs(job_id, top_n=5):
    """
    Get top_n related jobs for a given job_id using pgvector cosine similarity.
    Prioritizes active non-seed jobs in the same category first, then falls back to other categories with keyword domain matching.
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
            if isinstance(val, str):
                target_embedding = val
            elif isinstance(val, list):
                target_embedding = '[' + ','.join(map(str, val)) + ']'
            else:
                target_embedding = str(val)

    # Nếu không có embedding thì tạo mới
    if not target_embedding:
        try:
            combined_text = f"Tiêu đề: {job.title}\nVị trí: {job.title}\nMô tả: {job.description or ''}\nYêu cầu: {job.requirements or ''}\nQuyền lợi: {job.benefits or ''}"
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

    related_jobs = []
    seen_ids = {job_id}

    # Extract target title keywords
    target_title_lower = job.title.lower()
    target_words = set(target_title_lower.split())
    target_tech = target_words.intersection(TECH_KEYWORDS)

    # Step 3a: Query similar jobs in the SAME category first (filtering out corrupted seed data)
    try:
        query_same_cat = """
            SELECT 
                j.id, j.title, j.description, j.requirements, j.benefits, 
                j.slug, j.type, j.experience, j.level, j."salaryMin", j."salaryMax",
                (1 - (je.embedding <=> %s::vector)) AS similarity_score
            FROM job_embeddings je
            JOIN jobs j ON je.job_id = j.id
            WHERE j.id != %s 
              AND j."isVisible" = TRUE 
              AND j.status = 'ACTIVE' 
              AND (j.deadline IS NULL OR j.deadline >= NOW()) 
              AND j."categoryId" = %s
              AND j.id NOT LIKE 'jseed%%'
              AND (j.description IS NULL OR j.description NOT LIKE '%%Thì nhưng một khiến%%')
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
                seen_ids.add(row[0])
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
                    'similarity_score': round(score, 4)
                })
    except Exception as e:
        print(f"Error querying similar jobs in same category: {e}")

    # Step 3b: If not enough related jobs, fill from other categories using vector similarity + keyword domain matching
    if len(related_jobs) < top_n:
        try:
            remaining = top_n - len(related_jobs)
            placeholders = ', '.join(['%s'] * len(seen_ids))
            query_other_cats = f"""
                SELECT 
                    j.id, j.title, j.description, j.requirements, j.benefits, 
                    j.slug, j.type, j.experience, j.level, j."salaryMin", j."salaryMax",
                    (1 - (je.embedding <=> %s::vector)) AS similarity_score
                FROM job_embeddings je
                JOIN jobs j ON je.job_id = j.id
                WHERE j.id NOT IN ({placeholders}) 
                  AND j."isVisible" = TRUE 
                  AND j.status = 'ACTIVE' 
                  AND (j.deadline IS NULL OR j.deadline >= NOW())
                  AND j.id NOT LIKE 'jseed%%'
                  AND (j.description IS NULL OR j.description NOT LIKE '%%Thì nhưng một khiến%%')
                ORDER BY je.embedding <=> %s::vector
                LIMIT %s
            """
            params = [target_embedding] + list(seen_ids) + [target_embedding, 50]
            
            with connection.cursor() as cursor:
                cursor.execute(query_other_cats, params)
                rows = cursor.fetchall()
                
                scored_others = []
                for row in rows:
                    raw_score = float(row[11])
                    if raw_score <= 0.0:
                        continue
                    
                    other_title_lower = row[1].lower()
                    other_words = set(other_title_lower.split())
                    
                    # Word overlap
                    overlap = len(target_words.intersection(other_words))
                    
                    # Domain keyword match
                    other_tech = other_words.intersection(TECH_KEYWORDS)
                    tech_match = len(target_tech.intersection(other_tech)) > 0
                    
                    if target_tech and not other_tech:
                        boost = -0.30
                    elif tech_match:
                        boost = 0.25 + (overlap * 0.10)
                    else:
                        boost = overlap * 0.10
                        
                    final_score = raw_score + boost
                    scored_others.append((final_score, row))

                scored_others.sort(key=lambda x: x[0], reverse=True)
                for final_score, row in scored_others[:remaining]:
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
                        'similarity_score': round(final_score, 4)
                    })
        except Exception as e:
            print(f"Error querying similar jobs from other categories: {e}")

    return related_jobs
