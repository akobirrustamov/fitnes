import React, { useEffect, useState } from "react";
import axios from "axios";
import { baseUrl } from "../../../config";
import { MdFitnessCenter, MdCalendarToday, MdAccountBalanceWallet, MdLogin } from "react-icons/md";
import { User } from "lucide-react";

function clientApi(url, method = "GET", data = null) {
  const token = localStorage.getItem("client_token");
  return axios({
    url: baseUrl + url,
    method,
    data,
    headers: { Authorization: token ? `Bearer ${token}` : undefined },
  });
}

function StatusBadge({ active }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${
        active
          ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400"
          : "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400"
      }`}
    >
      {active ? "Faol" : "Nofaol"}
    </span>
  );
}

export default function ClientHome() {
  const [profile, setProfile] = useState(null);
  const [trainer, setTrainer] = useState(null);
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [meRes, trainerRes, visitsRes] = await Promise.all([
        clientApi("/api/v1/client/me"),
        clientApi("/api/v1/client/trainer"),
        clientApi("/api/v1/client/visits?page=1&limit=5"),
      ]);
      setProfile(meRes.data?.data || null);
      setTrainer(trainerRes.data?.data || null);
      setVisits(visitsRes.data?.data || []);
    } catch (err) {
      if (err.response?.status === 401) {
        window.location.href = "/client/login";
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  const isExpired =
    profile?.subscriptionEnd &&
    new Date(profile.subscriptionEnd) < new Date();

  return (
    <div className="space-y-6 pb-8">
      {/* Profile card */}
      <div className="flex flex-col gap-4 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white shadow-xl sm:flex-row sm:items-center">
        <div className="flex-shrink-0">
          {profile?.photoUrl ? (
            <img
              src={profile.photoUrl}
              alt={profile.fullName}
              className="h-20 w-20 rounded-2xl object-cover ring-4 ring-white/40"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20">
              <User className="h-10 w-10 text-white" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold">{profile?.fullName}</h2>
          <p className="mt-0.5 text-blue-100">{profile?.phoneNumber}</p>
          <div className="mt-2">
            <StatusBadge active={profile?.active} />
          </div>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Subscription */}
        <div className="rounded-2xl bg-white p-5 shadow dark:bg-navy-800">
          <div className="mb-3 flex items-center gap-2 text-blue-500">
            <MdCalendarToday className="h-5 w-5" />
            <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">
              Obuna tugashi
            </p>
          </div>
          {profile?.subscriptionEnd ? (
            <>
              <p
                className={`text-lg font-bold ${
                  isExpired
                    ? "text-red-600 dark:text-red-400"
                    : "text-gray-800 dark:text-white"
                }`}
              >
                {new Date(profile.subscriptionEnd).toLocaleDateString("uz-UZ")}
              </p>
              {isExpired && (
                <p className="mt-1 text-xs text-red-500">Muddati o'tgan</p>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-400">Belgilanmagan</p>
          )}
        </div>

        {/* Access count */}
        <div className="rounded-2xl bg-white p-5 shadow dark:bg-navy-800">
          <div className="mb-3 flex items-center gap-2 text-indigo-500">
            <MdLogin className="h-5 w-5" />
            <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">
              Qolgan kirish
            </p>
          </div>
          <p className="text-lg font-bold text-gray-800 dark:text-white">
            {profile?.accessCount ?? "—"}
          </p>
        </div>

        {/* Debt */}
        <div className="rounded-2xl bg-white p-5 shadow dark:bg-navy-800">
          <div className="mb-3 flex items-center gap-2 text-red-400">
            <MdAccountBalanceWallet className="h-5 w-5" />
            <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">
              Qarz
            </p>
          </div>
          <p
            className={`text-lg font-bold ${
              profile?.debt > 0
                ? "text-red-600 dark:text-red-400"
                : "text-gray-800 dark:text-white"
            }`}
          >
            {profile?.debt
              ? Number(profile.debt).toLocaleString() + " so'm"
              : "Yo'q"}
          </p>
        </div>
      </div>

      {/* Trainer */}
      {trainer && (
        <div className="rounded-2xl bg-white p-5 shadow dark:bg-navy-800">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-white">
            <MdFitnessCenter className="h-5 w-5 text-brand-500" />
            Mening murabbiyim
          </h3>
          <div className="flex items-center gap-4">
            {trainer.photoUrl ? (
              <img
                src={trainer.photoUrl}
                alt={trainer.fullname}
                className="h-14 w-14 rounded-xl object-cover"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gray-100 dark:bg-navy-700">
                <User className="h-7 w-7 text-gray-400" />
              </div>
            )}
            <div>
              <p className="font-semibold text-gray-800 dark:text-white">
                {trainer.fullname}
              </p>
              {trainer.specialization && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {trainer.specialization}
                </p>
              )}
              {trainer.phoneNumber && (
                <a
                  href={`tel:${trainer.phoneNumber}`}
                  className="mt-0.5 block text-xs text-blue-500 hover:underline"
                >
                  {trainer.phoneNumber}
                </a>
              )}
            </div>
          </div>
          {trainer.bio && (
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              {trainer.bio}
            </p>
          )}
        </div>
      )}

      {/* Recent visits */}
      {visits.length > 0 && (
        <div className="rounded-2xl bg-white p-5 shadow dark:bg-navy-800">
          <h3 className="mb-4 text-sm font-semibold text-gray-700 dark:text-white">
            Oxirgi tashrif
          </h3>
          <div className="space-y-2">
            {visits.map((v) => (
              <div
                key={v.id}
                className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3 dark:bg-navy-700"
              >
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    {v.terminalName || "Terminal"}
                  </p>
                  <p className="text-xs text-gray-400">
                    {v.direction === "IN" ? "Kirish" : "Chiqish"}
                  </p>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {v.datetime
                    ? new Date(v.datetime).toLocaleString("uz-UZ")
                    : "—"}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
