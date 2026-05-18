import React, { useEffect, useState } from "react";
import ApiCall from "../../../config";
import { Plus, Edit, Trash2, CheckCircle2, KeyRound } from "lucide-react";
import { Modal } from "react-responsive-modal";
import "react-responsive-modal/styles.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState([]);
  const [regions, setRegions] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
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
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordTarget, setPasswordTarget] = useState(null);
  const [passwordForm, setPasswordForm] = useState({ newPassword: "", passwordHint: "" });
  const [passwordLoading, setPasswordLoading] = useState(false);

  const safeArray = (v) => (Array.isArray(v) ? v : []);
  const organizationsList = safeArray(organizations);
  const provincesList = safeArray(provinces);
  const allRegions = safeArray(regions);
  const regionsList = allRegions.filter(
    (r) => !form.provinceId || String(r.provinceId) === String(form.provinceId)
  );

  const getRegionName = (org) => {
    if (org.regionName) return org.regionName;
    if (!org.regionId) return "—";
    return allRegions.find((r) => String(r.id) === String(org.regionId))?.name || "—";
  };

  const getProvinceName = (regionId) => {
    if (!regionId) return "—";
    const region = allRegions.find((r) => String(r.id) === String(regionId));
    if (!region) return "—";
    if (region.provinceName) return region.provinceName;
    const province = provincesList.find((p) => String(p.id) === String(region.provinceId));
    return province?.name || "—";
  };

  useEffect(() => {
    fetchOrganizations();
    fetchProvinces();
    fetchRegions();
  }, []);

  const fetchOrganizations = async () => {
    const result = await ApiCall("/api/v1/admin/organizations/getAll", "GET", null, { page: 1, limit: 100 });
    if (!result?.error) setOrganizations(result.data?.data || result.data?.content || result.data || []);
  };

  const fetchProvinces = async () => {
    const result = await ApiCall("/api/v1/admin/provinces/getAll", "GET");
    if (!result?.error) setProvinces(result.data || []);
  };

  const fetchRegions = async () => {
    const result = await ApiCall("/api/v1/admin/regions/getAll", "GET", null, { page: 1, pageSize: 200 });
    if (!result?.error) setRegions(result.data?.data || result.data?.content || result.data || []);
  };

  const handleInput = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setForm({ name: "", login: "", directorName: "", phoneNumber: "", provinceId: "", regionId: "", businessSphere: "", location: "", passwordHint: "" });
    setEditId(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (org) => {
    setEditId(org.id);
    setForm({
      name: org.name || "",
      login: org.login || "",
      directorName: org.directorName || "",
      phoneNumber: org.phoneNumber || "",
      provinceId: org.provinceId || "",
      regionId: org.regionId || "",
      businessSphere: org.businessSphere || "",
      location: org.location || "",
      passwordHint: org.passwordHint || "",
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const selectedRegion = allRegions.find((r) => String(r.id) === String(form.regionId));
    const payload = {
      name: form.name,
      login: form.login,
      directorName: form.directorName,
      phoneNumber: form.phoneNumber,
      provinceId: form.provinceId || null,
      regionId: form.regionId || null,
      regionName: selectedRegion?.name || null,
      businessSphere: form.businessSphere,
      location: form.location,
      passwordHint: form.passwordHint,
    };
    const apiUrl = editId ? `/api/v1/admin/organizations/update?id=${editId}` : "/api/v1/admin/organizations/create";
    const method = editId ? "PUT" : "POST";
    const result = await ApiCall(apiUrl, method, payload);
    setLoading(false);
    if (!result?.error) {
      await fetchOrganizations();
      closeModal();
      toast.success(editId ? "Tashkilot yangilandi." : "Yangi tashkilot yaratildi.");
    } else {
      toast.error(result?.data?.message || "Xatolik yuz berdi. Ma'lumotlarni tekshiring.");
    }
  };

  const openPasswordModal = (org) => {
    setPasswordTarget(org);
    setPasswordForm({ newPassword: "", passwordHint: org.passwordHint || "" });
    setShowPasswordModal(true);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);
    const result = await ApiCall(
      `/api/v1/admin/organizations/changePassword?id=${passwordTarget.id}`,
      "PUT",
      { newPassword: passwordForm.newPassword, passwordHint: passwordForm.passwordHint }
    );
    setPasswordLoading(false);
    if (!result?.error) {
      setShowPasswordModal(false);
      toast.success("Parol muvaffaqiyatli o'zgartirildi.");
    } else {
      toast.error(result?.data?.message || "Xatolik yuz berdi.");
    }
  };

  const handleToggleActive = async (org) => {
    const newActive = !org.active;
    const result = await ApiCall(
      `/api/v1/admin/organizations/setActive?id=${org.id}`,
      "PUT",
      { active: newActive }
    );
    if (!result?.error) {
      setOrganizations((prev) =>
        prev.map((o) => (o.id === org.id ? { ...o, active: newActive } : o))
      );
      toast.success(newActive ? "Zal faollashtirildi." : "Zal bloklandi.");
    } else {
      toast.error(result?.data?.message || "Xatolik yuz berdi.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Ushbu tashkilotni o'chirishni xohlaysizmi?")) return;
    const result = await ApiCall(`/api/v1/admin/organizations/delete?id=${id}`, "DELETE");
    if (!result?.error) {
      await fetchOrganizations();
      toast.success("Tashkilot o'chirildi.");
    } else {
      toast.error(result?.data?.message || "Tashkilotni o'chirishda xatolik yuz berdi.");
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
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 rounded-lg bg-gray-900 hover:bg-gray-700 px-4 py-2 text-sm font-medium text-white transition"
            >
              <Plus size={16} /> Yangi tashkilot
            </button>
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
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
                    <th className="pb-3 font-medium">Holat</th>
                    <th className="pb-3 font-medium text-right">Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {organizationsList.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-slate-500">Tashkilotlar topilmadi.</td>
                    </tr>
                  ) : (
                    organizationsList.map((org) => (
                      <tr key={org.id} className="border-t border-slate-200">
                        <td className="py-3">{org.id}</td>
                        <td className="py-3">{org.name}</td>
                        <td className="py-3">{getProvinceName(org.regionId)} / {getRegionName(org)}</td>
                        <td className="py-3">{org.phoneNumber || "—"}</td>
                        <td className="py-3">
                          <button
                            onClick={() => handleToggleActive(org)}
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold transition hover:opacity-70 ${
                              org.active
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {org.active ? <><CheckCircle2 size={12} /> Faol</> : "Bloklangan"}
                          </button>
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => openEditModal(org)}
                            className="mr-2 rounded-lg bg-slate-100 px-3 py-1 text-sm text-slate-700 hover:bg-slate-200"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => openPasswordModal(org)}
                            className="mr-2 rounded-lg bg-amber-100 px-3 py-1 text-sm text-amber-700 hover:bg-amber-200"
                          >
                            <KeyRound size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(org.id)}
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
        </div>
      </div>

      <Modal open={showModal} onClose={closeModal} center>
        <div className="w-[520px] max-w-full p-6">
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
                name="provinceId"
                value={form.provinceId}
                onChange={handleInput}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400"
              >
                <option value="">Viloyatni tanlang</option>
                {provincesList.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Tuman</label>
              <select
                name="regionId"
                value={form.regionId}
                onChange={handleInput}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400"
              >
                <option value="">Tumanni tanlang</option>
                {regionsList.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
            {!editId && (
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Login</label>
                <input
                  required
                  name="login"
                  value={form.login}
                  onChange={handleInput}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400"
                  placeholder="Login"
                />
              </div>
            )}
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
                className="inline-flex items-center justify-center rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Saqlanmoqda..." : editId ? "Yangilash" : "Saqlash"}
              </button>
              <button
                type="button"
                onClick={closeModal}
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Bekor qilish
              </button>
            </div>
          </form>
        </div>
      </Modal>
      <Modal open={showPasswordModal} onClose={() => setShowPasswordModal(false)} center>
        <div className="w-[380px] max-w-full p-6">
          <div className="mb-4 text-lg font-semibold text-slate-900">
            Parolni o'zgartirish — {passwordTarget?.name}
          </div>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Yangi parol</label>
              <input
                required
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400"
                placeholder="Yangi parol"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Parol eslatmasi</label>
              <input
                value={passwordForm.passwordHint}
                onChange={(e) => setPasswordForm((p) => ({ ...p, passwordHint: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400"
                placeholder="Eslatma (ixtiyoriy)"
              />
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={passwordLoading}
                className="inline-flex items-center justify-center rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-700 disabled:opacity-60"
              >
                {passwordLoading ? "Saqlanmoqda..." : "Saqlash"}
              </button>
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Bekor qilish
              </button>
            </div>
          </form>
        </div>
      </Modal>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}
