import React, { useEffect, useState } from "react";
import { FiAlignJustify } from "react-icons/fi";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FiSearch } from "react-icons/fi";
import { RiMoonFill, RiSunFill } from "react-icons/ri";
import { MdPerson } from "react-icons/md";
import ApiCall from "../../../config";
import Dropdown from "../../../components/dropdown";
import {
  IoMdNotificationsOutline,
  IoMdInformationCircleOutline,
} from "react-icons/io";

const Navbar = (props) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { onOpenSidenav, brandText } = props;

  const [darkmode, setDarkmode] = useState(false);
  const [admin, setAdmin] = useState(null);

  useEffect(() => {
    getAdmin();
  }, []);

  // 🔥 LOGOUT
  const logOut = () => {
    localStorage.clear();
    navigate("/admin/login");
  };

  // 🔥 GET USER
  const getAdmin = async () => {
    try {
      const response = await ApiCall("/api/v1/auth/decode", "GET");
      const data = response.data;

      setAdmin(data);

      if (!data) {
        navigate("/admin/login");
      }
    } catch (error) {
      navigate("/admin/login");
      console.error(error);
    }
  };

  const rolePathMap = {
    ROLE_ADMIN: "/admin/default",
    ROLE_SUPERADMIN: "/superadmin/default",
    ROLE_USER: "/user/default",
    ROLE_BUGALTER: "/bugalter/default",
    ROLE_OFFICE: "/office/default",
  };

  // 🔥 ROLE CHANGE + PAGE CHANGE
    const changeRole = async (userId, role) => {
      try {
        const response = await ApiCall(`/api/v1/auth/change-role/${role.id}`, "PUT");
        const updatedUser = response.data;
        


        setAdmin(updatedUser);

        const redirectPath = rolePathMap[role.name] || "/admin/default";
        navigate(redirectPath);
      } catch (error) {
        console.error("Role change error:", error);
        navigate("/admin/login");
      }
    };

    if (admin === null && location.pathname !== "/admin/login") {
      return null;
    }

    return (
      <nav className="sticky top-4 z-40 mx-auto flex w-[calc(100%-2rem)] max-w-[1600px] items-center justify-between rounded-2xl bg-white/80 p-2 shadow-lg backdrop-blur-xl transition-all duration-300 dark:bg-[#0b1437]/80 sm:p-3 md:p-4">
        {/* Brand Text */}
        <div className="ml-2 flex-1 md:ml-[6px]">
          <p className="text-xl font-bold text-gray-800 dark:text-white sm:text-2xl md:text-[24px]">
            {brandText}
          </p>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* BURGER TOGGLE */}
          <button
            onClick={onOpenSidenav}
            className="rounded-lg p-1.5 text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            aria-label="Toggle sidebar"
          >
            <FiAlignJustify className="h-5 w-5" />
          </button>

          {/* DARK MODE TOGGLE */}
          <button
            className="rounded-full bg-gray-200 p-2 text-gray-700 transition-all duration-200 hover:scale-105 hover:bg-gray-300 dark:bg-gray-700 dark:text-yellow-400 dark:hover:bg-gray-600 sm:p-2.5"
            onClick={() => {
              if (darkmode) {
                document.body.classList.remove("dark");
                setDarkmode(false);
              } else {
                document.body.classList.add("dark");
                setDarkmode(true);
              }
            }}
            aria-label="Toggle dark mode"
          >
            {darkmode ? (
              <RiSunFill className="h-5 w-5 sm:h-5 sm:w-5" />
            ) : (
              <RiMoonFill className="h-5 w-5 sm:h-5 sm:w-5" />
            )}
          </button>

          {/* PROFILE DROPDOWN */}
          <Dropdown
            button={
              <button
                className="flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 p-1.5 text-white shadow-md transition-all duration-200 hover:scale-105 hover:shadow-lg sm:p-2"
                aria-label="Profile menu"
              >
                <MdPerson className="h-6 w-6 sm:h-7 sm:w-7" />
              </button>
            }
            children={
              <div className="ring-black/5 min-w-[260px] rounded-2xl bg-white shadow-2xl ring-1 dark:bg-gray-800 dark:ring-white/10 sm:min-w-[280px] sm:max-w-sm">
                {/* User Info Header */}
                <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
                  <p className="text-base font-semibold text-gray-800 dark:text-white">
                    {admin?.name}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    {admin?.activeRole?.name?.replace("ROLE_", "") || "User"}
                  </p>
                </div>

                {/* Roles Section */}
                <div className="px-2 py-3">
                  <p className="mb-2 px-2 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Switch Role
                  </p>
                  <div className="max-h-64 space-y-1 overflow-y-auto">
                    {admin?.roles?.map((role) => (
                      <button
                        key={role.id}
                        onClick={() => changeRole(admin.id, role)}
                        className={`w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all duration-200 ${String(admin?.activeRole?.id) === String(role.id)
                            ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md"
                            : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/50"
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{role.name.replace("ROLE_", "")}</span>
                          {String(admin?.activeRole?.id) === String(role.id) && (
                            <span className="text-xs opacity-80">✓ Active</span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Logout Button */}
                <div className="border-t border-gray-200 p-3 dark:border-gray-700">
                  <button
                    onClick={logOut}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-600 transition-all duration-200 hover:bg-red-500 hover:text-white dark:bg-red-500/20 dark:text-red-400 dark:hover:bg-red-500 dark:hover:text-white"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    Log Out
                  </button>
                </div>
              </div>
            }
          />
        </div>
      </nav>
    );
  };

  export default Navbar;
