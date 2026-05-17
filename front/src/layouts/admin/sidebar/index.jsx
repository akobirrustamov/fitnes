/* eslint-disable */
import React from "react";
import { Link, useLocation, matchPath } from "react-router-dom";
import { HiX } from "react-icons/hi";

import routes from "../../../routes/admin";

const Sidebar = ({ open, onClose }) => {
  const location = useLocation();

  // Active route tekshirish
  const activeRoute = (fullPath) => {
    return matchPath({ path: fullPath, end: false }, location.pathname);
  };

  // Linklarni render qilish
  const createLinks = (routes) => {
    return routes.map((route, index) => {
      if (route.layout === "/admin" && !route.hidden) {
        const fullPath = route.layout + "/" + route.path;

        return (
          <Link key={index} to={fullPath}>
            <div className="relative mb-3 flex hover:cursor-pointer">
              <li className="flex cursor-pointer items-center px-8">
                <span
                  className={`${
                    activeRoute(fullPath)
                      ? "font-bold text-brand-500 dark:text-white"
                      : "font-medium text-gray-600"
                  }`}
                >
                  {route.icon ? route.icon : <DashIcon />}
                </span>

                <p
                  className={`leading-1 ml-4 flex ${
                    activeRoute(fullPath)
                      ? "font-bold text-navy-700 dark:text-white"
                      : "font-medium text-gray-600"
                  }`}
                >
                  {route.name}
                </p>
              </li>

              {activeRoute(fullPath) && (
                <div className="absolute right-0 top-px h-9 w-1 rounded-lg bg-brand-500 dark:bg-brand-400" />
              )}
            </div>
          </Link>
        );
      }
      return null;
    });
  };

  return (
    <div
      className={`fixed !z-50 flex min-h-full flex-col bg-white pb-10 shadow-2xl transition-all dark:!bg-navy-800 dark:text-white ${
        open ? "translate-x-0" : "-translate-x-96"
      }`}
    >
      {/* CLOSE BUTTON */}
      <span
        className="absolute top-4 right-4 block cursor-pointer xl:hidden"
        onClick={onClose}
      >
        <HiX />
      </span>

      {/* LOGO */}
      <div className="mx-[20px] mt-[20px] flex items-center">
        <div className="mt-1 ml-1 h-2.5 font-poppins text-[26px] font-bold uppercase text-navy-700 dark:text-white">
          ILMIY.BXU.UZ
        </div>
      </div>

      <div className="mt-[58px] mb-7 h-px bg-gray-300 dark:bg-white/30" />

      {/* MENU */}
      <div className="h-screen pb-36">
        <ul className="mb-auto h-full overflow-auto pb-20">
          {createLinks(routes)}

          {/* LOGOUT */}
          <li className="mt-20 px-8">
            <p
              onClick={() => {
                localStorage.clear();
                window.location.href = "/admin/login";
              }}
              className="cursor-pointer rounded-md p-2 text-sm font-medium text-red-600 hover:bg-gray-100 dark:text-white"
            >
              Tizimdan chiqish
            </p>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;
