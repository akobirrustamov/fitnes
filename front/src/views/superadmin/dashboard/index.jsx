import { useEffect, useState } from "react";
import ApiCall from "../../../config/index";
import { toast } from "react-toastify";
import { MdPeople, MdBusiness, MdLocationOn, MdMonitor, MdCategory } from "react-icons/md";

const DashboardSuper = () => {
  const [stats, setStats] = useState({
    totalOrganizations: 0,
    totalProvinces: 0,
    totalRegions: 0,
    totalMonitors: 0,
    totalCategories: 0,
    activeOrganizations: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [orgs, provinces, regions, monitors, categories] = await Promise.all([
        ApiCall.get("/api/v1/admin/organizations"),
        ApiCall.get("/api/v1/admin/provinces/getAll"),
        ApiCall.get("/api/v1/admin/regions"),
        ApiCall.get("/api/v1/admin/monitors"),
        ApiCall.get("/api/v1/admin/categories"),
      ]);

      const orgData = orgs.data.data || orgs.data || [];
      const provincesData = provinces.data.data || provinces.data || [];
      const regionsData = regions.data.data || regions.data || [];
      const monitorsData = monitors.data.data || monitors.data || [];
      const categoriesData = categories.data.data || categories.data || [];

      setStats({
        totalOrganizations: orgData.length,
        totalProvinces: provincesData.length,
        totalRegions: regionsData.length,
        totalMonitors: monitorsData.length,
        totalCategories: categoriesData.length,
        activeOrganizations: orgData.filter((o) => o.active).length,
      });
    } catch (error) {
      toast.error("Statistika yuklashda xatolik!");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, title, value, subtitle }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-l-4 border-blue-600">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
            {value}
          </p>
          {subtitle && (
            <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
              {subtitle}
            </p>
          )}
        </div>
        <div className="text-blue-600 opacity-20">
          <Icon size={48} />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
          Bosh sahifa
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          FitCRM tizimining statistikasi
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard
          icon={MdBusiness}
          title="Zallar"
          value={stats.totalOrganizations}
          subtitle={`${stats.activeOrganizations} faol`}
        />
        <StatCard
          icon={MdLocationOn}
          title="Viloyatlar"
          value={stats.totalProvinces}
        />
        <StatCard
          icon={MdLocationOn}
          title="Tumanlar"
          value={stats.totalRegions}
        />
        <StatCard
          icon={MdMonitor}
          title="Monitorlar"
          value={stats.totalMonitors}
        />
        <StatCard
          icon={MdCategory}
          title="Kategoriyalar"
          value={stats.totalCategories}
        />
      </div>

      {/* Welcome Card */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg shadow-lg p-8 text-white">
        <h2 className="text-2xl font-bold mb-2">FitCRM Boshqaruv Tizimiga Xush Kelibsiz!</h2>
        <p className="text-blue-100">
          Bu tizim orqali barcha zallar, monitorlar, kategoriyalar va boshqa ma'lumotlarni boshqara
          olasiz.
        </p>
        <div className="mt-4 text-blue-100 text-sm">
          <p>📌 Chap menyu orqali kerakli bo'limni tanlang</p>
          <p>📊 Har bir bo'limda to'liq CRUD operatsiyalarini bajarishingiz mumkin</p>
          <p>🔒 Barcha operatsiyalar xavfsiz va avtomatik saqlanadi</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardSuper;
