import MainDashboardSuper from "views/superadmin/home";
import SuperAdminProfile from "views/superadmin/profile";
import SuperAdminUsers from "views/superadmin/users";
import SuperAdminProvinces from "views/superadmin/provinces";
import SuperAdminRegions from "views/superadmin/regions";
import SuperAdminOrganizations from "views/superadmin/organizations";
import SuperAdminTariffs from "views/superadmin/tariffs";
import SuperAdminSettings from "views/superadmin/settings";
import SuperAdminServers from "views/superadmin/servers";
import SuperAdminNews from "views/superadmin/news";
import SuperAdminFeedback from "views/superadmin/feedback";
import SuperAdminMessages from "views/superadmin/messages";

import {
  MdHome,
  MdPerson,
  MdGroup,
  MdPublic,
  MdMap,
  MdBusiness,
  MdCategory,
  MdSettings,
  MdDns,
  MdNewspaper,
  MdForum,
  MdMessage,
} from "react-icons/md";

const routes = [
  {
    name: "Bosh sahifa",
    layout: "/superadmin",
    path: "default",
    icon: <MdHome className="h-6 w-6" />,
    component: <MainDashboardSuper />,
  },
  {
    name: "Foydalanuvchilar",
    layout: "/superadmin",
    path: "users",
    icon: <MdGroup className="h-6 w-6" />,
    component: <SuperAdminUsers />,
  },
  {
    name: "Viloyatlar",
    layout: "/superadmin",
    path: "provinces",
    icon: <MdPublic className="h-6 w-6" />,
    component: <SuperAdminProvinces />,
  },
  {
    name: "Tumanlar",
    layout: "/superadmin",
    path: "regions",
    icon: <MdMap className="h-6 w-6" />,
    component: <SuperAdminRegions />,
  },
  {
    name: "Zallar",
    layout: "/superadmin",
    path: "organizations",
    icon: <MdBusiness className="h-6 w-6" />,
    component: <SuperAdminOrganizations />,
  },
  {
    name: "Tariflar",
    layout: "/superadmin",
    path: "tariffs",
    icon: <MdCategory className="h-6 w-6" />,
    component: <SuperAdminTariffs />,
  },
  {
    name: "Serverlar",
    layout: "/superadmin",
    path: "servers",
    icon: <MdDns className="h-6 w-6" />,
    component: <SuperAdminServers />,
  },
  {
    name: "Yangiliklar",
    layout: "/superadmin",
    path: "news",
    icon: <MdNewspaper className="h-6 w-6" />,
    component: <SuperAdminNews />,
  },
  {
    name: "Murojaatlar",
    layout: "/superadmin",
    path: "feedback",
    icon: <MdForum className="h-6 w-6" />,
    component: <SuperAdminFeedback />,
  },
  {
    name: "Xabarlar",
    layout: "/superadmin",
    path: "messages",
    icon: <MdMessage className="h-6 w-6" />,
    component: <SuperAdminMessages />,
  },
  {
    name: "Sozlamalar",
    layout: "/superadmin",
    path: "settings",
    icon: <MdSettings className="h-6 w-6" />,
    component: <SuperAdminSettings />,
  },
  {
    name: "Profil",
    layout: "/superadmin",
    path: "profile",
    icon: <MdPerson className="h-6 w-6" />,
    component: <SuperAdminProfile />,
  },
];
export default routes;
