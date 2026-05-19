import React, { useEffect, useState } from "react";
import ApiCall from "config";
import { Plus, Edit, Trash2, Search, RefreshCw, CreditCard } from "lucide-react";
import { Modal } from "react-responsive-modal";
import "react-responsive-modal/styles.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const fmtMoney = (n) => `${Number(n || 0).toLocaleString()} so'm`;

const EMPTY_FORM = {
  fullname: "", phoneNumber: "", gender: "", birthDate: "",
  location: "", active: true, isClient: true,
};
const EMPTY_SUB = { endDate: "", accessCount: "", price: "", paidAmount: "" };
const EMPTY_DEBT = { amount: "", category: "subscription" };

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const limit = 20;

  const [search, setSearch] = useState("");
  const [filterActive, setFilterActive] = useState("");
  const [filterExpired, setFilterExpired] = useState("");

  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showSubModal, setShowSubModal] = useState(false);
  const [showDebtModal, setShowDebtModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [target, setTarget] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [subForm, setSubForm] = useState(EMPTY_SUB);
  const [debtForm, setDebtForm] = useState(EMPTY_DEBT);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // backend requires search >= 3 chars — skip fetch while user is mid-typing
    if (search.length > 0 && search.length < 3) return;
    fetchClients(1);
  }, [search, filterActive, filterExpired]);

  const fetchClients = async (p) => {
    setLoading(true);
    const params = { page: p, limit, isClient: true };
    if (search) params.search = search;
    if (filterActive !== "") params.active = filterActive === "true";
    if (filterExpired === "true") params.isExpired = true;
    const res = await ApiCall("/api/v1/organizations/person/getAll", "GET", null, params);
    if (!res?.error) {
      setClients(res.data?.data || []);
      setTotalCount(res.data?.totalCount || 0);
      setTotalPages(res.data?.totalPages || 1);
      setPage(p);
    } else {
      toast.error("Mijozlarni yuklashda xatolik");
    }
    setLoading(false);
  };

  const openCreate = () => { setForm(EMPTY_FORM); setEditId(null); setShowModal(true); };
  const openEdit = (c) => {
    setEditId(c.id);
    setForm({
      fullname: c.fullname || "", phoneNumber: c.phoneNumber || "",
      gender: c.gender || "", birthDate: c.birthDate || "",
      location: c.location || "", active: c.active !== false, isClient: true,
    });
    setShowModal(true);
  };
  const openSub = (c) => { setTarget(c); setSubForm(EMPTY_SUB); setShowSubModal(true); };
  const openDebt = (c) => { setTarget(c); setDebtForm(EMPTY_DEBT); setShowDebtModal(true); };

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
    };
    const res = editId
      ? await ApiCall(`/api/v1/organizations/person/update?id=${editId}`, "PUT", payload)
      : await ApiCall("/api/v1/organizations/person/create", "POST", payload);
    setSaving(false);
    if (!res?.error) {
      toast.success(editId ? "Mijoz yangilandi." : "Mijoz qo'shildi.");
      setShowModal(false);
      // search < 3 chars causes backend 400 — reset it before re-fetch
      if (search.length > 0 && search.length < 3) setSearch("");
      fetchClients(1);
    } else {
      toast.error(res.data?.message || "Xatolik yuz berdi.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Mijozni o'chirishni xohlaysizmi?")) return;
    const res = await ApiCall(`/api/v1/organizations/person/delete?id=${id}`, "DELETE");
    if (!res?.error) { toast.success("Mijoz o'chirildi."); fetchClients(1); }
    else toast.error(res.data?.message || "Xatolik.");
  };

  const handleExtendSub = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      endDate: subForm.endDate || null,
      accessCount: subForm.accessCount ? parseInt(subForm.accessCount) : null,
      price: subForm.price ? parseFloat(subForm.price) : null,
      paidAmount: subForm.paidAmount ? parseFloat(subForm.paidAmount) : null,
    };
    const res = await ApiCall(
      `/api/v1/organizations/person/extendSubscription?id=${target.id}`, "POST", payload
    );
    setSaving(false);
    if (!res?.error) {
      toast.success("Obuna uzaytirildi."); setShowSubModal(false); fetchClients(page);
    } else toast.error(res.data?.message || "Xatolik.");
  };

  const handlePayDebt = async (e) => {
    e.preventDefault();
    if (!debtForm.amount) { toast.error("Summani kiriting"); return; }
    setSaving(true);
    const res = await ApiCall(
      `/api/v1/organizations/person/payDebt?id=${target.id}`, "POST",
      { amount: parseFloat(debtForm.amount), category: debtForm.category }
    );
    setSaving(false);
    if (!res?.error) {
      toast.success("Qarz to'landi."); setShowDebtModal(false); fetchClients(page);
    } else toast.error(res.data?.message || "Xatolik.");
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
              <h1 className="text-2xl font-semibold text-gray-900">Mijozlar</h1>
              <p className="mt-0.5 text-sm text-gray-500">Jami {totalCount} ta mijoz</p>
            </div>
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
            >
              <Plus size={16} /> Yangi mijoz
            </button>
          </div>

          {/* Filters */}
          <div className="mt-4 flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[180px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Ism yoki telefon..."
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
            <select
              value={filterExpired}
              onChange={(e) => setFilterExpired(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-400"
            >
              <option value="">Barcha obuna</option>
              <option value="true">Muddati o'tgan</option>
            </select>
            {(search || filterActive || filterExpired) && (
              <button
                onClick={() => { setSearch(""); setFilterActive(""); setFilterExpired(""); }}
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Ism</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Telefon</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Obuna tugaydi</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Qarz</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Holat</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  [...Array(6)].map((_, i) => (
                    <tr key={i}>
                      {[...Array(6)].map((_, j) => (
                        <td key={j} className="px-6 py-4">
                          <div className="h-4 animate-pulse rounded bg-gray-100" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : clients.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-400">
                      Mijozlar topilmadi
                    </td>
                  </tr>
                ) : (
                  clients.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 font-medium text-gray-900">{c.fullname}</td>
                      <td className="px-6 py-3 text-gray-500">{c.phoneNumber || "—"}</td>
                      <td className="px-6 py-3">
                        {c.subscriptionEndDate ? (
                          <span className={new Date(c.subscriptionEndDate) < new Date()
                            ? "text-rose-500" : "text-gray-700"}>
                            {formatDate(c.subscriptionEndDate)}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="px-6 py-3">
                        {Number(c.debt || 0) > 0 ? (
                          <span className="font-medium text-rose-500">{fmtMoney(c.debt)}</span>
                        ) : "—"}
                      </td>
                      <td className="px-6 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          c.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                        }`}>
                          {c.active ? "Faol" : "Nofaol"}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <button
                          onClick={() => openSub(c)}
                          title="Obunani uzaytirish"
                          className="mr-1 rounded-lg bg-indigo-100 px-2 py-1 text-indigo-700 hover:bg-indigo-200"
                        >
                          <RefreshCw size={13} />
                        </button>
                        {Number(c.debt || 0) > 0 && (
                          <button
                            onClick={() => openDebt(c)}
                            title="Qarz to'lash"
                            className="mr-1 rounded-lg bg-rose-100 px-2 py-1 text-rose-700 hover:bg-rose-200"
                          >
                            <CreditCard size={13} />
                          </button>
                        )}
                        <button
                          onClick={() => openEdit(c)}
                          className="mr-1 rounded-lg bg-gray-100 px-2 py-1 text-gray-700 hover:bg-gray-200"
                        >
                          <Edit size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="rounded-lg bg-rose-100 px-2 py-1 text-rose-700 hover:bg-rose-200"
                        >
                          <Trash2 size={13} />
                        </button>
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
              onClick={() => fetchClients(page - 1)}
              disabled={page <= 1}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40"
            >
              Oldingi
            </button>
            <span className="text-sm text-gray-600">{page} / {totalPages}</span>
            <button
              onClick={() => fetchClients(page + 1)}
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
        <div className="w-[460px] max-w-full p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            {editId ? "Mijozni tahrirlash" : "Yangi mijoz qo'shish"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { label: "Ism Familiya", name: "fullname", required: true, placeholder: "To'liq ism" },
              { label: "Telefon", name: "phoneNumber", placeholder: "+998..." },
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

      {/* Extend Subscription Modal */}
      <Modal open={showSubModal} onClose={() => setShowSubModal(false)} center>
        <div className="w-[420px] max-w-full p-6">
          <h3 className="mb-1 text-lg font-semibold text-gray-900">Obunani uzaytirish</h3>
          <p className="mb-4 text-sm text-gray-500">{target?.fullname}</p>
          <form onSubmit={handleExtendSub} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Tugash sanasi</label>
              <input
                type="date"
                value={subForm.endDate}
                onChange={(e) => setSubForm((p) => ({ ...p, endDate: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-gray-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Kirish soni (ixtiyoriy)</label>
              <input
                type="number"
                min="0"
                value={subForm.accessCount}
                onChange={(e) => setSubForm((p) => ({ ...p, accessCount: e.target.value }))}
                placeholder="0 = cheksiz"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-gray-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Narxi (so'm)</label>
              <input
                type="number"
                min="0"
                value={subForm.price}
                onChange={(e) => setSubForm((p) => ({ ...p, price: e.target.value }))}
                placeholder="Obuna narxi"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-gray-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">To'langan (so'm)</label>
              <input
                type="number"
                min="0"
                value={subForm.paidAmount}
                onChange={(e) => setSubForm((p) => ({ ...p, paidAmount: e.target.value }))}
                placeholder="Haqiqatda to'langan"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-gray-400"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? "Saqlanmoqda..." : "Uzaytirish"}
              </button>
              <button
                type="button"
                onClick={() => setShowSubModal(false)}
                className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                Bekor qilish
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Pay Debt Modal */}
      <Modal open={showDebtModal} onClose={() => setShowDebtModal(false)} center>
        <div className="w-[380px] max-w-full p-6">
          <h3 className="mb-1 text-lg font-semibold text-gray-900">Qarz to'lash</h3>
          <p className="mb-1 text-sm text-gray-500">{target?.fullname}</p>
          <p className="mb-4 text-sm font-medium text-rose-500">
            Joriy qarz: {fmtMoney(target?.debt)}
          </p>
          <form onSubmit={handlePayDebt} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">To'lov summasi (so'm)</label>
              <input
                required
                type="number"
                min="0"
                value={debtForm.amount}
                onChange={(e) => setDebtForm((p) => ({ ...p, amount: e.target.value }))}
                placeholder="Summa"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-gray-400"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {saving ? "Saqlanmoqda..." : "To'lash"}
              </button>
              <button
                type="button"
                onClick={() => setShowDebtModal(false)}
                className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
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
