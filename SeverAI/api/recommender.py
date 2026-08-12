from django.db import connection
from .models import Job

TECH_KEYWORDS = {'it', 'developer', 'dev', 'frontend', 'backend', 'fullstack', 'react', 'nextjs', 'node', 'python', 'lập trình', 'tester', 'qa', 'qc', 'devops', 'software', 'phần mềm', 'ux/ui', 'designer', 'thiết kế', 'nhập liệu'}

def get_related_jobs(job_id, top_n=4):
    """
    Intelligent AI Recommendation Engine (Content-Based Matching & Keyword Domain Similarity)
    """
    try:
        target_job = Job.objects.get(id=job_id)
        
        # Query active & visible candidate jobs
        candidates = Job.objects.filter(
            isvisible=True,
            status='ACTIVE'
        ).exclude(id=job_id)

        target_text = f"{target_job.title} {target_job.description or ''} {target_job.requirements or ''}".lower()
        target_words = set(target_text.split())

        scored_jobs = []
        for cand in candidates:
            cand_text = f"{cand.title} {cand.description or ''} {cand.requirements or ''}".lower()
            cand_words = set(cand_text.split())

            # 1. Title match boost
            title_score = 0
            target_title_words = set(target_job.title.lower().split())
            cand_title_words = set(cand.title.lower().split())
            title_overlap = len(target_title_words.intersection(cand_title_words))
            if title_overlap > 0:
                title_score += title_overlap * 3.0

            # 2. Category match boost
            cat_score = 2.0 if cand.categoryid == target_job.categoryid else 0.0

            # 3. Content word overlap (Jaccard similarity)
            intersection = len(target_words.intersection(cand_words))
            union = len(target_words.union(cand_words)) or 1
            content_similarity = (intersection / union) * 5.0

            total_score = title_score + cat_score + content_similarity

            scored_jobs.append((total_score, cand))

        # Sort by total AI score descending
        scored_jobs.sort(key=lambda x: x[0], reverse=True)

        results = [job for score, job in scored_jobs[:top_n]]

        return [{
            'id': j.id,
            'title': j.title,
            'slug': j.slug
        } for j in results]

    except Exception as e:
        print(f"Error in SeverAI intelligent recommender: {e}")
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
