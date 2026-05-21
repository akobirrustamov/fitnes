import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import ApiCall from "config";
import { ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function SalesPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const organizationId = searchParams.get("organizationId");
  const orgName = searchParams.get("orgName") || "Zal";

  const [sales, setSales] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const limit = 20;

  useEffect(() => {
    if (!organizationId) {
      navigate("/superadmin/organizations");
      return;
    }
    fetchSales(1);
  }, [organizationId]);

  const fetchSales = async (p) => {
    setLoading(true);
    const res = await ApiCall("/api/v1/organizations/market/sales", "GET", null, {
      organizationId,
      page: p,
      limit,
    });
    if (!res?.error) {
      setSales(res.data.data || []);
      setTotalCount(res.data.totalCount || 0);
      setTotalPages(res.data.totalPages || 1);
      setPage(p);
    } else {
      toast.error("Sotuvlarni yuklashda xatolik yuz berdi");
    }
    setLoading(false);
  };

  const formatDate = (dt) => {
    if (!dt) return "—";
    return new Date(dt).toLocaleString("uz-UZ", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const formatMoney = (val) =>
    val != null ? `${Number(val).toLocaleString()} so'm` : "—";

  const toggleExpand = (id) =>
    setExpandedId((prev) => (prev === id ? null : id));

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="rounded-lg bg-gray-100 p-2 text-gray-600 hover:bg-gray-200"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{orgName}</h1>
              <p className="mt-0.5 text-sm text-gray-500">
                Sotuvlar tarixi — jami {totalCount} ta sotuv
              </p>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 font-semibold text-gray-900">
            Sotuvlar ro'yxati
          </div>

          {loading ? (
            <div className="space-y-3 p-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded-xl bg-gray-100" />
              ))}
            </div>
          ) : sales.length === 0 ? (
            <div className="py-16 text-center text-gray-500">
              Sotuvlar topilmadi
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {sales.map((sale) => (
                <div key={sale.id}>
                  {/* Sale row */}
                  <div
                    className="flex cursor-pointer items-center gap-4 px-6 py-4 hover:bg-gray-50"
                    onClick={() => toggleExpand(sale.id)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-900">
                          Sotuv #{sale.id}
                        </span>
                        {Number(sale.debt) > 0 && (
                          <span className="rounded-full bg-pink-100 px-2 py-0.5 text-xs font-medium text-pink-600">
                            Qarz: {formatMoney(sale.debt)}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {formatDate(sale.createdTime)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        {formatMoney(sale.totalPrice)}
                      </p>
                      <p className="text-xs text-gray-500">
                        To'langan: {formatMoney(sale.paidAmount)}
                      </p>
                    </div>
                    <div className="text-gray-400">
                      {expandedId === sale.id ? (
                        <ChevronUp size={16} />
                      ) : (
                        <ChevronDown size={16} />
                      )}
                    </div>
                  </div>

                  {/* Expanded items */}
                  {expandedId === sale.id && (
                    <div className="border-t border-gray-100 bg-gray-50 px-6 py-4">
                      <p className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-500">
                        Mahsulotlar
                      </p>
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="text-left text-xs text-gray-500">
                            <th className="pb-2 font-medium">Nomi</th>
                            <th className="pb-2 font-medium">Soni</th>
                            <th className="pb-2 font-medium">Narxi</th>
                            <th className="pb-2 text-right font-medium">Jami</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {(sale.items || []).map((item) => (
                            <tr key={item.id}>
                              <td className="py-2 font-medium text-gray-900">
                                {item.productName || "—"}
                              </td>
                              <td className="py-2 text-gray-600">{item.amount}</td>
                              <td className="py-2 text-gray-600">
                                {formatMoney(item.price)}
                              </td>
                              <td className="py-2 text-right font-medium text-gray-900">
                                {formatMoney(
                                  item.price != null
                                    ? Number(item.price) * item.amount
                                    : null
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => fetchSales(page - 1)}
              disabled={page <= 1 || loading}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40"
            >
              Oldingi
            </button>
            <span className="text-sm text-gray-600">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => fetchSales(page + 1)}
              disabled={page >= totalPages || loading}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40"
            >
              Keyingi
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
