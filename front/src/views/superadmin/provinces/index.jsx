import React, { useEffect, useState } from "react";
import axios from "axios";
import ApiCall, { baseUrl } from "config";
import PhoneInput from "components/PhoneInput";
import { Plus, Edit, Trash2, CheckCircle2, KeyRound, Download } from "lucide-react";
import { Modal } from "react-responsive-modal";
import "react-responsive-modal/styles.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function ProvincesPage() {
  const [provinces, setProvinces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    login: "",
    password: "",
    directorName: "",
    phoneNumber: "+998",
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

  const [downloading, setDownloading] = useState(false);

  const safeArray = (value) => (Array.isArray(value) ? value : []);
  const provincesList = safeArray(provinces);

  useEffect(() => {
    fetchProvinces();
  }, []);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const token = localStorage.getItem("access_token");
      const response = await axios({
        url: `${baseUrl}/api/v1/admin/provinces/download`,
        method: "GET",
        responseType: "blob",
        headers: { Authorization: token ? `Bearer ${token}` : undefined },
      });
      const href = URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = href;
      link.download = "viloyatlar.xlsx";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(href);
    } catch {
      toast.error("Excel yuklab olishda xatolik");
    }
    setDownloading(false);
  };

  const fetchProvinces = async () => {
    const result = await ApiCall("/api/v1/admin/provinces/getAll", "GET");
    if (!result?.error) {
      setProvinces(result.data || []);
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
      directorName: "",
      phoneNumber: "+998",
      location: "",
      description: "",
      businessSphere: "",
      passwordHint: "",
    });
    setEditId(null);
  };

  const handleEdit = (province) => {
    setEditId(province.id);
    setForm({
      name: province.name || "",
      login: province.login || "",
      password: "",
      directorName: province.directorName || "",
      phoneNumber: province.phoneNumber || "+998",
      location: province.location || "",
      description: province.description || "",
      businessSphere: province.businessSphere || "",
      passwordHint: province.passwordHint || "",
    });
    setShowModal(true);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const payload = {
      name: form.name,
      login: form.login,
      password: form.password,
      directorName: form.directorName,
      phoneNumber: form.phoneNumber,
      location: form.location,
      description: form.description,
      businessSphere: form.businessSphere,
      passwordHint: form.passwordHint,
    };

    const apiUrl = editId
      ? `/api/v1/admin/provinces/update?id=${editId}`
      : "/api/v1/admin/provinces/add";
    const method = editId ? "PUT" : "POST";

    const result = await ApiCall(apiUrl, method, payload);
    setLoading(false);

    if (!result?.error) {
      await fetchProvinces();
      closeModal();
      toast.success(editId ? "Viloyat yangilandi." : "Yangi viloyat yaratildi.");
    } else {
      toast.error(result?.data?.message || "Xatolik yuz berdi. Ma'lumotlarni tekshiring.");
    }
  };

  const openPasswordModal = (province) => {
    setPasswordTarget(province);
    setNewPassword("");
    setShowPasswordModal(true);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);
    const result = await ApiCall(
      `/api/v1/admin/provinces/changePassword/${passwordTarget.id}`,
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

  const handleToggleActive = async (province) => {
    const newActive = !province.active;
    const result = await ApiCall(
      `/api/v1/admin/provinces/setActive?id=${province.id}&active=${newActive}`,
      "GET"
    );
    if (!result?.error) {
      setProvinces((prev) =>
        prev.map((p) => (p.id === province.id ? { ...p, active: newActive } : p))
      );
      toast.success(newActive ? "Viloyat faollashtirildi." : "Viloyat bloklandi.");
    } else {
      toast.error(result?.data?.message || "Xatolik yuz berdi.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Ushbu viloyatni o'chirishni xohlaysizmi?")) return;
    const result = await ApiCall(
      `/api/v1/admin/provinces/delete?id=${id}`,
      "DELETE"
    );
    if (!result?.error) {
      await fetchProvinces();
      toast.success("Viloyat o'chirildi.");
    } else {
      toast.error(result?.data?.message || "Viloyatni o'chirishda xatolik yuz berdi.");
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen p-4">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="border-gray-200 rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-gray-900 text-2xl font-semibold">
                Viloyatlar
              </h1>
              <p className="text-gray-800 mt-1 text-sm">
                Viloyatlarni ro'yxatini ko'rish va boshqarish.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
              >
                <Download size={16} />
                {downloading ? "Yuklanmoqda..." : "Excel"}
              </button>
              <button
                onClick={openCreateModal}
                className="bg-gray-900 hover:bg-gray-700 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition"
              >
                <Plus size={16} /> Yangi viloyat
              </button>
            </div>
          </div>

          <div className="mt-6">
            <div className="border-gray-200 overflow-hidden rounded-2xl border bg-white shadow-sm">
              <div className="border-gray-200 bg-gray-50 text-gray-900 border-b px-6 py-4 font-semibold">
                Viloyatlar ro'yxati
              </div>
              <div className="overflow-x-auto px-6 py-4">
                <table className="text-gray-800 min-w-full text-left text-sm">
                  <thead>
                    <tr>
                      <th className="pb-3 font-medium">ID</th>
                      <th className="pb-3 font-medium">Nomi</th>
                      <th className="pb-3 font-medium">Telefon</th>
                      <th className="pb-3 font-medium">Holat</th>
                      <th className="pb-3 text-right font-medium">Amallar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {provincesList.length === 0 ? (
                      <tr>
                        <td
                          colSpan="5"
                          className="text-gray-500 py-8 text-center"
                        >
                          Viloyatlar topilmadi.
                        </td>
                      </tr>
                    ) : (
                      provincesList.map((province) => (
                        <tr
                          key={province.id}
                          className="border-gray-200 border-t"
                        >
                          <td className="py-3">{province.id}</td>
                          <td className="py-3">{province.name}</td>
                          <td className="py-3">
                            {province.phoneNumber || "—"}
                          </td>
                          <td className="py-3">
                            <button
                              onClick={() => handleToggleActive(province)}
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold transition hover:opacity-70 ${
                                province.active
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {province.active ? (
                                <><CheckCircle2 size={12} /> Faol</>
                              ) : (
                                "Bloklangan"
                              )}
                            </button>
                          </td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => handleEdit(province)}
                              className="bg-gray-100 text-gray-700 hover:bg-gray-200 mr-2 rounded-lg px-3 py-1 text-sm"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => openPasswordModal(province)}
                              className="mr-2 rounded-lg bg-amber-100 px-3 py-1 text-sm text-amber-700 hover:bg-amber-200"
                            >
                              <KeyRound size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(province.id)}
                              className="bg-pink-100 text-pink-700 hover:bg-pink-200 rounded-lg px-3 py-1 text-sm"
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
          <div className="text-gray-900 mb-4 text-lg font-semibold">
            {editId ? "Viloyatni tahrirlash" : "Yangi viloyat qo'shish"}
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-gray-700 mb-2 block text-sm font-medium">
                Nomi
              </label>
              <input
                required
                name="name"
                value={form.name}
                onChange={handleInput}
                className="border-gray-200 bg-gray-50 text-gray-900 focus:border-gray-400 w-full rounded-xl border px-4 py-3 text-sm outline-none"
                placeholder="Viloyat nomi"
              />
            </div>
            <div>
              <label className="text-gray-700 mb-2 block text-sm font-medium">
                Login
              </label>
              <input
                required={!editId}
                name="login"
                value={form.login}
                onChange={handleInput}
                className="border-gray-200 bg-gray-50 text-gray-900 focus:border-gray-400 w-full rounded-xl border px-4 py-3 text-sm outline-none"
                placeholder="Login"
              />
            </div>
            <div>
              <label className="text-gray-700 mb-2 block text-sm font-medium">
                Parol
              </label>
              <input
                required={!editId}
                type="password"
                name="password"
                value={form.password}
                onChange={handleInput}
                className="border-gray-200 bg-gray-50 text-gray-900 focus:border-gray-400 w-full rounded-xl border px-4 py-3 text-sm outline-none"
                placeholder={
                  editId ? "Yangi parolni kiriting (ixtiyoriy)" : "Parol"
                }
              />
            </div>
            <div>
              <label className="text-gray-700 mb-2 block text-sm font-medium">
                Direktor
              </label>
              <input
                name="directorName"
                value={form.directorName}
                onChange={handleInput}
                className="border-gray-200 bg-gray-50 text-gray-900 focus:border-gray-400 w-full rounded-xl border px-4 py-3 text-sm outline-none"
                placeholder="Direktor ismi"
              />
            </div>
            <div>
              <label className="text-gray-700 mb-2 block text-sm font-medium">
                Telefon
              </label>
              <PhoneInput
                name="phoneNumber"
                value={form.phoneNumber}
                onChange={handleInput}
                className="border-gray-200 bg-gray-50 text-gray-900 focus:border-gray-400 w-full rounded-xl border px-4 py-3 text-sm outline-none"
              />
            </div>
            <div>
              <label className="text-gray-700 mb-2 block text-sm font-medium">
                Joylashuv
              </label>
              <input
                name="location"
                value={form.location}
                onChange={handleInput}
                className="border-gray-200 bg-gray-50 text-gray-900 focus:border-gray-400 w-full rounded-xl border px-4 py-3 text-sm outline-none"
                placeholder="Joylashuv"
              />
            </div>
            <div>
              <label className="text-gray-700 mb-2 block text-sm font-medium">
                Qisqacha izoh
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleInput}
                rows="3"
                className="border-gray-200 bg-gray-50 text-gray-900 focus:border-gray-400 w-full rounded-xl border px-4 py-3 text-sm outline-none"
                placeholder="Viloyat haqida qisqacha ma'lumot"
              />
            </div>
            <div>
              <label className="text-gray-700 mb-2 block text-sm font-medium">
                Soha
              </label>
              <input
                name="businessSphere"
                value={form.businessSphere}
                onChange={handleInput}
                className="border-gray-200 bg-gray-50 text-gray-900 focus:border-gray-400 w-full rounded-xl border px-4 py-3 text-sm outline-none"
                placeholder="Biznes sohasi"
              />
            </div>
            <div>
              <label className="text-gray-700 mb-2 block text-sm font-medium">
                Parol eslatmasi
              </label>
              <input
                name="passwordHint"
                value={form.passwordHint}
                onChange={handleInput}
                className="border-gray-200 bg-gray-50 text-gray-900 focus:border-gray-400 w-full rounded-xl border px-4 py-3 text-sm outline-none"
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
                className="border-gray-200 text-gray-700 hover:bg-gray-50 inline-flex items-center justify-center rounded-xl border bg-white px-4 py-3 text-sm font-semibold transition"
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
