import json
import requests
import numpy as np
import pandas as pd
from pypdf import PdfReader
from io import BytesIO
from django.conf import settings
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from .models import Job, Resume

def extract_text_from_pdf(file_bytes):
    """
    Extract text content from uploaded PDF bytes.
    """
    try:
        reader = PdfReader(BytesIO(file_bytes))
        text = ""
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
        return text.strip()
    except Exception as e:
        print(f"Error reading PDF: {e}")
        return ""

def parse_db_resume(resume_id):
    """
    Fetch a resume from the database and compile its content into a rich text format.
    """
    try:
        resume = Resume.objects.get(id=resume_id)
        parts = []
        if resume.title:
            parts.append(f"Mục tiêu nghề nghiệp / Tiêu đề: {resume.title}")
        if resume.summary:
            parts.append(f"Tóm tắt bản thân: {resume.summary}")
        if resume.degree:
            parts.append(f"Bằng cấp: {resume.degree}")
        if resume.languages:
            parts.append(f"Ngoại ngữ: {resume.languages}")
            
        # Parse experience (usually JSON array of dicts)
        if resume.experience:
            parts.append("\nKinh nghiệm làm việc:")
            for exp in resume.experience:
                company = exp.get('company', '')
                position = exp.get('position', '')
                desc = exp.get('description', '')
                start = exp.get('startYear', '')
                end = exp.get('endYear', '')
                parts.append(f"- {position} tại {company} ({start} - {end}): {desc}")
                
        # Parse education
        if resume.education:
            parts.append("\nHọc vấn:")
            for edu in resume.education:
                school = edu.get('school', '')
                degree = edu.get('degree', '')
                field = edu.get('field', '')
                parts.append(f"- Trường {school}, Bằng {degree} ngành {field}")
                
        # Parse projects
        if resume.projects:
            parts.append("\nDự án:")
            for proj in resume.projects:
                name = proj.get('name', '')
                pos = proj.get('position', '')
                desc = proj.get('description', '')
                parts.append(f"- Dự án {name} (Vai trò: {pos}): {desc}")
                
        return "\n".join(parts)
    except Resume.DoesNotExist:
        return ""

def get_gemini_recommendations(cv_text, top_n=3):
    """
    Analyze CV using TF-IDF pre-filtering, then select matches and generate custom reasons via Gemini.
    """
    if not cv_text:
        return {"error": "Không trích xuất được thông tin từ CV."}

    # 1. Fetch active jobs
    jobs_qs = Job.objects.filter(isvisible=True)
    if not jobs_qs.exists():
        return {"recommended_jobs": [], "message": "Không tìm thấy công việc nào hoạt động trên hệ thống hiện tại."}

    jobs_data = []
    for job in jobs_qs:
        jobs_data.append({
            'id': job.id,
            'title': job.title,
            'description': job.description or '',
            'requirements': job.requirements or '',
            'benefits': job.benefits or '',
            'slug': job.slug,
            'type': job.type,
            'salarymin': job.salarymin,
            'salarymax': job.salarymax,
        })

    df = pd.DataFrame(jobs_data)
    df['combined_text'] = (
        df['title'].fillna('') + ' ' + 
        df['description'].fillna('') + ' ' + 
        df['requirements'].fillna('') + ' ' + 
        df['benefits'].fillna('')
    )

    # 2. Add CV text as the last row to calculate similarity
    cv_row_idx = len(df)
    df.loc[cv_row_idx] = {
        'id': 'CV_USER',
        'title': '', 'description': '', 'requirements': '', 'benefits': '',
        'slug': '', 'type': '', 'salarymin': 0, 'salarymax': 0,
        'combined_text': cv_text
    }

    # TF-IDF
    vectorizer = TfidfVectorizer(token_pattern=r'(?u)\b\w+\b')
    tfidf_matrix = vectorizer.fit_transform(df['combined_text'])
    
    # Calculate cosine similarity with the CV
    cosine_sim = cosine_similarity(tfidf_matrix[cv_row_idx], tfidf_matrix).flatten()
    
    # Sort and take top 10 (excluding the CV itself)
    # The last element is the CV, so we exclude index `cv_row_idx`
    similar_indices = cosine_sim[:-1].argsort()[::-1]
    
    candidate_jobs = []
    for idx in similar_indices:
        score = float(cosine_sim[idx])
        job_item = df.iloc[idx].to_dict()
        job_item.pop('combined_text', None)
        job_item['similarity_score'] = score
        candidate_jobs.append(job_item)
        if len(candidate_jobs) >= 12: # Check top 12 jobs
            break

    # If no active jobs found or no candidates
    if not candidate_jobs:
        return {"recommended_jobs": [], "message": "Không tìm thấy công việc nào phù hợp."}

    # 3. Format the prompt for Gemini
    api_key = getattr(settings, 'GEMINI_API_KEY', '')
    if not api_key:
        # Fallback if no API key is configured: return the TF-IDF recommendations directly
        fallback_recs = []
        for j in candidate_jobs[:top_n]:
            fallback_recs.append({
                "id": j['id'],
                "reason": "Gợi ý tự động dựa trên mức độ trùng lặp từ khóa trong hồ sơ của bạn."
            })
        return {
            "recommended_jobs": fallback_recs,
            "message": "Chào bạn! Đây là các công việc phù hợp được hệ thống tìm thấy dựa trên hồ sơ của bạn (sử dụng đối khớp từ khóa):"
        }

    # Format candidate list for the prompt
    candidates_str = ""
    for idx, j in enumerate(candidate_jobs):
        candidates_str += f"\n--- JOB #{idx+1} ---\nID: {j['id']}\nTiêu đề: {j['title']}\nMô tả: {j['description'][:300]}...\nYêu cầu: {j['requirements'][:300]}...\n"

    prompt = f"""
Bạn là trợ lý tư vấn tuyển dụng AI thông minh. Dưới đây là thông tin CV của ứng viên và danh sách các công việc hiện có trong database của chúng tôi.

[CV của ứng viên]
{cv_text}

[Danh sách công việc có sẵn]
{candidates_str}

Nhiệm vụ của bạn:
1. Phân tích kỹ lưỡng CV của ứng viên (kỹ năng, kinh nghiệm, học vấn).
2. So sánh và lựa chọn ra tối đa 3 công việc phù hợp nhất từ danh sách trên.
3. Với mỗi công việc được chọn, viết một lý do ngắn gọn và thuyết phục giải thích tại sao công việc này phù hợp với họ (viết bằng tiếng Việt, xưng hô thân mật là "bạn").
4. Viết một lời chào mở đầu thân thiện giải thích tổng quan về kết quả phân tích.

Trả về kết quả ở định dạng JSON chính xác theo cấu trúc sau:
{{
  "recommended_jobs": [
    {{
      "id": "ID_CỦA_JOB",
      "reason": "Lý do công việc này phù hợp với bạn..."
    }}
  ],
  "message": "Lời chào mở đầu thân thiện gửi ứng viên..."
}}
"""

    # 4. Call Gemini API
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}"
    headers = {"Content-Type": "application/json"}
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "responseMimeType": "application/json"
        }
    }

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=20)
        if response.ok:
            resp_data = response.json()
            # Extract JSON from Gemini response
            raw_text = resp_data['candidates'][0]['content']['parts'][0]['text']
            parsed_result = json.loads(raw_text)
            return parsed_result
        else:
            print(f"Gemini API returned error: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"Error calling Gemini API: {e}")

    # Fallback in case of API error
    fallback_recs = []
    for j in candidate_jobs[:top_n]:
        fallback_recs.append({
            "id": j['id'],
            "reason": "Đề xuất dựa trên mức độ phù hợp từ khóa kỹ năng giữa CV và mô tả công việc."
        })
    return {
        "recommended_jobs": fallback_recs,
        "message": "Đã xảy ra sự cố khi kết nối với AI. Dưới đây là các vị trí được khớp tự động dựa trên hồ sơ của bạn:"
    }
