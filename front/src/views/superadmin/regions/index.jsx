import React, { useEffect, useState } from "react";
import ApiCall from "../../../config";
import { Plus, Edit, Trash2, CheckCircle2, KeyRound } from "lucide-react";
import { Modal } from "react-responsive-modal";
import "react-responsive-modal/styles.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function RegionsPage() {
  const [regions, setRegions] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    login: "",
    password: "",
    provinceId: "",
    directorName: "",
    phoneNumber: "",
    location: "",
    description: "",
    businessSphere: "",
    passwordHint: "",
  });
  const [editId, setEditId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordTarget, setPasswordTarget] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  const safeArray = (value) => (Array.isArray(value) ? value : []);
  const regionList = safeArray(regions);
  const provincesList = safeArray(provinces);


  useEffect(() => {
    fetchRegions();
    fetchProvinces();
  }, []);

  const fetchRegions = async () => {
    try {
      const result = await ApiCall(
        "/api/v1/admin/regions/getAll",
        "GET",
        null,
        { page: 1, pageSize: 100 }
      );
      if (!result?.error) setRegions(result.data?.data || result.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProvinces = async () => {
    try {
      const result = await ApiCall(
        "/api/v1/admin/provinces/getAll",
        "GET"
      );
      if (!result?.error) setProvinces(result.data || []);


    } catch (err) {
      console.error(err);
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
      password: "",
      provinceId: "",
      directorName: "",
      phoneNumber: "",
      location: "",
      description: "",
      businessSphere: "",
      passwordHint: "",
    });
    setEditId(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleEdit = (region) => {
    setEditId(region.id);
    setForm({
      name: region.name || "",
      login: region.login || "",
      password: "",
      provinceId: region.provinceId || "",
      directorName: region.directorName || "",
      phoneNumber: region.phoneNumber || "",
      location: region.location || "",
      description: region.description || "",
      businessSphere: region.businessSphere || "",
      passwordHint: region.passwordHint || "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const selectedProvince = provincesList.find(
        (p) => String(p.id) === String(form.provinceId)
      );
      const payload = {
        name: form.name,
        login: form.login,
        password: form.password,
        provinceId: form.provinceId || null,
        provinceName: selectedProvince?.name || null,
        directorName: form.directorName,
        phoneNumber: form.phoneNumber,
        location: form.location,
        description: form.description,
        businessSphere: form.businessSphere,
        passwordHint: form.passwordHint,
      };

      const apiUrl = editId
        ? `/api/v1/admin/regions/update?id=${editId}`
        : "/api/v1/admin/regions/add";
      const method = editId ? "PUT" : "POST";
      const result = await ApiCall(apiUrl, method, payload);

      if (!result?.error) {
        await fetchRegions();
        closeModal();
        toast.success(editId ? "Tuman yangilandi." : "Yangi tuman yaratildi.");
      } else {
        toast.error(result?.data?.message || "Xatolik yuz berdi. Ma'lumotlarni tekshiring.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Xatolik yuz berdi.");
    } finally {
      setLoading(false);
    }
  };

  const openPasswordModal = (region) => {
    setPasswordTarget(region);
    setNewPassword("");
    setShowPasswordModal(true);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);
    const result = await ApiCall(
      `/api/v1/admin/regions/changePassword/${passwordTarget.id}`,
      "POST",
      { password: newPassword }
    );
    setPasswordLoading(false);
    if (!result?.error) {
      setShowPasswordModal(false);
      toast.success("Parol muvaffaqiyatli o'zgartirildi.");
    } else {
      toast.error(result?.data?.message || "Xatolik yuz berdi.");
    }
  };

  const handleToggleActive = async (region) => {
    const newActive = !region.active;
    const result = await ApiCall(
      `/api/v1/admin/regions/setActive?id=${region.id}&active=${newActive}`,
      "GET"
    );
    if (!result?.error) {
      setRegions((prev) =>
        prev.map((r) => (r.id === region.id ? { ...r, active: newActive } : r))
      );
      toast.success(newActive ? "Tuman faollashtirildi." : "Tuman bloklandi.");
    } else {
      toast.error(result?.data?.message || "Xatolik yuz berdi.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Ushbu tumanni o'chirishni xohlaysizmi?")) return;
    try {
      const result = await ApiCall(
        `/api/v1/admin/regions/delete?id=${id}`,
        "DELETE"
      );
      if (!result?.error) {
        await fetchRegions();
        toast.success("Tuman o'chirildi.");
      } else {
        toast.error(result?.data?.message || "Tumanni o'chirishda xatolik yuz berdi.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Tumanni o'chirishda xatolik yuz berdi.");
    }
  };
  const getProvinceName = (region) =>
    provincesList.find((p) => String(p.id) === String(region.provinceId))
      ?.name || region.provinceName || "—";

  return (
    <div className="bg-slate-50 min-h-screen p-4">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="border-slate-200 rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-slate-900 text-2xl font-semibold">
                Tumanlar
              </h1>
              <p className="text-slate-600 mt-1 text-sm">
                Tumanlar ro'yxatini ko'rish va qo'shish.
              </p>
            </div>
            <button
              onClick={openCreateModal}
              className="bg-gray-900 hover:bg-gray-700 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition"
            >
              <Plus size={16} /> Yangi tuman
            </button>
          </div>

          <div className="mt-6">
            <div className="border-slate-200 overflow-hidden rounded-2xl border bg-white shadow-sm">
              <div className="border-slate-200 bg-slate-50 text-slate-900 border-b px-6 py-4 font-semibold">
                Tumanlar ro'yxati
              </div>
              <div className="overflow-x-auto px-6 py-4">
                <table className="text-slate-600 min-w-full text-left text-sm">
                  <thead>
                    <tr>
                      <th className="pb-3 font-medium">ID</th>
                      <th className="pb-3 font-medium">Nomi</th>
                      <th className="pb-3 font-medium">Viloyat</th>
                      <th className="pb-3 font-medium">Telefon</th>
                      <th className="pb-3 font-medium">Holat</th>
                      <th className="pb-3 text-right font-medium">Amallar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {regionList.length === 0 ? (
                      <tr>
                        <td
                          colSpan="6"
                          className="text-slate-500 py-8 text-center"
                        >
                          Tumanlar topilmadi.
                        </td>
                      </tr>
                    ) : (
                      regionList.map((region) => (
                        <tr
                          key={region.id}
                          className="border-slate-200 border-t"
                        >
                          <td className="py-3">{region.id}</td>
                          <td className="py-3">{region.name}</td>
                          <td className="py-3">{getProvinceName(region)}</td>
                          <td className="py-3">{region.phoneNumber || "—"}</td>
                          <td className="py-3">
                            <button
                              onClick={() => handleToggleActive(region)}
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold transition hover:opacity-70 ${
                                region.active
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {region.active ? <><CheckCircle2 size={12} /> Faol</> : "Bloklangan"}
                            </button>
                          </td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => handleEdit(region)}
                              className="bg-slate-100 text-slate-700 hover:bg-slate-200 mr-2 rounded-lg px-3 py-1 text-sm"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => openPasswordModal(region)}
                              className="mr-2 rounded-lg bg-amber-100 px-3 py-1 text-sm text-amber-700 hover:bg-amber-200"
                            >
                              <KeyRound size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(region.id)}
                              className="bg-rose-100 text-rose-700 hover:bg-rose-200 rounded-lg px-3 py-1 text-sm"
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
      </div>

      <Modal open={showModal} onClose={closeModal} center>
        <div className="w-[520px] max-w-full p-6">
          <div className="text-slate-900 mb-4 text-lg font-semibold">
            {editId ? "Tumanni tahrirlash" : "Yangi tuman qo'shish"}
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-slate-700 mb-2 block text-sm font-medium">
                Nomi
              </label>
              <input
                required
                name="name"
                value={form.name}
                onChange={handleInput}
                className="border-slate-200 bg-slate-50 text-slate-900 focus:border-slate-400 w-full rounded-xl border px-4 py-3 text-sm outline-none"
                placeholder="Tuman nomi"
              />
            </div>
            <div>
              <label className="text-slate-700 mb-2 block text-sm font-medium">
                Viloyat
              </label>
              <select
                required={!editId}
                name="provinceId"
                value={form.provinceId}
                onChange={handleInput}
                className="border-slate-200 bg-slate-50 text-slate-900 focus:border-slate-400 w-full rounded-xl border px-4 py-3 text-sm outline-none"
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
              <label className="text-slate-700 mb-2 block text-sm font-medium">
                Login
              </label>
              <input
                required={!editId}
                name="login"
                value={form.login}
                onChange={handleInput}
                className="border-slate-200 bg-slate-50 text-slate-900 focus:border-slate-400 w-full rounded-xl border px-4 py-3 text-sm outline-none"
                placeholder="Login"
              />
            </div>
            <div>
              <label className="text-slate-700 mb-2 block text-sm font-medium">
                Parol
              </label>
              <input
                required={!editId}
                type="password"
                name="password"
                value={form.password}
                onChange={handleInput}
                className="border-slate-200 bg-slate-50 text-slate-900 focus:border-slate-400 w-full rounded-xl border px-4 py-3 text-sm outline-none"
                placeholder={editId ? "Yangi parol (ixtiyoriy)" : "Parol"}
              />
            </div>
            <div>
              <label className="text-slate-700 mb-2 block text-sm font-medium">
                Direktor
              </label>
              <input
                name="directorName"
                value={form.directorName}
                onChange={handleInput}
                className="border-slate-200 bg-slate-50 text-slate-900 focus:border-slate-400 w-full rounded-xl border px-4 py-3 text-sm outline-none"
                placeholder="Direktor ismi"
              />
            </div>
            <div>
              <label className="text-slate-700 mb-2 block text-sm font-medium">
                Telefon
              </label>
              <input
                name="phoneNumber"
                value={form.phoneNumber}
                onChange={handleInput}
                className="border-slate-200 bg-slate-50 text-slate-900 focus:border-slate-400 w-full rounded-xl border px-4 py-3 text-sm outline-none"
                placeholder="Telefon raqami"
              />
            </div>
            <div>
              <label className="text-slate-700 mb-2 block text-sm font-medium">
                Joylashuv
              </label>
              <input
                name="location"
                value={form.location}
                onChange={handleInput}
                className="border-slate-200 bg-slate-50 text-slate-900 focus:border-slate-400 w-full rounded-xl border px-4 py-3 text-sm outline-none"
                placeholder="Joylashuv"
              />
            </div>
            <div>
              <label className="text-slate-700 mb-2 block text-sm font-medium">
                Soha
              </label>
              <input
                name="businessSphere"
                value={form.businessSphere}
                onChange={handleInput}
                className="border-slate-200 bg-slate-50 text-slate-900 focus:border-slate-400 w-full rounded-xl border px-4 py-3 text-sm outline-none"
                placeholder="Biznes sohasi"
              />
            </div>
            <div>
              <label className="text-slate-700 mb-2 block text-sm font-medium">
                Parol eslatmasi
              </label>
              <input
                name="passwordHint"
                value={form.passwordHint}
                onChange={handleInput}
                className="border-slate-200 bg-slate-50 text-slate-900 focus:border-slate-400 w-full rounded-xl border px-4 py-3 text-sm outline-none"
                placeholder="Parol eslatmasi"
              />
            </div>
            <div className="flex items-center gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-gray-900 hover:bg-gray-700 inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Saqlanmoqda..." : editId ? "Yangilash" : "Saqlash"}
              </button>
              <button
                type="button"
                onClick={closeModal}
                className="border-slate-200 text-slate-700 hover:bg-slate-50 inline-flex items-center justify-center rounded-xl border bg-white px-4 py-3 text-sm font-semibold transition"
              >
                Bekor qilish
              </button>
            </div>
          </form>
        </div>
      </Modal>
      <Modal open={showPasswordModal} onClose={() => setShowPasswordModal(false)} center>
        <div className="w-[380px] max-w-full p-6">
          <div className="mb-4 text-lg font-semibold text-gray-900">
            Parolni o'zgartirish — {passwordTarget?.name}
          </div>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Yangi parol</label>
              <input
                required
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-400"
                placeholder="Yangi parol"
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
                className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
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
