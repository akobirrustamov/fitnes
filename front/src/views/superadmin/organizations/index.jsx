import React, { useEffect, useState } from "react";
import ApiCall from "../../../config";
import { Plus, Edit, Trash2, CheckCircle2 } from "lucide-react";

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState([]);
  const [regions, setRegions] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    login: "",
    directorName: "",
    phoneNumber: "",
    provinceId: "",
    regionId: "",
    businessSphere: "",
    location: "",
    passwordHint: "",
  });
  const [editId, setEditId] = useState(null);
  const [message, setMessage] = useState("");

  const safeArray = (value) => (Array.isArray(value) ? value : []);
  const organizationsList = safeArray(organizations);
  const provincesList = safeArray(provinces);
  const regionsList = safeArray(regions);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    await Promise.all([fetchOrganizations(), fetchProvinces(), fetchRegions()]);
  };

  const fetchOrganizations = async () => {
    const result = await ApiCall(
      "/api/v1/admin/organizations/getAll",
      "GET",
      null,
      { page: 1, limit: 50 }
    );
    if (!result?.error) {
      setOrganizations(result.data?.content || result.data || []);
    }
  };

  const fetchProvinces = async () => {
    const result = await ApiCall(
      "/api/v1/admin/provinces/getAll",
      "GET",
      null,
      { active: true }
    );
    if (!result?.error) {
      setProvinces(result.data || []);
    }
  };

  const fetchRegions = async () => {
    const result = await ApiCall(
      "/api/v1/admin/regions/getAll",
      "GET",
      null,
      { active: true, page: 1, pageSize: 100 }
    );
    if (!result?.error) {
      setRegions(result.data?.content || result.data || []);
    }
  };

  const handleInput = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setForm({
      name: "",
      login: "",
      directorName: "",
      phoneNumber: "",
      provinceId: "",
      regionId: "",
      businessSphere: "",
      location: "",
      passwordHint: "",
    });
    setEditId(null);
    setMessage("");
  };

  const handleEdit = (organization) => {
    setEditId(organization.id);
    setForm({
      name: organization.name || "",
      login: organization.login || "",
      directorName: organization.directorName || "",
      phoneNumber: organization.phoneNumber || "",
      provinceId: organization.provinceId || "",
      regionId: organization.regionId || "",
      businessSphere: organization.businessSphere || "",
      location: organization.location || "",
      passwordHint: organization.passwordHint || "",
    });
    setMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const payload = {
      name: form.name,
      login: form.login,
      directorName: form.directorName,
      phoneNumber: form.phoneNumber,
      provinceId: form.provinceId,
      regionId: form.regionId,
      businessSphere: form.businessSphere,
      location: form.location,
      passwordHint: form.passwordHint,
    };

    const apiUrl = editId
      ? `/api/v1/admin/organizations/update?id=${editId}`
      : "/api/v1/admin/organizations/create";
    const method = editId ? "PUT" : "POST";
    const result = await ApiCall(apiUrl, method, payload);
    setLoading(false);

    if (!result?.error) {
      await fetchOrganizations();
      resetForm();
      setMessage(editId ? "Tashkilot yangilandi." : "Yangi tashkilot yaratildi.");
    } else {
      setMessage("Xatolik yuz berdi. Ma'lumotlarni tekshiring.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Ushbu tashkilotni o'chirishni xohlaysizmi?")) return;
    const result = await ApiCall(`/api/v1/admin/organizations/delete?id=${id}`, "DELETE");
    if (!result?.error) {
      await fetchOrganizations();
      setMessage("Tashkilot o'chirildi.");
    } else {
      setMessage("Tashkilotni o'chirishda xatolik yuz berdi.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Zallar</h1>
              <p className="mt-1 text-sm text-slate-600">Tashkilotlarni boshqarish va yangilash.</p>
            </div>
            <button
              onClick={resetForm}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
            >
              <Plus size={16} /> Yangi tashkilot
            </button>
          </div>

          {message && (
            <div className="mt-4 rounded-xl bg-green-50 p-4 text-sm text-green-700">
              {message}
            </div>
          )}

          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 bg-slate-50 px-6 py-4 font-semibold text-slate-900">
                Tashkilotlar ro'yxati
              </div>
              <div className="overflow-x-auto px-6 py-4">
                <table className="min-w-full text-left text-sm text-slate-600">
                  <thead>
                    <tr>
                      <th className="pb-3 font-medium">ID</th>
                      <th className="pb-3 font-medium">Nomi</th>
                      <th className="pb-3 font-medium">Viloyat / Tuman</th>
                      <th className="pb-3 font-medium">Telefon</th>
                      <th className="pb-3 font-medium text-right">Amallar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {organizationsList.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="py-8 text-center text-slate-500">
                          Tashkilotlar topilmadi.
                        </td>
                      </tr>
                    ) : (
                      organizationsList.map((organization) => (
                        <tr key={organization.id} className="border-t border-slate-200">
                          <td className="py-3">{organization.id}</td>
                          <td className="py-3">{organization.name}</td>
                          <td className="py-3">
                            {organization.provinceName || "—"} / {organization.regionName || "—"}
                          </td>
                          <td className="py-3">{organization.phoneNumber || "—"}</td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => handleEdit(organization)}
                              className="mr-2 rounded-lg bg-slate-100 px-3 py-1 text-sm text-slate-700 hover:bg-slate-200"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(organization.id)}
                              className="rounded-lg bg-rose-100 px-3 py-1 text-sm text-rose-700 hover:bg-rose-200"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 text-lg font-semibold text-slate-900">
                {editId ? "Tashkilotni tahrirlash" : "Yangi tashkilot qo'shish"}
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Nomi</label>
                  <input
                    required
                    name="name"
                    value={form.name}
                    onChange={handleInput}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400"
                    placeholder="Tashkilot nomi"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Viloyat</label>
                  <select
                    required={!editId}
                    name="provinceId"
                    value={form.provinceId}
                    onChange={handleInput}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400"
                  >
                    <option value="">Viloyatni tanlang</option>
                    {provincesList.map((province) => (
                      <option key={province.id} value={province.id}>
                        {province.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Tuman</label>
                  <select
                    required={!editId}
                    name="regionId"
                    value={form.regionId}
                    onChange={handleInput}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400"
                  >
                    <option value="">Tumanni tanlang</option>
                    {regionsList.map((region) => (
                      <option key={region.id} value={region.id}>
                        {region.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Login</label>
                  <input
                    required={!editId}
                    name="login"
                    value={form.login}
                    onChange={handleInput}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400"
                    placeholder="Login"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Direktor</label>
                  <input
                    name="directorName"
                    value={form.directorName}
                    onChange={handleInput}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400"
                    placeholder="Direktor ismi"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Telefon</label>
                  <input
                    name="phoneNumber"
                    value={form.phoneNumber}
                    onChange={handleInput}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400"
                    placeholder="Telefon raqami"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Joylashuv</label>
                  <input
                    name="location"
                    value={form.location}
                    onChange={handleInput}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400"
                    placeholder="Joylashuv"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Soha</label>
                  <input
                    name="businessSphere"
                    value={form.businessSphere}
                    onChange={handleInput}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400"
                    placeholder="Biznes sohasi"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Parol eslatmasi</label>
                  <input
                    name="passwordHint"
                    value={form.passwordHint}
                    onChange={handleInput}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400"
                    placeholder="Parol eslatmasi"
                  />
                </div>
                <div className="flex items-center gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {editId ? "Yangilash" : "Saqlash"}
                  </button>
                  {editId && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Bekor qilish
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
