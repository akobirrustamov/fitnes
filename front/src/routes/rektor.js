import MainDashboardSuper from "views/superadmin/default";
import SuperAdminProfile from "views/superadmin/profile";
import SuperAdminUsers from "views/superadmin/users";
import { Student } from "../views/superadmin/student";
import { Month } from "../views/superadmin/month";
import { MonthDetail } from "../views/superadmin/month/MonthDetail"
import StudentMonthDetails from "../views/superadmin/student-month-details";
import { StudentMonthPlans } from "../views/superadmin/student/StudentMonthPlans";
import RejaTekshirish from "views/shared/reja-tekshirish";
import StudentPlanTekshirish from "views/shared/reja-tekshirish/StudentPlanTekshirish";
import Statistics from "views/shared/statistics";

import {
  MdHome,
  MdPerson,
  MdGroup,
  MdOutlineCalendarToday,
  MdSchool,
  MdAssignmentTurnedIn,
  MdBarChart,
} from "react-icons/md";

const routes = [
  {
    name: "Bosh sahifa",
    layout: "/rektor",
    path: "default",
    icon: <MdHome className="h-6 w-6" />,
    component: <MainDashboardSuper />,
  },
  {
    name: "Xodimlar",
    layout: "/rektor",
    path: "users",
    icon: <MdGroup className="h-6 w-6" />,
    component: <SuperAdminUsers />,
  },
  {
    name: "Doktorantlar",
    layout: "/rektor",
    path: "students",
    icon: <MdSchool className="h-6 w-6" />,
    component: <Student />,
  },
  {
    name: "Talaba oylik statistikasi",
    layout: "/rektor",
    path: "student/:studentId/month/:monthId",
    icon: <MdSchool className="h-6 w-6" />,
    component: <StudentMonthDetails />,
    hidden: true,
  },
  {
    name: "Talaba oylik rejalari",
    layout: "/rektor",
    path: "student/plans/:studentId/month/:monthId",
    icon: <MdSchool className="h-6 w-6" />,
    component: <StudentMonthPlans />,
    hidden: true,
  },
  // {
  //   name: "Oy Yaratish",
  //   layout: "/rektor",
  //   path: "month",
  //   icon: <MdOutlineCalendarToday className="h-6 w-6" />,
  //   component: <Month />,
  // },
  {
    name: "Oy detail",
    layout: "/rektor",
    path: "month/:monthId",
    icon: <MdOutlineCalendarToday className="h-6 w-6" />,
    component: <MonthDetail />,
    hidden: true,
  },
  {
    name: "Hisobot ko'rish",
    layout: "/rektor",
    path: "statistics",
    icon: <MdBarChart className="h-6 w-6" />,
    component: <Statistics />,
  },
  // {
  //   name: "Reja tekshirish",
  //   layout: "/rektor",
  //   path: "reja-tekshirish",
  //   icon: <MdAssignmentTurnedIn className="h-6 w-6" />,
  //   component: <RejaTekshirish />,
  // },
  {
    name: "Shaxsiy rejalar tekshirish",
    layout: "/rektor",
    path: "student-plan-tekshirish",
    icon: <MdAssignmentTurnedIn className="h-6 w-6" />,
    component: <StudentPlanTekshirish />,
  },

  {
    name: "Profile",
    layout: "/rektor",
    path: "profile",
    icon: <MdPerson className="h-6 w-6" />,
    component: <SuperAdminProfile />,
  },
];
export default routes;
