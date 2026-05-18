import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "layouts/admin";
import StudentLayout from "layouts/student";
import Login from "./views/student/login/Login";
import LoginAdmin from "./config/login/Login";
import SuperAdminLayout from "layouts/superadmin";
import MonitorLayout from "layouts/monitor";
import RegionLayout from "layouts/region";
import ProvinceLayout from "layouts/province";
import Home from "./views/home/Home";

import ErrorPage from "./404/404";
import IconsAll from "./IconsAll";

const App = () => {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="superadmin/*" element={<SuperAdminLayout />} />
        <Route path="admin/*" element={<AdminLayout />} />
        <Route path="monitor/*" element={<MonitorLayout />} />
        <Route path="region/*" element={<RegionLayout />} />
        <Route path="province/*" element={<ProvinceLayout />} />
        <Route path="student/*" element={<StudentLayout />} />

        <Route path="admin/login" element={<LoginAdmin />} />
        <Route path="student/login" element={<Login />} />
        <Route path="icons" element={<IconsAll />} />

        <Route path="/404" element={<ErrorPage />} />

        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </>
  );
};

export default App;
