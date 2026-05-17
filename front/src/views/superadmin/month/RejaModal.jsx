import { Modal } from "react-responsive-modal";
import "react-responsive-modal/styles.css";
import { X } from "lucide-react";
import { useRef } from "react";

const STATUS_OPTIONS = [
    { value: 1, label: "Faol" },
    { value: 2, label: "Kutilmoqda" },
    { value: 3, label: "Yakunlangan" },
];

// Хелпер — всегда возвращает number

const getUserLabel = (u) =>
    u.name ||
    `${u.firstName || ""} ${u.lastName || ""}`.trim() ||
    u.phone ||
    "-";

export const RejaModal = ({
    isOpen,
    isEditing,
    formData,
    setFormData,
    users,
    onSubmit,
    onClose,
    loading,
}) => {
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
        // сброс select через ref
        if (selectRef.current) selectRef.current.value = "";
    };

    const handleRemoveChecker = (userId) => {
        setFormData((prev) => ({
            ...prev,
            checkerIds: prev.checkerIds.filter((id) => id !== String(userId)),
        }));
    };

    // Нормализуем ids к числам один раз
    const checkerIds = formData.checkerIds.map(String);
    const selectedCheckers = checkerIds
        .map((id) => users.find((u) => String(u.id) === id))
        .filter(Boolean);
    const availableUsers = users.filter((u) => !checkerIds.includes(String(u.id)));

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

                    {/* Checkers selection */}
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

                    {/* Selected checkers list */}
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