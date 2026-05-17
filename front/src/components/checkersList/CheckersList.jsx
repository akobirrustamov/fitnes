// CheckersList.jsx
export const CheckersList = ({ checkers }) => {
    if (!checkers?.length) return "—";

    return (
        <div className="space-y-1.5">
            {checkers.map((u, i) => (
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
    );
};