import MainDashboard from "views/admin/home";
import Profile from "views/admin/profile";
import ClientsPage from "views/admin/clients";
import PaymentsPage from "views/admin/payments";

import {
  MdHome,
  MdPerson,
  MdPeople,
  MdAttachMoney,
} from "react-icons/md";

const routes = [
  {
    name: "Bosh sahifa",
    layout: "/admin",
    path: "default",
    icon: <MdHome className="h-6 w-6" />,
    component: <MainDashboard />,
  },
  {
    name: "Mijozlar",
    layout: "/admin",
    path: "clients",
    icon: <MdPeople className="h-6 w-6" />,
    component: <ClientsPage />,
  },
  {
    name: "To'lovlar",
    layout: "/admin",
    path: "payments",
    icon: <MdAttachMoney className="h-6 w-6" />,
    component: <PaymentsPage />,
  },
  {
    name: "Profil",
    layout: "/admin",
    path: "profile",
    icon: <MdPerson className="h-6 w-6" />,
    component: <Profile />,
  },
];
export default routes;
