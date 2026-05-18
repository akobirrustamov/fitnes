import React, { useEffect, useState } from "react";
import ApiCall from "../../../config";
import { Info, Save } from "lucide-react";

const FIELD_INFO = {
  opening_time: "Zal ochilish vaqti. Abonentlar faqat shu vaqtdan boshlab kirishi mumkin.",
  closing_time: "Zal yopilish vaqti. Shu vaqtdan keyin kirish taqiqlanadi.",
  price_per_user: "Abonentning oylik to'lov narxi (so'm). Bu narx obunani uzaytirishda default sifatida chiqadi.",
  max_users_count: "Zalga ruxsat berilgan maksimal abonentlar soni.",
  max_terminals_count: "Zalga ruxsat berilgan maksimal FaceID terminallar soni.",
  max_graphics_count: "Zalga ruxsat berilgan maksimal grafiklar soni.",
};

const EDITABLE_FIELDS = ["opening_time", "closing_time", "price_per_user"];

const FIELD_LABELS = {
  opening_time: "Ochilish vaqti",
  closing_time: "Yopilish vaqti",
  price_per_user: "Narxi (so'm/oy)",
  max_users_count: "Maks. abonentlar",
  max_terminals_count: "Maks. terminallar",
  max_graphics_count: "Maks. grafiklar",
};

export default function SettingsPage() {
  const [provinces, setProvinces] = useState([]);
  const [regions, setRegions] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedOrg, setSelectedOrg] = useState("");
  const [settings, setSettings] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [tooltip, setTooltip] = useState(null);

  const safeArray = (v) => (Array.isArray(v) ? v : []);

  useEffect(() => {
    fetchProvinces();
  }, []);

  useEffect(() => {
    if (selectedProvince) fetchRegions(selectedProvince);
    else setRegions([]);
    setSelectedRegion("");
    setSelectedOrg("");
    setOrganizations([]);
  }, [selectedProvince]);

  useEffect(() => {
    fetchOrganizations();
    setSelectedOrg("");
  }, [selectedRegion, selectedProvince]);

  useEffect(() => {
    if (selectedOrg) fetchSettings(selectedOrg);
    else { setSettings(null); setForm({}); }
  }, [selectedOrg]);

  const fetchProvinces = async () => {
    const result = await ApiCall("/api/v1/admin/provinces/getAll", "GET");
    if (!result?.error) setProvinces(result.data || []);
  };

  const fetchRegions = async (provinceId) => {
    const result = await ApiCall("/api/v1/admin/regions/getAll", "GET", null, { provinceId, page: 1, pageSize: 200 });
    if (!result?.error) setRegions(result.data?.data || result.data?.content || result.data || []);
  };

  const fetchOrganizations = async () => {
    const params = { page: 1, limit: 200 };
    if (selectedProvince) params.provinceId = selectedProvince;
    if (selectedRegion) params.regionId = selectedRegion;
    const result = await ApiCall("/api/v1/admin/organizations/getAll", "GET", null, params);
    if (!result?.error) setOrganizations(result.data?.data || result.data?.content || result.data || []);
  };

  const fetchSettings = async (orgId) => {
    setLoading(true);
    const result = await ApiCall(`/api/v1/admin/settings/getByOrgId?orgId=${orgId}`, "GET");
    setLoading(false);
    if (!result?.error) {
      const data = result.data || {};
      setSettings(data);
      setForm({
        opening_time: data.opening_time || data.openingTime || "",
        closing_time: data.closing_time || data.closingTime || "",
        price_per_user: data.price_per_user?.toString() || data.pricePerUser?.toString() || "",
        max_users_count: data.max_users_count || data.maxUsersCount || "",
        max_terminals_count: data.max_terminals_count || data.maxTerminalsCount || "",
        max_graphics_count: data.max_graphics_count || data.maxGraphicsCount || "",
      });
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaveLoading(true);
    const payload = {
      opening_time: form.opening_time,
      closing_time: form.closing_time,
      price_per_user: Number(form.price_per_user),
      max_users_count: Number(form.max_users_count),
      max_terminals_count: Number(form.max_terminals_count),
      max_graphics_count: Number(form.max_graphics_count),
    };
    const result = await ApiCall(`/api/v1/admin/settings/update?orgId=${selectedOrg}`, "PUT", payload);
    setSaveLoading(false);
    if (!result?.error) {
      setMessage("Sozlamalar saqlandi.");
      await fetchSettings(selectedOrg);
    } else {
      setMessage("Xatolik yuz berdi.");
    }
  };

  const filteredRegions = safeArray(regions);
  const orgList = safeArray(organizations);

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">Sozlamalar</h1>
          <p className="mt-1 text-sm text-slate-600">
            Zalning API sozlamalarini ko'rish va o'zgartirish. Avval zaleni tanlang.
          </p>
        </div>

        {/* Filters */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">Zalni tanlash</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Viloyat</label>
              <select
                value={selectedProvince}
                onChange={(e) => setSelectedProvince(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-400"
              >
                <option value="">Barchasi</option>
                {safeArray(provinces).map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Tuman</label>
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                disabled={!selectedProvince}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-400 disabled:opacity-50"
              >
                <option value="">Barchasi</option>
                {filteredRegions.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Zal</label>
              <select
                value={selectedOrg}
                onChange={(e) => setSelectedOrg(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-400"
              >
                <option value="">Zalni tanlang</option>
                {orgList.map((o) => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Settings Form */}
        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-400 shadow-sm">
            Sozlamalar yuklanmoqda...
          </div>
        )}

        {!loading && !selectedOrg && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-400 shadow-sm">
            Sozlamalarni ko'rish uchun yuqoridan zalni tanlang.
          </div>
        )}

        {!loading && selectedOrg && settings && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-slate-800">
                {orgList.find((o) => String(o.id) === String(selectedOrg))?.name || "Zal sozlamalari"}
              </h2>
              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                Superadmin — barcha sozlamalarni tahrirlash mumkin
              </span>
            </div>

            {message && (
              <div className="mb-4 rounded-xl bg-green-50 p-3 text-sm text-green-700">{message}</div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              {Object.keys(FIELD_LABELS).map((key) => {
                const editable = EDITABLE_FIELDS.includes(key);
                const isTime = key === "opening_time" || key === "closing_time";
                return (
                  <div key={key} className="flex items-center gap-4">
                    <div className="w-48 shrink-0">
                      <div className="flex items-center gap-1">
                        <label className="text-sm font-medium text-slate-700">{FIELD_LABELS[key]}</label>
                        <button
                          type="button"
                          className="text-slate-400 hover:text-slate-600"
                          onMouseEnter={() => setTooltip(key)}
                          onMouseLeave={() => setTooltip(null)}
                        >
                          <Info size={13} />
                        </button>
                      </div>
                      {tooltip === key && (
                        <div className="mt-1 rounded-lg bg-slate-800 px-3 py-2 text-xs text-white shadow-lg">
                          {FIELD_INFO[key]}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <input
                        type={isTime ? "time" : "number"}
                        value={form[key] || ""}
                        onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
                        min={isTime ? undefined : 0}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-400"
                      />
                    </div>
                    {!editable && (
                      <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-500">
                        Faqat ko'rish
                      </span>
                    )}
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
