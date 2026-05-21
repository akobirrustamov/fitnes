import React, { useEffect, useState } from "react";
import ApiCall from "../../config";
import { Building2, Phone, User, MapPin, CheckCircle, XCircle } from "lucide-react";

export default function MonitorDashboard() {
  const userId = localStorage.getItem("user_id");
  const [profile, setProfile] = useState(null);
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    Promise.all([
      ApiCall(`/api/v1/admin/monitors/getById/${userId}`, "GET"),
      ApiCall(`/api/v1/admin/monitors/getOrganizations`, "GET", null, { monitorId: userId }),
    ]).then(([profileRes, orgsRes]) => {
      if (!profileRes?.error) setProfile(profileRes.data);
      if (!orgsRes?.error) setOrgs(orgsRes.data?.data || []);
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
                {profile.description && (
                  <span className="flex items-center gap-1">
                    <MapPin size={13} /> {profile.description}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Organizations */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="font-semibold text-gray-900">
            Biriktirilgan zallar
            <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-sm font-normal text-gray-500">
              {orgs.length}
            </span>
          </h2>
        </div>
        {orgs.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">
            Hech qanday zal biriktirilmagan
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {orgs.map((org) => (
              <div key={org.id} className="flex items-center gap-4 px-6 py-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gray-100">
                  <Building2 size={18} className="text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium text-gray-900">{org.name}</p>
                  <p className="truncate text-sm text-gray-500">{org.directorName}</p>
                </div>
                <div className="flex-shrink-0 text-right">
                  {org.phoneNumber && (
                    <p className="text-sm text-gray-500">{org.phoneNumber}</p>
                  )}
                  <span
                    className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      org.active
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    {org.active ? "Faol" : "Nofaol"}
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
