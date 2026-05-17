/* eslint-disable */
import React, { useState, useEffect } from "react";
import { Link, useLocation, matchPath } from "react-router-dom";
import { HiX, HiLogout } from "react-icons/hi";
import { MdSchool } from "react-icons/md";
import routes from "../../../routes/student";

const Sidebar = ({ open, onClose }) => {
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);

  // Detect screen size
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1200);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const activeRoute = (fullPath) => {
    return matchPath({ path: fullPath, end: false }, location.pathname);
  };

  const handleLinkClick = () => {
    if (isMobile) {
      onClose();
    }
  };

  const createLinks = (routes) => {
    return routes.map((route, index) => {
      if (route.layout === "/student" && !route.hidden) {
        const fullPath = route.layout + "/" + route.path;
        const isActive = activeRoute(fullPath);

        return (
          <Link key={index} to={fullPath} onClick={handleLinkClick}>
            <div
              className={`relative mb-1 flex cursor-pointer items-center rounded-xl px-4 py-2.5 transition-all duration-200 ${
                isActive
                  ? "bg-gradient-to-r from-blue-500 to-indigo-600 font-medium text-white shadow-md"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
              }`}
            >
              <span className={`mr-3 text-lg ${isActive ? "text-white" : ""}`}>
                {route.icon || <HiX />}
              </span>
              <p className="text-sm">{route.name}</p>
            </div>
          </Link>
        );
      }
      return null;
    });
  };

  return (
    <>
      {/* Overlay for mobile */}
      {open && isMobile && (
        <div
          className="bg-black/20 fixed inset-0 z-40 backdrop-blur-sm transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-white shadow-xl transition-transform duration-300 ease-in-out dark:bg-gray-900 dark:shadow-gray-800/30 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Close button (mobile) */}
        {isMobile && (
          <button
            onClick={onClose}
            className="absolute right-3 top-3 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-300"
            aria-label="Close sidebar"
          >
            <HiX size={20} />
          </button>
        )}

        {/* Logo */}
        <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-5 dark:border-gray-800">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md">
            <MdSchool className="h-6 w-6 text-white" />
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-gray-800 dark:text-white">
              ILMIY.BXU.UZ
            </span>
            <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500">
              Talaba kabineti
            </p>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-600">
            Asosiy
          </p>
          <div className="space-y-1">{createLinks(routes)}</div>
        </div>

        {/* Student Info + Logout */}
        <div className="border-t border-gray-100 p-4 dark:border-gray-800">
          {/* Student name from localStorage */}
          {localStorage.getItem("fullName") && (
            <div className="mb-3 rounded-xl bg-gray-50 px-3 py-2.5 dark:bg-gray-800">
              <p className="truncate text-xs font-semibold text-gray-700 dark:text-gray-300">
                {localStorage.getItem("fullName")}
              </p>
              <p className="truncate text-[10px] text-gray-400 dark:text-gray-500">
                {localStorage.getItem("studentIdNumber") || "Talaba"}
              </p>
            </div>
          )}
          <button
            onClick={() => {
              localStorage.clear();
              window.location.href = "/student/login";
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-600 transition-all duration-200 hover:bg-red-500 hover:text-white hover:shadow-md dark:border-red-800 dark:bg-red-950 dark:text-red-400 dark:hover:bg-red-600 dark:hover:text-white"
          >
            <HiLogout size={16} />
            <span>Tizimdan chiqish</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
