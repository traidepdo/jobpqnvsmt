"use client";

import React, { useEffect, useRef, useState } from "react";

interface User {
    id: string;
    email: string;
    name: string;
    phone: string;
    avatar: string | null;
}

export default function ProfilePage() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetch("/api/candidate/user")
            .then((r) => r.json())
            .then((d) => {
                setUser(d.user);
                setLoading(false);
            });
    }, []);

    const showToast = (msg: string, type: "success" | "error") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) return showToast("Chỉ chấp nhận file ảnh.", "error");
        if (file.size > 5 * 1024 * 1024) return showToast("Ảnh không được vượt quá 5MB.", "error");
        const reader = new FileReader();
        reader.onload = () => setPreview(reader.result as string);
        reader.readAsDataURL(file);
    };

    const handleUpload = async () => {
        const file = fileRef.current?.files?.[0];
        if (!file) return;
        setUploading(true);
        const form = new FormData();
        form.append("avatar", file);
        try {
            const res = await fetch("/api/candidate/user/avatar", { method: "POST", body: form });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Upload thất bại");
            setUser((prev) => prev ? { ...prev, avatar: data.avatarUrl } : prev);
            setPreview(null);
            if (fileRef.current) fileRef.current.value = "";
            showToast("Cập nhật ảnh thành công!", "success");
        } catch (err: unknown) {
            showToast(err instanceof Error ? err.message : "Có lỗi xảy ra.", "error");
        } finally {
            setUploading(false);
        }
    };

    const cancelPreview = () => {
        setPreview(null);
        if (fileRef.current) fileRef.current.value = "";
    };

    const avatarSrc = preview ?? user?.avatar ?? null;

    return (
        <main className="min-h-screen bg-slate-50 py-10 px-4">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium shadow-lg transition-all
                    ${toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-500 text-white"}`}>
                    {toast.type === "success" ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    )}
                    {toast.msg}
                </div>
            )}

            <div className="max-w-2xl mx-auto space-y-6">
                <div>
                    <p className="text-xs font-semibold tracking-widest text-slate-400 uppercase">Tài khoản</p>
                    <h1 className="text-2xl font-bold text-slate-800 mt-1">Thông tin cá nhân</h1>
                </div>

                {loading ? (
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 space-y-5 animate-pulse">
                        <div className="flex items-center gap-5">
                            <div className="w-20 h-20 rounded-full bg-slate-200" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-slate-200 rounded w-1/3" />
                                <div className="h-3 bg-slate-100 rounded w-1/2" />
                            </div>
                        </div>
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-14 bg-slate-100 rounded-xl" />
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

                        {/* Avatar block */}
                        <div className="px-8 py-7 flex items-center gap-6 border-b border-slate-100">
                            <div className="relative shrink-0">
                                <div className="w-20 h-20 rounded-full overflow-hidden ring-2 ring-slate-200 bg-slate-100">
                                    {avatarSrc ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={avatarSrc}
                                            alt="Avatar"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-slate-400">
                                            {user?.name?.charAt(0)?.toUpperCase() ?? "?"}
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={() => fileRef.current?.click()}
                                    className="absolute -bottom-1 -right-1 w-7 h-7 bg-slate-800 hover:bg-slate-700 text-white rounded-full flex items-center justify-center shadow-md transition-colors"
                                    title="Đổi ảnh"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 2.828L11.828 15.828a2 2 0 01-1.414.586H9v-2a2 2 0 01.586-1.414z" />
                                    </svg>
                                </button>
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-slate-800 truncate">{user?.name || "—"}</p>
                                <p className="text-sm text-slate-400 truncate">{user?.email}</p>
                                {preview ? (
                                    <div className="flex gap-2 mt-3">
                                        <button
                                            onClick={handleUpload}
                                            disabled={uploading}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors disabled:opacity-50"
                                        >
                                            {uploading ? (
                                                <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                                </svg>
                                            ) : (
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                            )}
                                            Lưu ảnh
                                        </button>
                                        <button
                                            onClick={cancelPreview}
                                            className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 border border-slate-200 hover:border-slate-300 rounded-lg transition-colors"
                                        >
                                            Hủy
                                        </button>
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-400 mt-1.5">JPG, PNG · Tối đa 5MB</p>
                                )}
                            </div>
                        </div>

                        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

                        {/* Info fields */}
                        <div className="divide-y divide-slate-100">
                            <Field
                                label="Họ và tên"
                                value={user?.name}
                                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                            />
                            <Field
                                label="Email"
                                value={user?.email}
                                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                            />
                            <Field
                                label="Số điện thoại"
                                value={user?.phone}
                                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.14 13.5 19.79 19.79 0 0 1 1.07 5c-.11-1.09.6-2.1 1.67-2.18h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L6.91 10.9a16 16 0 0 0 6.29 6.29l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                            />
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}

function Field({ label, value, icon }: { label: string; value?: string; icon: React.ReactNode }) {
    return (
        <div className="flex items-center gap-4 px-8 py-4">
            <span className="text-slate-400 shrink-0">{icon}</span>
            <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
                <p className={`text-sm truncate ${value ? "text-slate-700 font-medium" : "text-slate-300 italic"}`}>
                    {value || "Chưa cập nhật"}
                </p>
            </div>
        </div>
    );
}