import React, { useEffect, useState } from "react";
import { FiAlignJustify } from "react-icons/fi";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { RiMoonFill, RiSunFill } from "react-icons/ri";
import { MdPerson, MdLogout } from "react-icons/md";
import ApiCall, { baseUrl } from "../../../config";
import Dropdown from "../../../components/dropdown";

const Navbar = (props) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { onOpenSidenav, brandText } = props;

  const [darkmode, setDarkmode] = useState(false);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStudent();
  }, []);

  const logOut = () => {
    localStorage.clear();
    navigate("/student/login");
  };

  const loadStudent = async () => {
    try {
      const token = localStorage.getItem("access_token") || localStorage.getItem("authToken");
      if (!token) {
        if (location.pathname !== "/student/login") {
          navigate("/student/login");
        }
        setLoading(false);
        return;
      }

      // Try loading from localStorage first (fast)
      const fullName = localStorage.getItem("fullName");
      const studentId = localStorage.getItem("studentId");

      if (fullName) {
        setStudent({ fullName, id: studentId });
      }

      // Then try fetching from backend
      if (studentId) {
        const response = await ApiCall(`/api/v1/student/${studentId}`, "GET");
        if (!response.error && response.data) {
          const data = response.data?.data || response.data;
          setStudent(data);
          setLoading(false);
          return;
        }
      }

      // Fallback — decode
      const response = await ApiCall("/api/v1/student/decode", "GET");
      if (!response.error && response.data) {
        setStudent(response.data);
        setLoading(false);
        return;
      }

      // If we had fullName from localStorage, keep it
      if (fullName) {
        setLoading(false);
        return;
      }

      // Nothing worked
      if (location.pathname !== "/student/login") {
        navigate("/student/login");
      }
    } catch (error) {
      console.error("Navbar student load error:", error);
      const fullName = localStorage.getItem("fullName");
      if (fullName) {
        setStudent({ fullName });
      } else if (location.pathname !== "/student/login") {
        navigate("/student/login");
      }
    } finally {
      setLoading(false);
    }
  };

  // Show skeleton while loading
  if (loading && location.pathname !== "/student/login") {
    return (
      <nav className="sticky top-4 z-40 mx-auto flex w-[calc(100%-2rem)] max-w-[1600px] items-center justify-between rounded-2xl bg-white/80 p-3 shadow-lg backdrop-blur-xl dark:bg-[#0b1437]/80 sm:p-4">
        <div className="ml-2 flex-1">
          <div className="h-7 w-40 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700"></div>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700"></div>
          <div className="h-9 w-9 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700"></div>
        </div>
      </nav>
    );
  }

  // Hide navbar on login page
  if (location.pathname === "/student/login") {
    return null;
  }

  const displayName = student?.fullName || student?.shortName || localStorage.getItem("fullName") || "Talaba";
  const firstLetter = (student?.firstName || displayName)?.charAt(0)?.toUpperCase() || "T";

  return (
    <nav className="sticky top-4 z-40 mx-auto flex w-[calc(100%-2rem)] max-w-[1600px] items-center justify-between rounded-2xl bg-white/80 p-2 shadow-lg backdrop-blur-xl transition-all duration-300 dark:bg-[#0b1437]/80 sm:p-3 md:p-4">
      {/* Left: Brand Text */}
      <div className="flex items-center gap-3">
        {/* Mobile menu toggle */}
        <button
          className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700 xl:hidden"
          onClick={onOpenSidenav}
        >
          <FiAlignJustify className="h-5 w-5" />
        </button>
        <div>
          <p className="text-xs font-medium text-gray-400 dark:text-gray-500">
            Talaba kabineti
          </p>
          <p className="text-lg font-bold text-gray-800 dark:text-white sm:text-xl md:text-2xl">
            {brandText}
          </p>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Dark mode toggle */}
        <button
          className="rounded-full bg-gray-100 p-2 text-gray-600 transition-all duration-200 hover:scale-105 hover:bg-gray-200 dark:bg-gray-700 dark:text-yellow-400 dark:hover:bg-gray-600 sm:p-2.5"
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
            <RiSunFill className="h-4 w-4 sm:h-5 sm:w-5" />
          ) : (
            <RiMoonFill className="h-4 w-4 sm:h-5 sm:w-5" />
          )}
        </button>

        {/* Profile Dropdown */}
        <Dropdown
          button={
            <button
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 p-1 pr-3 text-white shadow-md transition-all duration-200 hover:scale-105 hover:shadow-lg sm:p-1.5 sm:pr-4"
              aria-label="Profile menu"
            >
              {student?.imageFileId ? (
                <img
                  src={`${baseUrl}/api/v1/file/getFile/${student.imageFileId}`}
                  alt={displayName}
                  className="h-7 w-7 rounded-full object-cover sm:h-8 sm:w-8"
                />
              ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-sm font-bold sm:h-8 sm:w-8">
                  {firstLetter}
                </div>
              )}
              <span className="hidden text-sm font-medium sm:block">
                {displayName.length > 20
                  ? displayName.substring(0, 20) + "..."
                  : displayName}
              </span>
            </button>
          }
          children={
            <div className="ring-black/5 min-w-[260px] overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 dark:bg-gray-800 dark:ring-white/10 sm:min-w-[280px]">
              {/* User Info Header */}
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-5 py-4">
                <div className="flex items-center gap-3">
                  {student?.imageFileId ? (
                    <img
                      src={`${baseUrl}/api/v1/file/getFile/${student.imageFileId}`}
                      alt={displayName}
                      className="h-12 w-12 rounded-full border-2 border-white/30 object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white/30 bg-white/20 text-lg font-bold text-white">
                      {firstLetter}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {displayName}
                    </p>
                    <p className="text-xs text-blue-200">
                      {student?.studentIdNumber || localStorage.getItem("studentIdNumber") || "Talaba"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="p-2">
                <button
                  onClick={() => navigate("/student/default")}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700/50"
                >
                  <MdPerson className="h-4 w-4 text-gray-400" />
                  Bosh sahifa
                </button>
                <button
                  onClick={() => navigate("/student/profile")}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700/50"
                >
                  <MdPerson className="h-4 w-4 text-gray-400" />
                  Profil sozlamalari
                </button>
              </div>

              {/* Logout */}
              <div className="border-t border-gray-100 p-2 dark:border-gray-700">
                <button
                  onClick={logOut}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition-all duration-200 hover:bg-red-500 hover:text-white dark:bg-red-500/20 dark:text-red-400 dark:hover:bg-red-500 dark:hover:text-white"
                >
                  <MdLogout className="h-4 w-4" />
                  Tizimdan chiqish
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
