import React from "react";
import { Link } from "react-router-dom";
import Logo from "../../assets/img/logo.jpg";

const Header = () => {
  return (
    <header className="bg-gradient-to-r from-blue-600 to-blue-800 shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3">
            <img
              src={Logo}
              alt="BXU Logo"
              className="h-12 w-12 rounded-full object-contain bg-white p-1"
            />
            <div className="text-white">
              <h1 className="text-xl font-bold">Fitness</h1>
              <p className="text-xs text-blue-100">Buxoro Xalqaro Universiteti</p>
            </div>
          </Link>

          <Link
            to="/student/login"
            className="rounded-lg bg-white px-6 py-2.5 font-semibold text-blue-700 shadow-md transition-all duration-200 hover:bg-blue-50 hover:shadow-lg"
          >
            Kirish
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
