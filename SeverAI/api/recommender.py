from django.db import connection
from .models import Job
from .embeddings import get_embedding, ensure_job_embeddings

TECH_KEYWORDS = {'it', 'developer', 'dev', 'frontend', 'backend', 'fullstack', 'react', 'nextjs', 'node', 'python', 'lập trình', 'tester', 'qa', 'qc', 'devops', 'software', 'phần mềm', 'ux/ui', 'designer', 'thiết kế', 'nhập liệu'}

def get_related_jobs(job_id, top_n=4):
    """
    Intelligent Recommendation Engine based strictly on JOB TITLE similarity across ALL categories.
    """
    try:
        target_job = Job.objects.get(id=job_id)
    except Job.DoesNotExist:
        return []
    except Exception as e:
        print(f"Error getting target job {job_id}: {e}")
        return []

    # 1. Check if target job vector embedding exists in DB
    target_embedding = None
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT embedding FROM job_embeddings WHERE job_id = %s", [job_id])
            row = cursor.fetchone()
            if row and row[0]:
                val = row[0]
                if isinstance(val, str):
                    import json
                    try:
                        target_embedding = json.loads(val)
                    except Exception:
                        target_embedding = val
                else:
                    target_embedding = val
    except Exception as e:
        print(f"Error fetching target job embedding from DB: {e}")

    # 2. Vector Similarity Search with Category Boost
    if target_embedding:
        category_id = getattr(target_job, 'categoryid', None) or getattr(target_job, 'categoryId', None)
        try:
            query = """
                SELECT 
                    j.id, j.title, j.slug,
                    ((1 - (je.embedding <=> %s::vector)) + (CASE WHEN j."categoryId" = %s THEN 0.35 ELSE 0.0 END)) AS total_score
                FROM job_embeddings je
                JOIN jobs j ON je.job_id = j.id
                WHERE j.id != %s 
                  AND j."isVisible" = TRUE 
                  AND j.status = 'ACTIVE' 
                  AND (j.deadline IS NULL OR j.deadline >= NOW()) 
                  AND j.id NOT LIKE 'jseed%%'
                ORDER BY total_score DESC
                LIMIT %s
            """
            with connection.cursor() as cursor:
                cursor.execute(query, [target_embedding, category_id or '', job_id, top_n])
                rows = cursor.fetchall()
                if rows:
                    return [{
                        'id': row[0],
                        'title': row[1],
                        'slug': row[2]
                    } for row in rows]
        except Exception as e:
            print(f"Error querying vector similarity: {e}")

    # 3. Pure Title-Based Similarity Matching (Jaccard + Word Overlap on Title ONLY)
    try:
        candidates = Job.objects.filter(
            isvisible=True,
            status='ACTIVE'
        ).exclude(id=job_id)

        target_title_lower = target_job.title.lower()
        # Clean special chars from title
        import re
        target_words = set(re.findall(r'\w+', target_title_lower))

        scored_jobs = []
        for cand in candidates:
            cand_title_lower = cand.title.lower()
            cand_words = set(re.findall(r'\w+', cand_title_lower))

            # Title word overlap & Jaccard similarity
            intersection = target_words.intersection(cand_words)
            union = target_words.union(cand_words) or set()

            if not union:
                continue

            jaccard = len(intersection) / len(union)
            overlap_count = len(intersection)

            # Score solely based on Title similarity
            score = (overlap_count * 3.0) + (jaccard * 5.0)

            scored_jobs.append((score, cand))

        # Sort by Title similarity score descending
        scored_jobs.sort(key=lambda x: x[0], reverse=True)

        return [{
            'id': j.id,
            'title': j.title,
            'slug': j.slug
        } for score, j in scored_jobs[:top_n]]

    except Exception as e:
        print(f"Title-based recommender error: {e}")
        return []



