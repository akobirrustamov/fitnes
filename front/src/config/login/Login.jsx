import { Link, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import React, { useState, useEffect } from "react";
import ApiCall from "../index";

export default function Auth() {
  const navigate = useNavigate();
  const [studentData, setStudentData] = useState({
    username: "",
    password: "",
    rememberMe: false,
  });

  // 🔥 Avtomatik tekshirish ( agar token mavjud bo‘lsa)
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const roles = JSON.parse(localStorage.getItem("roles") || "[]");
  }, [navigate]);
  const changeRole = async (userId, roleId) => {
    try {
      const response = await ApiCall(`/api/v1/auth/change-role/${roleId}`, "PUT", null);
    } catch (error) {
      navigate("/admin/login");

      console.error("Error fetching account data:", error);
    }
  };


  const handleStudentChange = (e) => {
    const { name, value } = e.target;
    setStudentData({ ...studentData, [name]: value });
  };
  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    localStorage.clear();
    try {
      const response = await toast.promise(
        ApiCall("/api/v1/auth/login", "POST", studentData, null, false),
        {
          pending: "Login...",
          error: "Failed to login",
        }
      );

      if (response.data?.access_token) {
        localStorage.setItem("access_token", response.data.access_token);
        if (response.data?.refresh_token) {
          localStorage.setItem("refresh_token", response.data.refresh_token);
        }
      }

      const roles = response.data.roles || [];

      if (roles.length > 0) {
        let active_role = null;
        if (response.data?.activeRole == null) {
          active_role = roles[0]?.name;
          await changeRole(response.data?.access_token, roles[0]?.id);
        } else {
          active_role = response.data?.activeRole.name;
        }

        // FitCRM роли
        if (active_role === "ROLE_SUPERADMIN" || active_role === "super_admin") {
          navigate("/superadmin/default");
        } else if (active_role === "ROLE_DIRECTOR" || active_role === "director") {
          navigate("/director/default");
        } else {
          toast.error("Noma'lum rol yoki kirish huquqi yo'q!");
        }
      } else {
        toast.error("Noma'lum rol yoki kirish huquqi yo'q!");
      }
    } catch (error) {
      console.error("Error during login:", error);
      toast.error("Login yoki parol xato");
    }
  };

  return (
    <div className="selection:bg-primary/10 selection:text-primary min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 dark:from-gray-900 dark:to-blue-900/20">
      <section className="pt-10 lg:pt-20">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 xl:max-w-6xl">
          <div className="relative">
            {/* Background effects */}
            <div
              aria-hidden="true"
              className="absolute inset-0 -top-20 grid grid-cols-2 -space-x-52 opacity-40 dark:opacity-20"
            >
              <div className="from-primary h-60 bg-gradient-to-br to-purple-400 blur-[106px] dark:from-blue-700"></div>
              <div className="to-sky-500 h-40 bg-gradient-to-r from-cyan-600 blur-[106px] dark:to-indigo-600"></div>
            </div>

            {/* Login card */}
            <div className="flex items-center justify-center">
              <div className="relative w-full max-w-md rounded-2xl border border-gray-200/80 bg-white/80 p-6 shadow-xl shadow-gray-400/10 backdrop-blur-sm dark:border-gray-600/50 dark:bg-gray-800/80 dark:shadow-none sm:p-8">
                {/* Header */}
                <div className="mb-8 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                    <svg
                      className="h-8 w-8 text-blue-600 dark:text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                    FitCRM
                  </h2>
                  <p className="mt-2 text-lg font-semibold text-blue-600 dark:text-blue-400">
                    Boshqaruv tizimi
                  </p>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Tizimga kirish
                  </p>
                </div>

                {/* Login form */}
                <form onSubmit={handleAdminSubmit} className="space-y-6">
                  <div>
                    <label
                      htmlFor="login"
                      className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Login <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="username"
                      id="username"
                      value={studentData.username}
                      onChange={handleStudentChange}
                      placeholder="Loginingizni kiriting"
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-700 transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-400/20"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="password"
                      className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Parol <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      name="password"
                      id="password"
                      value={studentData.password}
                      onChange={handleStudentChange}
                      placeholder="Parolingizni kiriting"
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-700 transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-400/20"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 text-lg font-semibold text-white shadow-lg transition-all duration-200 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                  >
                    Tizimga kirish
                  </button>
                </form>

                {/* Footer note */}
                <div className="mt-6 text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Faqat ma'sul shaxslar uchun
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <ToastContainer />
    </div>
  );
}
