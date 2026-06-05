"use client";

import { useState } from "react";

type ToastState = { msg: string; type: "success" | "error" } | null;

function EyeIcon({ open }: { open: boolean }) {
    if (open) {
        return (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                    d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" strokeWidth={1.8} />
            </svg>
        );
    }
    return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M1 1l22 22" />
        </svg>
    );
}

function PasswordInput({
    id,
    label,
    value,
    onChange,
    placeholder,
    error,
}: {
    id: string;
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    error?: string;
}) {
    const [show, setShow] = useState(false);
    return (
        <div className="space-y-1.5">
            <label htmlFor={id} className="block text-xs font-semibold uppercase tracking-widest text-slate-400">
                {label}
            </label>
            <div className={`flex items-center border rounded-xl px-4 py-3 bg-slate-50 transition-all
                ${error ? "border-red-400 bg-red-50" : "border-slate-200 focus-within:border-slate-400 focus-within:bg-white"}`}>
                <input
                    id={id}
                    type={show ? "text" : "password"}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-300 outline-none"
                />
                <button
                    type="button"
                    onClick={() => setShow((s) => !s)}
                    className="ml-2 text-slate-400 hover:text-slate-600 transition-colors"
                    tabIndex={-1}
                >
                    <EyeIcon open={show} />
                </button>
            </div>
            {error && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                    <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    </svg>
                    {error}
                </p>
            )}
        </div>
    );
}

export default function ChangePasswordPage() {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState<ToastState>(null);
    const [errors, setErrors] = useState<{ current?: string; new?: string; confirm?: string }>({});

    const showToast = (msg: string, type: "success" | "error") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const validate = () => {
        const e: typeof errors = {};
        if (!currentPassword) e.current = "Vui lòng nhập mật khẩu hiện tại";
        if (!newPassword) e.new = "Vui lòng nhập mật khẩu mới";
        else if (newPassword.length < 6) e.new = "Mật khẩu mới phải có ít nhất 6 ký tự";
        if (!confirmPassword) e.confirm = "Vui lòng xác nhận mật khẩu mới";
        else if (newPassword !== confirmPassword) e.confirm = "Mật khẩu xác nhận không khớp";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        try {
            const res = await fetch("/api/auth/resetpassword", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    pass: currentPassword,
                    passnew: newPassword,
                    confirm_pass: confirmPassword,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                showToast(data.message || "Có lỗi xảy ra, vui lòng thử lại.", "error");
            } else {
                showToast("Đổi mật khẩu thành công!", "success");
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
                setErrors({});
            }
        } catch {
            showToast("Không thể kết nối đến máy chủ.", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-slate-50 py-10 px-4">
            {/* Toast notification */}
            {toast && (
                <div className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium shadow-lg transition-all animate-in fade-in slide-in-from-top-2 duration-300
                    ${toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-500 text-white"}`}>
                    {toast.type === "success" ? (
                        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    ) : (
                        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    )}
                    {toast.msg}
                </div>
            )}

            <div className="max-w-2xl mx-auto space-y-6">
                {/* Header */}
                <div>
                    <p className="text-xs font-semibold tracking-widest text-slate-400 uppercase">Tài khoản</p>
                    <h1 className="text-2xl font-bold text-slate-800 mt-1">Đổi mật khẩu</h1>
                </div>

                {/* Card */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    {/* Card header */}
                    <div className="px-8 py-6 border-b border-slate-100 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                                    d="M7 11V7a5 5 0 0110 0v4" />
                            </svg>
                        </div>
                        <div>
                            <p className="font-semibold text-slate-800 text-sm">Bảo mật tài khoản</p>
                            <p className="text-xs text-slate-400 mt-0.5">Mật khẩu mới phải có ít nhất 6 ký tự</p>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="px-8 py-7 space-y-5">
                        <PasswordInput
                            id="current-password"
                            label="Mật khẩu hiện tại"
                            value={currentPassword}
                            onChange={(v) => { setCurrentPassword(v); setErrors((e) => ({ ...e, current: undefined })); }}
                            placeholder="Nhập mật khẩu hiện tại"
                            error={errors.current}
                        />

                        <div className="border-t border-slate-100 pt-5 space-y-5">
                            <PasswordInput
                                id="new-password"
                                label="Mật khẩu mới"
                                value={newPassword}
                                onChange={(v) => { setNewPassword(v); setErrors((e) => ({ ...e, new: undefined })); }}
                                placeholder="Ít nhất 6 ký tự"
                                error={errors.new}
                            />
                            <PasswordInput
                                id="confirm-password"
                                label="Xác nhận mật khẩu mới"
                                value={confirmPassword}
                                onChange={(v) => { setConfirmPassword(v); setErrors((e) => ({ ...e, confirm: undefined })); }}
                                placeholder="Nhập lại mật khẩu mới"
                                error={errors.confirm}
                            />
                        </div>

                        {/* Password strength hint */}
                        {newPassword.length > 0 && (
                            <div className="flex items-center gap-2 pt-1">
                                {[...Array(4)].map((_, i) => (
                                    <div
                                        key={i}
                                        className={`h-1 flex-1 rounded-full transition-colors duration-300 ${newPassword.length >= 12 ? "bg-emerald-500"
                                            : newPassword.length >= 8 ? (i < 3 ? "bg-amber-400" : "bg-slate-200")
                                                : newPassword.length >= 6 ? (i < 2 ? "bg-orange-400" : "bg-slate-200")
                                                    : (i < 1 ? "bg-red-400" : "bg-slate-200")
                                            }`}
                                    />
                                ))}
                                <span className="text-xs text-slate-400 shrink-0 w-16 text-right">
                                    {newPassword.length >= 12 ? "Rất mạnh"
                                        : newPassword.length >= 8 ? "Khá mạnh"
                                            : newPassword.length >= 6 ? "Trung bình"
                                                : "Yếu"}
                                </span>
                            </div>
                        )}

                        {/* Submit */}
                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                        </svg>
                                        Đang xử lý…
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Lưu mật khẩu mới
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Security tips */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-8 py-6">
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">Lưu ý bảo mật</p>
                    <ul className="space-y-3">
                        {[
                            "Sử dụng ít nhất 8 ký tự, kết hợp chữ hoa, chữ thường và số.",
                            "Không dùng thông tin cá nhân như ngày sinh, tên làm mật khẩu.",
                            "Không chia sẻ mật khẩu với bất kỳ ai, kể cả nhân viên hỗ trợ.",
                        ].map((tip, i) => (
                            <li key={i} className="flex items-start gap-3 text-sm text-slate-500">
                                <span className="mt-0.5 w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-400 shrink-0">
                                    {i + 1}
                                </span>
                                {tip}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </main>
    );
}