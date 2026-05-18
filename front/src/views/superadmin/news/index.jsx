import React from "react";

export default function NewsPage() {
  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Yangiliklar</h1>
              <p className="mt-1 text-sm text-slate-600">
                Yangiliklar sahifasi uchun tezkor ko'rinish.
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-slate-700 shadow-sm">
            <p className="text-sm">
              Yangiliklar ma'lumotlari backendda tashkilot doirasida saqlanadi. Superadmin
              uchun umumiy yangiliklar CRUD interfeysi keyingi bosqichda qo'shiladi.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
