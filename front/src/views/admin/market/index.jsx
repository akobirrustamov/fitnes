import React, { useEffect, useRef, useState } from "react";
import ApiCall from "config";
import { Plus, Edit, Trash2, Image, ShoppingBag } from "lucide-react";
import { Modal } from "react-responsive-modal";
import "react-responsive-modal/styles.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const PAGE_SIZE = 20;

const EMPTY_FORM = {
  categoryId: "",
  name: "",
  description: "",
  photoUrl: "",
  price: "",
  stockCount: "",
  barcode: "",
  active: true,
};

const fmtMoney = (n) => `${Number(n || 0).toLocaleString()} so'm`;

export default function MarketPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileRef = useRef(null);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  useEffect(() => {
    fetchProducts(page);
  }, [page]);

  useEffect(() => {
    ApiCall("/api/v1/admin/categories/getAll", "GET").then((res) => {
      if (!res?.error) setCategories(res.data || []);
    });
  }, []);

  const fetchProducts = async (p = 1) => {
    setLoading(true);
    const res = await ApiCall("/api/v1/organizations/market/getAll", "GET", null, {
      page: p,
      limit: PAGE_SIZE,
    });
    setLoading(false);
    if (!res?.error) {
      setProducts(res.data?.data || []);
      setTotalCount(res.data?.totalCount || 0);
    } else {
      toast.error("Mahsulotlar yuklanmadi");
    }
  };

  const openCreate = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (p) => {
    setEditId(p.id);
    setForm({
      categoryId: p.categoryId != null ? String(p.categoryId) : "",
      name: p.name || "",
      description: p.description || "",
      photoUrl: p.photoUrl || "",
      price: p.price != null ? String(p.price) : "",
      stockCount: p.stockCount != null ? String(p.stockCount) : "",
      barcode: p.barcode || "",
      active: p.active !== false,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditId(null);
    setForm(EMPTY_FORM);
  };

  const handleInput = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.includes("jpeg") && !file.type.includes("jpg")) {
      toast.error("Faqat JPEG/JPG formatidagi rasm qabul qilinadi");
      e.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Rasm hajmi 5MB dan oshmasligi kerak");
      e.target.value = "";
      return;
    }
    const formData = new FormData();
    formData.append("photo", file);
    setUploadingPhoto(true);
    const res = await ApiCall("/api/v1/systemC/upload", "POST", formData);
    setUploadingPhoto(false);
    e.target.value = "";
    if (!res?.error) {
      setForm((prev) => ({ ...prev, photoUrl: res.data.url }));
      toast.success("Rasm yuklandi");
    } else {
      toast.error(res.data?.message || "Rasm yuklashda xatolik");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Mahsulot nomi kiritilishi shart"); return; }
    setSaving(true);
    const payload = {
      categoryId: form.categoryId ? Number(form.categoryId) : null,
      name: form.name.trim(),
      description: form.description.trim(),
      photoUrl: form.photoUrl,
      price: form.price ? Number(form.price) : 0,
      stockCount: form.stockCount ? Number(form.stockCount) : 0,
      barcode: form.barcode.trim(),
      active: form.active,
    };
    const url = editId
      ? `/api/v1/organizations/market/update?id=${editId}`
      : "/api/v1/organizations/market/create";
    const method = editId ? "PUT" : "POST";
    const res = await ApiCall(url, method, payload);
    setSaving(false);
    if (!res?.error) {
      toast.success(editId ? "Mahsulot yangilandi" : "Mahsulot qo'shildi");
      closeModal();
      fetchProducts(editId ? page : 1);
      if (!editId) setPage(1);
    } else {
      toast.error(res.data?.message || "Xatolik yuz berdi");
    }
  };

  const handleDelete = async (p) => {
    if (!window.confirm(`"${p.name}" mahsulotini o'chirmoqchimisiz?`)) return;
    const res = await ApiCall(`/api/v1/organizations/market/delete?id=${p.id}`, "DELETE");
    if (!res?.error) {
      toast.success("Mahsulot o'chirildi");
      fetchProducts(page);
    } else {
      toast.error(res.data?.message || "O'chirishda xatolik");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Market</h1>
            <p className="mt-1 text-sm text-gray-500">Jami: {totalCount} ta mahsulot</p>
          </div>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700"
          >
            <Plus size={16} /> Yangi mahsulot
          </button>
        </div>

        {/* List */}
        <div className="space-y-3">
          {loading ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-sm text-gray-400">
              Yuklanmoqda...
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-sm text-gray-400">
              Mahsulotlar topilmadi
            </div>
          ) : (
            products.map((p) => (
              <div
                key={p.id}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <div className="flex gap-4">
                  {p.photoUrl ? (
                    <img
                      src={p.photoUrl}
                      alt={p.name}
                      className="h-16 w-16 flex-shrink-0 rounded-xl object-cover"
                      onError={(e) => { e.target.style.display = "none"; }}
                    />
                  ) : (
                    <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl bg-gray-100">
                      <ShoppingBag size={22} className="text-gray-400" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-gray-900">{p.name}</h3>
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                              p.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                            }`}
                          >
                            {p.active ? "Faol" : "Nofaol"}
                          </span>
                          {p.categoryName && (
                            <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                              {p.categoryName}
                            </span>
                          )}
                        </div>
                        {p.description && (
                          <p className="mt-0.5 text-sm text-gray-500 line-clamp-1">{p.description}</p>
                        )}
                        <div className="mt-1 flex flex-wrap gap-3 text-sm">
                          <span className="font-semibold text-blue-600">{fmtMoney(p.price)}</span>
                          <span className="text-gray-500">
                            Ombor: <span className={p.stockCount <= 5 ? "text-pink-500 font-medium" : ""}>{p.stockCount}</span>
                          </span>
                          {p.barcode && <span className="text-xs text-gray-400">#{p.barcode}</span>}
                        </div>
                      </div>
                      <div className="flex flex-shrink-0 items-center gap-2">
                        <button
                          onClick={() => openEdit(p)}
                          className="rounded-lg bg-gray-100 px-3 py-1.5 text-gray-700 transition hover:bg-gray-200"
                          title="Tahrirlash"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(p)}
                          className="rounded-lg bg-pink-50 px-3 py-1.5 text-pink-600 transition hover:bg-pink-100"
                          title="O'chirish"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Oldingi
            </button>
            <span className="text-sm text-gray-500">{page} / {totalPages}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Keyingi
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal open={showModal} onClose={closeModal} center>
        <div className="w-[520px] max-w-full p-6">
          <h2 className="mb-5 text-lg font-semibold text-gray-900">
            {editId ? "Mahsulotni tahrirlash" : "Yangi mahsulot"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Nomi <span className="text-pink-500">*</span>
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleInput}
                required
                placeholder="Protein Powder 1kg"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Kategoriya</label>
                {categories.length > 0 ? (
                  <select
                    name="categoryId"
                    value={form.categoryId}
                    onChange={handleInput}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-400"
                  >
                    <option value="">— Tanlang —</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.nameUz || c.nameRu}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="number"
                    name="categoryId"
                    value={form.categoryId}
                    onChange={handleInput}
                    placeholder="Kategoriya ID"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-400"
                  />
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Barcode</label>
                <input
                  name="barcode"
                  value={form.barcode}
                  onChange={handleInput}
                  placeholder="123456789"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-400"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Narx (so'm)</label>
                <input
                  type="number"
                  name="price"
                  value={form.price}
                  onChange={handleInput}
                  placeholder="250000"
                  min="0"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-400"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Ombordagi soni</label>
                <input
                  type="number"
                  name="stockCount"
                  value={form.stockCount}
                  onChange={handleInput}
                  placeholder="50"
                  min="0"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-400"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Tavsif</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleInput}
                rows={2}
                placeholder="Mahsulot haqida..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-400"
              />
            </div>

            {/* Photo */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Rasm (JPEG, max 5MB)
              </label>
              <div className="flex items-center gap-3">
                <input ref={fileRef} type="file" accept=".jpg,.jpeg" onChange={handlePhotoUpload} className="hidden" />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                >
                  <Image size={15} />
                  {uploadingPhoto ? "Yuklanmoqda..." : "Rasm yuklash"}
                </button>
                {form.photoUrl && (
                  <img
                    src={form.photoUrl}
                    alt="preview"
                    className="h-10 w-10 rounded-lg object-cover"
                    onError={(e) => { e.target.style.display = "none"; }}
                  />
                )}
              </div>
            </div>

            {/* Active */}
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                name="active"
                checked={form.active}
                onChange={handleInput}
                className="h-4 w-4 rounded"
              />
              <span className="text-sm font-medium text-gray-700">Faol</span>
            </label>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={saving || uploadingPhoto}
                className="inline-flex items-center justify-center rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-700 disabled:opacity-60"
              >
                {saving ? "Saqlanmoqda..." : editId ? "Yangilash" : "Saqlash"}
              </button>
              <button
                type="button"
                onClick={closeModal}
                className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Bekor qilish
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
