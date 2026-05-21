import React, { useEffect, useState } from "react";
import { FiAlignJustify } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { RiMoonFill, RiSunFill } from "react-icons/ri";
import { MdPerson } from "react-icons/md";
import ApiCall from "../../../config";
import Dropdown from "../../../components/dropdown";

const Navbar = ({ onOpenSidenav, brandText }) => {
  const navigate = useNavigate();
  const [darkmode, setDarkmode] = useState(false);
  const [admin, setAdmin] = useState(null);

  useEffect(() => {
    ApiCall("/api/v1/auth/decode", "GET")
      .then((res) => {
        if (!res?.error) setAdmin(res.data);
        else navigate("/admin/login");
      })
      .catch(() => navigate("/admin/login"));
  }, []);

  const logOut = () => {
    localStorage.clear();
    navigate("/admin/login");
  };

  return (
    <nav className="sticky top-4 z-40 mx-auto flex w-[calc(100%-2rem)] max-w-[1600px] items-center justify-between rounded-2xl bg-white/80 p-2 shadow-lg backdrop-blur-xl transition-all duration-300 dark:bg-[#0b1437]/80 sm:p-3 md:p-4">
      <div className="ml-2 flex-1 md:ml-[6px]">
        <p className="text-xl font-bold text-gray-800 dark:text-white sm:text-2xl md:text-[24px]">
          {brandText}
        </p>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={onOpenSidenav}
          className="rounded-lg p-1.5 text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
          aria-label="Toggle sidebar"
        >
          <FiAlignJustify className="h-5 w-5" />
        </button>

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
            <RiSunFill className="h-5 w-5" />
          ) : (
            <RiMoonFill className="h-5 w-5" />
          )}
        </button>

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
            <div className="ring-black/5 min-w-[240px] rounded-2xl bg-white shadow-2xl ring-1 dark:bg-gray-800 dark:ring-white/10">
              <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
                <p className="text-base font-semibold text-gray-800 dark:text-white">
                  {admin?.name}
                </p>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  {admin?.activeRole?.name?.replace("ROLE_", "") || "Monitor"}
                </p>
              </div>
              <div className="border-t border-gray-200 p-3 dark:border-gray-700">
                <button
                  onClick={logOut}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-600 transition-all duration-200 hover:bg-red-500 hover:text-white dark:bg-red-500/20 dark:text-red-400 dark:hover:bg-red-500 dark:hover:text-white"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Chiqish
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
