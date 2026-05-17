import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ApiCall, { baseUrl } from "../../../config/index";
import {
  MdArrowBack,
  MdCheckCircle,
  MdHourglassEmpty,
  MdPlayCircle,
  MdCancel,
  MdDownload,
  MdHistory,
  MdAssignment,
  MdPictureAsPdf,
  MdInfo,
  MdPerson,
  MdDescription,
  MdCalendarToday,
  MdUploadFile,
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
    <span className={`inline-flex items-center rounded-full px-3 py-1.5 text-sm font-semibold ${info.cls}`}>
      {info.icon}
      {info.label}
    </span>
  );
};

// RejaHistory status badge (0=pending, 1=accepted, 2=rejected)
const getHistoryStatusBadge = (status) => {
  const map = {
    0: { label: "Tekshiruvda", cls: "bg-yellow-100 text-yellow-800", icon: <MdPlayCircle className="mr-1 h-3.5 w-3.5" /> },
    1: { label: "Tasdiqlandi", cls: "bg-green-100 text-green-800", icon: <MdCheckCircle className="mr-1 h-3.5 w-3.5" /> },
    2: { label: "Rad etildi", cls: "bg-red-100 text-red-800", icon: <MdCancel className="mr-1 h-3.5 w-3.5" /> },
  };
  const info = map[status] || { label: "Noma'lum", cls: "bg-gray-50 text-gray-500", icon: null };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${info.cls}`}>
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

const getCheckerName = (checker) => {
  if (!checker) return null;
  if (checker.name) return checker.name;
  if (checker.firstName || checker.lastName)
    return `${checker.firstName || ""} ${checker.lastName || ""}`.trim();
  if (checker.phone) return checker.phone;
  return null;
};

const StudentRejaDetail = () => {
  const { rejaId } = useParams();
  const navigate = useNavigate();

  const [reja, setReja] = useState(null);
  const [checking, setChecking] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (rejaId) loadData();
  }, [rejaId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1) Load reja details
      const rejaRes = await ApiCall(`/api/v1/reja/${rejaId}`, "GET");
      if (rejaRes.error || !rejaRes.data) {
        setError("Reja ma'lumotlari topilmadi");
        return;
      }
      setReja(rejaRes.data);

      // 2) Load student's RejaChecking for this reja
      const checkRes = await ApiCall(`/api/v1/student-reja/by-reja/${rejaId}`, "GET");
      let checkingData = null;
      console.log(checkRes);
      if (!checkRes.error && checkRes.data) {
        const list = Array.isArray(checkRes.data) ? checkRes.data : [checkRes.data];
        if (list.length > 0) {
          checkingData = list[0];
          setChecking(checkingData);
        }
      }

      // 3) Load history if checking exists
      if (checkingData && checkingData.id) {
        const histRes = await ApiCall(`/api/v1/reja-history/by-reja-checking/${checkingData.id}`, "GET");
        if (!histRes.error && histRes.data) {
          const histList = Array.isArray(histRes.data) ? histRes.data : [histRes.data];
          setHistory(histList);
        }
      }
    } catch (err) {
      console.error("Error loading reja detail:", err);
      setError("Ma'lumotlarni yuklashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
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

  if (error || !reja) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <MdAssignment className="mx-auto h-16 w-16 text-gray-300" />
          <h2 className="mt-4 text-xl font-semibold text-gray-700">{error || "Reja topilmadi"}</h2>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
          >
            ← Orqaga qaytish
          </button>
        </div>
      </div>
    );
  }

  const monthName = reja.month?.name || "—";
  const monthId = reja.month?.id;

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">

        {/* Header */}
        <div className="mb-6 overflow-hidden rounded-2xl bg-white shadow-lg">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-700 px-6 py-6 sm:px-10">
            <div className="flex items-center gap-4">
              <button
                onClick={() => monthId ? navigate(`/student/month/${monthId}`) : navigate(-1)}
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 text-white hover:bg-white/30 transition"
              >
                <MdArrowBack className="h-6 w-6" />
              </button>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-white">{reja.name}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-indigo-200">
                  <span className="inline-flex items-center gap-1">
                    <MdCalendarToday className="h-4 w-4" />
                    {monthName}
                  </span>
                  {checking && getCheckingStatusBadge(checking.status)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reja Info Card */}
        <div className="mb-6 overflow-hidden rounded-2xl bg-white shadow-lg">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <MdDescription className="h-5 w-5 text-indigo-500" />
              Reja ma'lumotlari
            </h2>
          </div>
          <div className="px-6 py-5 space-y-4">
            {/* Description */}
            {reja.description && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-1">Tavsif</p>
                <p className="text-sm text-gray-700">{reja.description}</p>
              </div>
            )}

            {/* Checkers */}
            {reja.checkers?.length > 0 && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-2">Tekshiruvchilar</p>
                <div className="flex flex-wrap gap-2">
                  {reja.checkers.map((u, i) => (
                    <div
                      key={u.id || i}
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2"
                    >
                      <span className="inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-semibold text-white">
                        {i + 1}
                      </span>
                      <span className="text-sm text-gray-700">
                        {u.name
                          ? u.name
                          : u.firstName || u.lastName
                          ? `${u.firstName || ""} ${u.lastName || ""}`.trim()
                          : u.phone || "—"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Example file */}
            {reja.example?.id && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-2">Misol fayl</p>
                <button
                  onClick={() => handleDownload(reja.example.id, reja.name + "-misol")}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-2.5 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100"
                >
                  <MdDownload className="h-5 w-5" />
                  Misol faylni yuklab olish
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RejaChecking Card */}
        <div className="mb-6 overflow-hidden rounded-2xl bg-white shadow-lg">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <MdUploadFile className="h-5 w-5 text-emerald-500" />
              Topshiriq holati
            </h2>
          </div>

          {!checking ? (
            <div className="px-6 py-8 text-center">
              <MdInfo className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-3 text-gray-500">Bu reja uchun hali topshiriq yuborilmagan.</p>
            </div>
          ) : (
            <div className="px-6 py-5">
              {/* Status + Date row */}
              <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
                {getCheckingStatusBadge(checking.status)}
                <span className="text-sm text-gray-400">
                  {formatDate(checking.createdAt || checking.updatedAt)}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {/* Student comment */}
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-2">Talaba izohi</p>
                  <p className="text-sm text-gray-700">
                    {checking.descStudent || <span className="text-gray-400 italic">Izoh yo'q</span>}
                  </p>
                </div>

                {/* Checker comment */}
                <div className={`rounded-xl p-4 ${checking.status === 2 ? "bg-red-50" : "bg-gray-50"}`}>
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-2">Tekshiruvchi izohi</p>
                  <p className={`text-sm ${checking.status === 2 ? "text-red-700 italic" : "text-gray-700"}`}>
                    {checking.descChecker || <span className="text-gray-400 italic">Izoh yo'q</span>}
                  </p>
                </div>

                {/* Current Checker info */}
                {(checking.currentChecker || checking.checker) && (
                  <div className="rounded-xl bg-gray-50 p-4">
                    <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-2">Hozirgi tekshiruvchi</p>
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
                        <MdPerson className="h-4 w-4" />
                      </span>
                      <span className="text-sm font-medium text-gray-700">
                        {getCheckerName(checking.currentChecker || checking.checker) || "—"}
                      </span>
                    </div>
                  </div>
                )}

                {/* Uploaded file */}
                {checking.file?.id && (
                  <div className="rounded-xl bg-gray-50 p-4">
                    <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-2">Yuklangan fayl</p>
                    <button
                      onClick={() => handleDownload(checking.file.id, reja.name)}
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-2.5 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100"
                    >
                      <MdPictureAsPdf className="h-5 w-5 text-red-500" />
                      Faylni yuklab olish
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* History Section */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <MdHistory className="h-5 w-5 text-purple-500" />
              Tarix ({history.length})
            </h2>
          </div>

          {history.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <MdInfo className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-3 text-gray-500">Bu reja uchun tarix mavjud emas.</p>
            </div>
          ) : (
            <div className="px-6 py-5">
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

                <div className="space-y-6">
                  {history.map((item, idx) => (
                    <div key={item.id || idx} className="relative pl-10">
                      {/* Timeline dot */}
                      <div
                        className={`absolute left-2.5 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white shadow ${
                          item.status === 0
                            ? "bg-yellow-500"
                            : item.status === 1
                            ? "bg-green-500"
                            : item.status === 2
                            ? "bg-red-500"
                            : "bg-gray-400"
                        }`}
                      />

                      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 transition hover:shadow-md">
                        {/* Header row */}
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                          {getHistoryStatusBadge(item.status)}
                          <span className="text-xs text-gray-400">
                            {formatDate(item.createdAt || item.changedAt)}
                          </span>
                        </div>

                        {/* Checker */}
                        {item.checker && (
                          <div className="flex items-center gap-2 mb-2">
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-[10px] font-semibold text-white">
                              <MdPerson className="h-3.5 w-3.5" />
                            </span>
                            <span className="text-sm text-gray-700 font-medium">
                              {getCheckerName(item.checker) || "—"}
                            </span>
                          </div>
                        )}

                        {/* Comment */}
                        {item.comment && (
                          <p className={`text-sm mt-2 ${item.status === 2 ? "text-red-600 italic" : "text-gray-600"}`}>
                            <span className="font-medium text-gray-500">Izoh: </span>
                            {item.comment}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentRejaDetail;

