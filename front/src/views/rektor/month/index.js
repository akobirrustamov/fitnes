import { useEffect, useState } from "react";
import ApiCall, { baseUrl } from "../../../config/index";
import { Modal } from "react-responsive-modal";
import "react-responsive-modal/styles.css";
import { Trash2, Edit, X, Plus, Download } from "lucide-react";
import Select from "react-select";

import { useNavigate } from "react-router-dom";

// List of Uzbek month names
const UZBEK_MONTHS = [
  "Yanvar",
  "Fevral",
  "Mart",
  "Aprel",
  "May",
  "Iyun",
  "Iyul",
  "Avgust",
  "Sentyabr",
  "Oktyabr",
  "Noyabr",
  "Dekabr",
];

// Convert months to options format for react-select
const monthOptions = UZBEK_MONTHS.map((month) => ({
  value: month,
  label: month,
}));

export const Month = () => {
  // State
  const [months, setMonths] = useState([]);
  const [levels, setLevels] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLevel, setFilterLevel] = useState("");
  const [formData, setFormData] = useState({
    id: null,
    name: "",
    description: "",
    levelId: "",
    status: "PENDING",
    startedDate: "",
    endedDate: "",
  });
  const navigate = useNavigate()

  // Fetch data on mount
  useEffect(() => {
    getMonths();
    getLevels();
  }, []);

  // ---------- API Calls ----------
  const getMonths = async () => {
    try {
      // Request all months (large page size)
      const result = await ApiCall("/api/v1/month?page=0&size=10000", "GET");
      // The API returns a Page object with content array
      setMonths(result.data?.content || []);
    } catch (error) {
      console.error("Error fetching months", error);
    }
  };

  const getLevels = async () => {
    try {
      const result = await ApiCall("/api/v1/level", "GET");
      setLevels(result.data || []);
    } catch (error) {
      console.error("Error fetching levels", error);
    }
  };

  const createMonth = async (monthData) => {
    try {
      await ApiCall("/api/v1/month", "POST", monthData);
      await getMonths();
      closeModal();
    } catch (error) {
      console.error("Error creating month", error);
      alert("Xatolik yuz berdi. Iltimos qayta urinib ko'ring.");
    }
  };

  const updateMonth = async (id, monthData) => {
    try {
      await ApiCall(`/api/v1/month/${id}`, "PUT", monthData);
      await getMonths();
      closeModal();
    } catch (error) {
      console.error("Error updating month", error);
      alert("Xatolik yuz berdi. Iltimos qayta urinib ko'ring.");
    }
  };

  const deleteMonth = async (id) => {
    if (window.confirm("Ushbu oyni o'chirishni xohlaysizmi?")) {
      try {
        await ApiCall(`/api/v1/month/${id}`, "DELETE");
        await getMonths();
      } catch (error) {
        console.error("Error deleting month", error);
        alert("Xatolik yuz berdi. Iltimos qayta urinib ko'ring.");
      }
    }
  };

  // ---------- Form Handlers ----------
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleMonthChange = (selectedOption) => {
    setFormData({ ...formData, name: selectedOption?.value || "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate dates
    if (new Date(formData.endedDate) <= new Date(formData.startedDate)) {
      alert("Tugash sanasi boshlanish sanasidan keyin bo'lishi kerak!");
      return;
    }

    setLoading(true);

    const payload = {
      name: formData.name,
      description: formData.description,
      levelId: parseInt(formData.levelId),
      status: formData.status,
      startedDate: new Date(formData.startedDate).toISOString(),
      endedDate: new Date(formData.endedDate).toISOString(),
    };

    if (isEditing && formData.id) {
      updateMonth(formData.id, payload);
    } else {
      createMonth(payload);
    }
    setLoading(false);
  };

  const openEditModal = (month) => {
    setFormData({
      id: month.id,
      name: month.name || "",
      description: month.description || "",
      levelId: month.level?.id?.toString() || "",
      status: month.status || "PENDING",
      startedDate: month.startedDate
        ? new Date(month.startedDate).toISOString().slice(0, 16)
        : "",
      endedDate: month.endedDate
        ? new Date(month.endedDate).toISOString().slice(0, 16)
        : "",
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const openCreateModal = () => {
    setFormData({
      id: null,
      name: "",
      description: "",
      levelId: "",
      status: "PENDING",
      startedDate: "",
      endedDate: "",
    });
    setIsEditing(false);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({
      id: null,
      name: "",
      description: "",
      levelId: "",
      status: "PENDING",
      startedDate: "",
      endedDate: "",
    });
    setIsEditing(false);
  };

  // Filter months by name and level
  const filteredMonths = months.filter((month) => {
    const nameMatch = month.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const levelMatch =
      filterLevel === "" || month.level?.id?.toString() === filterLevel;
    return nameMatch && levelMatch;
  });

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      "T/R",
      "Nomi",
      "Tavsif",
      "Daraja",
      "Holati",
      "Boshlanish sanasi",
      "Tugash sanasi",
    ];
    const rows = filteredMonths.map((month, idx) => [
      idx + 1,
      month.name,
      month.description,
      month.level?.name || "-",
      month.status,
      new Date(month.startedDate).toLocaleString(),
      new Date(month.endedDate).toLocaleString(),
    ]);

    let csvContent = headers.join(",") + "\n";
    rows.forEach((row) => {
      csvContent += row.map((cell) => `"${cell}"`).join(",") + "\n";
    });

    const element = document.createElement("a");
    element.setAttribute(
      "href",
      "data:text/plain;charset=utf-8," + encodeURIComponent(csvContent)
    );
    element.setAttribute("download", "months.csv");
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-2xl bg-white shadow-lg">
        {/* Header */}
        <div className="flex flex-col items-center justify-between border-b border-gray-200 bg-gradient-to-r from-blue-50 to-cyan-50 p-6 sm:flex-row">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Oylarni boshqarish
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Jami:{" "}
              <span className="font-semibold">{filteredMonths.length}</span> oy
            </p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 sm:mt-0">
            <button
              onClick={exportToCSV}
              className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-white shadow-sm transition duration-200 hover:bg-blue-700"
            >
              <Download size={18} className="mr-2" />
              Yuklash
            </button>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center rounded-lg bg-green-600 px-4 py-2 text-white shadow-sm transition duration-200 hover:bg-green-700"
            >
              <Plus size={18} className="mr-2" />
              Yangi oy
            </button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="border-b border-gray-200 bg-white p-4 sm:p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <input
              type="text"
              placeholder="Nomi bo'yicha qidirish"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Barcha darajalar</option>
              {levels.map((level) => (
                <option key={level.id} value={level.id.toString()}>
                  {level.name}
                </option>
              ))}
            </select>
            <div className="pt-2 text-sm text-gray-600">
              Filtrlangan natija:{" "}
              <span className="font-semibold">{filteredMonths.length}</span>
            </div>
          </div>
        </div>

        {/* Months Table */}
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
                  Tavsif
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Daraja
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Holati
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Boshlanish sanasi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Tugash sanasi
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Amallar
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredMonths.length === 0 ? (
                <tr>
                  <td
                    colSpan="8"
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    Oylar topilmadi. Yangi oy qo'shish uchun bosing.
                  </td>
                </tr>
              ) : (
                filteredMonths.map((month, idx) => (
                  <tr key={month.id} className="transition hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {idx + 1}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                      <button
                        onClick={() => navigate(`/superadmin/month/${month.id}`)}
                        className="text-blue-600 hover:text-blue-800 hover:underline transition"
                      >
                        {month.name}
                      </button>
                    </td>
                    <td className="max-w-xs truncate whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                      {month.description}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                      {month.level?.name || "-"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${month.status === "PENDING"
                          ? "bg-yellow-100 text-yellow-800"
                          : month.status === "IN_PROGRESS"
                            ? "bg-blue-100 text-blue-800"
                            : month.status === "COMPLETED"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                      >
                        {month.status === "PENDING"
                          ? "Kutilmoqda"
                          : month.status === "IN_PROGRESS"
                            ? "Davom etmoqda"
                            : month.status === "COMPLETED"
                              ? "Yakunlangan"
                              : "Arxivlangan"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                      {new Date(month.startedDate).toLocaleDateString()}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                      {new Date(month.endedDate).toLocaleDateString()}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <button
                        onClick={() => openEditModal(month)}
                        className="mr-3 text-indigo-600 hover:text-indigo-900"
                        aria-label="Tahrirlash"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => deleteMonth(month.id)}
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
            maxWidth: "800px",
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
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">
              {isEditing ? "Oyni tahrirlash" : "Yangi oy qo'shish"}
            </h2>
            <button
              onClick={closeModal}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name field as searchable react-select */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Oy nomi *
              </label>
              <Select
                options={monthOptions}
                value={
                  formData.name
                    ? { value: formData.name, label: formData.name }
                    : null
                }
                onChange={handleMonthChange}
                placeholder="Qidirish yoki tanlash..."
                isClearable
                isSearchable
                className="react-select-container"
                classNamePrefix="react-select"
                styles={{
                  control: (provided) => ({
                    ...provided,
                    borderRadius: "0.5rem",
                    borderColor: "#d1d5db",
                    boxShadow: "none",
                    "&:hover": { borderColor: "#d1d5db" },
                  }),
                  option: (provided, state) => ({
                    ...provided,
                    backgroundColor: state.isFocused ? "#eef2ff" : "white",
                    color: "#1f2937",
                  }),
                }}
              />
            </div>

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
                placeholder="Tavsif (maksimum 500 belgi)"
                maxLength="500"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Daraja *
                </label>
                <select
                  name="levelId"
                  value={formData.levelId}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Darajani tanlang</option>
                  {levels.map((level) => (
                    <option key={level.id} value={level.id.toString()}>
                      {level.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Holati *
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="PENDING">Kutilmoqda</option>
                  <option value="IN_PROGRESS">Davom etmoqda</option>
                  <option value="COMPLETED">Yakunlangan</option>
                  <option value="ARCHIVED">Arxivlangan</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Boshlanish sanasi *
                </label>
                <input
                  type="datetime-local"
                  name="startedDate"
                  value={formData.startedDate}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Tugash sanasi *
                </label>
                <input
                  type="datetime-local"
                  name="endedDate"
                  value={formData.endedDate}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 border-t border-gray-200 pt-6">
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
