import os
import re
import sys
import random
import uuid
import math
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

load_dotenv()
db_url = os.environ.get('DATABASE_URL')
if not db_url:
    # Try parent directory
    if os.path.exists('../.env'):
        with open('../.env', 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#'):
                    m = re.match(r'^([^=]+)=(.*)$', line)
                    if m:
                        key = m.group(1).strip()
                        val = m.group(2).strip().strip('"').strip("'")
                        os.environ[key] = val
        db_url = os.environ.get('DATABASE_URL')

if not db_url:
    print("Error: DATABASE_URL not found.")
    sys.exit(1)

try:
    from faker import Faker
    import psycopg2
    from psycopg2.extras import execute_values
except ImportError:
    print("Missing packages. Please make sure Faker and psycopg2 are installed.")
    sys.exit(1)

# Initialize Faker with Vietnamese locale
fake = Faker('vi_VN')

print("Connecting to database...")
try:
    conn = psycopg2.connect(db_url)
    conn.autocommit = False
    cur = conn.cursor()
    print("Connected successfully!")
except Exception as e:
    print(f"Connection failed: {e}")
    sys.exit(1)

cuid_counter = 0
def generate_cuid(prefix='c'):
    global cuid_counter
    cuid_counter += 1
    u = uuid.uuid4().hex[:15]
    return f"{prefix}{u}{cuid_counter:03d}"

def generate_random_vector(dim=768):
    """Generates a normalized random float vector of length dim."""
    vec = [random.uniform(-1.0, 1.0) for _ in range(dim)]
    norm = math.sqrt(sum(x*x for x in vec))
    if norm == 0.0:
        vec[0] = 1.0
        norm = 1.0
    return [x/norm for x in vec]

# Phu Quoc Wards Mapping
pq_wards = [
    ('cmq0j2tag0002c4kq7g9icao6', 'Dương Đông', 'Dương Đông, Phú Quốc'),
    ('cmq0j2tag0003c4kq75wxy3uz', 'An Thới', 'An Thới, Phú Quốc'),
    ('cmq0j2tag0004c4kqtlx1obkw', 'Hàm Ninh', 'Hàm Ninh, Phú Quốc'),
    ('cmq0j2tag0005c4kqb3uxjtzw', 'Gành Dầu', 'Gành Dầu, Phú Quốc')
]

# Category ID mapping
category_id_map = {
    'Hotel': 'cmq0j2ttx0008c4kqx7y4op9g',
    'Restaurant': 'cmq0j2tty0009c4kqsi90sjju',
    'Tour Guide': 'cmq0j2tty000ac4kqxvmqiyyu',
    'Security': 'cmq0j2tty000bc4kqzb10nbwk',
    'IT': 'cat_01',
    'Marketing': 'cat_02',
    'Finance': 'cat_03',
    'Design': 'cat_04',
    'HR': 'cat_05',
    'Sales': 'cat_06'
}

# Detailed templates for realistic jobs in each category
job_templates = {
    'Hotel': [
        {
            'title': 'Lễ tân Khách sạn 5 sao',
            'desc': 'Chào đón và hướng dẫn khách hàng làm thủ tục check-in/check-out. Tiếp nhận cuộc gọi, hỗ trợ thông tin du lịch Phú Quốc và giải quyết các yêu cầu của khách trong suốt thời gian lưu trú.',
            'req': 'Tiếng Anh giao tiếp lưu loát (biết thêm tiếng Trung/Hàn là lợi thế). Ngoại hình ưa nhìn, thân thiện, có kinh nghiệm lễ tân tối thiểu 1 năm.',
            'ben': 'Lương cơ bản 8-12 triệu + Phí phục vụ (Service charge) hấp dẫn. Hỗ trợ nhà ở nhân viên (Staff House) và 3 bữa ăn/ngày. Bảo hiểm đầy đủ.'
        },
        {
            'title': 'Nhân viên Buồng phòng (Housekeeping)',
            'desc': 'Thực hiện dọn dẹp phòng khách, đảm bảo vệ sinh và bài trí phòng theo tiêu chuẩn resort 5 sao. Báo cáo các sự cố hư hỏng trang thiết bị trong phòng cho bộ phận kỹ thuật.',
            'req': 'Sức khỏe tốt, dẻo dai, trung thực. Có chứng chỉ nghiệp vụ buồng phòng hoặc kinh nghiệm tại các resort là một lợi thế lớn.',
            'ben': 'Thu nhập từ 7-9 triệu + Service charge. Hỗ trợ ăn ca, đồng phục, xe đưa đón nhân viên. Thưởng lễ tết và tháng lương thứ 13.'
        },
        {
            'title': 'Giám sát Bộ phận Buồng phòng',
            'desc': 'Kiểm tra chất lượng vệ sinh phòng khách và các khu vực công cộng. Quản lý, phân công công việc cho nhân viên buồng phòng và điều phối trang thiết bị, vật tư.',
            'req': 'Tối thiểu 2 năm kinh nghiệm làm giám sát buồng phòng tại khách sạn 4-5 sao. Kỹ năng quản lý đội ngũ và giải quyết vấn đề tốt.',
            'ben': 'Mức lương từ 12-16 triệu/tháng. Đóng bảo hiểm xã hội đầy đủ, nghỉ phép năm. Cơ hội thăng tiến lên phó/trưởng bộ phận.'
        },
        {
            'title': 'Nhân viên Hành lý (Bellman)',
            'desc': 'Chào đón khách, hỗ trợ vận chuyển hành lý của khách lên phòng và từ phòng xuống sảnh khi check-out. Hướng dẫn khách sử dụng các trang thiết bị cơ bản trong phòng.',
            'req': 'Sức khỏe tốt, nhanh nhẹn, giao tiếp tiếng Anh cơ bản. Có bằng lái xe B2 là lợi thế để hỗ trợ lái xe điện đưa đón khách nội khu.',
            'ben': 'Lương từ 6-8 triệu + Service charge + Tiền Tip cao. Hỗ trợ ăn ở tại Staff House cao cấp của resort.'
        }
    ],
    'Restaurant': [
        {
            'title': 'Nhân viên Phục vụ Nhà hàng (Waiter/Waitress)',
            'desc': 'Giới thiệu menu, tiếp nhận order đồ ăn thức uống từ khách hàng. Phục vụ món ăn theo đúng tiêu chuẩn, dọn dẹp bàn ăn và hỗ trợ thanh toán cho khách.',
            'req': 'Ngoại hình sáng, giao tiếp tiếng Anh cơ bản. Nhanh nhẹn, có tinh thần dịch vụ tốt. Ưu tiên ứng viên có kinh nghiệm làm việc tại nhà hàng hoặc resort.',
            'ben': 'Thu nhập 6.5 - 9 triệu + Service charge + Tip. Hỗ trợ bữa ăn theo ca trực, đồng phục, cơ hội học hỏi kỹ năng phục vụ chuyên nghiệp.'
        },
        {
            'title': 'Nhân viên Pha chế (Bartender/Barista)',
            'desc': 'Pha chế các loại đồ uống, cocktail, sinh tố, cà phê theo công thức tiêu chuẩn của resort. Quản lý nguyên vật liệu tại quầy bar và đảm bảo vệ sinh khu vực làm việc.',
            'req': 'Có chứng chỉ nghề pha chế hoặc tối thiểu 1 năm kinh nghiệm làm bartender/barista tại các bar/pub/nhà hàng lớn. Kỹ năng giao tiếp tiếng Anh tốt.',
            'ben': 'Lương từ 8-11 triệu + Service charge. Thưởng doanh số quầy bar. Môi trường làm việc năng động, chuyên nghiệp.'
        },
        {
            'title': 'Đầu bếp Âu / Á (Commis Chef)',
            'desc': 'Chuẩn bị nguyên liệu, sơ chế thực phẩm và đứng bếp chế biến các món ăn Âu/Á dưới sự hướng dẫn của bếp phó và bếp trưởng. Đảm bảo an toàn vệ sinh thực phẩm.',
            'req': 'Có bằng nghề nấu ăn. Có kinh nghiệm tối thiểu 1 năm đứng bếp Âu hoặc Á tại khách sạn/nhà hàng. Chịu được áp lực công việc cao.',
            'ben': 'Lương 8 - 12 triệu tùy tay nghề + Service charge. Hỗ trợ chỗ ở tiện nghi cho nhân viên ở xa, đóng bảo hiểm đầy đủ.'
        },
        {
            'title': 'Bếp trưởng Nhà hàng Hải sản',
            'desc': 'Quản lý toàn bộ hoạt động của bếp nhà hàng hải sản. Thiết lập menu, kiểm soát chi phí nguyên liệu, đảm bảo chất lượng món ăn và đào tạo đội ngũ nhân sự bếp.',
            'req': 'Tối thiểu 5 năm kinh nghiệm làm bếp trưởng hoặc tổ trưởng bếp tại các nhà hàng hải sản lớn. Am hiểu sâu sắc các kỹ thuật chế biến hải sản Phú Quốc.',
            'ben': 'Lương từ 25-35 triệu/tháng + % doanh số nhà hàng. Cung cấp căn hộ ở riêng cho gia đình, xe đưa đón.'
        }
    ],
    'Tour Guide': [
        {
            'title': 'Hướng dẫn viên Du lịch Quốc tế (Tiếng Anh)',
            'desc': 'Dẫn dắt các đoàn khách nước ngoài tham quan các điểm du lịch nổi tiếng tại Phú Quốc như Nhà tù Phú Quốc, Chùa Hộ Quốc, Bãi Sao, cáp treo Hòn Thơm, v.v.',
            'req': 'Có thẻ Hướng dẫn viên du lịch quốc tế hoạt động. Tiếng Anh lưu loát, kỹ năng thuyết trình và hoạt náo tốt. Am hiểu lịch sử, văn hóa Phú Quốc.',
            'ben': 'Thu nhập 12-18 triệu + Tiền Tip từ khách hàng + Hoa hồng từ các dịch vụ liên kết. Được tham gia các khóa đào tạo nâng cao nghiệp vụ.'
        },
        {
            'title': 'Điều hành Tour Du lịch Phú Quốc',
            'desc': 'Lên chương trình tour, đặt dịch vụ xe, tàu, nhà hàng, khách sạn và phân công hướng dẫn viên cho các đoàn khách. Giải quyết các sự cố phát sinh trong quá trình chạy tour.',
            'req': 'Tốt nghiệp chuyên ngành Du lịch/Lữ hành. Có kinh nghiệm điều hành tour tối thiểu 1 năm. Kỹ năng giao tiếp và xử lý tình huống nhanh nhạy.',
            'ben': 'Lương cứng 9-13 triệu + Thưởng KPI theo số lượng đoàn. Hỗ trợ ăn trưa tại văn phòng, đóng BHXH đầy đủ.'
        },
        {
            'title': 'Hướng dẫn viên Lặn biển & Sup Tour',
            'desc': 'Hướng dẫn khách hàng kỹ thuật lặn ngắm san hô (Snorkeling/Scuba Diving) và chèo thuyền Sup an toàn tại các hòn đảo thuộc quần đảo An Thới. Đảm bảo an toàn tuyệt đối cho khách.',
            'req': 'Biết bơi lội xuất sắc, có chứng chỉ lặn biển chuyên nghiệp (PADI/SSI là lợi thế lớn). Giao tiếp tiếng Anh cơ bản, nhiệt tình và thân thiện.',
            'ben': 'Thu nhập từ 10-15 triệu/tháng. Hỗ trợ ăn ca trên tàu du lịch. Trang bị đầy đủ dụng cụ bảo hộ chất lượng cao.'
        }
    ],
    'Security': [
        {
            'title': 'Nhân viên Bảo vệ Resort',
            'desc': 'Tuần tra, giám sát an ninh tại các khu vực trong resort (sảnh, bãi biển, villa, bãi đỗ xe). Kiểm soát người và phương tiện ra vào khu nghỉ dưỡng.',
            'req': 'Sức khỏe tốt, tác phong nghiêm túc, trung thực. Ưu tiên ứng viên là bộ đội xuất ngũ hoặc có chứng chỉ nghiệp vụ bảo vệ.',
            'ben': 'Lương 7-9 triệu/tháng. Resort bao ăn ở 100%, cấp phát đồng phục miễn phí. Đầy đủ chế độ bảo hiểm theo luật định.'
        },
        {
            'title': 'Nhân viên Kiểm soát CCTV (An ninh Camera)',
            'desc': 'Trực hệ thống camera giám sát của resort/khu vui chơi tại phòng điều hành trung tâm. Kịp thời phát hiện và báo cáo các hành vi nghi vấn, sự cố an ninh cho lực lượng tuần tra giải quyết.',
            'req': 'Có kinh nghiệm vận hành hệ thống CCTV tối thiểu 1 năm. Tập trung cao độ, bảo mật thông tin tốt, sử dụng máy tính cơ bản thành thạo.',
            'ben': 'Lương 8.5 - 11 triệu/tháng. Đóng bảo hiểm đầy đủ, hỗ trợ cơm ca và nhà ở Staff House.'
        }
    ],
    'IT': [
        {
            'title': 'Nhân viên IT Support Khách sạn',
            'desc': 'Hỗ trợ kỹ thuật phần cứng, phần mềm, mạng LAN/Wifi cho các bộ phận trong resort và khách lưu trú. Vận hành và bảo trì hệ thống khóa từ, camera giám sát.',
            'req': 'Tốt nghiệp Trung cấp trở lên ngành CNTT. Hiểu biết về mạng, tổng đài điện thoại và hệ thống quản lý khách sạn (Opera/Smile).',
            'ben': 'Lương từ 9-13 triệu/tháng. Hỗ trợ ăn ca, Staff House đầy đủ tiện nghi, đóng BHXH từ tháng thử việc.'
        },
        {
            'title': 'Quản trị viên Hệ thống Mạng Resort',
            'desc': 'Quản trị hệ thống server, tường lửa, mạng wifi diện rộng của toàn bộ resort 5 sao. Đảm bảo tính liên tục và an toàn bảo mật dữ liệu của khách hàng và doanh nghiệp.',
            'req': 'Có bằng Đại học chuyên ngành CNTT/An toàn thông tin. Có các chứng chỉ mạng CCNA/CCNP là lợi thế. Tối thiểu 2 năm kinh nghiệm ở vị trí tương đương.',
            'ben': 'Lương thương lượng từ 15-22 triệu/tháng. Được hưởng phí phục vụ cao của resort, chế độ nghỉ mát hàng năm.'
        }
    ],
    'Marketing': [
        {
            'title': 'Chuyên viên Marketing & PR cho Resort',
            'desc': 'Lập kế hoạch và triển khai các chiến dịch quảng bá hình ảnh resort trên mạng xã hội (Facebook, Instagram, TikTok) và các trang OTA. Soạn thảo thông cáo báo chí, tổ chức sự kiện.',
            'req': 'Tốt nghiệp đại học ngành Marketing/PR/Truyền thông. Kỹ năng viết lách tốt, tiếng Anh thành thạo cả nói và viết. Có gu thẩm mỹ tốt.',
            'ben': 'Lương từ 12-18 triệu/tháng. Thưởng hiệu quả chiến dịch. Hỗ trợ chỗ ở tại Staff House cao cấp, ăn uống miễn phí tại resort.'
        },
        {
            'title': 'Nhân viên Thiết kế Đồ họa (Graphic Designer)',
            'desc': 'Thiết kế các ấn phẩm quảng cáo, bộ nhận diện thương hiệu, menu, poster, tờ rơi và thiết kế hình ảnh cho các kênh truyền thông số của resort/nhà hàng.',
            'req': 'Sử dụng thành thạo Photoshop, Illustrator, Premiere. Có portfolio thiết kế đa dạng. Ưu tiên ứng viên có kinh nghiệm thiết kế trong ngành du lịch/khách sạn.',
            'ben': 'Lương từ 10-15 triệu/tháng. Trang bị máy tính cấu hình cao tại văn phòng Phú Quốc, đóng BHXH đầy đủ.'
        }
    ],
    'Finance': [
        {
            'title': 'Kế toán Tổng hợp Khách sạn',
            'desc': 'Kiểm tra, đối chiếu số liệu báo cáo của các kế toán phần hành (thu ngân, kho, công nợ). Lập báo cáo tài chính, quyết toán thuế định kỳ theo đúng quy định.',
            'req': 'Tốt nghiệp Đại học ngành Kế toán/Kiểm toán. Có tối thiểu 2 năm kinh nghiệm làm kế toán tổng hợp tại các công ty du lịch hoặc khách sạn lớn.',
            'ben': 'Mức lương từ 11-16 triệu/tháng + Service charge. Hỗ trợ cơm trưa, đóng BHXH đầy đủ, thưởng cuối năm hấp dẫn.'
        },
        {
            'title': 'Kế toán trưởng (Chief Accountant)',
            'desc': 'Quản lý toàn diện phòng tài chính kế toán của Resort. Tham mưu cho Ban giám đốc về chiến lược tài chính, kiểm soát dòng tiền, làm việc với cơ quan thuế và ngân hàng.',
            'req': 'Có chứng chỉ Kế toán trưởng. Tối thiểu 5 năm kinh nghiệm quản lý tài chính kế toán tại khách sạn/resort 4-5 sao. Kỹ năng lãnh đạo xuất sắc.',
            'ben': 'Mức lương thỏa thuận từ 30-45 triệu/tháng. Hỗ trợ xe đưa đón riêng, căn hộ riêng cho gia đình.'
        }
    ],
    'Design': [
        {
            'title': 'Nhân viên Chụp ảnh & Quay phim (Photographer/Videographer)',
            'desc': 'Chụp ảnh món ăn, sự kiện, cảnh quan resort, quay dựng video ngắn (Reels, TikTok) quảng bá dịch vụ. Quản lý kho hình ảnh, video của doanh nghiệp.',
            'req': 'Sở hữu máy ảnh/máy quay cá nhân. Kỹ năng chụp ảnh và dựng phim tốt, bắt kịp các xu hướng video ngắn hiện nay. Năng động, thích di chuyển.',
            'ben': 'Lương 10-14 triệu/tháng. Thưởng theo chất lượng sản phẩm truyền thông. Hỗ trợ ăn uống tại resort.'
        }
    ],
    'HR': [
        {
            'title': 'Chuyên viên Tuyển dụng & Đào tạo',
            'desc': 'Lập kế hoạch và thực hiện quy trình tuyển dụng nhân sự cho các bộ phận khách sạn, đặc biệt vào mùa cao điểm du lịch. Tổ chức các buổi đào tạo định hướng và kỹ năng mềm.',
            'req': 'Tốt nghiệp Đại học chuyên ngành Quản trị nhân lực, Luật hoặc Ngoại ngữ. Tối thiểu 2 năm kinh nghiệm tuyển dụng trong ngành khách sạn/dịch vụ.',
            'ben': 'Lương từ 10-15 triệu/tháng. Đóng BHXH đầy đủ, được nghỉ mát hàng năm, hỗ trợ cơm ca và Staff House.'
        },
        {
            'title': 'Chuyên viên Hành chính Nhân sự (HR Generalist)',
            'desc': 'Quản lý hồ sơ nhân viên, chấm công, tính lương, thực hiện chế độ bảo hiểm xã hội, phúc lợi và xử lý các vấn đề hành chính văn phòng của resort.',
            'req': 'Am hiểu Luật Lao động Việt Nam. Sử dụng thành thạo Excel, có kinh nghiệm làm BHXH trên phần mềm. Cẩn thận, bảo mật thông tin tốt.',
            'ben': 'Lương từ 9-13 triệu/tháng. Đầy đủ các quyền lợi bảo hiểm, thưởng lễ tết và du lịch hàng năm.'
        }
    ],
    'Sales': [
        {
            'title': 'Nhân viên Sales Khách sạn (Sales OTA/TA)',
            'desc': 'Tìm kiếm đối tác lữ hành, quản lý các kênh bán phòng trực tuyến (Booking.com, Agoda, Expedia) và triển khai các chương trình khuyến mãi phòng nghỉ.',
            'req': 'Tốt nghiệp đại học chuyên ngành Du lịch/Kinh doanh. Có kinh nghiệm sales khách sạn tối thiểu 1 năm, am hiểu thị trường du lịch Phú Quốc.',
            'ben': 'Lương cứng 8-12 triệu + % hoa hồng doanh số bán phòng rất cao. Hỗ trợ cơm ca, điện thoại và Staff House.'
        },
        {
            'title': 'Chuyên viên Chăm sóc Khách hàng (Customer Care)',
            'desc': 'Tiếp nhận cuộc gọi và email tư vấn khách đặt phòng, đặt tour. Chăm sóc khách hàng trước, trong và sau chuyến đi, ghi nhận ý kiến phản hồi để nâng cao chất lượng dịch vụ.',
            'req': 'Giọng nói truyền cảm, dễ nghe, không ngọng/nói lắp. Giao tiếp tiếng Anh tốt. Chăm chỉ, có kỹ năng thuyết phục khách hàng tốt.',
            'ben': 'Thu nhập từ 8-11 triệu/tháng (gồm thưởng KPI đặt phòng). Đóng bảo hiểm đầy đủ, đào tạo nghiệp vụ chuyên nghiệp.'
        }
    ]
}

# Real image URLs for blog posts (completely loadable)
blog_images = [
    "https://images.unsplash.com/photo-1540553016722-983e48a2cd10?w=800", # resort/beach
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800", # beach/sunset
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800", # luxury hotel
    "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800", # hotel interior
    "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800", # restaurant
    "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800", # travel/adventure
    "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800", # office/collaboration
    "https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=800", # career development
    "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800", # job search/cv
    "https://images.unsplash.com/photo-1626197031507-c1709955b04a?w=800"  # resume writing
]

# Curated blog post templates with rich HTML content (containing h2 headers for TOC)
blog_templates = [
    {
        'title': 'Cẩm nang tìm việc làm khách sạn tại Phú Quốc từ A-Z',
        'excerpt': 'Phú Quốc là thiên đường nghỉ dưỡng lớn nhất cả nước, mở ra hàng ngàn cơ hội việc làm khách sạn hấp dẫn. Khám phá ngay cẩm nang hữu ích này.',
        'content': """
<p>Thành phố đảo Phú Quốc là nơi quy tụ của hàng loạt thương hiệu resort và khách sạn 5 sao đẳng cấp quốc tế. Nơi đây mở ra thị trường lao động vô cùng sôi động với mức thu nhập hấp dẫn. Để giúp các bạn ứng viên tự tin ứng tuyển, Phú Quốc Jobs xin chia sẻ cẩm nang chi tiết nhất.</p>

<h2>1. Các bộ phận luôn khát nhân lực tại Phú Quốc</h2>
<p>Ngành khách sạn & resort luôn cần lượng lớn lao động ở các bộ phận:</p>
<ul>
    <li>Bộ phận Lễ tân (Front Office)</li>
    <li>Bộ phận Buồng phòng (Housekeeping)</li>
    <li>Bộ phận Ẩm thực & Nhà hàng (Food & Beverage)</li>
    <li>Bộ phận Kỹ thuật & Bảo trì (Engineering)</li>
</ul>

<h2>2. Các yêu cầu tuyển dụng phổ biến của nhà tuyển dụng</h2>
<p>Để ghi điểm với các khách sạn 5 sao tại Đảo Ngọc, ứng viên cần trang bị:</p>
<ul>
    <li>Kỹ năng ngoại ngữ: Tiếng Anh giao tiếp tốt là điều kiện tiên quyết, biết thêm tiếng Trung, tiếng Hàn, hoặc tiếng Nga là điểm cộng lớn.</li>
    <li>Thái độ phục vụ (Service Mindset): Thân thiện, chủ động, luôn đặt trải nghiệm khách hàng lên hàng đầu.</li>
    <li>Chứng chỉ nghề nghiệp hoặc kinh nghiệm làm việc thực tế.</li>
</ul>

<h2>3. Chế độ phúc lợi đặc trưng tại Phú Quốc</h2>
<p>Một điểm đặc biệt khi làm việc tại Phú Quốc là hầu hết các resort lớn đều hỗ trợ nhà ở nhân viên (Staff House) đầy đủ tiện nghi, hỗ trợ xe đưa đón, đóng bảo hiểm đầy đủ và bao ăn 3 bữa. Đây là giải pháp tuyệt vời giúp người lao động từ các tỉnh thành khác an tâm lập nghiệp.</p>
"""
    },
    {
        'title': 'Top 10 resort sang trọng tuyển dụng nhiều nhân sự nhất tại Dương Đông',
        'excerpt': 'Dương Đông là trung tâm kinh tế sầm uất nhất Phú Quốc. Cùng điểm qua danh sách các resort lớn thường xuyên tuyển dụng nhân sự.',
        'content': """
<p>Phường Dương Đông là trái tim của đảo Phú Quốc với bãi biển thơ mộng và chuỗi khách sạn nhộn nhịp. Nếu bạn đang tìm kiếm cơ hội thăng tiến sự nghiệp, đây chính là khu vực lý tưởng để bắt đầu gửi hồ sơ.</p>

<h2>1. Tại sao nên chọn làm việc tại trung tâm Dương Đông?</h2>
<p>Làm việc tại Dương Đông mang lại nhiều lợi thế vượt trội:</p>
<ul>
    <li>Giao thông thuận tiện, gần chợ, siêu thị và các khu vui chơi giải trí.</li>
    <li>Nhiều hoạt động văn hóa, đời sống tinh thần sôi động về đêm.</li>
    <li>Sự tập trung đông đảo của du khách trong và ngoài nước giúp bạn nâng cao kỹ năng giao tiếp ngoại ngữ nhanh chóng.</li>
</ul>

<h2>2. Danh sách các resort hàng đầu thường xuyên tuyển dụng</h2>
<p>Nổi bật trong danh sách tuyển dụng tại Dương Đông bao gồm:</p>
<ul>
    <li>Seashells Phu Quoc Hotel & Spa: Nằm ngay trung tâm với thiết kế hình con tàu độc đáo.</li>
    <li>Salinda Resort Phu Quoc Island: Resort cao cấp mang phong cách sinh thái gần gũi thiên nhiên.</li>
    <li>Lahana Resort Phu Quoc: Resort đồi xanh mát mẻ thích hợp với những bạn yêu thiên nhiên.</li>
</ul>

<h2>3. Kinh nghiệm nộp hồ sơ trực tuyến</h2>
<p>Ứng viên nên cập nhật CV chuyên nghiệp, làm nổi bật kinh nghiệm làm việc trong ngành dịch vụ và nộp trực tiếp qua nền tảng Phú Quốc Jobs để được nhà tuyển dụng liên hệ phỏng vấn sớm nhất.</p>
"""
    },
    {
        'title': 'Kinh nghiệm làm hướng dẫn viên du lịch tại Phú Quốc',
        'excerpt': 'Làm hướng dẫn viên du lịch tại đảo Ngọc đòi hỏi những kỹ năng gì? Cùng lắng nghe chia sẻ từ những người đi trước.',
        'content': """
<p>Hướng dẫn viên du lịch (HDV) là một trong những nghề năng động và có thu nhập tốt nhất tại Phú Quốc. Tuy nhiên, để bám trụ và thành công với nghề trên đảo Ngọc, bạn cần có sự chuẩn bị kỹ lưỡng.</p>

<h2>1. Những khó khăn đặc thù của nghề HDV tại đảo</h2>
<p>Khác với các tour đất liền, HDV tại Phú Quốc thường xuyên dẫn các tour đảo, tour lặn biển ngắm san hô. Do đó, bạn cần:</p>
<ul>
    <li>Sức khỏe tốt, không bị say sóng, có khả năng chịu nắng gió cường độ cao.</li>
    <li>Biết bơi lội thành thạo và nắm vững các kỹ năng cứu hộ đuối nước cơ bản.</li>
    <li>Am hiểu sâu sắc về hệ sinh thái biển, rạn san hô để tư vấn và nhắc nhở du khách bảo vệ môi trường.</li>
</ul>

<h2>2. Làm thế nào để tăng thu nhập ngoài lương cứng?</h2>
<p>Một HDV giỏi và nhiệt tình tại Phú Quốc có thể kiếm được thu nhập rất cao nhờ:</p>
<ul>
    <li>Tiền Tip xứng đáng từ khách hàng nhờ thái độ phục vụ tận tâm, chu đáo.</li>
    <li>Hoa hồng từ các dịch vụ liên kết uy tín (mua sắm đặc sản ngọc trai, nước mắm, đặc sản hồ tiêu...).</li>
    <li>Dẫn các tour thiết kế riêng (private tour) cho gia đình hoặc khách quốc tế VIP.</li>
</ul>

<h2>3. Khóa học kỹ năng bổ trợ cần thiết</h2>
<p>Đừng ngần ngại đăng ký các khóa học lặn chuyên nghiệp PADI hoặc SSI để nâng cao trình độ chuyên môn của bản thân. Điều này sẽ giúp bạn dễ dàng xin việc vào các công ty lữ hành cao cấp.</p>
"""
    },
    {
        'title': 'Vì sao ngành F&B (Nhà hàng - Ẩm thực) tại Phú Quốc luôn khát nhân lực?',
        'excerpt': 'Sự bùng nổ của khách du lịch kéo theo nhu cầu ẩm thực tăng vọt. Tìm hiểu lý do tại sao các vị trí bếp và phục vụ luôn có nhu cầu tuyển dụng cực lớn.',
        'content': """
<p>Ẩm thực là một phần không thể thiếu trong mỗi chuyến đi của du khách. Tại Phú Quốc, sự bùng nổ của các resort và nhà hàng hải sản đã đẩy nhu cầu nhân sự ngành F&B lên cao hơn bao giờ hết.</p>

<h2>1. Nhu cầu nhân lực tăng mạnh theo mùa du lịch</h2>
<p>Vào mùa cao điểm (từ tháng 11 đến tháng 4 năm sau), lượng khách đổ về Phú Quốc tăng đột biến. Các nhà hàng, bar bãi biển cần tuyển dụng số lượng lớn nhân viên phục vụ, pha chế và phụ bếp bán thời gian cũng như toàn thời gian để vận hành tối đa công suất.</p>

<h2>2. Yêu cầu chuyên môn ngày càng khắt khe</h2>
<p>Du khách đến Phú Quốc có phân khúc đa dạng, từ bình dân đến cao cấp. Do đó, các vị trí F&B yêu cầu:</p>
<ul>
    <li>Nhân viên phục vụ: Giao tiếp tiếng Anh tốt, hiểu biết về văn hóa ẩm thực các nước.</li>
    <li>Đầu bếp: Nắm vững kỹ thuật bảo quản hải sản tươi sống và vệ sinh an toàn thực phẩm.</li>
    <li>Pha chế: Sáng tạo các loại đồ uống độc đáo mang đậm hương vị nhiệt đới Phú Quốc.</li>
</ul>

<h2>3. Lời khuyên cho các bạn trẻ muốn theo đuổi ngành F&B</h2>
<p>Hãy bắt đầu từ những vị trí nhỏ nhất để tích lũy kinh nghiệm thực tế. Tác phong làm việc chuyên nghiệp, sự kiên trì và chịu khó học hỏi sẽ giúp bạn nhanh chóng thăng tiến lên các vị trí quản lý nhà hàng với mức lương cực kỳ hấp dẫn.</p>
"""
    }
]

def seed_data():
    try:
        # 1. Fetch Wards of Phu Quoc
        ward_slugs = ['duong-dong', 'an-thoi', 'ham-ninh', 'ganh-dau']
        cur.execute("SELECT id, name, slug FROM wards WHERE slug IN %s;", (tuple(ward_slugs),))
        ward_rows = cur.fetchall()
        ward_map = {row[2]: row[0] for row in ward_rows} # slug -> id
        print(f"Fetched wards: {ward_map}")
        
        # Verify we have at least one ward
        if not ward_map:
            raise Exception("No Phú Quốc wards found in the database. Please ensure geography data is seeded.")

        # 2. Fetch Category IDs
        cur.execute("SELECT id, slug FROM categories;")
        cat_rows = cur.fetchall()
        db_categories = {row[1]: row[0] for row in cat_rows}
        print(f"Fetched categories: {db_categories}")

        # 3. Fetch Admin Users
        cur.execute("SELECT id FROM users WHERE role = 'ADMIN' LIMIT 5;")
        admin_rows = cur.fetchall()
        admin_ids = [r[0] for r in admin_rows]
        if not admin_ids:
            # Seed a default admin if none exists
            admin_id = generate_cuid('u')
            cur.execute("INSERT INTO users (id, name, email, password, role, \"isActive\", \"createdAt\", \"updatedAt\") VALUES (%s, %s, %s, %s, 'ADMIN', TRUE, NOW(), NOW());",
                        (admin_id, 'Admin Phu Quoc', 'pq_admin@phuquocjobs.vn', 'hashed_pass'))
            admin_ids = [admin_id]
        print(f"Using Admin IDs: {admin_ids}")

        # 4. Fetch Blog Categories
        cur.execute("SELECT id FROM blog_categories LIMIT 5;")
        bcat_rows = cur.fetchall()
        bcat_ids = [r[0] for r in bcat_rows]
        if not bcat_ids:
            bcat_id = generate_cuid('bc')
            cur.execute("INSERT INTO blog_categories (id, name, slug) VALUES (%s, 'Tin tức & Cẩm nang', 'tin-tuc-cam-nang');")
            bcat_ids = [bcat_id]

        # 5. Generate 1000 Employers (Users)
        print("Generating 1000 Employers...")
        employers = []
        for i in range(1000):
            uid = generate_cuid('u')
            name = fake.name()
            email = f"employer_pq_{i}_{random.randint(100000, 999999)}@phuquocjobs.vn"
            password = "pbkdf2_sha256$260000$placeholderhash"
            phone = f"09{random.randint(10000000, 99999999)}"
            employers.append((uid, name, email, password, 'EMPLOYER', phone, True, False, datetime.now(), datetime.now()))
        
        execute_values(cur, 
            "INSERT INTO users (id, name, email, password, role, phone, \"isActive\", \"isLocked\", \"createdAt\", \"updatedAt\") VALUES %s",
            employers
        )
        employer_ids = [emp[0] for emp in employers]
        print(f"Successfully inserted {len(employer_ids)} employers.")

        # 6. Generate 1000 Companies (Each owned by one of the generated employers)
        print("Generating 1000 Companies in Phú Quốc...")
        companies = []
        company_ids = []
        industries = ['Khách sạn & Du lịch', 'Nhà hàng & F&B', 'Giải trí & Vui chơi', 'Lữ hành & Hướng dẫn', 'An ninh & Bảo vệ', 'Dịch vụ Vận tải', 'Bán lẻ & Thương mại']
        
        company_name_prefixes = [
            "Vinpearl", "JW Marriott", "InterContinental", "Novotel", "Pullman", "Sol", "Mövenpick", 
            "Radisson Blu", "Premier Village", "Salinda", "Sunset Sanato", "Camia", "Lahana", 
            "Cassia Cottage", "Mango Bay", "The Shells", "Seashells", "Crowne Plaza", "Regent", 
            "Wyndham Grand", "Best Western", "Melia", "Dusit Princess", "Fusion", "La Veranda",
            "Mercury", "Eden", "Amarin", "Sailing Club", "Sunset Beach", "Ocean Bay", "Green Bay"
        ]
        company_name_suffixes = [
            "Resort & Spa", "Phu Quoc Beach Resort", "Đảo Ngọc Resort", "Ocean View Hotel", 
            "Sunset Villas", "Eco Lodge", "Seafood Restaurant", "Island Tour Agency", "Travel & Leisure",
            "Boutique Hotel", "Luxury Suites", "Garden Resort"
        ]

        for i in range(1000):
            cid = generate_cuid('co')
            owner_id = employer_ids[i]
            
            # Generate realistic Phu Quoc company name
            if i < len(company_name_prefixes):
                base_name = f"{company_name_prefixes[i]} {random.choice(company_name_suffixes)}"
            else:
                base_name = f"{fake.company()} {random.choice(company_name_suffixes)}"
            
            # Append Phú Quốc if not already present
            if "Phú Quốc" not in base_name and "Phu Quoc" not in base_name:
                base_name = f"{base_name} Phú Quốc"
                
            slug = f"{fake.slug(base_name)[:38]}-{uuid.uuid4().hex[:8]}"
            logo = f"https://picsum.photos/id/{random.randint(1,100)}/200/200"
            website = f"https://{fake.domain_name()}"
            description = f"{base_name} là doanh nghiệp hàng đầu tại Phú Quốc hoạt động trong lĩnh vực dịch vụ, du lịch, nghỉ dưỡng và phát triển cộng đồng địa phương."
            
            # Pick a Phu Quoc ward
            ward_slug = random.choice(ward_slugs)
            ward_id = ward_map[ward_slug]
            address_detail = f"Khu phố trung tâm, {ward_slug.replace('-', ' ').title()}, Thành phố Phú Quốc"
            
            size = random.choice(['SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE'])
            industry = random.choice(industries)
            
            companies.append((cid, base_name, slug, logo, website, description, ward_id, address_detail, size, industry, owner_id, True, True, datetime.now(), datetime.now()))
            company_ids.append(cid)
            
        execute_values(cur,
            "INSERT INTO companies (id, name, slug, logo, website, description, \"wardId\", \"addressDetail\", size, industry, \"ownerId\", \"isApproved\", \"isActive\", \"createdAt\", \"updatedAt\") VALUES %s",
            companies
        )
        print(f"Successfully inserted {len(company_ids)} companies.")

        # 7. Generate 5000 Jobs in Phú Quốc
        print("Generating 5000 Jobs in Phú Quốc...")
        jobs = []
        job_ids = []
        job_types = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'FREELANCE']
        exp_levels = ['NO_EXPERIENCE', 'UNDER_1_YEAR', 'ONE_TO_THREE_YEARS', 'THREE_TO_FIVE_YEARS', 'OVER_FIVE_YEARS']
        job_levels = ['INTERN', 'FRESHER', 'JUNIOR', 'MID', 'SENIOR', 'LEAD', 'MANAGER', 'DIRECTOR']
        
        categories_keys = list(job_templates.keys())

        for i in range(5000):
            jid = generate_cuid('j')
            comp_id = random.choice(company_ids)
            
            # Choose category
            cat_name = random.choice(categories_keys)
            cat_id = db_categories.get(category_id_map[cat_name].lower())
            if not cat_id:
                # Fallback to any category
                cat_id = list(db_categories.values())[0]
            
            # Pick a template
            template = random.choice(job_templates[cat_name])
            
            # Add some randomness to the title to avoid exact duplicates
            extra_tags = ["", " (Lương Cao)", " - Đi Làm Ngay", " - Resort 5 Sao", " - Nam Đảo", " - Bắc Đảo", " (Hỗ trợ ăn ở)"]
            title = f"{template['title']}{random.choice(extra_tags)}"
            
            slug = f"{fake.slug(title)[:38]}-{uuid.uuid4().hex[:8]}"
            description = template['desc'] + "\n\n" + fake.paragraph(nb_sentences=4)
            requirements = template['req'] + "\n\n" + fake.paragraph(nb_sentences=2)
            benefits = template['ben'] + "\n\n" + fake.paragraph(nb_sentences=2)
            
            quantity = random.randint(1, 15)
            salary_min = random.choice([6, 8, 10, 12, 15, 20, 25, 30, None])
            if salary_min:
                salary_max = salary_min + random.choice([2, 4, 6, 8, 10, 15])
                # Convert to raw currency integers if the DB column expects standard numbers or in millions
                # Let's check from seed_faker.py: salary_min = random.choice([5000000, 10000000, ...])
                # Ah, it expects raw currency values like 8,000,000! Let's multiply by 1,000,000.
                salary_min = salary_min * 1000000
                salary_max = salary_max * 1000000
            else:
                salary_max = None
                
            # Pick a Phu Quoc ward
            ward_slug = random.choice(ward_slugs)
            ward_id = ward_map[ward_slug]
            address_detail = f"Khu phố trung tâm, {ward_slug.replace('-', ' ').title()}, Phú Quốc"
            
            jtype = random.choice(job_types)
            exp = random.choice(exp_levels)
            lvl = random.choice(job_levels)
            status = 'ACTIVE'
            reject_reason = None
            deadline = datetime.now() + timedelta(days=random.randint(15, 75))
            is_visible = True
            
            views_count = random.randint(10, 300)
            applies_count = random.randint(0, int(views_count * 0.15) + 1)
            
            jobs.append((
                jid, title, slug, description, benefits, requirements, quantity, salary_min, salary_max,
                ward_id, address_detail, jtype, exp, lvl, status, reject_reason, deadline, is_visible,
                cat_id, comp_id, datetime.now(), datetime.now(), views_count, applies_count
            ))
            job_ids.append(jid)

        execute_values(cur,
            "INSERT INTO jobs (id, title, slug, description, benefits, requirements, quantity, \"salaryMin\", \"salaryMax\", "
            "\"wardId\", \"addressDetail\", type, experience, level, status, \"rejectReason\", deadline, \"isVisible\", "
            "\"categoryId\", \"companyId\", \"createdAt\", \"updatedAt\", views_count, applies_count) VALUES %s",
            jobs
        )
        print(f"Successfully inserted {len(job_ids)} jobs.")

        # 8. Generate Dummy Embeddings for all 5000 jobs to avoid Celery queue choke
        print("Generating 5000 dummy embeddings (768-dim) in database...")
        job_embeddings = []
        for jid in job_ids:
            vector = generate_random_vector(768)
            job_embeddings.append((jid, vector))
            
        execute_values(cur,
            "INSERT INTO job_embeddings (job_id, embedding) VALUES %s",
            job_embeddings,
            template="(%s, %s::vector)"
        )
        print(f"Successfully inserted {len(job_embeddings)} job embeddings.")

        # 9. Generate Blogs with loadable images (Unsplash) and Phú Quốc topics
        print("Generating Phu Quoc Blogs with loadable images...")
        blogs = []
        for i, template in enumerate(blog_templates):
            bid = generate_cuid('b')
            title = template['title']
            slug = f"{fake.slug(title)[:38]}-{uuid.uuid4().hex[:8]}"
            content = template['content']
            excerpt = template['excerpt']
            cat_id = random.choice(bcat_ids)
            author_id = random.choice(admin_ids)
            views = random.randint(100, 2500)
            thumbnail = blog_images[i % len(blog_images)]
            
            blogs.append((bid, title, slug, content, excerpt, cat_id, author_id, views, True, 'RICH_TEXT', thumbnail, datetime.now(), datetime.now()))
            
        execute_values(cur,
            "INSERT INTO blogs (id, title, slug, content, excerpt, \"categoryId\", \"authorId\", views, \"isPublished\", type, thumbnail, \"createdAt\", \"updatedAt\") VALUES %s",
            blogs
        )
        print(f"Successfully inserted {len(blogs)} blogs.")

        # Commit everything
        conn.commit()
        print("\nSUCCESS: All Phú Quốc database seeding steps committed successfully!")

    except Exception as e:
        conn.rollback()
        print(f"\nERROR: An error occurred during database seeding: {e}")
        raise e
    finally:
        cur.close()
        conn.close()

if __name__ == '__main__':
    seed_data()
