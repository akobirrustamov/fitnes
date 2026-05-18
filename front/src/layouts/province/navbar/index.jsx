import React from "react";
import { FiAlignJustify } from "react-icons/fi";

const Navbar = ({ onOpenSidenav, brandText }) => {
  return (
    <nav className="sticky top-4 z-40 mx-auto flex w-[calc(100%-2rem)] max-w-[1600px] items-center justify-between rounded-2xl bg-white/80 p-3 shadow-lg backdrop-blur-xl transition-all duration-300 dark:bg-[#0b1437]/80">
      <div className="flex items-center gap-3">
        <button
          className="rounded-xl bg-slate-100 p-2 text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-white"
          onClick={onOpenSidenav}
          aria-label="Open sidebar"
        >
          <FiAlignJustify className="h-5 w-5" />
        </button>
        <div>
          <p className="text-xl font-bold text-slate-900 dark:text-white">{brandText}</p>
        </div>
      </div>
      <div className="text-sm text-slate-500 dark:text-slate-400">Province panel</div>
    </nav>
  );
};

export default Navbar;
