import React, { useEffect, useRef, useState } from "react";
import ApiCall from "../../../config";
import { Plus, Edit, Trash2, Image, ExternalLink } from "lucide-react";
import { Modal } from "react-responsive-modal";
import "react-responsive-modal/styles.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const PAGE_SIZE = 20;

const EMPTY_FORM = {
  title: "",
  description: "",
  content: "",
  photoUrl: "",
  url: "",
  startTime: "",
  endTime: "",
};

export default function NewsPage() {
  const [news, setNews] = useState([]);
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
    fetchNews(page);
  }, [page]);

  const fetchNews = async (p = 1) => {
    setLoading(true);
    const result = await ApiCall("/api/v1/admin/news/getAll", "GET", null, {
      page: p,
      pageSize: PAGE_SIZE,
    });
    setLoading(false);
    if (!result?.error) {
      setNews(result.data?.items || []);
      setTotalCount(result.data?.totalCount || 0);
    } else {
      toast.error("Yangiliklar yuklanmadi");
    }
  };

  const handleInput = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
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

  const openCreate = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditId(item.newsId);
    setForm({
      title: item.title || "",
      description: item.description || "",
      content: item.content || "",
      photoUrl: item.photoUrl || "",
      url: item.url || "",
      startTime: item.startTime ? item.startTime.slice(0, 16) : "",
      endTime: item.endTime ? item.endTime.slice(0, 16) : "",
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditId(null);
    setForm(EMPTY_FORM);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Sarlavha kiritilishi shart");
      return;
    }
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      content: form.content.trim(),
      photoUrl: form.photoUrl.trim(),
      url: form.url.trim(),
      startTime: form.startTime || null,
      endTime: form.endTime || null,
    };

    const url = editId
      ? `/api/v1/admin/news/update?id=${editId}`
      : "/api/v1/admin/news/create";
    const method = editId ? "PUT" : "POST";

    const result = await ApiCall(url, method, payload);
    setSaving(false);

    if (!result?.error) {
      toast.success(editId ? "Yangilik yangilandi" : "Yangilik qo'shildi");
      closeModal();
      fetchNews(editId ? page : 1);
      if (!editId) setPage(1);
    } else {
      const msg = result.data?.message || "Xatolik yuz berdi";
      toast.error(msg);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`"${item.title}" yangiligini o'chirishni xohlaysizmi?`))
      return;
    const result = await ApiCall(
      `/api/v1/admin/news/delete?id=${item.newsId}`,
      "DELETE"
    );
    if (!result?.error) {
      toast.success("Yangilik o'chirildi");
      fetchNews(page);
    } else {
      const msg = result.data?.message || "O'chirishda xatolik yuz berdi";
      toast.error(msg);
    }
  };

  const fmt = (dt) =>
    dt
      ? new Date(dt).toLocaleString("uz-UZ", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Yangiliklar</h1>
            <p className="mt-1 text-sm text-gray-500">
              Jami: {totalCount} ta yangilik
            </p>
          </div>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700"
          >
            <Plus size={16} /> Yangi yangilik
          </button>
        </div>

        {/* List */}
        <div className="space-y-3">
          {loading ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-sm text-gray-400">
              Yuklanmoqda...
            </div>
          ) : news.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-sm text-gray-400">
              Yangiliklar topilmadi
            </div>
          ) : (
            news.map((item) => (
              <div
                key={item.newsId}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <div className="flex gap-4">
                  {item.photoUrl && (
                    <img
                      src={item.photoUrl}
                      alt={item.title}
                      className="h-20 w-20 flex-shrink-0 rounded-xl object-cover"
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate font-semibold text-gray-900">
                          {item.title}
                        </h3>
                        {item.description && (
                          <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                            {item.description}
                          </p>
                        )}
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-400">
                          <span>{fmt(item.createdTime)}</span>
                          {item.url && (
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-blue-500 hover:underline"
                            >
                              <ExternalLink size={11} /> Havola
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-shrink-0 items-center gap-2">
                        <button
                          onClick={() => openEdit(item)}
                          className="rounded-lg bg-gray-100 px-3 py-1.5 text-gray-700 transition hover:bg-gray-200"
                          title="Tahrirlash"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
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
            <span className="text-sm text-gray-500">
              {page} / {totalPages}
            </span>
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
        <div className="w-[560px] max-w-full p-6">
          <h2 className="mb-5 text-lg font-semibold text-gray-900">
            {editId ? "Yangilikni tahrirlash" : "Yangi yangilik qo'shish"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Sarlavha <span className="text-pink-500">*</span>
              </label>
              <input
                name="title"
                value={form.title}
                onChange={handleInput}
                required
                placeholder="Yangilik sarlavhasi"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-400"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Qisqacha tavsif
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleInput}
                rows={2}
                placeholder="Yangilik haqida qisqacha..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-400"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Kontent (to'liq matn)
              </label>
              <textarea
                name="content"
                value={form.content}
                onChange={handleInput}
                rows={5}
                placeholder="Yangilik matni..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-400"
              />
            </div>

            {/* Photo upload */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Rasm (JPEG, max 5MB)
              </label>
              <div className="flex items-center gap-3">
                <input
                  ref={fileRef}
                  type="file"
                  accept=".jpg,.jpeg"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
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
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                )}
              </div>
              {form.photoUrl && (
                <p className="mt-1 truncate text-xs text-gray-400">
                  {form.photoUrl}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Havola (URL)
              </label>
              <input
                name="url"
                value={form.url}
                onChange={handleInput}
                placeholder="https://example.com"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Boshlanish vaqti
                </label>
                <input
                  type="datetime-local"
                  name="startTime"
                  value={form.startTime}
                  onChange={handleInput}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-400"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Tugash vaqti
                </label>
                <input
                  type="datetime-local"
                  name="endTime"
                  value={form.endTime}
                  onChange={handleInput}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-400"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={saving || uploadingPhoto}
                className="inline-flex items-center justify-center rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
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
