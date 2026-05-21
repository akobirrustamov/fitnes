import React, { useEffect, useState } from "react";
import ApiCall from "../../../config";
import { Plus, Trash2, ChevronLeft, ChevronRight, Send } from "lucide-react";
import { Modal } from "react-responsive-modal";
import "react-responsive-modal/styles.css";

export default function MessagesPage() {
  const [messages, setMessages] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [provinces, setProvinces] = useState([]);
  const [regions, setRegions] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [filters, setFilters] = useState({ provinceId: "", regionId: "", organizationId: "", type: "" });
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ organizationId: "", title: "", body: "" });
  const [sendLoading, setSendLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const PAGE_SIZE = 20;

  const safeArray = (v) => (Array.isArray(v) ? v : []);

  useEffect(() => {
    fetchProvinces();
    fetchAllOrganizations();
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [page, filters]);

  useEffect(() => {
    if (filters.provinceId) fetchRegions(filters.provinceId);
    else setRegions([]);
    setFilters((prev) => ({ ...prev, regionId: "", organizationId: "" }));
  }, [filters.provinceId]);

  useEffect(() => {
    fetchOrgsByFilter();
    setFilters((prev) => ({ ...prev, organizationId: "" }));
  }, [filters.regionId, filters.provinceId]);

  const fetchProvinces = async () => {
    const result = await ApiCall("/api/v1/admin/provinces/getAll", "GET");
    if (!result?.error) setProvinces(result.data || []);
  };

  const fetchRegions = async (provinceId) => {
    const result = await ApiCall("/api/v1/admin/regions/getAll", "GET", null, { provinceId, page: 1, pageSize: 200 });
    if (!result?.error) setRegions(result.data?.data || result.data?.content || result.data || []);
  };

  const fetchAllOrganizations = async () => {
    const result = await ApiCall("/api/v1/admin/organizations/getAll", "GET", null, { page: 1, limit: 500 });
    if (!result?.error) setOrganizations(result.data?.data || result.data?.content || result.data || []);
  };

  const fetchOrgsByFilter = async () => {
    const params = { page: 1, limit: 200 };
    if (filters.provinceId) params.provinceId = filters.provinceId;
    if (filters.regionId) params.regionId = filters.regionId;
    const result = await ApiCall("/api/v1/admin/organizations/getAll", "GET", null, params);
    if (!result?.error) setOrganizations(result.data?.data || result.data?.content || result.data || []);
  };

  const fetchMessages = async () => {
    setLoading(true);
    const params = { page, pageSize: PAGE_SIZE };
    if (filters.organizationId) params.organizationId = filters.organizationId;
    if (filters.type) params.type = filters.type;
    const result = await ApiCall("/api/v1/admin/messages/getAll", "GET", null, params);
    setLoading(false);
    if (!result?.error) {
      setMessages(result.data?.data || result.data?.content || result.data || []);
      setTotal(result.data?.totalCount || result.data?.total || 0);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!form.organizationId || !form.body.trim()) return;
    setSendLoading(true);
    const result = await ApiCall("/api/v1/admin/messages/create", "POST", {
      organizationId: Number(form.organizationId),
      title: form.title,
      body: form.body,
    });
    setSendLoading(false);
    if (!result?.error) {
      setMsg("Xabar muvaffaqiyatli yuborildi.");
      setShowModal(false);
      setForm({ organizationId: "", title: "", body: "" });
      fetchMessages();
    } else {
      setMsg("Xabar yuborishda xatolik yuz berdi.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Ushbu xabarni o'chirishni xohlaysizmi?")) return;
    const result = await ApiCall(`/api/v1/admin/messages/delete?id=${id}`, "DELETE");
    if (!result?.error) {
      setMsg("Xabar o'chirildi.");
      fetchMessages();
    }
  };

  const openModal = () => {
    setForm({ organizationId: "", title: "", body: "" });
    setShowModal(true);
  };

  const msgList = safeArray(messages);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const orgList = safeArray(organizations);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Xabarlar</h1>
              <p className="mt-1 text-sm text-gray-600">
                Zallarga individual xabarlar yuborish va tarixini ko'rish.
              </p>
            </div>
            <button
              onClick={openModal}
              className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700"
            >
              <Plus size={16} /> Xabar yuborish
            </button>
          </div>

          {msg && (
            <div className="mt-4 rounded-xl bg-green-50 p-4 text-sm text-green-700">{msg}</div>
          )}

          {/* Filters */}
          <div className="mt-5 flex flex-wrap gap-3">
            <select
              value={filters.provinceId}
              onChange={(e) => handleFilterChange("provinceId", e.target.value)}
              className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 outline-none"
            >
              <option value="">Viloyat — barchasi</option>
              {safeArray(provinces).map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <select
              value={filters.regionId}
              onChange={(e) => handleFilterChange("regionId", e.target.value)}
              disabled={!filters.provinceId}
              className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 outline-none disabled:opacity-50"
            >
              <option value="">Tuman — barchasi</option>
              {safeArray(regions).map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
            <select
              value={filters.organizationId}
              onChange={(e) => handleFilterChange("organizationId", e.target.value)}
              className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 outline-none"
            >
              <option value="">Zal — barchasi</option>
              {orgList.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange("type", e.target.value)}
              className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 outline-none"
            >
              <option value="">Turi — barchasi</option>
              <option value="admin">Admin</option>
              <option value="auto">Avtomatik</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 font-semibold text-gray-900">
            Xabarlar tarixi
            {total > 0 && <span className="ml-2 text-sm font-normal text-gray-500">({total} ta)</span>}
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-12 text-center text-sm text-gray-400">Yuklanmoqda...</div>
            ) : (
              <table className="min-w-full text-left text-sm text-gray-600">
                <thead className="border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3 font-medium">Zal</th>
                    <th className="px-6 py-3 font-medium">Sarlavha</th>
                    <th className="px-6 py-3 font-medium">Matn</th>
                    <th className="px-6 py-3 font-medium">Turi</th>
                    <th className="px-6 py-3 font-medium">Sana</th>
                    <th className="px-6 py-3 font-medium text-right">Amal</th>
                  </tr>
                </thead>
                <tbody>
                  {msgList.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-10 text-center text-gray-400">
                        Xabarlar topilmadi.
                      </td>
                    </tr>
                  ) : (
                    msgList.map((m) => (
                      <tr key={m.id} className="border-t border-gray-100">
                        <td className="px-6 py-3 font-medium text-gray-800">
                          {m.organizationName || m.organization_name || "—"}
                        </td>
                        <td className="px-6 py-3">{m.title || "—"}</td>
                        <td className="px-6 py-3 max-w-xs">
                          <span className="line-clamp-2 text-gray-500">{m.body || m.message || "—"}</span>
                        </td>
                        <td className="px-6 py-3">
                          {m.type === "auto" || m.messageType === "auto" ? (
                            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">Avtomatik</span>
                          ) : (
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">Admin</span>
                          )}
                        </td>
                        <td className="px-6 py-3 text-xs text-gray-400">
                          {m.createdTime ? new Date(m.createdTime).toLocaleDateString("uz-UZ") : "—"}
                        </td>
                        <td className="px-6 py-3 text-right">
                          <button
                            onClick={() => handleDelete(m.id)}
                            className="rounded-lg bg-pink-100 px-3 py-1 text-sm text-pink-700 hover:bg-pink-200"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
              <span className="text-sm text-gray-500">{page} / {totalPages} sahifa</span>
              <div className="flex items-center gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="rounded-lg border border-gray-200 p-1.5 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-lg border border-gray-200 p-1.5 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Send Message Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} center>
        <div className="w-[500px] max-w-full p-6">
          <div className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Send size={20} /> Xabar yuborish
          </div>
          <form onSubmit={handleSend} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Zal</label>
              <select
                required
                value={form.organizationId}
                onChange={(e) => setForm((prev) => ({ ...prev, organizationId: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-400"
              >
                <option value="">Zalni tanlang</option>
                {safeArray(organizations).map((o) => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Sarlavha</label>
              <input
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-400"
                placeholder="Xabar sarlavhasi (ixtiyoriy)"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Xabar matni</label>
              <textarea
                required
                value={form.body}
                onChange={(e) => setForm((prev) => ({ ...prev, body: e.target.value }))}
                rows="4"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-400"
                placeholder="Xabar matnini kiriting..."
              />
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={sendLoading}
                className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-700 disabled:opacity-60"
              >
                <Send size={15} />
                {sendLoading ? "Yuborilmoqda..." : "Yuborish"}
              </button>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
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
