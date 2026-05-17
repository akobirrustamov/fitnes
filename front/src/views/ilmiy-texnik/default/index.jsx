import { useNavigate } from "react-router-dom";
import React, { useEffect, useState } from "react";
import ApiCall from "../../../config";
import Card from "components/card"
const Dashboard = () => {
  const navigate = useNavigate();

  const [duty, setDuty] = useState([]);
  const [admin, setAdmin] = useState(null);

  useEffect(() => {
    getAdmin();
  }, []);
  const getAdmin = async () => {
    try {
      const response = await ApiCall("/api/v1/auth/decode", "GET", null);
      console.log(response);

      setAdmin(response.data);
    } catch (error) {
      navigate("/admin/login");
      console.error("Error fetching account data:", error);
    }
  };

  return (
    <div>
      {/* Card widget */}

      <div className="mt-3 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-3 3xl:grid-cols-6"></div>

      {/* Charts */}

      <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="grid grid-cols-1 gap-5 rounded-[20px] md:grid-cols-2">
          <div className="grid grid-cols-1 rounded-[20px]">
            {/*<MiniCalendar/>*/}
          </div>
        </div>
      </div>

      <div className="grid h-full grid-cols-1 gap-5 lg:!grid-cols-12">
        <div className="col-span-12 ">
          <Card extra={"w-full h-full p-3"}>
            {/* Header */}
            <div className="mt-2 mb-8 w-full">
              <h4 className="px-2 text-xl font-bold text-navy-700 dark:text-white">
                Hizmat haqida malumot
              </h4>
              <p className="mt-2 px-2 text-base text-gray-600">
                Siz o'zingizga tayinlangan xizmat turlari bo'yicha kelib tushgan
                arizalarni korish va ularga mos ravishda javob berishingiz
                zarur.
              </p>
            </div>
            <hr />
            {/* Cards */}
            <h4 className="text-md my-4 px-2 font-bold text-navy-700 dark:text-white">
              Tayinlangan xizmatlar
            </h4>
            <div className="grid grid-cols-2 gap-4 px-2">
              {duty?.map((item, index) => (
                <div className="flex flex-col items-start justify-center rounded-2xl bg-white bg-clip-border px-3 py-4 shadow-3xl shadow-shadow-500 dark:!bg-navy-700 dark:shadow-none">
                  <p className="text-base font-medium text-navy-700 dark:text-white">
                    {item.subCategory.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    {" "}
                    Javob berish muddati: {item.subCategory.service_day} kun
                  </p>
                  <p className="text-sm text-gray-600">
                    {" "}
                    Javobgar hodim:{" "}
                    {item.subCategory.dean
                      ? "Mas'ul tomonidan"
                      : "O'zingiz"}{" "}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
