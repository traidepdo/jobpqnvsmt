'use client'
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

// ── Build preview doc ─────────────────────────────────────────────────────────
function buildPreview(html: string, css: string) {
    return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8"/>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: #fff; -webkit-font-smoothing: antialiased; }
${css}
</style>
</head>
<body>${html}</body>
</html>`;
}

const SAMPLE_HTML = `<div style="font-family:'Segoe UI',Arial,sans-serif;font-size:13px;color:#2d2d2d;background:#fff;width:794px;min-height:1123px;">

  <!-- HEADER -->
  <div style="display:flex;gap:24px;padding:32px 36px 24px;border-bottom:2.5px solid #00b14f;align-items:flex-start;">
    <div style="width:110px;height:130px;border-radius:8px;background:#e8e8e8;flex-shrink:0;display:flex;align-items:center;justify-content:center;">
      <svg width="40" height="40" fill="none" stroke="#bbb" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
      </svg>
    </div>
    <div style="flex:1;">
      <div style="font-size:26px;font-weight:700;color:#1a1a1a;margin-bottom:4px;">
        <span data-field="name">Họ và tên của bạn</span>
      </div>
      <div style="font-size:14px;color:#00963e;font-weight:600;margin-bottom:16px;">
        <span data-field="title">Vị trí ứng tuyển</span>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 24px;font-size:12.5px;">
        <div><b style="color:#333;">Ngày sinh:</b> <span data-field="dob">DD/MM/YY</span></div>
        <div><b style="color:#333;">Điện thoại:</b> <span data-field="phone" style="color:#c0392b;">0123 456 789</span></div>
        <div><b style="color:#333;">Giới tính:</b> <span data-field="gender">Nam/Nữ</span></div>
        <div><b style="color:#333;">Email:</b> <span data-field="email">email@example.com</span></div>
        <div><b style="color:#333;">Website:</b> <span data-field="website">facebook.com/profile</span></div>
        <div><b style="color:#333;">Địa chỉ:</b> <span data-field="address" style="color:#c0392b;">Quận A, thành phố B</span></div>
      </div>
    </div>
  </div>

  <!-- BODY -->
  <div style="padding:22px 36px;">

    <!-- MỤC TIÊU -->
    <div style="margin-bottom:22px;">
      <div style="font-size:13px;font-weight:700;letter-spacing:1px;color:#1a1a1a;border-bottom:2px solid #00b14f;padding-bottom:6px;margin-bottom:10px;">MỤC TIÊU NGHỀ NGHIỆP</div>
      <p style="color:#555;line-height:1.75;font-style:italic;">
        <span data-field="summary" data-multiline="true">Mục tiêu nghề nghiệp của bạn, bao gồm mục tiêu ngắn hạn và dài hạn</span>
      </p>
    </div>

    <!-- HỌC VẤN -->
    <div style="margin-bottom:22px;">
      <div style="font-size:13px;font-weight:700;letter-spacing:1px;color:#1a1a1a;border-bottom:2px solid #00b14f;padding-bottom:6px;margin-bottom:10px;">HỌC VẤN</div>
      <div style="display:flex;gap:20px;margin-bottom:14px;">
        <div style="width:100px;flex-shrink:0;font-size:11.5px;color:#777;line-height:1.6;">
          <span data-field="edu_0_start">Bắt đầu</span> –<br/><span data-field="edu_0_end">Kết thúc</span>
        </div>
        <div style="flex:1;">
          <div style="font-weight:700;font-size:13.5px;color:#1a1a1a;margin-bottom:2px;"><span data-field="edu_0_school">Tên trường học</span></div>
          <div style="color:#555;margin-bottom:4px;"><span data-field="edu_0_field">Ngành học / Môn học</span></div>
          <div style="color:#777;font-size:12px;font-style:italic;"><span data-field="edu_0_desc" data-multiline="true">Mô tả quá trình học tập hoặc thành tích của bạn</span></div>
        </div>
      </div>
    </div>

    <!-- KINH NGHIỆM -->
    <div style="margin-bottom:22px;">
      <div style="font-size:13px;font-weight:700;letter-spacing:1px;color:#1a1a1a;border-bottom:2px solid #00b14f;padding-bottom:6px;margin-bottom:10px;">KINH NGHIỆM LÀM VIỆC</div>
      <div style="display:flex;gap:20px;margin-bottom:16px;">
        <div style="width:100px;flex-shrink:0;font-size:11.5px;color:#777;line-height:1.6;">
          <span data-field="exp_0_start">Bắt đầu</span> –<br/><span data-field="exp_0_end">Kết thúc</span>
        </div>
        <div style="flex:1;">
          <div style="font-weight:700;font-size:13.5px;color:#1a1a1a;margin-bottom:2px;"><span data-field="exp_0_company">Tên công ty</span></div>
          <div style="color:#00963e;font-weight:600;margin-bottom:4px;"><span data-field="exp_0_position">Vị trí công việc</span></div>
          <div style="color:#777;font-size:12px;font-style:italic;"><span data-field="exp_0_desc" data-multiline="true">Mô tả kinh nghiệm làm việc của bạn</span></div>
        </div>
      </div>
      <div style="display:flex;gap:20px;margin-bottom:16px;">
        <div style="width:100px;flex-shrink:0;font-size:11.5px;color:#777;line-height:1.6;">
          <span data-field="exp_1_start">Bắt đầu</span> –<br/><span data-field="exp_1_end">Kết thúc</span>
        </div>
        <div style="flex:1;">
          <div style="font-weight:700;font-size:13.5px;color:#1a1a1a;margin-bottom:2px;"><span data-field="exp_1_company">Tên công ty</span></div>
          <div style="color:#00963e;font-weight:600;margin-bottom:4px;"><span data-field="exp_1_position">Vị trí công việc</span></div>
          <div style="color:#777;font-size:12px;font-style:italic;"><span data-field="exp_1_desc" data-multiline="true">Mô tả kinh nghiệm làm việc của bạn</span></div>
        </div>
      </div>
    </div>

  </div>
</div>`;

const SAMPLE_CSS = `* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: #fff; }`;

// ══════════════════════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════════════════════
export default function AdminTemplateEditor() {
    const router = useRouter();
    const params = useParams();
    const isEdit = !!params?.id;

    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('Cơ bản');
    const [htmlContent, setHtmlContent] = useState(SAMPLE_HTML);
    const [cssContent, setCssContent] = useState(SAMPLE_CSS);
    const [thumbnailUrl, setThumbnailUrl] = useState('');
    const [activeTab, setActiveTab] = useState<'html' | 'css'>('html');
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(isEdit);
    const [zoom, setZoom] = useState(0.6);

    // Load nếu đang edit
    useEffect(() => {
        if (!isEdit) return;
        fetch(`/api/admin/templates/${params.id}`)
            .then(r => r.json())
            .then(d => {
                if (d.template) {
                    const t = d.template;
                    setName(t.name); setSlug(t.slug); setDescription(t.description || '');
                    setCategory(t.category); setHtmlContent(t.htmlContent);
                    setCssContent(t.cssContent); setThumbnailUrl(t.thumbnailUrl || '');
                }
            })
            .finally(() => setLoading(false));
    }, []);

    // Auto slug từ name
    const handleNameChange = (v: string) => {
        setName(v);
        if (!isEdit) {
            setSlug(v.toLowerCase()
                .replace(/[àáâãäå]/g, 'a').replace(/[èéêë]/g, 'e')
                .replace(/[ìíîï]/g, 'i').replace(/[òóôõö]/g, 'o')
                .replace(/[ùúûü]/g, 'u').replace(/[ýÿ]/g, 'y')
                .replace(/[đ]/g, 'd').replace(/[^a-z0-9 -]/g, '')
                .replace(/\s+/g, '-').replace(/-+/g, '-').trim()
            );
        }
    };

    const handleSave = async () => {
        if (!name.trim() || !slug.trim()) { alert('Vui lòng nhập tên và slug'); return; }
        setSaving(true);
        try {
            const url = isEdit ? `/api/admin/templates/${params.id}` : '/api/admin/templates';
            const method = isEdit ? 'PUT' : 'POST';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, slug, description, category, htmlContent, cssContent, thumbnailUrl: thumbnailUrl || null }),
            });
            if (res.ok) {
                alert(isEdit ? 'Cập nhật thành công!' : 'Tạo template thành công!');
                router.push('/admin/templates');
            } else {
                const err = await res.json().catch(() => ({}));
                alert(err.error || 'Có lỗi xảy ra');
            }
        } catch { alert('Lỗi kết nối'); }
        finally { setSaving(false); }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="w-9 h-9 border-[3px] border-gray-200 border-t-[#00b14f] rounded-full animate-spin" />
        </div>
    );

    const previewDoc = buildPreview(htmlContent, cssContent);

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-[#f7f8f5]">

            {/* Topbar */}
            <header className="bg-white border-b border-gray-100 flex-shrink-0 h-14 flex items-center justify-between px-5 gap-4">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.push('/admin/templates')}
                        className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 cursor-pointer transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>
                    <span className="text-[14px] font-bold text-gray-900">
                        {isEdit ? 'Chỉnh sửa template' : 'Tạo template mới'}
                    </span>
                </div>

                {/* Zoom */}
                <div className="flex items-center gap-1.5">
                    <button onClick={() => setZoom(z => Math.max(0.3, +(z - 0.05).toFixed(2)))}
                        className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:border-gray-400 cursor-pointer font-bold text-sm">−</button>
                    <span className="text-[12px] font-bold text-gray-600 tabular-nums w-10 text-center">{Math.round(zoom * 100)}%</span>
                    <button onClick={() => setZoom(z => Math.min(1.0, +(z + 0.05).toFixed(2)))}
                        className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:border-gray-400 cursor-pointer font-bold text-sm">+</button>
                </div>

                <button onClick={handleSave} disabled={saving}
                    className="h-8 px-5 rounded-lg text-[13px] font-semibold text-white bg-[#00b14f] hover:bg-[#009940] cursor-pointer disabled:opacity-60 flex items-center gap-2 transition-colors">
                    {saving
                        ? <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
                        : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    }
                    {saving ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Tạo template'}
                </button>
            </header>

            {/* Body */}
            <div className="flex flex-1 overflow-hidden">

                {/* Left: form + code editor */}
                <div className="w-[440px] flex-shrink-0 bg-white border-r border-gray-100 flex flex-col overflow-hidden">

                    {/* Meta fields */}
                    <div className="px-5 py-4 border-b border-gray-100 flex flex-col gap-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Tên template *</label>
                                <input value={name} onChange={e => handleNameChange(e.target.value)}
                                    placeholder="CV Chuyên Nghiệp"
                                    className="w-full h-9 px-3 text-[13px] bg-[#fafafa] border border-gray-200 rounded-lg outline-none focus:border-[#00b14f] focus:ring-2 focus:ring-[#00b14f]/10 transition" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Slug *</label>
                                <input value={slug} onChange={e => setSlug(e.target.value)}
                                    placeholder="cv-chuyen-nghiep"
                                    className="w-full h-9 px-3 text-[13px] bg-[#fafafa] border border-gray-200 rounded-lg outline-none focus:border-[#00b14f] focus:ring-2 focus:ring-[#00b14f]/10 transition font-mono" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Danh mục</label>
                                <select value={category} onChange={e => setCategory(e.target.value)}
                                    className="w-full h-9 px-3 text-[13px] bg-[#fafafa] border border-gray-200 rounded-lg outline-none focus:border-[#00b14f] transition cursor-pointer">
                                    {['Cơ bản', 'Chuyên nghiệp', 'Sáng tạo', 'Hiện đại', 'Khách sạn', 'IT'].map(c => (
                                        <option key={c}>{c}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Thumbnail URL</label>
                                <input value={thumbnailUrl} onChange={e => setThumbnailUrl(e.target.value)}
                                    placeholder="https://..."
                                    className="w-full h-9 px-3 text-[13px] bg-[#fafafa] border border-gray-200 rounded-lg outline-none focus:border-[#00b14f] transition" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Mô tả ngắn</label>
                            <input value={description} onChange={e => setDescription(e.target.value)}
                                placeholder="Mẫu CV 1 cột phù hợp mọi ngành..."
                                className="w-full h-9 px-3 text-[13px] bg-[#fafafa] border border-gray-200 rounded-lg outline-none focus:border-[#00b14f] transition" />
                        </div>
                    </div>

                    {/* Code tabs */}
                    <div className="flex border-b border-gray-100 flex-shrink-0">
                        {(['html', 'css'] as const).map(tab => (
                            <button key={tab} onClick={() => setActiveTab(tab)}
                                className={`flex-1 py-2.5 text-[12px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${activeTab === tab ? 'text-[#00b14f] border-b-2 border-[#00b14f] bg-[#f0faf4]' : 'text-gray-400 hover:text-gray-600'}`}>
                                {tab === 'html' ? 'HTML' : 'CSS'}
                            </button>
                        ))}
                    </div>

                    {/* Code editor */}
                    <div className="flex-1 overflow-hidden relative">
                        {activeTab === 'html' ? (
                            <textarea
                                value={htmlContent}
                                onChange={e => setHtmlContent(e.target.value)}
                                spellCheck={false}
                                className="w-full h-full p-4 text-[12px] font-mono bg-[#1e1e2e] text-[#cdd6f4] outline-none resize-none leading-relaxed"
                                style={{ caretColor: '#00b14f' }}
                            />
                        ) : (
                            <textarea
                                value={cssContent}
                                onChange={e => setCssContent(e.target.value)}
                                spellCheck={false}
                                className="w-full h-full p-4 text-[12px] font-mono bg-[#1e1e2e] text-[#cdd6f4] outline-none resize-none leading-relaxed"
                                style={{ caretColor: '#00b14f' }}
                            />
                        )}
                        {/* Hint */}
                        <div className="absolute bottom-3 right-3 bg-black/60 text-[10px] text-gray-300 px-2 py-1 rounded-lg pointer-events-none">
                            Dùng <code className="text-[#00b14f]">data-field="tên_field"</code> để user edit được
                        </div>
                    </div>
                </div>

                {/* Right: live preview */}
                <div className="flex-1 bg-[#e9eae6] overflow-auto flex flex-col">
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-white border-b border-gray-100 flex-shrink-0">
                        <div className="flex gap-1.5">
                            <span className="w-2.5 h-2.5 bg-red-400 rounded-full" />
                            <span className="w-2.5 h-2.5 bg-yellow-400 rounded-full" />
                            <span className="w-2.5 h-2.5 bg-green-400 rounded-full" />
                        </div>
                        <span className="text-[11px] font-semibold text-gray-400 ml-1">Preview</span>
                        <div className="ml-auto flex items-center gap-1 bg-[#f0faf4] border border-[#c2e8d2] px-2 py-1 rounded-full">
                            <span className="w-1.5 h-1.5 bg-[#00b14f] rounded-full animate-pulse" />
                            <span className="text-[9px] font-bold text-[#00963e] uppercase tracking-widest">Live</span>
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto flex justify-center py-8 px-6">
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
                                title="Template Preview"
                                srcDoc={previewDoc}
                                className="border-0 block origin-top-left"
                                style={{ width: 794, height: 1123, transform: `scale(${zoom})`, transformOrigin: 'top left' }}
                                sandbox="allow-same-origin"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}