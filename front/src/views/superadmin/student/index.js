import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ApiCall, { baseUrl } from "../../../config/index";
import axios from "axios";
import { Modal } from "react-responsive-modal";
import "react-responsive-modal/styles.css";
import { Trash2, Edit, X, Plus, Download } from "lucide-react";
import { MdCalendarToday } from "react-icons/md";
import { MonthSelectionModal } from "../../../components/MonthSelectionModal";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export const Student = () => {
  // State
  const navigate = useNavigate();

  const [diy, setDiy] = useState();
  const [students, setStudents] = useState([]);
  const [levels, setLevels] = useState([]);
  const [ilmiyRahbers, setIlmiyRahbers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLevel, setFilterLevel] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfFileName, setPdfFileName] = useState(null);
  const [uploadingPdf, setUploadingPdf] = useState(false);

  // Statistics modal state
  const [showStatisticsModal, setShowStatisticsModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [statisticsData, setStatisticsData] = useState(null);
  const [loadingStatistics, setLoadingStatistics] = useState(false);

  // Month selection modal state (for plans management)
  const [showMonthModal, setShowMonthModal] = useState(false);
  const [months, setMonths] = useState([
    { id: 1, name: "Yanvar" },
    { id: 2, name: "Fevral" },
    { id: 3, name: "Mart" },
    { id: 4, name: "Aprel" },
    { id: 5, name: "May" },
    { id: 6, name: "Iyun" },
    { id: 7, name: "Iyul" },
    { id: 8, name: "Avgust" },
    { id: 9, name: "Sentyabr" },
    { id: 10, name: "Oktyabr" },
    { id: 11, name: "Noyabr" },
    { id: 12, name: "Dekabr" },
  ]);
  const [monthsWithDeadlines, setMonthsWithDeadlines] = useState([]);

  // Deadline edit modal state
  const [showDeadlineModal, setShowDeadlineModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [deadlineDate, setDeadlineDate] = useState("");
  const [loadingDeadline, setLoadingDeadline] = useState(false);

  // Statistics modal state (for viewing completed/rejected plans)
  const [showStatisticsMonthModal, setShowStatisticsMonthModal] = useState(false);
  const [statisticsMonths, setStatisticsMonths] = useState([]);
  const [formData, setFormData] = useState({
    id: null,
    fullName: "",
    shortName: "",
    firstName: "",
    secondName: "",
    thirdName: "",
    gender: "Male",
    birthDate: "",
    studentIdNumber: "",
    studentStatus: "active",
    phone: "",
    password: "",
    ilmiyRahberId: "",
    levelId: "",
    imageFileId: "",
    direction: "",      // + добавлено
    chosenTopic: "",
  });

  // Fetch data on mount
  useEffect(() => {
    getStudents();
    getLevels();
    getIlmiyRahbers();
  }, []);

  // ---------- API Calls ----------
  const getStudents = async () => {
    try {
      const result = await ApiCall("/api/v1/student", "GET");
      // API returns paginated response, data is nested in result.data.data
      setStudents(result.data?.data || []);
    } catch (error) {
      console.error("O'quvchilarni olishda xatolik", error);
    }
  };

  const getLevels = async () => {
    try {
      const result = await ApiCall("/api/v1/level", "GET");
      setLevels(result.data || []);
    } catch (error) {
      console.error("Darajalarni olishda xatolik", error);
    }
  };

  const getIlmiyRahbers = async () => {
    try {
      const result = await ApiCall("/api/v1/admin/users", "GET");
      // Filter users to only include those with ROLE_ILMIY_RAHBAR role
      const ilmiyRahberUsers = result.data?.filter((user) =>
        user.roles?.some((role) => role.name === "ROLE_ILMIY_RAHBAR")
      ) || [];
      setIlmiyRahbers(ilmiyRahberUsers);
    } catch (error) {
      console.error("Ilmiy rahberlari olishda xatolik", error);
    }
  };

  // ---------- Statistics Functions ----------
  const loadStudentRejaStatistics = async (studentId) => {
    try {
      setLoadingStatistics(true);
      // Use the same data source as the statistics page (RejaHistory records)
      const result = await ApiCall(`/api/v1/reja-history/by-student/${studentId}`, "GET");
      if (!result.error && result.data) {
        const histories = Array.isArray(result.data) ? result.data : [];

        // Group by month, deduplicate by rejaChecking.id for plan-level stats
        const monthMap = {};
        histories.forEach((item) => {
          const month = item.rejaChecking?.reja?.month;
          const monthId = month?.id;
          const rcId = item.rejaChecking?.id;
          if (!monthId || !rcId) return;

          if (!monthMap[monthId]) {
            monthMap[monthId] = {
              monthId,
              monthName: month.name,
              startedDate: month.startedDate,
              endedDate: month.endedDate,
              rejaCheckings: {},
            };
          }
          // Store rejaChecking object keyed by its id (deduplication)
          monthMap[monthId].rejaCheckings[rcId] = item.rejaChecking;
        });

        // Compute per-month stats at RejaChecking (plan) level
        const monthStatistics = Object.values(monthMap)
          .map((month) => {
            const checkings = Object.values(month.rejaCheckings);
            return {
              monthId: month.monthId,
              monthName: month.monthName,
              startedDate: month.startedDate,
              endedDate: month.endedDate,
              totalRejas: checkings.length,
              // in review (status=0): uploaded, awaiting checker decisions
              totalSubmitted: checkings.filter((rc) => rc.status === 0).length,
              // fully accepted by all checkers
              totalAccepted: checkings.filter((rc) => rc.status === 1).length,
              // currently rejected (student must resubmit)
              totalRejected: checkings.filter((rc) => rc.status === 2).length,
            };
          })
          .sort((a, b) => new Date(a.startedDate) - new Date(b.startedDate));

        setStatisticsData({ monthStatistics });
      } else {
        setStatisticsData(null);
      }
    } catch (error) {
      console.error("Statistikani yuklashda xatolik", error);
      setStatisticsData(null);
    } finally {
      setLoadingStatistics(false);
    }
  };

  const openStatisticsModal = async (student) => {
    setSelectedStudent(student);
    setShowStatisticsModal(true);
    await loadStudentRejaStatistics(student.id);
  };

  const closeStatisticsModal = () => {
    setShowStatisticsModal(false);
    setSelectedStudent(null);
    setStatisticsData(null);
  };

  const openMonthModal = async (student) => {
    setSelectedStudent(student);
    setShowMonthModal(true);

    // Load custom deadlines for this student
    try {
      const levelId = student.levelId || student.level?.id;
      if (!levelId) return;

      // Fetch all months for this level
      const result = await ApiCall(`/api/v1/month/by-level/${levelId}`, "GET");
      const levelMonths = result.data || [];

      // Load custom deadlines for each month
      const monthsWithCustomDeadlines = await Promise.all(
        levelMonths.map(async (month) => {
          try {
            const deadlineResult = await ApiCall(
              `/api/v1/student-month-deadline/by-student-month/${student.id}/${month.id}`,
              "GET"
            );

            if (!deadlineResult.error && deadlineResult.data) {
              return {
                ...month,
                customDeadline: deadlineResult.data.endedDate,
              };
            }
          } catch (error) {
            // No custom deadline
          }
          return month;
        })
      );

      setMonthsWithDeadlines(monthsWithCustomDeadlines);
    } catch (error) {
      console.error("Error loading months with deadlines:", error);
    }
  };

  const closeMonthModal = () => {
    setShowMonthModal(false);
    setSelectedStudent(null);
    setMonthsWithDeadlines([]);
  };

  const handleMonthSelect = async (month) => {
    if (selectedStudent && month) {
      try {
        // Get the student's level ID - try multiple possible locations
        const levelId = selectedStudent.levelId || selectedStudent.level?.id;

        if (!levelId) {
          console.error("Student data:", selectedStudent);
          toast.error("O'quvchining daraja ma'lumoti topilmadi");
          return;
        }

        // Fetch all months for this level from the database (non-paginated endpoint)
        const result = await ApiCall(`/api/v1/month/by-level/${levelId}`, "GET");
        const levelMonths = result.data || [];

        // Find the month that matches the selected month name (case-insensitive)
        const actualMonth = levelMonths.find(m =>
          m.name.toLowerCase() === month.name.toLowerCase()
        );

        if (!actualMonth) {
          console.error("Available months:", levelMonths);
          console.error("Looking for:", month.name);
          toast.error(`${month.name} oyi uchun ma'lumot topilmadi`);
          return;
        }

        // Navigate to student plans management page
        navigate(`/superadmin/student/plans/${selectedStudent.id}/month/${actualMonth.id}`);
      } catch (error) {
        console.error("Oy ma'lumotlarini olishda xatolik", error);
        toast.error("Oy ma'lumotlarini olishda xatolik yuz berdi");
      }
    }
    closeMonthModal();
  };

  const handleEditDeadline = async (month) => {
    if (!selectedStudent || !month) return;

    try {
      // Get the student's level ID
      const levelId = selectedStudent.levelId || selectedStudent.level?.id;

      if (!levelId) {
        toast.error("O'quvchining daraja ma'lumoti topilmadi");
        return;
      }

      // Fetch all months for this level from the database
      const result = await ApiCall(`/api/v1/month/by-level/${levelId}`, "GET");
      const levelMonths = result.data || [];

      // Find the actual month
      const actualMonth = levelMonths.find(m =>
        m.name.toLowerCase() === month.name.toLowerCase()
      );

      if (!actualMonth) {
        toast.error(`${month.name} oyi uchun ma'lumot topilmadi`);
        return;
      }

      setSelectedMonth(actualMonth);

      // Check if there's already a custom deadline
      const deadlineResult = await ApiCall(
        `/api/v1/student-month-deadline/by-student-month/${selectedStudent.id}/${actualMonth.id}`,
        "GET"
      );

      if (!deadlineResult.error && deadlineResult.data) {
        // Use existing custom deadline
        setDeadlineDate(new Date(deadlineResult.data.endedDate).toISOString().slice(0, 16));
      } else {
        // Use month's default deadline
        setDeadlineDate(new Date(actualMonth.endedDate).toISOString().slice(0, 16));
      }

      setShowDeadlineModal(true);
    } catch (error) {
      console.error("Error loading deadline:", error);
      toast.error("Muddatni yuklashda xatolik yuz berdi");
    }
  };

  const handleSaveDeadline = async () => {
    if (!selectedStudent || !selectedMonth || !deadlineDate) {
      toast.warning("Iltimos, barcha maydonlarni to'ldiring");
      return;
    }

    try {
      setLoadingDeadline(true);

      const payload = {
        studentId: selectedStudent.id,
        monthId: selectedMonth.id,
        endedDate: new Date(deadlineDate).toISOString(),
      };

      const result = await ApiCall("/api/v1/student-month-deadline", "POST", payload);

      if (result.error) {
        toast.error("Muddatni saqlashda xatolik yuz berdi");
        return;
      }

      toast.success("Muddat muvaffaqiyatli uzaytirildi!");
      closeDeadlineModal();
    } catch (error) {
      console.error("Error saving deadline:", error);
      toast.error("Muddatni saqlashda xatolik yuz berdi");
    } finally {
      setLoadingDeadline(false);
    }
  };

  const closeDeadlineModal = () => {
    setShowDeadlineModal(false);
    setSelectedMonth(null);
    setDeadlineDate("");
  };

  // Open statistics month modal (for calendar icon)
  const openStatisticsMonthModal = async (student) => {
    setSelectedStudent(student);
    setLoadingStatistics(true);
    setShowStatisticsMonthModal(true);

    try {
      // Fetch student plan checking history to get months with plans
      const result = await ApiCall(`/api/v1/reja-history/by-student/${student.id}`, "GET");

      if (result.data && Array.isArray(result.data)) {
        const histories = result.data;

        // Extract unique months from histories (support both old and new system)
        const monthMap = new Map();

        histories.forEach((h) => {
          // Try to get month from new system (studentRejaChecking)
          let month = h.studentRejaChecking?.studentReja?.month;

          // If not found, try old system (rejaChecking)
          if (!month) {
            month = h.rejaChecking?.reja?.month;
          }

          if (month && month.id) {
            if (!monthMap.has(month.id)) {
              monthMap.set(month.id, {
                monthId: month.id,
                monthName: month.name,
                startedDate: month.startedDate,
                endedDate: month.endedDate,
                totalSubmitted: 0,
                pending: 0,
                approved: 0,
                rejected: 0,
              });
            }

            // Count statistics
            const monthStat = monthMap.get(month.id);
            const status = h.studentRejaChecking?.status ?? h.rejaChecking?.status;

            if (status === 0) monthStat.pending++;
            else if (status === 1) monthStat.approved++;
            else if (status === 2) monthStat.rejected++;

            monthStat.totalSubmitted++;
          }
        });

        // Convert map to array and sort by date
        const monthsArray = Array.from(monthMap.values()).sort((a, b) => {
          return new Date(a.startedDate) - new Date(b.startedDate);
        });

        setStatisticsMonths(monthsArray);
      } else {
        setStatisticsMonths([]);
      }
    } catch (error) {
      console.error("Statistikani olishda xatolik", error);
      setStatisticsMonths([]);
    } finally {
      setLoadingStatistics(false);
    }
  };

  const closeStatisticsMonthModal = () => {
    setShowStatisticsMonthModal(false);
    setSelectedStudent(null);
    setStatisticsMonths([]);
  };

  const handleStatisticsMonthSelect = (monthStat) => {
    if (selectedStudent && monthStat) {
      // Navigate to student month statistics page
      navigate(`/superadmin/student/${selectedStudent.id}/month/${monthStat.monthId}`);
      closeStatisticsMonthModal();
    }
  };

  const createStudent = async (studentData) => {
    try {
      await ApiCall("/api/v1/student", "POST", studentData);
      await getStudents();
      closeModal();
      toast.success("O'quvchi muvaffaqiyatli yaratildi");
    } catch (error) {
      console.error("O'quvchi yaratishda xatolik", error);
      toast.error("O'quvchi yaratishda xatolik yuz berdi");
    }
  };

  const updateStudent = async (id, studentData) => {
    try {
      await ApiCall(`/api/v1/student/${id}`, "PUT", studentData);
      await getStudents();
      closeModal();
      toast.success("O'quvchi muvaffaqiyatli yangilandi");
    } catch (error) {
      console.error("O'quvchini yangilashda xatolik", error);
      toast.error("O'quvchini yangilashda xatolik yuz berdi");
    }
  };

  const deleteStudent = async (id) => {
    if (window.confirm("Ushbu o'quvchini o'chirishni xohlaysizmi?")) {
      try {
        await ApiCall(`/api/v1/student/${id}`, "DELETE");
        await getStudents();
        toast.success("O'quvchi muvaffaqiyatli o'chirildi");
      } catch (error) {
        console.error("O'quvchini o'chirishda xatolik", error);
        toast.error("O'quvchini o'chirishda xatolik yuz berdi");
      }
    }
  };

  // Upload image to attachment endpoint
  const uploadImageToAttachment = async (file) => {
    if (!file) return null;

    try {
      setUploadingImage(true);
      const formDataWithFile = new FormData();
      formDataWithFile.append("photo", file);
      formDataWithFile.append("prefix", "/students");

      const response = await axios.post(baseUrl + "/api/v1/file/upload", formDataWithFile, {
        headers: {
          "Content-Type": "multipart/form-data",
          "Authorization": localStorage.getItem("access_token") || "",
        },
      });

      if (response.data) {
        setUploadingImage(false);
        return response.data;
      }
      setUploadingImage(false);
      return null;
    } catch (error) {
      setUploadingImage(false);
      console.error("Rasm yuklashda xatolik", error);
      toast.error("Rasm yuklashda xatolik yuz berdi");
      return null;
    }
  };

  // Upload PDF to attachment endpoint
  const uploadPdfToAttachment = async (file) => {
    if (!file) return null;

    try {
      setUploadingPdf(true);
      const formDataWithFile = new FormData();
      formDataWithFile.append("photo", file);
      formDataWithFile.append("prefix", "/students/plans");

      const response = await axios.post(baseUrl + "/api/v1/file/upload", formDataWithFile, {
        headers: {
          "Content-Type": "multipart/form-data",
          "Authorization": localStorage.getItem("access_token") || "",
        },
      });

      if (response.data) {
        setUploadingPdf(false);
        return response.data;
      }
      setUploadingPdf(false);
      return null;
    } catch (error) {
      setUploadingPdf(false);
      console.error("PDF yuklashda xatolik", error);
      toast.error("PDF yuklashda xatolik yuz berdi");
      return null;
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePdfChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== "application/pdf") {
        toast.warning("Faqat PDF fayl yuklash mumkin!");
        e.target.value = null;
        return;
      }
      setPdfFile(file);
      setPdfFileName(file.name);
    }
  };

  // ---------- Form Handlers ----------
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const updatedFormData = { ...formData, [name]: value };

    // Auto-generate fullName and shortName from firstName, secondName, thirdName
    if (name === "firstName" || name === "secondName" || name === "thirdName") {
      const firstName = name === "firstName" ? value : updatedFormData.firstName;
      const secondName = name === "secondName" ? value : updatedFormData.secondName;
      const thirdName = name === "thirdName" ? value : updatedFormData.thirdName;

      // Generate fullName: FAMILYA ISM OTASIIISMI
      updatedFormData.fullName = [thirdName, firstName, secondName]
        .filter(part => part)
        .map(part => part.toUpperCase())
        .join(" ");

      // Generate shortName: FAMILYA F. S. format
      const firstInitial = firstName ? firstName.charAt(0).toUpperCase() + "." : "";
      const secondInitial = secondName ? secondName.charAt(0).toUpperCase() + "." : "";
      const familyNameUpper = thirdName ? thirdName.toUpperCase() : "";

      updatedFormData.shortName = [familyNameUpper, firstInitial, secondInitial]
        .filter(part => part)
        .join(" ");
    }

    setFormData(updatedFormData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate studentIdNumber is exactly 14 digits
    if (!formData.studentIdNumber || formData.studentIdNumber.length !== 14 || !/^\d{14}$/.test(formData.studentIdNumber)) {
      toast.warning("O'quvchi ID raqami aniq 14 ta raqamdan iborat bo'lishi kerak!");
      return;
    }

    // Validate phone number - must be +998 followed by 9 digits (13 chars total)
    if (!formData.phone || formData.phone.length !== 13 || !/^\+998\d{9}$/.test(formData.phone)) {
      toast.warning("Telefon raqami +998 bilan boshlanishi va aniq 13 ta belgidan iborat bo'lishi kerak!");
      return;
    }

    setLoading(true);

    // Upload image if selected
    let imageFileId = formData.imageFileId;
    if (imageFile) {
      imageFileId = await uploadImageToAttachment(imageFile);
      if (!imageFileId) {
        setLoading(false);
        return;
      }
    }

    // Upload PDF if selected
    let planFileId = formData.planFileId;
    if (pdfFile) {
      planFileId = await uploadPdfToAttachment(pdfFile);
      if (!planFileId) {
        setLoading(false);
        return;
      }
    }

    const payload = {
      fullName: formData.fullName,
      shortName: formData.shortName,
      firstName: formData.firstName,
      secondName: formData.secondName,
      thirdName: formData.thirdName,
      gender: formData.gender,
      birthDate: formData.birthDate ? new Date(formData.birthDate).getTime() : null,
      studentIdNumber: formData.studentIdNumber,
      studentStatus: formData.studentStatus,
      phone: formData.phone,
      password: formData.password,
      ilmiyRahberId: formData.ilmiyRahberId || null,
      levelId: formData.levelId ? parseInt(formData.levelId) : null,
      imageFileId: imageFileId || null,
      direction: formData.direction || null,      // +
      chosenTopic: formData.chosenTopic || null,
      planFileId: planFileId || null,
    };

    if (isEditing && formData.id) {
      updateStudent(formData.id, payload);
    } else {
      createStudent(payload);
    }
    setLoading(false);
  };

  const openEditModal = (student) => {
    setFormData({
      id: student.id,
      fullName: student.fullName || "",
      shortName: student.shortName || "",
      firstName: student.firstName || "",
      secondName: student.secondName || "",
      thirdName: student.thirdName || "",
      gender: student.gender || "Male",
      birthDate: student.birthDate ? new Date(student.birthDate).toISOString().split("T")[0] : "",
      studentIdNumber: student.studentIdNumber || "",
      studentStatus: student.studentStatus || "active",
      phone: student.phone || "",
      password: "",
      ilmiyRahberId: student.ilmiyRahber?.id || "",
      levelId: student.level?.id || "",
      imageFileId: student.imageFile?.id || "",
      direction: student.direction || "",
      chosenTopic: student.chosenTopic || "",
      planFileId: student.planFile?.id || "",
    });
    setImageFile(null);
    setImagePreview(null);
    setPdfFile(null);
    setPdfFileName(student.planFile?.name || null);
    setIsEditing(true);
    setShowModal(true);
  };

  const openCreateModal = () => {
    setFormData({
      id: null,
      fullName: "",
      shortName: "",
      firstName: "",
      secondName: "",
      thirdName: "",
      gender: "Male",
      birthDate: "",
      studentIdNumber: "",
      studentStatus: "active",
      phone: "",
      password: "",
      ilmiyRahberId: "",
      levelId: "",
      imageFileId: "",
      direction: "",       // +
      chosenTopic: "",
      planFileId: "",
    });
    setImageFile(null);
    setImagePreview(null);
    setPdfFile(null);
    setPdfFileName(null);
    setIsEditing(false);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({
      id: null,
      fullName: "",
      shortName: "",
      firstName: "",
      secondName: "",
      thirdName: "",
      gender: "Male",
      birthDate: "",
      studentIdNumber: "",
      studentStatus: "active",
      phone: "",
      password: "",
      ilmiyRahberId: "",
      levelId: "",
      direction: "",       // +
      chosenTopic: "",
      planFileId: "",
    });
    setImageFile(null);
    setImagePreview(null);
    setPdfFile(null);
    setPdfFileName(null);
    setIsEditing(false);
  };

  // Filter students by name and level
  const filteredStudents = students?.filter((student) => {
    const fullNameMatch = student.fullName.toLowerCase().includes(searchTerm.toLowerCase());
    const levelMatch = filterLevel === "" || (() => {
      const selectedLevel = levels.find(level => level.id === parseInt(filterLevel));
      return selectedLevel ? student.levelName === selectedLevel.name : false;
    })();
    return fullNameMatch && levelMatch;
  });

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      "T/R",
      "To'liq ism",
      "Qo'llanma ismi",
      "Ism",
      "Otasi ismi",
      "Familya",
      "Jinsi",
      "Tugilgan sana",
      "ID raqami",
      "Holati",
      "Telefon",
      "Daraja",
      "Ilmiy rahbar",
    ];
    const rows = filteredStudents?.map((student, idx) => [
      idx + 1,
      student.fullName,
      student.shortName,
      student.firstName,
      student.secondName,
      student.thirdName,
      student.gender,
      student.birthDate ? new Date(student.birthDate).toLocaleDateString() : "",
      student.studentIdNumber,
      student.studentStatus,
      student.phone,
      student.level?.name || "-",
      student.ilmiyRahber?.name || "-",
    ]);

    let csvContent = headers.join(",") + "\n";
    rows?.forEach((row) => {
      csvContent += row.map((cell) => `"${cell}"`).join(",") + "\n";
    });

    const element = document.createElement("a");
    element.setAttribute(
      "href",
      "data:text/plain;charset=utf-8," + encodeURIComponent(csvContent)
    );
    element.setAttribute("download", "students.csv");
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <div className="mx-auto max-w-7xl overflow-hidden rounded-2xl bg-white shadow-lg">
        {/* Header */}
        <div className="flex flex-col items-center justify-between border-b border-gray-200 bg-gradient-to-r from-blue-50 to-cyan-50 p-6 sm:flex-row">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              O'quvchilarni boshqarish
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Jami:{" "}
              <span className="font-semibold">{filteredStudents?.length}</span>{" "}
              o'quvchi
            </p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 sm:mt-0">
            <button
              onClick={exportToCSV}
              className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-white shadow-sm transition duration-200 hover:bg-blue-700"
            >
              <Download size={18} className="mr-2" />
              Yuklash
            </button>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center rounded-lg bg-green-600 px-4 py-2 text-white shadow-sm transition duration-200 hover:bg-green-700"
            >
              <Plus size={18} className="mr-2" />
              Yangi o'quvchi
            </button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="border-b border-gray-200 bg-white p-4 sm:p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <input
              type="text"
              placeholder="To'liq ism bo'yicha qidirish"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Barcha darajalar</option>
              {levels.map((level) => (
                <option key={level.id} value={level.id}>
                  {level.name || `Daraja ${level.id}`}
                </option>
              ))}
            </select>
            <div className="pt-2 text-sm text-gray-600">
              Filtrlangan natija:{" "}
              <span className="font-semibold">{filteredStudents?.length}</span>
            </div>
          </div>
        </div>

        {/* Students Table - Responsive */}
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
                  ID raqami
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Daraja
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Holati
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Ilmiy rahbar
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Amallar
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredStudents?.length === 0 ? (
                <tr>
                  <td
                    colSpan="8"
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    O'quvchilar topilmadi. Yangi o'quvchi qo'shish uchun bosing.
                  </td>
                </tr>
              ) : (
                filteredStudents?.map((student, idx) => (
                  <tr key={student.id} className="transition hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {idx + 1}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      {student.imageFileId ? (
                        <img
                          src={
                            baseUrl +
                            "/api/v1/file/getFile/" +
                            student.imageFileId
                          }
                          alt={student.fullName}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-200"></div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                      <button
                        onClick={() => openMonthModal(student)}
                        className="text-blue-600 hover:text-blue-900 hover:underline transition"
                        title="Oyni tanlang"
                      >
                        {student.fullName}
                      </button>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                      {student.phone}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                      {student.studentIdNumber}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                        {student.levelName || "-"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${student.studentStatus === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                          }`}
                      >
                        {student.studentStatus === "active" ? "Faol" : "Nofaol"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                      {student.ilmiyRahberName || "-"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <button
                        onClick={() => openStatisticsMonthModal(student)}
                        className="mr-3 text-purple-600 hover:text-purple-900"
                        aria-label="Statistika"
                        title="Statistika"
                      >
                        <MdCalendarToday size={18} />
                      </button>
                      <button
                        onClick={() => openEditModal(student)}
                        className="mr-3 text-indigo-600 hover:text-indigo-900"
                        aria-label="Tahrirlash"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => deleteStudent(student.id)}
                        className="text-red-600 hover:text-red-900"
                        aria-label="O'chirish"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Create/Edit */}
      <Modal
        open={showModal}
        onClose={closeModal}
        center
        showCloseIcon={false}
        styles={{
          modal: {
            width: "90%",
            maxWidth: "800px",
            borderRadius: "24px",
            padding: "0",
            backgroundColor: "#ffffff",
            maxHeight: "90vh",
            overflowY: "auto",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          },
          overlay: {
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(6px)",
          },
        }}
      >
        <div className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">
              {isEditing ? "O'quvchini tahrirlash" : "Yangi o'quvchi qo'shish"}
            </h2>
            <button
              onClick={closeModal}
              className="text-gray-700 hover:text-gray-600"
            >
              <X size={22} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Row 1: Full Name and Short Name */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  To'liq ism (Avtomatik)
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  disabled
                  className="w-full cursor-not-allowed rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-gray-600 focus:outline-none"
                  placeholder="FAMILYA ISM OTASI ISMI"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Avtomatik ravishda Familya, Ism va Otasi ismi bo'yicha
                  tuziladi
                </p>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Qo'llanma ismi (Avtomatik)
                </label>
                <input
                  type="text"
                  name="shortName"
                  value={formData.shortName}
                  disabled
                  className="w-full cursor-not-allowed rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-gray-600 focus:outline-none"
                  placeholder="BOBOXONOVA M. B."
                />
                <p className="mt-1 text-xs text-gray-500">
                  Avtomatik ravishda Ism, Otasi ismi va Familya bo'yicha
                  tuziladi
                </p>
              </div>
            </div>

            {/* Row 2: First Name, Second Name, Third Name */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Ism *
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ism"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Otasi ismi
                </label>
                <input
                  type="text"
                  name="secondName"
                  value={formData.secondName}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Otasi ismi"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Familya
                </label>
                <input
                  type="text"
                  name="thirdName"
                  value={formData.thirdName}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Familya"
                />
              </div>
            </div>

            {/* Row 3: Gender and Birth Date */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Jinsi *
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Male">Erkak</option>
                  <option value="Female">Ayol</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Tugilgan sana
                </label>
                <input
                  type="date"
                  name="birthDate"
                  value={formData.birthDate}
                  onChange={handleInputChange}
                  max="2010-12-31"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Sana 2010-yil va undan oldingi bo'lishi kerak
                </p>
              </div>
            </div>

            {/* Row 4: Student ID Number and Phone */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  O'quvchi ID raqami * (14 raqam)
                </label>
                <input
                  type="text"
                  name="studentIdNumber"
                  value={formData.studentIdNumber}
                  onChange={(e) => {
                    // Only allow numbers and limit to 14 digits
                    const value = e.target.value
                      .replace(/[^0-9]/g, "")
                      .slice(0, 14);
                    handleInputChange({
                      target: { name: "studentIdNumber", value },
                    });
                  }}
                  maxLength="14"
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="12345678901234"
                />
                {formData.studentIdNumber.length !== 14 &&
                  formData.studentIdNumber.length > 0 && (
                    <p className="mt-1 text-xs text-red-500">
                      ID raqami aniq 14 ta raqamdan iborat bo'lishi kerak (
                      {formData.studentIdNumber.length}/14)
                    </p>
                  )}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Telefon * (O'zbekiston)
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={(e) => {
                    let value = e.target.value;

                    // Remove all non-digits except the initial +
                    if (value.startsWith("+")) {
                      value = "+" + value.slice(1).replace(/[^0-9]/g, "");
                    } else {
                      value = value.replace(/[^0-9]/g, "");
                      // Auto-add +998 if user enters only digits and doesn't start with +
                      if (value && !value.startsWith("998")) {
                        value = "998" + value;
                      }
                      if (value) {
                        value = "+" + value;
                      }
                    }

                    // Limit to +998 followed by 9 digits (total 13 chars)
                    if (value.startsWith("+998")) {
                      value = value.slice(0, 13);
                    } else if (value.startsWith("+")) {
                      // If it doesn't start with +998, remove the +
                      value = "";
                    }

                    handleInputChange({ target: { name: "phone", value } });
                  }}
                  maxLength="13"
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+998 94 248 84 54"
                />
                {formData.phone.length > 0 &&
                  (formData.phone.length !== 13 ||
                    !formData.phone.startsWith("+998")) && (
                    <p className="mt-1 text-xs text-red-500">
                      Telefon raqami +998 bilan boshlanishi va aniq 13 ta
                      belgidan iborat bo'lishi kerak ({formData.phone.length}
                      /13)
                    </p>
                  )}
                {formData.phone.length === 13 &&
                  formData.phone.startsWith("+998") && (
                    <p className="mt-1 text-xs text-green-600">
                      ✓ Telefon raqami to'g'ri
                    </p>
                  )}
              </div>
            </div>

            {/* Row 5: Password */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Parol {isEditing ? "" : "*"}
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required={!isEditing}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={
                  isEditing
                    ? "Bo'sh qoldirilsa o'zgartirilmaydi"
                    : "Parolni kiriting"
                }
              />
              {isEditing && (
                <p className="mt-1 text-xs text-gray-500">
                  Agar parolni o'zgartirmoqchi bo'lmasangiz, bo'sh qoldiring
                </p>
              )}
            </div>

            {/* Row 6: Level and Ilmiy Rahber */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Daraja
                </label>
                <select
                  name="levelId"
                  value={formData.levelId}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Darajani tanlang</option>
                  {levels.map((level) => (
                    <option key={level.id} value={level.id}>
                      {level.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Ilmiy rahbar
                </label>
                <select
                  name="ilmiyRahberId"
                  value={formData.ilmiyRahberId}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Rahbarni tanlang</option>
                  {ilmiyRahbers.map((rahber) => (
                    <option key={rahber.id} value={rahber.id}>
                      {rahber.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {/* Row 6.5: Yo'nalish and Mavzu */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Yo'nalish
                </label>
                <input
                  type="text"
                  name="direction"
                  value={formData.direction}
                  onChange={handleInputChange}
                  maxLength={1000}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Yo'nalishni kiriting"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Mavzu
                </label>
                <input
                  type="text"
                  name="chosenTopic"
                  value={formData.chosenTopic}
                  onChange={handleInputChange}
                  maxLength={1000}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Mavzuni kiriting"
                />

              </div>
            </div>

            {/* Row 7: Status */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Holati *
              </label>
              <select
                name="studentStatus"
                value={formData.studentStatus}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">Faol</option>
                <option value="inactive">Nofaol</option>
              </select>
            </div>

            {/* Row 8: Image Upload */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                O'quvchining Rasmi
              </label>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={uploadingImage}
                    className="block w-full text-sm text-gray-600 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-600 file:py-2 file:px-4 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-700 disabled:file:bg-gray-400"
                  />
                </div>
              </div>
              {imagePreview && (
                <div className="mt-3">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="h-24 w-24 rounded-lg border-2 border-blue-300 object-cover"
                  />
                </div>
              )}
              {uploadingImage && (
                <p className="mt-2 text-sm text-blue-600">
                  Rasm yuklanyapti...
                </p>
              )}
            </div>

            {/* Row 9: PDF Upload (Ishlar rejasi) */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Ishlar rejasi (PDF)
              </label>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handlePdfChange}
                    disabled={uploadingPdf}
                    className="block w-full text-sm text-gray-600 file:mr-4 file:rounded-lg file:border-0 file:bg-green-600 file:py-2 file:px-4 file:text-sm file:font-semibold file:text-white hover:file:bg-green-700 disabled:file:bg-gray-400"
                  />
                </div>
              </div>
              {pdfFileName && (
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                  </svg>
                  <span>{pdfFileName}</span>
                </div>
              )}
              {uploadingPdf && (
                <p className="mt-2 text-sm text-green-600">
                  PDF yuklanyapti...
                </p>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-3 border-t border-gray-200 pt-6">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition hover:bg-gray-50"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700 disabled:opacity-50"
              >
                {loading
                  ? "Saqlanmoqda..."
                  : isEditing
                    ? "Yangilash"
                    : "Yaratish"}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Month Selection Modal (for plans management) */}
      <MonthSelectionModal
        isOpen={showMonthModal}
        onClose={closeMonthModal}
        months={monthsWithDeadlines.length > 0 ? monthsWithDeadlines : months}
        onSelectMonth={handleMonthSelect}
        onEditDeadline={handleEditDeadline}
        studentName={selectedStudent?.fullName}
      />

      {/* Deadline Edit Modal */}
      <Modal
        open={showDeadlineModal}
        onClose={closeDeadlineModal}
        center
        showCloseIcon={false}
        styles={{
          modal: {
            width: "90%",
            maxWidth: "500px",
            borderRadius: "24px",
            padding: "0",
            backgroundColor: "#ffffff",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          },
          overlay: {
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(6px)",
          },
        }}
      >
        <div className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                Muddatni uzaytirish
              </h2>
              {selectedStudent && selectedMonth && (
                <p className="mt-1 text-sm text-gray-600">
                  {selectedStudent.fullName} - {selectedMonth.name}
                </p>
              )}
            </div>
            <button
              onClick={closeDeadlineModal}
              className="text-gray-700 hover:text-gray-600 transition"
            >
              <X size={22} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Tugash sanasi *
              </label>
              <input
                type="datetime-local"
                value={deadlineDate}
                onChange={(e) => setDeadlineDate(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Ushbu o'quvchi uchun {selectedMonth?.name} oyining tugash sanasini o'zgartiring
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3 border-t border-gray-200 pt-4">
            <button
              type="button"
              onClick={closeDeadlineModal}
              className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition hover:bg-gray-50"
            >
              Bekor qilish
            </button>
            <button
              type="button"
              onClick={handleSaveDeadline}
              disabled={loadingDeadline || !deadlineDate}
              className="rounded-lg bg-orange-600 px-4 py-2 text-white transition hover:bg-orange-700 disabled:opacity-50"
            >
              {loadingDeadline ? "Saqlanmoqda..." : "Saqlash"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Statistics Month Selection Modal (for viewing statistics) */}
      <Modal
        open={showStatisticsMonthModal}
        onClose={closeStatisticsMonthModal}
        center
        showCloseIcon={false}
        styles={{
          modal: {
            width: "90%",
            maxWidth: "800px",
            borderRadius: "24px",
            padding: "0",
            backgroundColor: "#ffffff",
            maxHeight: "90vh",
            overflowY: "auto",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          },
          overlay: {
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(6px)",
          },
        }}
      >
        <div className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                Statistika - Oyni tanlang
              </h2>
              {selectedStudent && (
                <p className="mt-1 text-sm text-gray-600">
                  {selectedStudent.fullName} uchun
                </p>
              )}
            </div>
            <button
              onClick={closeStatisticsMonthModal}
              className="text-gray-700 hover:text-gray-600 transition"
            >
              <X size={22} />
            </button>
          </div>

          {loadingStatistics ? (
            <div className="py-12 text-center">
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
              <p className="mt-4 text-gray-600">Ma'lumotlar yuklanmoqda...</p>
            </div>
          ) : statisticsMonths.length === 0 ? (
            <div className="py-12 text-center">
              <MdCalendarToday className="mx-auto h-16 w-16 text-gray-300" />
              <p className="mt-4 text-gray-600">
                Hozircha statistika mavjud emas
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {statisticsMonths.map((monthStat, idx) => (
                <button
                  key={monthStat.monthId}
                  onClick={() => handleStatisticsMonthSelect(monthStat)}
                  className="w-full rounded-xl border-2 border-gray-200 bg-white p-4 text-left transition-all hover:border-blue-500 hover:shadow-lg"
                >
                  <div className="mb-3">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {idx + 1}. {monthStat.monthName}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {new Date(monthStat.startedDate).toLocaleDateString("uz-UZ")} -{" "}
                      {new Date(monthStat.endedDate).toLocaleDateString("uz-UZ")}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-lg bg-blue-50 p-3 text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {monthStat.totalSubmitted}
                      </div>
                      <div className="text-xs font-medium text-blue-700">
                        Topshirilgan
                      </div>
                    </div>
                    <div className="rounded-lg bg-yellow-50 p-3 text-center">
                      <div className="text-2xl font-bold text-yellow-600">
                        {monthStat.pending}
                      </div>
                      <div className="text-xs font-medium text-yellow-700">
                        Kutilmoqda
                      </div>
                    </div>
                    <div className="rounded-lg bg-green-50 p-3 text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {monthStat.approved}
                      </div>
                      <div className="text-xs font-medium text-green-700">
                        Tasdiqlangan
                      </div>
                    </div>
                    <div className="rounded-lg bg-red-50 p-3 text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {monthStat.rejected}
                      </div>
                      <div className="text-xs font-medium text-red-700">
                        Rad etilgan
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="mt-6 flex justify-end border-t border-gray-200 pt-4">
            <button
              onClick={closeStatisticsMonthModal}
              className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition hover:bg-gray-50"
            >
              Bekor qilish
            </button>
          </div>
        </div>
      </Modal>

      {/* Statistics Modal */}
      <Modal
        open={showStatisticsModal}
        onClose={closeStatisticsModal}
        center
        showCloseIcon={false}
        styles={{
          modal: {
            width: "90%",
            maxWidth: "1000px",
            borderRadius: "24px",
            padding: "0",
            backgroundColor: "#ffffff",
            maxHeight: "90vh",
            overflowY: "auto",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          },
          overlay: {
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(6px)",
          },
        }}
      >
        <div className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-gray-800">
                Reja statistikasi
              </h2>
              {selectedStudent && (
                <p className="mt-2 text-sm text-gray-600">
                  <span className="font-medium">{selectedStudent.fullName}</span> uchun
                </p>
              )}
            </div>
            <button
              onClick={closeStatisticsModal}
              className="text-gray-700 hover:text-gray-600"
            >
              <X size={22} />
            </button>
          </div>

          {loadingStatistics ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
                <p className="text-gray-600">Statistika yuklanyapti...</p>
              </div>
            </div>
          ) : statisticsData && statisticsData.monthStatistics && statisticsData.monthStatistics.length > 0 ? (
            <div className="space-y-4">
              {statisticsData.monthStatistics.map((monthStat, idx) => (
                <div
                  key={monthStat.monthId}
                  onClick={() =>
                    navigate(
                      `/superadmin/student/${selectedStudent.id}/month/${monthStat.monthId}`
                    )
                  }
                  className="rounded-lg border border-gray-200 p-4 hover:shadow-md transition cursor-pointer hover:border-blue-300"
                >
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {idx + 1}. {monthStat.monthName}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {new Date(monthStat.startedDate).toLocaleDateString("uz-UZ")} -{" "}
                      {new Date(monthStat.endedDate).toLocaleDateString("uz-UZ")}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-lg bg-blue-50 p-3 text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {monthStat.totalSubmitted}
                      </div>
                      <div className="text-xs font-medium text-blue-700">
                        Yuklandi / Tekshirilmoqda
                      </div>
                    </div>

                    <div className="rounded-lg bg-green-50 p-3 text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {monthStat.totalAccepted}
                      </div>
                      <div className="text-xs font-medium text-green-700">
                        Qabul qilindi
                      </div>
                    </div>

                    <div className="rounded-lg bg-red-50 p-3 text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {monthStat.totalRejected}
                      </div>
                      <div className="text-xs font-medium text-red-700">
                        Rad etildi
                      </div>
                    </div>

                    <div className="rounded-lg bg-gray-50 p-3 text-center">
                      <div className="text-2xl font-bold text-gray-600">
                        {monthStat.totalRejas}
                      </div>
                      <div className="text-xs font-medium text-gray-700">
                        Umumiy rejalar
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <div className="mt-6 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 p-4 border border-blue-200">
                <h4 className="font-semibold text-gray-800 mb-3">Umumiy qaytarilgan statistika:</h4>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-sm">
                  <div>
                    <span className="text-gray-600">Yuklandi / Tekshirilmoqda:</span>
                    <div className="text-lg font-bold text-gray-800">
                      {statisticsData.monthStatistics.reduce(
                        (sum, m) => sum + m.totalSubmitted,
                        0
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Qabul qilindi:</span>
                    <div className="text-lg font-bold text-green-600">
                      {statisticsData.monthStatistics.reduce(
                        (sum, m) => sum + m.totalAccepted,
                        0
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Rad etildi:</span>
                    <div className="text-lg font-bold text-red-600">
                      {statisticsData.monthStatistics.reduce(
                        (sum, m) => sum + m.totalRejected,
                        0
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Umumiy rejalar:</span>
                    <div className="text-lg font-bold text-gray-600">
                      {statisticsData.monthStatistics.reduce(
                        (sum, m) => sum + m.totalRejas,
                        0
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg bg-gray-50 p-12 text-center">
              <p className="text-gray-600">
                Ushbu o'quvchi uchun statistika mavjud emas yoki hali rejalar yuklangan emas.
              </p>
            </div>
          )}

          <div className="mt-6 flex justify-end border-t border-gray-200 pt-4">
            <button
              onClick={closeStatisticsModal}
              className="rounded-lg bg-gray-300 px-4 py-2 text-gray-800 transition hover:bg-gray-400"
            >
              Yopish
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
