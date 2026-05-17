import { useEffect, useState } from "react";
import ApiCall from "../../../config/index";
import { Modal } from "react-responsive-modal";
import "react-responsive-modal/styles.css";
import { Trash2, Edit, X, Plus } from "lucide-react";
import { toast } from "react-toastify";

const Monitors = () => {
  // State
  const [monitors, setMonitors] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingMonitor, setEditingMonitor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    login: "",
    password: "",
  });

  // Fetch monitors on mount
  useEffect(() => {
    fetchMonitors();
  }, []);

  const fetchMonitors = async () => {
    try {
      setLoading(true);
      const response = await ApiCall.get("/api/v1/admin/monitors");
      setMonitors(response.data.data || response.data || []);
    } catch (error) {
      toast.error("Monitorlarni yuklashda xatolik!");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (monitor = null) => {
    if (monitor) {
      setEditingMonitor(monitor);
      setFormData({
        name: monitor.name || "",
        login: monitor.login || "",
        password: "",
      });
    } else {
      setEditingMonitor(null);
      setFormData({
        name: "",
        login: "",
        password: "",
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingMonitor(null);
    setFormData({
      name: "",
      login: "",
      password: "",
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    if (!formData.name || !formData.login) {
      toast.error("Ism va login majburiy!");
      return;
    }

    try {
      if (editingMonitor) {
        // Update
        await ApiCall.put(
          `/api/v1/admin/monitors/${editingMonitor.id}`,
          {
            name: formData.name,
            login: formData.login,
            ...(formData.password && { password: formData.password }),
          }
        );
        toast.success("Monitor yangilandi!");
      } else {
        // Create
        if (!formData.password) {
          toast.error("Parol majburiy!");
          return;
        }
        await ApiCall.post("/api/v1/admin/monitors", {
          name: formData.name,
          login: formData.login,
          password: formData.password,
        });
        toast.success("Monitor qo'shildi!");
      }
      handleCloseModal();
      fetchMonitors();
    } catch (error) {
      toast.error(error.response?.data?.message || "Xatolik yuz berdi!");
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Rostdan ham o'chirasizmi?")) {
      try {
        await ApiCall.delete(`/api/v1/admin/monitors/${id}`);
        toast.success("Monitor o'chirildi!");
        fetchMonitors();
      } catch (error) {
        toast.error("O'chirishda xatolik!");
        console.error(error);
      }
    }
  };

  const handleToggleActive = async (monitor) => {
    try {
      const newStatus = !monitor.active;
      await ApiCall.put(
        `/api/v1/admin/monitors/${monitor.id}`,
        {
          active: newStatus,
        }
      );
      toast.success(newStatus ? "Monitor faollashtirildi!" : "Monitor o'chirildi!");
      fetchMonitors();
    } catch (error) {
      toast.error("Statusni o'zgartirishda xatolik!");
      console.error(error);
    }
  };

  if (loading && monitors.length === 0) {
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
          Monitorlar
        </h1>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus size={20} />
          Qo'shish
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border rounded-lg border-gray-200 dark:border-gray-700">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                Ism
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                Login
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
            {monitors.length > 0 ? (
              monitors.map((monitor) => (
                <tr
                  key={monitor.id}
                  className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                >
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-medium">
                    {monitor.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {monitor.login}
                  </td>
                  <td className="px-6 py-4">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={monitor.active || false}
                        onChange={() => handleToggleActive(monitor)}
                        className="w-4 h-4 cursor-pointer"
                      />
                      <span className="ml-2 text-sm">
                        {monitor.active ? "Faol" : "Nofaol"}
                      </span>
                    </label>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-3">
                      <button
                        onClick={() => handleOpenModal(monitor)}
                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition"
                        title="Tahrir qilish"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(monitor.id)}
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
                  colSpan="4"
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
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg w-96">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">
              {editingMonitor ? "Monitirni tahrir qilish" : "Yangi monitor qo'shish"}
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
              <label className="block text-sm font-medium mb-1">Ism *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Monitor ismi"
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
                disabled={editingMonitor !== null}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Parol {editingMonitor ? "(yangi parol)" : "*"}
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder={editingMonitor ? "Yangi parol (optional)" : "Parol"}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>
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

export default Monitors;
