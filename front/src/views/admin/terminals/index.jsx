import React, { useEffect, useState } from "react";
import ApiCall from "config";
import { Plus, Edit, Trash2, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { Modal } from "react-responsive-modal";
import "react-responsive-modal/styles.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const PAGE_SIZE = 20;

const EMPTY_FORM = {
  name: "",
  login: "",
  password: "",
  ip: "",
  description: "",
  model: "",
  filter: "all",
  isComing: true,
};

const EDIT_FORM = { name: "", description: "", filter: "all", isComing: true };

export default function TerminalsPage() {
  const [terminals, setTerminals] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [resettingId, setResettingId] = useState(null);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  useEffect(() => { fetchTerminals(page); }, [page]);

  const fetchTerminals = async (p = 1) => {
    setLoading(true);
    const res = await ApiCall("/api/v1/organizations/terminals/getAll", "GET", null, { page: p, pageSize: PAGE_SIZE });
    setLoading(false);
    if (!res?.error) {
      setTerminals(res.data?.data || []);
      setTotalCount(res.data?.totalCount || 0);
    } else toast.error("Terminallar yuklanmadi");
  };

  const openCreate = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (t) => {
    setEditId(t.id);
    setForm({ name: t.name || "", description: t.description || "", filter: t.filter || "all", isComing: !!t.isComing });
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditId(null); setForm(EMPTY_FORM); };

  const handleInput = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Terminal nomi kiritilishi shart"); return; }
    setSaving(true);
    let res;
    if (editId) {
      res = await ApiCall(`/api/v1/organizations/terminals/update?id=${editId}`, "PUT", {
        name: form.name, description: form.description, filter: form.filter, isComing: form.isComing,
      });
    } else {
      res = await ApiCall("/api/v1/organizations/terminals/add", "POST", form);
    }
    setSaving(false);
    if (!res?.error) {
      toast.success(editId ? "Terminal yangilandi" : "Terminal qo'shildi");
      closeModal();
      fetchTerminals(page);
    } else {
      toast.error(res.data?.message || "Xatolik yuz berdi");
    }
  };

  const handleDelete = async (t) => {
    if (!window.confirm(`"${t.name}" terminalini o'chirmoqchimisiz?`)) return;
    const res = await ApiCall(`/api/v1/organizations/terminals/delete?id=${t.id}`, "DELETE");
    if (!res?.error) { toast.success("Terminal o'chirildi"); fetchTerminals(page); }
    else toast.error(res.data?.message || "O'chirishda xatolik");
  };

  const handleReset = async (t) => {
    if (!window.confirm(`"${t.name}" terminalini reset qilmoqchimisiz? Barcha mijozlar qayta yuklanadi.`)) return;
    setResettingId(t.id);
    const res = await ApiCall(`/api/v1/organizations/terminals/reset/${t.id}`, "POST");
    setResettingId(null);
    if (!res?.error) toast.success(res.data?.message || "Terminal reset qilindi");
    else toast.error(res.data?.message || "Reset qilishda xatolik");
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleString("uz-UZ", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—";

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Terminallar</h1>
            <p className="mt-1 text-sm text-gray-500">Jami: {totalCount} ta terminal</p>
          </div>
          <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700">
            <Plus size={16} /> Yangi terminal
          </button>
        </div>

        <div className="space-y-3">
          {loading ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-sm text-gray-400">Yuklanmoqda...</div>
          ) : terminals.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-sm text-gray-400">Terminallar topilmadi</div>
          ) : terminals.map((t) => (
            <div key={t.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md">
              <div className="flex items-center gap-4">
                <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${t.isOnline ? "bg-green-50" : "bg-gray-100"}`}>
                  {t.isOnline ? <Wifi size={22} className="text-green-600" /> : <WifiOff size={22} className="text-gray-400" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{t.name}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${t.isOnline ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {t.isOnline ? "Online" : "Offline"}
                    </span>
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600">
                      {t.isComing ? "Kirish" : "Chiqish"}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-3 text-xs text-gray-500">
                    {t.ip && <span>IP: {t.ip}</span>}
                    {t.model && <span>{t.model}</span>}
                    {t.login && <span>Login: {t.login}</span>}
                    <span>Oxirgi: {fmtDate(t.lastOnline)}</span>
                  </div>
                  {t.description && <p className="mt-0.5 text-xs text-gray-400">{t.description}</p>}
                </div>
                <div className="flex flex-shrink-0 items-center gap-2">
                  <button
                    onClick={() => handleReset(t)}
                    disabled={resettingId === t.id}
                    className="rounded-lg bg-amber-50 px-3 py-1.5 text-amber-600 transition hover:bg-amber-100 disabled:opacity-50"
                    title="Reset"
                  >
                    <RefreshCw size={14} className={resettingId === t.id ? "animate-spin" : ""} />
                  </button>
                  <button onClick={() => openEdit(t)} className="rounded-lg bg-gray-100 px-3 py-1.5 text-gray-700 transition hover:bg-gray-200" title="Tahrirlash">
                    <Edit size={14} />
                  </button>
                  <button onClick={() => handleDelete(t)} className="rounded-lg bg-pink-50 px-3 py-1.5 text-pink-600 transition hover:bg-pink-100" title="O'chirish">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-40">Oldingi</button>
            <span className="text-sm text-gray-500">{page} / {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-40">Keyingi</button>
          </div>
        )}
      </div>

      <Modal open={showModal} onClose={closeModal} center>
        <div className="w-[480px] max-w-full p-6">
          <h2 className="mb-5 text-lg font-semibold text-gray-900">
            {editId ? "Terminalni tahrirlash" : "Yangi terminal"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Nomi <span className="text-pink-500">*</span></label>
              <input name="name" value={form.name} onChange={handleInput} required placeholder="Kirish 1" className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-400" />
            </div>
            {!editId && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Login</label>
                  <input name="login" value={form.login} onChange={handleInput} placeholder="terminal1" className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-400" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Parol</label>
                  <input name="password" value={form.password} onChange={handleInput} placeholder="pass123" className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-400" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">IP manzil</label>
                  <input name="ip" value={form.ip} onChange={handleInput} placeholder="192.168.1.100" className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-400" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Model</label>
                  <input name="model" value={form.model} onChange={handleInput} placeholder="ZKTeco F18" className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-400" />
                </div>
              </div>
            )}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Tavsif</label>
              <input name="description" value={form.description} onChange={handleInput} placeholder="Asosiy kirish terminali" className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-400" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Filter</label>
              <select name="filter" value={form.filter} onChange={handleInput} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-400">
                <option value="all">Hammasi</option>
                <option value="clients">Faqat mijozlar</option>
                <option value="staff">Faqat xodimlar</option>
              </select>
            </div>
            <label className="flex cursor-pointer items-center gap-2">
              <input type="checkbox" name="isComing" checked={form.isComing} onChange={handleInput} className="h-4 w-4 rounded" />
              <span className="text-sm font-medium text-gray-700">Kirish terminali (aks holda — chiqish)</span>
            </label>
            <div className="flex items-center gap-3 pt-2">
              <button type="submit" disabled={saving} className="inline-flex items-center justify-center rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-700 disabled:opacity-60">
                {saving ? "Saqlanmoqda..." : editId ? "Yangilash" : "Saqlash"}
              </button>
              <button type="button" onClick={closeModal} className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50">
                Bekor qilish
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
