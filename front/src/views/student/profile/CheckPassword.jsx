import React, { useState } from "react";
import ApiCall from "../../../config/index";

export default function ModalForcePasswordChange({ open, student, onSuccess }) {
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    if (!open || !student) return null;

    const updatePassword = async () => {
        if (password.length < 8) {
            setError("Parol kamida 8 ta belgidan iborat bo'lishi kerak!");
            return;
        }

        if (password !== confirm) {
            setError("Parollar mos emas!");
            return;
        }

        setError("");
        setLoading(true);

        try {
            const dto = {
                password: password,
            };

            await ApiCall(`/api/v1/student/password/${student.id}`, "PUT", dto);

            onSuccess();
        } catch (err) {
            setError("Parolni o'zgartirishda xatolik yuz berdi. Qayta urinib ko'ring.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 p-8 rounded-2xl w-full max-w-lg mx-4 shadow-2xl">

                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-red-500 to-yellow-500 rounded-full mb-4">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Parolni Almashtiring</h2>
                    <p className="text-gray-300">Tizimdan foydalanishni davom ettirish uchun yangi parol kiriting.</p>
                </div>

                <div className="space-y-4">
                    {/* Yangi Parol */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Yangi parol</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-700 rounded-xl text-white"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Kamida 8 ta belgi"
                            />
                            <button
                                type="button"
                                className="absolute right-3 top-3 text-gray-400"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                👁
                            </button>
                        </div>
                    </div>

                    {/* Tasdiqlash */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Parolni tasdiqlang</label>
                        <div className="relative">
                            <input
                                type={showConfirm ? "text" : "password"}
                                className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-700 rounded-xl text-white"
                                value={confirm}
                                onChange={(e) => setConfirm(e.target.value)}
                                placeholder="Parolni qayta kiriting"
                            />
                            <button
                                type="button"
                                className="absolute right-3 top-3 text-gray-400"
                                onClick={() => setShowConfirm(!showConfirm)}
                            >
                                👁
                            </button>
                        </div>
                    </div>
                    {/* Error */}
                    {error && (
                        <div className="bg-red-900 border border-red-700 rounded-xl p-3 text-red-300 text-sm">
                            {error}
                        </div>
                    )}
                    {/* Button */}
                    <button
                        onClick={updatePassword}
                        disabled={loading}
                        className="w-full py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold rounded-xl"
                    >
                        {loading ? "Saqlanmoqda..." : "Parolni o'zgartirish"}
                    </button>
                </div>

                <p className="text-gray-400 text-center text-sm mt-4">❗ Bu oynani yopib bo‘lmaydi.</p>
            </div>
        </div>
    );
}
