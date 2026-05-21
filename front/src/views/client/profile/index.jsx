import React, { useEffect, useState } from "react";
import axios from "axios";
import { baseUrl } from "../../../config";
import { MdPerson, MdLock, MdCheck } from "react-icons/md";
import { User } from "lucide-react";

function clientApi(url, method = "GET", data = null) {
  const token = localStorage.getItem("client_token");
  return axios({
    url: baseUrl + url,
    method,
    data,
    headers: { Authorization: token ? `Bearer ${token}` : undefined },
  });
}

export default function ClientProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Password change state
  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState("");
  const [pwdSuccess, setPwdSuccess] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await clientApi("/api/v1/client/me");
      const p = res.data?.data;
      setProfile(p);
      // Update localStorage name/photo
      if (p?.fullName) localStorage.setItem("client_name", p.fullName);
      if (p?.photoUrl) localStorage.setItem("client_photo", p.photoUrl);
    } catch (err) {
      if (err.response?.status === 401) {
        window.location.href = "/client/login";
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdError("");
    setPwdSuccess(false);

    if (newPwd.trim().length < 4) {
      setPwdError("Yangi parol kamida 4 ta belgi bo'lishi kerak");
      return;
    }
    if (newPwd !== confirmPwd) {
      setPwdError("Yangi parollar mos kelmadi");
      return;
    }

    setPwdLoading(true);
    try {
      await clientApi("/api/v1/client/changePassword", "POST", {
        oldPassword: oldPwd.trim() || undefined,
        newPassword: newPwd.trim(),
      });
      setPwdSuccess(true);
      setOldPwd("");
      setNewPwd("");
      setConfirmPwd("");
    } catch (err) {
      const msg =
        err.response?.data?.message || "Parolni o'zgartirishda xatolik";
      setPwdError(msg);
    } finally {
      setPwdLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  const infoRows = [
    { label: "To'liq ism", value: profile?.fullName },
    { label: "Telefon", value: profile?.phoneNumber },
    { label: "Jins", value: profile?.gender === "MALE" ? "Erkak" : profile?.gender === "FEMALE" ? "Ayol" : profile?.gender },
    {
      label: "Tug'ilgan sana",
      value: profile?.birthDate
        ? new Date(profile.birthDate).toLocaleDateString("uz-UZ")
        : null,
    },
    { label: "Manzil", value: profile?.location },
    {
      label: "Obuna tugashi",
      value: profile?.subscriptionEnd
        ? new Date(profile.subscriptionEnd).toLocaleDateString("uz-UZ")
        : null,
    },
    {
      label: "Qolgan kirish",
      value: profile?.accessCount != null ? profile.accessCount : null,
    },
    {
      label: "Qarz",
      value:
        profile?.debt != null
          ? Number(profile.debt).toLocaleString() + " so'm"
          : null,
    },
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Profile card */}
      <div className="flex flex-col items-center gap-4 rounded-2xl bg-white p-6 shadow dark:bg-navy-800 sm:flex-row sm:items-start">
        {profile?.photoUrl ? (
          <img
            src={profile.photoUrl}
            alt={profile.fullName}
            className="h-24 w-24 rounded-2xl object-cover shadow"
          />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gray-100 dark:bg-navy-700">
            <User className="h-12 w-12 text-gray-400" />
          </div>
        )}
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">
            {profile?.fullName}
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {profile?.phoneNumber}
          </p>
          <span
            className={`mt-2 inline-block rounded-full px-3 py-0.5 text-xs font-semibold ${
              profile?.active
                ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400"
                : "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400"
            }`}
          >
            {profile?.active ? "Faol" : "Nofaol"}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="rounded-2xl bg-white p-5 shadow dark:bg-navy-800">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-white">
          <MdPerson className="h-5 w-5 text-brand-500" />
          Shaxsiy ma'lumotlar
        </h3>
        <div className="divide-y divide-gray-50 dark:divide-navy-700">
          {infoRows.map(({ label, value }) =>
            value != null ? (
              <div
                key={label}
                className="flex items-center justify-between py-3"
              >
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {label}
                </span>
                <span className="text-sm font-medium text-gray-800 dark:text-white">
                  {String(value)}
                </span>
              </div>
            ) : null
          )}
        </div>
      </div>

      {/* Change password */}
      <div className="rounded-2xl bg-white p-5 shadow dark:bg-navy-800">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-white">
          <MdLock className="h-5 w-5 text-brand-500" />
          Parolni o'zgartirish
        </h3>

        {pwdSuccess && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-600 dark:bg-green-500/20 dark:text-green-400">
            <MdCheck className="h-4 w-4" />
            Parol muvaffaqiyatli o'zgartirildi
          </div>
        )}

        {pwdError && (
          <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-500/20 dark:text-red-400">
            {pwdError}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          {profile?.hasPassword && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Eski parol
              </label>
              <input
                type="password"
                value={oldPwd}
                onChange={(e) => setOldPwd(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-gray-600 dark:bg-navy-900 dark:text-white"
              />
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Yangi parol
            </label>
            <input
              type="password"
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-gray-600 dark:bg-navy-900 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Yangi parolni tasdiqlang
            </label>
            <input
              type="password"
              value={confirmPwd}
              onChange={(e) => setConfirmPwd(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-gray-600 dark:bg-navy-900 dark:text-white"
            />
          </div>

          <button
            type="submit"
            disabled={pwdLoading}
            className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 py-3 text-sm font-semibold text-white shadow-md transition hover:from-blue-600 hover:to-indigo-700 disabled:opacity-60"
          >
            {pwdLoading ? "Saqlanmoqda..." : "Parolni o'zgartirish"}
          </button>
        </form>
      </div>
    </div>
  );
}
