import React, { useEffect, useState } from "react";
import ApiCall from "config";
import { Search, RefreshCw } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const formatDt = (v) => {
  if (!v) return "—";
  return v.replace("T", " ").slice(0, 19);
};

export default function ActionsPage() {
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [personId, setPersonId] = useState("");
  const [search, setSearch] = useState("");

  const fetchActions = async () => {
    setLoading(true);
    const params = {};
    if (personId) params.personId = personId;
    const result = await ApiCall("/api/v1/organizations/actions/getAll", "GET", null, params);
    setLoading(false);
    if (!result?.error) {
      setActions(Array.isArray(result.data) ? result.data : []);
    } else {
      toast.error("Ma'lumotlarni yuklashda xatolik yuz berdi");
    }
  };

  useEffect(() => {
    fetchActions();
  }, []);

  const filtered = actions.filter((a) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      String(a.id).includes(q) ||
      String(a.personId ?? "").includes(q) ||
      String(a.organizationId ?? "").includes(q) ||
      String(a.date ?? "").includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Tizim loglar jadvali</h1>
              <p className="mt-1 text-sm text-gray-500">Barcha kirish-chiqish harakatlari qayd etiladi</p>
            </div>
            <button
              onClick={fetchActions}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              Yangilash
            </button>
          </div>

          {/* Filters */}
          <div className="mt-4 flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[180px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ID, shaxs, tashkilot, sana bo'yicha qidirish..."
                className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-8 pr-3 text-sm text-gray-900 outline-none focus:border-gray-400"
              />
            </div>
            <input
              type="number"
              value={personId}
              onChange={(e) => setPersonId(e.target.value)}
              placeholder="Shaxs ID"
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-gray-400 w-36"
            />
            <button
              onClick={fetchActions}
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 transition"
            >
              Qidirish
            </button>
            {(search || personId) && (
              <button
                onClick={() => { setSearch(""); setPersonId(""); fetchActions(); }}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-500 hover:text-gray-700"
              >
                Tozalash
              </button>
            )}
          </div>

          {/* Table */}
          <div className="mt-4 overflow-hidden rounded-2xl border border-gray-200">
            <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
              <span className="font-semibold text-gray-900">Loglar</span>
              {filtered.length > 0 && (
                <span className="ml-2 text-sm font-normal text-gray-500">({filtered.length} ta)</span>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 font-medium text-gray-700">ID</th>
                    <th className="px-4 py-3 font-medium text-gray-700">Shaxs ID</th>
                    <th className="px-4 py-3 font-medium text-gray-700">Tashkilot ID</th>
                    <th className="px-4 py-3 font-medium text-gray-700">Sana</th>
                    <th className="px-4 py-3 font-medium text-gray-700">Kirish vaqti</th>
                    <th className="px-4 py-3 font-medium text-gray-700">Chiqish vaqti</th>
                    <th className="px-4 py-3 font-medium text-gray-700">Datetime</th>
                    <th className="px-4 py-3 font-medium text-gray-700">S-kunlar</th>
                    <th className="px-4 py-3 font-medium text-gray-700">Muhim</th>
                    <th className="px-4 py-3 font-medium text-gray-700">Yaratilgan</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="10" className="py-12 text-center text-gray-400">
                        Yuklanmoqda...
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="py-12 text-center text-gray-400">
                        Ma'lumot topilmadi
                      </td>
                    </tr>
                  ) : (
                    filtered.map((a) => (
                      <tr key={a.id} className="border-t border-gray-100 hover:bg-gray-50 transition">
                        <td className="px-4 py-3 font-mono text-xs text-gray-500">{a.id}</td>
                        <td className="px-4 py-3">{a.personId ?? "—"}</td>
                        <td className="px-4 py-3">{a.organizationId ?? "—"}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{a.date ?? "—"}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{formatDt(a.incomingTime)}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{formatDt(a.outgoingTime)}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{formatDt(a.datetime)}</td>
                        <td className="px-4 py-3 text-center">{a.sDays ?? 0}</td>
                        <td className="px-4 py-3 text-center">
                          {a.todayIsImportant === true ? (
                            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Ha</span>
                          ) : a.todayIsImportant === false ? (
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">Yo'q</span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">{formatDt(a.createdTime)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}
