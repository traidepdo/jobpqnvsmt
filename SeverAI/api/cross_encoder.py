import re

TECH_KEYWORDS = {
    'python', 'javascript', 'typescript', 'react', 'nextjs', 'node', 'nodejs', 'vue',
    'angular', 'html', 'css', 'tailwind', 'bootstrap', 'php', 'laravel', 'java',
    'spring', 'sql', 'postgres', 'postgresql', 'mysql', 'mongodb', 'docker', 'git',
    'rest', 'api', 'frontend', 'backend', 'fullstack', 'devops', 'ui', 'ux', 'designer',
    'thiết kế', 'nhập liệu', 'bán hàng', 'thu ngân', 'phục vụ', 'lễ tân', 'quản lý',
    'marketing', 'seo', 'kế toán', 'nhân sự', 'hr', 'kiểm thử', 'tester', 'qa', 'qc'
}

def calculate_match_score(cv_text: str, job_text: str) -> int:
    """
    Fast, reliable & OOM-safe similarity score matching (0 to 100)
    combining Jaccard Word Similarity, Domain Keyword Matching, and Content Overlap.
    Avoids loading heavy PyTorch models to guarantee zero OOM crashes under Render 512MB RAM.
    """
    if not cv_text or not cv_text.strip() or not job_text or not job_text.strip():
        return 50

    try:
        # Clean and tokenize text
        cv_clean = re.sub(r'[^\w\s]', ' ', cv_text.lower())
        job_clean = re.sub(r'[^\w\s]', ' ', job_text.lower())

        cv_words = set(cv_clean.split())
        job_words = set(job_clean.split())

        if not job_words:
            return 50

        # Remove common Vietnamese stop words
        stopwords = {'và', 'của', 'có', 'cho', 'với', 'trong', 'được', 'các', 'những', 'bằng', 'là', 'đã', 'này', 'đến', 'theo', 'tại', 'về'}
        cv_words_filtered = {w for w in cv_words if len(w) > 1 and w not in stopwords}
        job_words_filtered = {w for w in job_words if len(w) > 1 and w not in stopwords}

        # 1. Jaccard Similarity (Word Overlap)
        intersection = len(cv_words_filtered.intersection(job_words_filtered))
        union = len(cv_words_filtered.union(job_words_filtered)) or 1
        jaccard_score = (intersection / union) * 100

        # 2. Target Job Requirement Overlap
        target_match_ratio = (intersection / max(len(job_words_filtered), 1)) * 100

        # 3. Domain Keyword Boost
        job_tech = job_words_filtered.intersection(TECH_KEYWORDS)
        cv_tech = cv_words_filtered.intersection(TECH_KEYWORDS)
        
        tech_boost = 0
        if job_tech:
            matched_tech = len(cv_tech.intersection(job_tech))
            tech_ratio = matched_tech / len(job_tech)
            tech_boost = tech_ratio * 35

        # 4. Composite Score
        raw_score = (jaccard_score * 0.25) + (target_match_ratio * 0.45) + tech_boost + 25
        final_score = int(round(raw_score))
        return max(20, min(96, final_score))

    except Exception as e:
        print(f"[AI Cross-Encoder Error]: {e}")
        return 60
