import MainDashboard from "views/ilmiy-rahbar/default";
import Profile from "views/ilmiy-rahbar/profile";
import MyStudents from "views/ilmiy-rahbar/my-students";
import StudentDetail from "views/ilmiy-rahbar/student-detail";
import RejaTekshirish from "views/shared/reja-tekshirish";
import StudentPlanTekshirish from "views/shared/reja-tekshirish/StudentPlanTekshirish";
import { MdArticle, MdBookmark, MdBookOnline, MdGroups, MdHome, MdInbox, MdPerson, MdQuiz, MdAssignmentTurnedIn } from "react-icons/md";

const routes = [
    {
        name: "Bosh sahifa",
        layout: "/ilmiy-rahbar",
        path: "default",
        icon: <MdHome className="h-6 w-6" />,
        component: <MainDashboard />,
    },
    {
        name: "Mening shogirdlarim",
        layout: "/ilmiy-rahbar",
        path: "my-students",
        icon: <MdGroups className="h-6 w-6" />,
        component: <MyStudents />,
    },
    {
        name: "Shogird ma'lumotlari",
        layout: "/ilmiy-rahbar",
        path: "student/:studentId",
        icon: <MdPerson className="h-6 w-6" />,
        component: <StudentDetail />,
        hidden: true,
    },
    // {
    //     name: "Reja tekshirish",
    //     layout: "/ilmiy-rahbar",
    //     path: "reja-tekshirish",
    //     icon: <MdAssignmentTurnedIn className="h-6 w-6" />,
    //     component: <RejaTekshirish />,
    // },
    {
        name: "Shaxsiy rejalar tekshirish",
        layout: "/ilmiy-rahbar",
        path: "student-plan-tekshirish",
        icon: <MdAssignmentTurnedIn className="h-6 w-6" />,
        component: <StudentPlanTekshirish />,
    },
    {
        name: "Profile",
        layout: "/ilmiy-rahbar",
        path: "profile",
        icon: <MdPerson className="h-6 w-6" />,
        component: <Profile />,
    },

];
export default routes;
