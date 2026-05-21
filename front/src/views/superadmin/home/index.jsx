import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ApiCall from "../../../config";
import {
  MdPublic,
  MdMap,
  MdBusiness,
  MdCategory,
  MdDns,
  MdCheckCircle,
  MdBlock,
} from "react-icons/md";

export default function MainDashboardSuper() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    provinces: null,
    regions: null,
    orgsTotal: null,
    orgsActive: null,
    orgsInactive: null,
    categories: null,
    monitors: null,
  });
  const [recentOrgs, setRecentOrgs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [provinces, regions, orgsAll, orgsActive, categories, monitors] =
      await Promise.all([
        ApiCall("/api/v1/admin/provinces/getAll", "GET"),
        ApiCall("/api/v1/admin/regions/getAll", "GET", null, { page: 1, pageSize: 1 }),
        ApiCall("/api/v1/admin/organizations/getAll", "GET", null, { page: 1, limit: 10 }),
        ApiCall("/api/v1/admin/organizations/getAll", "GET", null, { page: 1, limit: 1, active: true }),
        ApiCall("/api/v1/admin/categories/getAll", "GET"),
        ApiCall("/api/v1/admin/monitors/getAll", "GET", null, { page: 1, limit: 1 }),
      ]);

    const orgsTotal = orgsAll?.data?.totalCount ?? 0;
    const activeCount = orgsActive?.data?.totalCount ?? 0;

    setStats({
      provinces: Array.isArray(provinces?.data) ? provinces.data.length : 0,
      regions: regions?.data?.totalCount ?? 0,
      orgsTotal,
      orgsActive: activeCount,
      orgsInactive: Math.max(0, orgsTotal - activeCount),
      categories: Array.isArray(categories?.data) ? categories.data.length : 0,
      monitors: monitors?.data?.totalCount ?? 0,
    });

    const items = orgsAll?.data?.data || orgsAll?.data?.content || [];
    setRecentOrgs(items);
    setLoading(false);
  };

  const statCards = [
    {
      label: "Viloyatlar",
      value: stats.provinces,
      icon: <MdPublic className="h-7 w-7" />,
      color: "bg-blue-50 text-blue-600",
      path: "/superadmin/provinces",
    },
    {
      label: "Tumanlar",
      value: stats.regions,
      icon: <MdMap className="h-7 w-7" />,
      color: "bg-violet-50 text-violet-600",
      path: "/superadmin/regions",
    },
    {
      label: "Zallar",
      value: stats.orgsTotal,
      icon: <MdBusiness className="h-7 w-7" />,
      color: "bg-emerald-50 text-emerald-600",
      path: "/superadmin/organizations",
    },
    {
      label: "Mahsulot turlari",
      value: stats.categories,
      icon: <MdCategory className="h-7 w-7" />,
      color: "bg-orange-50 text-orange-600",
      path: "/superadmin/categories",
    },
    {
      label: "Serverlar",
      value: stats.monitors,
      icon: <MdDns className="h-7 w-7" />,
      color: "bg-gray-100 text-gray-600",
      path: "/superadmin/servers",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-6xl space-y-6">

        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {statCards.map((card) => (
            <button
              key={card.label}
              onClick={() => navigate(card.path)}
              className="rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:shadow-md"
            >
              <div className={`mb-3 inline-flex rounded-xl p-2.5 ${card.color}`}>
                {card.icon}
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {loading ? (
                  <span className="inline-block h-7 w-12 animate-pulse rounded bg-gray-200" />
                ) : (
                  card.value ?? "—"
                )}
              </div>
              <div className="mt-0.5 text-sm text-gray-500">{card.label}</div>
            </button>
          ))}
        </div>

        {/* Orgs active/inactive row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-green-50 p-2.5 text-green-600">
                <MdCheckCircle className="h-6 w-6" />
              </div>
              <div>
                <div className="text-xl font-bold text-gray-900">
                  {loading ? (
                    <span className="inline-block h-6 w-10 animate-pulse rounded bg-gray-200" />
                  ) : (
                    stats.orgsActive ?? "—"
                  )}
                </div>
                <div className="text-sm text-gray-500">Faol zallar</div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-pink-50 p-2.5 text-pink-500">
                <MdBlock className="h-6 w-6" />
              </div>
              <div>
                <div className="text-xl font-bold text-gray-900">
                  {loading ? (
                    <span className="inline-block h-6 w-10 animate-pulse rounded bg-gray-200" />
                  ) : (
                    stats.orgsInactive ?? "—"
                  )}
                </div>
                <div className="text-sm text-gray-500">Bloklangan zallar</div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent orgs */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <span className="font-semibold text-gray-900">So'nggi zallar</span>
            <button
              onClick={() => navigate("/superadmin/organizations")}
              className="text-sm text-blue-600 hover:underline"
            >
              Barchasini ko'rish
            </button>
          </div>
          <div className="overflow-x-auto px-6 py-4">
            <table className="min-w-full text-left text-sm text-gray-700">
              <thead>
                <tr>
                  <th className="pb-3 font-medium">Nomi</th>
                  <th className="pb-3 font-medium">Viloyat / Tuman</th>
                  <th className="pb-3 font-medium">Telefon</th>
                  <th className="pb-3 font-medium">Holat</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="border-t border-gray-100">
                      {Array.from({ length: 4 }).map((_, j) => (
                        <td key={j} className="py-3">
                          <span className="inline-block h-4 w-24 animate-pulse rounded bg-gray-100" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : recentOrgs.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-gray-400">
                      Zallar topilmadi.
                    </td>
                  </tr>
                ) : (
                  recentOrgs.map((org) => (
                    <tr key={org.id} className="border-t border-gray-100">
                      <td className="py-3 font-medium">{org.name}</td>
                      <td className="py-3 text-gray-500">
                        {org.regionName || "—"}
                      </td>
                      <td className="py-3">{org.phoneNumber || "—"}</td>
                      <td className="py-3">
                        {org.active ? (
                          <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
                            Faol
                          </span>
                        ) : (
                          <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-500">
                            Bloklangan
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
