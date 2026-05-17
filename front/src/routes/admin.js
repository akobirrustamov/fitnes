import MainDashboard from "views/admin/default";
import Profile from "views/admin/profile";
import RejaTekshirish from "views/shared/reja-tekshirish";
import StudentPlanTekshirish from "views/shared/reja-tekshirish/StudentPlanTekshirish";
import { MdArticle, MdBookmark, MdBookOnline, MdGroups, MdHome, MdInbox, MdPerson, MdQuiz, MdAssignmentTurnedIn } from "react-icons/md";

const routes = [
  {
    name: "Bosh sahifa",
    layout: "/admin",
    path: "default",
    icon: <MdHome className="h-6 w-6" />,
    component: <MainDashboard />,
  },
  // {
  //   name: "Reja tekshirish",
  //   layout: "/admin",
  //   path: "reja-tekshirish",
  //   icon: <MdAssignmentTurnedIn className="h-6 w-6" />,
  //   component: <RejaTekshirish />,
  // },
  {
    name: "Shaxsiy rejalar tekshirish",
    layout: "/admin",
    path: "student-plan-tekshirish",
    icon: <MdAssignmentTurnedIn className="h-6 w-6" />,
    component: <StudentPlanTekshirish />,
  },
  {
    name: "Profile",
    layout: "/admin",
    path: "profile",
    icon: <MdPerson className="h-6 w-6" />,
    component: <Profile />,
  },
  
];
export default routes;
