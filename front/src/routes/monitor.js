import MonitorDefault from "views/monitor/default";
import { MdHome } from "react-icons/md";

const routes = [
  {
    name: "Bosh sahifa",
    layout: "/monitor",
    path: "default",
    icon: <MdHome className="h-6 w-6" />,
    component: <MonitorDefault />,
  },
];

export default routes;
