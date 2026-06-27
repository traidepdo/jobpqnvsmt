'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface Category {
  id: string;
  name: string;
  slug?: string;
}

interface InteractiveCareerToolProps {
  categories: Category[];
  isLoggedIn: boolean;
  isEmployer: boolean;
}

export default function InteractiveCareerTool({
  categories,
  isLoggedIn,
  isEmployer,
}: InteractiveCareerToolProps) {
  const [activeTab, setActiveTab] = useState<'candidate' | 'employer'>(
    isEmployer ? 'employer' : 'candidate'
  );

  // Form states
  const [categoryId, setCategoryId] = useState('');
  const [slugCategory, setSlugCategory] = useState('');
  const [level, setLevel] = useState('JUNIOR');
  const [experience, setExperience] = useState('ONE_TO_THREE_YEARS');
  const [type, setType] = useState('FULL_TIME');
  const [quantity, setQuantity] = useState(1);

  // Result states
  const [loading, setLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState('');
  const [result, setResult] = useState<{
    predictedSalary: number;
    description: string;
    difficulty: 'Dễ' | 'Trung bình' | 'Khó';
  } | null>(null);

  // Loading animation simulation phases
  useEffect(() => {
    if (!loading) return;
    const phases = [
      'Đang nạp tham số mô hình AI...',
      'Đang đối chiếu dữ liệu tuyển dụng tại Phú Quốc...',
      'Đang tính toán phân bố mức lương...',
      'Đang hoàn tất phân tích đề xuất...'
    ];
    let i = 0;
    setLoadingPhase(phases[0]);
    const interval = setInterval(() => {
      i++;
      if (i < phases.length) {
        setLoadingPhase(phases[i]);
      }
    }, 450);
    return () => clearInterval(interval);
  }, [loading]);

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/public/salary/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          experience,
          level,
          type,
          categoryId,
          slugCategory,
        }),
      });
      const data = await res.json();

      // Artificial delay for premium loader experience
      setTimeout(() => {
        if (data && !data.error) {
          const predicted = data.predictedSalary || 8.5;
          let diff: 'Dễ' | 'Trung bình' | 'Khó' = 'Trung bình';
          if (level === 'SENIOR' || level === 'MANAGER') diff = 'Khó';
          else if (level === 'INTERN') diff = 'Dễ';

          setResult({
            predictedSalary: predicted,
            description: getAdvice(categoryId, level, experience),
            difficulty: diff
          });
        } else {
          // Fallback static calculation if API fails
          setResult({
            predictedSalary: calculateFallbackSalary(),
            description: 'Đã ước tính dựa trên dữ liệu thống kê chung.',
            difficulty: 'Trung bình'
          });
        }
        setLoading(false);
      }, 1800);
    } catch (err) {
      console.error(err);
      setTimeout(() => {
        setResult({
          predictedSalary: calculateFallbackSalary(),
          description: 'Đã ước tính dựa trên dữ liệu dự phòng.',
          difficulty: 'Trung bình'
        });
        setLoading(false);
      }, 1800);
    }
  };

  const calculateFallbackSalary = () => {
    let base = 7.5;
    if (level === 'INTERN') base = 4.0;
    else if (level === 'FRESHER') base = 6.0;
    else if (level === 'MID') base = 12.0;
    else if (level === 'SENIOR') base = 18.0;
    else if (level === 'MANAGER') base = 25.0;

    if (experience === 'THREE_TO_FIVE_YEARS') base += 2.5;
    else if (experience === 'OVER_FIVE_YEARS') base += 5.0;

    if (type === 'PART_TIME' || type === 'INTERNSHIP') base *= 0.5;
    return base;
  };

  const getAdvice = (catId: string, lvl: string, exp: string) => {
    const categoryName = categories.find(c => c.id === catId)?.name || 'ngành nghề của bạn';

    // 1. Phân tích thị trường Phú Quốc theo nhóm ngành
    let marketInfo = '';
    const nameLower = categoryName.toLowerCase();
    if (nameLower.includes('khách sạn') || nameLower.includes('nhà hàng') || nameLower.includes('du lịch') || nameLower.includes('dịch vụ') || nameLower.includes('ẩm thực') || nameLower.includes('f&b')) {
      const variants = [
        `Phú Quốc đang có nhu cầu cực kỳ lớn về nhân sự ${categoryName} phục vụ mùa cao điểm du lịch và các tổ hợp nghỉ dưỡng 5 sao.`,
        `Thị trường du lịch - dịch vụ tại Phú Quốc liên tục phát triển, tạo ra sức hút lớn cho nhân lực nhóm ngành ${categoryName}.`,
        `Ngành ${categoryName} đang là trụ cột tuyển dụng tại Đảo Ngọc với hàng loạt resort, nhà hàng cao cấp đang mở rộng quy mô.`
      ];
      marketInfo = variants[Math.floor(Math.random() * variants.length)];
    } else if (nameLower.includes('công nghệ') || nameLower.includes('it') || nameLower.includes('tin học') || nameLower.includes('marketing') || nameLower.includes('truyền thông') || nameLower.includes('thiết kế')) {
      const variants = [
        `Nhóm ngành công nghệ & truyền thông (${categoryName}) tại Phú Quốc đang có xu hướng dịch chuyển mạnh mẽ hướng tới các mô hình làm việc số hóa và linh hoạt.`,
        `Nhu cầu chuyển đổi số của các doanh nghiệp Phú Quốc đang tạo ra cơ hội nghề nghiệp đầy tiềm năng cho vị trí ${categoryName}.`,
        `Vị trí ${categoryName} tại Phú Quốc đang có xu hướng trả thu nhập cao để thu hút nhân tài từ các thành phố lớn ra Đảo Ngọc.`
      ];
      marketInfo = variants[Math.floor(Math.random() * variants.length)];
    } else {
      const variants = [
        `Nhân sự vai trò ${categoryName} tại Phú Quốc đang ghi nhận tốc độ tăng trưởng tuyển dụng ổn định cùng với đà phát triển kinh tế của đảo.`,
        `Nhu cầu nhân lực cho nhóm ngành ${categoryName} tại các doanh nghiệp địa phương và tập đoàn liên tục được duy trì ở mức khá tốt.`,
        `Đảo Ngọc Phú Quốc luôn mở rộng cửa chào đón các nhân tố tiềm năng và giàu năng lượng ở vị trí ${categoryName}.`
      ];
      marketInfo = variants[Math.floor(Math.random() * variants.length)];
    }

    // 2. Lời khuyên theo cấp bậc (Level advice)
    let levelAdvice = '';
    if (lvl === 'INTERN' || lvl === 'FRESHER') {
      levelAdvice = `Với cấp bậc ${getLevelLabel(lvl)}, nhà tuyển dụng tại Phú Quốc đánh giá rất cao tinh thần ham học hỏi, sự chủ động và khả năng ngoại ngữ giao tiếp cơ bản.`;
    } else if (lvl === 'JUNIOR') {
      levelAdvice = `Là một ${getLevelLabel(lvl)}, bạn nên làm nổi bật năng lực chuyên môn thực chiến, khả năng làm việc độc lập và kỹ năng xử lý tình huống linh hoạt của mình.`;
    } else if (lvl === 'MID' || lvl === 'SENIOR') {
      levelAdvice = `Với năng lực ${getLevelLabel(lvl)}, bạn đang nắm giữ lợi thế đàm phán rất tốt. Hãy làm nổi bật các thành tích nổi bật và dự án thực tế đã từng tham gia vận hành thành công.`;
    } else {
      levelAdvice = `Vai trò lãnh đạo/quản lý (${getLevelLabel(lvl)}) đòi hỏi kỹ năng tổ chức đội ngũ, tầm nhìn chiến lược và khả năng tối ưu hóa quy trình làm việc hiệu quả.`;
    }

    // 3. Động viên (Call to action)
    const callToActions = [
      `Khuyến khích bạn chuẩn bị một CV thật chỉn chu để nắm bắt ngay các cơ hội từ những thương hiệu hàng đầu Phú Quốc.`,
      `Hãy cập nhật và tối ưu hóa hồ sơ năng lực của bạn ngay hôm nay để lọt vào mắt xanh của các nhà tuyển dụng.`,
      `Đây là thời điểm vàng để bạn chuẩn bị sẵn sàng hồ sơ và bắt đầu nộp đơn ứng tuyển vào các cơ hội mơ ước.`
    ];
    const ctaText = callToActions[Math.floor(Math.random() * callToActions.length)];

    return `${marketInfo} ${levelAdvice} ${ctaText}`;
  };

  const getLevelLabel = (lvl: string) => {
    switch (lvl) {
      case 'INTERN': return 'Thực tập sinh';
      case 'FRESHER': return 'Fresher';
      case 'JUNIOR': return 'Junior';
      case 'MID': return 'Mid-level';
      case 'SENIOR': return 'Senior';
      case 'LEAD': return 'Team Lead';
      case 'MANAGER': return 'Manager';
      default: return lvl;
    }
  };

  return (
    <section className="py-24 px-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center mb-16 relative">
        {/* Decorative subtle background glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-green-200/20 rounded-full blur-3xl pointer-events-none" />
        
        <span className="inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full mb-4 border border-emerald-100 shadow-[0_2px_12px_rgba(16,185,129,0.08)]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          Mã Hóa Lương Bằng AI
        </span>
        <h2 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight">
          Khảo Sát & Ước Tính <span className="bg-gradient-to-r from-emerald-600 to-green-500 bg-clip-text text-transparent">Thu Nhập AI</span>
        </h2>
        <p className="text-gray-500 text-sm md:text-base mt-4 max-w-2xl mx-auto leading-relaxed">
          Sử dụng mô hình phân tích hồi quy nâng cao kết hợp dữ liệu thị trường thực tế tại Phú Quốc, giúp tối ưu hóa ngân sách cho nhà tuyển dụng và định giá năng lực cho ứng viên.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Main form card */}
        <div className="lg:col-span-7 bg-white rounded-[32px] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.03)] p-6 md:p-8 flex flex-col justify-between relative overflow-hidden transition-all duration-500 hover:shadow-[0_30px_70px_rgba(0,0,0,0.06)]">
          {/* Decorative glowing gradient blur */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#00b14f]/5 rounded-full blur-2xl pointer-events-none" />

          <div>
            {/* Tab switch buttons */}
            <div className="flex bg-slate-100/80 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200/50 mb-8 relative">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('candidate');
                  setResult(null);
                }}
                className={`flex-1 py-3 text-xs md:text-sm font-extrabold rounded-xl transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 ${
                  activeTab === 'candidate'
                    ? 'bg-white text-emerald-600 shadow-md shadow-emerald-600/5 border border-slate-100'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span className="material-symbols-outlined text-base">person</span>
                Ứng viên tuyển dụng
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('employer');
                  setResult(null);
                }}
                className={`flex-1 py-3 text-xs md:text-sm font-extrabold rounded-xl transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 ${
                  activeTab === 'employer'
                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-950/20'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span className="material-symbols-outlined text-base">domain</span>
                Nhà tuyển dụng
              </button>
            </div>

            {/* Title description of selected tab */}
            <div className="mb-6">
              <h3 className="text-lg font-black text-gray-900 leading-snug">
                {activeTab === 'candidate'
                  ? 'Tra cứu mức lương kỳ vọng của bạn'
                  : 'Ước lượng ngân sách & độ khó tuyển dụng'}
              </h3>
              <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
                {activeTab === 'candidate'
                  ? 'Điền thông tin vai trò để ước lượng mức thu nhập trung bình thực tế tại Đảo Ngọc Phú Quốc.'
                  : 'Hỗ trợ tính toán mức chi phí và thời gian cần thiết để tuyển thành công vị trí này.'}
              </p>
            </div>

            {/* Predictor Form */}
            <form onSubmit={handlePredict} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Category Selector */}
                <div className="relative group">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Ngành nghề *</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-lg group-focus-within:text-emerald-500 transition-colors">work</span>
                    <select
                      value={categoryId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCategoryId(val);
                        const cat = categories.find((c) => c.id === val);
                        setSlugCategory(cat?.slug || '');
                      }}
                      required
                      className="w-full h-12 pl-11 pr-10 text-xs bg-slate-50 border border-slate-200/80 rounded-xl outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all cursor-pointer appearance-none"
                    >
                      <option value="">Chọn ngành nghề</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 pointer-events-none text-base">expand_more</span>
                  </div>
                </div>

                {/* Level Selector */}
                <div className="relative group">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Cấp bậc yêu cầu</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-lg group-focus-within:text-emerald-500 transition-colors">military_tech</span>
                    <select
                      value={level}
                      onChange={(e) => setLevel(e.target.value)}
                      className="w-full h-12 pl-11 pr-10 text-xs bg-slate-50 border border-slate-200/80 rounded-xl outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all cursor-pointer appearance-none"
                    >
                      <option value="INTERN">Thực tập sinh</option>
                      <option value="FRESHER">Fresher (Mới ra trường)</option>
                      <option value="JUNIOR">Junior (1 - 2 năm)</option>
                      <option value="MID">Mid-level (2 - 5 năm)</option>
                      <option value="SENIOR">Senior (Trên 5 năm)</option>
                      <option value="LEAD">Team Lead / Trưởng nhóm</option>
                      <option value="MANAGER">Manager / Trưởng phòng</option>
                    </select>
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 pointer-events-none text-base">expand_more</span>
                  </div>
                </div>

                {/* Experience Selector */}
                <div className="relative group">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Kinh nghiệm tối thiểu</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-lg group-focus-within:text-emerald-500 transition-colors">history_edu</span>
                    <select
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      className="w-full h-12 pl-11 pr-10 text-xs bg-slate-50 border border-slate-200/80 rounded-xl outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all cursor-pointer appearance-none"
                    >
                      <option value="NO_EXPERIENCE">Chưa có kinh nghiệm</option>
                      <option value="UNDER_1_YEAR">Dưới 1 năm kinh nghiệm</option>
                      <option value="ONE_TO_THREE_YEARS">Từ 1 - 3 năm</option>
                      <option value="THREE_TO_FIVE_YEARS">Từ 3 - 5 năm</option>
                      <option value="OVER_FIVE_YEARS">Trên 5 năm</option>
                    </select>
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 pointer-events-none text-base">expand_more</span>
                  </div>
                </div>

                {/* Job type Selector */}
                <div className="relative group">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Hình thức làm việc</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-lg group-focus-within:text-emerald-500 transition-colors">schedule</span>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="w-full h-12 pl-11 pr-10 text-xs bg-slate-50 border border-slate-200/80 rounded-xl outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all cursor-pointer appearance-none"
                    >
                      <option value="FULL_TIME">Toàn thời gian (Full-time)</option>
                      <option value="PART_TIME">Bán thời gian (Part-time)</option>
                      <option value="CONTRACT">Hợp đồng ngắn hạn</option>
                      <option value="INTERNSHIP">Thực tập</option>
                      <option value="REMOTE">Làm từ xa (Remote)</option>
                    </select>
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 pointer-events-none text-base">expand_more</span>
                  </div>
                </div>
              </div>

              {/* Employer Specific quantity slider */}
              {activeTab === 'employer' && (
                <div className="pt-4 pb-2 animate-fadeIn">
                  <div className="flex justify-between items-center mb-3">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">Số lượng nhân sự cần tuyển</label>
                    <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-100 shadow-sm flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">group</span>
                      {quantity} nhân sự
                    </span>
                  </div>
                  <div className="relative flex items-center">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-500 animate-fadeIn"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`w-full mt-8 py-4 rounded-xl font-bold text-xs uppercase tracking-widest shadow-sm transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10 hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-2 ${
                  activeTab === 'candidate'
                    ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white active:scale-95 disabled:from-emerald-300 disabled:to-green-400 shadow-md shadow-emerald-500/10'
                    : 'bg-slate-900 hover:bg-slate-800 text-white active:scale-95 disabled:bg-slate-400 shadow-md shadow-slate-900/10'
                }`}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Đang phân tích thị trường...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm font-bold">insights</span>
                    <span>{activeTab === 'candidate' ? 'Bắt đầu phân tích lương' : 'Tính toán chi phí dự kiến'}</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* AI Result Card */}
        <div className={`lg:col-span-5 rounded-[32px] border border-slate-100 p-6 md:p-8 flex flex-col justify-between relative overflow-hidden transition-all duration-500 shadow-[0_20px_50px_rgba(0,0,0,0.02)] ${
          activeTab === 'candidate'
            ? 'bg-gradient-to-br from-emerald-50/40 via-white to-green-50/20'
            : 'bg-gradient-to-br from-slate-50/50 via-white to-slate-100/30'
        }`}>
          {/* Loading indicator page */}
          {loading ? (
            <div className="flex-grow flex flex-col items-center justify-center text-center p-8 animate-pulse">
              <div className="relative w-24 h-24 mb-8">
                {/* Pulsing ring */}
                <div className={`absolute inset-0 rounded-full border-4 border-dashed animate-[spin_8s_linear_infinite] ${
                  activeTab === 'candidate' ? 'border-emerald-500/40' : 'border-slate-800/40'
                }`} />
                {/* Second glowing ring */}
                <div className={`absolute -inset-2 rounded-full border border-dotted animate-[spin_4s_linear_infinite] ${
                  activeTab === 'candidate' ? 'border-emerald-400/20' : 'border-slate-600/20'
                }`} />
                {/* Center avatar */}
                <div className="absolute inset-3 bg-white rounded-full shadow-lg flex items-center justify-center text-3xl">
                  🧠
                </div>
              </div>
              <p className="text-sm font-black text-slate-800 mb-2 animate-bounce">{loadingPhase}</p>
              <span className="text-[10px] text-slate-400 bg-slate-100/80 px-2.5 py-1 rounded-full font-medium">
                Dựa trên mô hình Ridge Regression từ Phú Quốc Jobs
              </span>
            </div>
          ) : result ? (
            /* Analysis results */
            <div className="flex-grow flex flex-col justify-between h-full animate-[fadeIn_0.6s_cubic-bezier(0.16,1,0.3,1)]">
              <div>
                <span className={`inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border mb-6 ${
                  activeTab === 'candidate'
                    ? 'bg-emerald-50 border-emerald-200/60 text-emerald-800'
                    : 'bg-slate-100 border-slate-200/60 text-slate-700'
                }`}>
                  <span className="material-symbols-outlined text-[12px] font-bold">check_circle</span>
                  Đã hoàn thành phân tích
                </span>

                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">MỨC LƯƠNG TRUNG BÌNH ĐỀ XUẤT</p>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className={`text-5xl font-black tracking-tight ${
                    activeTab === 'candidate' ? 'text-emerald-600' : 'text-slate-900'
                  }`}>
                    {result.predictedSalary.toFixed(1)}
                  </span>
                  <span className="text-sm font-black text-slate-400">triệu VNĐ/tháng</span>
                </div>

                {activeTab === 'employer' && quantity > 1 && (
                  <div className="mb-6 p-4 bg-slate-900 text-white rounded-2xl shadow-md shadow-slate-900/10 border border-slate-800">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Tổng ngân sách dự kiến ({quantity} nhân sự):</p>
                    <p className="text-lg font-black mt-1 text-emerald-400">
                      {(result.predictedSalary * quantity).toFixed(1)} triệu VNĐ / tháng
                    </p>
                  </div>
                )}

                {/* Visual Salary Chart by Level */}
                {(() => {
                  const levelsToCompare = ['INTERN', 'FRESHER', 'JUNIOR', 'MID', 'SENIOR'];
                  const getLevelWeight = (l: string) => {
                    switch (l) {
                      case 'INTERN': return 1.5;
                      case 'FRESHER': return 2.2;
                      case 'JUNIOR': return 3.2;
                      case 'MID': return 4.8;
                      case 'SENIOR': return 6.8;
                      default: return 3.2;
                    }
                  };

                  const compareData = levelsToCompare.map(l => {
                    const ratio = getLevelWeight(l) / getLevelWeight(level);
                    let sal = result.predictedSalary * ratio;
                    sal = Math.round(sal * 10) / 10;
                    return {
                      levelCode: l,
                      label: l === 'INTERN' ? 'T.Tập' : l === 'FRESHER' ? 'Fresh' : l === 'JUNIOR' ? 'Jun' : l === 'MID' ? 'Mid' : 'Sen',
                      salary: sal,
                      isActive: l === level
                    };
                  });

                  const maxSalary = Math.max(...compareData.map(d => d.salary));

                  return (
                    <div className="mt-6 bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center justify-between">
                        <span>📊 Thống kê theo cấp bậc</span>
                        <span className="text-[9px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md font-bold max-w-[150px] truncate">
                          Ngành: {categories.find(c => c.id === categoryId)?.name || 'Đã chọn'}
                        </span>
                      </h4>

                      {/* Custom Chart grid background lines */}
                      <div className="h-36 flex items-end justify-between gap-3 pt-4 relative">
                        {/* Background guide lines */}
                        <div className="absolute inset-x-0 bottom-4 top-0 flex flex-col justify-between pointer-events-none opacity-40">
                          <div className="border-b border-dashed border-slate-100 w-full" />
                          <div className="border-b border-dashed border-slate-100 w-full" />
                          <div className="border-b border-dashed border-slate-100 w-full" />
                        </div>

                        {compareData.map((d) => {
                          const heightPercent = (d.salary / maxSalary) * 100;
                          return (
                            <div key={d.levelCode} className="flex-1 flex flex-col items-center h-full justify-end group z-10">
                              {/* Value text above bar */}
                              <span className={`text-[10px] font-black mb-2 transition-colors duration-300 ${
                                d.isActive
                                  ? (activeTab === 'candidate' ? 'text-emerald-600' : 'text-slate-800')
                                  : 'text-slate-400 group-hover:text-slate-700'
                              }`}>
                                {d.salary.toFixed(1)}
                              </span>

                              {/* Vertical Bar */}
                              <div
                                style={{ height: `${Math.max(12, heightPercent)}%` }}
                                className={`w-full rounded-t-lg transition-all duration-500 relative ${
                                  d.isActive
                                    ? (activeTab === 'candidate'
                                      ? 'bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-[0_4px_16px_rgba(16,185,129,0.35)]'
                                      : 'bg-gradient-to-t from-slate-900 to-slate-700 shadow-[0_4px_16px_rgba(15,23,42,0.3)]')
                                    : (activeTab === 'candidate'
                                      ? 'bg-emerald-100/50 hover:bg-emerald-200/60'
                                      : 'bg-slate-100 hover:bg-slate-200')
                                }`}
                              >
                                {d.isActive && (
                                  <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white border-2 border-emerald-500 shadow-md animate-pulse" />
                                )}
                              </div>

                              {/* Label */}
                              <span className={`text-[10px] font-bold mt-2.5 transition-colors ${
                                d.isActive ? 'text-slate-900 font-black' : 'text-slate-400'
                              }`}>
                                {d.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* AI Evaluation bubble */}
                <div className="mt-6 p-4 rounded-2xl bg-white border border-slate-100 relative shadow-[inset_0_2px_4px_rgba(0,0,0,0.01)] flex gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm shrink-0 shadow-sm ${
                    activeTab === 'candidate'
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-slate-900 text-white'
                  }`}>
                    🤖
                  </div>
                  <div>
                    <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Đánh giá từ AI</h5>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      {result.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Dynamic CTA box */}
              <div className="mt-8 pt-6 border-t border-slate-150/60">
                {activeTab === 'candidate' ? (
                  <div className="space-y-2.5">
                    <Link
                      href={isLoggedIn ? "/tao-cv" : "/login?callbackUrl=/tao-cv"}
                      className="flex items-center justify-center gap-2 w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg hover:shadow-emerald-500/10 hover:-translate-y-0.5 transition-all duration-300"
                    >
                      <span className="material-symbols-outlined text-sm font-bold">description</span>
                      {isLoggedIn ? 'Tạo CV với đề xuất này' : 'Đăng nhập & Tạo CV ngay'}
                    </Link>
                    <Link
                      href={`/jobs?category=${slugCategory}`}
                      className="flex items-center justify-center gap-2 w-full py-3.5 bg-white border border-slate-200 text-slate-600 hover:text-emerald-600 hover:border-emerald-200 font-bold text-xs rounded-xl hover:-translate-y-0.5 hover:shadow-sm transition-all duration-300"
                    >
                      <span className="material-symbols-outlined text-sm font-bold">search</span>
                      Tìm việc làm cùng ngành
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <Link
                      href={isLoggedIn ? (isEmployer ? "/employer/jobs/new" : "/register/employer") : "/login?callbackUrl=/employer/jobs/new"}
                      className="flex items-center justify-center gap-2 w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                    >
                      <span className="material-symbols-outlined text-sm font-bold">publish</span>
                      Đăng tin tuyển dụng ngay
                    </Link>
                    <Link
                      href={isLoggedIn ? "/employer/candidates" : "/login?callbackUrl=/employer/candidates"}
                      className="flex items-center justify-center gap-2 w-full py-3.5 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 font-bold text-xs rounded-xl hover:-translate-y-0.5 hover:shadow-sm transition-all duration-300"
                    >
                      <span className="material-symbols-outlined text-sm font-bold">people</span>
                      Khảo sát danh sách ứng viên
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Idle state page */
            <div className="flex-grow flex flex-col justify-between text-center p-8 items-center">
              <div className="my-auto space-y-4">
                <div className="w-20 h-20 rounded-[24px] bg-gradient-to-br from-emerald-400/10 to-green-500/20 text-4xl flex items-center justify-center mx-auto mb-6 shadow-sm shadow-emerald-500/5 relative group">
                  <div className="absolute -inset-1 rounded-[24px] bg-emerald-400/20 blur-md opacity-70 group-hover:opacity-100 transition-opacity animate-pulse" />
                  <span className="relative">💡</span>
                </div>
                <h4 className="text-base font-black text-slate-800">
                  Chờ thiết lập tham số
                </h4>
                <p className="text-xs text-slate-400 max-w-[240px] mx-auto leading-relaxed">
                  Chọn ngành nghề, cấp bậc và hình thức ở biểu mẫu bên cạnh để AI phân tích chi tiết thị trường Phú Quốc.
                </p>
              </div>
              <div className="text-[10px] text-slate-300 font-bold uppercase tracking-wider border-t border-slate-100 pt-4 w-full">
                Phú Quốc Jobs
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
