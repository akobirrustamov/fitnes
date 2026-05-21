import React, { useEffect, useRef, useState } from "react";
import ApiCall from "config";
import PhoneInput from "components/PhoneInput";
import { Plus, Edit, Trash2, User, Image } from "lucide-react";
import { Modal } from "react-responsive-modal";
import "react-responsive-modal/styles.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const EMPTY_FORM = {
  fullname: "",
  phoneNumber: "+998",
  specialization: "",
  achievements: "",
  bio: "",
  price: "",
  experienceYears: "",
  photoUrl: "",
  active: true,
};

const fmtMoney = (n) => `${Number(n || 0).toLocaleString()} so'm`;

export default function TrainersPage() {
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    fetchTrainers();
  }, []);

  const fetchTrainers = async () => {
    setLoading(true);
    const res = await ApiCall("/api/v1/organizations/trainers/getAll", "GET");
    setLoading(false);
    if (!res?.error) setTrainers(res.data || []);
    else toast.error("Murabbiylar yuklanmadi");
  };

  const openCreate = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (t) => {
    setEditId(t.id);
    setForm({
      fullname: t.fullname || "",
      phoneNumber: t.phoneNumber || "+998",
      specialization: t.specialization || "",
      achievements: t.achievements || "",
      bio: t.bio || "",
      price: t.price != null ? String(t.price) : "",
      experienceYears: t.experienceYears != null ? String(t.experienceYears) : "",
      photoUrl: t.photoUrl || "",
      active: t.active !== false,
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
    if (file.size > 200 * 1024) {
      toast.error("Rasm hajmi 200KB dan oshmasligi kerak");
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
    if (!form.fullname.trim()) { toast.error("Ism kiritilishi shart"); return; }
    setSaving(true);
    const payload = {
      fullname: form.fullname.trim(),
      phoneNumber: form.phoneNumber.trim(),
      specialization: form.specialization.trim(),
      achievements: form.achievements.trim(),
      bio: form.bio.trim(),
      price: form.price ? Number(form.price) : 0,
      experienceYears: form.experienceYears ? Number(form.experienceYears) : 0,
      photoUrl: form.photoUrl,
      active: form.active,
    };
    const url = editId
      ? `/api/v1/organizations/trainers/update?id=${editId}`
      : "/api/v1/organizations/trainers/create";
    const method = editId ? "PUT" : "POST";
    const res = await ApiCall(url, method, payload);
    setSaving(false);
    if (!res?.error) {
      toast.success(editId ? "Murabbiy yangilandi" : "Murabbiy qo'shildi");
      closeModal();
      fetchTrainers();
    } else {
      toast.error(res.data?.message || "Xatolik yuz berdi");
    }
  };

  const handleDelete = async (t) => {
    if (!window.confirm(`"${t.fullname}" murabbiyini o'chirmoqchimisiz?`)) return;
    const res = await ApiCall(`/api/v1/organizations/trainers/delete?id=${t.id}`, "DELETE");
    if (!res?.error) {
      toast.success("Murabbiy o'chirildi");
      fetchTrainers();
    } else {
      toast.error(res.data?.message || "O'chirishda xatolik");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Murabbiylar</h1>
            <p className="mt-1 text-sm text-gray-500">Jami: {trainers.length} ta murabbiy</p>
          </div>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700"
          >
            <Plus size={16} /> Yangi murabbiy
          </button>
        </div>

        {/* List */}
        <div className="space-y-3">
          {loading ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-sm text-gray-400">
              Yuklanmoqda...
            </div>
          ) : trainers.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-sm text-gray-400">
              Murabbiylar topilmadi
            </div>
          ) : (
            trainers.map((t) => (
              <div
                key={t.id}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <div className="flex gap-4">
                  {t.photoUrl ? (
                    <img
                      src={t.photoUrl}
                      alt={t.fullname}
                      className="h-16 w-16 flex-shrink-0 rounded-xl object-cover"
                      onError={(e) => { e.target.style.display = "none"; }}
                    />
                  ) : (
                    <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl bg-gray-100">
                      <User size={24} className="text-gray-400" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">{t.fullname}</h3>
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                              t.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                            }`}
                          >
                            {t.active ? "Faol" : "Nofaol"}
                          </span>
                        </div>
                        <p className="mt-0.5 text-sm text-gray-500">{t.specialization || "—"}</p>
                        <div className="mt-1 flex flex-wrap gap-3 text-xs text-gray-500">
                          {t.phoneNumber && <span>{t.phoneNumber}</span>}
                          {t.price > 0 && <span className="font-medium text-blue-600">{fmtMoney(t.price)}</span>}
                          {t.experienceYears > 0 && <span>{t.experienceYears} yil tajriba</span>}
                          {t.studentsCount > 0 && <span>{t.studentsCount} shogird</span>}
                        </div>
                        {t.achievements && (
                          <p className="mt-1 text-xs text-gray-400">{t.achievements}</p>
                        )}
                      </div>
                      <div className="flex flex-shrink-0 items-center gap-2">
                        <button
                          onClick={() => openEdit(t)}
                          className="rounded-lg bg-gray-100 px-3 py-1.5 text-gray-700 transition hover:bg-gray-200"
                          title="Tahrirlash"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(t)}
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
      </div>

      {/* Modal */}
      <Modal open={showModal} onClose={closeModal} center>
        <div className="w-[520px] max-w-full p-6">
          <h2 className="mb-5 text-lg font-semibold text-gray-900">
            {editId ? "Murabbiyni tahrirlash" : "Yangi murabbiy"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Ism-familiya <span className="text-pink-500">*</span>
                </label>
                <input
                  name="fullname"
                  value={form.fullname}
                  onChange={handleInput}
                  required
                  placeholder="Ahmadov Sardor"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-400"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Telefon</label>
                <PhoneInput
                  name="phoneNumber"
                  value={form.phoneNumber}
                  onChange={handleInput}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-400"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Mutaxassislik</label>
                <input
                  name="specialization"
                  value={form.specialization}
                  onChange={handleInput}
                  placeholder="Bodybuilding"
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
                  placeholder="500000"
                  min="0"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-400"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Tajriba (yil)</label>
                <input
                  type="number"
                  name="experienceYears"
                  value={form.experienceYears}
                  onChange={handleInput}
                  placeholder="5"
                  min="0"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-400"
                />
              </div>
              <div className="col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Yutuqlar</label>
                <input
                  name="achievements"
                  value={form.achievements}
                  onChange={handleInput}
                  placeholder="2x O'zbekiston chempioni"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-400"
                />
              </div>
              <div className="col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Bio</label>
                <textarea
                  name="bio"
                  value={form.bio}
                  onChange={handleInput}
                  rows={2}
                  placeholder="Qisqacha ma'lumot..."
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-400"
                />
              </div>
            </div>

            {/* Photo */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Rasm (JPEG, max 200KB)
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

            {/* Active toggle */}
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
