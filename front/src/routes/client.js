import ClientHome from "views/client/home";
import ClientVisits from "views/client/visits";
import ClientProfile from "views/client/profile";

import { MdHome, MdHistory, MdPerson } from "react-icons/md";

const routes = [
  {
    name: "Bosh sahifa",
    layout: "/client",
    path: "home",
    icon: <MdHome className="h-6 w-6" />,
    component: <ClientHome />,
  },
  {
    name: "Tashrif tarixi",
    layout: "/client",
    path: "visits",
    icon: <MdHistory className="h-6 w-6" />,
    component: <ClientVisits />,
  },
  {
    name: "Profil",
    layout: "/client",
    path: "profile",
    icon: <MdPerson className="h-6 w-6" />,
    component: <ClientProfile />,
  },
];

export default routes;
