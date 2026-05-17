import MainDashboardSuper from "views/superadmin/default";
import DashboardSuper from "views/superadmin/dashboard";
import SuperAdminProfile from "views/superadmin/profile";
import Provinces from "views/superadmin/provinces";
import Regions from "views/superadmin/regions";
import Monitors from "views/superadmin/monitors";
import Categories from "views/superadmin/categories";
import Organizations from "views/superadmin/organizations";

import {
  MdHome,
  MdPerson,
  MdBusiness,
  MdLocationOn,
  MdMap,
  MdMonitor,
  MdCategory,
  MdSettings,
  MdAttachMoney,
  MdNewspaper,
  MdFeedback,
  MdMessage,
} from "react-icons/md";

const routes = [
  {
    name: "Bosh sahifa",
    layout: "/superadmin",
    path: "default",
    icon: <MdHome className="h-6 w-6" />,
    component: <DashboardSuper />,
  },
  {
    name: "Viloyatlar",
    layout: "/superadmin",
    path: "provinces",
    icon: <MdMap className="h-6 w-6" />,
    component: <Provinces />,
  },
  {
    name: "Tumanlar",
    layout: "/superadmin",
    path: "regions",
    icon: <MdLocationOn className="h-6 w-6" />,
    component: <Regions />,
  },
  {
    name: "Monitorlar",
    layout: "/superadmin",
    path: "monitors",
    icon: <MdMonitor className="h-6 w-6" />,
    component: <Monitors />,
  },
  {
    name: "Kategoriyalar",
    layout: "/superadmin",
    path: "categories",
    icon: <MdCategory className="h-6 w-6" />,
    component: <Categories />,
  },
  {
    name: "Zallar",
    layout: "/superadmin",
    path: "organizations",
    icon: <MdBusiness className="h-6 w-6" />,
    component: <Organizations />,
  },
  {
    name: "Sozlamalar",
    layout: "/superadmin",
    path: "settings",
    icon: <MdSettings className="h-6 w-6" />,
    component: <MainDashboardSuper />, // TODO: создать компонент
  },
  {
    name: "Tariflar",
    layout: "/superadmin",
    path: "tariffs",
    icon: <MdAttachMoney className="h-6 w-6" />,
    component: <MainDashboardSuper />, // TODO: создать компонент
  },
  {
    name: "Yangiliklar",
    layout: "/superadmin",
    path: "news",
    icon: <MdNewspaper className="h-6 w-6" />,
    component: <MainDashboardSuper />, // TODO: создать компонент
  },
  {
    name: "Murojaatlar",
    layout: "/superadmin",
    path: "feedbacks",
    icon: <MdFeedback className="h-6 w-6" />,
    component: <MainDashboardSuper />, // TODO: создать компонент
  },
  {
    name: "Xabarlar",
    layout: "/superadmin",
    path: "messages",
    icon: <MdMessage className="h-6 w-6" />,
    component: <MainDashboardSuper />, // TODO: создать компонент
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
