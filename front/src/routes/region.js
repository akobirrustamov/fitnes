import RegionDefault from "views/region/default";
import { MdHome } from "react-icons/md";

const routes = [
  {
    name: "Bosh sahifa",
    layout: "/region",
    path: "default",
    icon: <MdHome className="h-6 w-6" />,
    component: <RegionDefault />,
  },
];

export default routes;
