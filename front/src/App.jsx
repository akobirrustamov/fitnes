import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "layouts/admin";
import StudentLayout from "layouts/student";
import Login from "./views/student/login/Login";
import LoginAdmin from "./config/login/Login";
import SuperAdminLayout from "layouts/superadmin";
import RektorLayout from "layouts/rektor";
import IlmiyBolimLayout from "layouts/ilmiy-bolim";
import IlmiyRahbarLayout from "layouts/ilmiy-rahbar";
import IlmiyTexnikLayout from "layouts/ilmiy-rahbar";
import BugalterLayout from "layouts/bugalter";
import Home from "./views/home/Home";

import ErrorPage from "./404/404";
import IconsAll from "./IconsAll";

const App = () => {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="superadmin/*" element={<SuperAdminLayout />} />
        <Route path="rektor/*" element={<RektorLayout />} />
        <Route path="admin/*" element={<AdminLayout />} />
        <Route path="bugalter/*" element={<BugalterLayout />} />
        <Route path="ilmiy-bolim/*" element={<IlmiyBolimLayout />} />
        <Route path="ilmiy-rahbar/*" element={<IlmiyRahbarLayout />} />
        <Route path="ilmiy-texnik/*" element={<IlmiyTexnikLayout />} />
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
