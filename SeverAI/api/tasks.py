import re
from collections import deque
from celery import shared_task
from django.utils import timezone
from api.models import Job

# Default list of banned keywords and weights
BANNED_KEYWORDS = {
    # Cờ bạc, cá độ
    "cá độ": 5, "cờ bạc": 5, "tài xỉu": 5, "lô đề": 5, "bóng bánh": 4, "game bài": 4,
    # Lừa đảo, đa cấp
    "lừa đảo": 5, "đa cấp": 5, "việc nhẹ lương cao": 5, "không cần kinh nghiệm": 2, 
    "kiếm tiền nhanh": 4, "mô hình ponzi": 5, "nhận tiền ngay": 3,
    # Dịch vụ nhạy cảm, mại dâm, cấm khác
    "mại dâm": 5, "sex": 5, "massage nhạy cảm": 4, "bán thận": 5, "cho vay nặng lãi": 5,
    "tín dụng đen": 5, "tuyen pg nhay cam": 4, "dịch vụ 18": 5,
}

THRESHOLD = 5

class AhoCorasickNode:
    def __init__(self):
        self.children = {}
        self.fail = None
        self.output = []  # list of matched words

class AhoCorasick:
    def __init__(self):
        self.root = AhoCorasickNode()

    def insert(self, word):
        node = self.root
        for char in word:
            if char not in node.children:
                node.children[char] = AhoCorasickNode()
            node = node.children[char]
        node.output.append(word)

    def build_failure_links(self):
        queue = deque()
        for char, child in self.root.children.items():
            child.fail = self.root
            queue.append(child)

        while queue:
            current_node = queue.popleft()
            for char, child in current_node.children.items():
                fail_node = current_node.fail
                while fail_node is not None and char not in fail_node.children:
                    fail_node = fail_node.fail
                child.fail = fail_node.children[char] if fail_node else self.root
                child.output.extend(child.fail.output)
                queue.append(child)

    def search(self, text):
        node = self.root
        results = {}  # word -> count
        for char in text:
            while node is not None and char not in node.children:
                node = node.fail
            node = node.children[char] if node else self.root
            for word in node.output:
                results[word] = results.get(word, 0) + 1
        return results

def normalize_text(text):
    if not text:
        return ""
    # Chuyển chữ thường
    text = text.lower()
    # Xóa ký tự đặc biệt, dấu câu, emoji
    text = re.sub(r'[^\w\s]', '', text)
    # Gom khoảng trắng
    text = " ".join(text.split())
    return text

@shared_task
def moderate_job_task(job_id):
    try:
        job = Job.objects.get(id=job_id)
    except Job.DoesNotExist:
        print(f"Job with ID {job_id} not found.")
        return f"Job {job_id} not found"

    # 1. Normalize
    # Gom tiêu đề, mô tả, yêu cầu, quyền lợi
    full_content_pieces = [
        job.title or "",
        job.description or "",
        job.requirements or "",
        job.benefits or ""
    ]
    full_text = " ".join(full_content_pieces)
    
    # Chuẩn hóa văn bản thường
    normalized_text = normalize_text(full_text)
    # Chuẩn hóa loại bỏ toàn bộ khoảng trắng (để diệt trò viết cách chữ kiểu l_ừ_a_đ_ả_o)
    stripped_text = normalized_text.replace(" ", "")

    # 2. Xây dựng cây Aho-Corasick
    ac = AhoCorasick()
    for word in BANNED_KEYWORDS.keys():
        ac.insert(word)
        # Đồng thời đưa bản không khoảng trắng vào cây để bắt lách chữ
        word_stripped = word.replace(" ", "")
        if word_stripped != word:
            ac.insert(word_stripped)
            
    ac.build_failure_links()

    # 3. Quét từ khóa
    matches_normal = ac.search(normalized_text)
    matches_stripped = ac.search(stripped_text)

    # Gộp kết quả
    all_matches = {}
    for word, count in matches_normal.items():
        all_matches[word] = max(all_matches.get(word, 0), count)
    for word, count in matches_stripped.items():
        # Tìm lại từ khóa gốc tương ứng
        original_word = None
        for key in BANNED_KEYWORDS.keys():
            if key.replace(" ", "") == word:
                original_word = key
                break
        if original_word:
            all_matches[original_word] = max(all_matches.get(original_word, 0), count)

    # 4. Cộng dồn điểm số (mỗi từ vi phạm chỉ cộng điểm 1 lần)
    total_score = 0
    detected_words = []
    for word in all_matches.keys():
        score = BANNED_KEYWORDS.get(word, 0)
        total_score += score
        detected_words.append(f"{word} ({score}đ)")

    # 5. Cập nhật trạng thái Job
    previous_status = job.status
    if total_score < THRESHOLD:
        job.status = 'ACTIVE' # APPROVED -> ACTIVE
        job.rejectreason = None
        status_result = 'ACTIVE'

        # If the job status transitions to ACTIVE, notify company followers
        if previous_status != 'ACTIVE':
            try:
                import uuid
                from django.db import connection
                with connection.cursor() as cursor:
                    # Lấy tên công ty
                    cursor.execute("SELECT name FROM companies WHERE id = %s", [job.companyid])
                    comp_row = cursor.fetchone()
                    company_name = comp_row[0] if comp_row else "Doanh nghiệp"

                    # Lấy danh sách candidate đang theo dõi công ty
                    cursor.execute('SELECT "userId" FROM saved_companies WHERE "companyId" = %s', [job.companyid])
                    followers = cursor.fetchall()
                    if followers:
                        for follower in followers:
                            follower_id = follower[0]
                            notif_id = f"cl{uuid.uuid4().hex[:23]}"  # cuid-like 25-char id
                            cursor.execute(
                                'INSERT INTO notifications (id, "userId", type, title, content, "refId", "isRead", "createdAt") '
                                'VALUES (%s, %s, \'JOB_APPROVED\', %s, %s, %s, FALSE, NOW())',
                                [
                                    notif_id,
                                    follower_id,
                                    f'Tin tuyển dụng mới từ {company_name}',
                                    f'Công ty {company_name} mà bạn theo dõi vừa đăng tin tuyển dụng mới: "{job.title}".',
                                    job.slug
                                ]
                            )
            except Exception as e:
                print(f"Failed to create candidate notifications in Celery task: {e}")
    else:
        job.status = 'PENDING'
        reason = f"Tổng điểm nghi vấn [{total_score} điểm] vượt ngưỡng {THRESHOLD}. Danh sách từ phát hiện: {', '.join(detected_words)}"
        job.rejectreason = reason
        status_result = 'PENDING'

        # Gửi thông báo cho Admin nếu tin ở trạng thái PENDING do vi phạm từ khóa
        try:
            import uuid
            from django.db import connection
            with connection.cursor() as cursor:
                # Lấy tên công ty
                cursor.execute("SELECT name FROM companies WHERE id = %s", [job.companyid])
                comp_row = cursor.fetchone()
                company_name = comp_row[0] if comp_row else "Doanh nghiệp"

                # Lấy danh sách admin
                cursor.execute("SELECT id FROM users WHERE role = 'ADMIN'")
                admins = cursor.fetchall()
                if admins:
                    for admin in admins:
                        admin_id = admin[0]
                        notif_id = f"cl{uuid.uuid4().hex[:23]}"  # cuid-like 25-char id
                        cursor.execute(
                            'INSERT INTO notifications (id, "userId", type, title, content, "refId", "isRead", "createdAt") '
                            'VALUES (%s, %s, \'SYSTEM\', %s, %s, %s, FALSE, NOW())',
                            [
                                notif_id,
                                admin_id,
                                'Tin tuyển dụng mới cần duyệt',
                                f'Doanh nghiệp "{company_name}" vừa đăng tin tuyển dụng mới: "{job.title}" và đang chờ phê duyệt do vi phạm từ khóa.',
                                job.id
                            ]
                        )
        except Exception as e:
            print(f"Failed to create admin notifications: {e}")

    job.updatedat = timezone.now()
    job.save()

    # Generate embedding for the job whenever it is created/updated
    try:
        from .embeddings import get_embedding
        from django.db import connection as db_conn
        combined_text = f"Tiêu đề: {job.title}\nMô tả: {job.description or ''}\nYêu cầu: {job.requirements or ''}\nQuyền lợi: {job.benefits or ''}"
        vector = get_embedding(combined_text)
        if vector and len(vector) == 768:
            vector_str = '[' + ','.join(map(str, vector)) + ']'
            with db_conn.cursor() as cursor:
                cursor.execute(
                    "INSERT INTO job_embeddings (job_id, embedding) VALUES (%s, %s::vector) ON CONFLICT (job_id) DO UPDATE SET embedding = EXCLUDED.embedding",
                    [job_id, vector_str]
                )
            print(f"Successfully generated embedding for job {job_id}.")
        else:
            print(f"Warning: Embedding generation returned invalid vector for job {job_id} (length={len(vector) if vector else 0}).")
    except Exception as e:
        print(f"Error generating embedding for job {job_id}: {e}")

    print(f"Moderation finished for job {job_id}. Status: {status_result}, Score: {total_score}")
    return {
        "job_id": job_id,
        "status": status_result,
        "score": total_score,
        "detected": detected_words
    }

