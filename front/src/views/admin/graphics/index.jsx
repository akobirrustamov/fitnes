import React, { useEffect, useState } from "react";
import axios from "axios";
import ApiCall, { baseUrl } from "config";
import { Plus, Edit, Trash2, Download } from "lucide-react";
import { Modal } from "react-responsive-modal";
import "react-responsive-modal/styles.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const DAYS = [
  { key: "isMonday", label: "Du" },
  { key: "isTuesday", label: "Se" },
  { key: "isWednesday", label: "Ch" },
  { key: "isThursday", label: "Pa" },
  { key: "isFriday", label: "Ju" },
  { key: "isSaturday", label: "Sh" },
  { key: "isSunday", label: "Ya" },
];

const EMPTY_FORM = {
  name: "",
  description: "",
  isMonday: false,
  isTuesday: false,
  isWednesday: false,
  isThursday: false,
  isFriday: false,
  isSaturday: false,
  isSunday: false,
};

export default function GraphicsPage() {
  const [graphics, setGraphics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [downloadingExcel, setDownloadingExcel] = useState(false);

  useEffect(() => {
    fetchGraphics();
  }, []);

  const fetchGraphics = async () => {
    setLoading(true);
    const res = await ApiCall("/api/v1/organizations/graphics/getAll", "GET");
    setLoading(false);
    if (!res?.error) setGraphics(res.data || []);
    else toast.error("Grafiklar yuklanmadi");
  };

  const openCreate = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (g) => {
    setEditId(g.id);
    setForm({
      name: g.name || "",
      description: g.description || "",
      isMonday: !!g.isMonday,
      isTuesday: !!g.isTuesday,
      isWednesday: !!g.isWednesday,
      isThursday: !!g.isThursday,
      isFriday: !!g.isFriday,
      isSaturday: !!g.isSaturday,
      isSunday: !!g.isSunday,
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Grafik nomi kiritilishi shart"); return; }
    setSaving(true);
    const url = editId
      ? `/api/v1/organizations/graphics/update?id=${editId}`
      : "/api/v1/organizations/graphics/create";
    const method = editId ? "PUT" : "POST";
    const res = await ApiCall(url, method, form);
    setSaving(false);
    if (!res?.error) {
      toast.success(editId ? "Grafik yangilandi" : "Grafik qo'shildi");
      closeModal();
      fetchGraphics();
    } else {
      toast.error(res.data?.message || "Xatolik yuz berdi");
    }
  };

  const handleDelete = async (g) => {
    if (!window.confirm(`"${g.name}" grafikini o'chirmoqchimisiz?`)) return;
    const res = await ApiCall(`/api/v1/organizations/graphics/delete?id=${g.id}`, "DELETE");
    if (!res?.error) {
      toast.success("Grafik o'chirildi");
      fetchGraphics();
    } else {
      toast.error(res.data?.message || "O'chirishda xatolik");
    }
  };

  const handleDownloadExcel = async () => {
    setDownloadingExcel(true);
    try {
      const token = localStorage.getItem("access_token");
      const res = await axios.get(`${baseUrl}/api/v1/organizations/graphics/downloadExcel`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = "grafiklar.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Excel yuklab olishda xatolik.");
    }
    setDownloadingExcel(false);
  };

  const activeDays = (g) =>
    DAYS.filter((d) => g[d.key]).map((d) => d.label).join(", ") || "—";

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Ish grafiklari</h1>
            <p className="mt-1 text-sm text-gray-500">Jami: {graphics.length} ta grafik</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadExcel}
              disabled={downloadingExcel}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
            >
              <Download size={16} /> {downloadingExcel ? "Yuklanmoqda..." : "Excel"}
            </button>
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700"
            >
              <Plus size={16} /> Yangi grafik
            </button>
          </div>
        </div>

        {/* List */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          {loading ? (
            <div className="py-12 text-center text-sm text-gray-400">Yuklanmoqda...</div>
          ) : graphics.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-400">Grafiklar topilmadi</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {graphics.map((g) => (
                <div key={g.id} className="flex items-center gap-4 px-6 py-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{g.name}</p>
                    {g.description && (
                      <p className="mt-0.5 text-sm text-gray-500">{g.description}</p>
                    )}
                    <div className="mt-1 flex flex-wrap gap-1">
                      {DAYS.map((d) => (
                        <span
                          key={d.key}
                          className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${
                            g[d.key]
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-400"
                          }`}
                        >
                          {d.label}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-2">
                    <button
                      onClick={() => openEdit(g)}
                      className="rounded-lg bg-gray-100 px-3 py-1.5 text-gray-700 transition hover:bg-gray-200"
                      title="Tahrirlash"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(g)}
                      className="rounded-lg bg-pink-50 px-3 py-1.5 text-pink-600 transition hover:bg-pink-100"
                      title="O'chirish"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      <Modal open={showModal} onClose={closeModal} center>
        <div className="w-[480px] max-w-full p-6">
          <h2 className="mb-5 text-lg font-semibold text-gray-900">
            {editId ? "Grafikni tahrirlash" : "Yangi grafik"}
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
                placeholder="Grafik nomi"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-400"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Tavsif</label>
              <input
                name="description"
                value={form.description}
                onChange={handleInput}
                placeholder="Masalan: 8:00-20:00"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-400"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Ish kunlari</label>
              <div className="grid grid-cols-4 gap-2">
                {DAYS.map((d) => (
                  <label
                    key={d.key}
                    className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                      form[d.key]
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      name={d.key}
                      checked={form[d.key]}
                      onChange={handleInput}
                      className="hidden"
                    />
                    {d.label}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
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
