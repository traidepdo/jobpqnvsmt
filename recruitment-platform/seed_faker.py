import os
import re
import sys
import random
from datetime import datetime, timedelta

def load_dotenv():
    """Loads environment variables from .env file."""
    if os.path.exists('.env'):
        with open('.env', 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#'):
                    m = re.match(r'^([^=]+)=(.*)$', line)
                    if m:
                        key = m.group(1).strip()
                        val = m.group(2).strip().strip('"').strip("'")
                        os.environ[key] = val

# Load configuration
load_dotenv()
db_url = os.environ.get('DATABASE_URL')
if not db_url:
    print("Error: DATABASE_URL not found in environment or .env file.")
    sys.exit(1)

try:
    from faker import Faker
    import psycopg2
    from psycopg2.extras import execute_values
except ImportError:
    print("Required packages are missing. Please run:")
    print("  pip install Faker psycopg2-binary")
    sys.exit(1)

# Initialize Faker with Vietnamese locale
fake = Faker('vi_VN')
db_url_clean = db_url.split('?')[0] # strip options if needed, but psycopg2 usually handles it

print(f"Connecting to database...")
try:
    conn = psycopg2.connect(db_url)
    conn.autocommit = False
    cur = conn.cursor()
    print("Connected successfully!")
except Exception as e:
    print(f"Connection failed: {e}")
    sys.exit(1)

# Helper function to generate CUIDs (since Prisma uses CUIDs for primary keys)
def generate_cuid(prefix='c'):
    import time
    # Simplified CUID generator for mock data
    timestamp = int(time.time() * 1000)
    rand = random.randint(100000, 999999)
    return f"{prefix}seed{timestamp}{rand}"

def seed_data():
    try:
        # 1. Fetch Wards
        cur.execute("SELECT id FROM wards LIMIT 100;")
        ward_ids = [r[0] for r in cur.fetchall()]
        if not ward_ids:
            # Seed a default Ward if none exists
            print("No wards found. Creating mock geography...")
            prov_id = generate_cuid('p')
            cur.execute("INSERT INTO provinces (id, name, slug) VALUES (%s, %s, %s);", (prov_id, 'Hà Nội', 'ha-noi'))
            dist_id = generate_cuid('d')
            cur.execute("INSERT INTO districts (id, name, slug, \"provinceId\") VALUES (%s, %s, %s, %s);", (dist_id, 'Cầu Giấy', 'cau-giay', prov_id))
            ward_id = generate_cuid('w')
            cur.execute("INSERT INTO wards (id, name, slug, \"districtId\") VALUES (%s, %s, %s, %s);", (ward_id, 'Dịch Vọng', 'dich-vong', dist_id))
            ward_ids = [ward_id]

        # 2. Seed Users (~1200 users: 600 candidates, 550 employers, 50 admins)
        print("Generating 1200 Users...")
        users = []
        candidates = []
        employers = []
        admins = []
        
        for i in range(1200):
            uid = generate_cuid('u')
            name = fake.name()
            email = f"user_{i}_{random.randint(1000,9999)}@example.com"
            password = "hashed_password_placeholder" # simplified
            phone = fake.phone_number()
            
            if i < 600:
                role = 'CANDIDATE'
                candidates.append(uid)
            elif i < 1150:
                role = 'EMPLOYER'
                employers.append(uid)
            else:
                role = 'ADMIN'
                admins.append(uid)
                
            users.append((uid, name, email, password, role, phone, True, False, datetime.now(), datetime.now()))

        execute_values(cur, 
            "INSERT INTO users (id, name, email, password, role, phone, \"isActive\", \"isLocked\", \"createdAt\", \"updatedAt\") VALUES %s",
            users
        )
        print(f"Successfully seeded {len(users)} users.")

        # 3. Seed Companies (~1000 companies, each owned by a unique employer)
        print("Generating 1000 Companies...")
        companies = []
        company_ids = []
        # We have 550 employers, we can create more employers if needed or reuse them (but ownerId is unique). 
        # Let's dynamically create 1000 employers if needed.
        owner_ids = employers.copy()
        while len(owner_ids) < 1000:
            uid = generate_cuid('u')
            name = fake.name()
            email = f"employer_extra_{len(owner_ids)}@example.com"
            password = "hashed_password_placeholder"
            phone = fake.phone_number()
            cur.execute("INSERT INTO users (id, name, email, password, role, phone, \"isActive\", \"isLocked\", \"createdAt\", \"updatedAt\") VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s);",
                        (uid, name, email, password, 'EMPLOYER', phone, True, False, datetime.now(), datetime.now()))
            owner_ids.append(uid)

        for i in range(1000):
            cid = generate_cuid('co')
            name = fake.company()
            slug = f"{fake.slug(name)[:38]}-{random.randint(10000000,99999999)}"
            logo = f"https://picsum.photos/id/{random.randint(1,100)}/200/200"
            website = fake.url()
            description = fake.text(max_nb_chars=500)
            ward_id = random.choice(ward_ids)
            address_detail = fake.address()
            size = random.choice(['SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE'])
            industry = random.choice(['IT', 'Finance', 'Marketing', 'Education', 'Healthcare', 'Construction'])
            owner_id = owner_ids[i]
            
            companies.append((cid, name, slug, logo, website, description, ward_id, address_detail, size, industry, owner_id, True, True, datetime.now(), datetime.now()))
            company_ids.append(cid)

        execute_values(cur,
            "INSERT INTO companies (id, name, slug, logo, website, description, \"wardId\", \"addressDetail\", size, industry, \"ownerId\", \"isApproved\", \"isActive\", \"createdAt\", \"updatedAt\") VALUES %s",
            companies
        )
        print(f"Successfully seeded {len(companies)} companies.")

        # 4. Fetch/Seed Categories
        cur.execute("SELECT id FROM categories LIMIT 100;")
        category_ids = [r[0] for r in cur.fetchall()]
        if not category_ids:
            print("No categories found. Seeding categories...")
            categories_to_seed = [
                ('Công nghệ thông tin', 'it'), ('Kinh doanh / Bán hàng', 'sales'), 
                ('Marketing / PR', 'marketing'), ('Kế toán / Kiểm toán', 'accounting'),
                ('Nhân sự', 'hr'), ('Thiết kế đồ họa', 'design'),
                ('Ngôn ngữ / Dịch thuật', 'languages'), ('Giáo dục / Đào tạo', 'education')
            ]
            for name, slug in categories_to_seed:
                cat_id = generate_cuid('cat')
                cur.execute("INSERT INTO categories (id, name, slug) VALUES (%s, %s, %s);", (cat_id, name, slug))
                category_ids.append(cat_id)

        # 5. Seed Jobs (~1000 jobs)
        print("Generating 1000 Jobs...")
        jobs = []
        job_ids = []
        job_types = ['FULL_TIME', 'PART_TIME', 'REMOTE', 'CONTRACT', 'INTERNSHIP', 'FREELANCE']
        exp_levels = ['NO_EXPERIENCE', 'UNDER_1_YEAR', 'ONE_TO_THREE_YEARS', 'THREE_TO_FIVE_YEARS', 'OVER_FIVE_YEARS']
        job_levels = ['INTERN', 'FRESHER', 'JUNIOR', 'MID', 'SENIOR', 'LEAD', 'MANAGER', 'DIRECTOR']
        job_statuses = ['ACTIVE', 'REJECTED', 'CLOSED']

        for i in range(1000):
            jid = generate_cuid('j')
            title = fake.job()
            slug = f"{fake.slug(title)[:38]}-{random.randint(10000000,99999999)}"
            description = fake.text(max_nb_chars=1000)
            benefits = fake.text(max_nb_chars=300)
            requirements = fake.text(max_nb_chars=500)
            quantity = random.randint(1, 10)
            salary_min = random.choice([5000000, 10000000, 15000000, 20000000, None])
            salary_max = salary_min + random.choice([5000000, 10000000, 15000000]) if salary_min else None
            ward_id = random.choice(ward_ids)
            address_detail = fake.address()
            jtype = random.choice(job_types)
            exp = random.choice(exp_levels)
            lvl = random.choice(job_levels)
            status = random.choice(job_statuses)
            reject_reason = fake.sentence() if status == 'REJECTED' else None
            deadline = datetime.now() + timedelta(days=random.randint(15, 60))
            is_visible = (status != 'REJECTED')
            cat_id = random.choice(category_ids)
            comp_id = random.choice(company_ids)

            jobs.append((jid, title, slug, description, benefits, requirements, quantity, salary_min, salary_max, 
                         ward_id, address_detail, jtype, exp, lvl, status, reject_reason, deadline, is_visible, 
                         cat_id, comp_id, datetime.now(), datetime.now()))
            job_ids.append(jid)

        execute_values(cur,
            "INSERT INTO jobs (id, title, slug, description, benefits, requirements, quantity, \"salaryMin\", \"salaryMax\", "
            "\"wardId\", \"addressDetail\", type, experience, level, status, \"rejectReason\", deadline, \"isVisible\", "
            "\"categoryId\", \"companyId\", \"createdAt\", \"updatedAt\") VALUES %s",
            jobs
        )
        print(f"Successfully seeded {len(jobs)} jobs.")

        # 6. Seed Resumes (~1000 resumes, belonging to candidates)
        print("Generating 1000 Resumes...")
        resumes = []
        for i in range(1000):
            rid = generate_cuid('r')
            user_id = random.choice(candidates)
            title = f"Hồ sơ {fake.job()}"
            address = fake.city()
            summary = fake.paragraph()
            created = datetime.now()
            updated = datetime.now()
            
            resumes.append((rid, user_id, title, address, summary, created, updated))
        
        execute_values(cur,
            "INSERT INTO resumes (id, \"userId\", title, address, summary, \"createdAt\", \"updatedAt\") VALUES %s",
            resumes
        )
        print(f"Successfully seeded {len(resumes)} resumes.")

        # Fetch seeded resume IDs
        cur.execute("SELECT id, \"userId\" FROM resumes;")
        resume_records = cur.fetchall()
        resume_map = {r[1]: r[0] for r in resume_records} # maps userId -> resumeId

        # 7. Seed Applications (~1000 applications)
        print("Generating 1000 Applications...")
        applications = []
        app_statuses = ['PENDING', 'REVIEWING', 'ACCEPTED', 'REJECTED']
        # To avoid duplicate primary key conflict (userId, jobId), keep track of pairs
        pair_set = set()
        
        while len(applications) < 1000:
            uid = random.choice(candidates)
            jid = random.choice(job_ids)
            if (uid, jid) not in pair_set:
                pair_set.add((uid, jid))
                aid = generate_cuid('app')
                cv_url = f"https://example.com/cv_{uid}.pdf"
                resume_id = resume_map.get(uid)
                cover_letter = fake.paragraph()
                status = random.choice(app_statuses)
                
                applications.append((aid, uid, jid, cv_url, resume_id, cover_letter, status, datetime.now(), datetime.now()))

        execute_values(cur,
            "INSERT INTO applications (id, \"userId\", \"jobId\", \"cvUrl\", \"resumeId\", \"coverLetter\", status, \"createdAt\", \"updatedAt\") VALUES %s",
            applications
        )
        print(f"Successfully seeded {len(applications)} applications.")

        # 8. Seed Saved Jobs (~1000 saved jobs)
        print("Generating 1000 Saved Jobs...")
        saved_jobs = []
        sj_pairs = set()
        while len(saved_jobs) < 1000:
            uid = random.choice(candidates)
            jid = random.choice(job_ids)
            if (uid, jid) not in sj_pairs:
                sj_pairs.add((uid, jid))
                sjid = generate_cuid('sj')
                saved_jobs.append((sjid, uid, jid, datetime.now()))

        execute_values(cur,
            "INSERT INTO saved_jobs (id, \"userId\", \"jobId\", \"createdAt\") VALUES %s",
            saved_jobs
        )
        print(f"Successfully seeded {len(saved_jobs)} saved jobs.")

        # 9. Seed Blog Categories and Blogs (~1000 blogs)
        print("Generating Blog Categories and 1000 Blogs...")
        blog_cat_ids = []
        cur.execute("SELECT id FROM blog_categories LIMIT 10;")
        blog_cat_ids = [r[0] for r in cur.fetchall()]
        if not blog_cat_ids:
            for cat_name in ['Xu hướng công nghệ', 'Góc chia sẻ', 'Kinh nghiệm phỏng vấn', 'Mẹo tìm việc']:
                bcid = generate_cuid('bc')
                cur.execute("INSERT INTO blog_categories (id, name, slug) VALUES (%s, %s, %s);", (bcid, cat_name, fake.slug(cat_name)))
                blog_cat_ids.append(bcid)

        blogs = []
        for i in range(1000):
            bid = generate_cuid('b')
            title = fake.sentence()
            slug = f"{fake.slug(title)[:38]}-{random.randint(10000000,99999999)}"
            content = fake.text(max_nb_chars=2000)
            excerpt = fake.sentence()
            cat_id = random.choice(blog_cat_ids)
            author_id = random.choice(admins)
            views = random.randint(10, 5000)
            
            blogs.append((bid, title, slug, content, excerpt, cat_id, author_id, views, True, datetime.now(), datetime.now()))

        execute_values(cur,
            "INSERT INTO blogs (id, title, slug, content, excerpt, \"categoryId\", \"authorId\", views, \"isPublished\", \"createdAt\", \"updatedAt\") VALUES %s",
            blogs
        )
        print(f"Successfully seeded {len(blogs)} blogs.")

        # 10. Seed Notifications (~1000 notifications)
        print("Generating 1000 Notifications...")
        notifications = []
        notif_types = ['APPLICATION_RECEIVED', 'APPLICATION_STATUS_CHANGED', 'JOB_APPROVED', 'NEW_MESSAGE', 'SYSTEM']
        all_users = candidates + employers + admins
        for i in range(1000):
            nid = generate_cuid('n')
            uid = random.choice(all_users)
            ntype = random.choice(notif_types)
            title = fake.sentence(nb_words=4)
            content = fake.sentence(nb_words=10)
            
            notifications.append((nid, uid, ntype, title, content, False, datetime.now()))

        execute_values(cur,
            "INSERT INTO notifications (id, \"userId\", type, title, content, \"isRead\", \"createdAt\") VALUES %s",
            notifications
        )
        print(f"Successfully seeded {len(notifications)} notifications.")

        # Commit everything
        conn.commit()
        print("All database seeding steps committed successfully!")

    except Exception as e:
        conn.rollback()
        print(f"An error occurred during database seeding: {e}")
        raise e
    finally:
        cur.close()
        conn.close()

if __name__ == '__main__':
    seed_data()
