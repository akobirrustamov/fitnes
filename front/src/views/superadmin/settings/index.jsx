import React, { useEffect, useState } from "react";
import ApiCall from "../../../config";

export default function SettingsPage() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadHealthStatus();
  }, []);

  const loadHealthStatus = async () => {
    setLoading(true);
    const result = await ApiCall("/api/v1/systemC/healthStatus", "GET");
    setLoading(false);
    if (!result?.error) {
      setHealth(result.data);
      setError("");
    } else {
      setHealth(null);
      setError("Xizmat holatini olishda xatolik yuz berdi.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Sozlamalar</h1>
              <p className="mt-1 text-sm text-slate-600">
                Umumiy tizim sozlamalari va xizmat holatini ko'rish.
              </p>
            </div>
            <button
              onClick={loadHealthStatus}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
            >
              Yangilash
            </button>
          </div>

          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h2 className="text-lg font-semibold text-slate-900">Xizmat holati</h2>
              <p className="mt-2 text-sm text-slate-600">
                Ushbu sahifa API holatini tekshiradi.
              </p>
              <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
                {loading ? (
                  <p className="text-sm text-slate-500">Yuklanmoqda…</p>
                ) : error ? (
                  <p className="text-sm text-red-600">{error}</p>
                ) : health ? (
                  <div className="space-y-2 text-sm text-slate-700">
                    <div>
                      <span className="font-semibold">Status:</span> {health.status || "—"}
                    </div>
                    <div>
                      <span className="font-semibold">Vaqt:</span> {health.timestamp || "—"}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">Ma'lumot yo'q.</p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h2 className="text-lg font-semibold text-slate-900">Qo'shimcha sozlamalar</h2>
              <p className="mt-2 text-sm text-slate-600">
                Tizimdagi boshqa sozlamalar va fayl yuklash funksiyalari bu sahifada
                keyinchalik qo'shiladi.
              </p>
              <div className="mt-4 rounded-2xl bg-white p-4 text-sm text-slate-700 shadow-sm">
                Hozircha faqat holat tekshiruvi mavjud. Fayl yuklash API-si keyinchalik
                qo'llanilishi mumkin.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
