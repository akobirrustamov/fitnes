import React, { useEffect, useState } from "react";
import ApiCall from "config";
import { CheckCheck, ExternalLink, BookOpen } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const PAGE_SIZE = 20;

const fmtDt = (d) =>
  d ? new Date(d).toLocaleString("uz-UZ", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";

export default function OrgNewsPage() {
  const [news, setNews] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [unread, setUnread] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isReadFilter, setIsReadFilter] = useState("");
  const [expanded, setExpanded] = useState(null);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  useEffect(() => { fetchNews(1, isReadFilter); fetchUnread(); }, []);

  const fetchNews = async (p = 1, isRead = isReadFilter) => {
    setLoading(true);
    const params = { page: p, pageSize: PAGE_SIZE };
    if (isRead !== "") params.isRead = isRead;
    const res = await ApiCall("/api/v1/organizations/news/getAll", "GET", null, params);
    setLoading(false);
    if (!res?.error) {
      setNews(res.data?.items || []);
      setTotalCount(res.data?.totalCount || 0);
    } else toast.error("Yangiliklar yuklanmadi");
  };

  const fetchUnread = async () => {
    const res = await ApiCall("/api/v1/organizations/news/getUnreadCount", "GET");
    if (!res?.error) setUnread(res.data?.unreadCount || 0);
  };

  const markAsRead = async (newsId) => {
    const res = await ApiCall(`/api/v1/organizations/news/markAsRead?newsId=${newsId}`, "POST");
    if (!res?.error) {
      setNews((prev) => prev.map((n) => n.newsId === newsId ? { ...n, isRead: true } : n));
      setUnread((u) => Math.max(0, u - 1));
    }
  };

  const markAllRead = async () => {
    const res = await ApiCall("/api/v1/organizations/news/markAllAsRead", "POST");
    if (!res?.error) {
      toast.success("Barcha yangiliklar o'qildi");
      setNews((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnread(0);
    }
  };

  const handleFilterChange = (val) => {
    setIsReadFilter(val);
    setPage(1);
    fetchNews(1, val);
  };

  const handlePageChange = (p) => {
    setPage(p);
    fetchNews(p);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="mx-auto max-w-4xl space-y-5">
        {/* Header */}
        <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-gray-900">Yangiliklar</h1>
              {unread > 0 && (
                <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">
                  {unread} yangi
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-gray-500">Jami: {totalCount} ta yangilik</p>
          </div>
          {unread > 0 && (
            <button onClick={markAllRead} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50">
              <CheckCheck size={16} /> Hammasini o'qildi
            </button>
          )}
        </div>

        {/* Filter */}
        <div className="flex gap-2 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
          {[["", "Barchasi"], ["false", "O'qilmagan"], ["true", "O'qilgan"]].map(([val, label]) => (
            <button key={val} onClick={() => handleFilterChange(val)}
              className={`rounded-xl px-3 py-1.5 text-sm font-medium transition ${isReadFilter === val ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-50"}`}>
              {label}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="space-y-3">
          {loading ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-sm text-gray-400">Yuklanmoqda...</div>
          ) : news.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-sm text-gray-400">Yangiliklar topilmadi</div>
          ) : news.map((item) => (
            <div key={item.newsId} className={`rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md ${!item.isRead ? "border-blue-200" : "border-gray-200"}`}>
              <div className="flex gap-4">
                {item.photoUrl && (
                  <img src={item.photoUrl} alt={item.title} className="h-20 w-20 flex-shrink-0 rounded-xl object-cover" onError={(e) => { e.target.style.display = "none"; }} />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{item.title}</h3>
                        {!item.isRead && <span className="h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />}
                      </div>
                      {item.description && (
                        <p className="mt-1 text-sm text-gray-500 line-clamp-2">{item.description}</p>
                      )}
                      {expanded === item.newsId && item.content && (
                        <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">{item.content}</p>
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-400">
                        <span>{fmtDt(item.createdTime)}</span>
                        {item.url && (
                          <a href={item.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-500 hover:underline">
                            <ExternalLink size={11} /> Havola
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-shrink-0 flex-col items-end gap-2">
                      {item.content && (
                        <button
                          onClick={() => {
                            setExpanded(expanded === item.newsId ? null : item.newsId);
                            if (!item.isRead) markAsRead(item.newsId);
                          }}
                          className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-100"
                        >
                          <BookOpen size={13} />
                          {expanded === item.newsId ? "Yig'ish" : "Ko'rish"}
                        </button>
                      )}
                      {!item.isRead && (
                        <button onClick={() => markAsRead(item.newsId)} className="text-xs text-gray-400 underline hover:text-gray-600">
                          O'qildi
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

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
