import torch
import math
import re

# Limit PyTorch CPU threads to avoid thread-pool memory overhead
try:
    torch.set_num_threads(1)
    torch.set_num_interop_threads(1)
except Exception:
    pass

# Try importing pyvi for Vietnamese word segmentation
try:
    from pyvi import ViTokenizer
    HAS_PYVI = True
except ImportError:
    HAS_PYVI = False

_model = None

def get_model():
    global _model
    if _model is None:
        from sentence_transformers import CrossEncoder
        print("[AI Cross-Encoder] Loading itdainb/PhoRanker model with max_length=384...")
        # Max length 384 gives optimal balance of accuracy, context window, and memory
        _model = CrossEncoder('itdainb/PhoRanker', max_length=384, device='cpu')
        print("[AI Cross-Encoder] Model itdainb/PhoRanker loaded successfully.")
    return _model

def calculate_match_score(cv_text: str, job_text: str) -> int:
    """
    Calculate similarity score (0 to 100) using PhoRanker Cross-Encoder AI Model
    with PyVi Vietnamese word segmentation, Sigmoid score calibration, and domain validation.
    """
    if not cv_text or not cv_text.strip() or len(cv_text.strip()) < 5 or not job_text or not job_text.strip():
        return 0

    try:
        cv_clean = cv_text.strip()
        cv_lower = cv_clean.lower()
        job_lower = job_text.lower()

        stopwords = {
            'và', 'của', 'có', 'cho', 'với', 'trong', 'được', 'các', 'những', 'bằng', 'là', 'đã', 
            'này', 'đến', 'theo', 'tại', 'về', 'tuyển', 'dụng', 'tóm', 'tắt', 'tiêu', 'đề', 'hồ', 
            'sơ', 'của', 'tôi', 'nguyện', 'vọng', 'tìm', 'việc', 'làm', 'ứng', 'tuyển', 'vị', 'trí',
            'kính', 'gửi', 'bộ', 'phận', 'công', 'ty', 'mong', 'muốn', 'xin', 'chào', 'thư', 'giới', 'thiệu'
        }
        
        cv_words = set(re.findall(r'\b\w+\b', cv_lower)) - stopwords
        job_words = set(re.findall(r'\b\w+\b', job_lower)) - stopwords

        # 1. STRICT SHORT CV INSPECTION (CV length < 250 characters)
        if len(cv_clean) < 250:
            matched_terms = cv_words.intersection(job_words)
            has_experience_section = any(k in cv_lower for k in ['kinh nghiệm', 'dự án', 'học vấn', 'thực tập'])
            
            # If short CV has NO domain term matches with the job AND no experience section -> Assign 0%
            if len(matched_terms) == 0 and not has_experience_section:
                print(f"[AI PhoRanker] Short CV ({len(cv_clean)} chars) has 0 matching domain terms. Score: 0%")
                return 0

        # 2. VIETNAMESE WORD SEGMENTATION (PhoBERT Tokenizer optimization)
        if HAS_PYVI:
            cv_formatted = ViTokenizer.tokenize(cv_clean)
            job_formatted = ViTokenizer.tokenize(job_text.strip())
        else:
            cv_formatted = cv_clean
            job_formatted = job_text.strip()

        # Expanded context window matching max_length=384
        cv_trunc = cv_formatted[:1800]
        job_trunc = job_formatted[:1200]

        print(f"[AI PhoRanker] Calculating match score using PhoRanker AI model...")
        model = get_model()

        with torch.inference_mode():
            raw_score = float(model.predict([(job_trunc, cv_trunc)])[0])

        # 3. SIGMOID CALIBRATION (Convert raw logit to probability [0.0, 1.0])
        prob = 1.0 / (1.0 + math.exp(-raw_score))
        score = int(round(prob * 100))

        # Scale short incomplete CVs lacking experience/projects
        if len(cv_clean) < 150 and "kinh nghiệm" not in cv_lower and "dự án" not in cv_lower:
            factor = max(0.10, len(cv_clean) / 350.0)
            score = int(round(score * factor))

        final_score = max(0, min(99, score))
        print(f"[AI PhoRanker] AI Model raw logit: {raw_score:.4f} -> Prob: {prob:.4f} -> Final score: {final_score}%")
        return final_score

    except Exception as e:
        print(f"[AI PhoRanker Error]: {e}")
        return 0

