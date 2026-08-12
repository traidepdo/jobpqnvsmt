import { useEffect, useRef, useState } from "react";
import { ExperienceItem, User } from "../types/candidate/profile";
import { updateCandidateProfile } from "@/server/actions/candidate/user.action";

export default function useProfile(dataprofile: { user: User; }) {
    const [bntActive, setBntActive] = useState(false);
    const [user, setUser] = useState<User | null>();
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    // Edit states initialized from props
    const [name, setName] = useState(dataprofile.user?.name || "");
    const [phone, setPhone] = useState(dataprofile.user?.phone || "");
    const [profileSummary, setProfileSummary] = useState("");
    const [profileExperience, setProfileExperience] = useState<ExperienceItem[]>([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setUser(dataprofile.user);
        setProfileSummary(dataprofile.user?.profileSummary || "");
        setProfileExperience(dataprofile.user?.profileExperience || []);
        setLoading(false);
    }, [dataprofile])

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
        setLoading(true);
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
            showToast("Cập nhật ảnh đại diện thành công!", "success");
            setLoading(false);
            setBntActive(false);
        } catch (err: unknown) {
            showToast(err instanceof Error ? err.message : "Có lỗi xảy ra.", "error");
            setLoading(false);
        } finally {
            setUploading(false);
        }
    };

    const cancelPreview = () => {
        setPreview(null);
        if (fileRef.current) fileRef.current.value = "";
    };

    const handleSaveProfile = async () => {
        setSaving(true);
        try {
            const res = await updateCandidateProfile(user?.id || "", {
                name,
                phone,
                profileSummary,
                profileExperience,
            });
            if (res.success) {
                setUser(res.user);
                showToast("Lưu thông tin hồ sơ thành công!", "success");
                return true;
            }
            showToast(res.error || "Cập nhật thất bại", "error");
            return false;
        } catch (err: unknown) {
            showToast(err instanceof Error ? err.message : "Có lỗi xảy ra.", "error");
            return false;
        } finally {
            setSaving(false);
        }
    };
    return { bntActive, user, setName, setPhone, setProfileSummary, setProfileExperience, loading, uploading, preview, toast, fileRef, name, phone, profileSummary, profileExperience, saving, setBntActive, showToast, handleFileChange, handleUpload, cancelPreview, handleSaveProfile };

}


