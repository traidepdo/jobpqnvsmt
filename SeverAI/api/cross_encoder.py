import math
import re

_model = None

def get_model():
    global _model
    if _model is None:
        from sentence_transformers import CrossEncoder
        print("[AI Cross-Encoder] Loading itdainb/PhoRanker model...")
        # Max length 160 to optimize speed and CPU memory on Render
        _model = CrossEncoder('itdainb/PhoRanker', max_length=160, device='cpu')
        print("[AI Cross-Encoder] Model itdainb/PhoRanker loaded successfully.")
    return _model

TECH_KEYWORDS = {
    'python', 'javascript', 'typescript', 'react', 'nextjs', 'node', 'nodejs', 'vue',
    'angular', 'html', 'css', 'tailwind', 'bootstrap', 'php', 'laravel', 'java',
    'spring', 'sql', 'postgres', 'postgresql', 'mysql', 'mongodb', 'docker', 'git',
    'rest', 'api', 'frontend', 'backend', 'fullstack', 'devops', 'ui', 'ux', 'designer',
    'thiết kế', 'nhập liệu', 'bán hàng', 'thu ngân', 'phục vụ', 'lễ tân', 'quản lý',
    'marketing', 'seo', 'kế toán', 'nhân sự', 'hr', 'kiểm thử', 'tester', 'qa', 'qc'
}

def calculate_fallback_score(cv_text: str, job_text: str) -> int:
    try:
        cv_clean = re.sub(r'[^\w\s]', ' ', cv_text.lower())
        job_clean = re.sub(r'[^\w\s]', ' ', job_text.lower())
        cv_words = set(cv_clean.split())
        job_words = set(job_clean.split())
        stopwords = {'và', 'của', 'có', 'cho', 'với', 'trong', 'được', 'các', 'những', 'bằng', 'là', 'đã', 'này', 'đến', 'theo', 'tại', 'về'}
        cv_filtered = {w for w in cv_words if len(w) > 1 and w not in stopwords}
        job_filtered = {w for w in job_words if len(w) > 1 and w not in stopwords}

        intersection = len(cv_filtered.intersection(job_filtered))
        union = len(cv_filtered.union(job_filtered)) or 1
        jaccard_score = (intersection / union) * 100
        target_match_ratio = (intersection / max(len(job_filtered), 1)) * 100

        job_tech = job_filtered.intersection(TECH_KEYWORDS)
        cv_tech = cv_filtered.intersection(TECH_KEYWORDS)
        tech_boost = 0
        if job_tech:
            matched_tech = len(cv_tech.intersection(job_tech))
            tech_boost = (matched_tech / len(job_tech)) * 35

        raw_score = (jaccard_score * 0.25) + (target_match_ratio * 0.45) + tech_boost + 25
        return max(20, min(96, int(round(raw_score))))
    except Exception:
        return 65

def calculate_match_score(cv_text: str, job_text: str) -> int:
    """
    Calculate the similarity score (0 to 100) using itdainb/PhoRanker Cross-Encoder model.
    Falls back gracefully to keyword matching if memory limit is exceeded.
    """
    if not cv_text or not cv_text.strip() or not job_text or not job_text.strip():
        return 50

    try:
        import torch
        cv_trunc = cv_text[:800]
        job_trunc = job_text[:600]

        print(f"[AI PhoRanker] Calculating match score between CV and Job description...")
        model = get_model()

        with torch.no_grad():
            raw_score = float(model.predict([(job_trunc, cv_trunc)])[0])

        if 0.0 <= raw_score <= 1.0:
            probability = raw_score
        else:
            probability = 1 / (1 + math.exp(-raw_score))

        score = int(round(probability * 100))
        final_score = max(10, min(99, score))
        print(f"[AI PhoRanker] Success: raw={raw_score:.4f} -> prob={probability:.4f} -> final score={final_score}%")
        return final_score

    except Exception as e:
        print(f"[AI PhoRanker Warning/Error]: {e}. Using fallback keyword matcher.")
        return calculate_fallback_score(cv_text, job_text)
