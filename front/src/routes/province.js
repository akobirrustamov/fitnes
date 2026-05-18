import ProvinceDefault from "views/province/default";
import { MdHome } from "react-icons/md";

const routes = [
  {
    name: "Bosh sahifa",
    layout: "/province",
    path: "default",
    icon: <MdHome className="h-6 w-6" />,
    component: <ProvinceDefault />,
  },
];

export default routes;
