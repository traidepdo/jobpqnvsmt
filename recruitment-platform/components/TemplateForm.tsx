"use client";
// app/admin/templates/components/TemplateForm.tsx

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

type TemplateCategory = "BASIC" | "PROFESSIONAL" | "CREATIVE" | "MODERN" | "ACADEMIC";

interface TemplateFormData {
    id?: string;
    name: string;
    slug: string;
    description: string;
    thumbnailUrl: string;
    htmlContent: string;
    cssContent: string;
    category: TemplateCategory;
    isActive: boolean;
}

interface TemplateFormProps {
    mode: "create" | "edit";
    initialData?: TemplateFormData;
}

const CATEGORY_OPTIONS: { value: TemplateCategory; label: string }[] = [
    { value: "BASIC", label: "Cơ bản" },
    { value: "PROFESSIONAL", label: "Chuyên nghiệp" },
    { value: "CREATIVE", label: "Sáng tạo" },
    { value: "MODERN", label: "Hiện đại" },
    { value: "ACADEMIC", label: "Học thuật" },
];

const DEFAULT_HTML = `<div class="cv-wrapper">
  <div class="cv-header">
    <h1 class="cv-name">{{name}}</h1>
    <p class="cv-title">{{title}}</p>
  </div>
  <div class="cv-body">
    <div class="cv-section">
      <h2 class="cv-section-title">Mục tiêu nghề nghiệp</h2>
      <p class="cv-summary">{{summary}}</p>
    </div>
    <div class="cv-section">
      <h2 class="cv-section-title">Kinh nghiệm làm việc</h2>
      <div class="cv-entry">
        <div class="cv-entry-meta">2022 – 2024</div>
        <div class="cv-entry-content">
          <strong>Công ty ABC</strong>
          <span class="cv-position">Frontend Developer</span>
          <p>Mô tả công việc...</p>
        </div>
      </div>
    </div>
  </div>
</div>`;

const DEFAULT_CSS = `.cv-wrapper {
  font-family: 'Segoe UI', Arial, sans-serif;
  font-size: 13px;
  color: #2d2d2d;
  background: #fff;
  width: 794px;
  min-height: 1123px;
  padding: 40px;
  box-sizing: border-box;
}
.cv-header {
  border-bottom: 2px solid #00b14f;
  padding-bottom: 20px;
  margin-bottom: 24px;
}
.cv-name {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 4px;
  color: #1a1a1a;
}
.cv-title {
  font-size: 14px;
  color: #00963e;
  font-weight: 600;
  margin: 0;
}
.cv-section {
  margin-bottom: 24px;
}
.cv-section-title {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 1px;
  border-bottom: 2px solid #00b14f;
  padding-bottom: 6px;
  margin-bottom: 12px;
  text-transform: uppercase;
}
.cv-entry {
  display: flex;
  gap: 20px;
  margin-bottom: 14px;
}
.cv-entry-meta {
  width: 100px;
  flex-shrink: 0;
  font-size: 11.5px;
  color: #777;
  padding-top: 2px;
}
.cv-entry-content {
  flex: 1;
}
.cv-position {
  display: block;
  color: #00963e;
  font-weight: 600;
  margin: 2px 0 6px;
}
.cv-summary {
  color: #555;
  line-height: 1.7;
  font-style: italic;
}`;

function slugify(str: string) {
    return str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();
}

type Tab = "html" | "css" | "preview";

export default function TemplateForm({ mode, initialData }: TemplateFormProps) {
    const router = useRouter();
    const [form, setForm] = useState<TemplateFormData>({
        name: "",
        slug: "",
        description: "",
        thumbnailUrl: "",
        htmlContent: DEFAULT_HTML,
        cssContent: DEFAULT_CSS,
        category: "BASIC",
        isActive: true,
        ...initialData,
    });
    const [tab, setTab] = useState<Tab>("html");
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Partial<Record<keyof TemplateFormData, string>>>({});
    const [slugManual, setSlugManual] = useState(mode === "edit");
    const previewRef = useRef<HTMLIFrameElement>(null);

    // Auto slug from name
    useEffect(() => {
        if (!slugManual && form.name) {
            setForm((f) => ({ ...f, slug: slugify(f.name) }));
        }
    }, [form.name, slugManual]);

    // Refresh preview when switching to preview tab
    useEffect(() => {
        if (tab === "preview") refreshPreview();
    }, [tab, form.htmlContent, form.cssContent]);

    const refreshPreview = useCallback(() => {
        const iframe = previewRef.current;
        if (!iframe) return;
        const doc = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{margin:0;padding:0;background:#f0f0f0;display:flex;justify-content:center;padding:16px;}${form.cssContent}</style></head><body>${form.htmlContent}</body></html>`;
        iframe.srcdoc = doc;
    }, [form.htmlContent, form.cssContent]);

    const validate = () => {
        const e: Partial<Record<keyof TemplateFormData, string>> = {};
        if (!form.name.trim()) e.name = "Tên template không được để trống";
        if (!form.slug.trim()) e.slug = "Slug không được để trống";
        if (!/^[a-z0-9-]+$/.test(form.slug)) e.slug = "Slug chỉ được chứa chữ thường, số và dấu -";
        if (!form.htmlContent.trim()) e.htmlContent = "HTML content không được để trống";
        if (!form.cssContent.trim()) e.cssContent = "CSS content không được để trống";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        setSaving(true);
        try {
            const url =
                mode === "edit" ? `/api/admin/templates/${initialData!.id}` : "/api/admin/templates";
            const method = mode === "edit" ? "PUT" : "POST";
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            const json = await res.json();
            if (!res.ok) {
                if (json.error?.includes("Slug")) {
                    setErrors((e) => ({ ...e, slug: json.error }));
                } else {
                    alert(json.error || "Có lỗi xảy ra");
                }
                return;
            }
            router.push("/admin/templates");
        } catch {
            alert("Lỗi kết nối máy chủ");
        } finally {
            setSaving(false);
        }
    };

    const set = (field: keyof TemplateFormData, value: string | boolean) => {
        setForm((f) => ({ ...f, [field]: value }));
        setErrors((e) => ({ ...e, [field]: undefined }));
    };

    return (
        <div className="min-h-screen bg-[#f7f8f5]">
            {/* Top bar */}
            <header className="bg-white border-b border-gray-100 flex items-center justify-between px-6 h-14 sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push("/admin/templates")}
                        className="flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-gray-700 cursor-pointer transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Danh sách template
                    </button>
                    <span className="text-gray-200">/</span>
                    <span className="text-[13px] font-semibold text-gray-700">
                        {mode === "create" ? "Tạo template mới" : `Chỉnh sửa: ${initialData?.name}`}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => router.push("/admin/templates")}
                        className="h-8 px-4 rounded-lg text-[13px] font-medium text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="h-8 px-4 rounded-lg text-[13px] font-semibold text-white bg-[#00b14f] hover:bg-[#009940] transition-colors cursor-pointer disabled:opacity-60 flex items-center gap-2 shadow-sm"
                    >
                        {saving ? (
                            <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                            </svg>
                        ) : (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        )}
                        {mode === "create" ? "Tạo template" : "Lưu thay đổi"}
                    </button>
                </div>
            </header>

            {/* Body */}
            <div className="flex gap-0 h-[calc(100vh-56px)]">
                {/* Left: meta fields */}
                <aside className="w-[300px] flex-shrink-0 bg-white border-r border-gray-100 overflow-y-auto p-5 flex flex-col gap-4">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Thông tin chung</p>

                    {/* Name */}
                    <Field label="Tên template *" error={errors.name}>
                        <input
                            type="text"
                            value={form.name}
                            onChange={(e) => set("name", e.target.value)}
                            placeholder="Ví dụ: Template Hiện Đại"
                            className={inputCls(!!errors.name)}
                        />
                    </Field>

                    {/* Slug */}
                    <Field label="Slug *" error={errors.slug} hint="Dùng trong URL, chỉ chữ thường và dấu -">
                        <div className="flex gap-1.5">
                            <input
                                type="text"
                                value={form.slug}
                                onChange={(e) => {
                                    setSlugManual(true);
                                    set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                                }}
                                placeholder="ten-template"
                                className={`${inputCls(!!errors.slug)} flex-1`}
                            />
                            {slugManual && (
                                <button
                                    onClick={() => {
                                        setSlugManual(false);
                                        set("slug", slugify(form.name));
                                    }}
                                    title="Tự động từ tên"
                                    className="w-8 h-9 flex-shrink-0 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-400 cursor-pointer"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </Field>

                    {/* Category */}
                    <Field label="Danh mục">
                        <select
                            value={form.category}
                            onChange={(e) => set("category", e.target.value)}
                            className={inputCls(false)}
                        >
                            {CATEGORY_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                    </Field>

                    {/* Description */}
                    <Field label="Mô tả">
                        <textarea
                            value={form.description}
                            onChange={(e) => set("description", e.target.value)}
                            rows={3}
                            placeholder="Mô tả ngắn về template..."
                            className={`${inputCls(false)} resize-none`}
                        />
                    </Field>

                    {/* Thumbnail URL */}
                    <Field label="URL ảnh thumbnail">
                        <input
                            type="text"
                            value={form.thumbnailUrl}
                            onChange={(e) => set("thumbnailUrl", e.target.value)}
                            placeholder="https://..."
                            className={inputCls(false)}
                        />
                        {form.thumbnailUrl && (
                            <div className="mt-2 rounded-lg overflow-hidden border border-gray-100 bg-gray-50 aspect-[210/297]">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={form.thumbnailUrl} alt="Thumbnail" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />
                            </div>
                        )}
                    </Field>

                    {/* isActive */}
                    <div className="flex items-center justify-between py-2 border-t border-gray-100">
                        <div>
                            <p className="text-[13px] font-medium text-gray-700">Kích hoạt</p>
                            <p className="text-[11px] text-gray-400">Template hiển thị để người dùng chọn</p>
                        </div>
                        <button
                            onClick={() => set("isActive", !form.isActive)}
                            className={`relative w-10 h-6 rounded-full transition-colors cursor-pointer flex-shrink-0 ${form.isActive ? "bg-[#00b14f]" : "bg-gray-200"}`}
                        >
                            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isActive ? "translate-x-5" : "translate-x-1"}`} />
                        </button>
                    </div>
                </aside>

                {/* Right: code editors + preview */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Tab bar */}
                    <div className="bg-white border-b border-gray-100 flex items-center px-4 gap-0">
                        {(["html", "css", "preview"] as Tab[]).map((t) => (
                            <button
                                key={t}
                                onClick={() => setTab(t)}
                                className={`px-4 py-3 text-[13px] font-medium border-b-2 transition-colors cursor-pointer -mb-px ${tab === t
                                    ? "border-[#00b14f] text-[#00b14f]"
                                    : "border-transparent text-gray-400 hover:text-gray-600"
                                    }`}
                            >
                                {t === "html" ? "HTML" : t === "css" ? "CSS" : "Xem trước"}
                            </button>
                        ))}
                        {tab === "preview" && (
                            <button
                                onClick={refreshPreview}
                                className="ml-auto mr-2 flex items-center gap-1.5 text-[12px] text-gray-400 hover:text-gray-600 cursor-pointer"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Làm mới
                            </button>
                        )}
                    </div>

                    {/* Editor / Preview */}
                    <div className="flex-1 overflow-hidden">
                        {tab === "html" && (
                            <div className="h-full flex flex-col">
                                {errors.htmlContent && (
                                    <div className="px-4 py-2 bg-red-50 text-[12px] text-red-600 border-b border-red-100">{errors.htmlContent}</div>
                                )}
                                <textarea
                                    value={form.htmlContent}
                                    onChange={(e) => set("htmlContent", e.target.value)}
                                    spellCheck={false}
                                    className="flex-1 w-full p-4 font-mono text-[13px] bg-[#1e1e2e] text-[#cdd6f4] resize-none outline-none leading-relaxed"
                                    style={{ fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace" }}
                                />
                            </div>
                        )}
                        {tab === "css" && (
                            <div className="h-full flex flex-col">
                                {errors.cssContent && (
                                    <div className="px-4 py-2 bg-red-50 text-[12px] text-red-600 border-b border-red-100">{errors.cssContent}</div>
                                )}
                                <textarea
                                    value={form.cssContent}
                                    onChange={(e) => set("cssContent", e.target.value)}
                                    spellCheck={false}
                                    className="flex-1 w-full p-4 font-mono text-[13px] bg-[#1e1e2e] text-[#a6e3a1] resize-none outline-none leading-relaxed"
                                    style={{ fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace" }}
                                />
                            </div>
                        )}
                        {tab === "preview" && (
                            <iframe
                                ref={previewRef}
                                title="Template Preview"
                                className="w-full h-full border-0"
                                sandbox="allow-same-origin"
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function inputCls(hasError: boolean) {
    return `w-full h-9 text-[13px] bg-gray-50 border rounded-lg px-3 outline-none transition-all
    ${hasError
            ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
            : "border-gray-200 focus:border-[#00b14f] focus:ring-2 focus:ring-[#00b14f]/10"
        }`;
}

function Field({
    label,
    error,
    hint,
    children,
}: {
    label: string;
    error?: string;
    hint?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold text-gray-600">{label}</label>
            {hint && <p className="text-[11px] text-gray-400 -mt-1">{hint}</p>}
            {children}
            {error && <p className="text-[11px] text-red-500">{error}</p>}
        </div>
    );
}