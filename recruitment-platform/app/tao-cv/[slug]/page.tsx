'use client'
import React, { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { TEMPLATE_MAP } from '@/template/index';
import SectionOrderManager from '@/components/candidate/SectionOrderManager';
import { FaUser, FaListUl, FaBriefcase, FaSave, FaPlus, FaTrash } from 'react-icons/fa';

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
  const [viewMode, setViewMode] = useState<'split' | 'inline'>('split');
  const [activeTab, setActiveTab] = useState<'info' | 'sections' | 'details'>('info');

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
            const cvName = resData.resume.cvData?.name || resData.resume.user?.name || '';
            const cvEmail = resData.resume.cvData?.email || resData.resume.user?.email || '';
            const cvPhone = resData.resume.cvData?.phone || resData.resume.user?.phone || '';

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
          title: uData.name ? `CV ${uData.name}` : 'Hồ sơ của tôi',
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
        alert(resumeId ? 'Cập nhật CV thành công!' : 'Lưu CV thành công!');
        router.push('/candidate/resumes');
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Editor Header Toolbar */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm print:hidden">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              if (confirm('Quay lại danh sách? Các chỉnh sửa chưa lưu sẽ bị mất.')) {
                router.push('/candidate/resumes');
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition cursor-pointer"
          >
            ← Quay lại
          </button>
          <div className="h-4 w-px bg-gray-250" />
          <h1 className="text-sm font-bold text-gray-800">
            {resumeId ? 'Chỉnh sửa CV' : 'Tạo CV mới'}
          </h1>
        </div>

        {/* View Switcher and Actions */}
        <div className="flex items-center gap-4">
          <div className="flex bg-gray-100 rounded-lg p-0.5 border border-gray-200">
            <button
              onClick={() => setViewMode('split')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                viewMode === 'split' ? 'bg-white text-gray-850 shadow-xs' : 'text-gray-500 hover:text-gray-850'
              }`}
            >
              Sidebar + Xem trước
            </button>
            <button
              onClick={() => setViewMode('inline')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                viewMode === 'inline' ? 'bg-white text-gray-850 shadow-xs' : 'text-gray-500 hover:text-gray-850'
              }`}
            >
              Chỉnh trực tiếp (Full)
            </button>
          </div>

          {templates.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500">Mẫu CV:</span>
              <select
                value={slug}
                onChange={(e) => handleTemplateChange(e.target.value)}
                className="text-xs font-bold text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#00b14f] cursor-pointer"
              >
                {templates.map(t => (
                  <option key={t.slug} value={t.slug}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {viewMode === 'split' && (
            <button
              onClick={() => handleSave()}
              className="flex items-center gap-1.5 px-4 py-1.8 bg-[#00b14f] text-white text-xs font-bold rounded-lg hover:bg-[#009640] transition shadow-xs cursor-pointer"
            >
              <FaSave size={12} /> Lưu CV
            </button>
          )}
        </div>
      </header>

      {/* Editor Layout */}
      <div className="flex-grow flex overflow-hidden relative">
        {saving && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-xl flex items-center gap-3 shadow-xl">
              <div className="w-6 h-6 border-2 border-gray-200 border-t-[#00b14f] rounded-full animate-spin" />
              <span className="text-sm font-medium text-gray-700">Đang lưu CV...</span>
            </div>
          </div>
        )}

        {viewMode === 'split' ? (
          <>
            {/* Left Column: Editor Sidebar */}
            <div className="w-[450px] shrink-0 border-r border-gray-200 bg-white flex flex-col h-[calc(100vh-62px)]">
              {/* Tab Navigation */}
              <div className="flex border-b border-gray-150 text-center text-xs font-bold text-gray-500 shrink-0">
                <button
                  onClick={() => setActiveTab('info')}
                  className={`flex-1 py-3 flex items-center justify-center gap-1.5 border-b-2 transition cursor-pointer ${
                    activeTab === 'info' ? 'border-[#00b14f] text-[#00b14f]' : 'border-transparent hover:text-gray-800'
                  }`}
                >
                  <FaUser size={12} /> Thông tin cá nhân
                </button>
                <button
                  onClick={() => setActiveTab('details')}
                  className={`flex-1 py-3 flex items-center justify-center gap-1.5 border-b-2 transition cursor-pointer ${
                    activeTab === 'details' ? 'border-[#00b14f] text-[#00b14f]' : 'border-transparent hover:text-gray-800'
                  }`}
                >
                  <FaBriefcase size={12} /> Chi tiết nội dung
                </button>
                <button
                  onClick={() => setActiveTab('sections')}
                  className={`flex-1 py-3 flex items-center justify-center gap-1.5 border-b-2 transition cursor-pointer ${
                    activeTab === 'sections' ? 'border-[#00b14f] text-[#00b14f]' : 'border-transparent hover:text-gray-800'
                  }`}
                >
                  <FaListUl size={12} /> Sắp xếp phần
                </button>
              </div>

              {/* Sidebar Tab Contents */}
              <div className="flex-grow overflow-y-auto p-5 space-y-6">
                {activeTab === 'info' && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-850">Thông tin liên hệ</h3>
                    
                    <div className="flex items-center gap-4">
                      <div className="relative group shrink-0">
                        <img
                          src={userData.avatar}
                          alt="Avatar"
                          className="h-16 w-16 rounded-full border-2 border-gray-200 object-cover"
                        />
                        <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-full text-white text-[9px] font-semibold cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                          📷 Ảnh
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const url = URL.createObjectURL(file);
                                setUserData((prev: any) => ({ ...prev, avatar: url }));
                              }
                            }}
                            className="hidden"
                          />
                        </label>
                      </div>
                      <div className="flex-grow">
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Họ và Tên</label>
                        <input
                          type="text"
                          value={userData.name}
                          onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-[#00b14f] focus:outline-none"
                          placeholder="Họ và Tên"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Bằng cấp / Vị trí ứng tuyển</label>
                      <input
                        type="text"
                        value={resumeData.degree}
                        onChange={(e) => setResumeData({ ...resumeData, degree: e.target.value })}
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-[#00b14f] focus:outline-none"
                        placeholder="Cử nhân Công nghệ thông tin / Frontend Developer"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Email</label>
                        <input
                          type="email"
                          value={userData.email}
                          onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-[#00b14f] focus:outline-none"
                          placeholder="example@gmail.com"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Số điện thoại</label>
                        <input
                          type="text"
                          value={userData.phone}
                          onChange={(e) => setUserData({ ...userData, phone: e.target.value })}
                          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-[#00b14f] focus:outline-none"
                          placeholder="0912 345 678"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Địa chỉ</label>
                      <input
                        type="text"
                        value={resumeData.address}
                        onChange={(e) => setResumeData({ ...resumeData, address: e.target.value })}
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-[#00b14f] focus:outline-none"
                        placeholder="Quận 1, TP. Hồ Chí Minh"
                      />
                    </div>
                  </div>
                )}

                {activeTab === 'details' && (
                  <div className="space-y-5">
                    {/* Summary */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Về tôi (Giới thiệu ngắn)</label>
                      <textarea
                        value={resumeData.summary}
                        onChange={(e) => setResumeData({ ...resumeData, summary: e.target.value })}
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-[#00b14f] focus:outline-none resize-y"
                        rows={4}
                        placeholder="Tóm tắt ngắn gọn thế mạnh, mục tiêu nghề nghiệp của bản thân..."
                      />
                    </div>

                    <hr className="border-gray-100" />

                    {/* Education Section */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-bold text-gray-700">Học vấn</label>
                        <button
                          type="button"
                          onClick={() => addArrayItem('education', { school: 'Trường học', degree: 'Cử nhân', field: 'Ngành học', startYear: '2020', endYear: '2024', GPA: '', description: '' })}
                          className="text-xs text-[#00b14f] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                        >
                          <FaPlus size={10} /> Thêm trường
                        </button>
                      </div>
                      <div className="space-y-3">
                        {resumeData.education.map((edu: any, index: number) => (
                          <div key={index} className="p-3 bg-gray-50 border border-gray-200 rounded-xl relative space-y-2">
                            <button
                              type="button"
                              onClick={() => removeArrayItem('education', index)}
                              className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition cursor-pointer"
                            >
                              <FaTrash size={12} />
                            </button>
                            <input
                              type="text"
                              value={edu.school}
                              onChange={(e) => handleArrayChange('education', index, 'school', e.target.value)}
                              className="w-[90%] text-xs font-bold bg-transparent border-b border-transparent hover:border-gray-200 focus:border-[#00b14f] focus:outline-none pb-0.5"
                              placeholder="Tên trường học"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="text"
                                value={edu.degree}
                                onChange={(e) => handleArrayChange('education', index, 'degree', e.target.value)}
                                className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none"
                                placeholder="Bằng cấp"
                              />
                              <input
                                type="text"
                                value={edu.field}
                                onChange={(e) => handleArrayChange('education', index, 'field', e.target.value)}
                                className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none"
                                placeholder="Ngành học"
                              />
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <input
                                type="text"
                                value={edu.startYear}
                                onChange={(e) => handleArrayChange('education', index, 'startYear', e.target.value)}
                                className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none"
                                placeholder="Bắt đầu (Năm)"
                              />
                              <input
                                type="text"
                                value={edu.endYear || ''}
                                onChange={(e) => handleArrayChange('education', index, 'endYear', e.target.value)}
                                className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none"
                                placeholder="Kết thúc (Năm)"
                              />
                              <input
                                type="text"
                                value={edu.GPA || ''}
                                onChange={(e) => handleArrayChange('education', index, 'GPA', e.target.value)}
                                className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none"
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
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-bold text-gray-700">Kinh nghiệm làm việc</label>
                        <button
                          type="button"
                          onClick={() => addArrayItem('experience', { position: 'Chức danh', company: 'Công ty', startYear: '2023', endYear: '', description: '' })}
                          className="text-xs text-[#00b14f] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                        >
                          <FaPlus size={10} /> Thêm kinh nghiệm
                        </button>
                      </div>
                      <div className="space-y-3">
                        {resumeData.experience.map((exp: any, index: number) => (
                          <div key={index} className="p-3 bg-gray-50 border border-gray-200 rounded-xl relative space-y-2">
                            <button
                              type="button"
                              onClick={() => removeArrayItem('experience', index)}
                              className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition cursor-pointer"
                            >
                              <FaTrash size={12} />
                            </button>
                            <input
                              type="text"
                              value={exp.position}
                              onChange={(e) => handleArrayChange('experience', index, 'position', e.target.value)}
                              className="w-[90%] text-xs font-bold bg-transparent border-b border-transparent hover:border-gray-200 focus:border-[#00b14f] focus:outline-none pb-0.5"
                              placeholder="Vị trí / Chức vụ"
                            />
                            <input
                              type="text"
                              value={exp.company}
                              onChange={(e) => handleArrayChange('experience', index, 'company', e.target.value)}
                              className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none"
                              placeholder="Công ty"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="text"
                                value={exp.startYear}
                                onChange={(e) => handleArrayChange('experience', index, 'startYear', e.target.value)}
                                className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none"
                                placeholder="Bắt đầu (Tháng/Năm)"
                              />
                              <input
                                type="text"
                                value={exp.endYear || ''}
                                onChange={(e) => handleArrayChange('experience', index, 'endYear', e.target.value)}
                                className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none"
                                placeholder="Kết thúc"
                              />
                            </div>
                            <textarea
                              value={exp.description || ''}
                              onChange={(e) => handleArrayChange('experience', index, 'description', e.target.value)}
                              className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none resize-y"
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
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-bold text-gray-700">Dự án</label>
                        <button
                          type="button"
                          onClick={() => addArrayItem('projects', { name: 'Dự án mới', position: 'Vai trò', link: '', description: '' })}
                          className="text-xs text-[#00b14f] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                        >
                          <FaPlus size={10} /> Thêm dự án
                        </button>
                      </div>
                      <div className="space-y-3">
                        {resumeData.projects.map((proj: any, index: number) => (
                          <div key={index} className="p-3 bg-gray-50 border border-gray-200 rounded-xl relative space-y-2">
                            <button
                              type="button"
                              onClick={() => removeArrayItem('projects', index)}
                              className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition cursor-pointer"
                            >
                              <FaTrash size={12} />
                            </button>
                            <input
                              type="text"
                              value={proj.name}
                              onChange={(e) => handleArrayChange('projects', index, 'name', e.target.value)}
                              className="w-[90%] text-xs font-bold bg-transparent border-b border-transparent hover:border-gray-200 focus:border-[#00b14f] focus:outline-none pb-0.5"
                              placeholder="Tên dự án"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="text"
                                value={proj.position || ''}
                                onChange={(e) => handleArrayChange('projects', index, 'position', e.target.value)}
                                className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none"
                                placeholder="Vai trò"
                              />
                              <input
                                type="text"
                                value={proj.link || ''}
                                onChange={(e) => handleArrayChange('projects', index, 'link', e.target.value)}
                                className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none"
                                placeholder="Link dự án"
                              />
                            </div>
                            <textarea
                              value={proj.description || ''}
                              onChange={(e) => handleArrayChange('projects', index, 'description', e.target.value)}
                              className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none resize-y"
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
                      <label className="block text-xs font-bold text-gray-700 mb-1">Ngôn ngữ & kỹ năng</label>
                      <textarea
                        value={resumeData.languages}
                        onChange={(e) => setResumeData({ ...resumeData, languages: e.target.value })}
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-[#00b14f] focus:outline-none resize-y"
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

            {/* Right Column: Live Preview Area */}
            <div className="flex-grow bg-gray-100 overflow-y-auto flex items-start justify-center p-8 select-none">
              <div className="transform origin-top scale-[0.9] lg:scale-100 transition-transform">
                <div className="w-[820px] min-h-[1160px] bg-white shadow-xl rounded-sm border border-gray-200 overflow-hidden pointer-events-none">
                  <TemplateComponent
                    isControlled={true}
                    controlledUserData={userData}
                    controlledResumeData={resumeData}
                    onControlledChangeUser={setUserData}
                    onControlledChangeResume={setResumeData}
                    sectionOrder={sections.map(s => s.id)}
                  />
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Inline Mode (Original inline editing) */
          <div className="flex-grow overflow-y-auto">
            <TemplateComponent
              user={userData}
              resume={resumeData}
              onSave={(u: any, r: any) => handleSave(u, r)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
