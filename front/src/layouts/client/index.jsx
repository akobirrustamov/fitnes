import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import ClientNavbar from "./navbar";
import ClientSidebar from "./sidebar";
import routes from "../../routes/client";

export default function ClientLayout() {
  const location = useLocation();
  const [open, setOpen] = React.useState(window.innerWidth >= 1200);
  const [currentRoute, setCurrentRoute] = React.useState("Bosh sahifa");

  React.useEffect(() => {
    const token = localStorage.getItem("client_token");
    if (!token) {
      window.location.href = "/client/login";
    }
  }, []);

  React.useEffect(() => {
    const handler = () =>
      window.innerWidth < 1200 ? setOpen(false) : setOpen(true);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  React.useEffect(() => {
    for (const route of routes) {
      if (
        window.location.href.indexOf(route.layout + "/" + route.path) !== -1
      ) {
        setCurrentRoute(route.name);
        break;
      }
    }
  }, [location.pathname]);

  const getRoutes = (routes) =>
    routes.map((prop, key) => {
      if (prop.layout === "/client") {
        return (
          <Route path={`/${prop.path}`} element={prop.component} key={key} />
        );
      }
      return null;
    });

  return (
    <div className="flex h-full w-full">
      <ClientSidebar open={open} onClose={() => setOpen(false)} />
      <div className="h-full w-full bg-lightPrimary dark:!bg-navy-900">
        <main
          className={`mx-[12px] h-full flex-none transition-all md:pr-2 ${
            open ? "xl:ml-[273px]" : "xl:ml-0"
          }`}
        >
          <div className="h-full">
            <ClientNavbar
              onOpenSidenav={() => setOpen((o) => !o)}
              brandText={currentRoute}
            />
            <div className="mx-auto mb-auto h-full min-h-[84vh] p-2 md:pr-2">
              <Routes>
                {getRoutes(routes)}
                <Route
                  path="/"
                  element={<Navigate to="/client/home" replace />}
                />
              </Routes>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
