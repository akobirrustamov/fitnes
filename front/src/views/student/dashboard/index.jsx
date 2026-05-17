import ModalForcePasswordChange from "../profile/CheckPassword";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ApiCall, { baseUrl } from "../../../config";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  MdPerson,
  MdPhone,
  MdSchool,
  MdBadge,
  MdCalendarToday,
  MdSupervisorAccount,
  MdCheckCircle,
  MdCancel,
  MdMale,
  MdFemale,
} from "react-icons/md";

const Dashboard = () => {
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [forcePasswordChange, setForcePasswordChange] = useState(false);

  const token = localStorage.getItem("authToken");
  const studentId = localStorage.getItem("studentId");

  // ✅ Token tekshirish
  const checkLogin = () => {
    if (!token) {
      navigate("/student/login");
      return false;
    }
    return true;
  };

  // ✅ Talaba ma'lumotlarini olish
  const loadStudent = async () => {
    if (!checkLogin()) return;
    try {
      let response;

      // 1) studentId bo'lsa — GET /api/v1/student/{id} orqali olish
      if (studentId) {
        response = await ApiCall(`/api/v1/student/${studentId}`, "GET");
        if (!response.error && response.data) {
          // Backend buildSuccessResponse ichida data key bor
          const studentData = response.data?.data || response.data;
          setStudent(studentData);
          if (studentData?.forcePasswordChange) {
            setForcePasswordChange(true);
          }
          setLoading(false);
          return;
        }
      }

      // 2) Fallback — decode endpoint
      response = await ApiCall("/api/v1/student/decode", "GET");
      if (!response.error && response.data) {
        setStudent(response.data);
        if (response.data?.forcePasswordChange) {
          setForcePasswordChange(true);
        }
        setLoading(false);
        return;
      }

      // 3) Hech biri ishlamasa — login sahifasiga yo'naltirish
      toast.error("Ma'lumotlarni olishda xatolik!");
      navigate("/student/login");
    } catch (error) {
      console.error("Error fetching student:", error);
      navigate("/student/login");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudent();
  }, []);

  // Loading holati
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
          <span className="mt-4 block text-lg text-gray-600">
            Ma'lumotlar yuklanmoqda...
          </span>
        </div>
      </div>
    );
  }

  // Ma'lumot topilmadi
  if (!student) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <MdCancel className="mx-auto h-16 w-16 text-red-400" />
          <h2 className="mt-4 text-xl font-semibold text-gray-700">
            Ma'lumot topilmadi
          </h2>
          <p className="mt-2 text-gray-500">
            Iltimos, qayta tizimga kiring
          </p>
          <button
            onClick={() => navigate("/student/login")}
            className="mt-4 rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
          >
            Tizimga kirish
          </button>
        </div>
      </div>
    );
  }

  const birthDateFormatted = student.birthDate
    ? new Date(student.birthDate).toLocaleDateString("uz-UZ", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Kiritilmagan";

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <ToastContainer />

      {/* Force password change modal */}
      <ModalForcePasswordChange
        open={forcePasswordChange}
        student={student}
        onSuccess={() => {
          setForcePasswordChange(false);
          toast.success("Parol muvaffaqiyatli o'zgartirildi!");
          loadStudent();
        }}
      />

      <div className="mx-auto max-w-5xl">
        {/* ===== Header Card ===== */}
        <div className="mb-8 overflow-hidden rounded-2xl bg-white shadow-lg">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-8 sm:px-10">
            <div className="flex flex-col items-center gap-6 sm:flex-row">
              {/* Avatar / Rasm */}
              <div className="flex-shrink-0">
                {student.imageFileId ? (
                  <img
                    src={`${baseUrl}/api/v1/file/getFile/${student.imageFileId}`}
                    alt={student.fullName}
                    className="h-24 w-24 rounded-full border-4 border-white/30 object-cover shadow-lg"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white/30 bg-white/20 shadow-lg">
                    <span className="text-4xl font-bold text-white">
                      {student.firstName?.charAt(0) || "T"}
                    </span>
                  </div>
                )}
              </div>

              {/* Ism va status */}
              <div className="text-center sm:text-left">
                <h1 className="text-2xl font-bold text-white sm:text-3xl">
                  {student.fullName || "Talaba"}
                </h1>
                {student.shortName && (
                  <p className="mt-1 text-blue-200">{student.shortName}</p>
                )}
                <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                      student.studentStatus === "active"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {student.studentStatus === "active" ? (
                      <MdCheckCircle className="mr-1" />
                    ) : (
                      <MdCancel className="mr-1" />
                    )}
                    {student.studentStatus === "active" ? "Faol" : "Nofaol"}
                  </span>
                  {student.levelName && (
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
                      <MdSchool className="mr-1" />
                      {student.levelName}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===== Ma'lumotlar Grid ===== */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Shaxsiy Ma'lumotlar */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-lg">
            <h2 className="mb-5 flex items-center text-lg font-bold text-gray-800">
              <MdPerson className="mr-2 text-blue-600" size={24} />
              Shaxsiy ma'lumotlar
            </h2>
            <div className="space-y-4">
              <InfoRow label="Ism" value={student.firstName} />
              <InfoRow label="Otasi ismi" value={student.secondName} />
              <InfoRow label="Familya" value={student.thirdName} />
              <InfoRow
                label="Jinsi"
                value={
                  student.gender === "Male" ? (
                    <span className="inline-flex items-center text-blue-700">
                      <MdMale className="mr-1" /> Erkak
                    </span>
                  ) : student.gender === "Female" ? (
                    <span className="inline-flex items-center text-pink-700">
                      <MdFemale className="mr-1" /> Ayol
                    </span>
                  ) : (
                    student.gender || "Kiritilmagan"
                  )
                }
              />
              <InfoRow
                label="Tug'ilgan sana"
                value={birthDateFormatted}
                icon={<MdCalendarToday className="text-blue-500" />}
              />
            </div>
          </div>

          {/* O'quv Ma'lumotlari */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-lg">
            <h2 className="mb-5 flex items-center text-lg font-bold text-gray-800">
              <MdSchool className="mr-2 text-indigo-600" size={24} />
              O'quv ma'lumotlari
            </h2>
            <div className="space-y-4">
              <InfoRow
                label="Talaba ID raqami"
                value={student.studentIdNumber}
                icon={<MdBadge className="text-indigo-500" />}
              />
              <InfoRow
                label="Telefon"
                value={student.phone}
                icon={<MdPhone className="text-green-500" />}
              />
              <InfoRow
                label="Daraja"
                value={
                  student.levelName ? (
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                      {student.levelName}
                    </span>
                  ) : (
                    "Belgilanmagan"
                  )
                }
              />
              <InfoRow
                label="Ilmiy rahbar"
                value={
                  student.ilmiyRahberName ? (
                    <span className="inline-flex items-center text-gray-800">
                      <MdSupervisorAccount className="mr-1 text-purple-500" />
                      {student.ilmiyRahberName}
                    </span>
                  ) : (
                    "Belgilanmagan"
                  )
                }
              />
              <InfoRow
                label="Holati"
                value={
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                      student.studentStatus === "active"
                        ? "bg-green-50 text-green-700"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    {student.studentStatus === "active" ? (
                      <>
                        <MdCheckCircle className="mr-1" /> Faol
                      </>
                    ) : (
                      <>
                        <MdCancel className="mr-1" /> Nofaol
                      </>
                    )}
                  </span>
                }
              />
            </div>
          </div>
        </div>

        {/* ===== Tezkor havolalar ===== */}
        <div className="mt-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-lg">
          <h2 className="mb-5 text-lg font-bold text-gray-800">
            Tezkor havolalar
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <QuickLink
              title="Profil sozlamalari"
              description="Parolni o'zgartirish va profil ma'lumotlari"
              icon={<MdPerson className="h-8 w-8 text-blue-600" />}
              onClick={() => navigate("/student/profile")}
              color="blue"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// ===== Yordamchi komponentlar =====

const InfoRow = ({ label, value, icon }) => (
  <div className="flex items-start justify-between border-b border-gray-50 pb-3 last:border-0 last:pb-0">
    <span className="flex items-center text-sm text-gray-500">
      {icon && <span className="mr-2">{icon}</span>}
      {label}
    </span>
    <span className="text-right text-sm font-medium text-gray-800">
      {value || "Kiritilmagan"}
    </span>
  </div>
);

const QuickLink = ({ title, description, icon, onClick, color }) => (
  <button
    onClick={onClick}
    className={`group flex items-start gap-4 rounded-xl border border-gray-100 p-4 text-left transition-all duration-200 hover:border-${color}-200 hover:bg-${color}-50 hover:shadow-md`}
  >
    <div
      className={`flex-shrink-0 rounded-lg bg-${color}-50 p-2 group-hover:bg-${color}-100`}
    >
      {icon}
    </div>
    <div>
      <h3 className="font-semibold text-gray-800">{title}</h3>
      <p className="mt-1 text-xs text-gray-500">{description}</p>
    </div>
  </button>
);

export default Dashboard;
