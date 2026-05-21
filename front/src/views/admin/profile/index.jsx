import React, { useEffect, useState } from "react";
import ApiCall from "../../../config";
import PhoneInput from "components/PhoneInput";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  MdPerson, MdLock, MdEdit, MdSave, MdClose,
  MdVisibility, MdVisibilityOff, MdCheckCircle,
} from "react-icons/md";

const InfoRow = ({ label, value }) => (
  <div className="flex items-center justify-between text-sm">
    <span className="text-gray-500">{label}</span>
    <span className="text-right font-medium text-gray-800 text-xs">{value ?? "—"}</span>
  </div>
);

const Field = ({ label, name, value, onChange, disabled, type = "text" }) => (
  <div>
    <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-500">{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 transition-colors focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 disabled:cursor-default disabled:bg-gray-50 disabled:text-gray-600"
    />
  </div>
);

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Edit state
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    name: "", directorName: "", phoneNumber: "+998",
    businessSphere: "", location: "", passwordHint: "",
  });
  const [saving, setSaving] = useState(false);

  // Password state
  const [pwd, setPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [changingPwd, setChangingPwd] = useState(false);

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    setLoading(true);
    const res = await ApiCall("/api/v1/profile/view", "GET");
    if (!res?.error) {
      setProfile(res.data);
      setForm({
        name: res.data.name || "",
        directorName: res.data.directorName || "",
        phoneNumber: res.data.phoneNumber || "+998",
        businessSphere: res.data.businessSphere || "",
        location: res.data.location || "",
        passwordHint: res.data.passwordHint || "",
      });
    } else {
      toast.error("Profilni yuklashda xatolik");
    }
    setLoading(false);
  };

  const handleFormChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const cancelEdit = () => {
    setEditMode(false);
    setForm({
      name: profile?.name || "",
      directorName: profile?.directorName || "",
      phoneNumber: profile?.phoneNumber || "+998",
      businessSphere: profile?.businessSphere || "",
      location: profile?.location || "",
      passwordHint: profile?.passwordHint || "",
    });
  };

  const saveProfile = async () => {
    if (!form.name.trim()) { toast.error("Ism bo'sh bo'lishi mumkin emas"); return; }
    setSaving(true);
    const res = await ApiCall("/api/v1/profile/update", "POST", form);
    setSaving(false);
    if (!res?.error) {
      toast.success("Profil yangilandi");
      setEditMode(false);
      fetchProfile();
    } else {
      toast.error(res.data?.message || "Xatolik yuz berdi");
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (pwd.length < 8) { toast.error("Parol kamida 8 ta belgidan iborat bo'lishi kerak"); return; }
    if (!/[A-Z]/.test(pwd)) { toast.error("Parol kamida 1 ta katta harfdan iborat bo'lishi kerak"); return; }
    if (!/[0-9]/.test(pwd)) { toast.error("Parol kamida 1 ta raqamdan iborat bo'lishi kerak"); return; }
    if (pwd !== confirmPwd) { toast.error("Parollar mos kelmadi"); return; }
    setChangingPwd(true);
    const res = await ApiCall("/api/v1/profile/changePassword", "POST", { password: pwd });
    setChangingPwd(false);
    if (!res?.error) {
      toast.success("Parol muvaffaqiyatli o'zgartirildi");
      setPwd(""); setConfirmPwd("");
    } else {
      toast.error(res.data?.message || "Parolni o'zgartirishda xatolik");
    }
  };

  const fmtDate = (d) =>
    d ? new Date(d).toLocaleString("uz-UZ", { dateStyle: "medium", timeStyle: "short" }) : "—";

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl animate-pulse px-4 py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className={`h-64 rounded-2xl bg-gray-100 ${i === 0 ? "" : "lg:col-span-2"}`} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* Left: Info card */}
        <div className="lg:col-span-1 space-y-4">
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
            <div className="border-b border-gray-50 px-6 pt-8 pb-6">
              <div className="flex flex-col items-center">
                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full border border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100">
                  {profile?.photoUrl ? (
                    <img src={profile.photoUrl} alt={profile.name} className="h-20 w-20 rounded-full object-cover" />
                  ) : (
                    <MdPerson className="h-10 w-10 text-gray-400" />
                  )}
                </div>
                <h2 className="text-lg font-medium text-gray-900">{profile?.name || "—"}</h2>
                <p className="mt-0.5 text-sm text-gray-500">Direktor</p>
              </div>
            </div>
            <div className="space-y-4 p-6">
              <InfoRow label="Login" value={profile?.login} />
              <InfoRow label="Telefon" value={profile?.phoneNumber} />
              <InfoRow label="Direktor" value={profile?.directorName} />
              <InfoRow label="Joylashuv" value={profile?.location} />
              <InfoRow label="Balans" value={profile?.balance != null ? `${Number(profile.balance).toLocaleString()} so'm` : null} />
              <InfoRow label="Holat" value={
                <span className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-xs ${profile?.active ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-500"}`}>
                  <MdCheckCircle className="h-3 w-3" />
                  {profile?.active ? "Faol" : "Bloklangan"}
                </span>
              } />
              <InfoRow label="Oxirgi kirish" value={fmtDate(profile?.lastLogin)} />
              <InfoRow label="Yaratilgan" value={fmtDate(profile?.createdTime)} />
            </div>
          </div>
        </div>

        {/* Right: Edit + Password */}
        <div className="space-y-6 lg:col-span-2">

          {/* Edit profile */}
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
            <div className="flex items-center justify-between border-b border-gray-50 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-50">
                  <MdEdit className="h-4 w-4 text-gray-500" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Profil ma'lumotlari</h3>
                  <p className="mt-0.5 text-xs text-gray-500">Asosiy ma'lumotlar</p>
                </div>
              </div>
              {!editMode ? (
                <button
                  onClick={() => setEditMode(true)}
                  className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  <MdEdit className="h-3.5 w-3.5" /> Tahrirlash
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={cancelEdit}
                    className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                  >
                    <MdClose className="h-3.5 w-3.5" /> Bekor
                  </button>
                  <button
                    onClick={saveProfile}
                    disabled={saving}
                    className="flex items-center gap-1 rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-700 disabled:opacity-50"
                  >
                    <MdSave className="h-3.5 w-3.5" />
                    {saving ? "Saqlanmoqda..." : "Saqlash"}
                  </button>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
              <Field label="Tashkilot nomi" name="name" value={form.name} onChange={handleFormChange} disabled={!editMode} />
              <Field label="Direktor ismi" name="directorName" value={form.directorName} onChange={handleFormChange} disabled={!editMode} />
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-500">Telefon raqam</label>
                <PhoneInput name="phoneNumber" value={form.phoneNumber} onChange={handleFormChange} disabled={!editMode} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 transition-colors focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 disabled:cursor-default disabled:bg-gray-50 disabled:text-gray-600" />
              </div>
              <Field label="Faoliyat sohasi" name="businessSphere" value={form.businessSphere} onChange={handleFormChange} disabled={!editMode} />
              <Field label="Joylashuv" name="location" value={form.location} onChange={handleFormChange} disabled={!editMode} />
              <Field label="Parol eslatmasi" name="passwordHint" value={form.passwordHint} onChange={handleFormChange} disabled={!editMode} />
            </div>
          </div>

          {/* Password change */}
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
            <div className="flex items-center gap-3 border-b border-gray-50 px-6 py-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-50">
                <MdLock className="h-4 w-4 text-gray-500" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900">Xavfsizlik</h3>
                <p className="mt-0.5 text-xs text-gray-500">Parolni yangilash</p>
              </div>
            </div>
            <form onSubmit={changePassword} className="space-y-4 p-6">
              {/* New password */}
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-gray-500">Yangi parol</label>
                <div className="relative">
                  <input
                    type={showPwd ? "text" : "password"}
                    value={pwd}
                    onChange={(e) => setPwd(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
                  />
                  <button type="button" onClick={() => setShowPwd((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPwd ? <MdVisibilityOff className="h-4 w-4" /> : <MdVisibility className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {/* Confirm */}
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-gray-500">Parolni tasdiqlash</label>
                <div className="relative">
                  <input
                    type={showConfirmPwd ? "text" : "password"}
                    value={confirmPwd}
                    onChange={(e) => setConfirmPwd(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
                  />
                  <button type="button" onClick={() => setShowConfirmPwd((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showConfirmPwd ? <MdVisibilityOff className="h-4 w-4" /> : <MdVisibility className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {/* Requirements */}
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="mb-2 text-xs text-gray-600">Parol talablari:</p>
                <ul className="space-y-1">
                  {[
                    [pwd.length >= 8, "Kamida 8 ta belgi"],
                    [/[A-Z]/.test(pwd), "Kamida 1 ta katta harf"],
                    [/[0-9]/.test(pwd), "Kamida 1 ta raqam"],
                  ].map(([ok, text]) => (
                    <li key={text} className="flex items-center gap-2 text-xs text-gray-500">
                      <span className={`h-1.5 w-1.5 rounded-full ${ok ? "bg-green-400" : "bg-gray-300"}`} />
                      {text}
                    </li>
                  ))}
                </ul>
              </div>
              <button
                type="submit"
                disabled={changingPwd || !pwd || !confirmPwd}
                className="w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {changingPwd ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Yangilanmoqda...
                  </span>
                ) : "Parolni yangilash"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
