import React, { useEffect, useState } from "react";
import ApiCall from "../../config";
import { Map, Phone, User, MapPin, CheckCircle, XCircle, Building2 } from "lucide-react";

export default function ProvinceDashboard() {
  const userId = localStorage.getItem("user_id");
  const [profile, setProfile] = useState(null);
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    Promise.all([
      ApiCall(`/api/v1/admin/provinces/getById/${userId}`, "GET"),
      ApiCall(`/api/v1/admin/regions/getAll`, "GET", null, { provinceId: userId, page: 1, pageSize: 100 }),
    ]).then(([profileRes, regionsRes]) => {
      if (!profileRes?.error) setProfile(profileRes.data);
      if (!regionsRes?.error) setRegions(regionsRes.data?.data || []);
      setLoading(false);
    });
  }, [userId]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-400">
        Yuklanmoqda...
      </div>
    );
  }

  return (
    <div className="space-y-6 p-2">
      {/* Profile card */}
      {profile && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-5">
            {profile.photoUrl ? (
              <img
                src={profile.photoUrl}
                alt={profile.name}
                className="h-16 w-16 rounded-xl object-cover"
                onError={(e) => { e.target.style.display = "none"; }}
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gray-100">
                <User size={28} className="text-gray-400" />
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold text-gray-900">{profile.name}</h1>
                {profile.active ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                    <CheckCircle size={11} /> Faol
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600">
                    <XCircle size={11} /> Nofaol
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-sm text-gray-500">Login: {profile.login}</p>
              <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600">
                {profile.phoneNumber && (
                  <span className="flex items-center gap-1">
                    <Phone size={13} /> {profile.phoneNumber}
                  </span>
                )}
                {profile.location && (
                  <span className="flex items-center gap-1">
                    <MapPin size={13} /> {profile.location}
                  </span>
                )}
                {profile.directorName && (
                  <span className="flex items-center gap-1">
                    <User size={13} /> {profile.directorName}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
              <Map size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{regions.length}</p>
              <p className="text-sm text-gray-500">Jami tumanlar</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50">
              <Building2 size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {regions.filter((r) => r.active).length}
              </p>
              <p className="text-sm text-gray-500">Faol tumanlar</p>
            </div>
          </div>
        </div>
      </div>

      {/* Regions list */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="font-semibold text-gray-900">
            Viloyat tumanlari
            <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-sm font-normal text-gray-500">
              {regions.length}
            </span>
          </h2>
        </div>
        {regions.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">
            Tumanlar topilmadi
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {regions.map((region) => (
              <div key={region.id} className="flex items-center gap-4 px-6 py-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gray-100">
                  <Map size={18} className="text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium text-gray-900">{region.name}</p>
                  {region.directorName && (
                    <p className="truncate text-sm text-gray-500">{region.directorName}</p>
                  )}
                </div>
                <div className="flex-shrink-0 text-right">
                  {region.phoneNumber && (
                    <p className="text-sm text-gray-500">{region.phoneNumber}</p>
                  )}
                  <span
                    className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      region.active
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    {region.active ? "Faol" : "Nofaol"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
