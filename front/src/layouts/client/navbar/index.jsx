import React from "react";
import { FiAlignJustify } from "react-icons/fi";
import { MdPerson, MdLogout } from "react-icons/md";

const ClientNavbar = ({ onOpenSidenav, brandText }) => {
  const name = localStorage.getItem("client_name") || "Mijoz";
  const photoUrl = localStorage.getItem("client_photo");

  const logOut = () => {
    localStorage.removeItem("client_token");
    localStorage.removeItem("client_id");
    localStorage.removeItem("client_name");
    localStorage.removeItem("client_photo");
    localStorage.removeItem("client_org_id");
    window.location.href = "/client/login";
  };

  return (
    <nav className="sticky top-4 z-40 mx-auto flex w-[calc(100%-2rem)] max-w-[1600px] items-center justify-between rounded-2xl bg-white/80 p-2 shadow-lg backdrop-blur-xl transition-all duration-300 dark:bg-[#0b1437]/80 sm:p-3">
      <div className="ml-2 flex-1">
        <p className="text-xl font-bold text-gray-800 dark:text-white sm:text-2xl">
          {brandText}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidenav}
          className="rounded-lg p-1.5 text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          <FiAlignJustify className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={name}
              className="h-9 w-9 rounded-full object-cover ring-2 ring-brand-500"
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <MdPerson className="h-5 w-5" />
            </div>
          )}
          <span className="hidden text-sm font-semibold text-gray-700 dark:text-white sm:block">
            {name}
          </span>
        </div>

        <button
          onClick={logOut}
          title="Chiqish"
          className="flex items-center gap-1.5 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-500 hover:text-white dark:bg-red-500/20 dark:text-red-400 dark:hover:bg-red-500 dark:hover:text-white"
        >
          <MdLogout className="h-4 w-4" />
          <span className="hidden sm:block">Chiqish</span>
        </button>
      </div>
    </nav>
  );
};

export default ClientNavbar;
