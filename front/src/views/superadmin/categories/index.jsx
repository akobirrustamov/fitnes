import { useEffect, useState } from "react";
import ApiCall from "../../../config/index";
import { Modal } from "react-responsive-modal";
import "react-responsive-modal/styles.css";
import { Trash2, Edit, X, Plus } from "lucide-react";
import { toast } from "react-toastify";

const Categories = () => {
  // State
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    icon: null,
    iconPreview: null,
  });

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await ApiCall.get("/api/v1/admin/categories");
      setCategories(response.data.data || response.data || []);
    } catch (error) {
      toast.error("Kategoriyalarni yuklashda xatolik!");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name || "",
        icon: null,
        iconPreview: category.icon || null,
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: "",
        icon: null,
        iconPreview: null,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({
      name: "",
      icon: null,
      iconPreview: null,
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          icon: file,
          iconPreview: reader.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast.error("Kategoriya nomi majburiy!");
      return;
    }

    try {
      const data = new FormData();
      data.append("name", formData.name);
      if (formData.icon) {
        data.append("icon", formData.icon);
      }

      if (editingCategory) {
        // Update
        await ApiCall.put(
          `/api/v1/admin/categories/${editingCategory.id}`,
          data,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
        toast.success("Kategoriya yangilandi!");
      } else {
        // Create
        await ApiCall.post("/api/v1/admin/categories", data, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        toast.success("Kategoriya qo'shildi!");
      }
      handleCloseModal();
      fetchCategories();
    } catch (error) {
      toast.error(error.response?.data?.message || "Xatolik yuz berdi!");
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Rostdan ham o'chirasizmi? Unga bog'langan tovarlar ham o'chirilib ketadi!")) {
      try {
        await ApiCall.delete(`/api/v1/admin/categories/${id}`);
        toast.success("Kategoriya o'chirildi!");
        fetchCategories();
      } catch (error) {
        toast.error("O'chirishda xatolik!");
        console.error(error);
      }
    }
  };

  if (loading && categories.length === 0) {
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
          Kategoriyalar
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
                Nomi
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                Icon
              </th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white">
                Harakatlar
              </th>
            </tr>
          </thead>
          <tbody>
            {categories.length > 0 ? (
              categories.map((category) => (
                <tr
                  key={category.id}
                  className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                >
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-medium">
                    {category.name}
                  </td>
                  <td className="px-6 py-4">
                    {category.icon ? (
                      <img
                        src={category.icon}
                        alt={category.name}
                        className="h-8 w-8 object-cover rounded"
                      />
                    ) : (
                      <span className="text-gray-400">Yo'q</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-3">
                      <button
                        onClick={() => handleOpenModal(category)}
                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition"
                        title="Tahrir qilish"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(category.id)}
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
                  colSpan="3"
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
              {editingCategory ? "Kategoriyani tahrir qilish" : "Yangi kategoriya qo'shish"}
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
              <label className="block text-sm font-medium mb-1">Nomi *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Kategoriya nomi"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Icon (Surat)</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
              {formData.iconPreview && (
                <div className="mt-3 flex items-center gap-3">
                  <img
                    src={formData.iconPreview}
                    alt="Preview"
                    className="h-12 w-12 object-cover rounded border border-gray-300"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Tasviri ko'rish
                  </span>
                </div>
              )}
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

export default Categories;
