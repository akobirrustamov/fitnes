import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ApiCall, { baseUrl } from "../../../config/index";
import {
  MdArrowBack,
  MdPerson,
  MdPhone,
  MdSchool,
  MdBadge,
  MdCalendarToday,
  MdCheckCircle,
  MdHourglassEmpty,
  MdCancel,
  MdDownload,
  MdTopic,
  MdDirections,
} from "react-icons/md";

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return (
    d.toLocaleDateString("uz-UZ") +
    " " +
    d.toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })
  );
};

const getStatusInfo = (status) => {
  const map = {
    0: {
      label: "Tekshiruvda",
      cls: "bg-blue-100 text-blue-800",
      icon: <MdHourglassEmpty className="mr-1 h-4 w-4" />,
    },
    1: {
      label: "Tasdiqlangan",
      cls: "bg-green-100 text-green-800",
      icon: <MdCheckCircle className="mr-1 h-4 w-4" />,
    },
    2: {
      label: "Rad etilgan",
      cls: "bg-red-100 text-red-800",
      icon: <MdCancel className="mr-1 h-4 w-4" />,
    },
  };
  return (
    map[status] || {
      label: "Noma'lum",
      cls: "bg-gray-100 text-gray-500",
      icon: null,
    }
  );
};

const StudentDetail = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [rejaCheckings, setRejaCheckings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejaLoading, setRejaLoading] = useState(true);

  useEffect(() => {
    if (studentId) {
      fetchStudentData();
      fetchStudentRejas();
    }
  }, [studentId]);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      const result = await ApiCall("/api/v1/ilmiy-rahbar/my-students", "GET");
      if (result.error) {
        if (result.data === 401) navigate("/admin/login");
        return;
      }
      const data = result.data;
      let students = [];
      if (Array.isArray(data)) students = data;
      else if (data && Array.isArray(data.data)) students = data.data;
      else if (data && Array.isArray(data.content)) students = data.content;

      const found = students.find((s) => s.id === studentId);
      setStudent(found || null);
    } catch (error) {
      console.error("Talaba ma'lumotlarini olishda xatolik", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentRejas = async () => {
    try {
      setRejaLoading(true);
      const result = await ApiCall(
        "/api/v1/ilmiy-rahbar/my-students-reja",
        "GET"
      );
      if (result.error) {
        console.error("Xatolik:", result.data);
        return;
      }
      const data = result.data;
      let all = [];
      if (Array.isArray(data)) all = data;
      else if (data && Array.isArray(data.data)) all = data.data;
      else if (data && Array.isArray(data.content)) all = data.content;

      // Filter for this student
      const filtered = all.filter(
        (r) => r.student?.id === studentId
      );
      // Sort newest first
      filtered.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB - dateA;
      });
      setRejaCheckings(filtered);
    } catch (error) {
      console.error("Reja ma'lumotlarini olishda xatolik", error);
    } finally {
      setRejaLoading(false);
    }
  };

  const handleDownload = async (fileId, name) => {
    try {
      if (!fileId) return alert("Fayl topilmadi");
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

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
          <p className="text-gray-600">Ma'lumotlar yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <MdPerson className="mx-auto h-16 w-16 text-gray-300" />
          <h2 className="mt-4 text-xl font-semibold text-gray-700">
            Talaba topilmadi
          </h2>
          <button
            onClick={() => navigate("/ilmiy-rahbar/my-students")}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
          >
            <MdArrowBack className="h-5 w-5" />
            Orqaga qaytish
          </button>
        </div>
      </div>
    );
  }

  // Stats
  const totalRejas = rejaCheckings.length;
  const pendingRejas = rejaCheckings.filter((r) => r.status === 0).length;
  const acceptedRejas = rejaCheckings.filter((r) => r.status === 1).length;
  const rejectedRejas = rejaCheckings.filter((r) => r.status === 2).length;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Back Button */}
        <button
          onClick={() => navigate("/ilmiy-rahbar/my-students")}
          className="mb-6 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
        >
          <MdArrowBack className="h-5 w-5" />
          Shogirdlar ro'yxatiga qaytish
        </button>

        {/* Student Profile Card */}
        <div className="mb-6 overflow-hidden rounded-2xl bg-white shadow-lg">
          <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-6 sm:p-8">
            <div className="flex flex-col items-center gap-6 sm:flex-row">
              {/* Avatar */}
              {student.imageFile?.id ? (
                <img
                  src={baseUrl + "/api/v1/file/getFile/" + student.imageFile.id}
                  alt={student.fullName}
                  className="h-24 w-24 rounded-full border-4 border-white/30 object-cover shadow-lg"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white/30 bg-white/20 text-2xl font-bold text-white shadow-lg">
                  {student.fullName
                    ?.split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")}
                </div>
              )}

              {/* Basic Info */}
              <div className="text-center sm:text-left">
                <h1 className="text-2xl font-bold text-white sm:text-3xl">
                  {student.fullName}
                </h1>
                <p className="mt-1 text-lg text-blue-200">
                  {student.shortName}
                </p>
                <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                      student.studentStatus === "active"
                        ? "bg-green-400/20 text-green-100"
                        : "bg-red-400/20 text-red-100"
                    }`}
                  >
                    {student.studentStatus === "active" ? "Faol" : "Nofaol"}
                  </span>
                  {student.level?.name && (
                    <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white">
                      {student.level.name}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Info Grid */}
          <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">

            <div className="flex items-start gap-3 rounded-xl bg-gray-50 p-4">
              <MdPhone className="mt-0.5 h-5 w-5 flex-shrink-0 text-indigo-500" />
              <div>
                <p className="text-xs font-medium text-gray-500">Telefon</p>
                <p className="text-sm font-semibold text-gray-800">
                  {student.phone || "—"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl bg-gray-50 p-4">
              <MdPerson className="mt-0.5 h-5 w-5 flex-shrink-0 text-indigo-500" />
              <div>
                <p className="text-xs font-medium text-gray-500">Jinsi</p>
                <p className="text-sm font-semibold text-gray-800">
                  {student.gender === "male" ? "Erkak" : student.gender === "female" ? "Ayol" : student.gender || "—"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl bg-gray-50 p-4">
              <MdCalendarToday className="mt-0.5 h-5 w-5 flex-shrink-0 text-indigo-500" />
              <div>
                <p className="text-xs font-medium text-gray-500">
                  Tug'ilgan sana
                </p>
                <p className="text-sm font-semibold text-gray-800">
                  {student.birthDate
                    ? new Date(student.birthDate).toLocaleDateString("uz-UZ")
                    : "—"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl bg-gray-50 p-4">
              <MdDirections className="mt-0.5 h-5 w-5 flex-shrink-0 text-indigo-500" />
              <div>
                <p className="text-xs font-medium text-gray-500">Yo'nalish</p>
                <p className="text-sm font-semibold text-gray-800">
                  {student.direction || "—"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl bg-gray-50 p-4">
              <MdTopic className="mt-0.5 h-5 w-5 flex-shrink-0 text-indigo-500" />
              <div>
                <p className="text-xs font-medium text-gray-500">
                  Tanlangan mavzu
                </p>
                <p className="text-sm font-semibold text-gray-800">
                  {student.chosenTopic || "—"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl bg-gray-50 p-4">
              <MdSchool className="mt-0.5 h-5 w-5 flex-shrink-0 text-indigo-500" />
              <div>
                <p className="text-xs font-medium text-gray-500">
                  Ilmiy rahbar
                </p>
                <p className="text-sm font-semibold text-gray-800">
                  {student.ilmiyRahber?.name || student.ilmiyRahber?.phone || "—"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl bg-gray-50 p-4">
              <MdCalendarToday className="mt-0.5 h-5 w-5 flex-shrink-0 text-indigo-500" />
              <div>
                <p className="text-xs font-medium text-gray-500">Yaratilgan</p>
                <p className="text-sm font-semibold text-gray-800">
                  {student.createdAt
                    ? formatDate(student.createdAt)
                    : "—"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl bg-gray-50 p-4">
              <MdCalendarToday className="mt-0.5 h-5 w-5 flex-shrink-0 text-indigo-500" />
              <div>
                <p className="text-xs font-medium text-gray-500">
                  Yangilangan
                </p>
                <p className="text-sm font-semibold text-gray-800">
                  {student.updatedAt
                    ? formatDate(student.updatedAt)
                    : "—"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Reja Statistics */}
        <div className="mb-6 overflow-hidden rounded-2xl bg-white shadow-lg">
          <div className="border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-5">
            <h2 className="text-xl font-bold text-gray-800">
              Reja va tekshiruv natijalari
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Shogirdning barcha reja topshiriqlari va ularning holatlari
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4 border-b border-gray-100 px-6 py-4 sm:grid-cols-4">
            <div className="rounded-xl bg-gray-50 p-4 text-center">
              <p className="text-2xl font-bold text-gray-700">{totalRejas}</p>
              <p className="text-xs font-medium text-gray-500">
                Umumiy rejalar
              </p>
            </div>
            <div className="rounded-xl bg-blue-50 p-4 text-center">
              <p className="text-2xl font-bold text-blue-700">{pendingRejas}</p>
              <p className="text-xs font-medium text-blue-600">Tekshiruvda</p>
            </div>
            <div className="rounded-xl bg-green-50 p-4 text-center">
              <p className="text-2xl font-bold text-green-700">
                {acceptedRejas}
              </p>
              <p className="text-xs font-medium text-green-600">Tasdiqlangan</p>
            </div>
            <div className="rounded-xl bg-red-50 p-4 text-center">
              <p className="text-2xl font-bold text-red-700">{rejectedRejas}</p>
              <p className="text-xs font-medium text-red-600">Rad etilgan</p>
            </div>
          </div>

          {/* Reja Table */}
          {rejaLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
                <p className="text-gray-600">Rejalar yuklanmoqda...</p>
              </div>
            </div>
          ) : rejaCheckings.length === 0 ? (
            <div className="p-12 text-center">
              <MdSchool className="mx-auto h-16 w-16 text-gray-300" />
              <h3 className="mt-4 text-lg font-semibold text-gray-700">
                Rejalar topilmadi
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Ushbu shogird hali reja topshirmagan.
              </p>
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
                      Talaba izohi
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Joriy tekshiruvchi
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Tekshiruvchi izohi
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Bosqich
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Holati
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Fayl
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Yuklangan sana
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      O'zgartirilgan
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {rejaCheckings.map((item, idx) => {
                    const statusInfo = getStatusInfo(item.status);
                    const rejaName = item.reja?.name || "—";
                    const fileId = item.file?.id || null;
                    const checkerName =
                      item.currentChecker?.name ||
                      item.currentChecker?.phone ||
                      "—";

                    return (
                      <tr
                        key={item.id}
                        className="transition hover:bg-gray-50"
                      >
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                          {idx + 1}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                          {rejaName}
                        </td>
                        <td className="max-w-[180px] px-4 py-3 text-sm text-gray-600">
                          <p className="truncate" title={item.descStudent}>
                            {item.descStudent || "—"}
                          </p>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs text-indigo-700">
                              <MdPerson className="h-3.5 w-3.5" />
                            </span>
                            {checkerName}
                          </div>
                        </td>
                        <td className="max-w-[180px] px-4 py-3 text-sm text-gray-600">
                          <p className="truncate" title={item.descChecker}>
                            {item.descChecker || "—"}
                          </p>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                          <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                            {item.checkerIndex != null
                              ? `${item.checkerIndex}-bosqich`
                              : "—"}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm">
                          <span
                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusInfo.cls}`}
                          >
                            {statusInfo.icon}
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm">
                          {fileId ? (
                            <button
                              onClick={() =>
                                handleDownload(fileId, rejaName)
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-100"
                            >
                              <MdDownload className="h-4 w-4" />
                              Yuklab olish
                            </button>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                          {formatDate(item.createdAt)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                          {formatDate(item.changedAt)}
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
    </div>
  );
};

export default StudentDetail;

