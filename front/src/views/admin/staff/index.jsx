import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import ApiCall, { baseUrl } from "config";
import PhoneInput from "components/PhoneInput";
import {
  Plus, Edit, Trash2, Search, Camera, Download, RefreshCcw, User,
} from "lucide-react";
import { Modal } from "react-responsive-modal";
import "react-responsive-modal/styles.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const EMPTY_FORM = {
  fullname: "", phoneNumber: "+998", gender: "", birthDate: "",
  location: "", graphicId: "", active: true, isClient: false,
};

export default function StaffPage() {
  const [staff, setStaff] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const limit = 20;

  const [search, setSearch] = useState("");
  const [filterActive, setFilterActive] = useState("");
  const [loading, setLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [target, setTarget] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [graphics, setGraphics] = useState([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState("");
  const photoFileRef = useRef(null);

  const [refreshingFace, setRefreshingFace] = useState(null);
  const [downloadingExcel, setDownloadingExcel] = useState(false);

  useEffect(() => { fetchGraphics(); }, []);

  useEffect(() => {
    if (search.length > 0 && search.length < 3) return;
    fetchStaff(1);
  }, [search, filterActive]);

  const fetchGraphics = async () => {
    const res = await ApiCall("/api/v1/organizations/graphics/getAll", "GET");
    if (!res?.error) setGraphics(res.data || []);
  };

  const fetchStaff = async (p) => {
    setLoading(true);
    const params = { page: p, limit, isClient: false };
    if (search) params.search = search;
    if (filterActive !== "") params.active = filterActive === "true";
    const res = await ApiCall("/api/v1/organizations/person/getAll", "GET", null, params);
    if (!res?.error) {
      setStaff(res.data?.data || []);
      setTotalCount(res.data?.totalCount || 0);
      setTotalPages(res.data?.totalPages || 1);
      setPage(p);
    } else {
      toast.error("Xodimlarni yuklashda xatolik");
    }
    setLoading(false);
  };

  const openCreate = () => { setForm(EMPTY_FORM); setEditId(null); setTarget(null); setShowModal(true); };
  const openEdit = (s) => {
    setEditId(s.id);
    setTarget(s);
    setForm({
      fullname: s.fullname || "", phoneNumber: s.phoneNumber || "+998",
      gender: s.gender || "", birthDate: s.birthDate || "",
      location: s.location || "", graphicId: s.graphicId || "",
      active: s.active !== false, isClient: false,
    });
    setShowModal(true);
  };
  const openPhoto = (s) => {
    setTarget(s);
    setPhotoPreview("");
    if (photoFileRef.current) photoFileRef.current.value = "";
    setShowPhotoModal(true);
  };

  const handleInput = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fullname.trim()) { toast.error("Ism bo'sh bo'lishi mumkin emas"); return; }
    setSaving(true);
    const payload = {
      ...form,
      birthDate: form.birthDate || null,
      gender: form.gender || null,
      location: form.location || null,
      graphicId: form.graphicId ? Number(form.graphicId) : null,
    };
    const res = editId
      ? await ApiCall(`/api/v1/organizations/person/update?id=${editId}`, "PUT", payload)
      : await ApiCall("/api/v1/organizations/person/create", "POST", payload);
    setSaving(false);
    if (!res?.error) {
      toast.success(editId ? "Xodim yangilandi." : "Xodim qo'shildi.");
      setShowModal(false);
      if (search.length > 0 && search.length < 3) setSearch("");
      fetchStaff(1);
    } else {
      toast.error(res.data?.message || "Xatolik yuz berdi.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Xodimni o'chirishni xohlaysizmi?")) return;
    const res = await ApiCall(`/api/v1/organizations/person/delete?id=${id}`, "DELETE");
    if (!res?.error) { toast.success("Xodim o'chirildi."); fetchStaff(1); }
    else toast.error(res.data?.message || "Xatolik.");
  };

  const handleRefreshFaceID = async (s) => {
    setRefreshingFace(s.id);
    const res = await ApiCall(`/api/v1/organizations/person/refreshInFaceID?id=${s.id}`, "POST");
    setRefreshingFace(null);
    if (!res?.error) toast.success("FaceID yangilandi.");
    else toast.error(res.data?.message || "Xatolik.");
  };

  const handlePhotoFileChange = (e) => {
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
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handlePhotoUpload = async () => {
    const file = photoFileRef.current?.files[0];
    if (!file) { toast.error("Rasm tanlang"); return; }
    const formData = new FormData();
    formData.append("photo", file);
    setUploadingPhoto(true);
    const uploadRes = await ApiCall("/api/v1/systemC/upload", "POST", formData);
    if (uploadRes?.error) {
      toast.error(uploadRes.data?.message || "Rasmni yuklashda xatolik");
      setUploadingPhoto(false);
      return;
    }
    const photoUrl = uploadRes.data?.url || uploadRes.data;
    const res = await ApiCall(`/api/v1/organizations/person/updatePhoto?id=${target.id}`, "PUT", { photoUrl });
    setUploadingPhoto(false);
    if (!res?.error) {
      toast.success("Rasm yangilandi.");
      setShowPhotoModal(false);
      fetchStaff(page);
    } else toast.error(res.data?.message || "Xatolik.");
  };

  const handleDownloadExcel = async () => {
    setDownloadingExcel(true);
    try {
      const token = localStorage.getItem("access_token");
      const res = await axios.get(`${baseUrl}/api/v1/organizations/person/downloadExcel`, {
        params: { isClient: false },
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = "xodimlar.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Excel yuklab olishda xatolik.");
    }
    setDownloadingExcel(false);
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString("uz-UZ") : "—";

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="mx-auto max-w-7xl space-y-4">

        {/* Header */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Xodimlar</h1>
              <p className="mt-0.5 text-sm text-gray-500">Jami {totalCount} ta xodim</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleDownloadExcel}
                disabled={downloadingExcel}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                <Download size={16} />
                {downloadingExcel ? "Yuklanmoqda..." : "Excel"}
              </button>
              <button
                onClick={openCreate}
                className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
              >
                <Plus size={16} /> Yangi xodim
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="mt-4 flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[180px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Ism yoki telefon (min 3 harf)..."
                className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-8 pr-3 text-sm outline-none focus:border-gray-400"
              />
            </div>
            <select
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-400"
            >
              <option value="">Barcha holat</option>
              <option value="true">Faol</option>
              <option value="false">Nofaol</option>
            </select>
            {(search || filterActive) && (
              <button
                onClick={() => { setSearch(""); setFilterActive(""); }}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-500 hover:text-gray-700"
              >
                Tozalash
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-gray-700">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 w-10"></th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Ism</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Telefon</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Manzil</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Tug'ilgan sana</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Holat</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      {[...Array(7)].map((_, j) => (
                        <td key={j} className="px-4 py-4">
                          <div className="h-4 animate-pulse rounded bg-gray-100" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : staff.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-400">
                      Xodimlar topilmadi
                    </td>
                  </tr>
                ) : (
                  staff.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        {s.photoUrl ? (
                          <img src={s.photoUrl} alt={s.fullname} className="h-8 w-8 rounded-full object-cover" />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                            <User size={14} className="text-gray-400" />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">{s.fullname}</td>
                      <td className="px-4 py-3 text-gray-500">{s.phoneNumber || "—"}</td>
                      <td className="px-4 py-3 text-gray-500">{s.location || "—"}</td>
                      <td className="px-4 py-3 text-gray-500">{formatDate(s.birthDate)}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          s.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                        }`}>
                          {s.active ? "Faol" : "Nofaol"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => openPhoto(s)}
                            title="Rasmni yangilash"
                            className="rounded-lg bg-gray-100 p-1.5 text-gray-600 hover:bg-gray-200"
                          >
                            <Camera size={13} />
                          </button>
                          <button
                            onClick={() => handleRefreshFaceID(s)}
                            disabled={refreshingFace === s.id}
                            title="FaceID yangilash"
                            className="rounded-lg bg-blue-100 p-1.5 text-blue-700 hover:bg-blue-200 disabled:opacity-50"
                          >
                            <RefreshCcw size={13} className={refreshingFace === s.id ? "animate-spin" : ""} />
                          </button>
                          <button
                            onClick={() => openEdit(s)}
                            className="rounded-lg bg-gray-100 p-1.5 text-gray-700 hover:bg-gray-200"
                          >
                            <Edit size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(s.id)}
                            className="rounded-lg bg-pink-100 p-1.5 text-pink-700 hover:bg-pink-200"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => fetchStaff(page - 1)}
              disabled={page <= 1}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40"
            >
              Oldingi
            </button>
            <span className="text-sm text-gray-600">{page} / {totalPages}</span>
            <button
              onClick={() => fetchStaff(page + 1)}
              disabled={page >= totalPages}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40"
            >
              Keyingi
            </button>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} center>
        <div className="w-[480px] max-w-full p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            {editId ? "Xodimni tahrirlash" : "Yangi xodim qo'shish"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { label: "Ism Familiya", name: "fullname", required: true, placeholder: "To'liq ism" },
              { label: "Manzil", name: "location", placeholder: "Shahar, ko'cha" },
            ].map(({ label, name, required, placeholder }) => (
              <div key={name}>
                <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
                <input
                  required={required}
                  name={name}
                  value={form[name]}
                  onChange={handleInput}
                  placeholder={placeholder}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-gray-400"
                />
              </div>
            ))}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Telefon</label>
              <PhoneInput
                name="phoneNumber"
                value={form.phoneNumber}
                onChange={handleInput}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-gray-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Jinsi</label>
              <select
                name="gender"
                value={form.gender}
                onChange={handleInput}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-gray-400"
              >
                <option value="">Tanlang</option>
                <option value="MALE">Erkak</option>
                <option value="FEMALE">Ayol</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Tug'ilgan sana</label>
              <input
                type="date"
                name="birthDate"
                value={form.birthDate}
                onChange={handleInput}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-gray-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Grafik</label>
              <select
                name="graphicId"
                value={form.graphicId}
                onChange={handleInput}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-gray-400"
              >
                <option value="">Belgilanmagan</option>
                {graphics.map((g) => (
                  <option key={g.id} value={g.id}>{g.name || `Grafik #${g.id}`}</option>
                ))}
              </select>
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
              <label htmlFor="active" className="text-sm font-medium text-gray-700">Faol</label>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-50"
              >
                {saving ? "Saqlanmoqda..." : editId ? "Yangilash" : "Saqlash"}
              </button>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Bekor qilish
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Photo Upload Modal */}
      <Modal open={showPhotoModal} onClose={() => setShowPhotoModal(false)} center>
        <div className="w-[360px] max-w-full p-6">
          <h3 className="mb-1 text-lg font-semibold text-gray-900">Rasmni yangilash</h3>
          <p className="mb-4 text-sm text-gray-500">{target?.fullname}</p>
          <div className="space-y-4">
            {photoPreview ? (
              <img src={photoPreview} alt="preview" className="mx-auto h-28 w-28 rounded-full object-cover" />
            ) : target?.photoUrl ? (
              <img src={target.photoUrl} alt="current" className="mx-auto h-28 w-28 rounded-full object-cover opacity-60" />
            ) : (
              <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-gray-100">
                <User size={36} className="text-gray-300" />
              </div>
            )}
            <p className="text-center text-xs text-gray-400">JPEG/JPG, maks 5MB</p>
            <input
              ref={photoFileRef}
              type="file"
              accept=".jpg,.jpeg"
              onChange={handlePhotoFileChange}
              className="block w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-700 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-200 file:px-3 file:py-1 file:text-xs file:font-medium"
            />
            <div className="flex gap-3">
              <button
                onClick={handlePhotoUpload}
                disabled={uploadingPhoto}
                className="flex-1 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-50"
              >
                {uploadingPhoto ? "Yuklanmoqda..." : "Yuklash"}
              </button>
              <button
                onClick={() => setShowPhotoModal(false)}
                className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                Bekor
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
