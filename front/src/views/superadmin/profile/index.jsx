import React, { useEffect, useState } from "react";
import ApiCall from "config";
import { toast, ToastContainer } from "react-toastify";
import {
  MdPerson,
  MdLock,
  MdVisibility,
  MdVisibilityOff,
  MdEdit,
  MdSave,
  MdClose,
} from "react-icons/md";

const InfoRow = ({ label, value }) => (
  <div className="flex items-center justify-between text-sm">
    <span className="text-gray-500">{label}</span>
    <span className="text-right text-gray-900 font-medium text-xs">
      {value ?? "—"}
    </span>
  </div>
);

const FormField = ({ label, name, value, onChange, disabled, textarea }) => (
  <div>
    <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-500">
      {label}
    </label>
    {textarea ? (
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        rows={3}
        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 disabled:cursor-default disabled:bg-gray-50 disabled:text-gray-600"
      />
    ) : (
      <input
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 disabled:cursor-default disabled:bg-gray-50 disabled:text-gray-600"
      />
    )}
  </div>
);

const ProfileOverview = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    name: "",
    directorName: "",
    phoneNumber: "",
    businessSphere: "",
    location: "",
    description: "",
    passwordHint: "",
  });
  const [saving, setSaving] = useState(false);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    const res = await ApiCall("/api/v1/profile/view", "GET");
    if (!res.error) {
      setProfile(res.data);
      setForm({
        name: res.data.name || "",
        directorName: res.data.directorName || "",
        phoneNumber: res.data.phoneNumber || "",
        businessSphere: res.data.businessSphere || "",
        location: res.data.location || "",
        description: res.data.description || "",
        passwordHint: res.data.passwordHint || "",
      });
    } else {
      toast.error("Profilni yuklashda xatolik yuz berdi");
    }
    setLoading(false);
  };

  const handleFormChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleCancelEdit = () => {
    setEditMode(false);
    setForm({
      name: profile?.name || "",
      directorName: profile?.directorName || "",
      phoneNumber: profile?.phoneNumber || "",
      businessSphere: profile?.businessSphere || "",
      location: profile?.location || "",
      description: profile?.description || "",
      passwordHint: profile?.passwordHint || "",
    });
  };

  const handleSaveProfile = async () => {
    if (!form.name.trim()) {
      toast.error("Ism bo'sh bo'lishi mumkin emas");
      return;
    }
    setSaving(true);
    const res = await ApiCall("/api/v1/profile/update", "POST", form);
    if (!res.error) {
      toast.success("Profil muvaffaqiyatli yangilandi");
      setEditMode(false);
      fetchProfile();
    } else {
      toast.error(res.data?.message || "Xatolik yuz berdi");
    }
    setSaving(false);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Parol kamida 8 ta belgidan iborat bo'lishi kerak");
      return;
    }
    if (!/[A-Z]/.test(password)) {
      toast.error("Parol kamida 1 ta katta harfdan iborat bo'lishi kerak");
      return;
    }
    if (!/[0-9]/.test(password)) {
      toast.error("Parol kamida 1 ta raqamdan iborat bo'lishi kerak");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Parollar mos kelmadi");
      return;
    }
    setChangingPassword(true);
    const res = await ApiCall("/api/v1/profile/changePassword", "POST", {
      password,
    });
    if (!res.error) {
      toast.success("Parol muvaffaqiyatli o'zgartirildi");
      setPassword("");
      setConfirmPassword("");
    } else {
      toast.error(res.data?.message || "Parolni o'zgartirishda xatolik");
    }
    setChangingPassword(false);
  };

  const formatDate = (dt) => {
    if (!dt) return "—";
    return new Date(dt).toLocaleString("uz-UZ", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-8xl animate-pulse px-4 py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="h-72 rounded-2xl bg-gray-100"></div>
          <div className="h-72 rounded-2xl bg-gray-100 lg:col-span-2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-8xl px-4 py-8">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: Info card */}
        <div className="lg:col-span-1">
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
            <div className="border-b border-gray-50 px-6 pb-6 pt-8">
              <div className="flex flex-col items-center">
                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full border border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100">
                  <MdPerson className="h-10 w-10 text-gray-400" />
                </div>
                <h2 className="text-lg font-medium text-gray-900">
                  {profile?.name || "—"}
                </h2>
                <p className="mt-0.5 text-sm text-gray-500">
                  Super Administrator
                </p>
              </div>
            </div>
            <div className="space-y-4 p-6">
              <InfoRow label="Login" value={profile?.login} />
              <InfoRow label="Telefon" value={profile?.phoneNumber} />
              <InfoRow
                label="Holat"
                value={
                  <span
                    className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-xs ${
                      profile?.active
                        ? "bg-green-50 text-green-600"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {profile?.active ? "Faol" : "Bloklangan"}
                  </span>
                }
              />
              <InfoRow
                label="Ro'yxatdan o'tgan"
                value={formatDate(profile?.createdTime)}
              />
              <InfoRow
                label="Oxirgi kirish"
                value={formatDate(profile?.lastLogin)}
              />
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
                  <h3 className="text-sm font-medium text-gray-900">
                    Profil ma'lumotlari
                  </h3>
                  <p className="mt-0.5 text-xs text-gray-500">
                    Asosiy ma'lumotlar
                  </p>
                </div>
              </div>
              {!editMode && (
                <button
                  onClick={() => setEditMode(true)}
                  className="rounded-md border border-blue-200 px-3 py-1 text-xs text-blue-600 hover:bg-blue-50"
                >
                  Tahrirlash
                </button>
              )}
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  label="Ism"
                  name="name"
                  value={form.name}
                  onChange={handleFormChange}
                  disabled={!editMode}
                />
                <FormField
                  label="Direktor ismi"
                  name="directorName"
                  value={form.directorName}
                  onChange={handleFormChange}
                  disabled={!editMode}
                />
                <FormField
                  label="Telefon"
                  name="phoneNumber"
                  value={form.phoneNumber}
                  onChange={handleFormChange}
                  disabled={!editMode}
                />
                <FormField
                  label="Faoliyat sohasi"
                  name="businessSphere"
                  value={form.businessSphere}
                  onChange={handleFormChange}
                  disabled={!editMode}
                />
                <FormField
                  label="Manzil"
                  name="location"
                  value={form.location}
                  onChange={handleFormChange}
                  disabled={!editMode}
                />
                <FormField
                  label="Parol maslahatchi"
                  name="passwordHint"
                  value={form.passwordHint}
                  onChange={handleFormChange}
                  disabled={!editMode}
                />
              </div>
              <div className="mt-4">
                <FormField
                  label="Tavsif"
                  name="description"
                  value={form.description}
                  onChange={handleFormChange}
                  disabled={!editMode}
                  textarea
                />
              </div>
              {editMode && (
                <div className="mt-4 flex gap-3">
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-40"
                  >
                    {saving ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                    ) : (
                      <MdSave className="h-4 w-4" />
                    )}
                    Saqlash
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                  >
                    <MdClose className="h-4 w-4" />
                    Bekor qilish
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Change password */}
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
            <div className="border-b border-gray-50 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-50">
                  <MdLock className="h-4 w-4 text-gray-500" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900">
                    Xavfsizlik
                  </h3>
                  <p className="mt-0.5 text-xs text-gray-500">
                    Parolni yangilash
                  </p>
                </div>
              </div>
            </div>
            <form onSubmit={handleChangePassword} className="p-6">
              <div className="space-y-4">
                {/* New password */}
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-500">
                    Yangi parol
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={changingPassword}
                      className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 disabled:opacity-50"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <MdVisibilityOff className="h-4 w-4" />
                      ) : (
                        <MdVisibility className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm password */}
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-500">
                    Parolni tasdiqlash
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={changingPassword}
                      className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 disabled:opacity-50"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? (
                        <MdVisibilityOff className="h-4 w-4" />
                      ) : (
                        <MdVisibility className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Requirements */}
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="mb-2 text-xs text-gray-600">Parol talablari:</p>
                  <ul className="space-y-1">
                    {[
                      ["Kamida 8 ta belgi", password.length >= 8],
                      ["Kamida 1 ta katta harf", /[A-Z]/.test(password)],
                      ["Kamida 1 ta raqam", /[0-9]/.test(password)],
                    ].map(([text, met]) => (
                      <li
                        key={text}
                        className="flex items-center gap-2 text-xs text-gray-500"
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${met ? "bg-green-400" : "bg-gray-300"}`}
                        />
                        {text}
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="submit"
                  disabled={changingPassword || !password || !confirmPassword}
                  className="w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {changingPassword ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                      Yangilanmoqda...
                    </span>
                  ) : (
                    "Parolni yangilash"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileOverview;
