import React, { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import ApiCall from "../../../config";
import { Plus, Edit, Trash2, ArrowLeft } from "lucide-react";
import { Modal } from "react-responsive-modal";
import "react-responsive-modal/styles.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function MarketPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const organizationId = searchParams.get("organizationId");
  const categoryId = searchParams.get("categoryId");
  const categoryName = searchParams.get("categoryName") || "Mahsulot";
  const orgName = searchParams.get("orgName") || "Zal";

  const [products, setProducts] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    stockCount: "",
    barcode: "",
    active: true,
  });

  const nameInputRef = useRef(null);

  useEffect(() => {
    if (!organizationId) {
      navigate("/superadmin/categories");
      return;
    }
    fetchProducts();
    fetchSuggestions();
  }, [organizationId, categoryId]);

  const fetchProducts = async () => {
    const params = { organizationId, page: 1, limit: 200 };
    if (categoryId) params.categoryId = categoryId;
    const result = await ApiCall("/api/v1/organizations/market/getAll", "GET", null, params);
    if (!result?.error) setProducts(result.data?.data || []);
  };

  const fetchSuggestions = async () => {
    const url = categoryId
      ? `/api/v1/organizations/market/suggestions?categoryId=${categoryId}`
      : "/api/v1/organizations/market/suggestions";
    const result = await ApiCall(url, "GET");
    if (!result?.error) setSuggestions(Array.isArray(result.data) ? result.data : []);
  };

  const resetForm = () => {
    setForm({ name: "", description: "", price: "", stockCount: "", barcode: "", active: true });
    setEditId(null);
    setShowSuggestions(false);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (product) => {
    setEditId(product.id);
    setForm({
      name: product.name || "",
      description: product.description || "",
      price: product.price != null ? String(product.price) : "",
      stockCount: product.stockCount != null ? String(product.stockCount) : "",
      barcode: product.barcode || "",
      active: product.active !== false,
    });
    setShowSuggestions(false);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleInput = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    if (name === "name") setShowSuggestions(true);
  };

  const selectSuggestion = (name) => {
    setForm((prev) => ({ ...prev, name }));
    setShowSuggestions(false);
    nameInputRef.current?.focus();
  };

  const filteredSuggestions = suggestions.filter(
    (s) => form.name.length > 0 && s.toLowerCase().includes(form.name.toLowerCase()) && s !== form.name
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const payload = {
      categoryId: categoryId ? parseInt(categoryId) : null,
      name: form.name,
      description: form.description || null,
      price: form.price ? parseFloat(form.price) : null,
      stockCount: form.stockCount ? parseInt(form.stockCount) : 0,
      barcode: form.barcode || null,
      active: form.active,
    };

    const result = editId
      ? await ApiCall(`/api/v1/organizations/market/update?id=${editId}&organizationId=${organizationId}`, "PUT", payload)
      : await ApiCall(`/api/v1/organizations/market/create?organizationId=${organizationId}`, "POST", payload);

    setLoading(false);
    if (!result?.error) {
      await fetchProducts();
      closeModal();
      toast.success(editId ? "Mahsulot yangilandi." : "Mahsulot qo'shildi.");
    } else {
      toast.error(result?.data?.message || "Xatolik yuz berdi.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Mahsulotni o'chirishni xohlaysizmi?")) return;
    const result = await ApiCall(
      `/api/v1/organizations/market/delete?id=${id}&organizationId=${organizationId}`,
      "DELETE"
    );
    if (!result?.error) {
      await fetchProducts();
      toast.success("Mahsulot o'chirildi.");
    } else {
      toast.error(result?.data?.message || "O'chirishda xatolik.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/superadmin/categories")}
                className="rounded-lg bg-gray-100 p-2 text-gray-600 hover:bg-gray-200"
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">{orgName}</h1>
                <p className="mt-0.5 text-sm text-gray-500">{categoryName} mahsulotlari</p>
              </div>
            </div>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700"
            >
              <Plus size={16} /> Yangi mahsulot
            </button>
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 font-semibold text-gray-900">
              Mahsulotlar ro'yxati
            </div>
            <div className="overflow-x-auto px-6 py-4">
              <table className="min-w-full text-left text-sm text-gray-700">
                <thead>
                  <tr>
                    <th className="pb-3 font-medium">Nomi</th>
                    <th className="pb-3 font-medium">Narxi</th>
                    <th className="pb-3 font-medium">Qoldiq</th>
                    <th className="pb-3 font-medium">Holat</th>
                    <th className="pb-3 text-right font-medium">Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-gray-500">
                        Mahsulotlar topilmadi.
                      </td>
                    </tr>
                  ) : (
                    products.map((product) => (
                      <tr key={product.id} className="border-t border-gray-200">
                        <td className="py-3 font-medium">{product.name}</td>
                        <td className="py-3">
                          {product.price != null ? `${Number(product.price).toLocaleString()} so'm` : "—"}
                        </td>
                        <td className="py-3">{product.stockCount ?? 0}</td>
                        <td className="py-3">
                          {product.active ? (
                            <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
                              Faol
                            </span>
                          ) : (
                            <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-600">
                              Nofaol
                            </span>
                          )}
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => openEditModal(product)}
                            className="mr-2 rounded-lg bg-gray-100 px-3 py-1 text-sm text-gray-700 hover:bg-gray-200"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
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
        <div className="w-[460px] max-w-full p-6">
          <div className="mb-4 text-lg font-semibold text-gray-900">
            {editId ? "Mahsulotni tahrirlash" : "Yangi mahsulot qo'shish"}
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <label className="mb-2 block text-sm font-medium text-gray-700">Nomi</label>
              <input
                required
                ref={nameInputRef}
                name="name"
                value={form.name}
                onChange={handleInput}
                onFocus={() => form.name.length > 0 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                autoComplete="off"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-400"
                placeholder="Mahsulot nomi"
              />
              {showSuggestions && filteredSuggestions.length > 0 && (
                <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg">
                  {filteredSuggestions.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      onMouseDown={() => selectSuggestion(s)}
                      className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Narxi (so'm)</label>
              <input
                type="number"
                name="price"
                value={form.price}
                onChange={handleInput}
                min="0"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-400"
                placeholder="Narxi"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Qoldiq (dona)</label>
              <input
                type="number"
                name="stockCount"
                value={form.stockCount}
                onChange={handleInput}
                min="0"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-400"
                placeholder="Ombordagi miqdor"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Shtrix-kod</label>
              <input
                name="barcode"
                value={form.barcode}
                onChange={handleInput}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-400"
                placeholder="Barcode (ixtiyoriy)"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Tavsif</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleInput}
                rows="2"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-400"
                placeholder="Qisqacha tavsif (ixtiyoriy)"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="active"
                name="active"
                checked={form.active}
                onChange={handleInput}
                className="h-4 w-4 rounded"
              />
              <label htmlFor="active" className="text-sm font-medium text-gray-700">
                Faol (sotuvga chiqarilgan)
              </label>
            </div>

            <div className="flex items-center gap-3 pt-2">
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
