import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ApiCall, { baseUrl } from "../../../config/index";
import {
  MdArrowBack,
  MdCheckCircle,
  MdCancel,
  MdHourglassEmpty,
  MdDownload,
  MdPerson,
  MdDescription,
  MdCategory,
} from "react-icons/md";

const CATEGORY_OPTIONS = [
  { value: 1, label: "O'quv ishlari va malakaviy imtihonlar" },
  { value: 2, label: "Ilmiy tadqiqot ishi" },
  { value: 3, label: "Dissertatsiya mavzusi buyicha ilmiy maqolalar chop etish" },
  { value: 4, label: "Dissertatsiya mavzusi bo'yicha tahliliy umum-lashtiruvchi qisqacha ma'lumot natijalari bo'yicha seminar o'tkazish" },
  { value: 5, label: "Dissertatsiya mavzusi bo'yicha shaxsiy rejaning bajarilishi to'g'risida hisobot" },
];

const getStatusBadge = (status) => {
  const map = {
    0: { label: "Tekshirilmoqda", cls: "bg-blue-100 text-blue-800", icon: <MdHourglassEmpty className="mr-1 h-4 w-4" /> },
    1: { label: "Tasdiqlandi", cls: "bg-green-100 text-green-800", icon: <MdCheckCircle className="mr-1 h-4 w-4" /> },
    2: { label: "Rad etildi", cls: "bg-red-100 text-red-800", icon: <MdCancel className="mr-1 h-4 w-4" /> },
  };
  const info = map[status] || { label: "Noma'lum", cls: "bg-gray-50 text-gray-500", icon: null };
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${info.cls}`}>
      {info.icon}
      {info.label}
    </span>
  );
};

const StudentPlanDetail = () => {
  const { planId } = useParams();
  const navigate = useNavigate();

  const [plan, setPlan] = useState(null);
  const [checking, setChecking] = useState(null);
  const [histories, setHistories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (planId) loadData();
  }, [planId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1) Load plan details
      const planRes = await ApiCall(`/api/v1/student-plan/${planId}`, "GET");
      if (planRes.error || !planRes.data) {
        setError("Reja ma'lumotlari topilmadi");
        return;
      }
      setPlan(planRes.data);

      // 2) Load checking status
      const checkRes = await ApiCall(`/api/v1/student-plan-checking/by-student-plan/${planId}`, "GET");
      if (!checkRes.error && checkRes.data) {
        setChecking(checkRes.data);

        // 3) Load history if checking exists
        if (checkRes.data.id) {
          const historyRes = await ApiCall(`/api/v1/reja-history/by-student-checking/${checkRes.data.id}`, "GET");
          if (!historyRes.error && historyRes.data) {
            const historyList = Array.isArray(historyRes.data) ? historyRes.data : [historyRes.data];
            setHistories(historyList);
          }
        }
      }
    } catch (err) {
      console.error("Error loading plan detail:", err);
      setError("Ma'lumotlarni yuklashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  // Download file with auth
  const handleDownload = async (fileId, name) => {
    try {
      if (!fileId) return alert("❌ Fayl topilmadi");

      const token = localStorage.getItem("authToken");
      const res = await fetch(`${baseUrl}/api/v1/file/getFile/${fileId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name || "fayl";
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

  if (error || !plan) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <MdDescription className="mx-auto h-16 w-16 text-gray-300" />
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

  const categoryLabel = CATEGORY_OPTIONS.find(c => c.value === plan.category)?.label || "—";

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8 overflow-hidden rounded-2xl bg-white shadow-lg">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-700 px-6 py-6 sm:px-10">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 text-white hover:bg-white/30 transition"
              >
                <MdArrowBack className="h-6 w-6" />
              </button>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-white">{plan.name}</h1>
                <div className="mt-2 flex items-center gap-3">
                  {checking && getStatusBadge(checking.status)}
                </div>
              </div>
            </div>
          </div>

          {/* Plan Details */}
          <div className="border-b border-gray-100 px-6 py-5 sm:px-10">
            <div className="space-y-4">
              {/* Category */}
              <div className="flex items-start gap-3">
                <MdCategory className="mt-1 h-5 w-5 text-indigo-600" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Kategoriya</p>
                  <p className="mt-1 text-gray-800">{categoryLabel}</p>
                </div>
              </div>

              {/* Description */}
              {plan.description && (
                <div className="flex items-start gap-3">
                  <MdDescription className="mt-1 h-5 w-5 text-indigo-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Tavsif</p>
                    <p className="mt-1 text-gray-800">{plan.description}</p>
                  </div>
                </div>
              )}

              {/* Example file */}
              {plan.example?.id && (
                <div className="flex items-start gap-3">
                  <MdDownload className="mt-1 h-5 w-5 text-indigo-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Misol fayl</p>
                    <button
                      onClick={() => handleDownload(plan.example.id, plan.example.name || plan.name || "misol")}
                      className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100"
                    >
                      <MdDownload className="h-4 w-4" />
                      Yuklab olish
                    </button>
                  </div>
                </div>
              )}

              {/* Checkers */}
              {plan.checkers?.length > 0 && (
                <div className="flex items-start gap-3">
                  <MdPerson className="mt-1 h-5 w-5 text-indigo-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Tekshiruvchilar</p>
                    <div className="mt-2 space-y-2">
                      {plan.checkers.map((checker, idx) => (
                        <div key={checker.id || idx} className="flex items-center gap-2">
                          <span className="inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
                            {idx + 1}
                          </span>
                          <span className="text-gray-700">
                            {checker.name || `${checker.firstName || ""} ${checker.lastName || ""}`.trim() || checker.phone || "—"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Checking History */}
        {histories.length > 0 && (
          <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-800">
                Tekshiruv tarixi ({histories.length})
              </h2>
            </div>

            <div className="divide-y divide-gray-100">
              {histories.map((history, idx) => (
                <div key={history.id || idx} className="px-6 py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-900">
                          {history.checker?.name || "—"}
                        </span>
                        {getStatusBadge(history.status)}
                      </div>
                      {history.comment && (
                        <p className="mt-2 text-sm text-gray-600">{history.comment}</p>
                      )}
                      {history.createdAt && (
                        <p className="mt-1 text-xs text-gray-400">
                          {new Date(history.createdAt).toLocaleString("uz-UZ")}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No checking yet */}
        {!checking && (
          <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center shadow-lg">
            <MdHourglassEmpty className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-4 text-gray-500">
              Siz hali bu reja uchun fayl yuklamagansiz.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentPlanDetail;
