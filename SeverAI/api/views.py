import json
import os
from functools import wraps
from django.http import JsonResponse
from django.views.decorators.http import require_GET
from django.views.decorators.csrf import csrf_exempt
from .recommender import get_related_jobs
from .chatbot import extract_text_from_pdf, parse_db_resume, get_gemini_recommendations, get_general_chat_response

def internal_api_key_required(view_func):
    @wraps(view_func)
    def wrapped_view(request, *args, **kwargs):
        expected_key = os.getenv('INTERNAL_API_KEY')
        if not expected_key:
            return JsonResponse({'error': 'Server misconfiguration: INTERNAL_API_KEY not set.'}, status=500)
        
        auth_header = request.headers.get('Authorization') or request.META.get('HTTP_AUTHORIZATION') or ''
        if not auth_header.startswith('Bearer ') or auth_header[7:] != expected_key:
            return JsonResponse({'error': 'Unauthorized service-to-service call.'}, status=401)
            
        return view_func(request, *args, **kwargs)
    return wrapped_view

@require_GET
@internal_api_key_required
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
@internal_api_key_required
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

@csrf_exempt
@internal_api_key_required
def chatbot_chat_api(request):
    """
    API endpoint: POST /api/chatbot/chat/
    Accepts user message and history.
    """
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST method is allowed.'}, status=405)
        
    try:
        data = json.loads(request.body)
        message = data.get('message', '')
        history = data.get('history', [])
    except ValueError:
        return JsonResponse({'error': 'Invalid JSON body.'}, status=400)
        
    if not message or not message.strip():
        return JsonResponse({'error': 'Message cannot be empty.'}, status=400)
        
    response_result = get_general_chat_response(message, history)
    return JsonResponse(response_result)

@csrf_exempt
@internal_api_key_required
def evaluate_cv_api(request):
    """
    API endpoint: POST /api/evaluate-cv/
    Accepts application_id or (cv_text and job_text) in JSON body.
    """
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST method is allowed.'}, status=405)
        
    try:
        data = json.loads(request.body)
        application_id = data.get('application_id')
        cv_text = data.get('cv_text', '')
        job_text = data.get('job_text', '')
    except ValueError:
        return JsonResponse({'error': 'Invalid JSON body.'}, status=400)
        
    from .models import Application, Job
    from .chatbot import parse_db_resume, extract_text_from_pdf
    from .cross_encoder import calculate_match_score
    import requests
    
    if application_id:
        try:
            app = Application.objects.get(id=application_id)
            try:
                job = Job.objects.get(id=app.jobid)
            except Job.DoesNotExist:
                return JsonResponse({'error': 'Không tìm thấy tin tuyển dụng tương ứng.'}, status=404)
                
            job_text = f"Tiêu đề: {job.title}\nMô tả công việc: {job.description or ''}\nYêu cầu: {job.requirements or ''}"
            
            cv_text = ""
            if app.resumeid:
                cv_text = parse_db_resume(app.resumeid)
            
            if app.cvurl:
                try:
                    headers = {'User-Agent': 'Mozilla/5.0'}
                    resp = requests.get(app.cvurl, headers=headers, timeout=15)
                    if resp.ok:
                        pdf_text = extract_text_from_pdf(resp.content)
                        if pdf_text:
                            cv_text = (cv_text + "\n" + pdf_text).strip()
                except Exception as e:
                    print(f"Error downloading or parsing CV PDF from url {app.cvurl}: {e}")
                    
        except Application.DoesNotExist:
            return JsonResponse({'error': 'Không tìm thấy đơn ứng tuyển.'}, status=404)

    if not cv_text or not cv_text.strip():
        return JsonResponse({'error': 'Không trích xuất được nội dung từ CV.'}, status=400)
    if not job_text or not job_text.strip():
        return JsonResponse({'error': 'Không tìm thấy nội dung tin tuyển dụng.'}, status=400)
        
    score = calculate_match_score(cv_text, job_text)
    
    if application_id:
        try:
            # Update matching score directly
            Application.objects.filter(id=application_id).update(matchscore=score)
        except Exception as e:
            print(f"Error saving matchscore to DB: {e}")
            
    return JsonResponse({'score': score})

@csrf_exempt
@internal_api_key_required
def trigger_moderation_api(request):
    """
    API endpoint: POST /api/jobs/moderate/
    Triggers asynchronous job moderation Celery task.
    """
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST method is allowed.'}, status=405)
        
    try:
        data = json.loads(request.body)
        job_id = data.get('job_id')
    except ValueError:
        return JsonResponse({'error': 'Invalid JSON body.'}, status=400)
        
    if not job_id:
        return JsonResponse({'error': 'Missing job_id.'}, status=400)
        
    from .tasks import moderate_job_task
    task = moderate_job_task.delay(job_id)
    
    return JsonResponse({
        'message': 'Job is being processed',
        'task_id': task.id
    }, status=202)




