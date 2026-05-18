/* eslint-disable */
import React, { useState, useEffect } from "react";
import { Link, useLocation, matchPath } from "react-router-dom";
import { HiX, HiLogout } from "react-icons/hi";
import routes from "../../../routes/province";

const Sidebar = ({ open, onClose }) => {
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
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

  return (
    <>
      {open && isMobile && (
        <div
          className="bg-black/20 fixed inset-0 z-40 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-white shadow-lg transition-transform duration-300 dark:bg-gray-900 dark:shadow-gray-800/30 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {isMobile && (
          <button
            onClick={onClose}
            className="absolute right-3 top-3 rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
            aria-label="Close sidebar"
          >
            <HiX size={20} />
          </button>
        )}

        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
          <span className="text-base font-semibold tracking-tight text-gray-800 dark:text-white">
            Province
          </span>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-6">
          <div className="space-y-1">
            {routes.map((route, index) => {
              const fullPath = route.layout + "/" + route.path;
              return (
                <Link key={index} to={fullPath} onClick={handleLinkClick}>
                  <div
                    className={`relative mb-1 flex cursor-pointer items-center rounded px-4 py-2 transition-colors ${
                      activeRoute(fullPath)
                        ? "bg-gray-100 font-medium text-gray-900 dark:bg-gray-800 dark:text-white"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                    }`}
                  >
                    <span className="mr-3 text-lg">{route.icon}</span>
                    <p className="text-sm">{route.name}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="border-t border-gray-200 p-4 dark:border-gray-800">
          <button
            onClick={() => {
              localStorage.clear();
              window.location.href = "/admin/login";
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 hover:text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400 dark:hover:bg-red-900"
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
