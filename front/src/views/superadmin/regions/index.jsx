import { useEffect, useState } from "react";
import ApiCall from "../../../config/index";
import { Modal } from "react-responsive-modal";
import "react-responsive-modal/styles.css";
import { Trash2, Edit, X, Plus, Search } from "lucide-react";

const Regions = () => {
  // State
  const [regions, setRegions] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    part: "",
    active: "",
    provinceId: "",
  });
  const [formData, setFormData] = useState({
    id: null,
    name: "",
    login: "",
    password: "",
    provinceId: "",
    directorName: "",
    phoneNumber: "",
    location: "",
    description: "",
    businessSphere: "",
    passwordHint: "",
  });

  // Fetch regions and provinces on mount
  useEffect(() => {
    getRegions();
    getProvinces();
  }, []);

  // Fetch regions when filters change
  useEffect(() => {
    getRegions();
  }, [filters]);

  // ---------- API Calls ----------
  const getRegions = async () => {
    try {
      let url = "/api/v1/admin/regions/getAll?";
      if (filters.part) url += `part=${filters.part}&`;
      if (filters.active !== "") url += `active=${filters.active}&`;
      if (filters.provinceId) url += `provinceId=${filters.provinceId}&`;

      const result = await ApiCall(url, "GET");
      if (!result.error && result.data) {
        const regionsList = result.data.data || result.data;
        setRegions(Array.isArray(regionsList) ? regionsList : []);
      }
    } catch (error) {
      console.error("Tumanlarni olishda xatolik", error);
    }
  };

  const getProvinces = async () => {
    try {
      const result = await ApiCall("/api/v1/admin/provinces/getAll?active=true", "GET");
      if (!result.error && result.data) {
        setProvinces(Array.isArray(result.data) ? result.data : []);
      }
    } catch (error) {
      console.error("Viloyatlarni olishda xatolik", error);
    }
  };

  const createRegion = async (regionData) => {
    try {
      setLoading(true);
      const result = await ApiCall("/api/v1/admin/regions/add", "POST", regionData);
      if (!result.error) {
        await getRegions();
        closeModal();
        alert("Tuman muvaffaqiyatli yaratildi!");
      } else {
        alert("Xatolik: " + (result.data?.message || "Tuman yaratishda xatolik"));
      }
    } catch (error) {
      console.error("Yaratishda xatolik", error);
      alert("Tuman yaratishda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const updateRegion = async (id, regionData) => {
    try {
      setLoading(true);
      const result = await ApiCall(`/api/v1/admin/regions/update?id=${id}`, "PUT", regionData);
      if (!result.error) {
        await getRegions();
        closeModal();
        alert("Tuman muvaffaqiyatli yangilandi!");
      } else {
        alert("Xatolik: " + (result.data?.message || "Tumanni yangilashda xatolik"));
      }
    } catch (error) {
      console.error("Yangilashda xatolik", error);
      alert("Tumanni yangilashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const deleteRegion = async (id) => {
    if (window.confirm("Ushbu tumanni o'chirishni xohlaysizmi?")) {
      try {
        const result = await ApiCall(`/api/v1/admin/regions/delete?id=${id}`, "DELETE");
        if (!result.error) {
          await getRegions();
          alert("Tuman muvaffaqiyatli o'chirildi!");
        }
      } catch (error) {
        console.error("O'chirishda xatolik", error);
        alert("Tumanni o'chirishda xatolik yuz berdi");
      }
    }
  };

  const toggleActive = async (id, currentStatus) => {
    try {
      const result = await ApiCall(
        `/api/v1/admin/regions/setActive?id=${id}&active=${!currentStatus}`,
        "GET"
      );
      if (!result.error) {
        await getRegions();
      }
    } catch (error) {
      console.error("Faollikni o'zgartirishda xatolik", error);
    }
  };

  // ---------- Form Handlers ----------
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const payload = {
      name: formData.name,
      login: formData.login,
      provinceId: parseInt(formData.provinceId),
      directorName: formData.directorName,
      phoneNumber: formData.phoneNumber,
      location: formData.location,
      description: formData.description,
      businessSphere: formData.businessSphere,
      passwordHint: formData.passwordHint,
    };

    // Add password only for create
    if (!isEditing) {
      payload.password = formData.password;
    }

    if (isEditing && formData.id) {
      updateRegion(formData.id, payload);
    } else {
      createRegion(payload);
    }
  };

  const openEditModal = (region) => {
    setFormData({
      id: region.id,
      name: region.name,
      login: region.login,
      password: "",
      provinceId: region.provinceId || "",
      directorName: region.directorName || "",
      phoneNumber: region.phoneNumber || "",
      location: region.location || "",
      description: region.description || "",
      businessSphere: region.businessSphere || "",
      passwordHint: region.passwordHint || "",
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const openCreateModal = () => {
    setFormData({
      id: null,
      name: "",
      login: "",
      password: "",
      provinceId: "",
      directorName: "",
      phoneNumber: "",
      location: "",
      description: "",
      businessSphere: "",
      passwordHint: "",
    });
    setIsEditing(false);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({
      id: null,
      name: "",
      login: "",
      password: "",
      provinceId: "",
      directorName: "",
      phoneNumber: "",
      location: "",
      description: "",
      businessSphere: "",
      passwordHint: "",
    });
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-2xl bg-white shadow-lg">
        {/* Header */}
        <div className="flex flex-col items-center justify-between border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 sm:flex-row">
          <h1 className="mb-3 text-2xl font-bold text-gray-800 sm:mb-0">
            Tumanlarni boshqarish
          </h1>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-white shadow-sm transition duration-200 hover:bg-blue-700"
          >
            <Plus size={18} className="mr-2" />
            Yangi tuman qo'shish
          </button>
        </div>

        {/* Filters */}
        <div className="border-b border-gray-200 bg-gray-50 p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                name="part"
                value={filters.part}
                onChange={handleFilterChange}
                placeholder="Qidirish (min 3 ta belgi)..."
                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Province Filter */}
            <select
              name="provinceId"
              value={filters.provinceId}
              onChange={handleFilterChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Barcha viloyatlar</option>
              {provinces.map((province) => (
                <option key={province.id} value={province.id}>
                  {province.name}
                </option>
              ))}
            </select>

            {/* Active Filter */}
            <select
              name="active"
              value={filters.active}
              onChange={handleFilterChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Barcha holatlar</option>
              <option value="true">Faol</option>
              <option value="false">Nofaol</option>
            </select>
          </div>
        </div>

        {/* Regions Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  T/R
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Nomi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Viloyat
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Direktor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Telefon
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                  Holat
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Amallar
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {regions?.length === 0 ? (
                <tr>
                  <td
                    colSpan="8"
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    Tumanlar topilmadi. Yangi tuman qo'shish uchun bosing.
                  </td>
                </tr>
              ) : (
                regions?.map((region, idx) => (
                  <tr key={region.id} className="transition hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {idx + 1}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                      {region.name || "-"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                      {region.provinceName || "-"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                      {region.login || "-"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                      {region.directorName || "-"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                      {region.phoneNumber || "-"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-center">
                      <button
                        onClick={() => toggleActive(region.id, region.active)}
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                          region.active
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {region.active ? "Faol" : "Nofaol"}
                      </button>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <button
                        onClick={() => openEditModal(region)}
                        className="mr-3 text-indigo-600 hover:text-indigo-900"
                        aria-label="Tahrirlash"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => deleteRegion(region.id)}
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
              {isEditing ? "Tumanni tahrirlash" : "Yangi tuman qo'shish"}
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
                Tuman nomi <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Yunusobod tumani"
              />
            </div>

            {/* Province */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Viloyat <span className="text-red-500">*</span>
              </label>
              <select
                name="provinceId"
                value={formData.provinceId}
                onChange={handleInputChange}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Viloyatni tanlang</option>
                {provinces.map((province) => (
                  <option key={province.id} value={province.id}>
                    {province.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Login */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Login <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="login"
                value={formData.login}
                onChange={handleInputChange}
                required
                disabled={isEditing}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                placeholder="yunusobod_region"
              />
              {isEditing && (
                <p className="mt-1 text-xs text-gray-500">
                  Login o'zgartirib bo'lmaydi
                </p>
              )}
            </div>

            {/* Password */}
            {!isEditing && (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Parol <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Parolni kiriting"
                />
              </div>
            )}

            {/* Director Name */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Direktor ismi
              </label>
              <input
                type="text"
                name="directorName"
                value={formData.directorName}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ahmadov Sherali"
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Telefon raqami
              </label>
              <input
                type="text"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+998 90 123 45 70"
              />
            </div>

            {/* Location */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Manzil
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Toshkent sh., Yunusobod t."
              />
            </div>

            {/* Business Sphere */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Faoliyat sohasi
              </label>
              <input
                type="text"
                name="businessSphere"
                value={formData.businessSphere}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Davlat boshqaruvi"
              />
            </div>

            {/* Description */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Tavsif
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="3"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Qisqacha tavsif..."
              />
            </div>

            {/* Password Hint */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Parol eslatmasi
              </label>
              <input
                type="text"
                name="passwordHint"
                value={formData.passwordHint}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Parol eslatmasi"
              />
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

export default Regions;
