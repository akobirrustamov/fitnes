import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ApiCall, { baseUrl } from "../../../config/index";
import {
  MdArrowBack,
  MdCalendarToday,
  MdSchool,
  MdCheckCircle,
  MdHourglassEmpty,
  MdPlayCircle,
  MdArchive,
  MdDownload,
  MdUploadFile,
  MdCancel,
  MdRefresh,
  MdClose,
  MdPictureAsPdf,
  MdDelete,
} from "react-icons/md";

const getStatusInfo = (status) => {
  const map = {
    PENDING: { label: "Kutilmoqda", cls: "bg-yellow-100 text-yellow-800", icon: <MdHourglassEmpty className="mr-1" /> },
    IN_PROGRESS: { label: "Davom etmoqda", cls: "bg-blue-100 text-blue-800", icon: <MdPlayCircle className="mr-1" /> },
    COMPLETED: { label: "Yakunlangan", cls: "bg-green-100 text-green-800", icon: <MdCheckCircle className="mr-1" /> },
    ARCHIVED: { label: "Arxivlangan", cls: "bg-gray-100 text-gray-800", icon: <MdArchive className="mr-1" /> },
  };
  return map[status] || { label: status || "—", cls: "bg-gray-100 text-gray-800", icon: null };
};

// RejaChecking status badge
const getCheckingStatusBadge = (status) => {
  const map = {
    0: { label: "Reja yuklandi", cls: "bg-blue-100 text-blue-800", icon: <MdPlayCircle className="mr-1 h-3.5 w-3.5" /> },
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

const StudentMonthDetail = () => {
  const { monthId } = useParams();
  const navigate = useNavigate();

  const [month, setMonth] = useState(null);
  const [rejas, setRejas] = useState([]);
  const [checkings, setCheckings] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [customDeadline, setCustomDeadline] = useState(null);

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadRejaId, setUploadRejaId] = useState(null);
  const [uploadRejaName, setUploadRejaName] = useState("");
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadDesc, setUploadDesc] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (monthId) loadData();
  }, [monthId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current student ID
      const studentId = localStorage.getItem("studentId");
      if (!studentId) {
        setError("Student ID topilmadi");
        return;
      }

      // 1) Load month
      const monthRes = await ApiCall(`/api/v1/month/${monthId}`, "GET");
      if (monthRes.error || !monthRes.data) {
        setError("Oy ma'lumotlari topilmadi");
        return;
      }
      setMonth(monthRes.data);

      // 2) Check for custom deadline (extended deadline)
      try {
        const deadlineRes = await ApiCall(`/api/v1/student-month-deadline/by-student-month/${studentId}/${monthId}`, "GET");
        if (!deadlineRes.error && deadlineRes.data) {
          setCustomDeadline(deadlineRes.data.endedDate);
        }
      } catch (err) {
        // No custom deadline, use default
        console.log("No custom deadline found, using default");
      }

      // 3) Load student's individual plans for this month
      const planRes = await ApiCall(`/api/v1/student-plan/by-student-month/${studentId}/${monthId}`, "GET");
      const basicPlans = planRes.data || [];

      // Get detailed plans with checkers
      const detailedPlans = await Promise.all(
        basicPlans.map(async (plan) => {
          if (Array.isArray(plan.checkers)) return plan;
          try {
            const detail = await ApiCall(`/api/v1/student-plan/${plan.id}`, "GET");
            return { ...plan, ...detail.data };
          } catch {
            return plan;
          }
        })
      );
      setRejas(detailedPlans);

      // 4) Load student's checkings for each plan
      await loadCheckings(detailedPlans);
    } catch (err) {
      console.error("Error loading month detail:", err);
      setError("Ma'lumotlarni yuklashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const loadCheckings = async (planList) => {
    const checkingMap = {};
    await Promise.all(
      planList.map(async (plan) => {
        try {
          const res = await ApiCall(`/api/v1/student-plan-checking/by-student-plan/${plan.id}`, "GET");
          if (!res.error && res.data) {
            checkingMap[plan.id] = res.data;
          }
        } catch (err) {
          console.error(`Error loading checking for plan ${plan.id}:`, err);
        }
      })
    );
    setCheckings(checkingMap);
  };

  // Open upload modal
  const openUploadModal = (rejaId, rejaName) => {
    const existing = checkings[rejaId];
    setUploadRejaId(rejaId);
    setUploadRejaName(rejaName);
    setUploadFile(null);
    setUploadDesc(existing?.descStudent || "");
    setShowUploadModal(true);
  };

  const closeUploadModal = () => {
    setShowUploadModal(false);
    setUploadRejaId(null);
    setUploadRejaName("");
    setUploadFile(null);
    setUploadDesc("");
  };

  // Handle modal file selection
  const handleModalFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      alert("Faqat PDF formatdagi fayllarni yuklash mumkin!");
      e.target.value = "";
      return;
    }
    setUploadFile(file);
  };

  // Submit upload from modal
  const handleModalSubmit = async () => {
    if (!uploadFile) {
      alert("Iltimos, PDF fayl tanlang!");
      return;
    }
    if (!uploadRejaId) return;

    try {
      setUploading(true);

      // 1) Fetch fresh checking to check latest status
      let freshChecking = null;
      const checkRes = await ApiCall(`/api/v1/student-plan-checking/by-student-plan/${uploadRejaId}`, "GET");
      if (!checkRes.error && checkRes.data) {
        freshChecking = checkRes.data;
        setCheckings((prev) => ({ ...prev, [uploadRejaId]: freshChecking }));
      }

      // 2) Check status - only block if fully approved (status=1)
      if (freshChecking && freshChecking.status === 1) {
        alert("Bu reja allaqachon tasdiqlangan. Qayta yuklash mumkin emas.");
        return;
      }

      // 3) Upload file
      const formData = new FormData();
      formData.append("photo", uploadFile);
      formData.append("prefix", "/student-plan-checking");

      const uploadRes = await ApiCall("/api/v1/file/upload", "POST", formData);

      if (uploadRes.error || !uploadRes.data) {
        alert("Faylni yuklashda xatolik yuz berdi!");
        return;
      }

      const fileId = uploadRes.data;

      // 4) Create or Update checking
      if (freshChecking) {
        // UPDATE existing (re-upload after rejection)
        const updateRes = await ApiCall(`/api/v1/student-plan-checking/${freshChecking.id}`, "PUT", {
          studentRejaId: uploadRejaId,
          fileId: fileId,
          descStudent: uploadDesc,
        });
        if (!updateRes.error) {
          setCheckings((prev) => ({ ...prev, [uploadRejaId]: updateRes.data }));
          closeUploadModal();
        } else {
          const msg = typeof updateRes.data === "string" ? updateRes.data : "Faylni yangilashda xatolik yuz berdi!";
          alert(msg);
        }
      } else {
        // CREATE new
        const createRes = await ApiCall("/api/v1/student-plan-checking", "POST", {
          studentRejaId: uploadRejaId,
          fileId: fileId,
          descStudent: uploadDesc,
        });
        if (!createRes.error) {
          setCheckings((prev) => ({ ...prev, [uploadRejaId]: createRes.data }));
          closeUploadModal();
        } else {
          const msg = typeof createRes.data === "string" ? createRes.data : "Faylni yuklashda xatolik yuz berdi!";
          alert(msg);
        }
      }
    } catch (err) {
      console.error("Error uploading file:", err);
      alert("Faylni yuklashda xatolik yuz berdi!");
    } finally {
      setUploading(false);
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

  // Can the student upload for this reja?
  const canUpload = (rejaId) => {
    // Use custom deadline if available, otherwise use month's default deadline
    const effectiveDeadline = customDeadline || month?.endedDate;

    // Check if month period has ended
    if (effectiveDeadline) {
      const endDate = new Date(effectiveDeadline);
      const today = new Date();
      // Set time to 00:00:00 for proper date comparison
      today.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      if (endDate < today) {
        return false; // Period expired
      }
    }

    const checking = checkings[rejaId];
    if (!checking) return true; // No record yet — first upload allowed

    // IMPORTANT: Student can ONLY upload when rejected (status=2)
    // NOT when in review (status=0) because it's being checked by another checker
    // NOT when fully approved (status=1) because it's done
    if (checking.status === 2) return true;
    // Block all other statuses
    return false;
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

  if (error || !month) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <MdCalendarToday className="mx-auto h-16 w-16 text-gray-300" />
          <h2 className="mt-4 text-xl font-semibold text-gray-700">{error || "Oy topilmadi"}</h2>
          <button
            onClick={() => navigate("/student/month")}
            className="mt-4 rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
          >
            ← Oylar ro'yxatiga qaytish
          </button>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(month.status);
  const startDate = month.startedDate ? new Date(month.startedDate).toLocaleDateString("uz-UZ") : "—";
  const effectiveEndDate = customDeadline || month.endedDate;
  const endDate = effectiveEndDate ? new Date(effectiveEndDate).toLocaleDateString("uz-UZ") : "—";
  const isExtended = customDeadline && customDeadline !== month.endedDate;

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 overflow-hidden rounded-2xl bg-white shadow-lg">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-700 px-6 py-6 sm:px-10">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/student/month")}
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 text-white hover:bg-white/30 transition"
              >
                <MdArrowBack className="h-6 w-6" />
              </button>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-white">{month.name}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-indigo-200">
                  {month.level?.name && (
                    <span className="inline-flex items-center">
                      <MdSchool className="mr-1" />
                      {month.level.name}
                    </span>
                  )}
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusInfo.cls}`}>
                    {statusInfo.icon}
                    {statusInfo.label}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-6 text-sm text-indigo-100">
                  <span>
                    <span className="text-indigo-300">Boshlash sanasi: </span>
                    <span className="font-semibold text-white">{startDate}</span>
                  </span>
                  <span>
                    <span className="text-indigo-300">Tugash sanasi: </span>
                    <span className="font-semibold text-white">{endDate}</span>
                    {isExtended && (
                      <span className="ml-2 inline-flex items-center rounded-full bg-orange-500 px-2 py-0.5 text-xs font-medium text-white">
                        Uzaytirilgan
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {month.description && (
            <div className="border-b border-gray-100 px-6 py-4 sm:px-10">
              <p className="text-gray-600">{month.description}</p>
            </div>
          )}
        </div>

        {/* Reja list */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Rejalar ({rejas.length})
            </h2>
          </div>

          {rejas.length === 0 ? (
            <div className="p-12 text-center">
              <MdCalendarToday className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-4 text-gray-500">Bu oy uchun rejalar topilmadi.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">T/R</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Nomi</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Tavsif</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Tekshiruvchilar</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Misol fayl</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Topshiriq holati</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Fayl yuklash</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {rejas.map((reja, idx) => {
                    const checking = checkings[reja.id];
                    const allowUpload = canUpload(reja.id);

                    return (
                      <tr key={reja.id} className="transition hover:bg-gray-50">
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{idx + 1}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                          <button
                            onClick={() => navigate(`/student/student-plan/${reja.id}`)}
                            className="text-indigo-700 hover:text-indigo-900 hover:underline transition"
                          >
                            {reja.name}
                          </button>
                        </td>
                        <td className="max-w-xs truncate px-4 py-3 text-sm text-gray-600">{reja.description || "—"}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {reja.checkers?.length ? (
                            <div className="space-y-1.5">
                              {reja.checkers.map((u, i) => (
                                <div key={u.id || i} className="flex items-center gap-2">
                                  <span className="inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-semibold text-white">
                                    {i + 1}
                                  </span>
                                  <span className="text-gray-700">
                                    {u.name
                                      ? u.name
                                      : u.firstName || u.lastName
                                      ? `${u.firstName || ""} ${u.lastName || ""}`.trim()
                                      : u.phone || "—"}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            "—"
                          )}
                        </td>
                        {/* Misol fayl */}
                        <td className="whitespace-nowrap px-4 py-3 text-sm">
                          {reja.example?.id ? (
                            <button
                              onClick={() => handleDownload(reja.example.id, reja.name || "misol")}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100"
                            >
                              <MdDownload className="h-4 w-4" />
                              Yuklab olish
                            </button>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        {/* Topshiriq holati */}
                        <td className="px-4 py-3 text-sm">
                          <div className="space-y-1.5">
                            {getCheckingStatusBadge(checking?.status)}
                            {checking?.status === 2 && checking?.descChecker && (
                              <p className="mt-1 max-w-[200px] text-xs text-red-600 italic">
                                "{checking.descChecker}"
                              </p>
                            )}
                            {checking?.descStudent && (
                              <p className="mt-1 max-w-[200px] text-xs text-gray-500 truncate" title={checking.descStudent}>
                                {checking.descStudent}
                              </p>
                            )}
                            {checking?.file?.id && (
                              <button
                                onClick={() => handleDownload(checking.file.id, reja.name || "yuklangan")}
                                className="mt-1 inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                              >
                                <MdDownload className="h-3.5 w-3.5" />
                                Yuklangan fayl
                              </button>
                            )}
                          </div>
                        </td>
                        {/* Fayl yuklash */}
                        <td className="whitespace-nowrap px-4 py-3 text-sm">
                          {allowUpload ? (
                            <button
                              onClick={() => openUploadModal(reja.id, reja.name)}
                              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                                checking?.status === 2
                                  ? "bg-red-50 text-red-700 hover:bg-red-100"
                                  : "bg-green-50 text-green-700 hover:bg-green-100"
                              }`}
                            >
                              {checking?.status === 2 ? (
                                <>
                                  <MdRefresh className="h-4 w-4" />
                                  Qayta yuklash
                                </>
                              ) : (
                                <>
                                  <MdUploadFile className="h-4 w-4" />
                                  Fayl yuklash
                                </>
                              )}
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-400">
                              {effectiveEndDate && new Date(effectiveEndDate) < new Date() ? (
                                <>
                                  <MdCancel className="h-4 w-4 text-red-500" />
                                  Muddat tugadi
                                </>
                              ) : checking?.status === 1 ? (
                                <>
                                  <MdCheckCircle className="h-4 w-4 text-green-500" />
                                  Tasdiqlangan
                                </>
                              ) : (
                                <>
                                  <MdHourglassEmpty className="h-4 w-4 text-yellow-500" />
                                  Tekshirilmoqda
                                </>
                              )}
                            </span>
                          )}
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

      {/* ===== Upload Modal ===== */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={!uploading ? closeUploadModal : undefined}
          />

          {/* Modal content */}
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Fayl yuklash</h3>
                <p className="mt-0.5 text-sm text-gray-500">{uploadRejaName}</p>
              </div>
              <button
                onClick={closeUploadModal}
                disabled={uploading}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition disabled:opacity-50"
              >
                <MdClose className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="space-y-5 px-6 py-5">
              {/* File picker */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  PDF fayl tanlang <span className="text-red-500">*</span>
                </label>

                {!uploadFile ? (
                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-8 transition hover:border-blue-400 hover:bg-blue-50">
                    <MdUploadFile className="h-10 w-10 text-gray-400" />
                    <p className="mt-2 text-sm font-medium text-gray-600">
                      Faylni tanlash uchun bosing
                    </p>
                    <p className="mt-1 text-xs text-gray-400">Faqat PDF (max 50MB)</p>
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      className="hidden"
                      onChange={handleModalFileChange}
                    />
                  </label>
                ) : (
                  <div className="flex items-center justify-between rounded-xl border border-green-200 bg-green-50 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <MdPictureAsPdf className="h-8 w-8 text-red-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-800 truncate max-w-[280px]">
                          {uploadFile.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(uploadFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setUploadFile(null)}
                      className="rounded-lg p-1.5 text-red-400 hover:bg-red-100 hover:text-red-600 transition"
                    >
                      <MdDelete className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Izoh (ixtiyoriy)
                </label>
                <textarea
                  value={uploadDesc}
                  onChange={(e) => setUploadDesc(e.target.value)}
                  rows={3}
                  placeholder="Topshiriq haqida qo'shimcha izoh yozing..."
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-700 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
              <button
                onClick={closeUploadModal}
                disabled={uploading}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleModalSubmit}
                disabled={uploading || !uploadFile}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 transition disabled:bg-blue-300 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                    Yuklanmoqda...
                  </>
                ) : (
                  <>
                    <MdUploadFile className="h-4 w-4" />
                    Yuklash
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

export default StudentMonthDetail;
