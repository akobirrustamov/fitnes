import { useEffect, useState } from "react";
import ApiCall, { baseUrl } from "../../../config/index";
import {
  MdCheckCircle,
  MdHourglassEmpty,
  MdCancel,
  MdDownload,
  MdAssignmentTurnedIn,
  MdClose,
  MdPictureAsPdf,
  MdInfo,
  MdCheck,
  MdThumbDown,
  MdPerson,
  MdFilterList,
  MdCategory,
} from "react-icons/md";

const CATEGORY_OPTIONS = [
  { value: 1, label: "O'quv ishlari va malakaviy imtihonlar" },
  { value: 2, label: "Ilmiy tadqiqot ishi" },
  { value: 3, label: "Dissertatsiya mavzusi buyicha ilmiy maqolalar chop etish" },
  { value: 4, label: "Dissertatsiya mavzusi bo'yicha tahliliy umum-lashtiruvchi qisqacha ma'lumot natijalari bo'yicha seminar o'tkazish" },
  { value: 5, label: "Dissertatsiya mavzusi bo'yicha shaxsiy rejaning bajarilishi to'g'risida hisobot" },
];

// StudentRejaChecking status: 0=yuklandi/tekshiruvda (в процессе), 1=tasdiqlandi (одобрена), 2=rad etildi (отклонена)
// RejaHistory status: 0=pending (ожидает решения), 1=accepted (принято), 2=rejected (отклонено)
// Note: Holati shows THIS RejaHistory's status (checker's decision), not overall StudentRejaChecking status

const getStatusBadge = (rejaHistoryStatus) => {
  // Display status of THIS specific RejaHistory record (this checker's decision)
  const map = {
    0: { label: "Reja yuklandi", cls: "bg-blue-100 text-blue-800", icon: <MdHourglassEmpty className="mr-1 h-4 w-4" /> },
    1: { label: "Tasdiqlangan", cls: "bg-green-100 text-green-800", icon: <MdCheckCircle className="mr-1 h-4 w-4" /> },
    2: { label: "Rad etilgan", cls: "bg-red-100 text-red-800", icon: <MdCancel className="mr-1 h-4 w-4" /> },
  };
  const info = map[rejaHistoryStatus] || { label: "Noma'lum", cls: "bg-gray-50 text-gray-500", icon: null };
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${info.cls}`}>
      {info.icon}
      {info.label}
    </span>
  );
};

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("uz-UZ") + " " + d.toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" });
};

const getPersonName = (person) => {
  if (!person) return "—";
  if (person.name) return person.name;
  if (person.firstName || person.lastName)
    return `${person.firstName || ""} ${person.lastName || ""}`.trim();
  if (person.phone) return person.phone;
  return "—";
};

const ITEMS_PER_PAGE = 50;

const getCourseValue = (item) => {
  const levelName =
    item.studentRejaChecking?.studentReja?.student?.level?.name ||
    item.studentRejaChecking?.studentReja?.student?.levelName ||
    "";

  const normalized = String(levelName).trim();
  if (normalized.includes("1")) return "1";
  if (normalized.includes("2")) return "2";
  if (normalized.includes("3")) return "3";
  return "";
};

const StudentPlanTekshirish = () => {
  const [histories, setHistories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [checkerId, setCheckerId] = useState(null);

  // Filter
  const [filter, setFilter] = useState("all"); // all, 0, 1, 2
  const [courseFilter, setCourseFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Action modal
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState(null); // 1=accept, 2=reject
  const [modalItem, setModalItem] = useState(null);
  const [modalComment, setModalComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadChecker();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, courseFilter, histories]);

  const loadChecker = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user ID via decode
      const decodeRes = await ApiCall("/api/v1/auth/decode", "GET");
      if (decodeRes.error || !decodeRes.data?.id) {
        setError("Foydalanuvchi ma'lumotlari topilmadi");
        return;
      }

      const userId = decodeRes.data.id;
      setCheckerId(userId);

      // Load RejaHistory by checker (for StudentRejaChecking)
      await loadHistories(userId);
    } catch (err) {
      console.error("Error loading checker:", err);
      setError("Ma'lumotlarni yuklashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const loadHistories = async (userId) => {
    try {
      // Small delay to ensure DB write is complete
      await new Promise(resolve => setTimeout(resolve, 200));

      // Get ALL RejaHistory (including completed decisions) to show full history
      const res = await ApiCall(`/api/v1/reja-history/by-checker/${userId}`, "GET");
      if (!res.error && res.data) {
        const list = Array.isArray(res.data) ? res.data : [];

        // Filter only histories with studentRejaChecking (new system)
        const studentPlanHistories = list.filter(item => item.studentRejaChecking != null);
        console.log(studentPlanHistories)
        // Ensure React sees the change by creating completely new object references
        const refreshedList = studentPlanHistories.map(item => ({
          ...item,
          studentRejaChecking: item.studentRejaChecking ? { ...item.studentRejaChecking } : null
        }));

        // Sort by date: newest first (descending)
        const sorted = refreshedList.sort((a, b) => {
          const dateA = new Date(a.createdAt || a.date || 0);
          const dateB = new Date(b.createdAt || b.date || 0);
          return dateB - dateA; // Newest first
        });

        setHistories(sorted);
        console.log("✓ Student plan histories loaded, total count:", sorted.length);
      } else {
        setHistories([]);
      }
    } catch (err) {
      console.error("Error loading histories:", err);
      setHistories([]);
    }
  };

  // Download file with auth
  const handleDownload = async (fileId, name) => {
    try {
      if (!fileId) return alert("❌ Fayl topilmadi");

      const token = localStorage.getItem("access_token");
      const res = await fetch(`${baseUrl}/api/v1/file/getFile/${fileId}`, {
        headers: { Authorization: token },
      });

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = (name || "fayl") + ".pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Yuklab bo'lmadi");
    }
  };

  // Open action modal
  const openActionModal = (item, action) => {
    setModalItem(item);
    setModalAction(action);
    setModalComment("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalItem(null);
    setModalAction(null);
    setModalComment("");
  };

  // Submit accept/reject
  const handleSubmitAction = async () => {
    if (!modalItem || !modalAction) return;

    try {
      setSubmitting(true);

      // Convert modalAction to backend status: 2->1 (accept), 3->2 (reject)
      const backendStatus = modalAction === 2 ? 1 : 2;

      const res = await ApiCall(`/api/v1/reja-history/${modalItem.id}`, "PUT", {
        status: backendStatus,
        comment: modalComment,
      });

      if (!res.error) {
        // Close modal first
        closeModal();
        // Reload histories to get updated StudentRejaChecking status and next checker
        if (checkerId) {
          console.log("✓ Action successful, reloading histories...");
          await loadHistories(checkerId);
          // Force reset filter to show all updated data
          setFilter("all");
        }
      } else {
        const msg = typeof res.data === "string" ? res.data : "Xatolik yuz berdi!";
        alert(msg);
      }
    } catch (err) {
      console.error("Error submitting action:", err);
      alert("Xatolik yuz berdi!");
    } finally {
      setSubmitting(false);
    }
  };

  const courseFilteredHistories =
    courseFilter === "all"
      ? histories
      : histories.filter((item) => getCourseValue(item) === courseFilter);

  // Filter histories by RejaHistory.status
  const filteredHistories =
    filter === "all"
      ? courseFilteredHistories
      : filter === "pending"
        ? courseFilteredHistories.filter((h) => h.status === 0)
        : courseFilteredHistories.filter((h) => h.status === parseInt(filter));

  const totalPages = Math.max(1, Math.ceil(filteredHistories.length / ITEMS_PER_PAGE));
  const paginatedHistories = filteredHistories.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Stats by RejaHistory.status
  const total = courseFilteredHistories.length;
  const pending = courseFilteredHistories.filter((h) => h.status === 0).length;
  const accepted = courseFilteredHistories.filter((h) => h.status === 1).length;
  const rejected = courseFilteredHistories.filter((h) => h.status === 2).length;

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
          <p className="mt-4 text-gray-600">Ma'lumotlar yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <MdAssignmentTurnedIn className="mx-auto h-16 w-16 text-gray-300" />
          <h2 className="mt-4 text-xl font-semibold text-gray-700">{error}</h2>
          <button
            onClick={loadChecker}
            className="mt-4 rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
          >
            Qayta urinish
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 overflow-hidden rounded-2xl bg-white shadow-lg">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-6 sm:px-10">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/20">
                <MdAssignmentTurnedIn className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Shaxsiy reja tekshirish</h1>
                <p className="mt-1 text-blue-200">
                  Sizga tayinlangan shaxsiy rejalarni ko'rib chiqing va tasdiqlang yoki rad eting
                </p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 border-b border-gray-100 px-6 py-4 sm:grid-cols-4 sm:px-10">
            <button
              onClick={() => setFilter("all")}
              className={`rounded-xl p-3 text-center transition ${filter === "all" ? "ring-2 ring-blue-400" : ""}`}
            >
              <p className="text-2xl font-bold text-blue-700">{total}</p>
              <p className="text-xs text-blue-600">Barchasi</p>
            </button>
            <button
              onClick={() => setFilter("pending")}
              className={`rounded-xl bg-blue-50 p-3 text-center transition ${filter === "pending" ? "ring-2 ring-blue-400" : ""}`}
            >
              <p className="text-2xl font-bold text-blue-700">{pending}</p>
              <p className="text-xs text-blue-600">Yuklangan / Kutilmoqda</p>
            </button>
            <button
              onClick={() => setFilter("1")}
              className={`rounded-xl bg-green-50 p-3 text-center transition ${filter === "1" ? "ring-2 ring-green-400" : ""}`}
            >
              <p className="text-2xl font-bold text-green-700">{accepted}</p>
              <p className="text-xs text-green-600">Tasdiqlangan</p>
            </button>
            <button
              onClick={() => setFilter("2")}
              className={`rounded-xl bg-red-50 p-3 text-center transition ${filter === "2" ? "ring-2 ring-red-400" : ""}`}
            >
              <p className="text-2xl font-bold text-red-700">{rejected}</p>
              <p className="text-xs text-red-600">Rad etilgan</p>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <h2 className="text-lg font-semibold text-gray-800">
                Rejalar ({filteredHistories.length})
              </h2>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <select
                  value={courseFilter}
                  onChange={(e) => setCourseFilter(e.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  <option value="all">Barcha kurslar</option>
                  <option value="1">1-kurs</option>
                  <option value="2">2-kurs</option>
                  <option value="3">3-kurs</option>
                </select>
                {filter !== "all" && (
                  <button
                    onClick={() => setFilter("all")}
                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                  >
                    <MdFilterList className="h-4 w-4" />
                    Filtrni tozalash
                  </button>
                )}
              </div>
            </div>
          </div>

          {filteredHistories.length === 0 ? (
            <div className="p-12 text-center">
              <MdAssignmentTurnedIn className="mx-auto h-16 w-16 text-gray-300" />
              <h3 className="mt-4 text-lg font-semibold text-gray-700">
                {filter !== "all" ? "Bu filtr bo'yicha rejalar topilmadi" : "Sizga tayinlangan rejalar yo'q"}
              </h3>
              <p className="mt-2 text-gray-500">
                Yangi rejalar tayinlanganda ular bu yerda ko'rinadi.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        T/R
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Reja nomi
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Talaba
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Kategoriya
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Holati
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Yuklangan fayl
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Izoh
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Sana
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Tekshirilgan sana
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Amallar
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {paginatedHistories.map((item, idx) => {
                      const checking = item.studentRejaChecking;
                      const plan = checking?.studentReja;
                      const student = plan?.student;
                      const fileId = item.file?.id || checking?.file?.id || null;
                      const rejaName = plan?.name || "—";
                      const categoryLabel = CATEGORY_OPTIONS.find(c => c.value === plan?.category)?.label || "—";

                      return (
                        <tr key={item.id} className="transition hover:bg-gray-50">
                          <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                            {(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                            {rejaName}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
                                <MdPerson className="h-4 w-4" />
                              </span>
                              <span>{getPersonName(student)}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center gap-1.5 text-gray-600">
                              <MdCategory className="h-4 w-4" />
                              <span className="text-xs">{categoryLabel}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {getStatusBadge(item.status)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-sm">
                            {fileId ? (
                              <button
                                onClick={() => handleDownload(fileId, rejaName)}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100"
                              >
                                <MdDownload className="h-4 w-4" />
                                Yuklab olish
                              </button>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="max-w-[200px] px-4 py-3 text-sm text-gray-600">
                            {item.comment ? (
                              <p className="truncate" title={item.comment}>
                                {item.comment}
                              </p>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                            {formatDate(item.createdAt || item.date)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                            {item.changedAt ? formatDate(item.changedAt) : "Tekshirilmagan"}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-sm">
                            {(item.status === 0) ? (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => openActionModal(item, 2)}
                                  className="inline-flex items-center gap-1 rounded-lg bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 transition-colors hover:bg-green-100"
                                >
                                  <MdCheck className="h-4 w-4" />
                                  Tasdiqlash
                                </button>
                                <button
                                  onClick={() => openActionModal(item, 3)}
                                  className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-100"
                                >
                                  <MdThumbDown className="h-4 w-4" />
                                  Rad etish
                                </button>
                              </div>
                            ) : item.status === 1 ? (
                              <span className="text-xs text-green-600 font-medium italic">
                                ✓ Tasdiqladi
                              </span>
                            ) : item.status === 2 ? (
                              <span className="text-xs text-red-600 font-medium italic">
                                ✗ Rad etdi
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400 italic">
                                Noma'lum holat
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {filteredHistories.length > ITEMS_PER_PAGE && (
                <div className="flex flex-col gap-3 border-t border-gray-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-gray-600">
                    Sahifa {currentPage} / {totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                      disabled={currentPage === 1}
                      className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Oldingi
                    </button>
                    <button
                      onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                      disabled={currentPage === totalPages}
                      className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Keyingi
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ===== Action Modal ===== */}
      {showModal && modalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={!submitting ? closeModal : undefined}
          />

          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            {/* Header */}
            <div className={`flex items-center justify-between border-b px-6 py-4 ${modalAction === 2 ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
              }`}>
              <div>
                <h3 className={`text-lg font-semibold ${modalAction === 2 ? "text-green-800" : "text-red-800"}`}>
                  {modalAction === 2 ? "Rejani tasdiqlash" : "Rejani rad etish"}
                </h3>
                <p className="mt-0.5 text-sm text-gray-600">
                  {modalItem.studentRejaChecking?.studentReja?.name || "Reja"}
                </p>
              </div>
              <button
                onClick={closeModal}
                disabled={submitting}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-white hover:text-gray-600 transition disabled:opacity-50"
              >
                <MdClose className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              {/* Info */}
              <div className="rounded-xl bg-gray-50 p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Talaba:</span>
                  <span className="font-medium text-gray-800">
                    {getPersonName(modalItem.studentRejaChecking?.studentReja?.student)}
                  </span>
                </div>
                {(modalItem.studentRejaChecking?.file?.id || modalItem.file?.id) && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Fayl:</span>
                    <button
                      onClick={() => handleDownload(
                        modalItem.studentRejaChecking?.file?.id || modalItem.file?.id,
                        modalItem.studentRejaChecking?.studentReja?.name || "fayl"
                      )}
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800"
                    >
                      <MdPictureAsPdf className="h-4 w-4 text-red-500" />
                      Yuklab olish
                    </button>
                  </div>
                )}
              </div>

              {/* Comment */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Izoh {modalAction === 3 && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  value={modalComment}
                  onChange={(e) => setModalComment(e.target.value)}
                  onKeyDown={(e) => {
                    // Press Enter to submit (Ctrl+Enter or Cmd+Enter)
                    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                      e.preventDefault();
                      if (!submitting && !(modalAction === 3 && !modalComment.trim())) {
                        handleSubmitAction();
                      }
                    }
                  }}
                  rows={3}
                  placeholder={
                    modalAction === 2
                      ? "Tasdiqlash bo'yicha izoh (ixtiyoriy)... [Ctrl+Enter]"
                      : "Rad etish sababini yozing... [Ctrl+Enter]"
                  }
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-700 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
              <button
                onClick={closeModal}
                disabled={submitting}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleSubmitAction}
                disabled={submitting || (modalAction === 3 && !modalComment.trim())}
                className={`inline-flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${modalAction === 2
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                  }`}
              >
                {submitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                    Jarayonda...
                  </>
                ) : modalAction === 2 ? (
                  <>
                    <MdCheck className="h-4 w-4" />
                    Tasdiqlash
                  </>
                ) : (
                  <>
                    <MdThumbDown className="h-4 w-4" />
                    Rad etish
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentPlanTekshirish;
