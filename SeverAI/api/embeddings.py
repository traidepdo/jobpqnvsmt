import os
from sentence_transformers import SentenceTransformer
from django.db import connection
from .models import Job

_model = None

def get_embedding_model():
    global _model
    if _model is None:
        print("Loading SentenceTransformer model (keepitreal/vietnamese-sbert)...")
        # dựa trên encoder layer của bert 
        _model = SentenceTransformer('keepitreal/vietnamese-sbert')
        print("SentenceTransformer model loaded successfully.")
    return _model

def get_embedding(text: str):
    if not text or not text.strip():
        return [0.0] * 768
    model = get_embedding_model()
    # Normalize whitespace
    clean_text = " ".join(text.split())
    embedding = model.encode(clean_text)
    return embedding.tolist()

def ensure_job_embeddings():
    """
    Ensure all active/visible jobs have precomputed vector embeddings stored in the DB.
    Finds jobs in `jobs` table that do not exist in `job_embeddings` and populates them.
    """
    # 1. Get all job IDs that already have embeddings
    with connection.cursor() as cursor:
        cursor.execute("SELECT job_id FROM job_embeddings")
        existing_ids = {row[0] for row in cursor.fetchall()}

    # 2. Get all visible jobs
    jobs = Job.objects.filter(isvisible=True)
    jobs_to_embed = [job for job in jobs if job.id not in existing_ids]

    if not jobs_to_embed:
        return

    print(f"Found {len(jobs_to_embed)} jobs without embeddings. Generating embeddings...")
    
    # 3. Batch generate and insert
    # To avoid loading model if not needed, we only load it here
    model = get_embedding_model()
    
    for job in jobs_to_embed:
        combined_text = f"Tiêu đề: {job.title}\nMô tả: {job.description or ''}\nYêu cầu: {job.requirements or ''}\nQuyền lợi: {job.benefits or ''}"
        vector = get_embedding(combined_text)
        
        with connection.cursor() as cursor:
            cursor.execute(
                "INSERT INTO job_embeddings (job_id, embedding) VALUES (%s, %s::vector) ON CONFLICT (job_id) DO UPDATE SET embedding = EXCLUDED.embedding",
                [job.id, vector]
            )
    print(f"Successfully populated {len(jobs_to_embed)} job embeddings.")
