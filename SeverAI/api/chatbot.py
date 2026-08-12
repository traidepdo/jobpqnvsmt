import json
import requests
import pandas as pd
from pypdf import PdfReader
from io import BytesIO
from django.conf import settings
from django.db import connection
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

from .embeddings import get_embedding, ensure_job_embeddings

def get_gemini_recommendations(cv_text, top_n=3):
    """
    Analyze CV using pgvector pre-filtering, then select matches and generate custom reasons via Gemini.
    """
    if not cv_text:
        return {"error": "Không trích xuất được thông tin từ CV."}

    # 1. Ensure all jobs have embeddings
    try:
        ensure_job_embeddings()
    except Exception as e:
        print(f"Error ensuring job embeddings: {e}")

    # 2. Embed the CV text
    cv_vector = get_embedding(cv_text)

    # 3. Query Top 12 similar jobs from DB using pgvector
    candidate_jobs = []
    try:
        query = """
            SELECT 
                j.id, j.title, j.description, j.requirements, j.benefits, 
                j.slug, j.type, j."salaryMin", j."salaryMax",
                (1 - (je.embedding <=> %s::vector)) AS similarity_score
            FROM job_embeddings je
            JOIN jobs j ON je.job_id = j.id
            WHERE j."isVisible" = TRUE AND j.status = 'ACTIVE' AND (j.deadline IS NULL OR j.deadline >= NOW())
            ORDER BY je.embedding <=> %s::vector
            LIMIT 12
        """
        with connection.cursor() as cursor:
            cursor.execute(query, [cv_vector, cv_vector])
            rows = cursor.fetchall()
            
            for row in rows:
                score = float(row[9])
                candidate_jobs.append({
                    'id': row[0],
                    'title': row[1],
                    'description': row[2] or '',
                    'requirements': row[3] or '',
                    'benefits': row[4] or '',
                    'slug': row[5],
                    'type': row[6],
                    'salarymin': row[7],
                    'salarymax': row[8],
                    'similarity_score': score
                })
    except Exception as e:
        print(f"Error matching CV with jobs in DB: {e}")

    # If no active jobs found or no candidates
    if not candidate_jobs:
        return {"recommended_jobs": [], "message": "Không tìm thấy công việc nào phù hợp."}

    # 4. Format the prompt for Gemini
    api_key = getattr(settings, 'GEMINI_API_KEY', '')
    if not api_key:
        # Fallback if no API key is configured: return the top recommendations directly
        fallback_recs = []
        for j in candidate_jobs[:top_n]:
            fallback_recs.append({
                "id": j['id'],
                "reason": "Gợi ý tự động dựa trên mức độ tương đồng ngữ nghĩa giữa hồ sơ và tin tuyển dụng."
            })
        return {
            "recommended_jobs": fallback_recs,
            "message": "Chào bạn! Đây là các công việc phù hợp được hệ thống tìm thấy dựa trên hồ sơ của bạn (sử dụng so khớp vector):"
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

    # 5. Call Gemini API
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
    headers = {"Content-Type": "application/json"}
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "responseMimeType": "application/json"
        }
    }

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=60)
        if response.ok:
            resp_data = response.json()
            if 'candidates' in resp_data and resp_data['candidates']:
                candidate = resp_data['candidates'][0]
                if 'content' in candidate and 'parts' in candidate['content'] and candidate['content']['parts']:
                    raw_text = candidate['content']['parts'][0]['text']
                    try:
                        parsed_result = json.loads(raw_text)
                        return parsed_result
                    except Exception as json_err:
                        print(f"JSON parsing error: {json_err}")
                        with open("gemini_error.log", "w", encoding="utf-8") as f:
                            f.write(f"JSON error: {json_err}\nRaw text: {raw_text}")
                else:
                    with open("gemini_error.log", "w", encoding="utf-8") as f:
                        f.write(f"No content inside candidate. Response: {resp_data}")
            else:
                with open("gemini_error.log", "w", encoding="utf-8") as f:
                    f.write(f"No candidates key in response. Response: {resp_data}")
        else:
            print(f"Gemini API returned error: {response.status_code} - {response.text}")
            with open("gemini_error.log", "w", encoding="utf-8") as f:
                f.write(f"API error: {response.status_code}\nResponse: {response.text}")
    except Exception as e:
        print(f"Error calling Gemini API: {e}")
        with open("gemini_error.log", "w", encoding="utf-8") as f:
            f.write(f"Exception: {e}")

    # Fallback in case of API error
    fallback_recs = []
    for j in candidate_jobs[:top_n]:
        fallback_recs.append({
            "id": j['id'],
            "reason": "Đề xuất dựa trên mức độ phù hợp kỹ năng ngữ nghĩa giữa CV và mô tả công việc."
        })
    return {
        "recommended_jobs": fallback_recs,
        "message": "Đã xảy ra sự cố khi kết nối với AI. Dưới đây là các vị trí được khớp tự động dựa trên hồ sơ của bạn:"
    }

def get_general_chat_response(message, history=None):
    """
    Generate a direct response from Gemini based on user's message and chat history.
    """
    api_key = getattr(settings, 'GEMINI_API_KEY', '')
    if not api_key:
        return {"response": "Xin lỗi, hệ thống AI hiện chưa được cấu hình khóa API (API Key)."}

    # Format history and user prompt
    contents = []
    if history:
        for turn in history:
            role = "user" if turn.get("sender") == "user" else "model"
            # Ensure text is not empty
            text = turn.get("text", "")
            if text:
                contents.append({
                    "role": role,
                    "parts": [{"text": text}]
                })
    
    # Append the new user message
    contents.append({
        "role": "user",
        "parts": [{"text": message}]
    })

    # System instruction or prefix context to guide the model to act as a career helper
    system_instruction = (
        "Bạn là một trợ lý tư vấn tuyển dụng và hỗ trợ việc làm thông minh, thân thiện. "
        "Hãy trả lời các câu hỏi của ứng viên liên quan đến công việc, CV, kinh nghiệm, kỹ năng, định hướng nghề nghiệp, hoặc hỗ trợ sử dụng website tuyển dụng này. "
        "Xưng hô thân mật là 'bạn' và 'tôi' hoặc 'mình'. Hãy trả lời ngắn gọn, súc tích và có cấu trúc rõ ràng."
    )

    payload = {
        "contents": contents,
        "systemInstruction": {
            "parts": [{"text": system_instruction}]
        }
    }

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
    headers = {"Content-Type": "application/json"}

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=60)
        if response.ok:
            resp_data = response.json()
            raw_text = resp_data['candidates'][0]['content']['parts'][0]['text']
            return {"response": raw_text}
        else:
            print(f"Gemini API returned error: {response.status_code} - {response.text}")
            return {"response": "Hệ thống AI đang quá tải hoặc gặp sự cố tạm thời. Xin vui lòng thử lại sau ít phút!"}
    except Exception as e:
        print(f"Error calling Gemini API: {e}")
        return {"response": "Không thể kết nối với hệ thống AI. Vui lòng kiểm tra lại kết nối mạng."}

