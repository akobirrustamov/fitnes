import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ApiCall from "../../../config";
import { MdPerson, MdLock, MdSave } from "react-icons/md";
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
      return "Parolda kamida 1 ta katta harf bo'lishi kerak";
    }
    if (!/[0-9]/.test(pass)) {
      return "Parolda kamida 1 ta raqam bo'lishi kerak";
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

    try {
      const response = await ApiCall(
        `/api/v1/auth/password/${admin.id}`,
        "PUT",
        { password }
      );
      setPassword("");
      setConfirmPassword("");
      setPasswordError("");

      // Muvaffaqiyatli bildirishnoma
      alert("Parol muvaffaqiyatli yangilandi!");
    } catch (error) {
      console.error("Error updating password:", error);
      setPasswordError("Parolni yangilashda xatolik yuz berdi");
    } finally {
      setChangePassword(false);
    }
  };

  return (
    <div className="max-w-8xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Profile Card - Minimal */}
        <div className="lg:col-span-4">
          <Card extra="p-6">
            <div className="flex flex-col items-center">
              {/* Avatar */}
              <div className="relative mb-4">
                <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-blue-50 to-indigo-50 shadow-sm dark:from-gray-700 dark:to-gray-600">
                  <MdPerson className="h-12 w-12 text-gray-600 dark:text-gray-300" />
                </div>
                <div className="absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-white bg-green-500"></div>
              </div>

              {/* Info */}
              <h2 className="mb-1 text-xl font-medium text-gray-900 dark:text-white">
                {admin?.name || "Foydalanuvchi"}
              </h2>
              <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                Bo'lim boshlig'i
              </p>

              {/* Stats */}
              <div className="w-full border-t border-gray-100 pt-4 dark:border-gray-700">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">ID:</span>
                  <span className="font-mono text-gray-900 dark:text-white">
                    {admin?.id || "—"}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Password Change - Minimal */}
        <div className="lg:col-span-8">
          <Card extra="p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-lg bg-gray-50 p-2 dark:bg-gray-800">
                <MdLock className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Parolni yangilash
                </h3>
                <p className="text-sm text-gray-500">
                  Xavfsizlikni oshirish uchun muntazam yangilab turing
                </p>
              </div>
            </div>

            <div className="max-w-md space-y-5">
              {/* New Password */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
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
                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 pr-10 text-sm text-gray-900 placeholder-gray-400 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showPassword ? "👁" : "👁‍🗨"}
                  </button>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Kamida 8 belgi, 1 ta katta harf va 1 ta raqam
                </p>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
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
                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 pr-10 text-sm text-gray-900 placeholder-gray-400 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showConfirmPassword ? "👁" : "👁‍🗨"}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {passwordError && (
                <div className="rounded-lg border border-red-100 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {passwordError}
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <button
                onClick={setPasswordHandler}
                disabled={changePassword || !password || !confirmPassword}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-gray-900 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 dark:disabled:hover:bg-white sm:w-auto"
              >
                <MdSave className="h-4 w-4" />
                {changePassword ? "Saqlanmoqda..." : "Saqlash"}
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfileOverview;
