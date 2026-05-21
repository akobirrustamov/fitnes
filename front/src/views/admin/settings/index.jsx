import React, { useEffect, useState } from "react";
import ApiCall from "../../../config";
import { Info, Save } from "lucide-react";

const FIELD_INFO = {
  opening_time: "Zal ochilish vaqti. Abonentlar faqat shu vaqtdan boshlab kirishi mumkin.",
  closing_time: "Zal yopilish vaqti. Shu vaqtdan keyin kirish taqiqlanadi.",
  price_per_user: "Abonentning oylik to'lov narxi (so'm). Bu narx obunani uzaytirishda default sifatida chiqadi.",
  max_users_count: "Zalga ruxsat berilgan maksimal abonentlar soni (superadmin tomonidan belgilanadi).",
  max_terminals_count: "Zalga ruxsat berilgan maksimal FaceID terminallar soni (superadmin tomonidan belgilanadi).",
  max_graphics_count: "Zalga ruxsat berilgan maksimal grafiklar soni (superadmin tomonidan belgilanadi).",
};

const FIELD_LABELS = {
  opening_time: "Ochilish vaqti",
  closing_time: "Yopilish vaqti",
  price_per_user: "Narxi (so'm/oy)",
  max_users_count: "Maks. abonentlar",
  max_terminals_count: "Maks. terminallar",
  max_graphics_count: "Maks. grafiklar",
};

const EDITABLE_FIELDS = ["opening_time", "closing_time", "price_per_user"];

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [tooltip, setTooltip] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    const result = await ApiCall("/api/v1/admin/settings/getMine", "GET");
    setLoading(false);
    if (!result?.error) {
      const data = result.data || {};
      setSettings(data);
      setForm({
        opening_time: data.opening_time || "",
        closing_time: data.closing_time || "",
        price_per_user: data.price_per_user?.toString() || "0",
        max_users_count: data.max_users_count || "",
        max_terminals_count: data.max_terminals_count || "",
        max_graphics_count: data.max_graphics_count || "",
      });
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaveLoading(true);
    setMessage("");
    const payload = {
      opening_time: form.opening_time,
      closing_time: form.closing_time,
      price_per_user: Number(form.price_per_user),
    };
    const result = await ApiCall("/api/v1/admin/settings/updateMine", "PUT", payload);
    setSaveLoading(false);
    if (!result?.error) {
      setMessage("Sozlamalar muvaffaqiyatli saqlandi.");
      await fetchSettings();
    } else {
      setMessage("Xatolik yuz berdi. Iltimos qayta urinib ko'ring.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-400 shadow-sm">
            Sozlamalar yuklanmoqda...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-gray-900">Sozlamalar</h1>
          <p className="mt-1 text-sm text-gray-600">
            Zalning ish vaqti va narx sozlamalarini o'zgartirish.
          </p>
        </div>

        {settings && (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-semibold text-gray-800">Zal sozlamalari</h2>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
                Ish vaqti va narxni tahrirlash mumkin
              </span>
            </div>

            {message && (
              <div
                className={`mb-4 rounded-xl p-3 text-sm ${
                  message.includes("xato") || message.includes("Xato")
                    ? "bg-red-50 text-red-700"
                    : "bg-green-50 text-green-700"
                }`}
              >
                {message}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              {Object.keys(FIELD_LABELS).map((key) => {
                const editable = EDITABLE_FIELDS.includes(key);
                const isTime = key === "opening_time" || key === "closing_time";
                return (
                  <div key={key} className="flex items-start gap-4">
                    <div className="w-44 shrink-0 pt-2.5">
                      <div className="flex items-center gap-1">
                        <label className="text-sm font-medium text-gray-700">
                          {FIELD_LABELS[key]}
                        </label>
                        <button
                          type="button"
                          className="text-gray-400 hover:text-gray-600"
                          onMouseEnter={() => setTooltip(key)}
                          onMouseLeave={() => setTooltip(null)}
                        >
                          <Info size={13} />
                        </button>
                      </div>
                      {tooltip === key && (
                        <div className="mt-1 rounded-lg bg-gray-800 px-3 py-2 text-xs leading-relaxed text-white shadow-lg">
                          {FIELD_INFO[key]}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 items-center gap-2">
                      <input
                        type={isTime ? "time" : "number"}
                        value={form[key] || ""}
                        onChange={(e) =>
                          editable &&
                          setForm((prev) => ({ ...prev, [key]: e.target.value }))
                        }
                        readOnly={!editable}
                        min={isTime ? undefined : 0}
                        className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none ${
                          editable
                            ? "border-gray-200 bg-gray-50 text-gray-900 focus:border-gray-400"
                            : "cursor-not-allowed border-gray-100 bg-gray-100 text-gray-400"
                        }`}
                      />
                      {!editable && (
                        <span className="shrink-0 rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-500 whitespace-nowrap">
                          Faqat ko'rish
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={saveLoading}
                  className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-700 disabled:opacity-60"
                >
                  <Save size={15} />
                  {saveLoading ? "Saqlanmoqda..." : "Saqlash"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
