import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ApiCall, { baseUrl } from "../../../config/index";
import {
    MdAssignment,
    MdCalendarToday,
    MdDownload,
    MdClose,
    MdHistory,
    MdInfo,
    MdPictureAsPdf,
} from "react-icons/md";

const StudentMonthDetails = () => {
    const { studentId, monthId } = useParams();
    const navigate = useNavigate();

    // State
    const [studentData, setStudentData] = useState(null);
    const [monthData, setMonthData] = useState(null);
    const [checkings, setCheckings] = useState([]);
    const [loading, setLoading] = useState(false);

    // History modal state
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [historyData, setHistoryData] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [selectedCheckingId, setSelectedCheckingId] = useState(null);
    const [historyRejaName, setHistoryRejaName] = useState("");

    // Statistics
    const [total, setTotal] = useState(0);
    const [pending, setPending] = useState(0);
    const [approved, setApproved] = useState(0);
    const [rejected, setRejected] = useState(0);

    // Fetch data on mount
    useEffect(() => {
        if (studentId && monthId) {
            loadData();
        }
    }, [studentId, monthId]);

    const loadData = async () => {
        try {
            setLoading(true);

            console.log("studentId:", studentId, "monthId:", monthId);

            // Use new endpoint for student plan checking history
            const historyResult = await ApiCall(
                `/api/v1/reja-history/by-student/${studentId}`,
                "GET"
            );

            if (!historyResult.error && historyResult.data) {
                const histories = Array.isArray(historyResult.data) ? historyResult.data : [];

                // Get student data from first item (check both old and new system)
                const firstItem = histories[0];
                if (firstItem?.studentRejaChecking?.studentReja?.student) {
                    setStudentData(firstItem.studentRejaChecking.studentReja.student);
                } else if (firstItem?.rejaChecking?.student) {
                    setStudentData(firstItem.rejaChecking.student);
                }

                // Filter by monthId - check both old and new system
                const monthHistories = histories.filter(
                    (h) => {
                        const oldSystemMonthId = h.rejaChecking?.reja?.month?.id;
                        const newSystemMonthId = h.studentRejaChecking?.studentReja?.month?.id;
                        return String(oldSystemMonthId) === String(monthId) ||
                               String(newSystemMonthId) === String(monthId);
                    }
                );

                // Find month name from either system
                const month = monthHistories[0]?.studentRejaChecking?.studentReja?.month ||
                             monthHistories[0]?.rejaChecking?.reja?.month;
                if (month) setMonthData(month);

                // Deduplicate by checking ID (support both systems)
                const checkingMap = {};
                monthHistories.forEach((h) => {
                    const rcId = h.studentRejaChecking?.id || h.rejaChecking?.id;
                    if (!rcId) return;
                    if (!checkingMap[rcId]) {
                        const checking = h.studentRejaChecking || h.rejaChecking;
                        checkingMap[rcId] = {
                            ...checking,
                            studentReja: h.studentRejaChecking?.studentReja,
                            reja: h.rejaChecking?.reja,
                            isNewSystem: !!h.studentRejaChecking,
                            histories: [],
                        };
                    }
                    checkingMap[rcId].histories.push(h);
                });

                const monthCheckings = Object.values(checkingMap);

                // Enrich with currentChecker from histories
                const enriched = monthCheckings.map((checking) => {
                    const enrichedData = { ...checking };
                    const hs = checking.histories || [];

                    const currentHistory = hs.find((h) => h.status === 0);
                    if (currentHistory) {
                        enrichedData.currentChecker = currentHistory.checker;
                        enrichedData.currentCheckerComment = currentHistory.comment;
                    } else {
                        const decided = hs
                            .filter((h) => h.status === 1 || h.status === 2)
                            .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
                        if (decided.length > 0) {
                            enrichedData.currentChecker = decided[0].checker;
                            enrichedData.currentCheckerComment = decided[0].comment;
                            enrichedData.completedAt = decided[0].changedAt || decided[0].createdAt;
                        }
                    }
                    return enrichedData;
                });

                setCheckings(enriched);
                setTotal(enriched.length);
                setPending(enriched.filter((c) => c.status === 0).length);
                setApproved(enriched.filter((c) => c.status === 1).length);
                setRejected(enriched.filter((c) => c.status === 2).length);
            }

        } catch (error) {
            console.error("Ma'lumotlarni yuklashda xatolik:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (fileId, rejaName) => {
        try {
            if (!fileId) return;

            const token = localStorage.getItem("authToken") || localStorage.getItem("access_token");
            const res = await fetch(`${baseUrl}/api/v1/file/getFile/${fileId}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (!res.ok) throw new Error("File download failed");

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${rejaName || "file"}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Faylni yuklashda xatolik:", error);
            alert("Faylni yuklashda xatolik yuz berdi");
        }
    };

    // Open history modal
    const openHistory = async (checkingId, rejaName, isNewSystem) => {
        try {
            setSelectedCheckingId(checkingId);
            setHistoryRejaName(rejaName);
            setShowHistoryModal(true);
            setHistoryLoading(true);
            setHistoryData([]);

            // Fetch history for this checking - use appropriate endpoint
            const endpoint = isNewSystem
                ? `/api/v1/reja-history/by-student-checking/${checkingId}`
                : `/api/v1/reja-history/by-reja-checking/${checkingId}`;

            const result = await ApiCall(endpoint, "GET");
            if (!result.error && result.data) {
                const histories = Array.isArray(result.data) ? result.data : [];
                histories.sort(
                    (a, b) =>
                        new Date(b.createdAt || b.date || 0) -
                        new Date(a.createdAt || a.date || 0)
                );
                setHistoryData(histories);
            }
        } catch (error) {
            console.error("Tarixni yuklashda xatolik:", error);
        } finally {
            setHistoryLoading(false);
        }
    };

    const closeHistoryModal = () => {
        setShowHistoryModal(false);
        setHistoryData([]);
        setSelectedCheckingId(null);
        setHistoryRejaName("");
    };

    // Get status badge
    const getCheckingStatusBadge = (status) => {
        if (status === 0) {
            return (
                <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                    Tekshirilmoqda
                </span>
            );
        } else if (status === 1) {
            return (
                <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                    Tasdiqlangan
                </span>
            );
        } else if (status === 2) {
            return (
                <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-800">
                    Rad etilgan
                </span>
            );
        }
        return (
            <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-800">
                Noma'lum
            </span>
        );
    };

    // Get history status badge
    const getHistoryStatusBadge = (status) => {
        if (status === 0) {
            return (
                <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                    Tekshirilmoqda
                </span>
            );
        } else if (status === 1) {
            return (
                <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                    Tasdiqlandi
                </span>
            );
        } else if (status === 2) {
            return (
                <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
                    Rad etildi
                </span>
            );
        }
        return (
            <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800">
                Noma'lum
            </span>
        );
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return "—";
        try {
            return new Date(dateString).toLocaleDateString("uz-UZ", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
            });
        } catch {
            return "—";
        }
    };

    // Get reja name from checking object
    const getRejaName = (checking) => {
        if (checking.studentReja?.name) return checking.studentReja.name;
        if (checking.reja?.name) return checking.reja.name;
        if (checking.rejaName) return checking.rejaName;
        return "Noma'lum reja";
    };

    // Get month name
    const getMonthName = (checking) => {
        if (checking.studentReja?.month?.name) return checking.studentReja.month.name;
        if (checking.reja?.month?.name) return checking.reja.month.name;
        if (monthData?.name) return monthData.name;
        return "Noma'lum oy";
    };

    if (loading) {
        return (
            <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
                <div className="text-center">
                    <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
                    <p className="mt-4 text-gray-600">Ma'lumotlar yuklanyapti...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl">
                {/* Back Button */}
                <div className="mb-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-900 transition font-medium"
                    >
                        ← Ortga qaytish
                    </button>
                </div>

                {/* Header */}
                <div className="mb-8 overflow-hidden rounded-2xl bg-white shadow-lg">
                    <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-6 sm:px-10">
                        <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/20">
                                <MdAssignment className="h-8 w-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">
                                    {studentData?.fullName || "O'quvchi"} - {monthData?.name || "Oy"}
                                </h1>
                                <p className="mt-1 text-emerald-200">
                                    {monthData?.name ? `${monthData.name} oy uchun barcha rejalar va ularning statistikasi` : "Ushbu oy uchun barcha rejalar va ularning statistikasi"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Statistics Cards */}
                    <div className="grid grid-cols-2 gap-4 border-b border-gray-100 px-6 py-4 sm:grid-cols-4 sm:px-10">
                        <div className="rounded-xl bg-blue-50 p-3 text-center">
                            <p className="text-2xl font-bold text-blue-700">{total}</p>
                            <p className="text-xs text-blue-600">Jami rejalar</p>
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

                {/* Checking Table */}
                <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
                    <div className="border-b border-gray-200 px-6 py-4">
                        <h2 className="text-lg font-semibold text-gray-800">
                            Rejalar ({checkings.length})
                        </h2>
                    </div>

                    {checkings.length === 0 ? (
                        <div className="p-12 text-center">
                            <MdAssignment className="mx-auto h-16 w-16 text-gray-300" />
                            <h3 className="mt-4 text-lg font-semibold text-gray-700">
                                Bu oy uchun rejalar topilmadi
                            </h3>
                        </div>
                    ) : (
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
                                            Holati
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                            Tekshiruvchi
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                            Izoh
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                            Tekshiruvchi izohi
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                            Yuklangan fayl
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                            Sana
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                            Tarix
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {checkings.map((checking, idx) => {
                                        const rejaName = getRejaName(checking);
                                        const monthName = getMonthName(checking);

                                        return (
                                            <tr
                                                key={checking.id}
                                                className="transition hover:bg-gray-50"
                                            >
                                                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                                                    {idx + 1}
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                                                    {rejaName}
                                                </td>
                                                <td className="px-4 py-3 text-sm">
                                                    {getCheckingStatusBadge(checking.status)}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-600">
                                                    {checking.currentChecker ? (
                                                        <div className="flex items-center gap-2">
                                                            <span className="inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-semibold text-white">
                                                                {(
                                                                    checking.currentChecker.firstName?.[0] ||
                                                                    checking.currentChecker.name?.[0] ||
                                                                    "T"
                                                                ).toUpperCase()}
                                                            </span>
                                                            <span className="text-gray-700">
                                                                {checking.currentChecker.name
                                                                    ? checking.currentChecker.name
                                                                    : checking.currentChecker.firstName ||
                                                                        checking.currentChecker.lastName
                                                                        ? `${checking.currentChecker.firstName || ""
                                                                            } ${checking.currentChecker.lastName || ""
                                                                            }`.trim()
                                                                        : checking.currentChecker.phone || "—"}
                                                            </span>
                                                        </div>
                                                    ) : checking.checker ? (
                                                        <div className="flex items-center gap-2">
                                                            <span className="inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-semibold text-white">
                                                                {(
                                                                    checking.checker.firstName?.[0] ||
                                                                    checking.checker.name?.[0] ||
                                                                    "T"
                                                                ).toUpperCase()}
                                                            </span>
                                                            <span className="text-gray-700">
                                                                {checking.checker.name
                                                                    ? checking.checker.name
                                                                    : checking.checker.firstName ||
                                                                        checking.checker.lastName
                                                                        ? `${checking.checker.firstName || ""
                                                                            } ${checking.checker.lastName || ""}`.trim()
                                                                        : checking.checker.phone || "—"}
                                                            </span>
                                                        </div>
                                                    ) : checking.checkerName ? (
                                                        <span className="text-gray-700">
                                                            {checking.checkerName}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400">—</span>
                                                    )}
                                                </td>
                                                <td className="max-w-[180px] px-4 py-3 text-sm text-gray-600">
                                                    {checking.descStudent ? (
                                                        <p
                                                            className="truncate"
                                                            title={checking.descStudent}
                                                        >
                                                            {checking.descStudent}
                                                        </p>
                                                    ) : (
                                                        <span className="text-gray-400">—</span>
                                                    )}
                                                </td>
                                                <td className="max-w-[180px] px-4 py-3 text-sm">
                                                    {checking.currentCheckerComment ? (
                                                        <p
                                                            className={`truncate ${checking.status === 2
                                                                ? "text-red-600 italic"
                                                                : "text-gray-600"
                                                                }`}
                                                            title={checking.currentCheckerComment}
                                                        >
                                                            {checking.currentCheckerComment}
                                                        </p>
                                                    ) : checking.descChecker ? (
                                                        <p
                                                            className={`truncate ${checking.status === 2
                                                                ? "text-red-600 italic"
                                                                : "text-gray-600"
                                                                }`}
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
                                                            onClick={() =>
                                                                handleDownload(checking.file.id, rejaName)
                                                            }
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
                                                    {checking.status === 1 || checking.status === 2
                                                        ? formatDate(
                                                            checking.completedAt ||
                                                            checking.createdAt ||
                                                            checking.updatedAt
                                                        )
                                                        : formatDate(
                                                            checking.createdAt || checking.updatedAt
                                                        )}
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3 text-sm">
                                                    <button
                                                        onClick={() =>
                                                            openHistory(checking.id, rejaName, checking.isNewSystem)
                                                        }
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
                                        <p className="mt-3 text-sm text-gray-500">
                                            Tarix yuklanmoqda...
                                        </p>
                                    </div>
                                </div>
                            ) : historyData.length === 0 ? (
                                <div className="py-12 text-center">
                                    <MdInfo className="mx-auto h-12 w-12 text-gray-300" />
                                    <p className="mt-3 text-gray-500">
                                        Bu reja uchun tarix mavjud emas.
                                    </p>
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
                                                <div
                                                    key={history.id || idx}
                                                    className="relative pl-10"
                                                >
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

                                                    <div
                                                        className={`rounded-xl border-2 p-4 ${history.status === 0
                                                            ? "border-blue-200 bg-blue-50"
                                                            : history.status === 1
                                                                ? "border-green-200 bg-green-50"
                                                                : "border-red-200 bg-red-50"
                                                            }`}
                                                    >
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div className="flex items-center gap-2">
                                                                {getHistoryStatusBadge(history.status)}
                                                                {actionText && (
                                                                    <span
                                                                        className={`text-xs font-medium ${history.status === 0
                                                                            ? "text-blue-700"
                                                                            : history.status === 1
                                                                                ? "text-green-700"
                                                                                : "text-red-700"
                                                                            }`}
                                                                    >
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <span className="text-xs text-gray-500">
                                                                {formatDate(
                                                                    history.createdAt || history.date
                                                                )}
                                                            </span>
                                                        </div>

                                                        {/* Checker info */}
                                                        {(history.checkerName ||
                                                            history.checker?.name ||
                                                            history.checker?.firstName) && (
                                                                <div className="mt-3 flex items-center gap-2 pb-2 border-b border-gray-200">
                                                                    <span className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
                                                                        {(
                                                                            history.checker?.firstName?.[0] ||
                                                                            history.checkerName?.[0] ||
                                                                            "T"
                                                                        ).toUpperCase()}
                                                                    </span>
                                                                    <span className="text-sm font-medium text-gray-800">
                                                                        {history.checkerName ||
                                                                            history.checker?.name ||
                                                                            `${history.checker?.firstName || ""} ${history.checker?.lastName || ""
                                                                                }`.trim()}
                                                                    </span>
                                                                </div>
                                                            )}

                                                        {/* Student comment */}
                                                        {history.descStudent && (
                                                            <p className="text-sm text-gray-700 mt-2">
                                                                <span className="font-medium">
                                                                    Student izohi:{" "}
                                                                </span>
                                                                <span className="text-gray-600">
                                                                    {history.descStudent}
                                                                </span>
                                                            </p>
                                                        )}

                                                        {/* Checker comment/decision reason */}
                                                        {(history.comment || history.descChecker) && (
                                                            <p
                                                                className={`text-sm mt-2 ${history.status === 2
                                                                    ? "text-red-700"
                                                                    : "text-gray-700"
                                                                    }`}
                                                            >
                                                                <span className="font-medium">
                                                                    {history.status === 2
                                                                        ? "Rad etish sababi: "
                                                                        : "Izoh: "}
                                                                </span>
                                                                <span
                                                                    className={
                                                                        history.status === 2
                                                                            ? "text-red-600 italic"
                                                                            : "text-gray-600"
                                                                    }
                                                                >
                                                                    {history.comment || history.descChecker}
                                                                </span>
                                                            </p>
                                                        )}

                                                        {/* File */}
                                                        {history.file?.id && (
                                                            <button
                                                                onClick={() =>
                                                                    handleDownload(
                                                                        history.file.id,
                                                                        `${historyRejaName}-tarix-${idx + 1}`
                                                                    )
                                                                }
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

export default StudentMonthDetails;
