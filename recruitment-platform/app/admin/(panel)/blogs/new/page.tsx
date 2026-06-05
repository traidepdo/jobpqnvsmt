'use client'
import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';

type BlogType = 'RICH_TEXT' | 'HTML_PAGE';

// ── Toolbar button ─────────────────────────────────────────────────────────────
function ToolBtn({ onClick, active, title, children }: {
    onClick: () => void; active?: boolean; title: string; children: React.ReactNode;
}) {
    return (
        <button type="button" onClick={onClick} title={title}
            className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-colors cursor-pointer ${active ? 'bg-[#00b14f] text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}>
            {children}
        </button>
    );
}

// ── TipTap Toolbar ─────────────────────────────────────────────────────────────
function EditorToolbar({ editor }: { editor: any }) {
    if (!editor) return null;
    const addImage = () => {
        const url = prompt('Nhập URL ảnh:');
        if (url) editor.chain().focus().setImage({ src: url }).run();
    };
    const setLink = () => {
        const url = prompt('Nhập URL link:');
        if (url) editor.chain().focus().setLink({ href: url }).run();
        else editor.chain().focus().unsetLink().run();
    };
    return (
        <div className="flex items-center gap-0.5 flex-wrap px-3 py-2 border-b border-gray-100 bg-gray-50/50">
            <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="H1">H1</ToolBtn>
            <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="H2">H2</ToolBtn>
            <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="H3">H3</ToolBtn>
            <div className="w-px h-5 bg-gray-200 mx-1" />
            <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold"><b>B</b></ToolBtn>
            <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic"><i>I</i></ToolBtn>
            <ToolBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline"><u>U</u></ToolBtn>
            <ToolBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strike"><s>S</s></ToolBtn>
            <div className="w-px h-5 bg-gray-200 mx-1" />
            <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet list">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>
            </ToolBtn>
            <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Ordered list">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l3 3-3 3M4 6h.01M4 12h.01M4 18h.01M9 12h11M9 18h11" /></svg>
            </ToolBtn>
            <ToolBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Blockquote">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M3 11l4-4v9H3V11zm8 0l4-4v9h-4V11z" /></svg>
            </ToolBtn>
            <ToolBtn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Code">{'</>'}</ToolBtn>
            <div className="w-px h-5 bg-gray-200 mx-1" />
            <ToolBtn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Align left">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6h18M3 10h12M3 14h18M3 18h12" /></svg>
            </ToolBtn>
            <ToolBtn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Align center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6h18M6 10h12M3 14h18M6 18h12" /></svg>
            </ToolBtn>
            <div className="w-px h-5 bg-gray-200 mx-1" />
            <ToolBtn onClick={setLink} active={editor.isActive('link')} title="Link">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 010-5.656l4-4a4 4 0 015.656 5.656l-1.1 1.1" /></svg>
            </ToolBtn>
            <ToolBtn onClick={addImage} title="Thêm ảnh">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </ToolBtn>
            <div className="w-px h-5 bg-gray-200 mx-1" />
            <ToolBtn onClick={() => editor.chain().focus().undo().run()} title="Undo">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
            </ToolBtn>
            <ToolBtn onClick={() => editor.chain().focus().redo().run()} title="Redo">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" /></svg>
            </ToolBtn>
        </div>
    );
}

// ── HTML Editor với preview live ───────────────────────────────────────────────
function HtmlEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    const [tab, setTab] = useState<'code' | 'preview' | 'split'>('split');
    const iframeRef = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
        if (tab === 'preview' || tab === 'split') {
            const iframe = iframeRef.current;
            if (!iframe) return;
            const doc = iframe.contentDocument || iframe.contentWindow?.document;
            if (!doc) return;
            doc.open();
            doc.write(value);
            doc.close();
        }
    }, [value, tab]);

    return (
        <div className="flex flex-col h-full bg-white border border-gray-100 rounded-2xl overflow-hidden">
            <div className="flex items-center gap-1 px-3 py-2 border-b border-gray-100 bg-gray-50/50">
                <div className="flex bg-gray-100 rounded-lg p-0.5 gap-0.5">
                    {(['code', 'split', 'preview'] as const).map(t => (
                        <button key={t} type="button" onClick={() => setTab(t)}
                            className={`px-3 h-7 rounded-md text-xs font-semibold cursor-pointer transition-colors ${tab === t ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                }`}>
                            {t === 'code' ? '💻 Code' : t === 'split' ? '⚡ Split' : '👁 Preview'}
                        </button>
                    ))}
                </div>
                <div className="ml-auto flex items-center gap-2">
                    <span className="text-xs text-gray-400">{value.length} ký tự</span>
                    <button type="button"
                        onClick={() => {
                            const blob = new Blob([value], { type: 'text/html' });
                            const url = URL.createObjectURL(blob);
                            window.open(url, '_blank');
                        }}
                        className="h-7 px-3 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors flex items-center gap-1.5">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                        Mở tab mới
                    </button>
                </div>
            </div>

            <div className={`flex flex-1 min-h-0 ${tab === 'split' ? 'flex-row' : 'flex-col'}`} style={{ height: '600px' }}>
                {(tab === 'code' || tab === 'split') && (
                    <div className={`flex flex-col ${tab === 'split' ? 'w-1/2 border-r border-gray-100' : 'flex-1'}`}>
                        <div className="px-3 py-1.5 bg-[#1e1e2e] border-b border-white/5">
                            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">HTML / CSS / JS</span>
                        </div>
                        <textarea
                            value={value}
                            onChange={e => onChange(e.target.value)}
                            spellCheck={false}
                            placeholder={`<!DOCTYPE html>\n<html lang="vi">\n<head>\n  <meta charset="UTF-8">\n  <title>Landing Page</title>\n  <style>\n    /* CSS */\n  </style>\n</head>\n<body>\n  <!-- Nội dung -->\n</body>\n</html>`}
                            className="flex-1 w-full resize-none outline-none font-mono text-sm text-gray-100 bg-[#1e1e2e] px-4 py-3 leading-relaxed placeholder-gray-600"
                        />
                    </div>
                )}
                {(tab === 'preview' || tab === 'split') && (
                    <div className={`flex flex-col ${tab === 'split' ? 'w-1/2' : 'flex-1'}`}>
                        <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                            <div className="flex gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                                <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                            </div>
                            <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">Preview</span>
                        </div>
                        <iframe
                            ref={iframeRef}
                            className="flex-1 w-full border-0 bg-white"
                            sandbox="allow-scripts allow-same-origin"
                            title="HTML Preview"
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════
export default function BlogEditorPage() {
    const router = useRouter();
    const params = useParams();
    const isEdit = params?.id && params.id !== 'new';

    const [blogType, setBlogType] = useState<BlogType>('RICH_TEXT');
    const [title, setTitle] = useState('');
    const [slug, setSlug] = useState('');
    const [excerpt, setExcerpt] = useState('');
    const [thumbnail, setThumbnail] = useState('');
    const [isPublished, setIsPublished] = useState(false);
    const [htmlContent, setHtmlContent] = useState('');
    const [categoryId, setCategoryId] = useState<string>('');
    const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(!!(params?.id && params.id !== 'new'));
    const [wordCount, setWordCount] = useState(0);

    // ── Cloudinary upload state ────────────────────────────────────────────────
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleThumbnailUpload = async (file: File) => {
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Vui lòng chọn file ảnh');
            return;
        }
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('Ảnh tối đa 5MB');
            return;
        }

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append(
                'upload_preset',
                process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!
            );
            // Optional: tổ chức ảnh vào folder riêng
            formData.append('folder', 'blog/thumbnails');

            const res = await fetch(
                `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
                { method: 'POST', body: formData }
            );

            if (!res.ok) throw new Error('Upload failed');

            const data = await res.json();
            if (data.secure_url) {
                setThumbnail(data.secure_url);
            } else {
                alert('Upload thất bại: ' + (data.error?.message || 'Unknown error'));
            }
        } catch (err) {
            console.error(err);
            alert('Lỗi kết nối Cloudinary');
        } finally {
            setUploading(false);
        }
    };
    // ──────────────────────────────────────────────────────────────────────────

    const editor = useEditor({
        extensions: [
            StarterKit,
            Image.configure({ inline: false, allowBase64: true }),
            Link.configure({ openOnClick: false }),
            Placeholder.configure({ placeholder: 'Bắt đầu viết nội dung bài viết...' }),
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            Underline,
        ],
        content: '',
        onUpdate: ({ editor }) => {
            const text = editor.getText();
            setWordCount(text.trim().split(/\s+/).filter(Boolean).length);
        },
        editorProps: {
            attributes: { class: 'prose prose-sm max-w-none focus:outline-none min-h-[400px] px-6 py-5' },
        },
    });

    // Fetch danh sách danh mục
    useEffect(() => {
        fetch('/api/admin/blog-categories')
            .then(r => r.json())
            .then(d => { if (d.ok) setCategories(d.categories); })
            .catch(() => { });
    }, []);

    // Load bài viết nếu đang edit
    const [richTextContent, setRichTextContent] = useState('');

    useEffect(() => {
        if (!params?.id || params.id === 'new') return;
        fetch(`/api/admin/blogs/${params.id}`)
            .then(r => r.json())
            .then(d => {
                if (d.post) {
                    const p = d.post;
                    setTitle(p.title);
                    setSlug(p.slug);
                    setExcerpt(p.excerpt || '');
                    setThumbnail(p.thumbnail || '');
                    setIsPublished(p.isPublished ?? false);
                    setCategoryId(p.categoryId || '');
                    setBlogType(p.type || 'RICH_TEXT');
                    if (p.type === 'HTML_PAGE') {
                        setHtmlContent(p.content || '');
                    } else {
                        setRichTextContent(p.content || '');
                    }
                }
            })
            .finally(() => setLoading(false));
    }, [params?.id]);

    useEffect(() => {
        if (editor && richTextContent) {
            editor.commands.setContent(richTextContent);
        }
    }, [editor, richTextContent]);

    // Auto slug từ title
    const handleTitleChange = (v: string) => {
        setTitle(v);
        if (!isEdit) {
            setSlug(
                v.toLowerCase()
                    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                    .replace(/[đĐ]/g, 'd')
                    .replace(/[^a-z0-9\s-]/g, '')
                    .replace(/\s+/g, '-').replace(/-+/g, '-').trim()
            );
        }
    };

    const handleSave = async (publishOverride?: boolean) => {
        if (!title.trim()) { alert('Vui lòng nhập tiêu đề'); return; }
        if (!slug.trim()) { alert('Vui lòng nhập slug'); return; }

        const content = blogType === 'HTML_PAGE'
            ? htmlContent
            : (editor?.getHTML() || '');

        setSaving(true);
        const finalIsPublished = publishOverride !== undefined ? publishOverride : isPublished;
        try {
            const url = isEdit ? `/api/admin/blogs/${params.id}` : '/api/admin/blogs';
            const method = isEdit ? 'PUT' : 'POST';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title, slug, excerpt, thumbnail,
                    content,
                    isPublished: finalIsPublished,
                    type: blogType,
                    categoryId: categoryId || null,
                }),
            });
            if (res.ok) {
                router.push('/admin/blogs');
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

    return (
        <div className="min-h-screen bg-[#f7f8f5]">
            {/* Topbar */}
            <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <button onClick={() => router.push('/admin/blogs')}
                            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 cursor-pointer transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </button>
                        <span className="text-[14px] font-bold text-gray-900">
                            {isEdit ? 'Chỉnh sửa bài viết' : 'Viết bài mới'}
                        </span>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${isPublished ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                            {isPublished ? '✅ Đã đăng' : '📝 Nháp'}
                        </span>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${blogType === 'HTML_PAGE' ? 'bg-violet-100 text-violet-700' : 'bg-blue-50 text-blue-600'}`}>
                            {blogType === 'HTML_PAGE' ? '🌐 Landing Page' : '📝 Rich Text'}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        {blogType === 'RICH_TEXT' && (
                            <span className="text-xs text-gray-400">{wordCount} từ</span>
                        )}
                        <button onClick={() => handleSave(false)} disabled={saving}
                            className="h-8 px-4 rounded-lg text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors disabled:opacity-60">
                            Lưu nháp
                        </button>
                        <button onClick={() => handleSave(true)} disabled={saving}
                            className="h-8 px-4 rounded-lg text-sm font-semibold text-white bg-[#00b14f] hover:bg-[#009940] cursor-pointer transition-colors disabled:opacity-60 flex items-center gap-2">
                            {saving
                                ? <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
                                : null}
                            {saving ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Đăng bài'}
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-6xl mx-auto px-6 py-6 grid grid-cols-3 gap-6">

                {/* Editor chính */}
                <div className="col-span-2 flex flex-col gap-4">
                    {/* Title */}
                    <input
                        value={title}
                        onChange={e => handleTitleChange(e.target.value)}
                        placeholder="Tiêu đề bài viết..."
                        className="w-full text-2xl font-bold text-gray-900 bg-white border border-gray-100 rounded-2xl px-6 py-4 outline-none focus:border-[#00b14f] focus:ring-2 focus:ring-[#00b14f]/10 transition placeholder-gray-200"
                    />

                    {/* Type switcher */}
                    <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-2xl px-4 py-3">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-2">Loại bài:</span>
                        <button type="button"
                            onClick={() => setBlogType('RICH_TEXT')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer transition-all ${blogType === 'RICH_TEXT'
                                ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200'
                                : 'text-gray-500 hover:bg-gray-50'}`}>
                            📝 Rich Text
                        </button>
                        <button type="button"
                            onClick={() => setBlogType('HTML_PAGE')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer transition-all ${blogType === 'HTML_PAGE'
                                ? 'bg-violet-50 text-violet-700 ring-1 ring-violet-200'
                                : 'text-gray-500 hover:bg-gray-50'}`}>
                            🌐 Landing Page (HTML/CSS/JS)
                        </button>
                    </div>

                    {/* Conditional editor */}
                    {blogType === 'RICH_TEXT' ? (
                        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                            <EditorToolbar editor={editor} />
                            <EditorContent editor={editor} />
                        </div>
                    ) : (
                        <HtmlEditor value={htmlContent} onChange={setHtmlContent} />
                    )}
                </div>

                {/* Sidebar */}
                <div className="flex flex-col gap-4">
                    {/* Publish settings */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-5">
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-4">Cài đặt đăng bài</p>
                        <div className="flex flex-col gap-3">
                            <div>
                                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Trạng thái</label>
                                <select value={String(isPublished)} onChange={e => setIsPublished(e.target.value === 'true')}
                                    className="w-full h-9 px-3 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-[#00b14f] cursor-pointer transition">
                                    <option value="false">📝 Nháp</option>
                                    <option value="true">✅ Đăng ngay</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Slug *</label>
                                <input value={slug} onChange={e => setSlug(e.target.value)}
                                    placeholder="slug-bai-viet"
                                    className="w-full h-9 px-3 text-sm font-mono bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-[#00b14f] transition" />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Danh mục</label>
                                <select value={categoryId} onChange={e => setCategoryId(e.target.value)}
                                    className="w-full h-9 px-3 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-[#00b14f] cursor-pointer transition">
                                    <option value="">— Không có danh mục —</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* ── Thumbnail với Cloudinary upload ── */}
                    {blogType === 'RICH_TEXT' && (
                        <div className="bg-white rounded-2xl border border-gray-100 p-5">
                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Ảnh đại diện</p>

                            {/* Preview ảnh */}
                            {thumbnail ? (
                                <div className="mb-3 rounded-xl overflow-hidden border border-gray-100 relative group">
                                    <img src={thumbnail} alt="thumbnail" className="w-full h-32 object-cover" />
                                    {/* Nút xoá */}
                                    <button
                                        type="button"
                                        onClick={() => setThumbnail('')}
                                        className="absolute top-2 right-2 w-6 h-6 bg-black/50 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer hover:bg-black/70"
                                        title="Xoá ảnh"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ) : (
                                /* Drop zone khi chưa có ảnh */
                                <div
                                    className="mb-3 h-32 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 text-gray-300 cursor-pointer hover:border-[#00b14f] hover:text-[#00b14f] transition-colors"
                                    onClick={() => !uploading && fileInputRef.current?.click()}
                                >
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <span className="text-xs font-medium">Click để chọn ảnh</span>
                                </div>
                            )}

                            {/* Hidden file input */}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/gif,image/webp,image/avif"
                                className="hidden"
                                onChange={e => {
                                    const file = e.target.files?.[0];
                                    if (file) handleThumbnailUpload(file);
                                    e.target.value = ''; // reset để có thể chọn lại cùng file
                                }}
                            />

                            {/* Upload button */}
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                className="w-full h-9 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-[#00b14f] hover:text-[#00b14f] cursor-pointer transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {uploading ? (
                                    <>
                                        <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                        </svg>
                                        Đang upload lên Cloudinary...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                        </svg>
                                        {thumbnail ? 'Đổi ảnh' : 'Chọn ảnh từ máy'}
                                    </>
                                )}
                            </button>

                            {/* Divider */}
                            <div className="flex items-center gap-2 my-2">
                                <div className="flex-1 h-px bg-gray-100" />
                                <span className="text-[10px] text-gray-300 font-medium">hoặc</span>
                                <div className="flex-1 h-px bg-gray-100" />
                            </div>

                            {/* Nhập URL thủ công */}
                            <input
                                value={thumbnail}
                                onChange={e => setThumbnail(e.target.value)}
                                placeholder="Dán URL ảnh trực tiếp..."
                                className="w-full h-9 px-3 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-[#00b14f] transition"
                            />

                            {/* Hiển thị URL đã upload */}
                            {thumbnail && thumbnail.includes('cloudinary.com') && (
                                <p className="mt-2 text-[10px] text-emerald-600 flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    Đã upload lên Cloudinary
                                </p>
                            )}
                        </div>
                    )}

                    {/* Excerpt */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-5">
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Mô tả ngắn</p>
                        <textarea value={excerpt} onChange={e => setExcerpt(e.target.value)}
                            placeholder="Tóm tắt nội dung bài viết, hiển thị ở trang danh sách..."
                            rows={4}
                            className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-[#00b14f] transition resize-none" />
                    </div>

                    {/* Hướng dẫn nếu là HTML_PAGE */}
                    {blogType === 'HTML_PAGE' && (
                        <div className="bg-violet-50 rounded-2xl border border-violet-100 p-5">
                            <p className="text-[11px] font-bold text-violet-500 uppercase tracking-wider mb-2">💡 Hướng dẫn</p>
                            <ul className="text-xs text-violet-700 space-y-1.5 leading-relaxed">
                                <li>• Viết HTML đầy đủ từ <code className="bg-violet-100 px-1 rounded">&lt;!DOCTYPE html&gt;</code></li>
                                <li>• CSS viết trong thẻ <code className="bg-violet-100 px-1 rounded">&lt;style&gt;</code></li>
                                <li>• JS viết trong thẻ <code className="bg-violet-100 px-1 rounded">&lt;script&gt;</code></li>
                                <li>• Preview cập nhật real-time khi bạn gõ</li>
                                <li>• Bài sẽ hiển thị fullscreen cho người đọc</li>
                            </ul>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left; color: #adb5bd; pointer-events: none; height: 0;
        }
        .prose h1 { font-size: 1.75rem; font-weight: 800; margin: 1.5rem 0 0.75rem; }
        .prose h2 { font-size: 1.4rem; font-weight: 700; margin: 1.25rem 0 0.5rem; }
        .prose h3 { font-size: 1.15rem; font-weight: 600; margin: 1rem 0 0.5rem; }
        .prose p  { margin: 0.6rem 0; line-height: 1.8; color: #374151; }
        .prose ul, .prose ol { padding-left: 1.5rem; margin: 0.75rem 0; }
        .prose li { margin: 0.3rem 0; }
        .prose blockquote { border-left: 3px solid #00b14f; padding-left: 1rem; color: #6b7280; margin: 1rem 0; font-style: italic; }
        .prose code { background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-size: 0.85em; color: #e11d48; }
        .prose pre  { background: #1e1e2e; color: #cdd6f4; padding: 1rem; border-radius: 0.75rem; overflow-x: auto; margin: 1rem 0; }
        .prose pre code { background: none; color: inherit; padding: 0; }
        .prose img  { border-radius: 0.75rem; max-width: 100%; margin: 1rem 0; }
        .prose a    { color: #00963e; text-decoration: underline; }
      `}</style>
        </div>
    );
}