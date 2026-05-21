import React, { useEffect, useState } from "react";
import ApiCall from "../../../config";
import { Eye, Trash2, CheckCheck, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { Modal } from "react-responsive-modal";
import "react-responsive-modal/styles.css";

export default function FeedbackPage() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ markup: "", is_seen: "", is_registration: "" });
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [message, setMessage] = useState("");
  const PAGE_SIZE = 20;

  const safeArray = (v) => (Array.isArray(v) ? v : []);

  useEffect(() => {
    fetchFeedbacks();
  }, [page, filters]);

  const fetchFeedbacks = async () => {
    setLoading(true);
    const params = { page, pageSize: PAGE_SIZE };
    if (filters.markup !== "") params.markup = filters.markup;
    if (filters.is_seen !== "") params.is_seen = filters.is_seen;
    if (filters.is_registration !== "") params.is_registration = filters.is_registration;
    const result = await ApiCall("/api/v1/admin/feedbacks/getAll", "GET", null, params);
    setLoading(false);
    if (!result?.error) {
      setFeedbacks(result.data?.data || result.data?.content || result.data || []);
      setTotal(result.data?.totalCount || result.data?.total || 0);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleView = (fb) => {
    setSelectedFeedback(fb);
    setShowDetailModal(true);
    if (!fb.is_seen) markSeen(fb.id);
  };

  const markSeen = async (id) => {
    await ApiCall(`/api/v1/admin/feedbacks/setRead?id=${id}`, "PUT");
    setFeedbacks((prev) => prev.map((f) => (f.id === id ? { ...f, is_seen: true } : f)));
  };

  const handleMarkAllSeen = async () => {
    const result = await ApiCall("/api/v1/admin/feedbacks/setAllRead", "PUT");
    if (!result?.error) {
      setMessage("Barchasi o'qildi deb belgilandi.");
      fetchFeedbacks();
    }
  };

  const handleToggleMarkup = async (id, current) => {
    await ApiCall(`/api/v1/admin/feedbacks/setMarkup?id=${id}&markup=${!current}`, "PUT");
    setFeedbacks((prev) => prev.map((f) => (f.id === id ? { ...f, markup: !current } : f)));
    if (selectedFeedback?.id === id) setSelectedFeedback((prev) => ({ ...prev, markup: !current }));
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Ushbu murojaatni o'chirishni xohlaysizmi?")) return;
    const result = await ApiCall(`/api/v1/admin/feedbacks/delete?id=${id}`, "DELETE");
    if (!result?.error) {
      setMessage("Murojaat o'chirildi.");
      if (showDetailModal && selectedFeedback?.id === id) setShowDetailModal(false);
      fetchFeedbacks();
    }
  };

  const fbList = safeArray(feedbacks);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Murojaatlar</h1>
              <p className="mt-1 text-sm text-gray-600">
                Xaridorlar va mehmon foydalanuvchilardan kelgan murojaatlar.
              </p>
            </div>
            <button
              onClick={handleMarkAllSeen}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              <CheckCheck size={16} /> Barchasini o'qildi
            </button>
          </div>

          {message && (
            <div className="mt-4 rounded-xl bg-green-50 p-4 text-sm text-green-700">{message}</div>
          )}

          {/* Filters */}
          <div className="mt-5 flex flex-wrap gap-3">
            <select
              value={filters.markup}
              onChange={(e) => handleFilterChange("markup", e.target.value)}
              className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 outline-none"
            >
              <option value="">Muhimlik — barchasi</option>
              <option value="true">Muhim</option>
              <option value="false">Oddiy</option>
            </select>
            <select
              value={filters.is_seen}
              onChange={(e) => handleFilterChange("is_seen", e.target.value)}
              className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 outline-none"
            >
              <option value="">Ko'rilganlik — barchasi</option>
              <option value="false">O'qilmagan</option>
              <option value="true">O'qilgan</option>
            </select>
            <select
              value={filters.is_registration}
              onChange={(e) => handleFilterChange("is_registration", e.target.value)}
              className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 outline-none"
            >
              <option value="">Turi — barchasi</option>
              <option value="true">Ro'yxatdan o'tish</option>
              <option value="false">Oddiy murojaat</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 font-semibold text-gray-900">
            Murojaatlar ro'yxati
            {total > 0 && <span className="ml-2 text-sm font-normal text-gray-500">({total} ta)</span>}
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-12 text-center text-sm text-gray-400">Yuklanmoqda...</div>
            ) : (
              <table className="min-w-full text-left text-sm text-gray-600">
                <thead className="border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3 font-medium">Muallif</th>
                    <th className="px-6 py-3 font-medium">Murojaat</th>
                    <th className="px-6 py-3 font-medium">Turi</th>
                    <th className="px-6 py-3 font-medium">Holat</th>
                    <th className="px-6 py-3 font-medium">Sana</th>
                    <th className="px-6 py-3 font-medium text-right">Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {fbList.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-10 text-center text-gray-400">
                        Murojaatlar topilmadi.
                      </td>
                    </tr>
                  ) : (
                    fbList.map((fb) => (
                      <tr
                        key={fb.id}
                        className={`border-t border-gray-100 ${!fb.is_seen ? "bg-blue-50/40" : ""}`}
                      >
                        <td className="px-6 py-3">
                          <div className="font-medium text-gray-800">{fb.fullName || fb.full_name || "—"}</div>
                          <div className="text-xs text-gray-400">{fb.phoneNumber || fb.phone_number || ""}</div>
                        </td>
                        <td className="px-6 py-3 max-w-xs">
                          <span className="line-clamp-2">{fb.message || fb.text || "—"}</span>
                        </td>
                        <td className="px-6 py-3">
                          {fb.is_registration || fb.isRegistration ? (
                            <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700">Ro'yxatdan o'tish</span>
                          ) : (
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">Murojaat</span>
                          )}
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex flex-col gap-1">
                            {!fb.is_seen && (
                              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">Yangi</span>
                            )}
                            {(fb.markup) && (
                              <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                                <Star size={10} /> Muhim
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-3 text-xs text-gray-400">
                          {fb.createdTime ? new Date(fb.createdTime).toLocaleDateString("uz-UZ") : "—"}
                        </td>
                        <td className="px-6 py-3 text-right">
                          <button
                            onClick={() => handleView(fb)}
                            className="mr-1 rounded-lg bg-blue-100 px-3 py-1 text-sm text-blue-700 hover:bg-blue-200"
                            title="Ko'rish"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => handleToggleMarkup(fb.id, fb.markup)}
                            className={`mr-1 rounded-lg px-3 py-1 text-sm ${
                              fb.markup
                                ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                            title={fb.markup ? "Muhimdan chiqarish" : "Muhim deb belgilash"}
                          >
                            <Star size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(fb.id)}
                            className="rounded-lg bg-pink-100 px-3 py-1 text-sm text-pink-700 hover:bg-pink-200"
                            title="O'chirish"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
              <span className="text-sm text-gray-500">
                {page} / {totalPages} sahifa
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="rounded-lg border border-gray-200 p-1.5 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-lg border border-gray-200 p-1.5 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      <Modal open={showDetailModal} onClose={() => setShowDetailModal(false)} center>
        <div className="w-[520px] max-w-full p-6">
          {selectedFeedback && (
            <>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Murojaat tafsiloti</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggleMarkup(selectedFeedback.id, selectedFeedback.markup)}
                    className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium ${
                      selectedFeedback.markup
                        ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    <Star size={12} />
                    {selectedFeedback.markup ? "Muhimdan chiqarish" : "Muhim"}
                  </button>
                  <button
                    onClick={() => handleDelete(selectedFeedback.id)}
                    className="inline-flex items-center gap-1 rounded-lg bg-pink-100 px-3 py-1.5 text-xs font-medium text-pink-700 hover:bg-pink-200"
                  >
                    <Trash2 size={12} /> O'chirish
                  </button>
                </div>
              </div>

              <div className="space-y-3 rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm">
                <div className="flex gap-2">
                  <span className="w-32 shrink-0 text-gray-500">Muallif:</span>
                  <span className="font-medium">{selectedFeedback.fullName || selectedFeedback.full_name || "—"}</span>
                </div>
                <div className="flex gap-2">
                  <span className="w-32 shrink-0 text-gray-500">Telefon:</span>
                  <span className="font-medium">{selectedFeedback.phoneNumber || selectedFeedback.phone_number || "—"}</span>
                </div>
                <div className="flex gap-2">
                  <span className="w-32 shrink-0 text-gray-500">Email:</span>
                  <span className="font-medium">{selectedFeedback.email || "—"}</span>
                </div>
                <div className="flex gap-2">
                  <span className="w-32 shrink-0 text-gray-500">Turi:</span>
                  <span>
                    {selectedFeedback.is_registration || selectedFeedback.isRegistration
                      ? "Ro'yxatdan o'tish"
                      : "Oddiy murojaat"}
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="w-32 shrink-0 text-gray-500">Sana:</span>
                  <span>{selectedFeedback.createdTime ? new Date(selectedFeedback.createdTime).toLocaleString("uz-UZ") : "—"}</span>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4">
                <div className="mb-2 text-xs font-medium text-gray-500">Murojaat matni:</div>
                <p className="text-sm leading-relaxed text-gray-800">
                  {selectedFeedback.message || selectedFeedback.text || "Matn yo'q."}
                </p>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
