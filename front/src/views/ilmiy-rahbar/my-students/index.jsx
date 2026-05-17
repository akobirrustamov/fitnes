import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ApiCall, { baseUrl } from "../../../config/index";
import { Search, Users, Phone, BookOpen, GraduationCap, Download } from "lucide-react";

const MyStudents = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  useEffect(() => {
    fetchMyStudents();
  }, []);

  const fetchMyStudents = async () => {
    try {
      setLoading(true);
      const result = await ApiCall("/api/v1/ilmiy-rahbar/my-students", "GET");
      if (result.error) {
        if (result.data === 401) {
          navigate("/admin/login");
        }
        console.error("Xatolik:", result.data);
        return;
      }
      const data = result.data;
      if (Array.isArray(data)) {
        setStudents(data);
      } else if (data && Array.isArray(data.data)) {
        setStudents(data.data);
      } else if (data && Array.isArray(data.content)) {
        setStudents(data.content);
      } else {
        setStudents([]);
      }
    } catch (error) {
      console.error("Shogirdlarni olishda xatolik", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter students
  const filteredStudents = students.filter((student) => {
    const nameMatch =
      student.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentIdNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.phone?.includes(searchTerm);
    const statusMatch =
      filterStatus === "" || student.studentStatus === filterStatus;
    return nameMatch && statusMatch;
  });

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      "T/R",
      "To'liq ism",
      "ID raqami",
      "Telefon",
      "Yo'nalish",
      "Tanlangan mavzu",
      "Daraja",
      "Holati",
      "Jinsi",
      "Tug'ilgan sana",
    ];
    const rows = filteredStudents.map((student, idx) => [
      idx + 1,
      student.fullName || "",
      student.studentIdNumber || "",
      student.phone || "",
      student.direction || "",
      student.chosenTopic || "",
      student.level?.name || "-",
      student.studentStatus === "active" ? "Faol" : "Nofaol",
      student.gender === "male" ? "Erkak" : "Ayol",
      student.birthDate
        ? new Date(student.birthDate).toLocaleDateString("uz-UZ")
        : "",
    ]);

    let csvContent = headers.join(",") + "\n";
    rows.forEach((row) => {
      csvContent += row.map((cell) => `"${cell}"`).join(",") + "\n";
    });

    const element = document.createElement("a");
    element.setAttribute(
      "href",
      "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent)
    );
    element.setAttribute("download", "mening_shogirdlarim.csv");
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const getStatusBadge = (status) => {
    if (status === "active") {
      return (
        <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
          <span className="mr-1.5 h-2 w-2 rounded-full bg-green-500"></span>
          Faol
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-800">
        <span className="mr-1.5 h-2 w-2 rounded-full bg-red-500"></span>
        Nofaol
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
          <p className="text-gray-600">Shogirdlar yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 overflow-hidden rounded-2xl bg-white shadow-lg">
          <div className="flex flex-col items-center justify-between border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-blue-50 p-6 sm:flex-row">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100">
                <Users className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  Mening shogirdlarim
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  Jami:{" "}
                  <span className="font-semibold text-indigo-600">
                    {filteredStudents.length}
                  </span>{" "}
                  nafar shogird
                </p>
              </div>
            </div>
            <div className="mt-4 sm:mt-0">
              <button
                onClick={exportToCSV}
                className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-white shadow-sm transition duration-200 hover:bg-indigo-700"
              >
                <Download size={18} className="mr-2" />
                CSV yuklash
              </button>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="border-b border-gray-200 bg-white p-4 sm:p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Ism, ID yoki telefon bo'yicha qidirish..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Barcha holatlar</option>
                <option value="active">Faol</option>
                <option value="inactive">Nofaol</option>
              </select>
              <div className="flex items-center pt-2 text-sm text-gray-600">
                Filtrlangan natija:{" "}
                <span className="ml-1 font-semibold text-indigo-600">
                  {filteredStudents.length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Students Grid */}
        {filteredStudents.length === 0 ? (
          <div className="rounded-2xl bg-white p-12 text-center shadow-lg">
            <Users className="mx-auto mb-4 h-16 w-16 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-700">
              Shogirdlar topilmadi
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              {searchTerm || filterStatus
                ? "Qidiruv natijasida hech narsa topilmadi. Filtrlarni o'zgartiring."
                : "Sizga hali shogirdlar biriktirilmagan."}
            </p>
          </div>
        ) : (
          <>
            {/* Table for larger screens */}
            <div className="hidden overflow-hidden rounded-2xl bg-white shadow-lg lg:block">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        T/R
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Rasm
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        To'liq ism
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Telefon
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Yo'nalish
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Mavzu
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Daraja
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Holati
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                        Batafsil
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {filteredStudents.map((student, idx) => (
                      <tr
                        key={student.id}
                        className="transition hover:bg-gray-50"
                      >
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {idx + 1}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm">
                          {student.imageFile?.id ? (
                            <img
                              src={
                                baseUrl +
                                "/api/v1/file/getFile/" +
                                student.imageFile.id
                              }
                              alt={student.fullName}
                              className="h-10 w-10 rounded-full object-cover ring-2 ring-indigo-100"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-600">
                              {student.fullName
                                ?.split(" ")
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join("")}
                            </div>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <button
                            onClick={() => navigate(`/ilmiy-rahbar/student/${student.id}`)}
                            className="text-left hover:underline"
                          >
                            <div className="text-sm font-medium text-blue-600 hover:text-blue-800">
                              {student.fullName}
                            </div>
                            <div className="text-xs text-gray-500">
                              {student.shortName}
                            </div>
                          </button>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                          {student.phone || "-"}
                        </td>
                        <td className="max-w-[150px] truncate px-6 py-4 text-sm text-gray-600" title={student.direction}>
                          {student.direction || "-"}
                        </td>
                        <td className="max-w-[180px] truncate px-6 py-4 text-sm text-gray-600" title={student.chosenTopic}>
                          {student.chosenTopic || "-"}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm">
                          <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                            {student.level?.name || "-"}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm">
                          {getStatusBadge(student.studentStatus)}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-center text-sm">
                          <button
                            onClick={() => navigate(`/ilmiy-rahbar/student/${student.id}`)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 transition hover:bg-indigo-100"
                          >

                            Ko'rish
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>

                </table>
              </div>
            </div>

            {/* Cards for mobile screens */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:hidden">
              {filteredStudents.map((student, idx) => (
                <div
                  key={student.id}
                  onClick={() => navigate(`/ilmiy-rahbar/student/${student.id}`)}
                  className="cursor-pointer overflow-hidden rounded-xl bg-white shadow-md transition hover:shadow-lg"
                >
                  <div className="bg-gradient-to-r from-indigo-500 to-blue-500 p-4">
                    <div className="flex items-center gap-3">
                      {student.imageFile?.id ? (
                        <img
                          src={
                            baseUrl +
                            "/api/v1/file/getFile/" +
                            student.imageFile.id
                          }
                          alt={student.fullName}
                          className="h-12 w-12 rounded-full border-2 border-white object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white bg-white/20 text-sm font-bold text-white">
                          {student.fullName
                            ?.split(" ")
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join("")}
                        </div>
                      )}
                      <div className="text-white">
                        <h3 className="font-semibold">{student.fullName}</h3>
                        <p className="text-sm opacity-90">
                          {student.studentIdNumber}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 p-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{student.phone || "-"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <BookOpen className="h-4 w-4 text-gray-400" />
                      <span>{student.direction || "-"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <GraduationCap className="h-4 w-4 text-gray-400" />
                      <span>{student.chosenTopic || "-"}</span>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                        {student.level?.name || "-"}
                      </span>
                      {getStatusBadge(student.studentStatus)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MyStudents;

