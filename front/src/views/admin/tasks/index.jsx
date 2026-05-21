import React, { useEffect, useState } from "react";
import ApiCall from "config";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const PAGE_SIZE = 20;

const STATUS_MAP = {
  pending: { label: "Kutilmoqda", cls: "bg-yellow-100 text-yellow-700" },
  success: { label: "Bajarildi", cls: "bg-green-100 text-green-700" },
  error:   { label: "Xatolik",   cls: "bg-red-100 text-red-600" },
};

const TYPE_MAP = {
  add:          "Qo'shish",
  update:       "Yangilash",
  delete:       "O'chirish",
  "photo-update": "Rasm",
  "clear-data": "Tozalash",
};

const fmtDt = (d) =>
  d ? new Date(d).toLocaleString("uz-UZ", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—";

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ waiting: "", taskType: "" });

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  useEffect(() => { fetchTasks(page, filters); }, [page]);

  const fetchTasks = async (p = 1, f = filters) => {
    setLoading(true);
    const params = { page: p, pageSize: PAGE_SIZE };
    if (f.waiting) params.waiting = f.waiting;
    if (f.taskType) params.taskType = f.taskType;
    const res = await ApiCall("/api/v1/organizations/tasks/getAll", "GET", null, params);
    setLoading(false);
    if (!res?.error) {
      setTasks(res.data?.data || []);
      setTotalCount(res.data?.totalCount || 0);
    } else toast.error("Tasklar yuklanmadi");
  };

  const handleFilter = (e) => {
    const updated = { ...filters, [e.target.name]: e.target.value };
    setFilters(updated);
    setPage(1);
    fetchTasks(1, updated);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="mx-auto max-w-5xl space-y-5">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-gray-900">Terminallar Tasklari</h1>
          <p className="mt-1 text-sm text-gray-500">Jami: {totalCount} ta task</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <select name="waiting" value={filters.waiting} onChange={handleFilter} className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 outline-none focus:border-gray-400">
            <option value="">Barcha statuslar</option>
            <option value="pending">Kutilmoqda</option>
            <option value="success">Bajarildi</option>
            <option value="error">Xatolik</option>
          </select>
          <select name="taskType" value={filters.taskType} onChange={handleFilter} className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 outline-none focus:border-gray-400">
            <option value="">Barcha turlar</option>
            <option value="add">Qo'shish</option>
            <option value="update">Yangilash</option>
            <option value="delete">O'chirish</option>
            <option value="photo-update">Rasm</option>
            <option value="clear-data">Tozalash</option>
          </select>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          {loading ? (
            <div className="py-12 text-center text-sm text-gray-400">Yuklanmoqda...</div>
          ) : tasks.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-400">Tasklar topilmadi</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">Terminal</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">Shaxs</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">Tur</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">Status</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">Vaqt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {tasks.map((t) => {
                    const st = STATUS_MAP[t.waiting] || { label: t.waiting, cls: "bg-gray-100 text-gray-600" };
                    return (
                      <tr key={t.id} className="hover:bg-gray-50">
                        <td className="px-5 py-3 font-medium text-gray-900">{t.terminalName || "—"}</td>
                        <td className="px-5 py-3 text-gray-600">{t.personName || "—"}</td>
                        <td className="px-5 py-3">
                          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                            {TYPE_MAP[t.taskType] || t.taskType}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${st.cls}`}>{st.label}</span>
                        </td>
                        <td className="px-5 py-3 text-gray-500">{fmtDt(t.createdTime)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-40">Oldingi</button>
            <span className="text-sm text-gray-500">{page} / {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-40">Keyingi</button>
          </div>
        )}
      </div>
    </div>
  );
}
