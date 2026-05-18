import React, { useEffect, useState } from "react";
import ApiCall from "../../../config";
import { Plus, Edit, Trash2, Eye, Link, Unlink, ToggleLeft, ToggleRight, KeyRound } from "lucide-react";
import { Modal } from "react-responsive-modal";
import "react-responsive-modal/styles.css";

export default function ServersPage() {
  const [monitors, setMonitors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedMonitor, setSelectedMonitor] = useState(null);
  const [assignedOrgs, setAssignedOrgs] = useState([]);
  const [unassignedOrgs, setUnassignedOrgs] = useState([]);
  const [newPassword, setNewPassword] = useState("");
  const [form, setForm] = useState({ name: "", login: "", password: "", phoneNumber: "", description: "", passwordHint: "" });
  const [editId, setEditId] = useState(null);
  const [message, setMessage] = useState("");

  const safeArray = (v) => (Array.isArray(v) ? v : []);

  useEffect(() => {
    fetchMonitors();
  }, []);

  const fetchMonitors = async () => {
    const result = await ApiCall("/api/v1/admin/monitors/getAll", "GET", null, { page: 1, pageSize: 100 });
    if (!result?.error) setMonitors(result.data?.data || result.data?.content || result.data || []);
  };

  const fetchAssignedOrgs = async (monitorId) => {
    const result = await ApiCall(`/api/v1/admin/monitors/getOrganizations?monitorId=${monitorId}`, "GET");
    if (!result?.error) setAssignedOrgs(result.data?.data || result.data || []);
  };

  const fetchUnassignedOrgs = async () => {
    const result = await ApiCall("/api/v1/admin/monitors/getUnassignedOrganizations", "GET");
    if (!result?.error) setUnassignedOrgs(result.data?.data || result.data || []);
  };

  const handleInput = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setForm({ name: "", login: "", password: "", phoneNumber: "", description: "", passwordHint: "" });
    setEditId(null);
    setMessage("");
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (monitor) => {
    setEditId(monitor.id);
    setForm({
      name: monitor.name || "",
      login: monitor.login || "",
      password: "",
      phoneNumber: monitor.phoneNumber || "",
      description: monitor.description || "",
      passwordHint: monitor.passwordHint || "",
    });
    setMessage("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const openDetailModal = async (monitor) => {
    setSelectedMonitor(monitor);
    setShowDetailModal(true);
    await fetchAssignedOrgs(monitor.id);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedMonitor(null);
    setAssignedOrgs([]);
  };

  const openPasswordModal = (monitor) => {
    setSelectedMonitor(monitor);
    setNewPassword("");
    setShowPasswordModal(true);
  };

  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setNewPassword("");
  };

  const openAssignModal = async () => {
    await fetchUnassignedOrgs();
    setShowAssignModal(true);
  };

  const closeAssignModal = () => {
    setShowAssignModal(false);
    setUnassignedOrgs([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const payload = {
      name: form.name,
      login: form.login,
      password: form.password,
      phoneNumber: form.phoneNumber,
      description: form.description,
      passwordHint: form.passwordHint,
    };
    const apiUrl = editId ? `/api/v1/admin/monitors/update?id=${editId}` : "/api/v1/admin/monitors/add";
    const method = editId ? "PUT" : "POST";
    const result = await ApiCall(apiUrl, method, payload);
    setLoading(false);
    if (!result?.error) {
      await fetchMonitors();
      closeModal();
      setMessage(editId ? "Server yangilandi." : "Yangi server yaratildi.");
    } else {
      setMessage("Xatolik yuz berdi.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Ushbu serverni o'chirishni xohlaysizmi?")) return;
    const result = await ApiCall(`/api/v1/admin/monitors/delete?id=${id}`, "DELETE");
    if (!result?.error) {
      await fetchMonitors();
      setMessage("Server o'chirildi.");
    }
  };

  const handleToggleActive = async (monitor) => {
    const newActive = !monitor.active;
    const result = await ApiCall(`/api/v1/admin/monitors/setActive/${monitor.id}?active=${newActive}`, "POST");
    if (!result?.error) {
      await fetchMonitors();
      if (selectedMonitor?.id === monitor.id) setSelectedMonitor({ ...monitor, active: newActive });
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!newPassword.trim()) return;
    const result = await ApiCall(`/api/v1/admin/monitors/changePassword/${selectedMonitor.id}`, "POST", { password: newPassword });
    if (!result?.error) {
      closePasswordModal();
      setMessage("Parol muvaffaqiyatli o'zgartirildi.");
    } else {
      setMessage("Parolni o'zgartirishda xatolik.");
    }
  };

  const handleAssignOrg = async (orgId) => {
    const result = await ApiCall(
      `/api/v1/admin/monitors/addOrganization?monitorId=${selectedMonitor.id}&organizationId=${orgId}`,
      "POST"
    );
    if (!result?.error) {
      await fetchAssignedOrgs(selectedMonitor.id);
      closeAssignModal();
    }
  };

  const handleRemoveOrg = async (orgId) => {
    if (!window.confirm("Zalni serverdan uzmoqchimisiz?")) return;
    const result = await ApiCall(
      `/api/v1/admin/monitors/removeOrganization?monitorId=${selectedMonitor.id}&organizationId=${orgId}`,
      "DELETE"
    );
    if (!result?.error) await fetchAssignedOrgs(selectedMonitor.id);
  };

  const monitorsList = safeArray(monitors);

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Serverlar</h1>
              <p className="mt-1 text-sm text-slate-600">Monitor serverlarini boshqarish.</p>
            </div>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 rounded-lg bg-gray-900 hover:bg-gray-700 px-4 py-2 text-sm font-medium text-white transition"
            >
              <Plus size={16} /> Yangi server
            </button>
          </div>

          {message && (
            <div className="mt-4 rounded-xl bg-green-50 p-4 text-sm text-green-700">{message}</div>
          )}

          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 bg-slate-50 px-6 py-4 font-semibold text-slate-900">
              Serverlar ro'yxati
            </div>
            <div className="overflow-x-auto px-6 py-4">
              <table className="min-w-full text-left text-sm text-slate-600">
                <thead>
                  <tr>
                    <th className="pb-3 font-medium">ID</th>
                    <th className="pb-3 font-medium">Nomi</th>
                    <th className="pb-3 font-medium">Telefon</th>
                    <th className="pb-3 font-medium">Holat</th>
                    <th className="pb-3 font-medium text-right">Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {monitorsList.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-slate-500">
                        Serverlar topilmadi.
                      </td>
                    </tr>
                  ) : (
                    monitorsList.map((monitor) => (
                      <tr key={monitor.id} className="border-t border-slate-200">
                        <td className="py-3">{monitor.id}</td>
                        <td className="py-3 font-medium text-slate-800">{monitor.name}</td>
                        <td className="py-3">{monitor.phoneNumber || "—"}</td>
                        <td className="py-3">
                          {monitor.active ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
                              Faol
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-600">
                              Nofaol
                            </span>
                          )}
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => openDetailModal(monitor)}
                            className="mr-1 rounded-lg bg-blue-100 px-3 py-1 text-sm text-blue-700 hover:bg-blue-200"
                            title="Batafsil"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => openEditModal(monitor)}
                            className="mr-1 rounded-lg bg-slate-100 px-3 py-1 text-sm text-slate-700 hover:bg-slate-200"
                            title="Tahrirlash"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(monitor.id)}
                            className="rounded-lg bg-rose-100 px-3 py-1 text-sm text-rose-700 hover:bg-rose-200"
                            title="O'chirish"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Add / Edit Modal */}
      <Modal open={showModal} onClose={closeModal} center>
        <div className="w-[480px] max-w-full p-6">
          <div className="mb-4 text-lg font-semibold text-slate-900">
            {editId ? "Serverni tahrirlash" : "Yangi server qo'shish"}
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Nomi</label>
              <input
                required
                name="name"
                value={form.name}
                onChange={handleInput}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400"
                placeholder="Server nomi"
              />
            </div>
            {!editId && (
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Login</label>
                <input
                  required
                  name="login"
                  value={form.login}
                  onChange={handleInput}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400"
                  placeholder="Login"
                />
              </div>
            )}
            {!editId && (
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Parol</label>
                <input
                  required
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleInput}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400"
                  placeholder="Parol"
                />
              </div>
            )}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Telefon</label>
              <input
                name="phoneNumber"
                value={form.phoneNumber}
                onChange={handleInput}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400"
                placeholder="Telefon raqami"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Tavsif</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleInput}
                rows="2"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400"
                placeholder="Server haqida qisqacha"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Parol eslatmasi</label>
              <input
                name="passwordHint"
                value={form.passwordHint}
                onChange={handleInput}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400"
                placeholder="Parol eslatmasi"
              />
            </div>
            <div className="flex items-center gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-700 disabled:opacity-60"
              >
                {loading ? "Saqlanmoqda..." : editId ? "Yangilash" : "Saqlash"}
              </button>
              <button
                type="button"
                onClick={closeModal}
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Bekor qilish
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal open={showDetailModal} onClose={closeDetailModal} center>
        <div className="w-[600px] max-w-full p-6">
          {selectedMonitor && (
            <>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">{selectedMonitor.name}</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openPasswordModal(selectedMonitor)}
                    className="inline-flex items-center gap-1 rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-200"
                  >
                    <KeyRound size={13} /> Parol
                  </button>
                  <button
                    onClick={() => handleToggleActive(selectedMonitor)}
                    className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                      selectedMonitor.active
                        ? "bg-rose-100 text-rose-700 hover:bg-rose-200"
                        : "bg-green-100 text-green-700 hover:bg-green-200"
                    }`}
                  >
                    {selectedMonitor.active ? (
                      <><ToggleRight size={13} /> Bloklash</>
                    ) : (
                      <><ToggleLeft size={13} /> Faollashtirish</>
                    )}
                  </button>
                </div>
              </div>

              <div className="mb-4 grid grid-cols-2 gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm">
                <div><span className="text-slate-500">Login:</span> <span className="font-medium">{selectedMonitor.login}</span></div>
                <div><span className="text-slate-500">Telefon:</span> <span className="font-medium">{selectedMonitor.phoneNumber || "—"}</span></div>
                <div><span className="text-slate-500">Holat:</span>{" "}
                  <span className={`font-medium ${selectedMonitor.active ? "text-green-600" : "text-rose-600"}`}>
                    {selectedMonitor.active ? "Faol" : "Nofaol"}
                  </span>
                </div>
                <div><span className="text-slate-500">Tavsif:</span> <span className="font-medium">{selectedMonitor.description || "—"}</span></div>
              </div>

              <div className="mt-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-semibold text-slate-800">Biriktirilgan zallar</h3>
                  <button
                    onClick={openAssignModal}
                    className="inline-flex items-center gap-1 rounded-lg bg-gray-900 hover:bg-gray-700 px-3 py-1.5 text-xs font-medium text-white transition"
                  >
                    <Link size={13} /> Zal biriktirish
                  </button>
                </div>
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <table className="min-w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-2 font-medium">Nomi</th>
                        <th className="px-4 py-2 font-medium">Direktor</th>
                        <th className="px-4 py-2 font-medium">Holat</th>
                        <th className="px-4 py-2 font-medium text-right">Amal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {safeArray(assignedOrgs).length === 0 ? (
                        <tr>
                          <td colSpan="4" className="px-4 py-6 text-center text-slate-400">
                            Biriktirilgan zallar yo'q
                          </td>
                        </tr>
                      ) : (
                        safeArray(assignedOrgs).map((org) => (
                          <tr key={org.id} className="border-t border-slate-100">
                            <td className="px-4 py-2">{org.name}</td>
                            <td className="px-4 py-2">{org.directorName || "—"}</td>
                            <td className="px-4 py-2">
                              {org.active ? (
                                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">Faol</span>
                              ) : (
                                <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs text-rose-600">Nofaol</span>
                              )}
                            </td>
                            <td className="px-4 py-2 text-right">
                              <button
                                onClick={() => handleRemoveOrg(org.id)}
                                className="inline-flex items-center gap-1 rounded-lg bg-rose-100 px-2 py-1 text-xs text-rose-700 hover:bg-rose-200"
                              >
                                <Unlink size={12} /> Uzish
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Change Password Modal */}
      <Modal open={showPasswordModal} onClose={closePasswordModal} center>
        <div className="w-[400px] max-w-full p-6">
          <div className="mb-4 text-lg font-semibold text-slate-900">Parolni o'zgartirish</div>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Yangi parol</label>
              <input
                required
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400"
                placeholder="Yangi parolni kiriting"
              />
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                className="rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white hover:bg-gray-700"
              >
                O'zgartirish
              </button>
              <button
                type="button"
                onClick={closePasswordModal}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Bekor qilish
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Assign Organization Modal */}
      <Modal open={showAssignModal} onClose={closeAssignModal} center>
        <div className="w-[500px] max-w-full p-6">
          <div className="mb-4 text-lg font-semibold text-slate-900">Zal biriktirish</div>
          <p className="mb-4 text-sm text-slate-500">
            Hech qaysi serverga biriktirilmagan zallar ro'yxati:
          </p>
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="min-w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2 font-medium">Nomi</th>
                  <th className="px-4 py-2 font-medium">Direktor</th>
                  <th className="px-4 py-2 font-medium text-right">Amal</th>
                </tr>
              </thead>
              <tbody>
                {safeArray(unassignedOrgs).length === 0 ? (
                  <tr>
                    <td colSpan="3" className="px-4 py-6 text-center text-slate-400">
                      Biriktirilmagan zallar yo'q
                    </td>
                  </tr>
                ) : (
                  safeArray(unassignedOrgs).map((org) => (
                    <tr key={org.id} className="border-t border-slate-100">
                      <td className="px-4 py-2">{org.name}</td>
                      <td className="px-4 py-2">{org.directorName || "—"}</td>
                      <td className="px-4 py-2 text-right">
                        <button
                          onClick={() => handleAssignOrg(org.id)}
                          className="inline-flex items-center gap-1 rounded-lg bg-gray-900 hover:bg-gray-700 px-2 py-1 text-xs text-white transition"
                        >
                          <Link size={12} /> Biriktirish
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={closeAssignModal}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Yopish
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
