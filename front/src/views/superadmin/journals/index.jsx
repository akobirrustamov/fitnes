import { useEffect, useState } from "react";
import ApiCall, { baseUrl } from "../../../config/index";
import { Modal } from "react-responsive-modal";
import "react-responsive-modal/styles.css";
import { Trash2, Edit, X, Plus, Upload, Eye } from "lucide-react";

const Journals = () => {
  // State
  const [journals, setJournals] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [journalToDelete, setJournalToDelete] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [formData, setFormData] = useState({
    id: null,
    title: "",
    titleAbbr: "",
    issnPrint: "",
    issnOnline: "",
    isbn: "",
    description: "",
    shortDescription: "",
    publicationFrequency: "MONTHLY",
    foundedYear: new Date().getFullYear(),
    publisher: "",
    language: "uz",
    country: "Uzbekistan",
    scope: "",
    metaTitle: "",
    metaDescription: "",
    metaKeywords: "",
    openAccess: true,
    website: "",
    email: "",
    phone: "",
    license: "CC BY 4.0",
  });

  // Fetch journals on mount
  useEffect(() => {
    getJournals();
  }, []);

  // ---------- API Calls ----------
  const getJournals = async () => {
    try {
      const result = await ApiCall("/api/v1/journals", "GET");
      if (!result.error && result.data) {
        // Handle pagination response - backend returns Page<JournalResponse> wrapped in ApiResponse
        const journalsList = result.data?.data?.content || result.data?.content || result.data?.data || result.data;
        // Ensure it's an array
        if (Array.isArray(journalsList)) {
          setJournals(journalsList);
        } else {
          console.warn("Journals data is not an array:", journalsList);
          setJournals([]);
        }
      } else {
        setJournals([]);
      }
    } catch (error) {
      console.error("Jurnallarni olishda xatolik", error);
      setJournals([]);
    }
  };

  const createJournal = async (journalData) => {
    try {
      setLoading(true);
      const result = await ApiCall("/api/v1/journals", "POST", journalData);
      if (!result.error) {
        const createdJournalId = result.data?.data?.id || result.data?.id;

        // Upload cover if file is selected
        if (coverFile && createdJournalId) {
          await uploadCoverImage(createdJournalId);
        }

        await getJournals();
        closeModal();
        alert("Jurnal muvaffaqiyatli yaratildi!");
      } else {
        alert("Xatolik: " + (result.data?.message || "Jurnal yaratishda xatolik"));
      }
    } catch (error) {
      console.error("Yaratishda xatolik", error);
      alert("Jurnal yaratishda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const updateJournal = async (id, journalData) => {
    try {
      setLoading(true);
      const result = await ApiCall(`/api/v1/journals/${id}`, "PUT", journalData);
      if (!result.error) {
        // Upload cover if file is selected
        if (coverFile) {
          await uploadCoverImage(id);
        }

        await getJournals();
        closeModal();
        alert("Jurnal muvaffaqiyatli yangilandi!");
      } else {
        alert("Xatolik: " + (result.data?.message || "Jurnalni yangilashda xatolik"));
      }
    } catch (error) {
      console.error("Yangilashda xatolik", error);
      alert("Jurnalni yangilashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const deleteJournal = async (id) => {
    if (window.confirm("Ushbu jurnalni o'chirishni xohlaysizmi?")) {
      try {
        const result = await ApiCall(`/api/v1/journals/${id}`, "DELETE");
        if (!result.error) {
          await getJournals();
          alert("Jurnal muvaffaqiyatli o'chirildi!");
        }
      } catch (error) {
        console.error("O'chirishda xatolik", error);
        alert("Jurnalni o'chirishda xatolik yuz berdi");
      }
    }
  };

  const uploadCoverImage = async (journalId) => {
    try {
      const formData = new FormData();
      formData.append("file", coverFile);

      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `${baseUrl}/api/v1/journals/${journalId}/cover`,
        {
          method: "POST",
          headers: {
            Authorization: token,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Cover upload failed");
      }

      console.log("Cover image uploaded successfully");
    } catch (error) {
      console.error("Cover upload error:", error);
      alert("Muqova rasmini yuklashda xatolik yuz berdi");
    }
  };

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeCoverPreview = () => {
    setCoverFile(null);
    setCoverPreview(null);
  };

  // ---------- Form Handlers ----------
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Prepare payload
    const payload = {
      title: formData.title,
      titleAbbr: formData.titleAbbr,
      issnPrint: formData.issnPrint,
      issnOnline: formData.issnOnline,
      isbn: formData.isbn,
      description: formData.description,
      shortDescription: formData.shortDescription,
      publicationFrequency: formData.publicationFrequency,
      foundedYear: parseInt(formData.foundedYear),
      publisher: formData.publisher,
      language: formData.language,
      country: formData.country,
      scope: formData.scope,
      metaTitle: formData.metaTitle,
      metaDescription: formData.metaDescription,
      metaKeywords: formData.metaKeywords,
      openAccess: formData.openAccess,
      website: formData.website,
      email: formData.email,
      phone: formData.phone,
      license: formData.license,
    };

    if (isEditing && formData.id) {
      updateJournal(formData.id, payload);
    } else {
      createJournal(payload);
    }
  };

  const openEditModal = (journal) => {
    setFormData({
      id: journal.id,
      title: journal.title || "",
      titleAbbr: journal.titleAbbr || "",
      issnPrint: journal.issnPrint || "",
      issnOnline: journal.issnOnline || "",
      isbn: journal.isbn || "",
      description: journal.description || "",
      shortDescription: journal.shortDescription || "",
      publicationFrequency: journal.publicationFrequency || "MONTHLY",
      foundedYear: journal.foundedYear || new Date().getFullYear(),
      publisher: journal.publisher || "",
      language: journal.language || "uz",
      country: journal.country || "Uzbekistan",
      scope: journal.scope || "",
      metaTitle: journal.metaTitle || "",
      metaDescription: journal.metaDescription || "",
      metaKeywords: journal.metaKeywords || "",
      openAccess: journal.openAccess !== undefined ? journal.openAccess : true,
      website: journal.website || "",
      email: journal.email || "",
      phone: journal.phone || "",
      license: journal.license || "CC BY 4.0",
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const openCreateModal = () => {
    setFormData({
      id: null,
      title: "",
      titleAbbr: "",
      issnPrint: "",
      issnOnline: "",
      isbn: "",
      description: "",
      shortDescription: "",
      publicationFrequency: "MONTHLY",
      foundedYear: new Date().getFullYear(),
      publisher: "",
      language: "uz",
      country: "Uzbekistan",
      scope: "",
      metaTitle: "",
      metaDescription: "",
      metaKeywords: "",
      openAccess: true,
      website: "",
      email: "",
      phone: "",
      license: "CC BY 4.0",
    });
    setIsEditing(false);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({
      id: null,
      title: "",
      titleAbbr: "",
      issnPrint: "",
      issnOnline: "",
      isbn: "",
      description: "",
      shortDescription: "",
      publicationFrequency: "MONTHLY",
      foundedYear: new Date().getFullYear(),
      publisher: "",
      language: "uz",
      country: "Uzbekistan",
      scope: "",
      metaTitle: "",
      metaDescription: "",
      metaKeywords: "",
      openAccess: true,
      website: "",
      email: "",
      phone: "",
      license: "CC BY 4.0",
    });
    setIsEditing(false);
    setCoverFile(null);
    setCoverPreview(null);
  };

  const publicationFrequencies = [
    { value: "WEEKLY", label: "Haftalik" },
    { value: "BIWEEKLY", label: "Ikki haftada bir marta" },
    { value: "MONTHLY", label: "Oylik" },
    { value: "BIMONTHLY", label: "Ikki oyda bir marta" },
    { value: "QUARTERLY", label: "Choraklik" },
    { value: "SEMIANNUAL", label: "Yiliga ikki marta" },
    { value: "ANNUAL", label: "Yillik" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-2xl bg-white shadow-lg">
        {/* Header */}
        <div className="flex flex-col items-center justify-between border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50 p-6 sm:flex-row">
          <div>
            <h1 className="mb-1 text-2xl font-bold text-gray-800">
              Jurnallarni boshqarish
            </h1>
            <p className="text-sm text-gray-600">
              Ilmiy jurnallarni yaratish va tahrirlash
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="mt-3 inline-flex items-center rounded-lg bg-purple-600 px-4 py-2 text-white shadow-sm transition duration-200 hover:bg-purple-700 sm:mt-0"
          >
            <Plus size={18} className="mr-2" />
            Yangi jurnal qo'shish
          </button>
        </div>

        {/* Journals Grid */}
        <div className="p-6">
          {!journals || journals.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <p className="mb-4 text-lg">Jurnallar topilmadi</p>
              <button
                onClick={openCreateModal}
                className="inline-flex items-center rounded-lg bg-purple-600 px-4 py-2 text-white transition hover:bg-purple-700"
              >
                <Plus size={18} className="mr-2" />
                Birinchi jurnalni yarating
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {journals.map((journal) => (
                <div
                  key={journal.id}
                  className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
                >
                  {/* Cover Image */}
                  {journal.coverImageId ? (
                    <div className="h-48 w-full bg-gradient-to-r from-purple-500 to-indigo-600">
                      <img
                        src={`${baseUrl}/api/v1/file/img/${journal.coverImageId}`}
                        alt={journal.title}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.parentElement.innerHTML = `<div class="flex h-full items-center justify-center bg-gradient-to-r from-purple-500 to-indigo-600"><h3 class="text-lg font-bold text-white px-4 text-center">${journal.title}</h3></div>`;
                        }}
                      />
                    </div>
                  ) : (
                    <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-4">
                      <h3 className="text-lg font-bold text-white">
                        {journal.title}
                      </h3>
                      {journal.titleAbbr && (
                        <p className="mt-1 text-sm text-purple-100">
                          {journal.titleAbbr}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="p-4">
                    {journal.coverImageId && (
                      <h3 className="mb-2 text-lg font-bold text-gray-800">
                        {journal.title}
                      </h3>
                    )}
                    <div className="mb-3 space-y-2 text-sm">
                      {journal.issnPrint && (
                        <p className="text-gray-600">
                          <span className="font-medium">ISSN Print:</span>{" "}
                          {journal.issnPrint}
                        </p>
                      )}
                      {journal.issnOnline && (
                        <p className="text-gray-600">
                          <span className="font-medium">ISSN Online:</span>{" "}
                          {journal.issnOnline}
                        </p>
                      )}
                      {journal.publisher && (
                        <p className="text-gray-600">
                          <span className="font-medium">Nashriyot:</span>{" "}
                          {journal.publisher}
                        </p>
                      )}
                      {journal.publicationFrequency && (
                        <p className="text-gray-600">
                          <span className="font-medium">Chastota:</span>{" "}
                          {publicationFrequencies.find(
                            (f) => f.value === journal.publicationFrequency
                          )?.label || journal.publicationFrequency}
                        </p>
                      )}
                    </div>
                    {journal.shortDescription && (
                      <p className="mb-3 line-clamp-2 text-sm text-gray-500">
                        {journal.shortDescription}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${journal.active
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                          }`}
                      >
                        {journal.active ? "Faol" : "Nofaol"}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditModal(journal)}
                          className="text-indigo-600 hover:text-indigo-900"
                          aria-label="Tahrirlash"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => deleteJournal(journal.id)}
                          className="text-red-600 hover:text-red-900"
                          aria-label="O'chirish"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">
              {isEditing ? "Jurnalni tahrirlash" : "Yangi jurnal qo'shish"}
            </h2>
            <button
              onClick={closeModal}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Basic Info */}
            <div className="rounded-lg bg-gray-50 p-4">
              <h3 className="mb-3 font-semibold text-gray-700">
                Asosiy ma'lumotlar
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Jurnal nomi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Ilmiy jurnal nomi"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Qisqartma nomi
                  </label>
                  <input
                    type="text"
                    name="titleAbbr"
                    value={formData.titleAbbr}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="J. Sci. Res."
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      ISSN Print
                    </label>
                    <input
                      type="text"
                      name="issnPrint"
                      value={formData.issnPrint}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="1234-5678"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      ISSN Online
                    </label>
                    <input
                      type="text"
                      name="issnOnline"
                      value={formData.issnOnline}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="1234-5679"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    ISBN
                  </label>
                  <input
                    type="text"
                    name="isbn"
                    value={formData.isbn}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="978-3-16-148410-0"
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="rounded-lg bg-gray-50 p-4">
              <h3 className="mb-3 font-semibold text-gray-700">Tavsif</h3>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Qisqa tavsif
                  </label>
                  <textarea
                    name="shortDescription"
                    value={formData.shortDescription}
                    onChange={handleInputChange}
                    rows="2"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Qisqacha tavsif..."
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    To'liq tavsif
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="4"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Jurnal haqida to'liq ma'lumot..."
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Ilmiy yo'nalish
                  </label>
                  <textarea
                    name="scope"
                    value={formData.scope}
                    onChange={handleInputChange}
                    rows="2"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Ilmiy tadqiqot yo'nalishlari..."
                  />
                </div>
              </div>
            </div>

            {/* Cover Image Upload */}
            <div className="rounded-lg bg-gray-50 p-4">
              <h3 className="mb-3 font-semibold text-gray-700">
                Muqova rasmi
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Rasm yuklash
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {coverPreview && (
                  <div className="relative">
                    <img
                      src={coverPreview}
                      alt="Cover preview"
                      className="h-48 w-full rounded-lg object-cover"
                    />
                    <button
                      type="button"
                      onClick={removeCoverPreview}
                      className="absolute right-2 top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Publication Info */}
            <div className="rounded-lg bg-gray-50 p-4">
              <h3 className="mb-3 font-semibold text-gray-700">
                Nashr ma'lumotlari
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Nashriyot
                  </label>
                  <input
                    type="text"
                    name="publisher"
                    value={formData.publisher}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Nashriyot nomi"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Nashr chastotasi
                  </label>
                  <select
                    name="publicationFrequency"
                    value={formData.publicationFrequency}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {publicationFrequencies.map((freq) => (
                      <option key={freq.value} value={freq.value}>
                        {freq.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Tashkil etilgan yil
                  </label>
                  <input
                    type="number"
                    name="foundedYear"
                    value={formData.foundedYear}
                    onChange={handleInputChange}
                    min="1900"
                    max={new Date().getFullYear()}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Til
                  </label>
                  <select
                    name="language"
                    value={formData.language}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="uz">O'zbek</option>
                    <option value="en">English</option>
                    <option value="ru">Русский</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Mamlakat
                  </label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Uzbekistan"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Litsenziya
                  </label>
                  <input
                    type="text"
                    name="license"
                    value={formData.license}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="CC BY 4.0"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    name="openAccess"
                    checked={formData.openAccess}
                    onChange={handleInputChange}
                    className="form-checkbox h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Ochiq kirish (Open Access)
                  </span>
                </label>
              </div>
            </div>

            {/* Contact Info */}
            <div className="rounded-lg bg-gray-50 p-4">
              <h3 className="mb-3 font-semibold text-gray-700">
                Aloqa ma'lumotlari
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Website
                  </label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="https://example.com"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="journal@example.com"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Telefon
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="+998 xx xxx xx xx"
                  />
                </div>
              </div>
            </div>

            {/* SEO Meta */}
            <div className="rounded-lg bg-gray-50 p-4">
              <h3 className="mb-3 font-semibold text-gray-700">
                SEO ma'lumotlari
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Meta Title
                  </label>
                  <input
                    type="text"
                    name="metaTitle"
                    value={formData.metaTitle}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="SEO uchun sarlavha"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Meta Description
                  </label>
                  <textarea
                    name="metaDescription"
                    value={formData.metaDescription}
                    onChange={handleInputChange}
                    rows="2"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="SEO uchun tavsif"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Meta Keywords
                  </label>
                  <input
                    type="text"
                    name="metaKeywords"
                    value={formData.metaKeywords}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="kalit so'zlar, vergul bilan ajratilgan"
                  />
                </div>
              </div>
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
                className="rounded-lg bg-purple-600 px-4 py-2 text-white transition hover:bg-purple-700 disabled:opacity-50"
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

export default Journals;
