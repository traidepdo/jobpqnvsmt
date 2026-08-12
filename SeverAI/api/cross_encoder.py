import math

# Lazy load model to avoid blocking Django server startup
_model = None

def get_model():
    global _model
    if _model is None:
        from sentence_transformers import CrossEncoder
        print("Loading Cross-Encoder model (itdainb/PhoRanker)...")
        # PhoRanker has a max sequence limit of 258. Setting max_length=256 avoids out of bounds errors.
        _model = CrossEncoder('itdainb/PhoRanker', max_length=256)
        print("Cross-Encoder model loaded successfully.")
    return _model

def calculate_match_score(cv_text: str, job_text: str) -> int:
    """
    Calculate the similarity score (0 to 100) between candidate CV text and Job description text
    using the local itdainb/PhoRanker CrossEncoder model trained for Vietnamese.
    """
    if not cv_text or not cv_text.strip() or not job_text or not job_text.strip():
        return 0

    # Truncate texts for local CPU speed and model limits
    cv_truncated = cv_text[:1200]
    job_truncated = job_text[:1000]
    
    print(f"[AI Cross-Encoder] Calculating match score. Truncated CV len: {len(cv_truncated)}, Job len: {len(job_truncated)}")
    
    try:
        model = get_model()
        # Predict returns logit or probability score.
        raw_score = float(model.predict([(job_truncated, cv_truncated)])[0])
        
        # If model outputs probability directly in [0, 1] range:
        if 0.0 <= raw_score <= 1.0:
            probability = raw_score
        else:
            # Map raw logits using standard sigmoid function
            probability = 1 / (1 + math.exp(-raw_score))
            
        score = int(round(probability * 100))
        final_score = max(0, min(100, score))
        print(f"[AI Cross-Encoder] Calculation successful. Raw score: {raw_score:.4f} -> Probability: {probability:.4f} -> Final score: {final_score}%")

        # Free memory immediately to fit in Render 512MB RAM
        global _model
        _model = None
        import gc
        gc.collect()

        return final_score
    except Exception as e:
        print(f"[AI Cross-Encoder] Error computing PhoRanker match score: {e}")
        return 0
