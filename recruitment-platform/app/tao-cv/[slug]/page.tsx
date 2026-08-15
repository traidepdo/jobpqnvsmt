'use client'
import React, { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { TEMPLATE_MAP } from '@/template/index';
import SectionOrderManager from '@/components/candidate/SectionOrderManager';
import { FaUser, FaListUl, FaBriefcase, FaSave, FaPlus, FaTrash, FaCheckCircle, FaExternalLinkAlt, FaTimes } from 'react-icons/fa';

interface ResumeTemplate {
  id: string;
  name: string;
  slug: string;
}

interface SectionItem {
  id: string;
  name: string;
}

const DEFAULT_SECTIONS: SectionItem[] = [
  { id: 'summary', name: 'Tóm tắt / Về tôi' },
  { id: 'experience', name: 'Kinh nghiệm làm việc' },
  { id: 'education', name: 'Học vấn' },
  { id: 'projects', name: 'Dự án nổi bật' },
  { id: 'languages', name: 'Ngôn ngữ & kỹ năng' },
];

export default function TaoCvSlugPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const resumeId = searchParams.get('id');

  const [template, setTemplate] = useState<ResumeTemplate | null>(null);
  const [templates, setTemplates] = useState<ResumeTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'sections' | 'details'>('info');
  const [cvTitle, setCvTitle] = useState('Hồ sơ của tôi');
  const [isDefault, setIsDefault] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Unified builder states
  const [userData, setUserData] = useState<any>({
    name: 'Họ và Tên',
    email: '',
    phone: '',
    avatar: 'https://i.pravatar.cc/150?img=12',
  });

  const [resumeData, setResumeData] = useState<any>({
    address: '',
    summary: '',
    degree: '',
    languages: '',
    socicallink: [],
    education: [],
    experience: [],
    projects: [],
  });

  const [sections, setSections] = useState<SectionItem[]>(DEFAULT_SECTIONS);

  // Load template details and CV/user details
  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        // Fetch templates
        const tempRes = await fetch('/api/public/templates');
        const tempData = await tempRes.json();
        if (active && tempData.templates) {
          setTemplates(tempData.templates);
          const found = tempData.templates.find((t: any) => t.slug === slug);
          if (found) {
            setTemplate(found);
          }
        }

        // Fetch resume or user profile
        if (resumeId) {
          const resRes = await fetch(`/api/candidate/resumes/${resumeId}`);
          const resData = await resRes.json();
          if (active && resData.resume) {
            setCvTitle(resData.resume.title || 'Hồ sơ của tôi');
            setIsDefault(resData.resume.isDefault || false);
            const cvName = resData.resume.user?.name || resData.resume.cvData?.name || '';
            const cvEmail = resData.resume.user?.email || resData.resume.cvData?.email || '';
            const cvPhone = resData.resume.user?.phone || resData.resume.cvData?.phone || '';

            const loadedUser = {
              name: cvName,
              email: cvEmail,
              phone: cvPhone,
              avatar: resData.resume.avatarUrl || resData.resume.user?.avatar || 'https://i.pravatar.cc/150?img=12',
            };
            setUserData(loadedUser);

            const loadedResume = {
              address: resData.resume.address || '',
              summary: resData.resume.summary || '',
              degree: resData.resume.degree || '',
              languages: resData.resume.languages || '',
              socicallink: resData.resume.socialLinks || [],
              education: resData.resume.education || [],
              experience: resData.resume.experience || [],
              projects: resData.resume.projects || [],
            };
            setResumeData(loadedResume);

            // Load saved section order if exists
            if (resData.resume.cvData?.sectionOrder && Array.isArray(resData.resume.cvData.sectionOrder)) {
              const orderedIds = resData.resume.cvData.sectionOrder;
              const reordered = orderedIds
                .map((id: string) => DEFAULT_SECTIONS.find(s => s.id === id))
                .filter(Boolean) as SectionItem[];

              // append any missing default sections
              DEFAULT_SECTIONS.forEach(ds => {
                if (!reordered.some(s => s.id === ds.id)) {
                  reordered.push(ds);
                }
              });
              setSections(reordered);
            }
          }
        } else {
          const userRes = await fetch('/api/candidate/user');
          const userData = await userRes.json();
          if (active) {
            if (userData.user) {
              setUserData({
                name: userData.user.name || 'Họ và Tên',
                email: userData.user.email || '',
                phone: userData.user.phone || '',
                avatar: userData.user.avatar || 'https://i.pravatar.cc/150?img=12',
              });

              const mappedExperience = (userData.user.profileExperience || []).map((exp: any) => ({
                company: exp.company || '',
                position: exp.position || '',
                startYear: exp.duration || '',
                endYear: '',
                description: exp.description || '',
              }));

              setResumeData((prev: any) => ({
                ...prev,
                summary: userData.user.profileSummary || '',
                experience: mappedExperience,
              }));
            }
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();
    return () => {
      active = false;
    };
  }, [slug, resumeId]);

  const uploadAvatar = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/upload/image', { method: 'POST', body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload thất bại');
    return data.url;
  };

  const handleTemplateChange = (newSlug: string) => {
    if (newSlug === slug) return;
    if (confirm('Chuyển đổi mẫu CV sẽ không lưu các chỉnh sửa hiện tại. Bạn có muốn tiếp tục?')) {
      router.push(`/tao-cv/${newSlug}${resumeId ? `?id=${resumeId}` : ''}`);
    }
  };

  const handleSave = async (uData = userData, rData = resumeData) => {
    setSaving(true);
    try {
      let avatarUrl = uData.avatar || null;

      // Nếu avatar là blob url (do user chọn ảnh local), tải lên Cloudinary trước
      if (avatarUrl && avatarUrl.startsWith('blob:')) {
        try {
          const response = await fetch(avatarUrl);
          const blob = await response.blob();
          const file = new File([blob], "avatar.jpg", { type: blob.type });
          avatarUrl = await uploadAvatar(file);
        } catch (error) {
          console.error("Avatar upload failed:", error);
          alert("Lỗi tải ảnh đại diện lên Cloudinary. Đang dùng ảnh mặc định.");
          avatarUrl = null;
        }
      }

      const method = resumeId ? 'PUT' : 'POST';
      const url = resumeId ? `/api/candidate/resumes/${resumeId}` : '/api/candidate/resumes';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: uData.name || null,
          title: cvTitle.trim() || (uData.name ? `CV ${uData.name}` : 'Hồ sơ của tôi'),
          isDefault,
          templateId: template?.id || null,
          avatarUrl,
          address: rData.address || null,
          summary: rData.summary || null,
          degree: rData.degree || null,
          languages: rData.languages || null,
          socialLinks: rData.socicallink || [],
          education: rData.education || [],
          experience: rData.experience || [],
          projects: rData.projects || [],
          cvData: {
            name: uData.name,
            email: uData.email,
            phone: uData.phone,
            sectionOrder: sections.map(s => s.id)
          }
        }),
      });

      if (res.ok) {
        setShowSuccessModal(true);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'Không thể lưu CV.');
        if (res.status === 401) {
          router.push(`/login?callbackUrl=/tao-cv/${slug}${resumeId ? `?id=${resumeId}` : ''}`);
        }
      }
    } catch (error) {
      console.error(error);
      alert('Lỗi kết nối.');
    } finally {
      setSaving(false);
    }
  };

  const handleArrayChange = (field: string, index: number, key: string, value: any) => {
    setResumeData((prev: any) => {
      const arr = [...prev[field]];
      arr[index] = { ...arr[index], [key]: value };
      return { ...prev, [field]: arr };
    });
  };

  const addArrayItem = (field: string, defaultObj: any) => {
    setResumeData((prev: any) => ({
      ...prev,
      [field]: [...prev[field], defaultObj],
    }));
  };

  const removeArrayItem = (field: string, index: number) => {
    setResumeData((prev: any) => ({
      ...prev,
      [field]: prev[field].filter((_: any, i: number) => i !== index),
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f8f5]">
        <div className="w-10 h-10 border-[3px] border-gray-200 border-t-[#00b14f] rounded-full animate-spin" />
      </div>
    );
  }

  const TemplateComponent = (TEMPLATE_MAP as any)[slug];

  if (!TemplateComponent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f8f5]">
        <div className="text-center bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-red-500 font-bold mb-2">Không tìm thấy mẫu template tương ứng.</p>
          <p className="text-gray-400 text-sm mb-4">Slug &ldquo;{slug}&rdquo; không hợp lệ hoặc chưa được đăng ký.</p>
          <button onClick={() => router.push('/tao-cv')} className="px-5 py-2.5 bg-[#00b14f] text-white font-semibold rounded-lg">
            Quay lại chọn mẫu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden print:bg-white print:min-h-0 print:h-auto print:overflow-visible">
      {/* Interactive Editor - Hidden during Print */}
      <div className="flex-grow flex flex-col overflow-hidden print:hidden">
        {/* Editor Header Toolbar */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-150 px-6 py-4 flex items-center justify-between shadow-[0_2px_15px_rgba(0,0,0,0.02)] print:hidden">
          <div className="flex items-center gap-4 shrink-0">
            <button
              onClick={() => {
                if (confirm('Quay lại danh sách? Các chỉnh sửa chưa lưu sẽ bị mất.')) {
                  router.push('/tao-cv');
                }
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition cursor-pointer"
            >
              ← Quay lại
            </button>
            <div className="h-4 w-px bg-gray-200" />
            <h1 className="text-xs font-black uppercase tracking-wider text-gray-400">
              {resumeId ? 'Cập nhật hồ sơ' : 'Tạo mới hồ sơ'}
            </h1>
          </div>

          {/* Nhập tên CV & Mặc định */}
          <div className="flex items-center gap-4 flex-grow max-w-sm mx-4">
            <input
              type="text"
              value={cvTitle}
              onChange={(e) => setCvTitle(e.target.value)}
              className="w-full text-xs font-bold text-gray-700 border border-gray-200 rounded-xl px-3.5 py-2.5 focus:border-[#00b14f] focus:ring-4 focus:ring-[#00b14f]/5 focus:outline-none placeholder-gray-450 bg-gray-50/50 transition-all"
              placeholder="Đặt tên cho CV này..."
              title="Tên CV / Hồ sơ"
            />
            <label className="flex items-center gap-2 cursor-pointer select-none shrink-0">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="rounded border-gray-300 text-[#00b14f] focus:ring-[#00b14f] h-4 w-4 cursor-pointer transition-all"
              />
              <span className="text-xs font-bold text-gray-600">Đặt làm mặc định</span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            {templates.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500">Mẫu thiết kế:</span>
                <select
                  value={slug}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  className="text-xs font-bold text-gray-700 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#00b14f] cursor-pointer transition-all"
                >
                  {templates.map(t => (
                    <option key={t.slug} value={t.slug}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={() => handleSave()}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#00b14f] hover:bg-[#009241] text-white text-xs font-bold rounded-xl transition shadow-[0_4px_12px_rgba(0,177,79,0.15)] hover:shadow-[0_6px_16px_rgba(0,177,79,0.25)] cursor-pointer"
            >
              <FaSave size={12} />
              <span>Lưu hồ sơ</span>
            </button>
          </div>
        </header>

        {/* Editor Layout */}
        <div className="flex-grow flex overflow-hidden relative print:block print:overflow-visible">
          {saving && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center">
              <div className="bg-white p-6 rounded-2xl flex items-center gap-3.5 shadow-2xl border border-gray-100">
                <div className="w-6 h-6 border-2 border-gray-200 border-t-[#00b14f] rounded-full animate-spin" />
                <span className="text-sm font-bold text-gray-800">Đang lưu trữ dữ liệu...</span>
              </div>
            </div>
          )}

          <>
            {/* Left Column: Editor Sidebar */}
            <div className="w-[450px] shrink-0 border-r border-gray-150 bg-white flex flex-col h-full print:hidden">
              {/* Tab Navigation (Modern Pill Design) */}
              <div className="flex bg-gray-50 border border-gray-150/70 p-1 rounded-xl text-center text-[11px] font-bold text-gray-500 shrink-0 mx-4 mt-4">
                <button
                  onClick={() => setActiveTab('info')}
                  className={`flex-1 py-2 flex items-center justify-center gap-1.5 rounded-lg transition-all cursor-pointer ${activeTab === 'info' ? 'bg-white text-[#00b14f] shadow-sm' : 'hover:text-gray-805'
                    }`}
                >
                  <FaUser size={11} /> Cá nhân
                </button>
                <button
                  onClick={() => setActiveTab('details')}
                  className={`flex-1 py-2 flex items-center justify-center gap-1.5 rounded-lg transition-all cursor-pointer ${activeTab === 'details' ? 'bg-white text-[#00b14f] shadow-sm' : 'hover:text-gray-805'
                    }`}
                >
                  <FaBriefcase size={11} /> Nội dung
                </button>
                <button
                  onClick={() => setActiveTab('sections')}
                  className={`flex-1 py-2 flex items-center justify-center gap-1.5 rounded-lg transition-all cursor-pointer ${activeTab === 'sections' ? 'bg-white text-[#00b14f] shadow-sm' : 'hover:text-gray-805'
                    }`}
                >
                  <FaListUl size={11} /> Sắp xếp
                </button>
              </div>

              {/* Sidebar Tab Contents */}
              <div className="flex-grow overflow-y-auto p-5 space-y-6">
                {activeTab === 'info' && (
                  <div className="space-y-5">
                    <div>
                      <h3 className="text-[13px] font-bold text-gray-900 mb-2">Thông tin liên hệ</h3>
                      <p className="text-[11px] text-amber-700 bg-amber-50/50 border border-amber-200/50 p-3 rounded-xl font-medium leading-relaxed">
                        💡 Ảnh đại diện, họ tên, email và số điện thoại được đồng bộ từ thông tin tài khoản của bạn để đảm bảo tính nhất quán. Bạn có thể thay đổi riêng ảnh đại diện trực tiếp trên phần xem trước CV ở cột bên phải.
                      </p>
                    </div>

                    <div className="flex items-center gap-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                      <div className="relative group shrink-0">
                        <img
                          src={userData.avatar}
                          alt="Avatar"
                          className="h-16 w-16 rounded-2xl border-2 border-white shadow-md object-cover"
                        />
                      </div>
                      <div className="flex-grow">
                        <label className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-1">Họ và Tên</label>
                        <input
                          type="text"
                          value={userData.name}
                          disabled
                          className="w-full text-xs font-bold border border-gray-200 bg-gray-100/60 text-gray-500 rounded-xl px-3 py-2.5 cursor-not-allowed"
                          placeholder="Họ và Tên"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-1">Bằng cấp / Vị trí ứng tuyển</label>
                      <input
                        type="text"
                        value={resumeData.degree}
                        onChange={(e) => setResumeData({ ...resumeData, degree: e.target.value })}
                        className="w-full text-xs font-bold text-gray-700 border border-gray-200 rounded-xl px-3.5 py-2.5 focus:border-[#00b14f] focus:ring-4 focus:ring-[#00b14f]/5 focus:outline-none transition-all placeholder-gray-400"
                        placeholder="Cử nhân Công nghệ thông tin / Frontend Developer"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-1">Email</label>
                        <input
                          type="email"
                          value={userData.email}
                          disabled
                          className="w-full text-xs font-bold border border-gray-200 bg-gray-100/60 text-gray-500 rounded-xl px-3 py-2.5 cursor-not-allowed"
                          placeholder="example@gmail.com"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-1">Số điện thoại</label>
                        <input
                          type="text"
                          value={userData.phone}
                          disabled
                          className="w-full text-xs font-bold border border-gray-200 bg-gray-100/60 text-gray-500 rounded-xl px-3 py-2.5 cursor-not-allowed"
                          placeholder="0912 345 678"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-1">Địa chỉ</label>
                      <input
                        type="text"
                        value={resumeData.address}
                        onChange={(e) => setResumeData({ ...resumeData, address: e.target.value })}
                        className="w-full text-xs font-bold text-gray-700 border border-gray-200 rounded-xl px-3.5 py-2.5 focus:border-[#00b14f] focus:ring-4 focus:ring-[#00b14f]/5 focus:outline-none transition-all placeholder-gray-400"
                        placeholder="Quận 1, TP. Hồ Chí Minh"
                      />
                    </div>
                  </div>
                )}

                {activeTab === 'details' && (
                  <div className="space-y-6">
                    {/* Summary */}
                    <div>
                      <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-500 mb-1.5">Về tôi (Giới thiệu ngắn)</label>
                      <textarea
                        value={resumeData.summary}
                        onChange={(e) => setResumeData({ ...resumeData, summary: e.target.value })}
                        className="w-full text-xs font-medium text-gray-750 border border-gray-200 rounded-xl px-3.5 py-2.5 focus:border-[#00b14f] focus:ring-4 focus:ring-[#00b14f]/5 focus:outline-none transition-all resize-y leading-relaxed"
                        rows={5}
                        placeholder="Tóm tắt ngắn gọn thế mạnh, mục tiêu nghề nghiệp của bản thân..."
                      />
                    </div>

                    <hr className="border-gray-100" />

                    {/* Education Section */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-500">Học vấn</label>
                        <button
                          type="button"
                          onClick={() => addArrayItem('education', { school: 'Trường học', degree: 'Cử nhân', field: 'Ngành học', startYear: '2020', endYear: '2024', GPA: '', description: '' })}
                          className="text-[11px] text-[#00b14f] hover:text-[#009241] flex items-center gap-1.5 font-bold transition-colors cursor-pointer"
                        >
                          <FaPlus size={10} /> Thêm trường học
                        </button>
                      </div>
                      <div className="space-y-3">
                        {resumeData.education.map((edu: any, index: number) => (
                          <div key={index} className="p-4 bg-gray-50/50 border border-gray-200 rounded-2xl relative space-y-3 shadow-xs">
                            <button
                              type="button"
                              onClick={() => removeArrayItem('education', index)}
                              className="absolute top-3.5 right-3.5 text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition cursor-pointer"
                            >
                              <FaTrash size={10} />
                            </button>
                            <input
                              type="text"
                              value={edu.school}
                              onChange={(e) => handleArrayChange('education', index, 'school', e.target.value)}
                              className="w-[85%] text-xs font-bold text-gray-800 bg-transparent border-b border-transparent hover:border-gray-200 focus:border-[#00b14f] focus:outline-none pb-0.5"
                              placeholder="Tên trường học"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="text"
                                value={edu.degree}
                                onChange={(e) => handleArrayChange('education', index, 'degree', e.target.value)}
                                className="w-full text-xs font-medium border border-gray-200 bg-white rounded-lg px-2.5 py-1.5 focus:border-[#00b14f] focus:outline-none transition-colors"
                                placeholder="Bằng cấp"
                              />
                              <input
                                type="text"
                                value={edu.field}
                                onChange={(e) => handleArrayChange('education', index, 'field', e.target.value)}
                                className="w-full text-xs font-medium border border-gray-200 bg-white rounded-lg px-2.5 py-1.5 focus:border-[#00b14f] focus:outline-none transition-colors"
                                placeholder="Ngành học"
                              />
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <input
                                type="text"
                                value={edu.startYear}
                                onChange={(e) => handleArrayChange('education', index, 'startYear', e.target.value)}
                                className="w-full text-xs font-medium border border-gray-200 bg-white rounded-lg px-2.5 py-1.5 focus:border-[#00b14f] focus:outline-none transition-colors"
                                placeholder="Bắt đầu (Năm)"
                              />
                              <input
                                type="text"
                                value={edu.endYear || ''}
                                onChange={(e) => handleArrayChange('education', index, 'endYear', e.target.value)}
                                className="w-full text-xs font-medium border border-gray-200 bg-white rounded-lg px-2.5 py-1.5 focus:border-[#00b14f] focus:outline-none transition-colors"
                                placeholder="Kết thúc"
                              />
                              <input
                                type="text"
                                value={edu.GPA || ''}
                                onChange={(e) => handleArrayChange('education', index, 'GPA', e.target.value)}
                                className="w-full text-xs font-medium border border-gray-200 bg-white rounded-lg px-2.5 py-1.5 focus:border-[#00b14f] focus:outline-none transition-colors"
                                placeholder="GPA"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <hr className="border-gray-100" />

                    {/* Experience Section */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-500">Kinh nghiệm làm việc</label>
                        <button
                          type="button"
                          onClick={() => addArrayItem('experience', { position: 'Chức danh', company: 'Công ty', startYear: '2023', endYear: '', description: '' })}
                          className="text-[11px] text-[#00b14f] hover:text-[#009241] flex items-center gap-1.5 font-bold transition-colors cursor-pointer"
                        >
                          <FaPlus size={10} /> Thêm kinh nghiệm
                        </button>
                      </div>
                      <div className="space-y-3">
                        {resumeData.experience.map((exp: any, index: number) => (
                          <div key={index} className="p-4 bg-gray-50/50 border border-gray-200 rounded-2xl relative space-y-3 shadow-xs">
                            <button
                              type="button"
                              onClick={() => removeArrayItem('experience', index)}
                              className="absolute top-3.5 right-3.5 text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition cursor-pointer"
                            >
                              <FaTrash size={10} />
                            </button>
                            <input
                              type="text"
                              value={exp.position}
                              onChange={(e) => handleArrayChange('experience', index, 'position', e.target.value)}
                              className="w-[85%] text-xs font-bold text-gray-800 bg-transparent border-b border-transparent hover:border-gray-200 focus:border-[#00b14f] focus:outline-none pb-0.5"
                              placeholder="Vị trí / Chức vụ"
                            />
                            <input
                              type="text"
                              value={exp.company}
                              onChange={(e) => handleArrayChange('experience', index, 'company', e.target.value)}
                              className="w-full text-xs font-medium border border-gray-200 bg-white rounded-lg px-2.5 py-1.5 focus:border-[#00b14f] focus:outline-none transition-colors"
                              placeholder="Công ty"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="text"
                                value={exp.startYear}
                                onChange={(e) => handleArrayChange('experience', index, 'startYear', e.target.value)}
                                className="w-full text-xs font-medium border border-gray-200 bg-white rounded-lg px-2.5 py-1.5 focus:border-[#00b14f] focus:outline-none transition-colors"
                                placeholder="Bắt đầu (Tháng/Năm)"
                              />
                              <input
                                type="text"
                                value={exp.endYear || ''}
                                onChange={(e) => handleArrayChange('experience', index, 'endYear', e.target.value)}
                                className="w-full text-xs font-medium border border-gray-200 bg-white rounded-lg px-2.5 py-1.5 focus:border-[#00b14f] focus:outline-none transition-colors"
                                placeholder="Kết thúc"
                              />
                            </div>
                            <textarea
                              value={exp.description || ''}
                              onChange={(e) => handleArrayChange('experience', index, 'description', e.target.value)}
                              className="w-full text-xs font-medium border border-gray-200 bg-white rounded-lg px-2.5 py-1.5 focus:border-[#00b14f] focus:outline-none resize-y leading-relaxed"
                              placeholder="Mô tả công việc..."
                              rows={3}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <hr className="border-gray-100" />

                    {/* Projects Section */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-500">Dự án</label>
                        <button
                          type="button"
                          onClick={() => addArrayItem('projects', { name: 'Dự án mới', position: 'Vai trò', link: '', description: '' })}
                          className="text-[11px] text-[#00b14f] hover:text-[#009241] flex items-center gap-1.5 font-bold transition-colors cursor-pointer"
                        >
                          <FaPlus size={10} /> Thêm dự án
                        </button>
                      </div>
                      <div className="space-y-3">
                        {resumeData.projects.map((proj: any, index: number) => (
                          <div key={index} className="p-4 bg-gray-50/50 border border-gray-200 rounded-2xl relative space-y-3 shadow-xs">
                            <button
                              type="button"
                              onClick={() => removeArrayItem('projects', index)}
                              className="absolute top-3.5 right-3.5 text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition cursor-pointer"
                            >
                              <FaTrash size={10} />
                            </button>
                            <input
                              type="text"
                              value={proj.name}
                              onChange={(e) => handleArrayChange('projects', index, 'name', e.target.value)}
                              className="w-[85%] text-xs font-bold text-gray-800 bg-transparent border-b border-transparent hover:border-gray-200 focus:border-[#00b14f] focus:outline-none pb-0.5"
                              placeholder="Tên dự án"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="text"
                                value={proj.position || ''}
                                onChange={(e) => handleArrayChange('projects', index, 'position', e.target.value)}
                                className="w-full text-xs font-medium border border-gray-200 bg-white rounded-lg px-2.5 py-1.5 focus:border-[#00b14f] focus:outline-none transition-colors"
                                placeholder="Vai trò"
                              />
                              <input
                                type="text"
                                value={proj.link || ''}
                                onChange={(e) => handleArrayChange('projects', index, 'link', e.target.value)}
                                className="w-full text-xs font-medium border border-gray-200 bg-white rounded-lg px-2.5 py-1.5 focus:border-[#00b14f] focus:outline-none transition-colors"
                                placeholder="Link dự án"
                              />
                            </div>
                            <textarea
                              value={proj.description || ''}
                              onChange={(e) => handleArrayChange('projects', index, 'description', e.target.value)}
                              className="w-full text-xs font-medium border border-gray-200 bg-white rounded-lg px-2.5 py-1.5 focus:border-[#00b14f] focus:outline-none resize-y leading-relaxed"
                              placeholder="Mô tả dự án..."
                              rows={3}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <hr className="border-gray-100" />

                    {/* Languages & Skills */}
                    <div>
                      <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-500 mb-1.5">Ngôn ngữ & kỹ năng</label>
                      <textarea
                        value={resumeData.languages}
                        onChange={(e) => setResumeData({ ...resumeData, languages: e.target.value })}
                        className="w-full text-xs font-medium text-gray-750 border border-gray-200 rounded-xl px-3.5 py-2.5 focus:border-[#00b14f] focus:ring-4 focus:ring-[#00b14f]/5 focus:outline-none transition-all resize-y leading-relaxed"
                        rows={5}
                        placeholder="Ví dụ:&#13;Tiếng Anh (IELTS 7.0)&#13;JavaScript, React, Next.js"
                      />
                    </div>
                  </div>
                )}

                {activeTab === 'sections' && (
                  <SectionOrderManager
                    sections={sections}
                    onChange={setSections}
                  />
                )}
              </div>
            </div>

            {/* Right Column: Live Interactive Sheet Editor */}
            <div className="flex-grow bg-slate-100 overflow-y-auto flex items-start justify-center p-8 print:p-0 print:bg-white print:overflow-visible h-full">
              <div className="transform origin-top scale-[0.9] lg:scale-95 xl:scale-100 transition-transform print:transform-none print:w-full print:h-auto">
                <div className="w-[820px] min-h-[1160px] bg-white shadow-[0_15px_60px_rgba(0,0,0,0.06)] rounded-lg overflow-hidden border border-gray-200/60 print:w-full print:min-h-0 print:shadow-none print:border-none print:rounded-none">
                  <TemplateComponent
                    isControlled={true}
                    controlledUserData={userData}
                    controlledResumeData={resumeData}
                    onControlledChangeUser={setUserData}
                    onControlledChangeResume={setResumeData}
                    sectionOrder={sections.map(s => s.id)}
                    onSave={(u: any, r: any) => handleSave(u, r)}
                  />
                </div>
              </div>
            </div>
          </>
        </div>
      </div>

      {/* Clean CV Layout - Only visible during Print */}
      <div className="hidden print:block print:w-full print:p-0">
        <TemplateComponent
          isControlled={true}
          controlledUserData={userData}
          controlledResumeData={resumeData}
          onControlledChangeUser={setUserData}
          onControlledChangeResume={setResumeData}
          sectionOrder={sections.map(s => s.id)}
        />
      </div>

      {/* Modal Thông Báo Tạo / Cập Nhật CV Thành Công */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm print:hidden animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-gray-100 relative overflow-hidden text-center transform transition-all animate-scaleUp">
            {/* Background Decorative Blur Orbs */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-400/20 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-teal-400/20 rounded-full blur-2xl pointer-events-none" />

            {/* Nút đóng */}
            <button
              onClick={() => setShowSuccessModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <FaTimes size={16} />
            </button>

            {/* Icon Checkmark Hoạt Họa */}
            <div className="relative mx-auto mb-6 w-20 h-20 flex items-center justify-center">
              <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-30" />
              <div className="w-20 h-20 bg-gradient-to-tr from-emerald-500 to-green-400 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <FaCheckCircle className="text-white text-4xl" />
              </div>
            </div>

            {/* Tiêu đề & Nội dung */}
            <h3 className="text-xl font-black text-gray-900 mb-2 tracking-tight">
              {resumeId ? 'Cập Nhật Hồ Sơ Thành Công!' : 'Tạo CV Thành Công 🎉'}
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed mb-6">
              Hồ sơ <span className="font-bold text-gray-800">"{cvTitle}"</span> đã được lưu an toàn vào hệ thống. Bạn có thể xem danh sách CV hoặc tải về ngay.
            </p>

            {/* Thẻ thông tin CV */}
            <div className="bg-gray-50/80 rounded-2xl p-4 mb-6 border border-gray-150/70 text-left flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-[#00b14f] flex items-center justify-center shrink-0 font-bold text-lg">
                📄
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-gray-800 truncate">{cvTitle}</p>
                <p className="text-[11px] text-gray-400 truncate">Mẫu thiết kế: {template?.name || slug}</p>
              </div>
              {isDefault && (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full shrink-0">
                  Mặc định
                </span>
              )}
            </div>

            {/* Nút thao tác */}
            <div className="space-y-2.5">
              <button
                onClick={() => router.push('/candidate/resumes')}
                className="w-full py-3 px-4 bg-[#00b14f] hover:bg-[#009241] text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all transform hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Xem danh sách CV đã lưu</span>
                <FaExternalLinkAlt size={10} />
              </button>

              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  setTimeout(() => window.print(), 300);
                }}
                className="w-full py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>🖨️ Tải xuống / In CV</span>
              </button>

              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full py-2 text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                Tiếp tục chỉnh sửa
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          html, body {
            background-color: white !important;
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print\\:block {
            display: block !important;
            width: 100% !important;
            max-width: 210mm !important;
            margin: 0 auto !important;
            padding: 6mm 10mm !important;
            box-sizing: border-box !important;
          }
          input, textarea, select {
            border: none !important;
            background: transparent !important;
            box-shadow: none !important;
            outline: none !important;
            resize: none !important;
            overflow: visible !important;
            font-family: inherit !important;
            color: inherit !important;
            field-sizing: content;
          }
          .print\\:hidden,
          button[class*="print:hidden"],
          label[class*="print:hidden"],
          span[class*="print:hidden"] {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
