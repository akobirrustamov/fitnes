import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ApiCall, { baseUrl } from "../../../config/index";
import { Trash2, Edit, Plus, ArrowLeft, Download, X } from "lucide-react";
import { Modal } from "react-responsive-modal";
import "react-responsive-modal/styles.css";

const EMPTY_FORM = {
    id: null,
    name: "",
    description: "",
    checkerIds: [],
    status: 1,
    category: 1,
    exampleId: "",
    exampleName: "",
    exampleFile: null,
};

const getStatusLabel = (status) => {
    const map = {
        1: "Faol",
        2: "Kutilmoqda",
        3: "Yakunlangan",
    };
    return map[status] || status || "—";
};

export const StudentMonthPlans = () => {
    const { studentId, monthId } = useParams();
    const navigate = useNavigate();

    const [student, setStudent] = useState(null);
    const [month, setMonth] = useState(null);
    const [customDeadline, setCustomDeadline] = useState(null);
    const [plans, setPlans] = useState([]);
    const [users, setUsers] = useState([]);
    const [pageLoading, setPageLoading] = useState(true);
    const [error, setError] = useState(null);

    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState(EMPTY_FORM);

    useEffect(() => {
        if (studentId && monthId) {
            loadPageData();
        }
    }, [studentId, monthId]);

    const loadPageData = async () => {
        try {
            setPageLoading(true);
            setError(null);

            await fetchStudent();
            await fetchMonth();
            await fetchCustomDeadline();
            await fetchPlans();
            await fetchUsers();
        } catch (err) {
            console.error("Error loading page", err);
            setError("Ma'lumotlarni yuklashda xatolik yuz berdi");
        } finally {
            setPageLoading(false);
        }
    };

    const fetchStudent = async () => {
        try {
            const result = await ApiCall(`/api/v1/student/${studentId}`, "GET");
            setStudent(result.data?.data || result.data);
        } catch (error) {
            console.error("Error fetching student", error);
            throw error;
        }
    };

    const fetchMonth = async () => {
        try {
            const result = await ApiCall(`/api/v1/month/${monthId}`, "GET");
            setMonth(result.data);
        } catch (error) {
            console.error("Error fetching month", error);
            throw error;
        }
    };

    const fetchCustomDeadline = async () => {
        try {
            const result = await ApiCall(
                `/api/v1/student-month-deadline/by-student-month/${studentId}/${monthId}`,
                "GET"
            );
            if (!result.error && result.data) {
                setCustomDeadline(result.data);
            }
        } catch (error) {
            // No custom deadline is OK
            console.log("No custom deadline found");
        }
    };

    const fetchPlans = async () => {
        try {
            const result = await ApiCall(
                `/api/v1/student-plan/by-student-month/${studentId}/${monthId}`,
                "GET"
            );
            const basicPlans = result.data || [];

            const detailedPlans = await Promise.all(
                basicPlans.map(async (plan) => {
                    if (Array.isArray(plan.checkers)) {
                        return plan;
                    }
                    try {
                        const detail = await ApiCall(`/api/v1/student-plan/${plan.id}`, "GET");
                        return { ...plan, ...detail.data };
                    } catch (error) {
                        console.error(`Error fetching plan detail ${plan.id}`, error);
                        return plan;
                    }
                })
            );

            setPlans(detailedPlans);

        } catch (error) {
            console.error("Error fetching plans", error);
            throw error;
        }
    };
    console.log(plans);


    const fetchUsers = async () => {
        try {
            const result = await ApiCall("/api/v1/admin/users", "GET");
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

    // Download file with auth
    const handleDownload = async (fileId, name) => {
        try {
            if (!fileId) return alert("❌ Fayl topilmadi");

            const token = localStorage.getItem("access_token");
            const res = await fetch(`${baseUrl}/api/v1/file/getFile/${fileId}`, {
                headers: { Authorization: token },
            });

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = name || "fayl";
            a.click();
            URL.revokeObjectURL(url);
        } catch {
            alert("Yuklab bo'lmadi");
        }
    };

    const createPlan = async (payload) => {
        try {
            await ApiCall("/api/v1/student-plan", "POST", payload);
            await fetchPlans();
            closeModal();
        } catch (error) {
            console.error("Error creating plan", error);
            alert("Xatolik yuz berdi. Iltimos qayta urinib ko'ring.");
        }
    };

    const uploadExampleFile = async () => {
        if (!formData.exampleFile) return null;
        const uploadPayload = new FormData();
        uploadPayload.append("photo", formData.exampleFile);
        uploadPayload.append("prefix", "student-reja");

        const result = await ApiCall("/api/v1/file/upload", "POST", uploadPayload);
        if (result.error) {
            throw new Error("Faylni yuklashda xatolik yuz berdi");
        }
        return result.data;
    };

    const updatePlan = async (id, payload) => {
        try {
            await ApiCall(`/api/v1/student-plan/${id}`, "PUT", payload);
            await fetchPlans();
            closeModal();
        } catch (error) {
            console.error("Error updating plan", error);
            alert("Xatolik yuz berdi. Iltimos qayta urinib ko'ring.");
        }
    };

    const deletePlan = async (id) => {
        if (!window.confirm("Ushbu rejani o'chirishni xohlaysizmi?")) return;
        try {
            await ApiCall(`/api/v1/student-plan/${id}`, "DELETE");
            await fetchPlans();
        } catch (error) {
            console.error("Error deleting plan", error);
            alert("Xatolik yuz berdi. Iltimos qayta urinib ko'ring.");
        }
    };

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
                studentId: studentId,
                monthId: monthId,
                checkerIds: formData.checkerIds.map(String),
                status: parseInt(formData.status),
                category: parseInt(formData.category),
                exampleId: exampleId || undefined,
            };

            if (isEditing && formData.id) {
                await updatePlan(formData.id, payload);
            } else {
                await createPlan(payload);
            }
        } catch (error) {
            alert("Fayl yoki reja qo'shishda xatolik yuz berdi. Iltimos qayta urinib ko'ring.");
        } finally {
            setLoading(false);
        }
    };

    const openEditModal = async (plan) => {
        let planData = plan;

        if (!Array.isArray(plan.checkers) || plan.checkers.length === 0) {
            try {
                const detail = await ApiCall(`/api/v1/student-plan/${plan.id}`, "GET");
                planData = { ...plan, ...detail.data };
            } catch (error) {
                console.error(`Error fetching plan detail ${plan.id}`, error);
            }
        }

        setFormData({
            id: planData.id,
            name: planData.name || "",
            description: planData.description || "",
            checkerIds: planData.checkers?.map((u) => String(u.id)) || [],
            status: planData.status ?? 1,
            category: planData.category ?? 1,
            exampleId: planData.example?.id || "",
            exampleName: planData.example?.name || "",
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

    const getSortedCheckers = (plan) => {
        if (!plan.checkers?.length || !plan.checkerIds?.length) {
            return plan.checkers || [];
        }

        const checkerMap = new Map(plan.checkers.map(c => [String(c.id), c]));
        const sorted = plan.checkerIds
            .map(id => checkerMap.get(String(id)))
            .filter(Boolean);

        return sorted;
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

    if (error || !student || !month) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="text-red-600 mb-4 text-lg font-semibold">{error || "Ma'lumot topilmadi"}</div>
                    <button
                        onClick={() => navigate("/superadmin/students")}
                        className="text-blue-600 hover:text-blue-800 transition"
                    >
                        ← O'quvchilar ro'yhatiga qaytish
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl overflow-hidden rounded-2xl bg-white shadow-lg">
                <div className="border-b border-gray-200 bg-gradient-to-r from-blue-50 to-cyan-50 p-6">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1">
                            <button
                                onClick={() => navigate("/superadmin/students")}
                                className="text-gray-600 hover:text-gray-900 transition mt-1 flex-shrink-0"
                                aria-label="Orqaga"
                            >
                                <ArrowLeft size={24} />
                            </button>
                            <div className="flex-1">
                                <h1 className="text-2xl font-bold text-gray-800">
                                    {student.fullName} — {month.name}
                                </h1>
                                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-500">Daraja: </span>
                                        <span className="font-semibold text-gray-800">{student.levelName || "—"}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Boshlash sanasi: </span>
                                        <p className="font-semibold text-gray-800">
                                            {month.startedDate ? new Date(month.startedDate).toLocaleDateString("uz-UZ") : "—"}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Tugash sanasi: </span>
                                        <p className={`font-semibold ${customDeadline ? "text-orange-600" : "text-gray-800"}`}>
                                            {customDeadline
                                                ? new Date(customDeadline.endedDate).toLocaleDateString("uz-UZ") + " (Uzaytirilgan)"
                                                : month.endedDate ? new Date(month.endedDate).toLocaleDateString("uz-UZ") : "—"
                                            }
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Jami rejalar: </span>
                                        <span className="font-semibold text-gray-800">{plans.length}</span>
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
                                    Kategoriyasi
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
                            {plans.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan="8"
                                        className="px-4 py-10 text-center text-sm text-gray-500"
                                    >
                                        Rejalar topilmadi. Yangi reja qo'shing.
                                    </td>
                                </tr>
                            ) : (
                                plans.map((plan, idx) => (
                                    <tr key={plan.id} className="transition hover:bg-gray-50">
                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                                            {idx + 1}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                                            {plan.name}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                                            {plan.category}
                                        </td>
                                        <td className="max-w-xs truncate px-4 py-3 text-sm text-gray-600">
                                            {plan.description || "—"}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm">
                                            <StatusBadge status={plan.status} />
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            <CheckersList checkers={getSortedCheckers(plan)} />
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm">
                                            {plan.example?.id ? (
                                                <button
                                                    onClick={() => handleDownload(plan.example.id, plan.example.name || plan.name || "fayl")}
                                                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100"
                                                >
                                                    <Download size={14} />
                                                    Yuklab olish
                                                </button>
                                            ) : (
                                                <span className="text-gray-400">—</span>
                                            )}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                                            <button
                                                onClick={() => openEditModal(plan)}
                                                className="mr-3 text-indigo-600 hover:text-indigo-900 transition"
                                                aria-label="Tahrirlash"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                onClick={() => deletePlan(plan.id)}
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

            <PlanModal
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

const CheckersList = ({ checkers }) => {
    if (!checkers || checkers.length === 0) {
        return <span className="text-gray-400">—</span>;
    }

    return (
        <div className="flex flex-wrap gap-1">
            {checkers.map((checker, idx) => (
                <span
                    key={checker.id || idx}
                    className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700"
                >
                    {checker.name || `${checker.firstName || ""} ${checker.lastName || ""}`.trim()}
                </span>
            ))}
        </div>
    );
};

const PlanModal = ({ isOpen, isEditing, formData, setFormData, users, onSubmit, onClose, loading }) => {
    const selectRef = useRef(null);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0] || null;
        setFormData((prev) => ({
            ...prev,
            exampleFile: file,
            exampleName: file ? file.name : prev.exampleName,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit();
    };

    const handleAddChecker = (e) => {
        const userId = String(e.target.value);
        if (!userId) return;
        setFormData((prev) => {
            if (prev.checkerIds.includes(userId)) return prev;
            return { ...prev, checkerIds: [...prev.checkerIds, userId] };
        });
        if (selectRef.current) selectRef.current.value = "";
    };

    const handleRemoveChecker = (userId) => {
        setFormData((prev) => ({
            ...prev,
            checkerIds: prev.checkerIds.filter((id) => id !== String(userId)),
        }));
    };

    const getUserLabel = (u) =>
        u.name ||
        `${u.firstName || ""} ${u.lastName || ""}`.trim() ||
        u.phone ||
        "-";

    const checkerIds = formData.checkerIds.map(String);
    const selectedCheckers = checkerIds
        .map((id) => users.find((u) => String(u.id) === id))
        .filter(Boolean);
    const availableUsers = users.filter((u) => !checkerIds.includes(String(u.id)));

    const CATEGORY_OPTIONS = [
        { value: 1, label: "O'quv ishlari va malakaviy imtihonlar" },
        { value: 2, label: "Ilmiy tadqiqot ishi" },
        { value: 3, label: "Dissertatsiya mavzusi buyicha ilmiy maqolalar chop etish" },
        { value: 4, label: "Dissertatsiya mavzusi bo'yicha tahliliy umum-lashtiruvchi qisqacha ma'lumot natijalari bo'yicha seminar o'tkazish" },
        { value: 5, label: "Dissertatsiya mavzusi bo'yicha shaxsiy rejaning bajarilishi to'g'risida hisobot" },
    ];

    const STATUS_OPTIONS = [
        { value: 1, label: "Faol" },
        { value: 2, label: "Kutilmoqda" },
        { value: 3, label: "Yakunlangan" },
    ];

    return (
        <Modal
            open={isOpen}
            onClose={onClose}
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
                        {isEditing ? "Rejani tahrirlash" : "Yangi reja qo'shish"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                        aria-label="Yopish"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Nomi *
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            required
                            placeholder="Reja nomi"
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Kategoriya *
                        </label>
                        <select
                            name="category"
                            value={formData.category}
                            onChange={handleInputChange}
                            required
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {CATEGORY_OPTIONS.map((c) => (
                                <option key={c.value} value={c.value}>
                                    {c.value}. {c.label}
                                </option>
                            ))}
                        </select>
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
                            placeholder="Tavsif (ixtiyoriy)"
                            maxLength="500"
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                                {STATUS_OPTIONS.map((s) => (
                                    <option key={s.value} value={s.value}>
                                        {s.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Misol faylni yuklash
                            </label>
                            <input
                                type="file"
                                name="exampleFile"
                                onChange={handleFileChange}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            {formData.exampleName && (
                                <p className="mt-2 text-sm text-gray-500">
                                    Tanlangan fayl: <span className="font-medium">{formData.exampleName}</span>
                                </p>
                            )}
                        </div>
                    </div>

                    {availableUsers.length > 0 && (
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                Tekshiruvchi qo'shish
                            </label>
                            <select
                                onChange={handleAddChecker}
                                ref={selectRef}
                                value=""
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="" disabled>
                                    Tekshiruvchi tanlang...
                                </option>
                                {availableUsers.map((u) => (
                                    <option key={u.id} value={u.id}>
                                        {getUserLabel(u)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {selectedCheckers.length > 0 && (
                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                            <h4 className="mb-3 text-sm font-medium text-gray-700">
                                Tanlangan tekshiruvchilar ({selectedCheckers.length})
                            </h4>
                            <div className="space-y-2">
                                {selectedCheckers.map((checker, idx) => (
                                    <div
                                        key={checker.id}
                                        className="flex items-center justify-between rounded-lg bg-white px-3 py-2 border border-gray-200 hover:border-gray-300 transition"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
                                                {idx + 1}
                                            </span>
                                            <span className="text-sm text-gray-700">
                                                {getUserLabel(checker)}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveChecker(checker.id)}
                                            className="text-red-500 hover:text-red-700 transition p-1 rounded hover:bg-red-50"
                                            aria-label="O'chirish"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end space-x-3 border-t border-gray-200 pt-6">
                        <button
                            type="button"
                            onClick={onClose}
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
    );
};
