import MainDashboard from "views/ilmiy-texnik/default";
import Profile from "views/ilmiy-texnik/profile";
import RejaTekshirish from "views/shared/reja-tekshirish";
import StudentPlanTekshirish from "views/shared/reja-tekshirish/StudentPlanTekshirish";
import { MdArticle, MdBookmark, MdBookOnline, MdGroups, MdHome, MdInbox, MdPerson, MdQuiz, MdAssignmentTurnedIn } from "react-icons/md";

const routes = [
    {
        name: "Bosh sahifa",
        layout: "/ilmiy-texnik",
        path: "default",
        icon: <MdHome className="h-6 w-6" />,
        component: <MainDashboard />,
    },
    // {
    //     name: "Reja tekshirish",
    //     layout: "/ilmiy-texnik",
    //     path: "reja-tekshirish",
    //     icon: <MdAssignmentTurnedIn className="h-6 w-6" />,
    //     component: <RejaTekshirish />,
    // },
    {
        name: "Shaxsiy rejalar tekshirish",
        layout: "/ilmiy-texnik",
        path: "student-plan-tekshirish",
        icon: <MdAssignmentTurnedIn className="h-6 w-6" />,
        component: <StudentPlanTekshirish />,
    },
    {
        name: "Profile",
        layout: "/ilmiy-texnik",
        path: "profile",
        icon: <MdPerson className="h-6 w-6" />,
        component: <Profile />,
    },

];
export default routes;
