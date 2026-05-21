import React, { useEffect, useState } from "react";
import ApiCall from "config";
import { ChevronLeft, ChevronRight, Sun, Briefcase, CalendarPlus } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const MONTH_NAMES = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"];
const DAY_NAMES  = ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"];

function getFirstDayOfWeek(year, month) {
  const d = new Date(year, month - 1, 1).getDay();
  return d === 0 ? 6 : d - 1;
}

function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

export default function DatesPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [dates, setDates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toggling, setToggling] = useState(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => { fetchDates(); }, [year, month]);

  const fetchDates = async () => {
    setLoading(true);
    const res = await ApiCall("/api/v1/organizations/dates/getAll", "GET", null, { month, year });
    setLoading(false);
    if (!res?.error) setDates(res.data || []);
    else toast.error("Sanalar yuklanmadi");
  };

  const prevMonth = () => { if (month === 1) { setYear((y) => y - 1); setMonth(12); } else setMonth((m) => m - 1); };
  const nextMonth = () => { if (month === 12) { setYear((y) => y + 1); setMonth(1); } else setMonth((m) => m + 1); };

  const generateDates = async () => {
    setGenerating(true);
    const res = await ApiCall(`/api/v1/organizations/dates/generate?month=${month}&year=${year}`, "POST");
    setGenerating(false);
    if (!res?.error) {
      toast.success(`${MONTH_NAMES[month - 1]} oyi uchun kunlar yaratildi`);
      fetchDates();
    } else {
      toast.error(res.data?.message || "Kunlarni yaratishda xatolik");
    }
  };

  const toggleHoliday = async (dateObj) => {
    setToggling(dateObj.id);
    const res = await ApiCall(`/api/v1/organizations/dates/update?id=${dateObj.id}`, "PUT", { isHoliday: !dateObj.isHoliday });
    setToggling(null);
    if (!res?.error) {
      setDates((prev) => prev.map((d) => d.id === dateObj.id ? { ...d, isHoliday: !d.isHoliday } : d));
    } else toast.error(res.data?.message || "Yangilashda xatolik");
  };

  const firstDay = getFirstDayOfWeek(year, month);
  const daysInMonth = getDaysInMonth(year, month);
  const holidayMap = Object.fromEntries(dates.map((d) => [parseInt(d.date.split("-")[2]), d]));

  const totalHolidays = dates.filter((d) => d.isHoliday).length;
  const totalWorkDays = daysInMonth - totalHolidays;

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="mx-auto max-w-2xl space-y-5">
        {/* Header */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-gray-900">Dam olish kunlar</h1>
          <p className="mt-1 text-sm text-gray-500">Kunni bosib ta'til yoki ish kuni deb belgilang</p>
        </div>

        {/* Calendar */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          {/* Nav */}
          <div className="mb-5 flex items-center justify-between">
            <button onClick={prevMonth} className="rounded-xl p-2 transition hover:bg-gray-100">
              <ChevronLeft size={20} />
            </button>
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-900">{MONTH_NAMES[month - 1]} {year}</p>
              <p className="mt-0.5 text-xs text-gray-400">
                <span className="text-green-600 font-medium">{totalWorkDays} ish kuni</span>
                {" · "}
                <span className="text-pink-500 font-medium">{totalHolidays} ta'til</span>
              </p>
            </div>
            <button onClick={nextMonth} className="rounded-xl p-2 transition hover:bg-gray-100">
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Day headers */}
          <div className="mb-2 grid grid-cols-7 gap-1">
            {DAY_NAMES.map((d) => (
              <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>
            ))}
          </div>

          {/* Cells */}
          {loading ? (
            <div className="py-10 text-center text-sm text-gray-400">Yuklanmoqda...</div>
          ) : dates.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10">
              <p className="text-sm text-gray-400">
                {MONTH_NAMES[month - 1]} {year} oyi uchun kunlar hali yaratilmagan
              </p>
              <button
                onClick={generateDates}
                disabled={generating}
                className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-700 disabled:opacity-60"
              >
                <CalendarPlus size={16} />
                {generating ? "Yaratilmoqda..." : "Kunlarni yaratish"}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {cells.map((day, idx) => {
                if (!day) return <div key={idx} />;
                const dateObj = holidayMap[day];
                const isHoliday = dateObj?.isHoliday;
                const isToday = year === now.getFullYear() && month === now.getMonth() + 1 && day === now.getDate();
                const busy = toggling === dateObj?.id;

                return (
                  <button
                    key={idx}
                    onClick={() => dateObj && toggleHoliday(dateObj)}
                    disabled={!dateObj || busy}
                    title={isHoliday ? "Ta'til (bosib ish kuniga o'tkazing)" : "Ish kuni (bosib ta'tilga o'tkazing)"}
                    className={`relative flex flex-col items-center justify-center rounded-xl py-2 text-sm font-medium transition
                      ${isHoliday ? "bg-pink-50 text-pink-600 hover:bg-pink-100" : "bg-gray-50 text-gray-700 hover:bg-green-50 hover:text-green-700"}
                      ${isToday ? "ring-2 ring-blue-500" : ""}
                      ${busy ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                      ${!dateObj ? "opacity-30 cursor-default" : ""}
                    `}
                  >
                    <span className="text-base leading-none">{day}</span>
                    <span className="mt-1">
                      {isHoliday ? <Sun size={10} /> : <Briefcase size={10} />}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 rounded-2xl border border-gray-200 bg-white px-5 py-3 shadow-sm text-sm">
          <span className="flex items-center gap-2 text-pink-500"><Sun size={14} /> Ta'til kuni</span>
          <span className="flex items-center gap-2 text-gray-600"><Briefcase size={14} /> Ish kuni</span>
          <span className="flex items-center gap-2 text-blue-500"><span className="h-3 w-3 rounded-full ring-2 ring-blue-500 ring-offset-1" /> Bugun</span>
        </div>
      </div>
    </div>
  );
}
