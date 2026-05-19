import React, { useEffect, useState } from "react";
import ApiCall from "config";
import { Plus, Trash2 } from "lucide-react";
import { Modal } from "react-responsive-modal";
import "react-responsive-modal/styles.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const fmtMoney = (n) => `${Number(n || 0).toLocaleString()} so'm`;
const formatDate = (d) => d ? new Date(d).toLocaleString("uz-UZ", { dateStyle: "medium", timeStyle: "short" }) : "—";

const CATEGORIES = ["subscription", "market", "extra", "penalty", "other"];
const PAYMENT_TYPES = ["income", "expense"];

const EMPTY_FORM = {
  personId: "", category: "subscription", description: "",
  price: "", paymentType: "income",
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [clients, setClients] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const limit = 30;

  const [filterCategory, setFilterCategory] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterImportant, setFilterImportant] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPayments(1);
    fetchClients();
  }, [filterCategory, filterType, filterImportant]);

  const fetchPayments = async (p) => {
    setLoading(true);
    const params = { page: p, limit };
    if (filterCategory) params.category = filterCategory;
    if (filterType) params.paymentType = filterType;
    if (filterImportant !== "") params.isImportant = filterImportant === "true";
    const res = await ApiCall("/api/v1/organizations/payments/getAll", "GET", null, params);
    if (!res?.error) {
      setPayments(res.data?.data || []);
      setTotalCount(res.data?.totalCount || 0);
      setTotalPages(res.data?.totalPages || 1);
      setPage(p);
    } else {
      toast.error("To'lovlarni yuklashda xatolik");
    }
    setLoading(false);
  };

  const fetchClients = async () => {
    const res = await ApiCall("/api/v1/organizations/person/getAll", "GET", null, {
      isClient: true, page: 1, limit: 200,
    });
    if (!res?.error) setClients(res.data?.data || []);
  };

  const handleInput = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.price) { toast.error("Summani kiriting"); return; }
    setSaving(true);
    const payload = {
      personId: form.personId ? parseInt(form.personId) : null,
      category: form.category,
      description: form.description || null,
      price: parseFloat(form.price),
      paymentType: form.paymentType,
    };
    const res = await ApiCall("/api/v1/organizations/payments/create", "POST", payload);
    setSaving(false);
    if (!res?.error) {
      toast.success("To'lov qo'shildi."); setShowModal(false); fetchPayments(1);
    } else {
      toast.error(res.data?.message || "Xatolik yuz berdi.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("To'lovni o'chirishni xohlaysizmi?")) return;
    const res = await ApiCall(`/api/v1/organizations/payments/delete?id=${id}`, "DELETE");
    if (!res?.error) { toast.success("To'lov o'chirildi."); fetchPayments(page); }
    else toast.error(res.data?.message || "Xatolik.");
  };

  const categoryLabel = (c) => ({
    subscription: "Obuna", market: "Magazin", extra: "Qo'shimcha",
    penalty: "Jarima", other: "Boshqa",
  }[c] || c);

  const typeColor = (t) => t === "income" ? "text-green-600" : "text-rose-500";
  const typeLabel = (t) => t === "income" ? "Kirim" : "Chiqim";

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="mx-auto max-w-7xl space-y-4">
        {/* Header */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">To'lovlar</h1>
              <p className="mt-0.5 text-sm text-gray-500">Jami {totalCount} ta to'lov</p>
            </div>
            <button
              onClick={() => { setForm(EMPTY_FORM); setShowModal(true); }}
              className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
            >
              <Plus size={16} /> Yangi to'lov
            </button>
          </div>

          {/* Filters */}
          <div className="mt-4 flex flex-wrap gap-3">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none"
            >
              <option value="">Barcha kategoriya</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{categoryLabel(c)}</option>
              ))}
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none"
            >
              <option value="">Barcha tur</option>
              <option value="income">Kirim</option>
              <option value="expense">Chiqim</option>
            </select>
            <select
              value={filterImportant}
              onChange={(e) => setFilterImportant(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none"
            >
              <option value="">Barchasi</option>
              <option value="true">Muhimlar</option>
            </select>
            {(filterCategory || filterType || filterImportant) && (
              <button
                onClick={() => { setFilterCategory(""); setFilterType(""); setFilterImportant(""); }}
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Sana</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Mijoz</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Kategoriya</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Tavsif</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Tur</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">Summa</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">Amal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  [...Array(8)].map((_, i) => (
                    <tr key={i}>
                      {[...Array(7)].map((_, j) => (
                        <td key={j} className="px-6 py-3">
                          <div className="h-4 animate-pulse rounded bg-gray-100" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : payments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-400">
                      To'lovlar topilmadi
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-gray-500 text-xs">{formatDate(p.paymentDate || p.createdTime)}</td>
                      <td className="px-6 py-3 font-medium text-gray-800">
                        {p.personName || p.fullname || "—"}
                      </td>
                      <td className="px-6 py-3">
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                          {categoryLabel(p.category)}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-gray-500 text-xs max-w-[180px] truncate">
                        {p.description || "—"}
                      </td>
                      <td className="px-6 py-3">
                        <span className={`text-xs font-medium ${typeColor(p.paymentType)}`}>
                          {typeLabel(p.paymentType)}
                        </span>
                      </td>
                      <td className={`px-6 py-3 text-right font-semibold ${typeColor(p.paymentType)}`}>
                        {fmtMoney(p.price || p.amount)}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <button
                          onClick={() => handleDelete(p.id)}
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
              onClick={() => fetchPayments(page - 1)}
              disabled={page <= 1}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40"
            >
              Oldingi
            </button>
            <span className="text-sm text-gray-600">{page} / {totalPages}</span>
            <button
              onClick={() => fetchPayments(page + 1)}
              disabled={page >= totalPages}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40"
            >
              Keyingi
            </button>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} center>
        <div className="w-[420px] max-w-full p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Yangi to'lov</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Mijoz (ixtiyoriy)</label>
              <select
                name="personId"
                value={form.personId}
                onChange={handleInput}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-gray-400"
              >
                <option value="">Tanlang (ixtiyoriy)</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.fullname}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Kategoriya</label>
              <select
                name="category"
                value={form.category}
                onChange={handleInput}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-gray-400"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{categoryLabel(c)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Tur</label>
              <select
                name="paymentType"
                value={form.paymentType}
                onChange={handleInput}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-gray-400"
              >
                <option value="income">Kirim</option>
                <option value="expense">Chiqim</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Summa (so'm)</label>
              <input
                required
                type="number"
                min="0"
                name="price"
                value={form.price}
                onChange={handleInput}
                placeholder="Summa"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-gray-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Tavsif (ixtiyoriy)</label>
              <input
                name="description"
                value={form.description}
                onChange={handleInput}
                placeholder="Izoh"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-gray-400"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-50"
              >
                {saving ? "Saqlanmoqda..." : "Saqlash"}
              </button>
              <button
                type="button"
                onClick={() => setShowModal(false)}
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
