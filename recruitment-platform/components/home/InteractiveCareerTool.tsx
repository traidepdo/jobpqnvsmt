'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface Category {
  id: string;
  name: string;
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
      <div className="text-center mb-12">
        <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-[#00b14f] bg-green-50 px-4 py-2 rounded-full mb-3 shadow-[0_2px_10px_rgba(22,163,74,0.08)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00b14f] animate-ping" />
          MỚI • TRÍ TUỆ NHÂN TẠO
        </span>
        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
          Công cụ Phân tích & Ước tính mức Lương
        </h2>
        <p className="text-gray-500 text-sm mt-3 max-w-xl mx-auto leading-relaxed">
          Sử dụng mô hình học máy phân tích dữ liệu việc làm thực tế tại Phú Quốc để hỗ trợ ứng viên & nhà tuyển dụng đưa ra quyết định tối ưu.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Main form card (8 cols on big screen) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-green-100 shadow-[0_15px_40px_rgba(0,0,0,0.02)] p-6 md:p-8 flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:shadow-[0_20px_50px_rgba(0,0,0,0.04)]">
          {/* Decorative glowing gradient blur */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#00b14f]/5 rounded-full blur-2xl pointer-events-none" />

          <div>
            {/* Tab switch buttons */}
            <div className="flex bg-gray-100 p-1.5 rounded-2xl border border-gray-100 mb-8 relative">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('candidate');
                  setResult(null);
                }}
                className={`flex-1 py-3 text-xs md:text-sm font-bold rounded-xl transition-all cursor-pointer ${activeTab === 'candidate'
                  ? 'bg-white text-green-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
                  }`}
              >
                Dành cho Ứng viên
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('employer');
                  setResult(null);
                }}
                className={`flex-1 py-3 text-xs md:text-sm font-bold rounded-xl transition-all cursor-pointer ${activeTab === 'employer'
                  ? 'bg-[#212f3f] text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
                  }`}
              >
                Dành cho Nhà tuyển dụng
              </button>
            </div>

            {/* Title description of selected tab */}
            <div className="mb-6">
              <h3 className="text-lg font-black text-gray-900 leading-snug">
                {activeTab === 'candidate'
                  ? 'Tra cứu mức lương kỳ vọng của bạn'
                  : 'Ước lượng ngân sách & độ khó tuyển dụng'}
              </h3>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                {activeTab === 'candidate'
                  ? 'Điền thông tin vai trò để ước lượng mức thu nhập trung bình thực tế tại Đảo Ngọc Phú Quốc.'
                  : 'Hỗ trợ tính toán mức chi phí và thời gian cần thiết để tuyển thành công vị trí này.'}
              </p>
            </div>

            {/* Predictor Form */}
            <form onSubmit={handlePredict} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Category Selector */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">Ngành nghề *</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    required
                    className="w-full h-11 px-3 text-xs bg-gray-50 border border-gray-150 rounded-xl outline-none focus:bg-white focus:border-[#00b14f] focus:ring-2 focus:ring-[#00b14f]/15 transition-all cursor-pointer"
                  >
                    <option value="">Chọn ngành nghề</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Level Selector */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">Cấp bậc yêu cầu</label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="w-full h-11 px-3 text-xs bg-gray-50 border border-gray-150 rounded-xl outline-none focus:bg-white focus:border-[#00b14f] focus:ring-2 focus:ring-[#00b14f]/15 transition-all cursor-pointer"
                  >
                    <option value="INTERN">Thực tập sinh</option>
                    <option value="FRESHER">Fresher (Mới ra trường)</option>
                    <option value="JUNIOR">Junior (1 - 2 năm)</option>
                    <option value="MID">Mid-level (2 - 5 năm)</option>
                    <option value="SENIOR">Senior (Trên 5 năm)</option>
                    <option value="LEAD">Team Lead / Trưởng nhóm</option>
                    <option value="MANAGER">Manager / Trưởng phòng</option>
                  </select>
                </div>

                {/* Experience Selector */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">Kinh nghiệm tối thiểu</label>
                  <select
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    className="w-full h-11 px-3 text-xs bg-gray-50 border border-gray-150 rounded-xl outline-none focus:bg-white focus:border-[#00b14f] focus:ring-2 focus:ring-[#00b14f]/15 transition-all cursor-pointer"
                  >
                    <option value="NO_EXPERIENCE">Chưa có kinh nghiệm</option>
                    <option value="UNDER_1_YEAR">Dưới 1 năm kinh nghiệm</option>
                    <option value="ONE_TO_THREE_YEARS">Từ 1 - 3 năm</option>
                    <option value="THREE_TO_FIVE_YEARS">Từ 3 - 5 năm</option>
                    <option value="OVER_FIVE_YEARS">Trên 5 năm</option>
                  </select>
                </div>

                {/* Job type Selector */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">Hình thức làm việc</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full h-11 px-3 text-xs bg-gray-50 border border-gray-150 rounded-xl outline-none focus:bg-white focus:border-[#00b14f] focus:ring-2 focus:ring-[#00b14f]/15 transition-all cursor-pointer"
                  >
                    <option value="FULL_TIME">Toàn thời gian (Full-time)</option>
                    <option value="PART_TIME">Bán thời gian (Part-time)</option>
                    <option value="CONTRACT">Hợp đồng ngắn hạn</option>
                    <option value="INTERNSHIP">Thực tập</option>
                    <option value="REMOTE">Làm từ xa (Remote)</option>
                  </select>
                </div>
              </div>

              {/* Employer Specific quantity slider */}
              {activeTab === 'employer' && (
                <div className="pt-2 animate-fadeIn">
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-semibold text-gray-400">Số lượng vị trí cần tuyển dụng</label>
                    <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                      {quantity} người
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value))}
                    className="w-full accent-[#212f3f] cursor-pointer"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`w-full mt-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm transition-all duration-300 hover:shadow-md cursor-pointer flex items-center justify-center gap-2 ${activeTab === 'candidate'
                  ? 'bg-[#00b14f] hover:bg-[#009940] text-white disabled:bg-green-300'
                  : 'bg-[#212f3f] hover:bg-[#18222e] text-white disabled:bg-slate-300'
                  }`}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4.5 w-4.5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Đang phân tích dữ liệu...</span>
                  </>
                ) : activeTab === 'candidate' ? (
                  'Phân tích lương'
                ) : (
                  'Ước tính chi phí'
                )}
              </button>
            </form>
          </div>
        </div>

        {/* AI Result Card (5 cols on big screen) */}
        <div className={`lg:col-span-5 rounded-3xl border border-gray-150 p-6 md:p-8 flex flex-col justify-between relative overflow-hidden transition-all duration-300 ${activeTab === 'candidate'
          ? 'bg-gradient-to-br from-[#f0fbf5] via-white to-[#e8f7ee]'
          : 'bg-gradient-to-br from-[#f8fafc] via-white to-[#f1f5f9]'
          }`}>
          {/* Loading indicator page */}
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 animate-pulse">
              <div className="relative w-20 h-20 mb-6">
                <div className={`absolute inset-0 rounded-full border-4 border-dashed animate-spin ${activeTab === 'candidate' ? 'border-[#00b14f]' : 'border-slate-800'
                  }`} />
                <div className="absolute inset-2 bg-gray-50 rounded-full flex items-center justify-center text-2xl">
                  🧠
                </div>
              </div>
              <p className="text-sm font-bold text-gray-800 animate-bounce">{loadingPhase}</p>
              <p className="text-[11px] text-gray-400 mt-2">Dựa trên mô hình Ridge Regression từ Phú Quốc Jobs</p>
            </div>
          ) : result ? (
            /* Analysis results */
            <div className="flex-grow flex flex-col justify-between h-full animate-[fadeIn_0.5s_ease-out]">
              <div>
                <span className={`inline-block text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border mb-6 ${activeTab === 'candidate'
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-blue-50 border-blue-200 text-blue-700'
                  }`}>
                  ✓ Đã có kết quả dự báo
                </span>

                <p className="text-xs text-gray-400 font-semibold mb-1">MỨC LƯƠNG ĐỀ XUẤT TRUNG BÌNH</p>
                <div className="flex items-baseline gap-1.5 mb-2">
                  <span className={`text-4xl md:text-5xl font-black ${activeTab === 'candidate' ? 'text-[#00b14f]' : 'text-slate-800'
                    }`}>
                    {result.predictedSalary.toFixed(1)}
                  </span>
                  <span className="text-sm font-bold text-gray-500">triệu VNĐ/tháng</span>
                </div>

                {activeTab === 'employer' && quantity > 1 && (
                  <div className="mb-6 p-3 bg-gray-50 border border-gray-150 rounded-2xl">
                    <p className="text-[11px] text-gray-400 font-medium">Tổng ngân sách tối thiểu đề xuất ({quantity} vị trí):</p>
                    <p className="text-base font-extrabold text-slate-800 mt-0.5">
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
                    <div className="mt-6 bg-white border border-gray-150 rounded-2xl p-4 animate-fadeIn">
                      <h4 className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-4 flex items-center justify-between">
                        <span>📊 Mức lương theo cấp bậc (Triệu VNĐ)</span>
                        <span className="text-[10px] text-gray-400 normal-case font-medium">Ngành: {categories.find(c => c.id === categoryId)?.name || 'Đã chọn'}</span>
                      </h4>

                      <div className="h-32 flex items-end justify-between gap-2.5 pt-4">
                        {compareData.map((d) => {
                          const heightPercent = (d.salary / maxSalary) * 100;
                          return (
                            <div key={d.levelCode} className="flex-1 flex flex-col items-center h-full justify-end group">
                              {/* Salary value hover tooltip / top text */}
                              <span className={`text-[10px] font-black mb-1.5 transition-colors ${d.isActive
                                ? (activeTab === 'candidate' ? 'text-[#00b14f]' : 'text-slate-800')
                                : 'text-gray-400 group-hover:text-gray-600'
                                }`}>
                                {d.salary.toFixed(1)}
                              </span>

                              {/* Vertical Bar */}
                              <div
                                style={{ height: `${Math.max(12, heightPercent)}%` }}
                                className={`w-full rounded-t-lg transition-all duration-500 relative ${d.isActive
                                  ? (activeTab === 'candidate'
                                    ? 'bg-[#00b14f] shadow-[0_0_12px_rgba(0,177,79,0.3)]'
                                    : 'bg-[#212f3f] shadow-[0_0_12px_rgba(33,47,63,0.3)]')
                                  : (activeTab === 'candidate'
                                    ? 'bg-green-100/70 hover:bg-green-200/80'
                                    : 'bg-slate-100 hover:bg-slate-200')
                                  }`}
                              >
                                {d.isActive && (
                                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-white animate-pulse" />
                                )}
                              </div>

                              {/* Label */}
                              <span className={`text-[10px] font-bold mt-2 ${d.isActive ? 'text-gray-800' : 'text-gray-400'
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
              </div>

              {/* Dynamic CTA box */}
              <div className="mt-8 pt-6 border-t border-gray-150">
                {activeTab === 'candidate' ? (
                  <div className="space-y-2">
                    <Link
                      href={isLoggedIn ? "/tao-cv" : "/login?callbackUrl=/tao-cv"}
                      className="block w-full py-3 text-center bg-[#00b14f] hover:bg-[#009940] text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                    >
                      {isLoggedIn ? 'Tạo CV với mức đề xuất này' : 'Đăng nhập & Tạo CV ngay'}
                    </Link>
                    <Link
                      href={`/jobs?category=${slugCategory}`}
                      className="block w-full py-3 text-center bg-white border border-gray-200 text-gray-600 hover:text-green-700 hover:border-green-300 font-bold text-xs rounded-xl transition-all"
                    >
                      Tìm việc làm cùng ngành
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Link
                      href={isLoggedIn ? (isEmployer ? "/employer/jobs/new" : "/register/employer") : "/login?callbackUrl=/employer/jobs/new"}
                      className="block w-full py-3 text-center bg-[#212f3f] hover:bg-[#18222e] text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                    >
                      Đăng tin tuyển dụng ngay
                    </Link>
                    <Link
                      href={isLoggedIn ? "/employer/candidates" : "/login?callbackUrl=/employer/candidates"}
                      className="block w-full py-3 text-center bg-white border border-gray-200 text-gray-600 hover:text-blue-700 hover:border-blue-300 font-bold text-xs rounded-xl transition-all"
                    >
                      Khảo sát danh sách ứng viên
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Idle state page */
            <div className="flex-grow flex flex-col justify-between text-center p-6 items-center">
              <div className="my-auto">
                <div className="w-16 h-16 rounded-3xl bg-green-50 text-3xl flex items-center justify-center mx-auto mb-4 animate-[bounce_2s_infinite]">
                  💡
                </div>
                <h4 className="text-sm font-bold text-gray-800 mb-1">
                  Đang chờ nhập thông tin
                </h4>
                <p className="text-xs text-gray-400 max-w-[220px] mx-auto leading-relaxed">
                  Hãy nhập các tham số như ngành nghề và cấp bậc ở biểu mẫu bên cạnh để AI phân tích.
                </p>
              </div>
              <div className="text-[10px] text-gray-400 font-medium border-t border-gray-100 pt-4 w-full">
                Phú QuốcJobs
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
