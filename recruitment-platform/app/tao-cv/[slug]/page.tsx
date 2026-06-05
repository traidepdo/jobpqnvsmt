'use client'
import React, { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { TEMPLATE_MAP } from '@/template/index';

interface ResumeTemplate {
  id: string;
  name: string;
  slug: string;
}

export default function TaoCvSlugPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const resumeId = searchParams.get('id');

  const [template, setTemplate] = useState<ResumeTemplate | null>(null);
  const [templates, setTemplates] = useState<ResumeTemplate[]>([]);
  const [initialUser, setInitialUser] = useState<any>(null);
  const [initialResume, setInitialResume] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

            setInitialUser({
              name: cvName,
              email: cvEmail,
              phone: cvPhone,
              avatar: resData.resume.avatarUrl || resData.resume.user?.avatar || '',
            });
            setInitialResume(resData.resume);
          }
        } else {
          const userRes = await fetch('/api/candidate/user');
          const userData = await userRes.json();
          if (active) {
            if (userData.user) {
              setInitialUser({
                name: userData.user.name || '',
                email: userData.user.email || '',
                phone: userData.user.phone || '',
                avatar: userData.user.avatar || '',
              });
            } else {
              setInitialUser({});
            }
            setInitialResume({});
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

  const handleSave = async (userData: any, resumeData: any) => {
    setSaving(true);
    try {
      let avatarUrl = userData.avatar || null;

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
          title: userData.name ? `CV ${userData.name}` : 'Hồ sơ của tôi',
          templateId: template?.id || null,
          avatarUrl,
          address: resumeData.address || null,
          summary: resumeData.summary || null,
          degree: resumeData.degree || null,
          languages: resumeData.languages || null,
          socialLinks: resumeData.socicallink || [],
          education: resumeData.education || [],
          experience: resumeData.experience || [],
          projects: resumeData.projects || [],
          cvData: {
            name: userData.name,
            email: userData.email,
            phone: userData.phone
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
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
          >
            ← Quay lại
          </button>
          <div className="h-4 w-px bg-gray-250" />
          <h1 className="text-sm font-bold text-gray-800">
            {resumeId ? 'Chỉnh sửa CV' : 'Tạo CV mới'}
          </h1>
        </div>

        <div className="flex items-center gap-3">
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
        </div>
      </header>

      {/* Editor Layout */}
      <div className="flex-1 relative">
        {saving && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-xl flex items-center gap-3 shadow-xl">
              <div className="w-6 h-6 border-2 border-gray-200 border-t-[#00b14f] rounded-full animate-spin" />
              <span className="text-sm font-medium text-gray-700">Đang lưu CV...</span>
            </div>
          </div>
        )}
        <TemplateComponent
          user={initialUser || {}}
          resume={initialResume || {}}
          onSave={handleSave}
        />
      </div>
    </div>
  );
}

