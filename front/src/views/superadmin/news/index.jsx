import React, { useEffect, useState } from "react";
import ApiCall from "../../../config";
import { Plus, Edit, Trash2, X } from "lucide-react";
import { Modal } from "react-responsive-modal";
import "react-responsive-modal/styles.css";

export default function NewsPage() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    content: "",
    photoUrl: "",
    url: "",
    startTime: "",
    endTime: "",
  });

  const safeArray = (value) => (Array.isArray(value) ? value : []);
  const newsList = safeArray(news);

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    const result = await ApiCall(
      "/api/v1/admin/news/getAll",
      "GET",
      null,
      { page: 1, pageSize: 50 }
    );
    if (!result?.error) {
      setNews(result.data?.items || result.data || []);
    }
  };

  const handleInput = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      content: "",
      photoUrl: "",
      url: "",
      startTime: "",
      endTime: "",
    });
    setEditId(null);
    setMessage("");
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const handleEdit = (newsItem) => {
    setEditId(newsItem.newsId);
    setForm({
      title: newsItem.title || "",
      description: newsItem.description || "",
      content: newsItem.content || "",
      photoUrl: newsItem.photoUrl || "",
      url: newsItem.url || "",
      startTime: newsItem.startTime || "",
      endTime: newsItem.endTime || "",
    });
    setMessage("");
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
      title: form.title,
      description: form.description,
      content: form.content,
      photoUrl: form.photoUrl,
      url: form.url,
      startTime: form.startTime || null,
      endTime: form.endTime || null,
    };

    const apiUrl = editId
      ? `/api/v1/admin/news/update?id=${editId}`
      : "/api/v1/admin/news/create";
    const method = editId ? "PUT" : "POST";

    const result = await ApiCall(apiUrl, method, payload);
    setLoading(false);

    if (!result?.error) {
      await fetchNews();
      closeModal();
      setMessage(editId ? "Yangilik yangilandi." : "Yangi yangilik yaratildi.");
    } else {
      setMessage("Xatolik yuz berdi. Iltimos, ma'lumotlarni tekshiring.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Ushbu yangilikni o'chirishni xohlaysizmi?")) return;
    const result = await ApiCall(
      `/api/v1/admin/news/delete?id=${id}`,
      "DELETE"
    );
    if (!result?.error) {
      await fetchNews();
      setMessage("Yangilik o'chirildi.");
    } else {
      setMessage("Yangilikni o'chirishda xatolik yuz berdi.");
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen p-4">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="border-gray-200 rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-gray-900 text-2xl font-semibold">
                Yangiliklar
              </h1>
              <p className="text-gray-600 mt-1 text-sm">
                Yangiliklar ro'yxatini ko'rish va boshqarish.
              </p>
            </div>
            <button
              onClick={openCreateModal}
              className="bg-gray-900 hover:bg-gray-700 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition"
            >
              <Plus size={16} /> Yangi yangilik
            </button>
          </div>

          {message && (
            <div className="mt-4 rounded-xl bg-green-50 p-4 text-sm text-green-700">
              {message}
            </div>
          )}

          <div className="mt-6 space-y-4">
            {newsList.length === 0 ? (
              <div className="text-gray-500 text-center py-8">
                Yangiliklar topilmadi.
              </div>
            ) : (
              newsList.map((item) => (
                <div
                  key={item.newsId}
                  className="border-gray-200 rounded-xl border bg-white p-4 hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-gray-900 font-semibold">
                        {item.title}
                      </h3>
                      <p className="text-gray-600 mt-2 text-sm">
                        {item.description}
                      </p>
                      {item.createdTime && (
                        <p className="text-gray-500 mt-2 text-xs">
                          {new Date(item.createdTime).toLocaleDateString(
                            "uz-UZ"
                          )}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg px-3 py-1 text-sm"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.newsId)}
                        className="bg-rose-100 text-rose-700 hover:bg-rose-200 rounded-lg px-3 py-1 text-sm"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <Modal open={showModal} onClose={closeModal} center>
        <div className="w-[520px] max-w-full p-6">
          <div className="text-gray-900 mb-4 text-lg font-semibold">
            {editId ? "Yangilikni tahrirlash" : "Yangi yangilik qo'shish"}
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-gray-700 mb-2 block text-sm font-medium">
                Sarlavha
              </label>
              <input
                required
                name="title"
                value={form.title}
                onChange={handleInput}
                className="border-gray-200 bg-gray-50 text-gray-900 focus:border-gray-400 w-full rounded-xl border px-4 py-3 text-sm outline-none"
                placeholder="Yangilik sarlavhasi"
              />
            </div>
            <div>
              <label className="text-gray-700 mb-2 block text-sm font-medium">
                Qisqacha tavsif
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleInput}
                rows="2"
                className="border-gray-200 bg-gray-50 text-gray-900 focus:border-gray-400 w-full rounded-xl border px-4 py-3 text-sm outline-none"
                placeholder="Yangilik tavsifi"
              />
            </div>
            <div>
              <label className="text-gray-700 mb-2 block text-sm font-medium">
                Kontent
              </label>
              <textarea
                name="content"
                value={form.content}
                onChange={handleInput}
                rows="5"
                className="border-gray-200 bg-gray-50 text-gray-900 focus:border-gray-400 w-full rounded-xl border px-4 py-3 text-sm outline-none"
                placeholder="Yangilik matni"
              />
            </div>
            <div>
              <label className="text-gray-700 mb-2 block text-sm font-medium">
                Rasm URL
              </label>
              <input
                name="photoUrl"
                value={form.photoUrl}
                onChange={handleInput}
                className="border-gray-200 bg-gray-50 text-gray-900 focus:border-gray-400 w-full rounded-xl border px-4 py-3 text-sm outline-none"
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <div>
              <label className="text-gray-700 mb-2 block text-sm font-medium">
                URL
              </label>
              <input
                name="url"
                value={form.url}
                onChange={handleInput}
                className="border-gray-200 bg-gray-50 text-gray-900 focus:border-gray-400 w-full rounded-xl border px-4 py-3 text-sm outline-none"
                placeholder="https://example.com"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-gray-700 mb-2 block text-sm font-medium">
                  Boshlanish vaqti
                </label>
                <input
                  type="datetime-local"
                  name="startTime"
                  value={form.startTime}
                  onChange={handleInput}
                  className="border-gray-200 bg-gray-50 text-gray-900 focus:border-gray-400 w-full rounded-xl border px-4 py-3 text-sm outline-none"
                />
              </div>
              <div>
                <label className="text-gray-700 mb-2 block text-sm font-medium">
                  Tugatish vaqti
                </label>
                <input
                  type="datetime-local"
                  name="endTime"
                  value={form.endTime}
                  onChange={handleInput}
                  className="border-gray-200 bg-gray-50 text-gray-900 focus:border-gray-400 w-full rounded-xl border px-4 py-3 text-sm outline-none"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-gray-900 hover:bg-gray-700 inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
              >
                {editId ? "Yangilash" : "Saqlash"}
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
    </div>
  );
}
