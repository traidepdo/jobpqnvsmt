from django.db import connection
from .models import Job
from .embeddings import get_embedding, ensure_job_embeddings

def get_related_jobs(job_id, top_n=5):
    """
    Get top_n related jobs for a given job_id using pgvector cosine similarity.
    """
    # 1. Ensure all visible jobs are embedded in the database
    try:
        ensure_job_embeddings()
    except Exception as e:
        print(f"Error ensuring job embeddings: {e}")

    # 2. Get the target job's embedding. If not exists, create it.
    target_embedding = None
    with connection.cursor() as cursor:
        cursor.execute("SELECT embedding FROM job_embeddings WHERE job_id = %s", [job_id])
        row = cursor.fetchone()
        if row:
            # pgvector returns embedding as string or list depending on connection/driver.
            # In raw postgres queries, it usually comes as string like '[0.123,0.456,...]'
            val = row[0]
            if isinstance(val, str):
                target_embedding = [float(x) for x in val.strip('[]').split(',')]
            else:
                target_embedding = val

    if not target_embedding:
        try:
            job = Job.objects.get(id=job_id)
            combined_text = f"Tiêu đề: {job.title}\nMô tả: {job.description or ''}\nYêu cầu: {job.requirements or ''}\nQuyền lợi: {job.benefits or ''}"
            target_embedding = get_embedding(combined_text)
            
            with connection.cursor() as cursor:
                cursor.execute(
                    "INSERT INTO job_embeddings (job_id, embedding) VALUES (%s, %s::vector) ON CONFLICT (job_id) DO UPDATE SET embedding = EXCLUDED.embedding",
                    [job_id, target_embedding]
                )
        except Job.DoesNotExist:
            return []
        except Exception as e:
            print(f"Error generating target embedding: {e}")
            return []

    # 3. Query similar jobs using pgvector operator (<=> is Cosine Distance)
    # Cosine Similarity = 1 - Cosine Distance
    # Only fetch visible jobs
    related_jobs = []
    try:
        query = """
            SELECT 
                j.id, j.title, j.description, j.requirements, j.benefits, 
                j.slug, j.type, j.experience, j.level, j."salaryMin", j."salaryMax",
                (1 - (je.embedding <=> %s::vector)) AS similarity_score
            FROM job_embeddings je
            JOIN jobs j ON je.job_id = j.id
            WHERE j.id != %s AND j."isVisible" = TRUE
            ORDER BY je.embedding <=> %s::vector
            LIMIT %s
        """
        with connection.cursor() as cursor:
            cursor.execute(query, [target_embedding, job_id, target_embedding, top_n])
            rows = cursor.fetchall()
            
            for row in rows:
                score = float(row[11])
                # Only return jobs with positive similarity
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
        print(f"Error querying similar jobs from DB: {e}")
        
    return related_jobs

