import React, { useEffect, useState } from "react";
import axios from "axios";
import ApiCall, { baseUrl } from "config";
import { LogIn, LogOut, User, Download } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const PAGE_SIZE = 30;

const fmtDt = (d) =>
  d ? new Date(d).toLocaleString("uz-UZ", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [downloadingExcel, setDownloadingExcel] = useState(false);
  const [tab, setTab] = useState("all"); // "all" | "today"
  const [filters, setFilters] = useState({ eventType: "", startDate: "", endDate: "" });

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  useEffect(() => {
    setPage(1);
    fetchEvents(1, tab, filters);
  }, [tab]);

  const fetchEvents = async (p = 1, currentTab = tab, f = filters) => {
    setLoading(true);
    const endpoint = currentTab === "today"
      ? "/api/v1/organizations/events/getToday"
      : "/api/v1/organizations/events/getAll";
    const params = { page: p, limit: PAGE_SIZE };
    if (f.eventType) params.eventType = f.eventType;
    if (currentTab === "all") {
      if (f.startDate) params.startDate = f.startDate;
      if (f.endDate) params.endDate = f.endDate;
    }
    const res = await ApiCall(endpoint, "GET", null, params);
    setLoading(false);
    if (!res?.error) {
      setEvents(res.data?.data || []);
      setTotalCount(res.data?.totalCount || 0);
    } else toast.error("Kirishlar yuklanmadi");
  };

  const handleFilter = (e) => {
    const updated = { ...filters, [e.target.name]: e.target.value };
    setFilters(updated);
    setPage(1);
    fetchEvents(1, tab, updated);
  };

  const handlePageChange = (p) => {
    setPage(p);
    fetchEvents(p);
  };

  const handleDownloadExcel = async () => {
    setDownloadingExcel(true);
    try {
      const token = localStorage.getItem("access_token");
      const params = {};
      if (filters.eventType) params.eventType = filters.eventType;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      const res = await axios.get(`${baseUrl}/api/v1/organizations/events/downloadExcel`, {
        params,
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = "kirishlar.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Excel yuklab olishda xatolik.");
    }
    setDownloadingExcel(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="mx-auto max-w-5xl space-y-5">
        {/* Header */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Kirishlar</h1>
              <p className="mt-1 text-sm text-gray-500">Jami: {totalCount} ta hodisa</p>
            </div>
            <button
              onClick={handleDownloadExcel}
              disabled={downloadingExcel}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <Download size={16} /> {downloadingExcel ? "Yuklanmoqda..." : "Excel"}
            </button>
          </div>
        </div>

        {/* Tabs + Filters */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex rounded-xl border border-gray-200 p-1">
              <button onClick={() => setTab("all")} className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${tab === "all" ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-50"}`}>Barchasi</button>
              <button onClick={() => setTab("today")} className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${tab === "today" ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-50"}`}>Bugun</button>
            </div>
            <select name="eventType" value={filters.eventType} onChange={handleFilter} className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 outline-none focus:border-gray-400">
              <option value="">Barcha turlar</option>
              <option value="enter">Kirish</option>
              <option value="exit">Chiqish</option>
            </select>
            {tab === "all" && (
              <>
                <input type="date" name="startDate" value={filters.startDate} onChange={handleFilter} className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 outline-none focus:border-gray-400" />
                <input type="date" name="endDate" value={filters.endDate} onChange={handleFilter} className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 outline-none focus:border-gray-400" />
              </>
            )}
          </div>
        </div>

        {/* List */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          {loading ? (
            <div className="py-12 text-center text-sm text-gray-400">Yuklanmoqda...</div>
          ) : events.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-400">Hodisalar topilmadi</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {events.map((ev) => (
                <div key={ev.id} className="flex items-center gap-4 px-5 py-3">
                  {ev.personPhoto ? (
                    <img src={ev.personPhoto} alt={ev.personName} className="h-10 w-10 flex-shrink-0 rounded-xl object-cover" onError={(e) => { e.target.style.display = "none"; }} />
                  ) : (
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gray-100">
                      <User size={18} className="text-gray-400" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-gray-900">{ev.personName}</p>
                    <p className="text-xs text-gray-500">{ev.terminalName || "—"}</p>
                  </div>
                  <div className="flex flex-shrink-0 flex-col items-end gap-1">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${ev.type === "enter" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>
                      {ev.type === "enter" ? <LogIn size={11} /> : <LogOut size={11} />}
                      {ev.type === "enter" ? "Kirish" : "Chiqish"}
                    </span>
                    <span className="text-xs text-gray-400">{fmtDt(ev.datetime)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button disabled={page <= 1} onClick={() => handlePageChange(page - 1)} className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-40">Oldingi</button>
            <span className="text-sm text-gray-500">{page} / {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => handlePageChange(page + 1)} className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-40">Keyingi</button>
          </div>
        )}
      </div>
    </div>
  );
}
