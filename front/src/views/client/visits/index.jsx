import React, { useEffect, useState } from "react";
import axios from "axios";
import { baseUrl } from "../../../config";
import { MdLogin, MdLogout, MdChevronLeft, MdChevronRight } from "react-icons/md";

function clientApi(url) {
  const token = localStorage.getItem("client_token");
  return axios.get(baseUrl + url, {
    headers: { Authorization: token ? `Bearer ${token}` : undefined },
  });
}

export default function ClientVisits() {
  const [visits, setVisits] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const limit = 20;

  useEffect(() => {
    fetchVisits(page);
  }, [page]);

  const fetchVisits = async (p) => {
    setLoading(true);
    try {
      const res = await clientApi(
        `/api/v1/client/visits?page=${p}&limit=${limit}`
      );
      setVisits(res.data?.data || []);
      setTotalPages(res.data?.totalPages || 1);
      setTotalCount(res.data?.totalCount || 0);
    } catch (err) {
      if (err.response?.status === 401) {
        window.location.href = "/client/login";
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 pb-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white">
          Tashrif tarixi
        </h2>
        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-600 dark:bg-blue-500/20 dark:text-blue-300">
          Jami: {totalCount}
        </span>
      </div>

      <div className="rounded-2xl bg-white shadow dark:bg-navy-800 overflow-hidden">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          </div>
        ) : visits.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-sm text-gray-400">
            Tashrif ma'lumotlari topilmadi
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-100 dark:divide-navy-700">
            <thead className="bg-gray-50 dark:bg-navy-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  #
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Terminal
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Yo'nalish
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Sana va vaqt
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-navy-700">
              {visits.map((v, i) => (
                <tr
                  key={v.id}
                  className="transition hover:bg-gray-50 dark:hover:bg-navy-700"
                >
                  <td className="px-4 py-3 text-sm text-gray-400">
                    {(page - 1) * limit + i + 1}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200">
                    {v.terminalName || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        v.direction === "IN"
                          ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400"
                          : "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400"
                      }`}
                    >
                      {v.direction === "IN" ? (
                        <MdLogin className="h-3 w-3" />
                      ) : (
                        <MdLogout className="h-3 w-3" />
                      )}
                      {v.direction === "IN" ? "Kirish" : "Chiqish"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                    {v.datetime
                      ? new Date(v.datetime).toLocaleString("uz-UZ")
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-40 dark:border-navy-600 dark:text-gray-300 dark:hover:bg-navy-700"
          >
            <MdChevronLeft className="h-4 w-4" />
            Oldingi
          </button>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page === totalPages}
            className="flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-40 dark:border-navy-600 dark:text-gray-300 dark:hover:bg-navy-700"
          >
            Keyingi
            <MdChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
