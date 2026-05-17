import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ApiCall from "../../../config";

function StudentProfileOverview() {
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [editPhone, setEditPhone] = useState(false);
  const [phoneValue, setPhoneValue] = useState("");
  useEffect(() => {
    if (student?.phone) {
      setPhoneValue(student.phone);
    }
  }, [student]);
  const token = localStorage.getItem("authToken");
  const studentId = localStorage.getItem("studentId");

  useEffect(() => {
    loadStudent();
  }, []);

  const loadStudent = async () => {
    try {
      let response;

      // studentId bo'lsa — GET /api/v1/student/{id}
      if (studentId) {
        response = await ApiCall(`/api/v1/student/${studentId}`, "GET");
        if (!response.error && response.data) {
          const studentData = response.data?.data || response.data;
          setStudent(studentData);
          return;
        }
      }

      // Fallback — decode endpoint
      response = await ApiCall("/api/v1/student/decode", "GET");
      if (!response.error && response.data) {
        setStudent(response.data);
        return;
      }

      navigate("/student/login");
    } catch (error) {
      navigate("/student/login");
      console.error("Error fetching student:", error);
    }
  };

  const updatePassword = async () => {
    if (password !== confirmPassword) {
      setPasswordError("Parollar mos emas!");
      return;
    }

    if (password.length < 8) {
      setPasswordError("Parol kamida 8 ta belgidan iborat bo'lishi kerak.");
      return;
    }

    setPasswordError("");
    setLoading(true);

    try {
      const dto = {
        password: password,
      };

      const response = await ApiCall(`/api/v1/student/password/${student.id}`, "PUT", dto);

      setSuccessMessage("Parol muvaffaqiyatli o'zgartirildi!");
      setPassword("");
      setConfirmPassword("");

      // 3 soniyadan keyin xabarni yo'q qilish
      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (error) {
      console.error("Password update error:", error);
      setPasswordError("Parolni o'zgartirishda xatolik yuz berdi!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="mx-auto max-w-4xl">
        {/* Sarlavha qismi */}
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-gray-800">
            Profil Sozlamalari
          </h1>
          <p className="text-gray-600">
            Shaxsiy ma'lumotlaringiz va xavfsizlik sozlamalarini boshqaring
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Chap panel - Talaba ma'lumotlari */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-lg">
              <div className="mb-6 flex flex-col items-center">
                <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-indigo-600">
                  <span className="text-3xl font-bold text-white">
                    {student?.firstName?.charAt(0) || "T"}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-gray-800">
                  {student?.firstName} {student?.lastName}
                </h2>
                <p className="mt-1 text-gray-600">{student?.studentIdNumber}</p>
                <div className="mt-3 rounded-full bg-blue-100 px-4 py-1 text-sm font-medium text-blue-700">
                  Talaba
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center text-gray-700">
                  <svg
                    className="mr-3 h-5 w-5 text-blue-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  <span>{student?.email || "Email kiritilmagan"}</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <svg
                    className="mr-3 h-5 w-5 text-blue-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>

                  {!editPhone ? (
                    <>
                      <span className="mr-2">
                        {student?.phone || "Telefon raqam kiritilmagan"}
                      </span>

                      {/* ✏️ EDIT ICON */}
                      <button
                        onClick={() => setEditPhone(true)}
                        className="text-gray-400 transition hover:text-blue-600"
                        title="Telefonni tahrirlash"
                      >
                        ✏️
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        type="tel"
                        value={phoneValue}
                        maxLength={13}
                        onChange={(e) => {
                          let value = e.target.value;
                          if (!value.startsWith("+998")) value = "+998";
                          if (!/^[+0-9]*$/.test(value)) return;
                          if (value.length > 13) return;
                          setPhoneValue(value);
                        }}
                        className="w-40 rounded-lg border px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500"
                      />

                      {/* 💾 Save */}
                      <button
                        onClick={async () => {
                          try {
                            await ApiCall(
                              `/api/v1/student/phone/${student.id}`,
                              "PUT",
                              { phone: phoneValue }
                            );
                            setStudent((prev) => ({
                              ...prev,
                              phone: phoneValue,
                            }));
                            setEditPhone(false);
                          } catch (e) {
                            alert("Telefonni saqlashda xatolik");
                          }
                        }}
                        className="text-green-600 hover:text-green-800"
                        title="Saqlash"
                      >
                        ✔
                      </button>

                      {/* ❌ Cancel */}
                      <button
                        onClick={() => {
                          setPhoneValue(student.phone || "+998");
                          setEditPhone(false);
                        }}
                        className="text-red-500 hover:text-red-700"
                        title="Bekor qilish"
                      >
                        ✖
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* O'ng panel - Parol o'zgartirish */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-lg">
              <div className="mb-8 flex items-center">
                <div className="mr-4 rounded-xl bg-blue-100 p-3">
                  <svg
                    className="h-6 w-6 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    Parolni O'zgartirish
                  </h2>
                  <p className="text-gray-600">
                    Xavfsiz parol yarating va himoyangizni mustahkamlang
                  </p>
                </div>
              </div>

              {/* Muvaffaqiyat xabari */}
              {successMessage && (
                <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4">
                  <div className="flex items-center">
                    <svg
                      className="mr-3 h-5 w-5 text-green-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="font-medium text-green-700">
                      {successMessage}
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-6">
                {/* Yangi parol input */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Yangi Parol
                    <span className="ml-1 text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 transition-all duration-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      placeholder="Kamida 8 ta belgidan iborat bo'lsin"
                      value={password}
                      disabled={loading}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-3 text-gray-500 transition-colors hover:text-blue-600"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Parolni tasdiqlash input */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Parolni Tasdiqlang
                    <span className="ml-1 text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 transition-all duration-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      placeholder="Parolni qayta kiriting"
                      value={confirmPassword}
                      disabled={loading}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-3 text-gray-500 transition-colors hover:text-blue-600"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      {showConfirmPassword ? (
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Parol talablari */}
                <div className="rounded-xl bg-gray-50 p-4">
                  <h4 className="mb-2 font-medium text-gray-700">
                    Parol talablari:
                  </h4>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li className="flex items-center">
                      <svg
                        className={`mr-2 h-4 w-4 ${
                          password.length >= 8
                            ? "text-green-500"
                            : "text-gray-400"
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Kamida 8 ta belgi
                    </li>
                    <li className="flex items-center">
                      <svg
                        className={`mr-2 h-4 w-4 ${
                          password === confirmPassword && password.length > 0
                            ? "text-green-500"
                            : "text-gray-400"
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Parollar mos kelishi
                    </li>
                  </ul>
                </div>

                {/* Xatolik xabari */}
                {passwordError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                    <div className="flex items-center">
                      <svg
                        className="mr-3 h-5 w-5 text-red-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="font-medium text-red-700">
                        {passwordError}
                      </span>
                    </div>
                  </div>
                )}

                {/* Tugma */}
                <div className="pt-4">
                  <button
                    onClick={updatePassword}
                    disabled={loading || !password || !confirmPassword}
                    className={`flex w-full items-center justify-center rounded-xl py-3 px-4 font-medium transition-all duration-300 ${
                      loading || !password || !confirmPassword
                        ? "cursor-not-allowed bg-gray-300 text-gray-500"
                        : "transform bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg hover:-translate-y-0.5 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl"
                    }`}
                  >
                    {loading ? (
                      <>
                        <svg
                          className="-ml-1 mr-3 h-5 w-5 animate-spin text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Saqlanmoqda...
                      </>
                    ) : (
                      <>
                        <svg
                          className="mr-2 h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                          />
                        </svg>
                        Parolni Yangilash
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Xavfsizlik maslahatlari */}
              <div className="mt-8 border-t border-gray-100 pt-6">
                <h4 className="mb-3 font-medium text-gray-700">
                  Xavfsizlik maslahatlari:
                </h4>
                <ul className="grid grid-cols-1 gap-3 text-sm text-gray-600 md:grid-cols-2">
                  <li className="flex items-center">
                    <svg
                      className="mr-2 h-4 w-4 text-green-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Har oyda parolni yangilang
                  </li>
                  <li className="flex items-center">
                    <svg
                      className="mr-2 h-4 w-4 text-green-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Boshqalar bilan baham ko'rmang
                  </li>
                  <li className="flex items-center">
                    <svg
                      className="mr-2 h-4 w-4 text-green-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Raqam va belgilar qo'shing
                  </li>
                  <li className="flex items-center">
                    <svg
                      className="mr-2 h-4 w-4 text-green-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Turli xil parollardan foydalaning
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentProfileOverview;
