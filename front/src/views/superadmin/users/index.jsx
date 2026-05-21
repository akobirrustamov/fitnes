import { useEffect, useState } from "react";
import ApiCall from "../../../config";
import PhoneInput from "components/PhoneInput";
import { Modal } from "react-responsive-modal";
import "react-responsive-modal/styles.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Plus, Edit, Trash2 } from "lucide-react";

const EMPTY_FORM = { name: "", phone: "+998", password: "", roleIds: [] };

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const res = await ApiCall("/api/v1/admin/users", "GET");
    if (!res?.error) setUsers(Array.isArray(res.data) ? res.data : []);
    setLoading(false);
  };

  const fetchRoles = async () => {
    const res = await ApiCall("/api/v1/roles", "GET");
    if (!res?.error) setRoles(Array.isArray(res.data) ? res.data : []);
  };

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditId(null);
    setIsEditing(false);
    setShowModal(true);
  };

  const openEdit = (user) => {
    setForm({
      name: user.name || "",
      phone: user.phone || "+998",
      password: "",
      roleIds: Array.isArray(user.roles) ? user.roles.map((r) => r.id) : [],
    });
    setEditId(user.id);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleInput = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const toggleRole = (roleId) => {
    setForm((p) => {
      const ids = p.roleIds.includes(roleId)
        ? p.roleIds.filter((id) => id !== roleId)
        : [...p.roleIds, roleId];
      return { ...p, roleIds: ids };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      toast.error("Ism va telefon majburiy");
      return;
    }
    if (!isEditing && !form.password.trim()) {
      toast.error("Yangi foydalanuvchi uchun parol majburiy");
      return;
    }

    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      roleIds: form.roleIds,
      ...(form.password.trim() ? { password: form.password.trim() } : {}),
    };

    setSaving(true);
    const res = isEditing
      ? await ApiCall(`/api/v1/admin/users/${editId}`, "PUT", payload)
      : await ApiCall("/api/v1/admin/users", "POST", payload);
    setSaving(false);

    if (!res?.error) {
      toast.success(isEditing ? "Yangilandi." : "Yaratildi.");
      setShowModal(false);
      fetchUsers();
    } else {
      toast.error(res.data?.message || "Xatolik yuz berdi.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Foydalanuvchini o'chirishni xohlaysizmi?")) return;
    const res = await ApiCall(`/api/v1/admin/users/${id}`, "DELETE");
    if (!res?.error) {
      toast.success("O'chirildi.");
      fetchUsers();
    } else {
      toast.error(res.data?.message || "Xatolik.");
    }
  };

  const roleLabel = (name) =>
    name?.replace("ROLE_", "").replace(/_/g, " ") || name;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="mx-auto max-w-5xl space-y-4">

        {/* Header */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Foydalanuvchilar</h1>
              <p className="mt-0.5 text-sm text-gray-500">Jami {users.length} ta foydalanuvchi</p>
            </div>
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
            >
              <Plus size={16} /> Yangi foydalanuvchi
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-gray-700">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">#</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Ism</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Telefon</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Rollar</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  [...Array(4)].map((_, i) => (
                    <tr key={i}>
                      {[...Array(5)].map((_, j) => (
                        <td key={j} className="px-4 py-4">
                          <div className="h-4 animate-pulse rounded bg-gray-100" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-gray-400">
                      Foydalanuvchilar topilmadi
                    </td>
                  </tr>
                ) : (
                  users.map((user, idx) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-400">{idx + 1}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{user.name || "—"}</td>
                      <td className="px-4 py-3 text-gray-500">{user.phone}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {Array.isArray(user.roles) && user.roles.length > 0 ? (
                            user.roles.map((r) => (
                              <span
                                key={r.id}
                                className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700"
                              >
                                {roleLabel(r.name)}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-gray-400">Rol yo'q</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => openEdit(user)}
                            className="rounded-lg bg-gray-100 p-1.5 text-gray-700 hover:bg-gray-200"
                          >
                            <Edit size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
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
      </div>

      {/* Create / Edit Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} center>
        <div className="w-[440px] max-w-full p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            {isEditing ? "Foydalanuvchini tahrirlash" : "Yangi foydalanuvchi"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                To'liq ism <span className="text-red-500">*</span>
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleInput}
                placeholder="Ism Familiya"
                required
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-gray-400"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Telefon / Login <span className="text-red-500">*</span>
              </label>
              <PhoneInput
                name="phone"
                value={form.phone}
                onChange={handleInput}
                required
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-gray-400"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Parol {!isEditing && <span className="text-red-500">*</span>}
              </label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleInput}
                placeholder={isEditing ? "O'zgartirish uchun kiriting" : "Parol"}
                required={!isEditing}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-gray-400"
              />
              {isEditing && (
                <p className="mt-1 text-xs text-gray-400">Bo'sh qoldirsangiz, parol o'zgarmaydi</p>
              )}
            </div>

            {/* Roles */}
            {roles.length > 0 && (
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Rollar</label>
                <div className="flex flex-wrap gap-2">
                  {roles.map((role) => {
                    const active = form.roleIds.includes(role.id);
                    return (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => toggleRole(role.id)}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                          active
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {roleLabel(role.name)}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-50"
              >
                {saving ? "Saqlanmoqda..." : isEditing ? "Yangilash" : "Saqlash"}
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
    </div>
  );
}
