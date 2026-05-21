import React, { useEffect, useState } from "react";
import ApiCall from "../../../config";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Modal } from "react-responsive-modal";
import "react-responsive-modal/styles.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function TariffsPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    nameUz: "",
    nameRu: "",
    nameUzk: "",
    description: "",
    iconUrl: "",
    displayOrder: "",
  });
  const [editId, setEditId] = useState(null);

  const safeArray = (value) => (Array.isArray(value) ? value : []);
  const categoriesList = safeArray(categories);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const result = await ApiCall("/api/v1/admin/categories/getAll", "GET");
    if (!result?.error) {
      setCategories(result.data || []);
    }
  };

  const handleInput = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setForm({
      nameUz: "",
      nameRu: "",
      nameUzk: "",
      description: "",
      iconUrl: "",
      displayOrder: "",
    });
    setEditId(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (category) => {
    setEditId(category.id);
    setForm({
      nameUz: category.nameUz || "",
      nameRu: category.nameRu || "",
      nameUzk: category.nameUzk || "",
      description: category.description || "",
      iconUrl: category.iconUrl || "",
      displayOrder: category.displayOrder?.toString() || "",
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
    const payload = {
      nameUz: form.nameUz,
      nameRu: form.nameRu,
      nameUzk: form.nameUzk,
      description: form.description,
      iconUrl: form.iconUrl,
      displayOrder: Number(form.displayOrder) || 0,
    };

    const apiUrl = editId
      ? `/api/v1/admin/categories/update?id=${editId}`
      : "/api/v1/admin/categories/create";
    const method = editId ? "PUT" : "POST";
    const result = await ApiCall(apiUrl, method, payload);
    setLoading(false);

    if (!result?.error) {
      await fetchCategories();
      closeModal();
      toast.success(editId ? "Tarif yangilandi." : "Yangi tarif yaratildi.");
    } else {
      toast.error("Xatolik yuz berdi. Ma'lumotlarni tekshiring.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Ushbu tarifni o'chirishni xohlaysizmi?")) return;
    const result = await ApiCall(`/api/v1/admin/categories/delete?id=${id}`, "DELETE");
    if (!result?.error) {
      await fetchCategories();
      toast.success("Tarif o'chirildi.");
    } else {
      toast.error("Tarifni o'chirishda xatolik yuz berdi.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Tariflar</h1>
              <p className="mt-1 text-sm text-gray-600">Tariflar va xizmat kategoriya sifatida boshqariladi.</p>
            </div>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700"
            >
              <Plus size={16} /> Yangi tarif
            </button>
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 font-semibold text-gray-900">
              Tariflar ro'yxati
            </div>
            <div className="overflow-x-auto px-6 py-4">
              <table className="min-w-full text-left text-sm text-gray-600">
                <thead>
                  <tr>
                    <th className="pb-3 font-medium">ID</th>
                    <th className="pb-3 font-medium">O'zbekcha</th>
                    <th className="pb-3 font-medium">Ruscha</th>
                    <th className="pb-3 font-medium">Tartib</th>
                    <th className="pb-3 font-medium text-right">Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {categoriesList.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-gray-500">
                        Tariflar topilmadi.
                      </td>
                    </tr>
                  ) : (
                    categoriesList.map((category) => (
                      <tr key={category.id} className="border-t border-gray-200">
                        <td className="py-3">{category.id}</td>
                        <td className="py-3">{category.nameUz}</td>
                        <td className="py-3">{category.nameRu}</td>
                        <td className="py-3">{category.displayOrder ?? "—"}</td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => openEditModal(category)}
                            className="mr-2 rounded-lg bg-gray-100 px-3 py-1 text-sm text-gray-700 hover:bg-gray-200"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(category.id)}
                            className="rounded-lg bg-pink-100 px-3 py-1 text-sm text-pink-700 hover:bg-pink-200"
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
        <div className="w-[460px] max-w-full p-6">
          <div className="mb-4 text-lg font-semibold text-gray-900">
            {editId ? "Tarifni tahrirlash" : "Yangi tarif qo'shish"}
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Nomi (uz)</label>
              <input
                required
                name="nameUz"
                value={form.nameUz}
                onChange={handleInput}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-400"
                placeholder="Nomi (o'zbekcha)"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Nomi (ru)</label>
              <input
                required
                name="nameRu"
                value={form.nameRu}
                onChange={handleInput}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-400"
                placeholder="Nomi (ruscha)"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Nomi (uzk)</label>
              <input
                name="nameUzk"
                value={form.nameUzk}
                onChange={handleInput}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-400"
                placeholder="Nomi (lotin)"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Tartib</label>
              <input
                type="number"
                name="displayOrder"
                value={form.displayOrder}
                onChange={handleInput}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-400"
                placeholder="Ko'rsatish tartibi"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Icon URL</label>
              <input
                name="iconUrl"
                value={form.iconUrl}
                onChange={handleInput}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-400"
                placeholder="Icon URL"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Tavsif</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleInput}
                rows="3"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-400"
                placeholder="Qisqacha tavsif"
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
