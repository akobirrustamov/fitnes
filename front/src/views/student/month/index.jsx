import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ApiCall from "../../../config/index";
import {
  MdCalendarToday,
  MdSchool,
  MdAccessTime,
  MdCheckCircle,
  MdHourglassEmpty,
  MdPlayCircle,
  MdArchive,
} from "react-icons/md";

const getStatusInfo = (status) => {
  const map = {
    PENDING: {
      label: "Kutilmoqda",
      cls: "bg-yellow-100 text-yellow-800",
      icon: <MdHourglassEmpty className="mr-1" />,
    },
    IN_PROGRESS: {
      label: "Davom etmoqda",
      cls: "bg-blue-100 text-blue-800",
      icon: <MdPlayCircle className="mr-1" />,
    },
    COMPLETED: {
      label: "Yakunlangan",
      cls: "bg-green-100 text-green-800",
      icon: <MdCheckCircle className="mr-1" />,
    },
    ARCHIVED: {
      label: "Arxivlangan",
      cls: "bg-gray-100 text-gray-800",
      icon: <MdArchive className="mr-1" />,
    },
  };
  return map[status] || { label: status || "—", cls: "bg-gray-100 text-gray-800", icon: null };
};

const StudentMonths = () => {
  const navigate = useNavigate();
  const [months, setMonths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const [error, setError] = useState(null);
  const [customDeadlines, setCustomDeadlines] = useState({});

  const studentId = localStorage.getItem("studentId");
  const token = localStorage.getItem("authToken");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!token) {
      navigate("/student/login");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 1) Get student data to know their level
      let studentData = null;

      if (studentId) {
        const res = await ApiCall(`/api/v1/student/${studentId}`, "GET");
        if (!res.error && res.data) {
          studentData = res.data?.data || res.data;
        }
      }

      if (!studentData) {
        const res = await ApiCall("/api/v1/student/decode", "GET");
        if (!res.error && res.data) {
          studentData = res.data;
        }
      }

      if (!studentData) {
        setError("Talaba ma'lumotlari topilmadi");
        setLoading(false);
        return;
      }

      setStudent(studentData);

      // 2) Get months by student's level
      const levelId = studentData.levelId || studentData.level?.id;

      if (!levelId) {
        setError("Daraja belgilanmagan. Iltimos, admin bilan bog'laning.");
        setLoading(false);
        return;
      }

      const monthRes = await ApiCall(`/api/v1/month/by-level/${levelId}`, "GET");

      if (!monthRes.error && monthRes.data) {
        const monthList = Array.isArray(monthRes.data) ? monthRes.data : [];
        // Sort by startedDate descending
        monthList.sort((a, b) => new Date(b.startedDate) - new Date(a.startedDate));
        setMonths(monthList);

        // Load custom deadlines for each month
        const deadlineMap = {};
        await Promise.all(
          monthList.map(async (month) => {
            try {
              const deadlineRes = await ApiCall(
                `/api/v1/student-month-deadline/by-student-month/${studentData.id}/${month.id}`,
                "GET"
              );
              if (!deadlineRes.error && deadlineRes.data) {
                deadlineMap[month.id] = deadlineRes.data.endedDate;
              }
            } catch (err) {
              // No custom deadline for this month
            }
          })
        );
        setCustomDeadlines(deadlineMap);
      } else {
        setMonths([]);
      }
    } catch (err) {
      console.error("Error loading months:", err);
      setError("Ma'lumotlarni yuklashda xatolik yuz berdi");
    } finally {
      setLoading(false);
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
          <MdCalendarToday className="mx-auto h-16 w-16 text-gray-300" />
          <h2 className="mt-4 text-xl font-semibold text-gray-700">{error}</h2>
          <button
            onClick={loadData}
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
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8 overflow-hidden rounded-2xl bg-white shadow-lg">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-700 px-6 py-6 sm:px-10">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/20">
                <MdCalendarToday className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Oylik rejalar</h1>
                <p className="mt-1 text-indigo-200">
                  {student?.levelName && (
                    <span className="inline-flex items-center">
                      <MdSchool className="mr-1" />
                      {student.levelName} — {months.length} ta oy
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Months List */}
        {months.length === 0 ? (
          <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center shadow-lg">
            <MdCalendarToday className="mx-auto h-16 w-16 text-gray-300" />
            <h3 className="mt-4 text-lg font-semibold text-gray-700">
              Oylik rejalar topilmadi
            </h3>
            <p className="mt-2 text-gray-500">
              Sizning darajangiz uchun hali oylik rejalar belgilanmagan.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {months.map((month) => {
              const statusInfo = getStatusInfo(month.status);
              const customDeadline = customDeadlines[month.id];
              const effectiveEndDate = customDeadline || month.endedDate;
              const isExtended = customDeadline && customDeadline !== month.endedDate;

              const startDate = month.startedDate
                ? new Date(month.startedDate).toLocaleDateString("uz-UZ")
                : "—";
              const endDate = effectiveEndDate
                ? new Date(effectiveEndDate).toLocaleDateString("uz-UZ")
                : "—";

              // Calculate progress
              const now = new Date();
              const start = new Date(month.startedDate);
              const end = new Date(effectiveEndDate);
              let progress = 0;
              if (now >= end) progress = 100;
              else if (now > start) {
                progress = Math.round(((now - start) / (end - start)) * 100);
              }

              return (
                <button
                  key={month.id}
                  onClick={() => navigate(`/student/month/${month.id}`)}
                  className="group rounded-2xl border border-gray-100 bg-white p-5 text-left shadow-md transition-all duration-200 hover:border-indigo-200 hover:shadow-lg"
                >
                  {/* Month name & status */}
                  <div className="flex items-start justify-between">
                    <h3 className="text-lg font-bold text-gray-800 group-hover:text-indigo-700">
                      {month.name}
                    </h3>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusInfo.cls}`}
                    >
                      {statusInfo.icon}
                      {statusInfo.label}
                    </span>
                  </div>

                  {/* Description */}
                  {month.description && (
                    <p className="mt-2 line-clamp-2 text-sm text-gray-500">
                      {month.description}
                    </p>
                  )}

                  {/* Level */}
                  <div className="mt-3 flex items-center text-xs text-gray-500">
                    <MdSchool className="mr-1 text-indigo-400" />
                    {month.level?.name || "—"}
                  </div>

                  {/* Dates */}
                  <div className="mt-3 space-y-1 text-xs text-gray-500">
                    <div className="flex items-center">
                      <MdAccessTime className="mr-1 text-green-500" />
                      <span className="text-gray-400">Boshlash sanasi: </span>
                      <span className="ml-1 font-medium text-gray-700">{startDate}</span>
                    </div>
                    <div className="flex items-center">
                      <MdAccessTime className="mr-1 text-red-400" />
                      <span className="text-gray-400">Tugash sanasi: </span>
                      <span className="ml-1 font-medium text-gray-700">{endDate}</span>
                      {isExtended && (
                        <span className="ml-2 inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-medium text-orange-700">
                          Uzaytirilgan
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                      <span>Davomiyligi</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-gray-100">
                      <div
                        className={`h-1.5 rounded-full transition-all ${
                          progress >= 100
                            ? "bg-green-500"
                            : progress > 50
                            ? "bg-blue-500"
                            : "bg-indigo-500"
                        }`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentMonths;

