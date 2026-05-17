import { useEffect, useState } from "react";
import ApiCall, { baseUrl } from "../../../config/index";
import Chart from "react-apexcharts";
import {
  MdPeople,
  MdGroup,
  MdSchool,
  MdCalendarToday,
  MdAssignment,
  MdFactCheck,
  MdHistory,
  MdCategory,
  MdAttachFile,
  MdTrendingUp,
  MdCheckCircle,
  MdHourglassEmpty,
  MdCancel,
  MdPlayCircle,
  MdRefresh,
  MdDownload,
  MdSearch,
} from "react-icons/md";

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ── Excel ──
  const [studentSearch, setStudentSearch] = useState("");
  const [studentList, setStudentList] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    loadDashboard();
    loadStudents();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await ApiCall("/api/v1/statistics/dashboard", "GET");
      if (!res.error && res.data) {
        setData(res.data);
      } else {
        setError("Statistika ma'lumotlarini yuklashda xatolik yuz berdi");
      }
    } catch (err) {
      console.error("Error loading dashboard:", err);
      setError("Statistika ma'lumotlarini yuklashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async () => {
    try {
      setSearchLoading(true);
      const res = await ApiCall("/api/v1/student", "GET");
      if (!res.error && res.data) {
        const list = Array.isArray(res.data)
          ? res.data
          : res.data.content || res.data.data || [];
        setStudentList(list);
      }
    } catch (err) {
      console.error("Students load error:", err);
    } finally {
      setSearchLoading(false);
    }
  };

  // ── Excel yuklab olish ──
  const downloadExcel = async (studentId, fullName) => {
    try {
      setDownloadingId(studentId);

      const token =
        localStorage.getItem("access_token") ||
        localStorage.getItem("token") ||
        sessionStorage.getItem("access_token") ||
        sessionStorage.getItem("token") ||
        "";

      // baseUrl — config/index dan import qilingan
      const url = `${baseUrl}/api/v1/excel/report/${studentId}`;

      const response = await fetch(url, {
        method: "GET",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `HTTP ${response.status}`);
      }

      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `${fullName || "doktorant"}_reja_2026.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(objectUrl);
    } catch (err) {
      console.error("Excel download error:", err);
      alert("Excel yuklab olishda xatolik: " + err.message);
    } finally {
      setDownloadingId(null);
    }
  };

  // ── Qidiruv filtri ──
  const filteredStudents = studentList.filter((s) => {
    const q = studentSearch.toLowerCase();
    return (
      !q ||
      (s.fullName || "").toLowerCase().includes(q) ||
      (s.studentIdNumber || "").toLowerCase().includes(q) ||
      (s.direction || "").toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
          <p className="mt-4 text-gray-600">Statistika yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <MdTrendingUp className="mx-auto h-16 w-16 text-gray-300" />
          <h2 className="mt-4 text-xl font-semibold text-gray-700">{error}</h2>
          <button
            onClick={loadDashboard}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
          >
            <MdRefresh className="h-5 w-5" />
            Qayta urinish
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { counts, students, months, rejaChecking, rejaHistory, levels } = data;

  // ========================
  // COUNT CARDS
  // ========================
  const countCards = [
    {
      label: "Doktorantlar",
      value: counts?.totalStudents || 0,
      icon: MdSchool,
      color: "from-blue-500 to-blue-600",
    },
    {
      label: "Xodimlar",
      value: counts?.totalUsers || 0,
      icon: MdGroup,
      color: "from-indigo-500 to-indigo-600",
    },
    {
      label: "Darajalar",
      value: counts?.totalLevels || 0,
      icon: MdCategory,
      color: "from-purple-500 to-purple-600",
    },
    {
      label: "Oylar",
      value: counts?.totalMonths || 0,
      icon: MdCalendarToday,
      color: "from-cyan-500 to-cyan-600",
    },
    {
      label: "Rejalar",
      value: counts?.totalReja || 0,
      icon: MdAssignment,
      color: "from-emerald-500 to-emerald-600",
    },
    {
      label: "Reja tekshiruv",
      value: counts?.totalRejaChecking || 0,
      icon: MdFactCheck,
      color: "from-amber-500 to-amber-600",
    },
    {
      label: "Reja tarix",
      value: counts?.totalRejaHistory || 0,
      icon: MdHistory,
      color: "from-rose-500 to-rose-600",
    },
    {
      label: "Fayllar",
      value: counts?.totalAttachments || 0,
      icon: MdAttachFile,
      color: "from-teal-500 to-teal-600",
    },
  ];

  // ========================
  // STUDENT CHARTS
  // ========================
  const studentStatusLabels = {
    active: "Faol",
    inactive: "Nofaol",
    graduated: "Bitirgan",
    expelled: "Chetlatilgan",
  };
  const studentStatusColors = ["#3b82f6", "#94a3b8", "#22c55e", "#ef4444"];
  const studentStatusEntries = students?.byStatus
    ? Object.entries(students.byStatus)
    : [];

  const studentStatusChart = {
    options: {
      chart: { type: "donut" },
      labels: studentStatusEntries.map(([k]) => studentStatusLabels[k] || k),
      colors: studentStatusColors.slice(0, studentStatusEntries.length),
      legend: { position: "bottom", fontSize: "13px" },
      plotOptions: {
        pie: {
          donut: {
            size: "65%",
            labels: {
              show: true,
              total: {
                show: true,
                label: "Jami",
                fontSize: "14px",
                fontWeight: 600,
              },
            },
          },
        },
      },
      dataLabels: { enabled: true, formatter: (val) => val.toFixed(0) + "%" },
    },
    series: studentStatusEntries.map(([, v]) => v),
  };

  const studentGenderLabels = { male: "Erkak", female: "Ayol" };
  const studentGenderEntries = students?.byGender
    ? Object.entries(students.byGender)
    : [];

  const studentGenderChart = {
    options: {
      chart: { type: "pie" },
      labels: studentGenderEntries.map(([k]) => studentGenderLabels[k] || k),
      colors: ["#6366f1", "#ec4899"],
      legend: { position: "bottom", fontSize: "13px" },
      dataLabels: { enabled: true, formatter: (val) => val.toFixed(0) + "%" },
    },
    series: studentGenderEntries.map(([, v]) => v),
  };

  const studentByLevel = students?.byLevel || [];
  const studentByLevelChart = {
    options: {
      chart: { type: "bar", toolbar: { show: false } },
      xaxis: { categories: studentByLevel.map((l) => l.levelName || "—") },
      colors: ["#6366f1"],
      plotOptions: { bar: { borderRadius: 6, columnWidth: "50%" } },
      dataLabels: { enabled: true },
    },
    series: [
      {
        name: "Doktorantlar",
        data: studentByLevel.map((l) => l.studentCount || 0),
      },
    ],
  };

  // ========================
  // MONTH CHARTS
  // ========================
  const monthStatusLabels = {
    PENDING: "Kutilmoqda",
    IN_PROGRESS: "Davom etmoqda",
    COMPLETED: "Yakunlangan",
    ARCHIVED: "Arxivlangan",
  };
  const monthStatusColors = ["#eab308", "#3b82f6", "#22c55e", "#94a3b8"];
  const monthStatusEntries = months?.byStatus
    ? Object.entries(months.byStatus)
    : [];

  const monthStatusChart = {
    options: {
      chart: { type: "donut" },
      labels: monthStatusEntries.map(([k]) => monthStatusLabels[k] || k),
      colors: monthStatusColors.slice(0, monthStatusEntries.length),
      legend: { position: "bottom", fontSize: "13px" },
      plotOptions: {
        pie: {
          donut: {
            size: "65%",
            labels: {
              show: true,
              total: {
                show: true,
                label: "Jami",
                fontSize: "14px",
                fontWeight: 600,
              },
            },
          },
        },
      },
      dataLabels: { enabled: true, formatter: (val) => val.toFixed(0) + "%" },
    },
    series: monthStatusEntries.map(([, v]) => v),
  };

  // ========================
  // REJA CHECKING CHARTS
  // ========================
  const rejaCheckingLabels = {
    created: "Yaratildi",
    inReview: "Tekshiruvda",
    approved: "Tasdiqlandi",
    rejected: "Rad etildi",
  };
  const rejaCheckingColors = ["#94a3b8", "#eab308", "#22c55e", "#ef4444"];
  const rejaCheckingEntries = rejaChecking?.byStatus
    ? Object.entries(rejaChecking.byStatus)
    : [];

  const rejaCheckingChart = {
    options: {
      chart: { type: "donut" },
      labels: rejaCheckingEntries.map(([k]) => rejaCheckingLabels[k] || k),
      colors: rejaCheckingColors.slice(0, rejaCheckingEntries.length),
      legend: { position: "bottom", fontSize: "13px" },
      plotOptions: {
        pie: {
          donut: {
            size: "65%",
            labels: {
              show: true,
              total: {
                show: true,
                label: "Jami",
                fontSize: "14px",
                fontWeight: 600,
              },
            },
          },
        },
      },
      dataLabels: { enabled: true, formatter: (val) => val.toFixed(0) + "%" },
    },
    series: rejaCheckingEntries.map(([, v]) => v),
  };

  // ========================
  // REJA HISTORY CHARTS
  // ========================
  const rejaHistoryLabels = {
    pending: "Kutilmoqda",
    accepted: "Tasdiqlangan",
    rejected: "Rad etilgan",
  };
  const rejaHistoryColors = ["#eab308", "#22c55e", "#ef4444"];
  const rejaHistoryEntries = rejaHistory?.byStatus
    ? Object.entries(rejaHistory.byStatus)
    : [];

  const rejaHistoryChart = {
    options: {
      chart: { type: "donut" },
      labels: rejaHistoryEntries.map(([k]) => rejaHistoryLabels[k] || k),
      colors: rejaHistoryColors.slice(0, rejaHistoryEntries.length),
      legend: { position: "bottom", fontSize: "13px" },
      plotOptions: {
        pie: {
          donut: {
            size: "65%",
            labels: {
              show: true,
              total: {
                show: true,
                label: "Jami",
                fontSize: "14px",
                fontWeight: 600,
              },
            },
          },
        },
      },
      dataLabels: { enabled: true, formatter: (val) => val.toFixed(0) + "%" },
    },
    series: rejaHistoryEntries.map(([, v]) => v),
  };

  const levelList = levels?.levels || [];
  const pct = rejaChecking?.percentages || {};

  const statusMap = {
    active: { label: "Faol", cls: "bg-green-100 text-green-700" },
    inactive: { label: "Nofaol", cls: "bg-gray-100 text-gray-600" },
    graduated: { label: "Bitirgan", cls: "bg-blue-100 text-blue-700" },
    expelled: { label: "Chetlatilgan", cls: "bg-red-100 text-red-600" },
  };

  return (
    <div className="min-h-screen py-6 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Page Header */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-700 px-6 py-6 sm:px-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/20">
                  <MdTrendingUp className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Statistika</h1>
                  <p className="mt-1 text-indigo-200">
                    Tizimning umumiy ko'rsatkichlari
                  </p>
                </div>
              </div>
              <button
                onClick={loadDashboard}
                className="flex items-center gap-2 rounded-lg bg-white/20 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/30"
              >
                <MdRefresh className="h-5 w-5" />
                Yangilash
              </button>
            </div>
          </div>
        </div>

        {/* Count Cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {countCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <div
                key={i}
                className="overflow-hidden rounded-2xl bg-white shadow-md transition hover:shadow-lg"
              >
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                        {card.label}
                      </p>
                      <p className="mt-2 text-3xl font-bold text-gray-800">
                        {card.value.toLocaleString()}
                      </p>
                    </div>
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${card.color}`}
                    >
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ═══════════════════════════════════════════════════ */}
        {/* EXCEL HISOBOT                                       */}
        {/* ═══════════════════════════════════════════════════ */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-800">
              <MdDownload className="text-emerald-500 h-5 w-5" />
              Excel hisobot — ish rejasi 2026
            </h2>
            <p className="mt-1 text-xs text-gray-400">
              Doktorantning oylik ish rejasini XLSX formatida yuklab oling
            </p>
          </div>
          <div className="p-6">
            <div className="relative mb-4">
              <MdSearch className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="F.I.O., ID raqam yoki yo'nalish bo'yicha qidiring..."
                className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            {searchLoading ? (
              <div className="flex items-center justify-center py-10 text-gray-400">
                <div className="mr-3 h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-indigo-500" />
                Yuklanmoqda...
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="py-10 text-center text-sm text-gray-400">
                {studentSearch
                  ? "Doktorant topilmadi"
                  : "Doktorantlar ro'yxati bo'sh"}
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="min-w-full divide-y divide-gray-100 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {[
                        "T/R",
                        "F.I.O.",
                        "ID raqam",
                        "Yo'nalish",
                        "Holat",
                        "Excel",
                      ].map((h, i) => (
                        <th
                          key={i}
                          className={`px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 ${
                            i >= 4 ? "text-center" : "text-left"
                          }`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {filteredStudents.map((s, idx) => {
                      const isDownloading = downloadingId === s.id;
                      const st = statusMap[s.studentStatus] || {
                        label: s.studentStatus || "—",
                        cls: "bg-gray-100 text-gray-600",
                      };
                      return (
                        <tr key={s.id} className="transition hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-400">{idx + 1}</td>
                          <td className="px-4 py-3 font-medium text-gray-800">
                            <div className="flex items-center gap-2">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                                {(s.fullName || "?")[0]}
                              </div>
                              {s.fullName || "—"}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-500">
                            {s.studentIdNumber || "—"}
                          </td>
                          <td className="max-w-[200px] truncate px-4 py-3 text-gray-500">
                            {s.direction || "—"}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${st.cls}`}
                            >
                              {st.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => downloadExcel(s.id, s.fullName)}
                              disabled={isDownloading}
                              className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {isDownloading ? (
                                <>
                                  <div className="border-emerald-300 border-t-emerald-700 h-3.5 w-3.5 animate-spin rounded-full border-2" />
                                  Yuklanmoqda...
                                </>
                              ) : (
                                <>
                                  <MdDownload className="h-3.5 w-3.5" />
                                  XLSX
                                </>
                              )}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {filteredStudents.length > 0 && (
              <p className="mt-3 text-right text-xs text-gray-400">
                Jami: {filteredStudents.length} ta doktorant
              </p>
            )}
          </div>
        </div>

        {/* Reja Checking Progress Bar */}
        {rejaChecking && (
          <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                <MdFactCheck className="h-5 w-5 text-amber-500" />
                Reja tekshiruv holati
              </h2>
            </div>
            <div className="p-6">
              <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-xl bg-gray-50 p-4 text-center">
                  <div className="mb-2 flex items-center justify-center gap-2">
                    <MdHourglassEmpty className="h-5 w-5 text-gray-500" />
                    <span className="text-xs font-medium uppercase text-gray-400">
                      Yaratildi
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-gray-700">
                    {rejaChecking.byStatus?.created || 0}
                  </p>
                  <p className="text-sm text-gray-500">
                    {(pct.createdPercent || 0).toFixed(1)}%
                  </p>
                </div>
                <div className="rounded-xl bg-yellow-50 p-4 text-center">
                  <div className="mb-2 flex items-center justify-center gap-2">
                    <MdPlayCircle className="h-5 w-5 text-yellow-600" />
                    <span className="text-xs font-medium uppercase text-yellow-600">
                      Tekshiruvda
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-yellow-700">
                    {rejaChecking.byStatus?.inReview || 0}
                  </p>
                  <p className="text-sm text-yellow-600">
                    {(pct.inReviewPercent || 0).toFixed(1)}%
                  </p>
                </div>
                <div className="rounded-xl bg-green-50 p-4 text-center">
                  <div className="mb-2 flex items-center justify-center gap-2">
                    <MdCheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-xs font-medium uppercase text-green-600">
                      Tasdiqlandi
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-green-700">
                    {rejaChecking.byStatus?.approved || 0}
                  </p>
                  <p className="text-sm text-green-600">
                    {(pct.approvedPercent || 0).toFixed(1)}%
                  </p>
                </div>
                <div className="rounded-xl bg-red-50 p-4 text-center">
                  <div className="mb-2 flex items-center justify-center gap-2">
                    <MdCancel className="h-5 w-5 text-red-500" />
                    <span className="text-xs font-medium uppercase text-red-500">
                      Rad etildi
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-red-700">
                    {rejaChecking.byStatus?.rejected || 0}
                  </p>
                  <p className="text-sm text-red-500">
                    {(pct.rejectedPercent || 0).toFixed(1)}%
                  </p>
                </div>
              </div>
              <div className="flex h-4 w-full overflow-hidden rounded-full bg-gray-100">
                {(pct.createdPercent || 0) > 0 && (
                  <div
                    className="bg-gray-400  transition-all"
                    style={{ width: `${pct.createdPercent}%` }}
                  />
                )}
                {(pct.inReviewPercent || 0) > 0 && (
                  <div
                    className="bg-yellow-400 transition-all"
                    style={{ width: `${pct.inReviewPercent}%` }}
                  />
                )}
                {(pct.approvedPercent || 0) > 0 && (
                  <div
                    className="bg-green-500  transition-all"
                    style={{ width: `${pct.approvedPercent}%` }}
                  />
                )}
                {(pct.rejectedPercent || 0) > 0 && (
                  <div
                    className="bg-red-500    transition-all"
                    style={{ width: `${pct.rejectedPercent}%` }}
                  />
                )}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-gray-400" />{" "}
                  Yaratildi
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />{" "}
                  Tekshiruvda
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-green-500" />{" "}
                  Tasdiqlandi
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500" /> Rad
                  etildi
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Charts Row 1: Student Status + Student Gender */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {studentStatusEntries.length > 0 && (
            <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
              <div className="border-b border-gray-200 px-6 py-4">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                  <MdSchool className="h-5 w-5 text-blue-500" />
                  Doktorantlar holati
                </h2>
              </div>
              <div className="flex items-center justify-center p-6">
                <Chart
                  options={studentStatusChart.options}
                  series={studentStatusChart.series}
                  type="donut"
                  width="380"
                />
              </div>
            </div>
          )}
          {studentGenderEntries.length > 0 && (
            <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
              <div className="border-b border-gray-200 px-6 py-4">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                  <MdPeople className="h-5 w-5 text-pink-500" />
                  Doktorantlar jinsi bo'yicha
                </h2>
              </div>
              <div className="flex items-center justify-center p-6">
                <Chart
                  options={studentGenderChart.options}
                  series={studentGenderChart.series}
                  type="pie"
                  width="380"
                />
              </div>
            </div>
          )}
        </div>

        {/* Charts Row 2: Student by Level */}
        {studentByLevel.length > 0 && (
          <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                <MdCategory className="h-5 w-5 text-purple-500" />
                Doktorantlar daraja bo'yicha
              </h2>
            </div>
            <div className="p-6">
              <Chart
                options={studentByLevelChart.options}
                series={studentByLevelChart.series}
                type="bar"
                height={320}
              />
            </div>
          </div>
        )}

        {/* Charts Row 3: Month + Reja Checking + Reja History */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {monthStatusEntries.length > 0 && (
            <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
              <div className="border-b border-gray-200 px-6 py-4">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                  <MdCalendarToday className="h-5 w-5 text-cyan-500" />
                  Oylar holati
                </h2>
              </div>
              <div className="flex items-center justify-center p-6">
                <Chart
                  options={monthStatusChart.options}
                  series={monthStatusChart.series}
                  type="donut"
                  width="320"
                />
              </div>
            </div>
          )}
          {rejaCheckingEntries.length > 0 && (
            <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
              <div className="border-b border-gray-200 px-6 py-4">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                  <MdFactCheck className="h-5 w-5 text-amber-500" />
                  Reja tekshiruv
                </h2>
              </div>
              <div className="flex items-center justify-center p-6">
                <Chart
                  options={rejaCheckingChart.options}
                  series={rejaCheckingChart.series}
                  type="donut"
                  width="320"
                />
              </div>
            </div>
          )}
          {rejaHistoryEntries.length > 0 && (
            <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
              <div className="border-b border-gray-200 px-6 py-4">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                  <MdHistory className="text-rose-500 h-5 w-5" />
                  Reja tarix
                </h2>
              </div>
              <div className="flex items-center justify-center p-6">
                <Chart
                  options={rejaHistoryChart.options}
                  series={rejaHistoryChart.series}
                  type="donut"
                  width="320"
                />
              </div>
            </div>
          )}
        </div>

        {/* Levels Table */}
        {levelList.length > 0 && (
          <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                <MdCategory className="h-5 w-5 text-purple-500" />
                Darajalar bo'yicha taqsimot
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {["T/R", "Daraja", "Tavsif", "Doktorantlar", "Oylar"].map(
                      (h, i) => (
                        <th
                          key={i}
                          className={`px-6 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 ${
                            i >= 3 ? "text-center" : "text-left"
                          }`}
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {levelList.map((level, idx) => (
                    <tr key={level.id} className="transition hover:bg-gray-50">
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {idx + 1}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-800">
                        <span className="inline-flex items-center gap-2">
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-xs font-bold text-purple-700">
                            {level.name?.[0] || "?"}
                          </span>
                          {level.name}
                        </span>
                      </td>
                      <td className="max-w-xs truncate px-6 py-4 text-sm text-gray-600">
                        {level.description || "—"}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-center text-sm">
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                          <MdSchool className="mr-1 h-3.5 w-3.5" />
                          {level.studentCount || 0}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-center text-sm">
                        <span className="inline-flex items-center rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-700">
                          <MdCalendarToday className="mr-1 h-3.5 w-3.5" />
                          {level.monthCount || 0}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Timestamp */}
        {data.timestamp && (
          <div className="text-center text-xs text-gray-400">
            Oxirgi yangilanish:{" "}
            {new Date(data.timestamp).toLocaleString("uz-UZ")}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
