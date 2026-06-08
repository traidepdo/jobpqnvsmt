import math
from sentence_transformers import CrossEncoder

# Lazy load model to avoid blocking Django server startup
_model = None

def get_model():
    global _model
    if _model is None:
        print("Loading Cross-Encoder model (ms-marco-MiniLM-L-6-v2)...")
        # ms-marco-MiniLM-L-6-v2 is a standard and fast model for passage ranking/matching
        _model = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2', max_length=512)
        print("Cross-Encoder model loaded successfully.")
    return _model

def calculate_match_score(cv_text: str, job_text: str) -> int:
    """
    Calculate the similarity score (0 to 100) between candidate CV text and Job description text.
    Uses Cross-Encoder model. Raw logits are mapped using sigmoid function.
    """
    if not cv_text or not cv_text.strip() or not job_text or not job_text.strip():
        return 0

    try:
        model = get_model()
        # Predict returns logit. ms-marco outputs raw matching scores (higher is better).
        # We pass it as a pair: (query, passage) -> (job_text, cv_text)
        raw_score = float(model.predict([(job_text, cv_text)])[0])
        
        # Calibrated Sigmoid for ms-marco-MiniLM-L-6-v2:
        # Since this model outputs raw logits that are shifted negative (approx -11.0 for unrelated to -2.0 for highly related),
        # we shift by +6.5 and scale by 1.5 to normalize the probability distribution.
        probability = 1 / (1 + math.exp(-((raw_score + 6.5) / 1.5)))
        
        # Convert to percentage
        score = int(round(probability * 100))
        return max(0, min(100, score))
    except Exception as e:
        print(f"Error computing cross-encoder score: {e}")
        return 0
