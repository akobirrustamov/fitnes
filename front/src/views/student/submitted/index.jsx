import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ApiCall, { baseUrl } from "../../../config/index";
import {
  MdCheckCircle,
  MdHourglassEmpty,
  MdPlayCircle,
  MdCancel,
  MdDownload,
  MdHistory,
  MdAssignment,
  MdClose,
  MdCalendarToday,
  MdPictureAsPdf,
  MdInfo,
} from "react-icons/md";

// RejaChecking status badge
const getCheckingStatusBadge = (status) => {
  const map = {
    0: { label: "Reja yuklandi", cls: "bg-blue-100 text-blue-800", icon: <MdPlayCircle className="mr-1 h-4 w-4" /> },
    1: { label: "Tasdiqlandi", cls: "bg-green-100 text-green-800", icon: <MdCheckCircle className="mr-1 h-4 w-4" /> },
    2: { label: "Rad etildi", cls: "bg-red-100 text-red-800", icon: <MdCancel className="mr-1 h-4 w-4" /> },
  };
  const info = map[status] || { label: "Noma'lum", cls: "bg-gray-50 text-gray-500", icon: null };
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${info.cls}`}>
      {info.icon}
      {info.label}
    </span>
  );
};

// RejaHistory status badge (0=pending, 1=accepted, 2=rejected)
const getHistoryStatusBadge = (status) => {
  const map = {
    0: { label: "Tekshirilmoqda", cls: "bg-blue-100 text-blue-800", icon: <MdHourglassEmpty className="mr-1 h-4 w-4" /> },
    1: { label: "Tasdiqlandi", cls: "bg-green-100 text-green-800", icon: <MdCheckCircle className="mr-1 h-4 w-4" /> },
    2: { label: "Rad etildi", cls: "bg-red-100 text-red-800", icon: <MdCancel className="mr-1 h-4 w-4" /> },
  };
  const info = map[status] || { label: "Noma'lum", cls: "bg-gray-50 text-gray-500", icon: null };
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

const StudentSubmitted = () => {
  const navigate = useNavigate();
  const [checkings, setCheckings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // History modal
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [historyRejaName, setHistoryRejaName] = useState("");


  useEffect(() => {
    loadCheckings();
  }, []);

  const loadCheckings = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await ApiCall("/api/v1/student-plan-checking/my", "GET");

      if (res.error) {
        // Try alternative endpoint
        const res2 = await ApiCall("/api/v1/student-plan-checking/by-student", "GET");
        if (res2.error) {
          setError("Ma'lumotlarni yuklashda xatolik yuz berdi");
          return;
        }
        const list = Array.isArray(res2.data) ? res2.data : [];
        await enrichCheckingsWithHistory(list);
        return;
      }

      const list = Array.isArray(res.data) ? res.data : [];
      await enrichCheckingsWithHistory(list);
    } catch (err) {
      console.error("Error loading checkings:", err);
      setError("Ma'lumotlarni yuklashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  // Load history for each checking and add current checker info
  const enrichCheckingsWithHistory = async (checkingsList) => {
    const enriched = await Promise.all(
      checkingsList.map(async (checking) => {
        try {
          const url = `/api/v1/reja-history/by-student-checking/${checking.id}`;

          const historyRes = await ApiCall(url, "GET");

          if (!historyRes.error && historyRes.data) {
            const histories = Array.isArray(historyRes.data) ? historyRes.data : [];

            const enrichedData = { ...checking };

            // Find current active checker (status=0 pending)
            const currentHistory = histories.find(h => h.status === 0);
            if (currentHistory) {
              enrichedData.currentChecker = currentHistory.checker;
              enrichedData.currentCheckerComment = currentHistory.comment;
            } else {
              // If no active, find last decided (status=1 accepted or status=2 rejected)
              const decidedHistories = histories.filter(h => h.status === 1 || h.status === 2);
              if (decidedHistories.length > 0) {
                // Sort by date and get the most recent
                const lastDecided = decidedHistories.sort((a, b) => {
                  const dateA = new Date(a.createdAt || a.date || 0);
                  const dateB = new Date(b.createdAt || b.date || 0);
                  return dateB - dateA;
                })[0];

                enrichedData.currentChecker = lastDecided.checker;
                enrichedData.currentCheckerComment = lastDecided.comment;
                enrichedData.completedAt = lastDecided.changedAt || lastDecided.createdAt;
              }
            }

            return enrichedData;
          }
        } catch (err) {
        }

        return checking;
      })
    );

    setCheckings(enriched);
  };

  // Load history for a StudentRejaChecking
  const openHistory = async (checkingId, rejaName) => {
    setHistoryRejaName(rejaName || "Reja");
    setShowHistoryModal(true);
    setHistoryLoading(true);
    setHistoryData([]);

    try {
      const res = await ApiCall(`/api/v1/reja-history/by-student-checking/${checkingId}`, "GET");

      if (!res.error && res.data) {
        const list = Array.isArray(res.data) ? res.data : [res.data];
        // Sort by date: newest first (descending)
        const sorted = list.sort((a, b) => {
          const dateA = new Date(a.createdAt || a.date || 0);
          const dateB = new Date(b.createdAt || b.date || 0);
          return dateB - dateA; // Newest first
        });
        setHistoryData(sorted);
      }
    } catch (err) {
    } finally {
      setHistoryLoading(false);
    }
  };

  const closeHistoryModal = () => {
    setShowHistoryModal(false);
    setHistoryData([]);
    setHistoryRejaName("");
  };

  // Download file with auth
  const handleDownload = async (file, name) => {
    try {
      if (!file) return alert("❌ Fayl topilmadi");

      const token = localStorage.getItem("authToken");
      const res = await fetch(`${baseUrl}/api/v1/file/getFile/${file}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name + ".pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Yuklab bo'lmadi");
    }
  };

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
          <MdAssignment className="mx-auto h-16 w-16 text-gray-300" />
          <h2 className="mt-4 text-xl font-semibold text-gray-700">{error}</h2>
          <button
            onClick={loadCheckings}
            className="mt-4 rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
          >
            Qayta urinish
          </button>
        </div>
      </div>
    );
  }

  // Statistics
  const total = checkings.length;
  const pending = checkings.filter((c) => c.status === 0).length;
  const approved = checkings.filter((c) => c.status === 1).length;
  const rejected = checkings.filter((c) => c.status === 2).length;

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 overflow-hidden rounded-2xl bg-white shadow-lg">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-6 sm:px-10">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/20">
                <MdAssignment className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Yuklangan rejalar</h1>
                <p className="mt-1 text-emerald-200">
                  Barcha topshirilgan rejalar va ularning holati
                </p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 border-b border-gray-100 px-6 py-4 sm:grid-cols-4 sm:px-10">
            <div className="rounded-xl bg-blue-50 p-3 text-center">
              <p className="text-2xl font-bold text-blue-700">{total}</p>
              <p className="text-xs text-blue-600">Jami</p>
            </div>
            <div className="rounded-xl bg-yellow-50 p-3 text-center">
              <p className="text-2xl font-bold text-yellow-700">{pending}</p>
              <p className="text-xs text-yellow-600">Tekshirilmoqda</p>
            </div>
            <div className="rounded-xl bg-green-50 p-3 text-center">
              <p className="text-2xl font-bold text-green-700">{approved}</p>
              <p className="text-xs text-green-600">Tasdiqlangan</p>
            </div>
            <div className="rounded-xl bg-red-50 p-3 text-center">
              <p className="text-2xl font-bold text-red-700">{rejected}</p>
              <p className="text-xs text-red-600">Rad etilgan</p>
            </div>
          </div>
        </div>

        {/* Checkings List */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Topshirilgan rejalar ({checkings.length})
            </h2>
          </div>

          {checkings.length === 0 ? (
            <div className="p-12 text-center">
              <MdAssignment className="mx-auto h-16 w-16 text-gray-300" />
              <h3 className="mt-4 text-lg font-semibold text-gray-700">
                Hali topshirilgan rejalar yo'q
              </h3>
              <p className="mt-2 text-gray-500">
                Oylik rejalar bo'limida fayl yuklash orqali reja topshirishingiz mumkin.
              </p>
              <button
                onClick={() => navigate("/student/month")}
                className="mt-4 rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
              >
                Oylik rejalarga o'tish
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">T/R</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Reja nomi</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Oy</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Holati</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Tekshiruvchi</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Izoh</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Tekshiruvchi izohi</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Yuklangan fayl</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Sana</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Tarix</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {checkings.map((checking, idx) => {
                    const rejaName = checking.studentReja?.name || checking.rejaName || "—";
                    const monthName = checking.studentReja?.month?.name || checking.monthName || "—";

                    return (
                      <tr key={checking.id} className="transition hover:bg-gray-50">
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{idx + 1}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                          <button
                            onClick={() => navigate(`/student/student-plan/${checking.studentReja?.id || checking.studentRejaId}`)}
                            className="text-indigo-700 hover:text-indigo-900 hover:underline transition"
                          >
                            {rejaName}
                          </button>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                          <span className="inline-flex items-center gap-1">
                            <MdCalendarToday className="h-3.5 w-3.5 text-gray-400" />
                            {monthName}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {getCheckingStatusBadge(checking.status)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {checking.currentChecker ? (
                            <div className="flex items-center gap-2">
                              <span className="inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-semibold text-white">
                                {(checking.currentChecker.firstName?.[0] || checking.currentChecker.name?.[0] || "T").toUpperCase()}
                              </span>
                              <span className="text-gray-700">
                                {checking.currentChecker.name
                                  ? checking.currentChecker.name
                                  : checking.currentChecker.firstName || checking.currentChecker.lastName
                                    ? `${checking.currentChecker.firstName || ""} ${checking.currentChecker.lastName || ""}`.trim()
                                    : checking.currentChecker.phone || "—"}
                              </span>
                            </div>
                          ) : checking.checker ? (
                            <div className="flex items-center gap-2">
                              <span className="inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-semibold text-white">
                                {(checking.checker.firstName?.[0] || checking.checker.name?.[0] || "T").toUpperCase()}
                              </span>
                              <span className="text-gray-700">
                                {checking.checker.name
                                  ? checking.checker.name
                                  : checking.checker.firstName || checking.checker.lastName
                                    ? `${checking.checker.firstName || ""} ${checking.checker.lastName || ""}`.trim()
                                    : checking.checker.phone || "—"}
                              </span>
                            </div>
                          ) : checking.checkerName ? (
                            <span className="text-gray-700">{checking.checkerName}</span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="max-w-[180px] px-4 py-3 text-sm text-gray-600">
                          {checking.descStudent ? (
                            <p className="truncate" title={checking.descStudent}>
                              {checking.descStudent}
                            </p>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="max-w-[180px] px-4 py-3 text-sm">
                          {checking.currentCheckerComment ? (
                            <p
                              className={`truncate ${checking.status === 2 ? "text-red-600 italic" : "text-gray-600"}`}
                              title={checking.currentCheckerComment}
                            >
                              {checking.currentCheckerComment}
                            </p>
                          ) : checking.descChecker ? (
                            <p
                              className={`truncate ${checking.status === 2 ? "text-red-600 italic" : "text-gray-600"}`}
                              title={checking.descChecker}
                            >
                              {checking.descChecker}
                            </p>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm">
                          {checking.file?.id ? (
                            <button
                              onClick={() => handleDownload(checking.file.id, rejaName)}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100"
                            >
                              <MdDownload className="h-4 w-4" />
                              Yuklab olish
                            </button>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                          {checking.status === 1 || checking.status === 2 ? (
                            formatDate(checking.completedAt || checking.createdAt || checking.updatedAt)
                          ) : (
                            formatDate(checking.createdAt || checking.updatedAt)
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm">
                          <button
                            onClick={() => openHistory(checking.id, rejaName)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-purple-50 px-3 py-1.5 text-xs font-medium text-purple-700 transition-colors hover:bg-purple-100"
                          >
                            <MdHistory className="h-4 w-4" />
                            Tarix
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ===== History Modal ===== */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeHistoryModal}
          />

          {/* Modal */}
          <div className="relative w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <MdHistory className="h-5 w-5 text-purple-600" />
                  Reja tarixi
                </h3>
                <p className="mt-0.5 text-sm text-gray-500">{historyRejaName}</p>
              </div>
              <button
                onClick={closeHistoryModal}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
              >
                <MdClose className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {historyLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600"></div>
                    <p className="mt-3 text-sm text-gray-500">Tarix yuklanmoqda...</p>
                  </div>
                </div>
              ) : historyData.length === 0 ? (
                <div className="py-12 text-center">
                  <MdInfo className="mx-auto h-12 w-12 text-gray-300" />
                  <p className="mt-3 text-gray-500">Bu reja uchun tarix mavjud emas.</p>
                </div>
              ) : (
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

                  <div className="space-y-6">
                    {historyData.map((history, idx) => {
                      // Determine action description
                      let actionText = "";
                      if (history.status === 0) {
                        actionText = "Tekshirilmoqda";
                      } else if (history.status === 1) {
                        actionText = "Tasdiqlandi";
                      } else if (history.status === 2) {
                        actionText = "Rad etildi";
                      }

                      return (
                        <div key={history.id || idx} className="relative pl-10">
                          {/* Timeline dot */}
                          <div
                            className={`absolute left-2.5 top-1 h-3 w-3 rounded-full border-2 border-white shadow ${history.status === 0
                                ? "bg-blue-500"
                                : history.status === 1
                                  ? "bg-green-500"
                                  : history.status === 2
                                    ? "bg-red-500"
                                    : "bg-gray-400"
                              }`}
                          />

                          <div className={`rounded-xl border-2 p-4 ${history.status === 0
                              ? "border-blue-200 bg-blue-50"
                              : history.status === 1
                                ? "border-green-200 bg-green-50"
                                : "border-red-200 bg-red-50"
                            }`}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {getHistoryStatusBadge(history.status)}
                                {actionText && (
                                  <span className={`text-xs font-medium ${history.status === 0
                                      ? "text-blue-700"
                                      : history.status === 1
                                        ? "text-green-700"
                                        : "text-red-700"
                                    }`}>
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-gray-500">
                                {formatDate(history.createdAt || history.date)}
                              </span>
                            </div>

                            {/* Checker info */}
                            {(history.checkerName || history.checker?.name || history.checker?.firstName) && (
                              <div className="mt-3 flex items-center gap-2 pb-2 border-b border-gray-200">
                                <span className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
                                  {(history.checker?.firstName?.[0] || history.checkerName?.[0] || "T").toUpperCase()}
                                </span>
                                <span className="text-sm font-medium text-gray-800">
                                  {history.checkerName ||
                                    history.checker?.name ||
                                    `${history.checker?.firstName || ""} ${history.checker?.lastName || ""}`.trim()}
                                </span>
                              </div>
                            )}

                            {/* Student comment */}
                            {history.descStudent && (
                              <p className="text-sm text-gray-700 mt-2">
                                <span className="font-medium">Student izohi: </span>
                                <span className="text-gray-600">{history.descStudent}</span>
                              </p>
                            )}

                            {/* Checker comment/decision reason */}
                            {(history.comment || history.descChecker) && (
                              <p className={`text-sm mt-2 ${history.status === 2 ? "text-red-700" : "text-gray-700"}`}>
                                <span className="font-medium">
                                  {history.status === 2 ? "Rad etish sababi: " : "Izoh: "}
                                </span>
                                <span className={history.status === 2 ? "text-red-600 italic" : "text-gray-600"}>
                                  {history.comment || history.descChecker}
                                </span>
                              </p>
                            )}

                            {/* File */}
                            {history.file?.id && (
                              <button
                                onClick={() => handleDownload(history.file.id, `${historyRejaName}-tarix-${idx + 1}`)}
                                className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-medium shadow-sm border border-gray-200 text-gray-700 transition-colors hover:bg-gray-50"
                              >
                                <MdPictureAsPdf className="h-4 w-4 text-red-500" />
                                Faylni yuklab olish
                              </button>
                            )}

                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end border-t border-gray-200 px-6 py-4">
              <button
                onClick={closeHistoryModal}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentSubmitted;

