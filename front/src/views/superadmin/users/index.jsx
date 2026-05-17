import { useEffect, useState } from "react";
import ApiCall from "../../../config/index"; // Adjust import path if needed
import { Modal } from "react-responsive-modal";
import "react-responsive-modal/styles.css";
import { Trash2, Edit, X, Plus } from "lucide-react"; // Optional icons, you can use any icon lib

const Dashboard = () => {
  // State
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    phone: "",
    password: "",
    name: "",
    email: "",
    orcid: "",
    affiliation: "",
    country: "",
    bio: "",
    roleIds: [], // array of role IDs (numbers)
  });

  // Fetch users and roles on mount
  useEffect(() => {
    getUsers();
    getRoles();
  }, []);

  // ---------- API Calls ----------
  const getUsers = async () => {
    try {
      const result = await ApiCall("/api/v1/admin/users", "GET");
      setUsers(result.data);
    } catch (error) {
      console.error("Foydalanuvchilarni olishda xatolik", error);
    }
  };

  const getRoles = async () => {
    try {
      const result = await ApiCall("/api/v1/roles", "GET");
      setRoles(result.data);
    } catch (error) {
      console.error("Rolllarni olishda xatolik", error);
    }
  };

  const createUser = async (userData) => {
    try {
      await ApiCall("/api/v1/admin/users", "POST", userData);
      await getUsers(); // refresh list
      closeModal();
    } catch (error) {
      console.error("Yaratishda xatolik", error);
    }
  };

  const updateUser = async (id, userData) => {
    try {
      await ApiCall(`/api/v1/admin/users/${id}`, "PUT", userData);
      await getUsers();
      closeModal();
    } catch (error) {
      console.error("Yangilashda xatolik", error);
    }
  };

  const deleteUser = async (id) => {
    if (window.confirm("Ushbu foydalanuvchini o'chirishni xohlaysizmi?")) {
      try {
        await ApiCall(`/api/v1/admin/users/${id}`, "DELETE");
        await getUsers();
      } catch (error) {
        console.error("O'chirishda xatolik", error);
      }
    }
  };

  // ---------- Form Handlers ----------
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (roleId) => {
    setFormData((prev) => {
      const currentRoleIds = prev.roleIds;
      if (currentRoleIds.includes(roleId)) {
        // Remove role
        return {
          ...prev,
          roleIds: currentRoleIds.filter((id) => id !== roleId),
        };
      } else {
        // Add role
        return { ...prev, roleIds: [...currentRoleIds, roleId] };
      }
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    // Prepare payload (exclude id for create)
    const payload = {
      phone: formData.phone,
      password: formData.password,
      name: formData.name,
      email: formData.email,
      orcid: formData.orcid,
      affiliation: formData.affiliation,
      country: formData.country,
      bio: formData.bio,
      roleIds: formData.roleIds,
    };

    if (isEditing && formData.id) {
      updateUser(formData.id, payload);
    } else {
      createUser(payload);
    }
    setLoading(false);
  };

  const openEditModal = (user) => {
    setFormData({
      id: user.id,
      phone: user.phone,
      password: "", // you might want to leave blank or show placeholder
      name: user.name,
      email: user.email || "",
      orcid: user.orcid || "",
      affiliation: user.affiliation || "",
      country: user.country || "",
      bio: user.bio || "",
      roleIds: user.roles?.map((role) => role.id) || [],
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const openCreateModal = () => {
    setFormData({
      id: null,
      phone: "",
      password: "",
      name: "",
      email: "",
      orcid: "",
      affiliation: "",
      country: "",
      bio: "",
      roleIds: [],
    });
    setIsEditing(false);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({
      id: null,
      phone: "",
      password: "",
      name: "",
      email: "",
      orcid: "",
      affiliation: "",
      country: "",
      bio: "",
      roleIds: [],
    });
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-2xl bg-white shadow-lg">
        {/* Header */}
        <div className="flex flex-col items-center justify-between border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 sm:flex-row">
          <h1 className="mb-3 text-2xl font-bold text-gray-800 sm:mb-0">
            Foydalanuvchilarni boshqarish
          </h1>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-white shadow-sm transition duration-200 hover:bg-blue-700"
          >
            <Plus size={18} className="mr-2" />
            Yangi foydalanuvchi qo'shish
          </button>
        </div>

        {/* Users Table - Responsive */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  T/R
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Ism
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Telefon / Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Affiliation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Rollar
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Amallar
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {users?.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    Foydalanuvchilar topilmadi. Yangi foydalanuvchi qo'shish
                    uchun bosing.
                  </td>
                </tr>
              ) : (
                users?.map((user, idx) => (
                  <tr key={user.id} className="transition hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {idx + 1}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                      {user.name || "-"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                      {user.phone}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                      {user.email || "-"}
                    </td>
                    <td className="max-w-xs truncate px-6 py-4 text-sm text-gray-600">
                      {user.affiliation || "-"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                      {user.roles?.map((r) => r.name).join(", ") ||
                        "Rollar mavjud emas"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <button
                        onClick={() => openEditModal(user)}
                        className="mr-3 text-indigo-600 hover:text-indigo-900"
                        aria-label="Tahrirlash"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => deleteUser(user.id)}
                        className="text-red-600 hover:text-red-900"
                        aria-label="O'chirish"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Create/Edit */}
      <Modal
        open={showModal}
        onClose={closeModal}
        center
        styles={{
          modal: {
            width: "90%",
            maxWidth: "600px",
            borderRadius: "24px",
            padding: "0",
            backgroundColor: "#ffffff",
            maxHeight: "90vh",
            overflowY: "auto",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          },
          overlay: {
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(6px)",
          },
        }}
      >
        <div className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">
              {isEditing
                ? "Foydalanuvchini tahrirlash"
                : "Yangi foydalanuvchi qo'shish"}
            </h2>
            <button
              onClick={closeModal}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                To'liq ism <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="To'liq ismingizni kiriting"
              />
            </div>

            {/* Phone / Login */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Telefon / Login <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+998 xx xxx xx xx"
              />
            </div>

            {/* Email */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="example@domain.com"
              />
            </div>

            {/* ORCID */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                ORCID
              </label>
              <input
                type="text"
                name="orcid"
                value={formData.orcid}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0000-0000-0000-0000"
              />
              <p className="mt-1 text-xs text-gray-500">
                Open Researcher and Contributor ID
              </p>
            </div>

            {/* Affiliation */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Affiliation (Tashkilot)
              </label>
              <input
                type="text"
                name="affiliation"
                value={formData.affiliation}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Buxoro Xalqaro Universiteti"
              />
            </div>

            {/* Country */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Mamlakat
              </label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Uzbekistan"
              />
            </div>

            {/* Bio */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Biografiya
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                rows="3"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Qisqacha biografiya..."
              />
            </div>

            {/* Password */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Parol {!isEditing && <span className="text-red-500">*</span>}
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required={!isEditing} // only required when creating
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Parolni kiriting"
              />
              {isEditing && (
                <p className="mt-1 text-xs text-gray-500">
                  Agar parolni o'zgartirmoqchi bo'lmasangiz, bo'sh qoldiring
                </p>
              )}
            </div>

            {/* Roles (multiple checkboxes) */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Rolni belgilash
              </label>
              <div className="flex flex-wrap gap-4">
                {roles.map((role) => (
                  <label key={role.id} className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.roleIds.includes(role.id)}
                      onChange={() => handleRoleChange(role.id)}
                      className="form-checkbox h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      {role.name}
                    </span>
                  </label>
                ))}
              </div>
              {roles.length === 0 && (
                <p className="text-sm text-gray-500">Rollar mavjud emas</p>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition hover:bg-gray-50"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700 disabled:opacity-50"
              >
                {loading
                  ? "Saqlanmoqda..."
                  : isEditing
                  ? "Yangilash"
                  : "Yaratish"}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};

export default Dashboard;
