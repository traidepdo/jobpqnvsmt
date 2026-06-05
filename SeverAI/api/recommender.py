import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from .models import Job

def get_related_jobs(job_id, top_n=5):
    """
    Get top_n related jobs for a given job_id using TF-IDF and Cosine Similarity.
    """
    # 1. Fetch all visible/active jobs from DB
    # We can fetch status='ACTIVE' if applicable, or all visible ones
    jobs_qs = Job.objects.filter(isvisible=True)
    
    if not jobs_qs.exists():
        return []

    # Convert QuerySet to list of dictionaries
    jobs_data = []
    target_job = None
    
    for job in jobs_qs:
        job_info = {
            'id': job.id,
            'title': job.title,
            'description': job.description or '',
            'requirements': job.requirements or '',
            'benefits': job.benefits or '',
            'slug': job.slug,
            'type': job.type,
            'experience': job.experience,
            'level': job.level,
            'salarymin': job.salarymin,
            'salarymax': job.salarymax,
        }
        jobs_data.append(job_info)
        if job.id == job_id:
            target_job = job_info

    # If target job is not in the visible list (e.g. private/pending but we still want recommendations for it)
    if not target_job:
        try:
            db_job = Job.objects.get(id=job_id)
            target_job = {
                'id': db_job.id,
                'title': db_job.title,
                'description': db_job.description or '',
                'requirements': db_job.requirements or '',
                'benefits': db_job.benefits or '',
                'slug': db_job.slug,
                'type': db_job.type,
                'experience': db_job.experience,
                'level': db_job.level,
                'salarymin': db_job.salarymin,
                'salarymax': db_job.salarymax,
            }
            jobs_data.append(target_job)
        except Job.DoesNotExist:
            return []

    # Create a DataFrame
    df = pd.DataFrame(jobs_data)
    
    # 2. Combine text features
    # Fill NaN just in case
    df['combined_text'] = (
        df['title'].fillna('') + ' ' + 
        df['description'].fillna('') + ' ' + 
        df['requirements'].fillna('') + ' ' + 
        df['benefits'].fillna('')
    )
    
    # 3. Vectorize text with TF-IDF
    vectorizer = TfidfVectorizer(token_pattern=r'(?u)\b\w+\b') # Support Vietnamese words with spaces/chars
    tfidf_matrix = vectorizer.fit_transform(df['combined_text'])
    
    # 4. Find index of the target job
    target_idx = df[df['id'] == job_id].index[0]
    
    # 5. Compute cosine similarity between target job and all jobs
    cosine_sim = cosine_similarity(tfidf_matrix[target_idx], tfidf_matrix).flatten()
    
    # 6. Get top_n matching jobs (excluding the target job itself)
    # Argsort sorts ascending, so we reverse it
    similar_indices = cosine_sim.argsort()[::-1]
    
    related_jobs = []
    for idx in similar_indices:
        if df.iloc[idx]['id'] == job_id:
            continue
        
        score = float(cosine_sim[idx])
        # Only return jobs with a positive similarity score (non-zero similarity)
        if score <= 0.0:
            continue
            
        job_item = df.iloc[idx].to_dict()
        job_item['similarity_score'] = score
        # Remove the helper combined text key
        job_item.pop('combined_text', None)
        related_jobs.append(job_item)
        
        if len(related_jobs) >= top_n:
            break
            
    return related_jobs
