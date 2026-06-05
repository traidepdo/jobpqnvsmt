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
  website: string;
  description: string;
  industry: string;
  addressDetail: string;
  wardId: string;
  size: string;
};

const emptyForm: CompanyForm = {
  name: '', logo: '', website: '', description: '', industry: '',
  addressDetail: '', wardId: '', size: '',
};

function companyToForm(company: {
  name: string;
  logo?: string | null;
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

  // Reset error state when logo changes
  useEffect(() => { setImgError(false); }, [logo]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file hình ảnh (JPG, PNG, GIF, WebP...)');
      return;
    }
    // Validate size (max 2MB)
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

    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onLogoChange('');
  };

  const showImage = logo && !imgError;

  return (
    <div className="relative flex-shrink-0">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        disabled={!editing || uploading}
      />

      {/* Avatar circle */}
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
            className="w-full h-full object-contain border border-gray-100 bg-gray-50 p-1"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full bg-[#0052CC]/10 flex items-center justify-center text-[#0052CC] font-bold text-3xl">
            {name[0]?.toUpperCase() || 'C'}
          </div>
        )}

        {/* Hover overlay (edit mode only) */}
        {editing && (
          <div
            className={`absolute inset-0 bg-black/50 flex flex-col items-center justify-center transition-opacity duration-200 rounded-xl ${hover || uploading ? 'opacity-100' : 'opacity-0'
              }`}
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

      {/* Remove button (edit mode + has logo) */}
      {editing && showImage && !uploading && (
        <button
          type="button"
          onClick={handleRemove}
          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-sm transition-colors"
          title="Xoá ảnh"
        >
          <span className="material-symbols-outlined text-[12px]">close</span>
        </button>
      )}

      {/* Edit badge (edit mode, no hover state — subtle indicator) */}
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

  const set = (k: keyof CompanyForm, v: string) => setForm(f => ({ ...f, [k]: v }));
  const inputCls =
    'w-full h-10 px-3 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#0052CC] focus:ring-2 focus:ring-[#0052CC]/10';

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
        <div className="w-10 h-10 border-[3px] border-gray-200 border-t-[#0052CC] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header card */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Avatar — editable in edit mode */}
            <AvatarEditor
              logo={editing ? form.logo : saved.logo}
              name={editing ? form.name : saved.name}
              editing={editing}
              onLogoChange={(url) => set('logo', url)}
            />

            <div>
              <h2 className="text-xl font-bold text-[#041b3c]">{saved.name}</h2>
              <p className={`text-sm font-semibold mt-1 ${approved ? 'text-green-600' : 'text-amber-600'}`}>
                {approved ? '✓ Đã xác minh' : '⏳ Chờ admin duyệt'}
              </p>
              <p className="text-xs text-gray-400 mt-1">{jobCount} tin tuyển dụng</p>
              {editing && (
                <p className="text-xs text-[#0052CC] mt-1.5 font-medium">
                  ← Nhấn vào logo để thay ảnh
                </p>
              )}
            </div>
          </div>
          {!editing && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#0052CC] hover:bg-[#0040a2] text-white text-sm font-bold rounded-lg cursor-pointer flex-shrink-0"
            >
              <span className="material-symbols-outlined text-[18px]">edit</span>
              Chỉnh sửa
            </button>
          )}
        </div>
      </div>

      {msg && (
        <p
          className={`text-sm px-4 py-2.5 rounded-lg ${msg.includes('Đã') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
            }`}
        >
          {msg}
        </p>
      )}

      {!editing ? (
        /* ── View mode ── */
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-50">
          <InfoRow label="Website" value={saved.website} isLink />
          <InfoRow label="Ngành nghề" value={saved.industry} />
          <InfoRow label="Quy mô" value={displaySize} />
          <InfoRow label="Khu vực" value={displayWard} />
          <InfoRow label="Địa chỉ" value={saved.addressDetail} />
          <div className="p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Mô tả công ty</p>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
              {saved.description || <span className="text-gray-400 italic">Chưa có mô tả</span>}
            </p>
          </div>
        </div>
      ) : (
        /* ── Edit mode ── */
        <form onSubmit={handleSave} className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm space-y-4">
          <p className="text-sm text-gray-500 pb-2 border-b border-gray-100">Đang chỉnh sửa hồ sơ công ty</p>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Tên công ty *</label>
            <input className={inputCls} value={form.name} onChange={e => set('name', e.target.value)} required />
          </div>

          {/* Logo field: URL input + upload button side-by-side */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Logo</label>
            <div className="flex gap-2 items-center">
              <input
                className={`${inputCls} flex-1`}
                value={form.logo.startsWith('data:') ? '' : form.logo}
                onChange={e => set('logo', e.target.value)}
                placeholder="https://... hoặc tải ảnh lên ↑"
                disabled={form.logo.startsWith('data:')}
              />
              {form.logo.startsWith('data:') && (
                <span className="text-xs text-gray-400 italic whitespace-nowrap">Đã tải ảnh lên</span>
              )}
              {form.logo && (
                <button
                  type="button"
                  onClick={() => set('logo', '')}
                  className="text-xs text-red-500 hover:text-red-700 font-medium whitespace-nowrap"
                >
                  Xoá
                </button>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1">Nhấn vào ảnh đại diện ở trên để tải file lên (tối đa 2MB)</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Website</label>
            <input className={inputCls} value={form.website} onChange={e => set('website', e.target.value)} placeholder="https://..." />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Ngành nghề</label>
            <select className={inputCls} value={form.industry} onChange={e => set('industry', e.target.value)}>
              <option value="">Chọn ngành</option>
              {INDUSTRIES.map(i => (
                <option key={i} value={i}>{i}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Mô tả công ty</label>
            <textarea
              className={`${inputCls} h-28 py-2 resize-none`}
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Giới thiệu về công ty, văn hóa, phúc lợi..."
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Khu vực</label>
              <select className={inputCls} value={form.wardId} onChange={e => set('wardId', e.target.value)}>
                <option value="">Chọn khu vực</option>
                {wards.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Quy mô</label>
              <select className={inputCls} value={form.size} onChange={e => set('size', e.target.value)}>
                {SIZES.map(s => (
                  <option key={s.value || 'empty'} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Địa chỉ chi tiết</label>
            <input className={inputCls} value={form.addressDetail} onChange={e => set('addressDetail', e.target.value)} placeholder="Số nhà, đường..." />
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-[#0052CC] hover:bg-[#0040a2] text-white font-bold rounded-lg cursor-pointer disabled:opacity-60"
            >
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className="px-6 py-2.5 border border-gray-200 text-gray-600 font-semibold rounded-lg hover:bg-gray-50 cursor-pointer disabled:opacity-60"
            >
              Hủy
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function InfoRow({
  label,
  value,
  isLink,
}: {
  label: string;
  value: string;
  isLink?: boolean;
}) {
  const empty = !value?.trim();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 px-5 py-3.5">
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider sm:w-28 flex-shrink-0">
        {label}
      </span>
      {empty ? (
        <span className="text-sm text-gray-400 italic">Chưa cập nhật</span>
      ) : isLink ? (
        <a href={value.startsWith('http') ? value : `https://${value}`} target="_blank" rel="noreferrer" className="text-sm font-medium text-[#0052CC] hover:underline break-all">
          {value}
        </a>
      ) : (
        <span className="text-sm text-gray-800">{value}</span>
      )}
    </div>
  );
}