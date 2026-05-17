import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ApiCall from "../../../config";
import {
  MdPerson,
  MdLock,
  MdVisibility,
  MdVisibilityOff,
  MdEmail,
  MdBadge,
  MdCheckCircle,
} from "react-icons/md";
import Card from "components/card";

const ProfileOverview = () => {
  const navigate = useNavigate();

  const [admin, setAdmin] = useState(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [changePassword, setChangePassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    getAdmin();
  }, []);

  const getAdmin = async () => {
    try {
      const response = await ApiCall("/api/v1/auth/decode", "GET", null);
      setAdmin(response.data);
    } catch (error) {
      navigate("/admin/login");
      console.error("Error fetching account data:", error);
    }
  };

  const validatePassword = (pass) => {
    if (pass.length < 8) {
      return "Parol kamida 8 ta belgidan iborat bo'lishi kerak";
    }
    if (!/[A-Z]/.test(pass)) {
      return "Parol kamida 1 ta katta harfdan iborat bo'lishi kerak";
    }
    if (!/[0-9]/.test(pass)) {
      return "Parol kamida 1 ta raqamdan iborat bo'lishi kerak";
    }
    return "";
  };

  const setPasswordHandler = async () => {
    const validationError = validatePassword(password);
    if (validationError) {
      setPasswordError(validationError);
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError("Parollar mos kelmadi");
      return;
    }

    setChangePassword(true);
    setPasswordError("");
    setSuccessMessage("");

    try {
      const response = await ApiCall(
        `/api/v1/auth/password/${admin.id}`,
        "PUT",
        { password }
      );

      setPassword("");
      setConfirmPassword("");
      setSuccessMessage("Parol muvaffaqiyatli yangilandi!");

      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (error) {
      console.error("Error updating password:", error);
      setPasswordError("Parolni yangilashda xatolik yuz berdi");
    } finally {
      setChangePassword(false);
    }
  };

  return (
    <div className="max-w-8xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
            {/* Profile Header */}
            <div className="border-b border-gray-50 px-6 pt-8 pb-6">
              <div className="flex flex-col items-center">
                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full border border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100">
                  <MdPerson className="h-10 w-10 text-gray-400" />
                </div>
                <h2 className="text-lg font-medium text-gray-900">
                  {admin?.name || "Foydalanuvchi"}
                </h2>
                <p className="mt-0.5 text-sm text-gray-500">Administrator</p>
              </div>
            </div>

            {/* Profile Info */}
            <div className="space-y-4 p-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">ID</span>
                <span className="rounded-md bg-gray-50 px-2 py-1 font-mono text-xs text-gray-900">
                  {admin?.id || "—"}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Holat</span>
                <span className="text-emerald-600 bg-emerald-50 flex items-center gap-1 rounded-md px-2 py-1 text-xs">
                  <MdCheckCircle className="h-3 w-3" />
                  Faol
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Password Change Card */}
        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
            {/* Card Header */}
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

            {/* Card Body */}
            <div className="p-6">
              <div className="space-y-4">
                {/* New Password */}
                <div>
                  <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-gray-500">
                    Yangi parol
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setPasswordError("");
                      }}
                      disabled={changePassword}
                      className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
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

                {/* Confirm Password */}
                <div>
                  <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-gray-500">
                    Parolni tasdiqlash
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setPasswordError("");
                      }}
                      disabled={changePassword}
                      className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
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

                {/* Password Requirements */}
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="mb-2 text-xs text-gray-600">Parol talablari:</p>
                  <ul className="space-y-1">
                    <li className="flex items-center gap-2 text-xs text-gray-500">
                      <span
                        className={`h-1 w-1 rounded-full ${
                          password.length >= 8
                            ? "bg-emerald-400"
                            : "bg-gray-300"
                        }`}
                      ></span>
                      Kamida 8 ta belgi
                    </li>
                    <li className="flex items-center gap-2 text-xs text-gray-500">
                      <span
                        className={`h-1 w-1 rounded-full ${
                          /[A-Z]/.test(password)
                            ? "bg-emerald-400"
                            : "bg-gray-300"
                        }`}
                      ></span>
                      Kamida 1 ta katta harf
                    </li>
                    <li className="flex items-center gap-2 text-xs text-gray-500">
                      <span
                        className={`h-1 w-1 rounded-full ${
                          /[0-9]/.test(password)
                            ? "bg-emerald-400"
                            : "bg-gray-300"
                        }`}
                      ></span>
                      Kamida 1 ta raqam
                    </li>
                  </ul>
                </div>

                {/* Error Message */}
                {passwordError && (
                  <div className="rounded-lg border border-red-100 bg-red-50 p-3">
                    <p className="text-xs text-red-600">{passwordError}</p>
                  </div>
                )}

                {/* Success Message */}
                {successMessage && (
                  <div className="bg-emerald-50 border-emerald-100 rounded-lg border p-3">
                    <p className="text-emerald-600 flex items-center gap-1 text-xs">
                      <MdCheckCircle className="h-3 w-3" />
                      {successMessage}
                    </p>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  onClick={setPasswordHandler}
                  disabled={changePassword || !password || !confirmPassword}
                  className="w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-gray-900"
                >
                  {changePassword ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                      Yangilanmoqda...
                    </span>
                  ) : (
                    "Parolni yangilash"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileOverview;
