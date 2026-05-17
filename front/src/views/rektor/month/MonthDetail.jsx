import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ApiCall, { baseUrl } from "../../../config/index";
import { Trash2, Edit, Plus, ArrowLeft, Download } from "lucide-react";
import { RejaModal } from "./RejaModal";
import "react-responsive-modal/styles.css";

const EMPTY_FORM = {
    id: null,
    name: "",
    description: "",
    checkerIds: [],
    status: 1,
    exampleId: "",
    exampleName: "",
    exampleFile: null,
};

const getStatusLabel = (status) => {
    const map = {
        "PENDING": "Kutilmoqda",
        "IN_PROGRESS": "Davom etmoqda",
        "COMPLETED": "Yakunlangan",
        "ARCHIVED": "Arxivlangan",
    };
    return map[status] || status || "—";
};

export const MonthDetail = () => {
    const { monthId } = useParams();
    const navigate = useNavigate();

    // Month state
    const [month, setMonth] = useState(null);
    const [rejas, setRejas] = useState([]);
    const [users, setUsers] = useState([]);
    const [pageLoading, setPageLoading] = useState(true);
    const [error, setError] = useState(null);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState(EMPTY_FORM);

    useEffect(() => {
        if (monthId) {
            console.log("MonthDetail mounted with monthId:", monthId);
            loadPageData();
        }
    }, [monthId]);

    const loadPageData = async () => {
        try {
            setPageLoading(true);
            setError(null);
            console.log("Loading page data for monthId:", monthId);

            await fetchMonth();
            await fetchRejas();
            await fetchUsers();
        } catch (err) {
            console.error("Error loading page", err);
            setError("Ma'lumotlarni yuklashda xatolik yuz berdi");
        } finally {
            setPageLoading(false);
        }
    };

    // ---------- API Calls ----------
    const fetchMonth = async () => {
        try {
            console.log("Fetching month with ID:", monthId);
            const result = await ApiCall(`/api/v1/month/${monthId}`, "GET");
            console.log("Month data received:", result);
            setMonth(result.data);
        } catch (error) {
            console.error("Error fetching month", error);
            throw error;
        }
    };

    const fetchRejas = async () => {
        try {
            console.log("Fetching rejas for month:", monthId);
            const result = await ApiCall(`/api/v1/reja/by-month/${monthId}`, "GET");
            console.log("Rejas data received:", result);
            const basicRejas = result.data || [];

            const detailedRejas = await Promise.all(
                basicRejas.map(async (reja) => {
                    if (Array.isArray(reja.checkers)) return reja;
                    try {
                        const detail = await ApiCall(`/api/v1/reja/${reja.id}`, "GET");
                        return { ...reja, ...detail.data };
                    } catch (error) {
                        console.error(`Error fetching reja detail ${reja.id}`, error);
                        return reja;
                    }
                })
            );

            setRejas(detailedRejas);
        } catch (error) {
            console.error("Error fetching rejas", error);
            throw error;
        }
    };

    const fetchUsers = async () => {
        try {
            console.log("Fetching users");
            const result = await ApiCall("/api/v1/admin/users", "GET");
            console.log("Users data received:", result);
            const data = result.data;
            const list = Array.isArray(data)
                ? data
                : Array.isArray(data?.content)
                    ? data.content
                    : [];
            setUsers(list);
        } catch (error) {
            console.error("Error fetching users", error);
            setUsers([]);
        }
    };

    // ---------- Reja handlers ----------
    const createReja = async (payload) => {
        try {
            await ApiCall("/api/v1/reja", "POST", payload);
            await fetchRejas();
            closeModal();
        } catch (error) {
            console.error("Error creating reja", error);
            alert("Xatolik yuz berdi. Iltimos qayta urinib ko'ring.");
        }
    };

    const uploadExampleFile = async () => {
        if (!formData.exampleFile) return null;
        const uploadPayload = new FormData();
        uploadPayload.append("photo", formData.exampleFile);
        uploadPayload.append("prefix", "reja");

        const result = await ApiCall("/api/v1/file/upload", "POST", uploadPayload);
        if (result.error) {
            throw new Error("Faylni yuklashda xatolik yuz berdi");
        }
        return result.data;
    };

    const updateReja = async (id, payload) => {
        try {
            await ApiCall(`/api/v1/reja/${id}`, "PUT", payload);
            await fetchRejas();
            closeModal();
        } catch (error) {
            console.error("Error updating reja", error);
            alert("Xatolik yuz berdi. Iltimos qayta urinib ko'ring.");
        }
    };

    const deleteReja = async (id) => {
        if (!window.confirm("Ushbu rejani o'chirishni xohlaysizmi?")) return;
        try {
            await ApiCall(`/api/v1/reja/${id}`, "DELETE");
            await fetchRejas();
        } catch (error) {
            console.error("Error deleting reja", error);
            alert("Xatolik yuz berdi. Iltimos qayta urinib ko'ring.");
        }
    };

    // ---------- Form handlers ----------
    const handleSubmit = async () => {
        setLoading(true);

        try {
            let exampleId = formData.exampleId || undefined;
            if (formData.exampleFile) {
                exampleId = await uploadExampleFile();
            }

            const payload = {
                name: formData.name,
                description: formData.description,
                monthId: monthId,
                checkerIds: formData.checkerIds.map(String),
                status: parseInt(formData.status),
                exampleId: exampleId || undefined,
            };

            if (isEditing && formData.id) {
                await updateReja(formData.id, payload);
            } else {
                await createReja(payload);
            }
        } catch (error) {
            console.error("Error saving reja", error);
            alert("Fayl yoki reja qo'shishda xatolik yuz berdi. Iltimos qayta urinib ko'ring.");
        } finally {
            setLoading(false);
        }
    };

    const openEditModal = async (reja) => {
        let rejaData = reja;

        if (!Array.isArray(reja.checkers) || reja.checkers.length === 0) {
            try {
                const detail = await ApiCall(`/api/v1/reja/${reja.id}`, "GET");
                rejaData = { ...reja, ...detail.data };
            } catch (error) {
                console.error(`Error fetching reja detail ${reja.id}`, error);
            }
        }

        setFormData({
            id: rejaData.id,
            name: rejaData.name || "",
            description: rejaData.description || "",
            checkerIds: rejaData.checkers?.map((u) => String(u.id)) || [],
            status: rejaData.status ?? 1,
            exampleId: rejaData.example?.id || "",
            exampleName: rejaData.example?.name || "",
            exampleFile: null,
        });
        setIsEditing(true);
        setShowModal(true);
    };

    const openCreateModal = () => {
        setFormData(EMPTY_FORM);
        setIsEditing(false);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setFormData(EMPTY_FORM);
        setIsEditing(false);
    };

    if (pageLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <div className="text-gray-600">Ma'lumotlar yuklanmoqda...</div>
                </div>
            </div>
        );
    }

    if (error || !month) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="text-red-600 mb-4 text-lg font-semibold">{error || "Oy topilmadi"}</div>
                    <button
                        onClick={() => navigate("/superadmin/month")}
                        className="text-blue-600 hover:text-blue-800 transition"
                    >
                        ← Oylar ro'yhatiga qaytish
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl overflow-hidden rounded-2xl bg-white shadow-lg">
                {/* Header */}
                <div className="border-b border-gray-200 bg-gradient-to-r from-blue-50 to-cyan-50 p-6">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1">
                            <button
                                onClick={() => navigate("/superadmin/month")}
                                className="text-gray-600 hover:text-gray-900 transition mt-1 flex-shrink-0"
                                aria-label="Orqaga"
                            >
                                <ArrowLeft size={24} />
                            </button>
                            <div className="flex-1">
                                <h1 className="text-2xl font-bold text-gray-800">
                                    {month.name} — Rejalar
                                </h1>
                                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-500">Daraja: </span>
                                        <span className="font-semibold text-gray-800">{month.level?.name || "—"}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Holati: </span>
                                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800">
                                            {getStatusLabel(month.status)}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Boshlash sanasi: </span>
                                        <span className="font-semibold text-gray-800">
                                            {month.startedDate ? new Date(month.startedDate).toLocaleDateString("uz-UZ") : "—"}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Tugash sanasi: </span>
                                        <span className="font-semibold text-gray-800">
                                            {month.endedDate ? new Date(month.endedDate).toLocaleDateString("uz-UZ") : "—"}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Jami rejalar: </span>
                                        <span className="font-semibold text-gray-800">{rejas.length}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex-shrink-0">
                            <button
                                onClick={openCreateModal}
                                className="inline-flex items-center rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 transition"
                            >
                                <Plus size={18} className="mr-2" />
                                Yangi reja
                            </button>
                        </div>
                    </div>
                </div>

                {/* Reja list */}
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                    T/R
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                    Nomi
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                    Tavsif
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                    Holati
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                    Tekshiruvchilar
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                    Misol fayl
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                                    Amallar
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {rejas.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan="7"
                                        className="px-4 py-10 text-center text-sm text-gray-500"
                                    >
                                        Rejalar topilmadi. Yangi reja qo'shing.
                                    </td>
                                </tr>
                            ) : (
                                rejas.map((reja, idx) => (
                                    <tr key={reja.id} className="transition hover:bg-gray-50">
                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                                            {idx + 1}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                                            {reja.name}
                                        </td>
                                        <td className="max-w-xs truncate px-4 py-3 text-sm text-gray-600">
                                            {reja.description || "—"}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm">
                                            <StatusBadge status={reja.status} />
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            {reja.checkers?.length ? (
                                                <div className="space-y-1.5">
                                                    {reja.checkers.map((u, i) => (
                                                        <div key={u.id || i} className="flex items-center gap-2">
                                                            <span className="inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-semibold text-white">
                                                                {i + 1}
                                                            </span>
                                                            <span className="text-gray-700">
                                                                {u.name
                                                                    ? u.name
                                                                    : u.firstName || u.lastName
                                                                    ? `${u.firstName || ""} ${u.lastName || ""}`.trim()
                                                                    : u.phone || "—"}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                "—"
                                            )}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm">
                                            {reja.example?.id ? (
                                                <a
                                                    href={`${baseUrl}/api/v1/file/getFile/${reja.example.id}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100"
                                                >
                                                    <Download size={14} />
                                                    Yuklab olish
                                                </a>
                                            ) : (
                                                <span className="text-gray-400">—</span>
                                            )}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                                            <button
                                                onClick={() => openEditModal(reja)}
                                                className="mr-3 text-indigo-600 hover:text-indigo-900 transition"
                                                aria-label="Tahrirlash"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                onClick={() => deleteReja(reja.id)}
                                                className="text-red-600 hover:text-red-900 transition"
                                                aria-label="O'chirish"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            <RejaModal
                isOpen={showModal}
                isEditing={isEditing}
                formData={formData}
                setFormData={setFormData}
                users={users}
                onSubmit={handleSubmit}
                onClose={closeModal}
                loading={loading}
            />
        </div>
    );
};

const StatusBadge = ({ status }) => {
    const map = {
        1: { label: "Faol", cls: "bg-blue-100 text-blue-800" },
        2: { label: "Kutilmoqda", cls: "bg-yellow-100 text-yellow-800" },
        3: { label: "Yakunlangan", cls: "bg-green-100 text-green-800" },
    };
    const { label, cls } = map[status] ?? {
        label: status ?? "—",
        cls: "bg-gray-100 text-gray-800",
    };
    return (
        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>
            {label}
        </span>
    );
};