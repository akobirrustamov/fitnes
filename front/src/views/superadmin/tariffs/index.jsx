import React, { useEffect, useState } from "react";
import ApiCall from "../../../config";
import { Plus, Edit, Trash2, CheckCircle2 } from "lucide-react";

export default function TariffsPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nameUz: "",
    nameRu: "",
    nameUzk: "",
    description: "",
    iconUrl: "",
    displayOrder: "",
  });
  const [editId, setEditId] = useState(null);
  const [message, setMessage] = useState("");

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
    setMessage("");
  };

  const handleEdit = (category) => {
    setEditId(category.id);
    setForm({
      nameUz: category.nameUz || "",
      nameRu: category.nameRu || "",
      nameUzk: category.nameUzk || "",
      description: category.description || "",
      iconUrl: category.iconUrl || "",
      displayOrder: category.displayOrder?.toString() || "",
    });
    setMessage("");
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
      resetForm();
      setMessage(editId ? "Tarif yangilandi." : "Yangi tarif yaratildi.");
    } else {
      setMessage("Xatolik yuz berdi. Ma'lumotlarni tekshiring.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Ushbu tarifni o'chirishni xohlaysizmi?")) return;
    const result = await ApiCall(`/api/v1/admin/categories/delete?id=${id}`, "DELETE");
    if (!result?.error) {
      await fetchCategories();
      setMessage("Tarif o'chirildi.");
    } else {
      setMessage("Tarifni o'chirishda xatolik yuz berdi.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Tariflar</h1>
              <p className="mt-1 text-sm text-slate-600">Tariflar va xizmat kategoriya sifatida boshqariladi.</p>
            </div>
            <button
              onClick={resetForm}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
            >
              <Plus size={16} /> Yangi tarif
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
                Tariflar ro'yxati
              </div>
              <div className="overflow-x-auto px-6 py-4">
                <table className="min-w-full text-left text-sm text-slate-600">
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
                        <td colSpan="5" className="py-8 text-center text-slate-500">
                          Tariflar topilmadi.
                        </td>
                      </tr>
                    ) : (
                      categoriesList.map((category) => (
                        <tr key={category.id} className="border-t border-slate-200">
                          <td className="py-3">{category.id}</td>
                          <td className="py-3">{category.nameUz}</td>
                          <td className="py-3">{category.nameRu}</td>
                          <td className="py-3">{category.displayOrder ?? "—"}</td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => handleEdit(category)}
                              className="mr-2 rounded-lg bg-slate-100 px-3 py-1 text-sm text-slate-700 hover:bg-slate-200"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(category.id)}
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
                {editId ? "Tarifni tahrirlash" : "Yangi tarif qo'shish"}
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Nomi (uz)</label>
                  <input
                    required
                    name="nameUz"
                    value={form.nameUz}
                    onChange={handleInput}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400"
                    placeholder="Nomi (o'zbekcha)"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Nomi (ru)</label>
                  <input
                    required
                    name="nameRu"
                    value={form.nameRu}
                    onChange={handleInput}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400"
                    placeholder="Nomi (ruscha)"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Nomi (uzk)</label>
                  <input
                    name="nameUzk"
                    value={form.nameUzk}
                    onChange={handleInput}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400"
                    placeholder="Nomi (lotin)"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Tartib</label>
                  <input
                    type="number"
                    name="displayOrder"
                    value={form.displayOrder}
                    onChange={handleInput}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400"
                    placeholder="Ko'rsatish tartibi"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Icon URL</label>
                  <input
                    name="iconUrl"
                    value={form.iconUrl}
                    onChange={handleInput}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400"
                    placeholder="Icon URL"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Tavsif</label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleInput}
                    rows="3"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400"
                    placeholder="Qisqacha tavsif"
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
