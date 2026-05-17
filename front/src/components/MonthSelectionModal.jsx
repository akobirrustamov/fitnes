import { Modal } from "react-responsive-modal";
import "react-responsive-modal/styles.css";
import { X, Calendar, Edit } from "lucide-react";

export const MonthSelectionModal = ({ isOpen, onClose, months, onSelectMonth, studentName, onEditDeadline }) => {
    return (
        <Modal
            open={isOpen}
            onClose={onClose}
            center
            showCloseIcon={false}
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
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800">
                            Oyni tanlang
                        </h2>
                        {studentName && (
                            <p className="mt-1 text-sm text-gray-600">
                                {studentName} uchun
                            </p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition"
                    >
                        <X size={20} />
                    </button>
                </div>

                {months.length === 0 ? (
                    <div className="py-12 text-center">
                        <Calendar className="mx-auto h-16 w-16 text-gray-300" />
                        <p className="mt-4 text-gray-600">
                            Hozircha oylar mavjud emas
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                        {months.map((month) => {
                            // Use custom deadline if available, otherwise use month's endedDate
                            const deadlineDate = month.customDeadline
                                ? new Date(month.customDeadline)
                                : month.endedDate
                                    ? new Date(month.endedDate)
                                    : new Date(new Date().getFullYear(), month.id - 1, 25);

                            const formattedDate = deadlineDate.toLocaleDateString('uz-UZ', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                            });

                            const isCustomDeadline = !!month.customDeadline;

                            return (
                                <div
                                    key={month.id}
                                    className="group relative overflow-hidden rounded-xl border-2 border-gray-200 bg-white transition-all hover:border-blue-500 hover:shadow-lg"
                                >
                                    <button
                                        onClick={() => onSelectMonth(month)}
                                        className="w-full p-4 text-left"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 text-white font-bold text-lg">
                                                {month.name.charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-gray-800 truncate group-hover:text-blue-600 transition">
                                                    {month.name}
                                                </h3>
                                                <p className={`text-xs mt-1 ${isCustomDeadline ? 'text-orange-600 font-semibold' : 'text-gray-500'}`}>
                                                    Yopilish: {formattedDate}
                                                    {isCustomDeadline && ' (Uzaytirilgan)'}
                                                </p>
                                            </div>
                                        </div>
                                    </button>

                                    {onEditDeadline && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEditDeadline(month);
                                            }}
                                            className="absolute right-2 top-2 rounded-lg bg-orange-500 p-2 text-white opacity-0 group-hover:opacity-100 transition hover:bg-orange-600"
                                            title="Muddatni uzaytirish"
                                        >
                                            <Edit size={16} />
                                        </button>
                                    )}

                                    <div className="absolute right-2 bottom-2 opacity-0 group-hover:opacity-100 transition">
                                        <div className="rounded-full bg-blue-500 p-1">
                                            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                <div className="mt-6 flex justify-end border-t border-gray-200 pt-4">
                    <button
                        onClick={onClose}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition hover:bg-gray-50"
                    >
                        Bekor qilish
                    </button>
                </div>
            </div>
        </Modal>
    );
};
