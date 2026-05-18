import MainDashboardStudent from "views/student/home";
import StudentProfile from "views/student/profile/index";
import {
  MdHome,
  MdPerson,
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
    name: "Profile",
    layout: "/student",
    path: "profile",
    icon: <MdPerson className="h-6 w-6" />,
    component: <StudentProfile />,
    stranger: false,
  },
];
export default routes;
