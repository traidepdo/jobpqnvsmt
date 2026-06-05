'use client'
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';

interface ResumeTemplate {
  id: string; name: string; slug: string; description: string | null;
  thumbnailUrl: string | null; category: string; htmlContent: string; cssContent: string;
}

// ── Placeholder map ───────────────────────────────────────────────────────────
function getPlaceholder(field: string): string {
  const map: Record<string, string> = {
    name: 'Họ và tên', title: 'Vị trí ứng tuyển',
    email: 'email@example.com', phone: '0123 456 789',
    address: 'Địa chỉ của bạn', summary: 'Mục tiêu nghề nghiệp...',
    school: 'Tên trường học', field: 'Ngành học',
    startYear: 'Bắt đầu', endYear: 'Kết thúc',
    company: 'Tên công ty', position: 'Vị trí công việc',
    description: 'Mô tả chi tiết...', GPA: '3.5/4.0',
    degree: 'Bằng cấp', languages: 'Tiếng Anh, Tiếng Nhật',
    social_url_linkedin: 'linkedin.com/in/...',
    link: 'https://...', dob: 'DD/MM/YYYY', gender: 'Nam/Nữ',
    website: 'website.com',
  };
  return map[field] || field;
}

// ── Convert {{field}} → <span data-field="field">placeholder</span> ───────────
// ── Convert {{field}} → <span data-field="field">placeholder</span> ───────────
function convertMustacheToEditable(
  html: string,
  eduCount: number,
  expCount: number,
  projCount: number
): string {
  let out = html;

  // 1. Process avatar
  out = out.replace(/\{\{#if\s+avatar\}\}[\s\S]*?\{\{\/if\}\}/g,
    '<img data-avatar src="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" alt="avatar" />'
  );

  // 2. Process each blocks
  const processEach = (source: string, arrayName: string, count: number): string => {
    const eachRegex = new RegExp(`\\{\\{#each\\s+${arrayName}\\}\\}([\\s\\S]*?)\\{\\{\\/each\\}\\}`, 'g');
    return source.replace(eachRegex, (_, blockTemplate) => {
      let repeated = '';
      for (let i = 0; i < count; i++) {
        let block = blockTemplate
          .replace(/\{\{@index\}\}/g, String(i))
          .replace(/\{\{@number\}\}/g, String(i + 1));
        
        block = block.replace(/\{\{(\w+)\}\}/g, (__: string, field: string) => {
          return `<span data-field="${arrayName}.${i}.${field}" style="display:inline-block;min-width:20px;">${getPlaceholder(field)}</span>`;
        });
        repeated += block + '\n';
      }
      return repeated;
    });
  };

  out = processEach(out, 'education', eduCount);
  out = processEach(out, 'experience', expCount);
  out = processEach(out, 'projects', projCount);

  // 3. Keep other conditional blocks contents
  out = out.replace(/\{\{#if\s+\w+\}\}([\s\S]*?)\{\{\/if\}\}/g, '$1');

  // 4. Process simple fields
  out = out.replace(/\{\{(\w+)\}\}/g, (_, field) => {
    return `<span data-field="${field}" style="display:inline-block;min-width:20px;">${getPlaceholder(field)}</span>`;
  });

  return out;
}

// ── Build iframe srcDoc ───────────────────────────────────────────────────────
function buildIframeDoc(
  htmlContent: string,
  cssContent: string,
  eduCount: number,
  expCount: number,
  projCount: number,
  avatarUrl?: string
) {
  const processedHtml = convertMustacheToEditable(htmlContent, eduCount, expCount, projCount);
  const avatarInject = avatarUrl
    ? `(function(){
        var targets = document.querySelectorAll('img[data-avatar]');
        if(targets.length===0) targets = document.querySelectorAll('img');
        targets.forEach(function(img){
          img.src='${avatarUrl}';
          img.style.objectFit='cover';
          img.style.width=img.style.width||'100%';
          img.style.height=img.style.height||'100%';
        });
      })()`
    : '';

  return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8"/>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: #fff; -webkit-font-smoothing: antialiased; }
[data-field] {
  transition: box-shadow 0.12s, background 0.12s;
  border-radius: 3px;
  cursor: text;
  outline: none;
}
[data-field]:hover {
  box-shadow: inset 0 0 0 1.5px #00b14f88;
  background: #00b14f08;
}
[data-field]:focus {
  box-shadow: inset 0 0 0 2px #00b14f;
  background: #00b14f0d;
}
${cssContent}
</style>
</head>
<body>
${processedHtml}
<script>
  // Ngăn chặn chuyển trang khi click vào link trong trình chỉnh sửa
  document.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
    });
  });

  document.querySelectorAll('[data-field]').forEach(el => {
    el.contentEditable = 'true';
    el.spellcheck = false;

    el.addEventListener('focus', () => {
      window.parent.postMessage({ type: 'focus', field: el.dataset.field }, '*');
      // Select all on first focus if still placeholder
      const sel = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(el);
      sel.removeAllRanges();
      sel.addRange(range);
    });

    el.addEventListener('blur', () => {
      window.parent.postMessage({
        type: 'change',
        field: el.dataset.field,
        value: el.innerText.trim()
      }, '*');
      window.parent.postMessage({ type: 'blur' }, '*');
    });

    el.addEventListener('input', () => {
      window.parent.postMessage({
        type: 'change',
        field: el.dataset.field,
        value: el.innerText.trim()
      }, '*');
    });

    el.addEventListener('keydown', e => {
      // Enter không xuống dòng trừ khi có data-multiline
      if (e.key === 'Enter' && !el.dataset.multiline) {
        e.preventDefault();
        el.blur();
      }
      // Escape để thoát
      if (e.key === 'Escape') el.blur();
    });
  });

  // Nhận lệnh set avatar hoặc updateData từ parent
  window.addEventListener('message', e => {
    if (!e.data?.type) return;
    if (e.data.type === 'setAvatar') {
      // Ưu tiên data-avatar, fallback img đầu tiên trong CV
      let targets = document.querySelectorAll('img[data-avatar]');
      if (targets.length === 0) targets = document.querySelectorAll('img');
      targets.forEach(img => {
        img.src = e.data.url || '';
        img.style.objectFit = 'cover';
        img.style.width = img.style.width || '100%';
        img.style.height = img.style.height || '100%';
      });
    } else if (e.data.type === 'updateData') {
      const { cvData, education, experience, projects } = e.data;
      const placeholders = {
        name: 'Họ và tên', title: 'Vị trí ứng tuyển',
        email: 'email@example.com', phone: '0123 456 789',
        address: 'Địa chỉ của bạn', summary: 'Mục tiêu nghề nghiệp...',
        school: 'Tên trường học', field: 'Ngành học',
        startYear: 'Bắt đầu', endYear: 'Kết thúc',
        company: 'Tên công ty', position: 'Vị trí công việc',
        description: 'Mô tả chi tiết...', GPA: '3.5/4.0',
        degree: 'Bằng cấp', languages: 'Tiếng Anh, Tiếng Nhật',
        social_url_linkedin: 'linkedin.com/in/...',
        link: 'https://...', dob: 'DD/MM/YYYY', gender: 'Nam/Nữ',
        website: 'website.com',
      };
      
      document.querySelectorAll('[data-field]').forEach(el => {
        if (document.activeElement === el) return; // Không ghi đè khi đang gõ
        const fieldPath = el.dataset.field;
        if (!fieldPath) return;

        let val = '';
        if (fieldPath.includes('.')) {
          const parts = fieldPath.split('.');
          const arrayName = parts[0];
          const index = parseInt(parts[1], 10);
          const subField = parts[2];

          if (arrayName === 'projects' && projects && projects[index]) {
            val = projects[index][subField] || '';
          } else if (arrayName === 'experience' && experience && experience[index]) {
            val = experience[index][subField] || '';
          } else if (arrayName === 'education' && education && education[index]) {
            val = education[index][subField] || '';
          }
        } else {
          val = (cvData && cvData[fieldPath]) || '';
        }

        const fieldKey = fieldPath.split('.').pop() || '';
        const placeholder = placeholders[fieldKey] || fieldKey;
        el.innerText = val || placeholder;
      });
    }
  });

  // Notify parent that iframe is ready to receive data
  window.parent.postMessage({ type: 'ready' }, '*');

  ${avatarInject}
</script>
</body>
</html>`;
}

// ── Stage 1: Template picker ──────────────────────────────────────────────────
function TemplatePicker({ templates, loading, onSelect }: {
  templates: ResumeTemplate[]; loading: boolean; onSelect: (t: ResumeTemplate) => void;
}) {
  return (
    <div className="min-h-screen bg-[#f7f8f5]">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center gap-3">
          <div className="w-7 h-7 bg-[#00b14f] rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <span className="text-[15px] font-bold text-gray-900">Tạo CV</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 pt-10 pb-20">
        <div className="mb-10">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">
            Chọn mẫu CV <span className="text-[#00b14f]">của bạn</span>
          </h1>
          <p className="text-gray-400 text-sm">Click vào mẫu để bắt đầu chỉnh sửa trực tiếp trên CV</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-32">
            <div className="w-9 h-9 border-[3px] border-gray-200 border-t-[#00b14f] rounded-full animate-spin" />
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-32 bg-white rounded-2xl border border-gray-100">
            <p className="text-gray-400 font-medium">Chưa có mẫu CV nào.</p>
            <p className="text-gray-300 text-sm mt-1">Admin cần tạo template trước.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {templates.map(t => (
              <div key={t.id} onClick={() => onSelect(t)}
                className="group bg-white rounded-2xl border border-gray-100 overflow-hidden cursor-pointer transition-all hover:border-[#00b14f]/50 hover:shadow-lg hover:-translate-y-0.5 flex flex-col">
                <div className="relative h-52 bg-[#f7f8f5] overflow-hidden">
                  {t.thumbnailUrl ? (
                    <img src={t.thumbnailUrl} alt={t.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-[#00b14f]/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="bg-white text-[#00963e] text-sm font-bold px-5 py-2.5 rounded-xl">Dùng mẫu này →</span>
                  </div>
                  <span className="absolute top-2.5 left-2.5 text-[10px] font-bold uppercase tracking-wider bg-white/95 text-gray-500 px-2 py-1 rounded-lg border border-gray-100">
                    {t.category}
                  </span>
                </div>
                <div className="px-4 py-3">
                  <p className="text-[13px] font-semibold text-gray-800 truncate">{t.name}</p>
                  {t.description && <p className="text-[11px] text-gray-400 truncate mt-0.5">{t.description}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════════════════════
export default function TaoCvPage() {
  const router = useRouter();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [stage, setStage] = useState<1 | 2>(1);
  const [templates, setTemplates] = useState<ResumeTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<ResumeTemplate | null>(null);

  const [cvTitle, setCvTitle] = useState('CV chưa đặt tên');
  const [zoom, setZoom] = useState(0.78);
  const [saving, setSaving] = useState(false);
  const [cvData, setCvData] = useState<Record<string, string>>({});
  const [education, setEducation] = useState<any[]>([
    { school: '', degree: '', field: '', startYear: '', endYear: '', GPA: '' }
  ]);
  const [experience, setExperience] = useState<any[]>([
    { company: '', position: '', startYear: '', endYear: '', description: '' }
  ]);
  const [projects, setProjects] = useState<any[]>([
    { name: '', position: '', link: '', description: '' }
  ]);
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [activeField, setActiveField] = useState<string | null>(null);

  // Load templates
  useEffect(() => {
    fetch('/api/public/templates')
      .then(r => r.json())
      .then(d => { if (d.templates) setTemplates(d.templates); })
      .catch(console.error)
      .finally(() => setTemplatesLoading(false));
  }, []);

  const stateRef = useRef({ cvData, education, experience, projects });
  useEffect(() => {
    stateRef.current = { cvData, education, experience, projects };
  }, [cvData, education, experience, projects]);

  // Synchronize state changes to iframe dynamically
  useEffect(() => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'updateData',
        cvData,
        education,
        experience,
        projects
      }, '*');
    }
  }, [cvData, education, experience, projects]);

  // Lắng nghe message từ iframe
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (!e.data?.type) return;
      if (e.data.type === 'ready') {
        iframeRef.current?.contentWindow?.postMessage({
          type: 'updateData',
          ...stateRef.current
        }, '*');
      }
      if (e.data.type === 'change') {
        const fieldPath = e.data.field;
        if (fieldPath.includes('.')) {
          const parts = fieldPath.split('.');
          const arrayName = parts[0];
          const index = parseInt(parts[1], 10);
          const subField = parts[2];
          
          if (arrayName === 'projects') {
            setProjects(prev => {
              const next = [...prev];
              next[index] = { ...next[index], [subField]: e.data.value };
              return next;
            });
          } else if (arrayName === 'experience') {
            setExperience(prev => {
              const next = [...prev];
              next[index] = { ...next[index], [subField]: e.data.value };
              return next;
            });
          } else if (arrayName === 'education') {
            setEducation(prev => {
              const next = [...prev];
              next[index] = { ...next[index], [subField]: e.data.value };
              return next;
            });
          }
        } else {
          setCvData(prev => ({ ...prev, [e.data.field]: e.data.value }));
        }
      }
      if (e.data.type === 'focus') setActiveField(e.data.field);
      if (e.data.type === 'blur') setActiveField(null);
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const selectTemplate = (t: ResumeTemplate) => {
    setSelectedTemplate(t);
    setCvData({});
    setEducation([{ school: '', degree: '', field: '', startYear: '', endYear: '', GPA: '' }]);
    setExperience([{ company: '', position: '', startYear: '', endYear: '', description: '' }]);
    setProjects([{ name: '', position: '', link: '', description: '' }]);
    setActiveField(null);
    setStage(2);
  };

  const iframeSrcDoc = useMemo(() => {
    if (!selectedTemplate) return '';
    return buildIframeDoc(
      selectedTemplate.htmlContent,
      selectedTemplate.cssContent,
      education.length,
      experience.length,
      projects.length,
      avatarUrl
    );
  }, [selectedTemplate, education.length, experience.length, projects.length, avatarUrl]);

  // Upload ảnh lên Cloudinary, trả về URL
  const uploadAvatar = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/upload/image', { method: 'POST', body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload thất bại');
    return data.url;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const address = cvData.address || null;
      const summary = cvData.summary || null;
      const degree = cvData.degree || null;
      const languages = cvData.languages || null;

      const res = await fetch('/api/candidate/resumes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: cvTitle,
          templateId: selectedTemplate?.id,
          avatarUrl: avatarUrl || null,
          address,
          summary,
          degree,
          languages,
          education: education.filter(item => Object.values(item).some(v => v.trim() !== '')),
          experience: experience.filter(item => Object.values(item).some(v => v.trim() !== '')),
          projects: projects.filter(item => Object.values(item).some(v => v.trim() !== '')),
          cvData: Object.keys(cvData).length > 0 ? cvData : null,
        }),
      });
      if (res.ok) {
        alert('Lưu CV thành công!');
        router.push('/candidate/resumes');
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'Không thể lưu CV.');
        if (res.status === 401) router.push('/login?callbackUrl=/tao-cv');
      }
    } catch { alert('Lỗi kết nối.'); }
    finally { setSaving(false); }
  };

  // ── Stage 1 ────────────────────────────────────────────────────────────────
  if (stage === 1) return (
    <TemplatePicker templates={templates} loading={templatesLoading} onSelect={selectTemplate} />
  );

  // ── Stage 2: Editor ────────────────────────────────────────────────────────
  return (
    <div className="flex overflow-hidden bg-[#f7f8f5]" style={{ height: 'calc(100vh - 65px)', paddingTop: '50px' }}>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left panel */}
        <aside className="w-[280px] flex-shrink-0 bg-white border-r border-gray-100 flex flex-col py-5 px-3 gap-4 overflow-y-auto">

          {/* Hint */}
          <div className="bg-[#f0faf4] border border-[#c2e8d2] rounded-xl px-3 py-3">
            <p className="text-[11px] font-bold text-[#00963e] mb-1.5 flex items-center gap-1.5">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Cách chỉnh sửa
            </p>
            <p className="text-[11px] text-[#00963e]/80 leading-relaxed">
              Click trực tiếp vào bất kỳ văn bản nào trên CV để sửa tại chỗ.
            </p>
          </div>

          {/* Avatar upload */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 px-1">Ảnh đại diện</p>
            <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl py-3 cursor-pointer hover:border-[#00b14f] hover:bg-[#f0faf4] transition-all group">
              {uploadingAvatar ? (
                <div className="w-16 h-16 rounded-full border-2 border-[#00b14f]/40 flex items-center justify-center bg-gray-50">
                  <svg className="w-5 h-5 animate-spin text-[#00b14f]" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                </div>
              ) : avatarUrl ? (
                <img src={avatarUrl} className="w-16 h-16 rounded-full object-cover border-2 border-[#00b14f]" alt="avatar" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-[#e0f5ea] transition-colors">
                  <svg className="w-5 h-5 text-gray-300 group-hover:text-[#00b14f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
              <span className="text-[11px] text-gray-400 group-hover:text-[#00963e] font-medium">
                {uploadingAvatar ? 'Đang upload...' : avatarUrl ? 'Đổi ảnh' : 'Tải ảnh lên'}
              </span>
              <input type="file" accept="image/*" className="hidden"
                onChange={async e => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  const reader = new FileReader();
                  reader.onload = ev => {
                    const previewUrl = ev.target?.result as string;
                    // Preview trên iframe
                    iframeRef.current?.contentWindow?.postMessage({ type: 'setAvatar', url: previewUrl }, '*');
                    // Lưu tạm base64 vào state (dùng khi chưa có Cloudinary)
                    setAvatarUrl(previewUrl);
                  };
                  reader.readAsDataURL(file);

                  // Nếu đã setup Cloudinary thì upload
                  if (process.env.NEXT_PUBLIC_USE_CLOUDINARY === 'true') {
                    setUploadingAvatar(true);
                    try {
                      const cloudUrl = await uploadAvatar(file);
                      setAvatarUrl(cloudUrl);
                      iframeRef.current?.contentWindow?.postMessage({ type: 'setAvatar', url: cloudUrl }, '*');
                    } catch {
                      alert('Upload Cloudinary thất bại, dùng ảnh local tạm thời');
                    } finally {
                      setUploadingAvatar(false);
                    }
                  }
                }} />
            </label>
            {avatarUrl && (
              <button onClick={() => { setAvatarUrl(''); iframeRef.current?.contentWindow?.postMessage({ type: 'setAvatar', url: '' }, '*'); }}
                className="w-full text-[11px] text-red-400 hover:text-red-600 mt-1 cursor-pointer text-center">
                Xóa ảnh
              </button>
            )}
          </div>

          {/* Template badge */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Mẫu đang dùng</p>
            <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-100">
              <span className="w-2 h-2 bg-[#00b14f] rounded-full flex-shrink-0" />
              <span className="text-[12px] font-semibold text-gray-700 truncate">{selectedTemplate?.name}</span>
            </div>
          </div>

          {/* CV Title */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 px-1">Tên hồ sơ</p>
            <input value={cvTitle} onChange={e => setCvTitle(e.target.value)} className="w-full text-[12px] font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-2 outline-none focus:border-[#00b14f] transition" />
          </div>

          {/* Zoom */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 px-1">Thu phóng</p>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setZoom(z => Math.max(0.4, +(z - 0.05).toFixed(2)))} className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:border-gray-400 cursor-pointer font-bold text-sm transition-colors flex-shrink-0">2212</button>
              <span className="text-[12px] font-bold text-gray-600 tabular-nums flex-1 text-center">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom(z => Math.min(1.2, +(z + 0.05).toFixed(2)))} className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:border-gray-400 cursor-pointer font-bold text-sm transition-colors flex-shrink-0">+</button>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-col gap-2">
            <button onClick={handleSave} disabled={saving} className="w-full flex items-center justify-center gap-2 bg-[#00b14f] hover:bg-[#009940] text-white text-[13px] font-semibold py-2.5 rounded-xl cursor-pointer disabled:opacity-60 transition-colors">
              {saving ? "Đang lưu..." : "Lưu CV"}
            </button>
            <button onClick={() => setStage(1)} className="w-full text-[12px] font-medium text-gray-400 hover:text-gray-700 py-2 rounded-xl hover:bg-gray-50 transition-all cursor-pointer border border-gray-200">Đổi mẫu</button>
          </div>

          {/* ── QUẢN LÝ DỰ ÁN ────────────────────────── */}
          <div className="border-t border-gray-150 pt-4 mt-2">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1 flex justify-between items-center">
              <span>Dự án ({projects.length})</span>
              <button
                type="button"
                onClick={() => setProjects(prev => [...prev, { name: '', position: '', link: '', description: '' }])}
                className="text-[11px] text-[#00b14f] font-bold hover:underline cursor-pointer"
              >
                + Thêm
              </button>
            </div>
            {projects.map((proj, idx) => (
              <div key={idx} className="bg-gray-50 border border-gray-100 rounded-xl p-2.5 mb-3 relative flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => setProjects(prev => prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev)}
                  className="absolute top-1.5 right-2.5 text-[10px] text-red-500 hover:underline cursor-pointer"
                >
                  Xóa
                </button>
                <div className="text-[10px] font-bold text-gray-400">Dự án #{idx + 1}</div>
                <input
                  placeholder="Tên dự án"
                  value={proj.name}
                  onChange={e => {
                    setProjects(prev => {
                      const next = [...prev];
                      next[idx] = { ...next[idx], name: e.target.value };
                      return next;
                    });
                  }}
                  className="w-full text-[11px] bg-white border border-gray-200 rounded px-2 py-1 outline-none focus:border-[#00b14f]"
                />
                <input
                  placeholder="Vị trí / Vai trò"
                  value={proj.position}
                  onChange={e => {
                    setProjects(prev => {
                      const next = [...prev];
                      next[idx] = { ...next[idx], position: e.target.value };
                      return next;
                    });
                  }}
                  className="w-full text-[11px] bg-white border border-gray-200 rounded px-2 py-1 outline-none focus:border-[#00b14f]"
                />
                <input
                  placeholder="Link liên kết"
                  value={proj.link}
                  onChange={e => {
                    setProjects(prev => {
                      const next = [...prev];
                      next[idx] = { ...next[idx], link: e.target.value };
                      return next;
                    });
                  }}
                  className="w-full text-[11px] bg-white border border-gray-200 rounded px-2 py-1 outline-none focus:border-[#00b14f]"
                />
                <textarea
                  placeholder="Mô tả dự án..."
                  value={proj.description}
                  rows={2}
                  onChange={e => {
                    setProjects(prev => {
                      const next = [...prev];
                      next[idx] = { ...next[idx], description: e.target.value };
                      return next;
                    });
                  }}
                  className="w-full text-[11px] bg-white border border-gray-200 rounded px-2 py-1 outline-none focus:border-[#00b14f] resize-none"
                />
              </div>
            ))}
          </div>

          {/* ── QUẢN LÝ KINH NGHIỆM ──────────────────── */}
          <div className="border-t border-gray-150 pt-4 mt-2">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1 flex justify-between items-center">
              <span>Kinh nghiệm ({experience.length})</span>
              <button
                type="button"
                onClick={() => setExperience(prev => [...prev, { company: '', position: '', startYear: '', endYear: '', description: '' }])}
                className="text-[11px] text-[#00b14f] font-bold hover:underline cursor-pointer"
              >
                + Thêm
              </button>
            </div>
            {experience.map((exp, idx) => (
              <div key={idx} className="bg-gray-50 border border-gray-100 rounded-xl p-2.5 mb-3 relative flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => setExperience(prev => prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev)}
                  className="absolute top-1.5 right-2.5 text-[10px] text-red-500 hover:underline cursor-pointer"
                >
                  Xóa
                </button>
                <div className="text-[10px] font-bold text-gray-400">Công việc #{idx + 1}</div>
                <input
                  placeholder="Tên công ty"
                  value={exp.company}
                  onChange={e => {
                    setExperience(prev => {
                      const next = [...prev];
                      next[idx] = { ...next[idx], company: e.target.value };
                      return next;
                    });
                  }}
                  className="w-full text-[11px] bg-white border border-gray-200 rounded px-2 py-1 outline-none focus:border-[#00b14f]"
                />
                <input
                  placeholder="Vị trí công việc"
                  value={exp.position}
                  onChange={e => {
                    setExperience(prev => {
                      const next = [...prev];
                      next[idx] = { ...next[idx], position: e.target.value };
                      return next;
                    });
                  }}
                  className="w-full text-[11px] bg-white border border-gray-200 rounded px-2 py-1 outline-none focus:border-[#00b14f]"
                />
                <div className="flex gap-1">
                  <input
                    placeholder="Bắt đầu"
                    value={exp.startYear}
                    onChange={e => {
                      setExperience(prev => {
                        const next = [...prev];
                        next[idx] = { ...next[idx], startYear: e.target.value };
                        return next;
                      });
                    }}
                    className="w-1/2 text-[11px] bg-white border border-gray-200 rounded px-2 py-1 outline-none focus:border-[#00b14f]"
                  />
                  <input
                    placeholder="Kết thúc"
                    value={exp.endYear}
                    onChange={e => {
                      setExperience(prev => {
                        const next = [...prev];
                        next[idx] = { ...next[idx], endYear: e.target.value };
                        return next;
                      });
                    }}
                    className="w-1/2 text-[11px] bg-white border border-gray-200 rounded px-2 py-1 outline-none focus:border-[#00b14f]"
                  />
                </div>
                <textarea
                  placeholder="Mô tả công việc..."
                  value={exp.description}
                  rows={2}
                  onChange={e => {
                    setExperience(prev => {
                      const next = [...prev];
                      next[idx] = { ...next[idx], description: e.target.value };
                      return next;
                    });
                  }}
                  className="w-full text-[11px] bg-white border border-gray-200 rounded px-2 py-1 outline-none focus:border-[#00b14f] resize-none"
                />
              </div>
            ))}
          </div>

          {/* ── QUẢN LÝ HỌC VẤN ──────────────────────── */}
          <div className="border-t border-gray-150 pt-4 mt-2">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1 flex justify-between items-center">
              <span>Học vấn ({education.length})</span>
              <button
                type="button"
                onClick={() => setEducation(prev => [...prev, { school: '', degree: '', field: '', startYear: '', endYear: '', GPA: '' }])}
                className="text-[11px] text-[#00b14f] font-bold hover:underline cursor-pointer"
              >
                + Thêm
              </button>
            </div>
            {education.map((edu, idx) => (
              <div key={idx} className="bg-gray-50 border border-gray-100 rounded-xl p-2.5 mb-3 relative flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => setEducation(prev => prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev)}
                  className="absolute top-1.5 right-2.5 text-[10px] text-red-500 hover:underline cursor-pointer"
                >
                  Xóa
                </button>
                <div className="text-[10px] font-bold text-gray-400">Trường #{idx + 1}</div>
                <input
                  placeholder="Tên trường học"
                  value={edu.school}
                  onChange={e => {
                    setEducation(prev => {
                      const next = [...prev];
                      next[idx] = { ...next[idx], school: e.target.value };
                      return next;
                    });
                  }}
                  className="w-full text-[11px] bg-white border border-gray-200 rounded px-2 py-1 outline-none focus:border-[#00b14f]"
                />
                <input
                  placeholder="Ngành học"
                  value={edu.field}
                  onChange={e => {
                    setEducation(prev => {
                      const next = [...prev];
                      next[idx] = { ...next[idx], field: e.target.value };
                      return next;
                    });
                  }}
                  className="w-full text-[11px] bg-white border border-gray-200 rounded px-2 py-1 outline-none focus:border-[#00b14f]"
                />
                <div className="flex gap-1">
                  <input
                    placeholder="Bắt đầu"
                    value={edu.startYear}
                    onChange={e => {
                      setEducation(prev => {
                        const next = [...prev];
                        next[idx] = { ...next[idx], startYear: e.target.value };
                        return next;
                      });
                    }}
                    className="w-1/3 text-[11px] bg-white border border-gray-200 rounded px-1.5 py-1 outline-none focus:border-[#00b14f]"
                  />
                  <input
                    placeholder="Kết thúc"
                    value={edu.endYear}
                    onChange={e => {
                      setEducation(prev => {
                        const next = [...prev];
                        next[idx] = { ...next[idx], endYear: e.target.value };
                        return next;
                      });
                    }}
                    className="w-1/3 text-[11px] bg-white border border-gray-200 rounded px-1.5 py-1 outline-none focus:border-[#00b14f]"
                  />
                  <input
                    placeholder="GPA"
                    value={edu.GPA}
                    onChange={e => {
                      setEducation(prev => {
                        const next = [...prev];
                        next[idx] = { ...next[idx], GPA: e.target.value };
                        return next;
                      });
                    }}
                    className="w-1/3 text-[11px] bg-white border border-gray-200 rounded px-1.5 py-1 outline-none focus:border-[#00b14f]"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="h-px bg-gray-100" />

          {/* Fields đã điền */}
          {Object.keys(cvData).length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">
                Đã điền ({Object.keys(cvData).length})
              </p>
              <div className="flex flex-col gap-0.5">
                {Object.entries(cvData).slice(0, 10).map(([field, val]) => (
                  <div key={field}
                    className={`px-2.5 py-1.5 rounded-lg transition-colors ${activeField === field ? 'bg-[#f0faf4] border border-[#c2e8d2]' : 'hover:bg-gray-50'}`}>
                    <p className="text-[10px] text-gray-400 truncate">{field}</p>
                    <p className="text-[11px] font-medium text-gray-700 truncate">{val}</p>
                  </div>
                ))}
                {Object.keys(cvData).length > 10 && (
                  <p className="text-[10px] text-gray-400 px-2.5">+{Object.keys(cvData).length - 10} field khác</p>
                )}
              </div>
            </div>
          )}
        </aside>

        {/* Canvas */}
        <main className="flex-1 overflow-auto bg-[#e9eae6] flex justify-center py-8 px-6">
          <div style={{
            width: Math.round(794 * zoom),
            height: Math.round(1123 * zoom),
            flexShrink: 0,
            boxShadow: '0 8px 40px rgba(0,0,0,0.14)',
            borderRadius: 4,
            overflow: 'hidden',
            border: '1px solid rgba(0,0,0,0.06)',
          }}>
            <iframe
              ref={iframeRef}
              key={selectedTemplate?.id} // re-mount khi đổi template
              title="CV Editor"
              srcDoc={iframeSrcDoc}
              className="border-0 block origin-top-left"
              style={{
                width: 794,
                height: 1123,
                transform: `scale(${zoom})`,
                transformOrigin: 'top left',
              }}
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        </main>

      </div>
    </div>
  );
}