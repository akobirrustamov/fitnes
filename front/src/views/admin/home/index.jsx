import React, { useEffect, useState } from "react";
import ApiCall from "config";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, CartesianGrid,
} from "recharts";

const StatCard = ({ label, value, sub, color }) => (
  <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
    <p className="text-xs font-medium uppercase tracking-wider text-gray-500">{label}</p>
    <p className={`mt-2 text-2xl font-bold ${color || "text-gray-900"}`}>{value}</p>
    {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
  </div>
);

const fmt = (n) => Number(n || 0).toLocaleString();
const fmtMoney = (n) => `${Number(n || 0).toLocaleString()} so'm`;

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [incomeChart, setIncomeChart] = useState([]);
  const [entriesChart, setEntriesChart] = useState([]);
  const [debtors, setDebtors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [s, inc, ent, deb] = await Promise.all([
      ApiCall("/api/v1/organizations/dashboard/getStats", "GET"),
      ApiCall("/api/v1/organizations/dashboard/getMonthlyIncomeChart", "GET"),
      ApiCall("/api/v1/organizations/dashboard/getDailyEntriesChart", "GET"),
      ApiCall("/api/v1/organizations/dashboard/getTopDebtors", "GET", null, { limit: 8 }),
    ]);
    if (!s?.error) setStats(s.data);
    if (!inc?.error) setIncomeChart(inc.data?.data || []);
    if (!ent?.error) setEntriesChart(ent.data?.data || []);
    if (!deb?.error) setDebtors(deb.data?.data || []);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4 p-4">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-gray-100" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="h-64 rounded-2xl bg-gray-100" />
          <div className="h-64 rounded-2xl bg-gray-100" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* Stat cards — row 1 */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Jami mijozlar" value={fmt(stats?.totalClients)} />
        <StatCard label="Faol mijozlar" value={fmt(stats?.activeClients)} color="text-green-600" />
        <StatCard label="Muddati o'tgan" value={fmt(stats?.expiredClients)} color="text-pink-500" />
        <StatCard label="Xodimlar" value={fmt(stats?.totalStaff)} />
      </div>

      {/* Stat cards — row 2 */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          label="Bugungi daromad"
          value={fmtMoney(stats?.dailyIncome)}
          color="text-blue-600"
        />
        <StatCard
          label="Oylik daromad"
          value={fmtMoney(stats?.monthlyIncome)}
          color="text-indigo-600"
        />
        <StatCard
          label="Umumiy qarz"
          value={fmtMoney(stats?.totalDebt)}
          color="text-pink-500"
        />
        <StatCard
          label="Bugungi kirish"
          value={fmt(stats?.todayEntries)}
          sub={`Oyda: ${fmt(stats?.monthlyEntries)}`}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Monthly income */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-gray-800">
            Oylik daromad (so'm)
          </h3>
          {incomeChart.length === 0 ? (
            <p className="py-12 text-center text-sm text-gray-400">Ma'lumot yo'q</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={incomeChart} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => v?.slice(5)}
                />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(v) => [`${Number(v).toLocaleString()} so'm`, "Daromad"]}
                  labelFormatter={(l) => `Oy: ${l}`}
                />
                <Bar dataKey="income" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Daily entries */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-gray-800">
            Kunlik kirish (so'nggi 30 kun)
          </h3>
          {entriesChart.length === 0 ? (
            <p className="py-12 text-center text-sm text-gray-400">Ma'lumot yo'q</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={entriesChart} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => v?.slice(5)}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  formatter={(v) => [v, "Kirish"]}
                  labelFormatter={(l) => `Kun: ${l}`}
                />
                <Area
                  type="monotone"
                  dataKey="entries"
                  stroke="#10b981"
                  fill="#d1fae5"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top debtors */}
      {debtors.length > 0 && (
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-4">
            <h3 className="text-sm font-semibold text-gray-800">Top qarzdorlar</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">#</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Ism</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Telefon</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">Qarz</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {debtors.map((d, i) => (
                  <tr key={d.personId} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-gray-400">{i + 1}</td>
                    <td className="px-6 py-3 font-medium text-gray-900">{d.fullname}</td>
                    <td className="px-6 py-3 text-gray-500">{d.phoneNumber || "—"}</td>
                    <td className="px-6 py-3 text-right font-semibold text-pink-500">
                      {fmtMoney(d.totalDebt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
