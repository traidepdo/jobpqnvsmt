import json
from django.http import JsonResponse
from django.views.decorators.http import require_GET
from django.views.decorators.csrf import csrf_exempt
from .recommender import get_related_jobs
from .chatbot import extract_text_from_pdf, parse_db_resume, get_gemini_recommendations

@require_GET
def recommend_jobs_api(request, job_id):
    """
    API endpoint: GET /api/jobs/<job_id>/recommend/
    Returns top N related jobs based on TF-IDF.
    """
    limit = request.GET.get('limit', 4) # Default to 4 related jobs
    try:
        limit = int(limit)
    except ValueError:
        limit = 4
        
    related_jobs = get_related_jobs(job_id, top_n=limit)
    return JsonResponse({
        'job_id': job_id,
        'recommendations': related_jobs
    }, safe=False)

@csrf_exempt
def chatbot_recommend_api(request):
    """
    API endpoint: POST /api/chatbot/recommend/
    Accepts resume_id (JSON/Form) or file upload (PDF).
    """
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST method is allowed.'}, status=405)
        
    cv_text = ""
    
    # 1. Handle file upload
    if 'file' in request.FILES:
        uploaded_file = request.FILES['file']
        if uploaded_file.name.lower().endswith('.pdf'):
            file_bytes = uploaded_file.read()
            cv_text = extract_text_from_pdf(file_bytes)
        else:
            return JsonResponse({'error': 'Hệ thống hiện tại chỉ hỗ trợ file CV dạng PDF.'}, status=400)
            
    # 2. Handle resume ID or direct cv_text
    else:
        resume_id = None
        # Check if request has JSON body
        if request.content_type == 'application/json':
            try:
                data = json.loads(request.body)
                cv_text = data.get('cv_text', '')
                resume_id = data.get('resume_id')
            except ValueError:
                pass
        else:
            cv_text = request.POST.get('cv_text', '')
            resume_id = request.POST.get('resume_id')

        if not cv_text:
            if resume_id:
                cv_text = parse_db_resume(resume_id)
                if not cv_text:
                    return JsonResponse({'error': 'Không tìm thấy thông tin CV hoặc dữ liệu CV rỗng.'}, status=404)
            else:
                return JsonResponse({'error': 'Vui lòng tải lên file CV dạng PDF hoặc chọn CV có sẵn.'}, status=400)

    if not cv_text or not cv_text.strip():
        return JsonResponse({'error': 'Không thể đọc được nội dung từ CV.'}, status=400)

    # 3. Call AI matching logic
    recommendations_result = get_gemini_recommendations(cv_text)
    return JsonResponse(recommendations_result)
