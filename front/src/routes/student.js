import MainDashboardStudent from "views/student/dashboard";
import StudentProfile from "views/student/profile/index";
import StudentMonths from "views/student/month";
import StudentMonthDetail from "views/student/month/MonthDetail";
import StudentRejaDetail from "views/student/month/RejaDetail";
import StudentPlanDetail from "views/student/month/StudentPlanDetail";
import StudentSubmitted from "views/student/submitted";
import {
  MdHome,
  MdPerson,
  MdOutlineCalendarToday,
  MdAssignment,
} from "react-icons/md";

const routes = [
  {
    name: "Bosh sahifa",
    layout: "/student",
    path: "default",
    icon: <MdHome className="h-6 w-6" />,
    component: <MainDashboardStudent />,
    stranger: false,
    url: "",
  },
  {
    name: "Oylik rejalar",
    layout: "/student",
    path: "month",
    icon: <MdOutlineCalendarToday className="h-6 w-6" />,
    component: <StudentMonths />,
    stranger: false,
  },
  {
    name: "Oy detail",
    layout: "/student",
    path: "month/:monthId",
    icon: <MdOutlineCalendarToday className="h-6 w-6" />,
    component: <StudentMonthDetail />,
    stranger: false,
    hidden: true,
  },
  {
    name: "Reja detail",
    layout: "/student",
    path: "reja/:rejaId",
    icon: <MdAssignment className="h-6 w-6" />,
    component: <StudentRejaDetail />,
    stranger: false,
    hidden: true,
  },
  {
    name: "Student Plan detail",
    layout: "/student",
    path: "student-plan/:planId",
    icon: <MdAssignment className="h-6 w-6" />,
    component: <StudentPlanDetail />,
    stranger: false,
    hidden: true,
  },
  {
    name: "Yuklangan rejalar",
    layout: "/student",
    path: "submitted",
    icon: <MdAssignment className="h-6 w-6" />,
    component: <StudentSubmitted />,
    stranger: false,
  },
  {
    name: "Profile",
    layout: "/student",
    path: "profile",
    icon: <MdPerson className="h-6 w-6" />,
    component: <StudentProfile />,
    stranger: false,
  },
];
export default routes;
