import { useEffect, useState } from "react";
import ApiCall from "../../../config/index";
import { Modal } from "react-responsive-modal";
import "react-responsive-modal/styles.css";
import {
  Eye,
  Edit,
  X,
  Filter,
  Download,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  Search,
} from "lucide-react";

const Articles = () => {
  // State
  const [articles, setArticles] = useState([]);
  const [journals, setJournals] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: "ALL",
    journalId: "",
    search: "",
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const pageSize = 20;

  // Fetch data on mount
  useEffect(() => {
    getArticles();
    getJournals();
  }, [currentPage, filters]);

  // ---------- API Calls ----------
  const getArticles = async () => {
    try {
      setLoading(true);
      let url = `/api/v1/articles/admin/all?page=${currentPage}&size=${pageSize}`;

      if (filters.status !== "ALL") {
        url += `&status=${filters.status}`;
      }
      if (filters.journalId) {
        url += `&journalId=${filters.journalId}`;
      }

      const result = await ApiCall(url, "GET");
      if (!result.error && result.data) {
        const articlesData = result.data?.content || result.data?.data || result.data;
        if (Array.isArray(articlesData)) {
          setArticles(articlesData);
          setTotalPages(result.data?.totalPages || 1);
        } else {
          setArticles([]);
        }
      } else {
        setArticles([]);
      }
    } catch (error) {
      console.error("Maqolalarni olishda xatolik", error);
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  const getJournals = async () => {
    try {
      const result = await ApiCall("/api/v1/journals", "GET");
      if (!result.error && result.data) {
        const journalsList = result.data?.content || result.data?.data || result.data;
        if (Array.isArray(journalsList)) {
          setJournals(journalsList);
        } else {
          setJournals([]);
        }
      }
    } catch (error) {
      console.error("Jurnallarni olishda xatolik", error);
    }
  };

  const updateArticleStatus = async (articleId, newStatus) => {
    try {
      const result = await ApiCall(
        `/api/v1/articles/${articleId}/status?status=${newStatus}`,
        "PUT"
      );
      if (!result.error) {
        await getArticles();
        alert("Maqola holati muvaffaqiyatli yangilandi!");
      } else {
        alert("Xatolik: " + (result.data?.message || "Holatni yangilashda xatolik"));
      }
    } catch (error) {
      console.error("Holatni yangilashda xatolik", error);
      alert("Maqola holatini yangilashda xatolik yuz berdi");
    }
  };

  const viewArticleDetails = (article) => {
    setSelectedArticle(article);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedArticle(null);
  };

  // ---------- Filter Handlers ----------
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(0); // Reset to first page
  };

  const handleSearch = (e) => {
    e.preventDefault();
    getArticles();
  };

  // ---------- Status Config ----------
  const articleStatuses = [
    { value: "ALL", label: "Barchasi", color: "gray" },
    { value: "DRAFT", label: "Qoralama", color: "gray" },
    { value: "SUBMITTED", label: "Yuborilgan", color: "blue" },
    { value: "UNDER_REVIEW", label: "Ko'rib chiqilmoqda", color: "yellow" },
    { value: "REVISION_REQUIRED", label: "Tuzatish kerak", color: "orange" },
    { value: "ACCEPTED", label: "Qabul qilingan", color: "green" },
    { value: "PUBLISHED", label: "Nashr etilgan", color: "purple" },
    { value: "REJECTED", label: "Rad etilgan", color: "red" },
    { value: "ARCHIVED", label: "Arxivlangan", color: "gray" },
  ];

  const getStatusBadge = (status) => {
    const statusConfig = articleStatuses.find((s) => s.value === status);
    if (!statusConfig) return null;

    const colorClasses = {
      gray: "bg-gray-100 text-gray-700",
      blue: "bg-blue-100 text-blue-700",
      yellow: "bg-yellow-100 text-yellow-700",
      orange: "bg-orange-100 text-orange-700",
      green: "bg-green-100 text-green-700",
      purple: "bg-purple-100 text-purple-700",
      red: "bg-red-100 text-red-700",
    };

    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
          colorClasses[statusConfig.color]
        }`}
      >
        {statusConfig.label}
      </span>
    );
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "PUBLISHED":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "UNDER_REVIEW":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "REJECTED":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 overflow-hidden rounded-2xl bg-white shadow-lg">
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6">
            <div className="flex flex-col items-start justify-between sm:flex-row sm:items-center">
              <div>
                <h1 className="mb-1 text-2xl font-bold text-gray-800">
                  Maqolalarni boshqarish
                </h1>
                <p className="text-sm text-gray-600">
                  Ilmiy maqolalarni ko'rish va holatini boshqarish
                </p>
              </div>
              <div className="mt-3 flex items-center gap-2 sm:mt-0">
                <span className="text-sm text-gray-600">
                  Jami: {articles.length} ta maqola
                </span>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="border-t border-gray-200 bg-white p-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {/* Status Filter */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Holat bo'yicha
                </label>
                <select
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {articleStatuses.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Journal Filter */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Jurnal bo'yicha
                </label>
                <select
                  name="journalId"
                  value={filters.journalId}
                  onChange={handleFilterChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Barcha jurnallar</option>
                  {journals.map((journal) => (
                    <option key={journal.id} value={journal.id}>
                      {journal.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Qidirish
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="search"
                    value={filters.search}
                    onChange={handleFilterChange}
                    placeholder="Maqola nomi..."
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Articles Table */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
                <p className="mt-4 text-gray-600">Yuklanmoqda...</p>
              </div>
            </div>
          ) : !articles || articles.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <FileText className="mx-auto h-16 w-16 text-gray-300" />
              <p className="mt-4 text-lg">Maqolalar topilmadi</p>
              <p className="mt-2 text-sm">
                Filtrlarni o'zgartiring yoki yangi maqola qo'shilishini kuting
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Maqola
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Jurnal
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Muallif
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Holat
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Yuborilgan sana
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                        Amallar
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {articles.map((article) => (
                      <tr
                        key={article.id}
                        className="transition hover:bg-gray-50"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-start gap-3">
                            {getStatusIcon(article.status)}
                            <div>
                              <p className="font-medium text-gray-900">
                                {article.title}
                              </p>
                              {article.abstractText && (
                                <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                                  {article.abstractText}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                          {article.journal?.title || "-"}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                          {article.submittedBy?.name || "-"}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          {getStatusBadge(article.status)}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {article.submittedAt
                            ? new Date(article.submittedAt).toLocaleDateString(
                                "uz-UZ"
                              )
                            : "-"}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                          <button
                            onClick={() => viewArticleDetails(article)}
                            className="mr-3 text-indigo-600 hover:text-indigo-900"
                            aria-label="Ko'rish"
                          >
                            <Eye size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-gray-200 bg-white px-6 py-4">
                  <div className="text-sm text-gray-700">
                    Sahifa {currentPage + 1} / {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                      disabled={currentPage === 0}
                      className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Oldingi
                    </button>
                    <button
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages - 1, p + 1))
                      }
                      disabled={currentPage >= totalPages - 1}
                      className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Keyingi
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Article Details Modal */}
      <Modal
        open={showModal}
        onClose={closeModal}
        center
        styles={{
          modal: {
            width: "90%",
            maxWidth: "900px",
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
        {selectedArticle && (
          <div className="p-6">
            <div className="mb-4 flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-800">
                  {selectedArticle.title}
                </h2>
                <div className="mt-2 flex items-center gap-3">
                  {getStatusBadge(selectedArticle.status)}
                  <span className="text-sm text-gray-500">
                    {selectedArticle.journal?.title}
                  </span>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Abstract */}
              {selectedArticle.abstractText && (
                <div>
                  <h3 className="mb-2 font-semibold text-gray-700">
                    Annotatsiya
                  </h3>
                  <p className="text-gray-600">{selectedArticle.abstractText}</p>
                </div>
              )}

              {/* Keywords */}
              {selectedArticle.keywords && selectedArticle.keywords.length > 0 && (
                <div>
                  <h3 className="mb-2 font-semibold text-gray-700">
                    Kalit so'zlar
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedArticle.keywords.map((keyword, idx) => (
                      <span
                        key={idx}
                        className="rounded-full bg-indigo-100 px-3 py-1 text-sm text-indigo-700"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Authors */}
              {selectedArticle.authors && selectedArticle.authors.length > 0 && (
                <div>
                  <h3 className="mb-2 font-semibold text-gray-700">
                    Mualliflar
                  </h3>
                  <div className="space-y-2">
                    {selectedArticle.authors.map((author, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 text-sm text-gray-600"
                      >
                        <span className="font-medium">{author.name}</span>
                        {author.email && (
                          <span className="text-gray-400">({author.email})</span>
                        )}
                        {author.affiliation && (
                          <span className="text-gray-500">
                            - {author.affiliation}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4 rounded-lg bg-gray-50 p-4">
                <div>
                  <p className="text-sm text-gray-500">Yuborilgan sana</p>
                  <p className="font-medium text-gray-800">
                    {selectedArticle.submittedAt
                      ? new Date(selectedArticle.submittedAt).toLocaleDateString(
                          "uz-UZ"
                        )
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Yuborgan</p>
                  <p className="font-medium text-gray-800">
                    {selectedArticle.submittedBy?.name || "-"}
                  </p>
                </div>
                {selectedArticle.publishedAt && (
                  <div>
                    <p className="text-sm text-gray-500">Nashr etilgan sana</p>
                    <p className="font-medium text-gray-800">
                      {new Date(selectedArticle.publishedAt).toLocaleDateString(
                        "uz-UZ"
                      )}
                    </p>
                  </div>
                )}
                {selectedArticle.doi && (
                  <div>
                    <p className="text-sm text-gray-500">DOI</p>
                    <p className="font-medium text-gray-800">
                      {selectedArticle.doi}
                    </p>
                  </div>
                )}
              </div>

              {/* Status Change */}
              <div className="rounded-lg border border-gray-200 p-4">
                <h3 className="mb-3 font-semibold text-gray-700">
                  Holatni o'zgartirish
                </h3>
                <div className="flex flex-wrap gap-2">
                  {articleStatuses
                    .filter((s) => s.value !== "ALL" && s.value !== selectedArticle.status)
                    .map((status) => (
                      <button
                        key={status.value}
                        onClick={() =>
                          updateArticleStatus(selectedArticle.id, status.value)
                        }
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                      >
                        {status.label}
                      </button>
                    ))}
                </div>
              </div>

              {/* PDF Download */}
              {selectedArticle.pdfFile && (
                <div className="flex justify-end">
                  <a
                    href={`/api/v1/articles/${selectedArticle.id}/download`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-white transition hover:bg-indigo-700"
                  >
                    <Download size={18} />
                    PDF yuklab olish
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Articles;
