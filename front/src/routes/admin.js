import MainDashboard from "views/admin/home";
import Profile from "views/admin/profile";
import ClientsPage from "views/admin/clients";
import PaymentsPage from "views/admin/payments";
import GraphicsPage from "views/admin/graphics";
import TrainersPage from "views/admin/trainers";
import MarketPage from "views/admin/market";
import TerminalsPage from "views/admin/terminals";
import EventsPage from "views/admin/events";
import TasksPage from "views/admin/tasks";
import OrgNewsPage from "views/admin/news";
import FeedbacksPage from "views/admin/feedbacks";
import DatesPage from "views/admin/dates";
import StaffPage from "views/admin/staff";
import AdminSettingsPage from "views/admin/settings";

import {
  MdHome,
  MdPerson,
  MdPeople,
  MdAttachMoney,
  MdCalendarToday,
  MdFitnessCenter,
  MdStorefront,
  MdComputer,
  MdLogin,
  MdTask,
  MdNewspaper,
  MdFeedback,
  MdEvent,
  MdBadge,
  MdSettings,
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
    name: "Xodimlar",
    layout: "/admin",
    path: "staff",
    icon: <MdBadge className="h-6 w-6" />,
    component: <StaffPage />,
  },
  {
    name: "To'lovlar",
    layout: "/admin",
    path: "payments",
    icon: <MdAttachMoney className="h-6 w-6" />,
    component: <PaymentsPage />,
  },
  {
    name: "Grafiklar",
    layout: "/admin",
    path: "graphics",
    icon: <MdCalendarToday className="h-6 w-6" />,
    component: <GraphicsPage />,
  },
  {
    name: "Murabbiylar",
    layout: "/admin",
    path: "trainers",
    icon: <MdFitnessCenter className="h-6 w-6" />,
    component: <TrainersPage />,
  },
  {
    name: "Market",
    layout: "/admin",
    path: "market",
    icon: <MdStorefront className="h-6 w-6" />,
    component: <MarketPage />,
  },
  {
    name: "Terminallar",
    layout: "/admin",
    path: "terminals",
    icon: <MdComputer className="h-6 w-6" />,
    component: <TerminalsPage />,
  },
  {
    name: "Kirishlar",
    layout: "/admin",
    path: "events",
    icon: <MdLogin className="h-6 w-6" />,
    component: <EventsPage />,
  },
  {
    name: "Tasklar",
    layout: "/admin",
    path: "tasks",
    icon: <MdTask className="h-6 w-6" />,
    component: <TasksPage />,
  },
  {
    name: "Yangiliklar",
    layout: "/admin",
    path: "news",
    icon: <MdNewspaper className="h-6 w-6" />,
    component: <OrgNewsPage />,
  },
  {
    name: "Murojaatlar",
    layout: "/admin",
    path: "feedbacks",
    icon: <MdFeedback className="h-6 w-6" />,
    component: <FeedbacksPage />,
  },
  {
    name: "Dam olish kunlar",
    layout: "/admin",
    path: "dates",
    icon: <MdEvent className="h-6 w-6" />,
    component: <DatesPage />,
  },
  {
    name: "Sozlamalar",
    layout: "/admin",
    path: "settings",
    icon: <MdSettings className="h-6 w-6" />,
    component: <AdminSettingsPage />,
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
