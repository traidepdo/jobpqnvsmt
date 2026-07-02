'use client';

import { useEffect, useRef, useState } from 'react';

const SIZES = [
  { value: '', label: 'Chưa cập nhật' },
  { value: 'SMALL', label: '1 - 50 nhân viên' },
  { value: 'MEDIUM', label: '51 - 200 nhân viên' },
  { value: 'LARGE', label: '201 - 500 nhân viên' },
  { value: 'ENTERPRISE', label: '500+ nhân viên' },
];

const INDUSTRIES = [
  'Du lịch & Khách sạn', 'Nhà hàng & Ẩm thực', 'Công nghệ thông tin',
  'Bất động sản', 'Giáo dục', 'Khác',
];

type CompanyForm = {
  name: string;
  logo: string;
  coverImage: string;
  images: string[];
  website: string;
  description: string;
  industry: string;
  addressDetail: string;
  wardId: string;
  size: string;
};

const emptyForm: CompanyForm = {
  name: '', logo: '', coverImage: '', images: [], website: '', description: '', industry: '',
  addressDetail: '', wardId: '', size: '',
};

function companyToForm(company: {
  name: string;
  logo?: string | null;
  coverImage?: string | null;
  images?: any;
  website?: string | null;
  description?: string | null;
  industry?: string | null;
  addressDetail?: string | null;
  wardId?: string | null;
  size?: string | null;
}): CompanyForm {
  return {
    name: company.name || '',
    logo: company.logo || '',
    coverImage: company.coverImage || '',
    images: Array.isArray(company.images) ? (company.images as string[]) : [],
    website: company.website || '',
    description: company.description || '',
    industry: company.industry || '',
    addressDetail: company.addressDetail || '',
    wardId: company.wardId || '',
    size: company.size || '',
  };
}

// ── Avatar Editor ──────────────────────────────────────────────────────────────
function AvatarEditor({
  logo,
  name,
  editing,
  onLogoChange,
}: {
  logo: string;
  name: string;
  editing: boolean;
  onLogoChange: (url: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [hover, setHover] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => { setImgError(false); }, [logo]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file hình ảnh (JPG, PNG, GIF, WebP...)');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('Ảnh quá lớn. Vui lòng chọn ảnh dưới 2MB.');
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      onLogoChange(result);
      setUploading(false);
    };
    reader.onerror = () => {
      alert('Không thể đọc file. Vui lòng thử lại.');
      setUploading(false);
    };
    reader.readAsDataURL(file);

    e.target.value = '';
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onLogoChange('');
  };

  const showImage = logo && !imgError;

  return (
    <div className="relative flex-shrink-0">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        disabled={!editing || uploading}
      />

      <div
        className={`w-20 h-20 rounded-xl overflow-hidden relative ${editing ? 'cursor-pointer' : ''}`}
        onClick={() => editing && fileInputRef.current?.click()}
        onMouseEnter={() => editing && setHover(true)}
        onMouseLeave={() => setHover(false)}
        title={editing ? 'Nhấn để đổi ảnh đại diện' : undefined}
      >
        {showImage ? (
          <img
            src={logo}
            alt="Logo"
            className="w-full h-full object-contain bg-slate-55 p-1"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full bg-[#0052CC]/10 flex items-center justify-center text-[#0052CC] font-black text-3xl">
            {name[0]?.toUpperCase() || 'C'}
          </div>
        )}

        {editing && (
          <div
            className={`absolute inset-0 bg-black/50 flex flex-col items-center justify-center transition-opacity duration-200 rounded-xl ${hover || uploading ? 'opacity-100' : 'opacity-0'}`}
          >
            {uploading ? (
              <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span className="material-symbols-outlined text-white text-[20px]">photo_camera</span>
                <span className="text-white text-[9px] font-semibold mt-0.5">Đổi ảnh</span>
              </>
            )}
          </div>
        )}
      </div>

      {editing && showImage && !uploading && (
        <button
          type="button"
          onClick={handleRemove}
          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-sm transition-colors cursor-pointer"
          title="Xoá ảnh"
        >
          <span className="material-symbols-outlined text-[12px]">close</span>
        </button>
      )}

      {editing && !hover && !uploading && (
        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#0052CC] rounded-full flex items-center justify-center shadow">
          <span className="material-symbols-outlined text-white text-[11px]">edit</span>
        </div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function EmployerCompanyPage() {
  const [form, setForm] = useState<CompanyForm>(emptyForm);
  const [saved, setSaved] = useState<CompanyForm>(emptyForm);
  const [wardName, setWardName] = useState('');
  const [sizeLabel, setSizeLabel] = useState('');
  const [wards, setWards] = useState<{ id: string; name: string }[]>([]);
  const [approved, setApproved] = useState(false);
  const [jobCount, setJobCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const coverInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const load = () => {
    return Promise.all([
      fetch('/api/employer/company').then(r => r.json()),
      fetch('/api/employer/meta').then(r => r.json()),
    ]).then(([co, meta]) => {
      if (co.company) {
        const f = companyToForm(co.company);
        setForm(f);
        setSaved(f);
        setWardName(co.company.ward?.name || '');
        setSizeLabel(co.company.sizeLabel || SIZES.find(s => s.value === co.company.size)?.label || '');
        setApproved(co.company.isApproved);
        setJobCount(co.company._count?.jobs ?? 0);
      }
      setWards(meta.wards || []);
    });
  };

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file hình ảnh (JPG, PNG, GIF, WebP...)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Ảnh quá lớn. Vui lòng chọn ảnh dưới 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      setForm(f => ({ ...f, coverImage: ev.target?.result as string }));
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handlePhotoAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file hình ảnh (JPG, PNG, GIF, WebP...)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Ảnh quá lớn. Vui lòng chọn ảnh dưới 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setForm(f => ({ ...f, images: [...f.images, result] }));
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handlePhotoRemove = (idx: number) => {
    setForm(f => ({
      ...f,
      images: f.images.filter((_, i) => i !== idx)
    }));
  };

  const set = (k: keyof CompanyForm, v: any) => setForm(f => ({ ...f, [k]: v }));
  const inputCls =
    'w-full h-12 px-4 text-sm bg-slate-50 rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-[#0052CC]/25 transition-all duration-200';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    const res = await fetch('/api/employer/company', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const d = await res.json();
    setSaving(false);
    if (res.ok && d.company) {
      const f = companyToForm(d.company);
      setForm(f);
      setSaved(f);
      setWardName(d.company.ward?.name || wards.find(w => w.id === f.wardId)?.name || '');
      setSizeLabel(SIZES.find(s => s.value === f.size)?.label || '');
      setEditing(false);
      setMsg('Đã cập nhật hồ sơ công ty!');
    } else {
      setMsg(d.error || 'Lỗi lưu');
    }
  };

  const handleCancel = () => {
    setForm(saved);
    setEditing(false);
    setMsg('');
  };

  const displayWard = wardName || wards.find(w => w.id === saved.wardId)?.name || '—';
  const displaySize = sizeLabel || SIZES.find(s => s.value === saved.size)?.label || '—';

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-10 h-10 border-[3px] border-slate-200 border-t-[#0052CC] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full mx-auto p-4 md:p-6 bg-slate-50/20 min-h-screen space-y-6">
      {/* Header card - borderless design with themed gradient or cover image */}
      <div 
        className="relative overflow-hidden bg-gradient-to-r from-[#0052CC] to-[#0040a2] rounded-3xl p-8 shadow-md text-white min-h-[220px] flex items-end"
        style={{
          backgroundImage: (editing ? form.coverImage : saved.coverImage) 
            ? `linear-gradient(rgba(0, 0, 0, 0.45), rgba(0, 0, 0, 0.75)), url(${editing ? form.coverImage : saved.coverImage})`
            : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_120%,rgba(255,255,255,0.08),transparent)] pointer-events-none" />
        
        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleCoverChange}
          disabled={!editing}
        />

        <div className="relative z-10 w-full flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full backdrop-blur-md">
              Hồ sơ doanh nghiệp
            </span>
            <h1 className="text-2xl md:text-3xl font-black mt-2">Hồ sơ công ty</h1>
            <p className="text-sm text-white/80">Quản lý thông tin chi tiết, logo, ảnh bìa và ảnh hoạt động.</p>
          </div>
          
          {editing && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                className="px-4 py-2 text-xs font-bold bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/20 backdrop-blur-md flex items-center gap-1.5 transition-all shadow cursor-pointer active:scale-95"
              >
                <span className="material-symbols-outlined text-[16px]">photo_camera</span>
                {(editing ? form.coverImage : saved.coverImage) ? 'Thay đổi ảnh bìa' : 'Thêm ảnh bìa'}
              </button>
              {(editing ? form.coverImage : saved.coverImage) && (
                <button
                  type="button"
                  onClick={() => set('coverImage', '')}
                  className="px-4 py-2 text-xs font-bold bg-red-500/30 hover:bg-red-500/50 text-red-100 rounded-xl border border-red-500/40 backdrop-blur-md flex items-center gap-1 transition-all shadow cursor-pointer active:scale-95"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                  Xóa
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Info Header - borderless */}
      <div className="bg-white rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div className="flex items-center gap-4">
            <AvatarEditor
              logo={editing ? form.logo : saved.logo}
              name={editing ? form.name : saved.name}
              editing={editing}
              onLogoChange={(url) => set('logo', url)}
            />

            <div className="space-y-1">
              <h2 className="text-xl font-extrabold text-slate-800">{saved.name}</h2>
              <p className={`text-xs font-bold inline-flex items-center gap-1 px-3 py-1 rounded-full ${approved ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                <span className="material-symbols-outlined text-[14px]">
                  {approved ? 'check_circle' : 'pending'}
                </span>
                {approved ? 'Đã xác minh' : 'Chờ admin duyệt'}
              </p>
              <p className="text-xs text-slate-400 font-semibold flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[14px]">description</span> {jobCount} tin tuyển dụng
              </p>
              {editing && (
                <p className="text-[10px] text-[#0052CC] font-bold">
                  ← Nhấn vào logo để thay đổi ảnh
                </p>
              )}
            </div>
          </div>
          {!editing && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#0052CC] hover:bg-[#0040a2] text-white text-sm font-bold rounded-2xl cursor-pointer flex-shrink-0 transition-all shadow-sm active:scale-98"
            >
              <span className="material-symbols-outlined text-[18px]">edit</span>
              Chỉnh sửa hồ sơ
            </button>
          )}
        </div>
      </div>

      {msg && (
        <div
          className={`text-sm px-4 py-3 rounded-2xl font-bold shadow-sm ${msg.includes('Đã') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}
        >
          {msg}
        </div>
      )}

      {!editing ? (
        /* ── View mode - borderless card ── */
        <div className="bg-white rounded-3xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoBlock icon="link" label="Website" value={saved.website} isLink />
            <InfoBlock icon="folder" label="Ngành nghề" value={saved.industry} />
            <InfoBlock icon="group" label="Quy mô" value={displaySize} />
            <InfoBlock icon="location_on" label="Khu vực" value={displayWard} />
          </div>
          <div className="pt-2">
            <InfoBlock icon="home" label="Địa chỉ chi tiết" value={saved.addressDetail} />
          </div>
          <div className="pt-4 border-t border-slate-50">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px] text-[#0052CC]">article</span> Giới thiệu công ty
            </h4>
            <p className="text-sm text-slate-650 leading-relaxed whitespace-pre-line bg-slate-50/50 p-4 rounded-2xl">
              {saved.description || <span className="text-slate-400 italic">Chưa có mô tả chi tiết giới thiệu công ty</span>}
            </p>
          </div>

          {/* Company Photos Gallery in View mode */}
          <div className="pt-4 border-t border-slate-50">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px] text-[#0052CC]">collections</span> Ảnh hoạt động của công ty
            </h4>
            {saved.images && saved.images.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {saved.images.map((img, idx) => (
                  <div key={idx} className="aspect-video rounded-2xl overflow-hidden bg-slate-50 border border-slate-105 group relative shadow-sm">
                    <img 
                      src={img} 
                      alt={`Company photo ${idx + 1}`} 
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 italic bg-slate-50/50 p-4 rounded-2xl">
                Chưa cập nhật ảnh hoạt động của công ty
              </p>
            )}
          </div>
        </div>
      ) : (
        /* ── Edit mode - borderless card ── */
        <form onSubmit={handleSave} className="bg-white rounded-3xl p-6 shadow-sm space-y-4">
          <p className="text-sm text-slate-450 font-bold border-b border-slate-50 pb-3">Đang chỉnh sửa thông tin doanh nghiệp</p>

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">Tên công ty *</label>
            <input className={inputCls} value={form.name} onChange={e => set('name', e.target.value)} required />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">Đường dẫn Logo</label>
            <div className="flex gap-2 items-center">
              <input
                className={`${inputCls} flex-1`}
                value={form.logo.startsWith('data:') ? '' : form.logo}
                onChange={e => set('logo', e.target.value)}
                placeholder="https://... hoặc tải ảnh lên bên trên"
                disabled={form.logo.startsWith('data:')}
              />
              {form.logo.startsWith('data:') && (
                <span className="text-xs text-slate-400 italic whitespace-nowrap bg-slate-50 px-3 py-2 rounded-xl">Đã tải ảnh lên</span>
              )}
              {form.logo && (
                <button
                  type="button"
                  onClick={() => set('logo', '')}
                  className="text-xs text-red-500 hover:text-red-700 font-bold whitespace-nowrap cursor-pointer px-2"
                >
                  Xoá
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">Website</label>
            <input className={inputCls} value={form.website} onChange={e => set('website', e.target.value)} placeholder="https://..." />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">Ngành nghề</label>
            <select className={`${inputCls} font-bold text-slate-700 appearance-none`} value={form.industry} onChange={e => set('industry', e.target.value)}>
              <option value="">Chọn ngành nghề kinh doanh chính</option>
              {INDUSTRIES.map(i => (
                <option key={i} value={i}>{i}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">Giới thiệu ngắn / Mô tả công ty</label>
            <textarea
              className={`${inputCls} h-32 py-3 resize-none`}
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Giới thiệu về công ty, văn hóa, môi trường làm việc, phúc lợi..."
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Khu vực</label>
              <select className={`${inputCls} font-bold text-slate-700 appearance-none`} value={form.wardId} onChange={e => set('wardId', e.target.value)}>
                <option value="">Chọn khu vực quận/huyện/phường</option>
                {wards.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Quy mô nhân sự</label>
              <select className={`${inputCls} font-bold text-slate-700 appearance-none`} value={form.size} onChange={e => set('size', e.target.value)}>
                {SIZES.map(s => (
                  <option key={s.value || 'empty'} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">Địa chỉ chi tiết</label>
            <input className={inputCls} value={form.addressDetail} onChange={e => set('addressDetail', e.target.value)} placeholder="Số nhà, tên đường..." />
          </div>

          {/* Company Photos Gallery in Edit mode */}
          <div className="pt-4 border-t border-slate-50 space-y-3">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Ảnh hoạt động của công ty</label>
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#0052CC]/10 hover:bg-[#0052CC] hover:text-white text-[#0052CC] text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm active:scale-95"
              >
                <span className="material-symbols-outlined text-[14px]">add</span> Tải ảnh lên
              </button>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoAdd}
              />
            </div>
            
            {form.images && form.images.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {form.images.map((img, idx) => (
                  <div key={idx} className="aspect-video rounded-2xl overflow-hidden bg-slate-50 border border-slate-105 relative group shadow-sm">
                    <img 
                      src={img} 
                      alt={`New photo ${idx + 1}`} 
                      className="w-full h-full object-cover" 
                    />
                    <button
                      type="button"
                      onClick={() => handlePhotoRemove(idx)}
                      className="absolute top-2 right-2 w-6 h-6 bg-red-500 hover:bg-red-650 text-white rounded-full flex items-center justify-center shadow-md transition-colors cursor-pointer border-none"
                      title="Xóa ảnh này"
                    >
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                <span className="material-symbols-outlined text-3xl text-slate-350">collections</span>
                <p className="text-xs font-bold text-slate-400 mt-2">Chưa có ảnh hoạt động nào</p>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-3 pt-3">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-[#0052CC] hover:bg-[#0040a2] text-white font-bold rounded-2xl cursor-pointer disabled:opacity-60 transition-all shadow-md active:scale-98"
            >
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-650 font-bold rounded-2xl cursor-pointer disabled:opacity-60 transition-all"
            >
              Hủy
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function InfoBlock({
  icon,
  label,
  value,
  isLink,
}: {
  icon: string;
  label: string;
  value: string;
  isLink?: boolean;
}) {
  const empty = !value?.trim();

  return (
    <div className="bg-slate-50/50 p-4 rounded-2xl space-y-1">
      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
        <span className="material-symbols-outlined text-[15px] text-[#0052CC]">{icon}</span>
        {label}
      </span>
      {empty ? (
        <p className="text-sm text-slate-400 italic font-semibold">Chưa cập nhật</p>
      ) : isLink ? (
        <a href={value.startsWith('http') ? value : `https://${value}`} target="_blank" rel="noreferrer" className="text-sm font-bold text-[#0052CC] hover:underline break-all block">
          {value}
        </a>
      ) : (
        <p className="text-sm font-bold text-slate-700 break-all">{value}</p>
      )}
    </div>
  );
}