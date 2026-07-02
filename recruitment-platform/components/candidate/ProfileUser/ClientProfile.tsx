"use client";

import { useEffect, useRef, useState } from "react";
import type { ExperienceItem, User } from "@/lib/types/candidate/profile";
import useProfile from "@/lib/hooks/useProfile";

export default function ProfilePage(dataprofile: { user: User }) {
    const { bntActive, user, loading, uploading, preview, setBntActive, setName, setPhone, setProfileSummary, setProfileExperience, toast, fileRef, name, phone, profileSummary, profileExperience, saving, showToast, handleFileChange, handleUpload, cancelPreview, handleSaveProfile } = useProfile(dataprofile);

    const avatarSrc = preview ?? user?.avatar ?? null;

    // Calculate profile completion percentage
    const completionPercentage = (() => {
        let score = 0;
        if (user?.avatar) score += 20;
        if (name) score += 20;
        if (phone) score += 20;
        if (profileSummary) score += 20;
        if (profileExperience.length > 0) score += 20;
        return score;
    })();

    return (
        <main className="min-h-screen bg-slate-50/50 py-12 px-4 sm:px-6 lg:px-8">
            <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap" rel="stylesheet" />
            <style dangerouslySetInnerHTML={{
                __html: `
                    body {
                        font-family: 'Plus Jakarta Sans', sans-serif;
                    }
                    .profile-card {
                        background: rgba(255, 255, 255, 0.8);
                        backdrop-filter: blur(12px);
                        border: 1px solid rgba(226, 232, 240, 0.8);
                    }
                    `
            }} />

            {/* Premium Toast Notification */}
            {toast && (
                <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl text-sm font-semibold shadow-2xl transition-all duration-300 transform translate-y-0 animate-bounce
                        ${toast.type === "success" ? "bg-slate-900 text-emerald-400 border border-emerald-500/20" : "bg-red-950 text-red-400 border border-red-500/20"}`}>
                    <span className="material-symbols-outlined text-lg">
                        {toast.type === "success" ? "check_circle" : "error"}
                    </span>
                    <span>{toast.msg}</span>
                </div>
            )}

            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <span className="text-xs font-bold tracking-widest text-[#00b14f] uppercase bg-[#00b14f]/10 px-3 py-1.5 rounded-full">
                            Thiết lập tài khoản
                        </span>
                        <h1 className="text-3xl font-extrabold text-slate-900 mt-3 tracking-tight">Hồ sơ cá nhân</h1>
                        <p className="text-slate-500 text-sm mt-1">Cập nhật thông tin chi tiết để nhà tuyển dụng dễ dàng tìm kiếm và kết nối.</p>
                    </div>

                    <button
                        onClick={async () => {
                            if (bntActive) {
                                const success = await handleSaveProfile();
                                if (success) {
                                    setBntActive(false);
                                }
                            } else {
                                setBntActive(true);
                            }
                        }}
                        disabled={saving}
                        className={`w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3.5 font-bold text-white ${bntActive ? "bg-slate-900" : "bg-green-500"} ${bntActive ? "hover:bg-slate-800" : "hover:bg-green-800"} active:scale-95 rounded-2xl transition-all shadow-lg hover:shadow-xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {saving ? (
                            <div className="w-5 h-5 border-2 border-slate-400 border-t-white rounded-full animate-spin" />
                        ) : (
                            <span className={`material-symbols-outlined ${bntActive ? "rotate-0" : "rotate-180"} transition-all duration-300 ease-in-out`}>{bntActive ? "save" : "edit"}</span>
                        )}
                        {bntActive ? "Lưu thay đổi" : "Chỉnh sửa"}
                    </button>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-1 h-80 bg-white rounded-3xl border border-slate-100 shadow-sm animate-pulse" />
                        <div className="lg:col-span-2 space-y-6">
                            <div className="h-60 bg-white rounded-3xl border border-slate-100 shadow-sm animate-pulse" />
                            <div className="h-96 bg-white rounded-3xl border border-slate-100 shadow-sm animate-pulse" />
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

                        {/* Left Column: Profile Card Overview */}
                        <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-8">
                            <div className="profile-card rounded-3xl p-6 shadow-sm flex flex-col items-center text-center">
                                {/* Elegant Avatar Upload */}
                                <div className="relative group mb-6">
                                    <div className="w-28 h-28 rounded-full overflow-hidden ring-4 ring-slate-100 bg-slate-100 flex items-center justify-center relative">
                                        {avatarSrc ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={avatarSrc}
                                                alt="Avatar"
                                                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                            />
                                        ) : (
                                            <span className="text-3xl font-extrabold text-slate-400">
                                                {user?.name?.charAt(0)?.toUpperCase() ?? "?"}
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => fileRef.current?.click()}
                                        className="absolute bottom-0 right-0 w-9 h-9 bg-slate-900 hover:bg-[#00b14f] text-white rounded-full flex items-center justify-center shadow-lg transition-all transform hover:scale-105 active:scale-95 border-none cursor-pointer"
                                        title="Thay đổi ảnh"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">photo_camera</span>
                                    </button>
                                </div>

                                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

                                <h2 className="text-xl font-bold text-slate-800 truncate max-w-full px-2">{name || "Chưa cập nhật tên"}</h2>
                                <p className="text-xs font-semibold text-[#00b14f] mt-1 bg-[#00b14f]/10 px-2.5 py-1 rounded-full uppercase tracking-wider">Candidate</p>
                                <p className="text-sm text-slate-400 mt-2 truncate max-w-full">{user?.email}</p>

                                {/* Image Preview Actions */}
                                {preview && (
                                    <div className="flex gap-2 w-full mt-4 justify-center">
                                        <button
                                            onClick={handleUpload}
                                            disabled={uploading}
                                            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-[#00b14f] text-white rounded-xl hover:bg-[#009940] transition-all cursor-pointer shadow-sm disabled:opacity-50"
                                        >
                                            {uploading ? "Đang lưu..." : "Lưu ảnh"}
                                        </button>
                                        <button
                                            onClick={cancelPreview}
                                            className="px-3 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all cursor-pointer"
                                        >
                                            Hủy
                                        </button>
                                    </div>
                                )}

                                {/* Profile Strength Indicator */}
                                <div className="w-full mt-8 pt-6 border-t border-slate-100 text-left">
                                    <div className="flex justify-between items-center text-xs font-bold text-slate-650 mb-2">
                                        <span>Độ hoàn thiện hồ sơ</span>
                                        <span className="text-[#00b14f]">{completionPercentage}%</span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-[#00b14f] to-emerald-450 transition-all duration-500 rounded-full"
                                            style={{ width: `${completionPercentage}%` }}
                                        />
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-2">Hoàn thiện hồ sơ giúp tăng 3x cơ hội tiếp cận nhà tuyển dụng.</p>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Detailed Forms */}
                        <div className="lg:col-span-2 space-y-8">

                            {/* Section 1: Basic Information */}
                            <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm space-y-6">
                                <div className="flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500">
                                        <span className="material-symbols-outlined text-[20px]">person</span>
                                    </span>
                                    <h3 className="text-lg font-bold text-slate-800">Thông tin cơ bản</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-455 uppercase tracking-wider mb-2">Họ và tên</label>
                                        <input
                                            type="text"
                                            value={name}
                                            disabled={!bntActive}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full text-sm border border-slate-200 focus:border-[#00b14f] rounded-2xl px-4 py-3.5 focus:outline-none focus:ring-4 focus:ring-[#00b14f]/5 transition-all placeholder-slate-300 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                                            placeholder="Nhập họ và tên của bạn"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-455 uppercase tracking-wider mb-2">Số điện thoại</label>
                                        <input
                                            type="text"
                                            value={phone}
                                            disabled={!bntActive}
                                            onChange={(e) => setPhone(e.target.value)}
                                            className="w-full text-sm border border-slate-200 focus:border-[#00b14f] rounded-2xl px-4 py-3.5 focus:outline-none focus:ring-4 focus:ring-[#00b14f]/5 transition-all placeholder-slate-300 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                                            placeholder="Nhập số điện thoại của bạn"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Địa chỉ Email (Cố định)</label>
                                    <div className="flex items-center gap-2.5 bg-slate-55/80 border border-slate-100 rounded-2xl px-4 py-3.5 text-slate-450 text-sm">
                                        <span className="material-symbols-outlined text-slate-350 text-[18px]">lock</span>
                                        <span className="font-medium">{user?.email}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Profile Summary (Hidden on CV) */}
                            <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm space-y-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500">
                                            <span className="material-symbols-outlined text-[20px]">badge</span>
                                        </span>
                                        <h3 className="text-lg font-bold text-slate-800">Giới thiệu bản thân</h3>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100/80 px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[12px]">visibility_off</span>
                                        Không in trên CV
                                    </span>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-450 uppercase tracking-wider mb-2">Tóm tắt tiểu sử / Thông tin thêm</label>
                                    <textarea
                                        value={profileSummary}
                                        disabled={!bntActive}
                                        onChange={(e) => setProfileSummary(e.target.value)}
                                        className="w-full text-sm border border-slate-200 focus:border-[#00b14f] rounded-2xl px-4 py-3.5 focus:outline-none focus:ring-4 focus:ring-[#00b14f]/5 transition-all placeholder-slate-300 resize-none disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                                        rows={4}
                                        placeholder="Mô tả ngắn gọn thế mạnh, mục tiêu nghề nghiệp để kết nối với nhà tuyển dụng tốt hơn..."
                                    />
                                    <p className="text-[11px] text-slate-400 mt-2">Dữ liệu này được dùng để tối ưu thuật toán đối sánh việc làm (Matching) của hệ thống.</p>
                                </div>
                            </div>

                            {/* Section 3: Experience Timeline (Hidden on CV) */}
                            <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm space-y-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500">
                                            <span className="material-symbols-outlined text-[20px]">history</span>
                                        </span>
                                        <h3 className="text-lg font-bold text-slate-800">Lịch sử làm việc</h3>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100/80 px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[12px]">visibility_off</span>
                                        Không in trên CV
                                    </span>
                                </div>

                                <div className="flex items-center justify-between pt-1">
                                    <p className="text-sm text-slate-450 font-medium">Bổ sung kinh nghiệm để nhà tuyển dụng đánh giá tiềm năng phù hợp.</p>
                                    <button
                                        type="button"
                                        disabled={!bntActive}
                                        onClick={() => setProfileExperience([...profileExperience, { company: "", position: "", duration: "", description: "" }])}
                                        className="flex items-center gap-1 px-4 py-2 text-xs font-bold text-[#00b14f] hover:text-white bg-[#00b14f]/10 hover:bg-[#00b14f] rounded-xl transition-all duration-300 border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">add</span>
                                        Thêm mới
                                    </button>
                                </div>

                                {profileExperience.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-10 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                                        <span className="material-symbols-outlined text-3xl text-slate-300">timeline</span>
                                        <p className="text-xs font-bold text-slate-400 mt-2">Chưa cập nhật lịch sử làm việc.</p>
                                    </div>
                                ) : (
                                    <div className="relative border-l-2 border-slate-100 pl-6 ml-3 space-y-8 my-4">
                                        {profileExperience.map((exp, idx) => (
                                            <div key={idx} className="relative group animate-fadeIn">
                                                {/* Timeline node */}
                                                <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-white border-4 border-[#00b14f] group-hover:scale-110 transition-transform" />

                                                <div className="p-5 bg-slate-50/70 border border-slate-100 rounded-2xl hover:bg-white hover:shadow-md transition-all duration-300 relative space-y-4">
                                                    {/* Delete button */}
                                                    <button
                                                        type="button"
                                                        disabled={!bntActive}
                                                        onClick={() => setProfileExperience(profileExperience.filter((_, i) => i !== idx))}
                                                        className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-white hover:bg-red-50 text-slate-400 hover:text-red-500 flex items-center justify-center transition-all cursor-pointer shadow-sm border border-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        title="Xóa kinh nghiệm này"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                                    </button>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Công ty / Tổ chức</label>
                                                            <input
                                                                type="text"
                                                                value={exp.company}
                                                                disabled={!bntActive}
                                                                onChange={(e) => {
                                                                    const newExp = [...profileExperience];
                                                                    newExp[idx].company = e.target.value;
                                                                    setProfileExperience(newExp);
                                                                }}
                                                                className="w-full text-xs border border-slate-200 focus:border-[#00b14f] rounded-xl px-3 py-2.5 bg-white focus:outline-none transition-all disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                                                                placeholder="Tên công ty ứng tuyển trước đây"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Vị trí / Chức danh</label>
                                                            <input
                                                                type="text"
                                                                value={exp.position}
                                                                disabled={!bntActive}
                                                                onChange={(e) => {
                                                                    const newExp = [...profileExperience];
                                                                    newExp[idx].position = e.target.value;
                                                                    setProfileExperience(newExp);
                                                                }}
                                                                className="w-full text-xs border border-slate-200 focus:border-[#00b14f] rounded-xl px-3 py-2.5 bg-white focus:outline-none transition-all disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                                                                placeholder="Ví dụ: Senior Frontend Developer"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 gap-4">
                                                        <div>
                                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Khoảng thời gian</label>
                                                            <input
                                                                type="text"
                                                                value={exp.duration}
                                                                disabled={!bntActive}
                                                                onChange={(e) => {
                                                                    const newExp = [...profileExperience];
                                                                    newExp[idx].duration = e.target.value;
                                                                    setProfileExperience(newExp);
                                                                }}
                                                                className="w-full text-xs border border-slate-200 focus:border-[#00b14f] rounded-xl px-3 py-2.5 bg-white focus:outline-none transition-all disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                                                                placeholder="Ví dụ: 08/2022 - Hiện tại"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Mô tả tóm tắt đóng góp</label>
                                                            <textarea
                                                                value={exp.description}
                                                                disabled={!bntActive}
                                                                onChange={(e) => {
                                                                    const newExp = [...profileExperience];
                                                                    newExp[idx].description = e.target.value;
                                                                    setProfileExperience(newExp);
                                                                }}
                                                                className="w-full text-xs border border-slate-200 focus:border-[#00b14f] rounded-xl px-3 py-2.5 bg-white focus:outline-none transition-all resize-none disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                                                                rows={2}
                                                                placeholder="Mô tả ngắn về các nhiệm vụ hoặc thành tựu chính..."
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                )}
            </div>
        </main>
    );
}
