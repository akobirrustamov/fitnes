import { useEffect, useState } from "react";
import ApiCall from "../../../config/index";
import { Modal } from "react-responsive-modal";
import "react-responsive-modal/styles.css";
import { Trash2, Edit, X, Plus, Copy } from "lucide-react";
import { toast } from "react-toastify";

const Organizations = () => {
  // State
  const [organizations, setOrganizations] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [regions, setRegions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingOrg, setEditingOrg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [filters, setFilters] = useState({
    provinceId: "",
    regionId: "",
    active: "",
    search: "",
  });
  const [formData, setFormData] = useState({
    name: "",
    login: "",
    directorName: "",
    directorPhone: "",
    regionId: "",
    description: "",
    address: "",
    passwordHint: "",
    password: "",
  });

  // Fetch data on mount
  useEffect(() => {
    fetchProvinces();
    fetchOrganizations();
  }, []);

  // Fetch regions when province changes
  useEffect(() => {
    if (filters.provinceId) {
      fetchRegions(filters.provinceId);
    } else {
      setRegions([]);
    }
  }, [filters.provinceId]);

  const fetchProvinces = async () => {
    try {
      const response = await ApiCall.get("/api/v1/admin/provinces/getAll");
      setProvinces(response.data.data || response.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchRegions = async (provinceId) => {
    try {
      const response = await ApiCall.get(
        `/api/v1/admin/regions?provinceId=${provinceId}`
      );
      setRegions(response.data.data || response.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      let url = "/api/v1/admin/organizations";
      const params = [];

      if (filters.provinceId) params.push(`provinceId=${filters.provinceId}`);
      if (filters.regionId) params.push(`regionId=${filters.regionId}`);
      if (filters.active !== "") params.push(`active=${filters.active}`);
      if (filters.search) params.push(`search=${filters.search}`);

      if (params.length > 0) {
        url += "?" + params.join("&");
      }

      const response = await ApiCall.get(url);
      setOrganizations(response.data.data || response.data || []);
    } catch (error) {
      toast.error("Zallarni yuklashda xatolik!");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const generatePassword = () => {
    const length = 12;
    const charset =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setGeneratedPassword(password);
    setFormData((prev) => ({
      ...prev,
      password: password,
    }));
  };

  const handleOpenModal = (org = null) => {
    if (org) {
      setEditingOrg(org);
      setFormData({
        name: org.name || "",
        login: org.login || "",
        directorName: org.directorName || "",
        directorPhone: org.directorPhone || "",
        regionId: org.regionId || "",
        description: org.description || "",
        address: org.address || "",
        passwordHint: org.passwordHint || "",
        password: "",
      });
      setGeneratedPassword("");
    } else {
      setEditingOrg(null);
      setFormData({
        name: "",
        login: "",
        directorName: "",
        directorPhone: "",
        regionId: "",
        description: "",
        address: "",
        passwordHint: "",
        password: "",
      });
      setGeneratedPassword("");
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingOrg(null);
    setFormData({
      name: "",
      login: "",
      directorName: "",
      directorPhone: "",
      regionId: "",
      description: "",
      address: "",
      passwordHint: "",
      password: "",
    });
    setGeneratedPassword("");
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    if (!formData.name || !formData.login || !formData.directorName) {
      toast.error("Ism, login va direktor ismi majburiy!");
      return;
    }

    if (!editingOrg && !formData.password) {
      toast.error("Parol majburiy!");
      return;
    }

    try {
      const data = {
        name: formData.name,
        login: formData.login,
        directorName: formData.directorName,
        directorPhone: formData.directorPhone,
        regionId: formData.regionId || null,
        description: formData.description,
        address: formData.address,
        passwordHint: formData.passwordHint,
        ...(formData.password && { password: formData.password }),
      };

      if (editingOrg) {
        // Update
        await ApiCall.put(`/api/v1/admin/organizations/${editingOrg.id}`, data);
        toast.success("Zal yangilandi!");
      } else {
        // Create
        const response = await ApiCall.post("/api/v1/admin/organizations", data);
        toast.success(`Zal qo'shildi! Parol: ${formData.password}`);
      }
      handleCloseModal();
      fetchOrganizations();
    } catch (error) {
      toast.error(error.response?.data?.message || "Xatolik yuz berdi!");
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Rostdan ham o'chirasizmi?")) {
      try {
        await ApiCall.delete(`/api/v1/admin/organizations/${id}`);
        toast.success("Zal o'chirildi!");
        fetchOrganizations();
      } catch (error) {
        toast.error("O'chirishda xatolik!");
        console.error(error);
      }
    }
  };

  const handleToggleActive = async (org) => {
    try {
      const newStatus = !org.active;
      await ApiCall.put(
        `/api/v1/admin/organizations/${org.id}`,
        {
          active: newStatus,
        }
      );
      toast.success(newStatus ? "Zal faollashtirildi!" : "Zal o'chirildi!");
      fetchOrganizations();
    } catch (error) {
      toast.error("Statusni o'zgartirishda xatolik!");
      console.error(error);
    }
  };

  const copyPassword = () => {
    navigator.clipboard.writeText(generatedPassword);
    toast.success("Parol nusxalandi!");
  };

  if (loading && organizations.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-6 bg-white dark:bg-gray-900">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Zallar
        </h1>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus size={20} />
          Qo'shish
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <input
          type="text"
          placeholder="Izlash..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          onKeyUp={() => {
            setTimeout(fetchOrganizations, 300);
          }}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
        />

        <select
          value={filters.provinceId}
          onChange={(e) => {
            setFilters({ ...filters, provinceId: e.target.value, regionId: "" });
          }}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
        >
          <option value="">Viloyat</option>
          {provinces.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <select
          value={filters.regionId}
          onChange={(e) => {
            setFilters({ ...filters, regionId: e.target.value });
          }}
          disabled={!filters.provinceId}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white disabled:opacity-50"
        >
          <option value="">Tuman</option>
          {regions.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>

        <select
          value={filters.active}
          onChange={(e) => {
            setFilters({ ...filters, active: e.target.value });
          }}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
        >
          <option value="">Status</option>
          <option value="true">Faol</option>
          <option value="false">Nofaol</option>
        </select>

        <button
          onClick={fetchOrganizations}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition col-span-1 md:col-span-4"
        >
          Qidirish
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border rounded-lg border-gray-200 dark:border-gray-700">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                Nomi
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                Direktor
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                Telefon
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                Status
              </th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white">
                Harakatlar
              </th>
            </tr>
          </thead>
          <tbody>
            {organizations.length > 0 ? (
              organizations.map((org) => (
                <tr
                  key={org.id}
                  className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                >
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-medium">
                    {org.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {org.directorName}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {org.directorPhone}
                  </td>
                  <td className="px-6 py-4">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={org.active || false}
                        onChange={() => handleToggleActive(org)}
                        className="w-4 h-4 cursor-pointer"
                      />
                      <span className="ml-2 text-sm">
                        {org.active ? "Faol" : "Nofaol"}
                      </span>
                    </label>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-3">
                      <button
                        onClick={() => handleOpenModal(org)}
                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition"
                        title="Tahrir qilish"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(org.id)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
                        title="O'chirish"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="5"
                  className="px-6 py-8 text-center text-gray-500 dark:text-gray-400"
                >
                  Ma'lumot topilmadi
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <Modal open={showModal} onClose={handleCloseModal} center>
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">
              {editingOrg ? "Zalni tahrir qilish" : "Yangi zal qo'shish"}
            </h2>
            <button
              onClick={handleCloseModal}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Zal nomi *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Zal nomi"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Login *</label>
              <input
                type="text"
                name="login"
                value={formData.login}
                onChange={handleInputChange}
                placeholder="Login"
                disabled={editingOrg !== null}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Direktor ismi *</label>
              <input
                type="text"
                name="directorName"
                value={formData.directorName}
                onChange={handleInputChange}
                placeholder="Direktor ismi"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Direktor telefoni</label>
              <input
                type="tel"
                name="directorPhone"
                value={formData.directorPhone}
                onChange={handleInputChange}
                placeholder="+998 XX XXX XX XX"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Tuman</label>
              <select
                name="regionId"
                value={formData.regionId}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              >
                <option value="">Tuman tanlang</option>
                {regions.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Sfera</label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Sfera (masalan: sport kompleksi)"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Manzil</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Manzil"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Parol maslahat</label>
              <input
                type="text"
                name="passwordHint"
                value={formData.passwordHint}
                onChange={handleInputChange}
                placeholder="Parol maslahat"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>

            {!editingOrg ? (
              <div>
                <label className="block text-sm font-medium mb-1">Parol *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="password"
                    value={formData.password}
                    readOnly
                    placeholder="Parol avtomatik generatsiya qilinadi"
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white bg-gray-100 dark:bg-gray-600"
                  />
                  <button
                    onClick={generatePassword}
                    className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                  >
                    Generat
                  </button>
                  {generatedPassword && (
                    <button
                      onClick={copyPassword}
                      className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                    >
                      <Copy size={16} />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium mb-1">Yangi parol (opsional)</label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Parol saqlamasga ikki slayt"
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                  <button
                    onClick={generatePassword}
                    className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                  >
                    Generat
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleCloseModal}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              Bekor qilish
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Saqlash
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Organizations;
