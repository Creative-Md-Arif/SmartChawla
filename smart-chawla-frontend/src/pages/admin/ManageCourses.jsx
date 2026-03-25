// components/admin/ManageCourses.jsx
import { useState, useEffect } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Users,
  X,
  Upload,
  Video,
  Image as ImageIcon,
  Loader2,
  CheckCircle,
  PlayCircle,
  List,
  GripVertical,
  User,
} from "lucide-react";
import axiosInstance from "../../utils/axiosInstance";
import { formatPrice } from "../../utils/formatters";

const ManageCourses = () => {
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    discountPrice: "",
    category: "",
    level: "All Levels",
    courseLanguage: "Bengali",
    instructor: { name: "", bio: "", avatar: "" },
    requirements: [],
    whatYouWillLearn: [],
    isPublished: false,
    metaTitle: "",
    metaDescription: "",
    lessons: [],
  });

  // Files state
  const [files, setFiles] = useState({
    thumbnail: null,
    previewVideo: null,
    fullVideo: null,
    avatar: null,
  });

  // Previews state
  const [previews, setPreviews] = useState({
    thumbnail: "",
    previewVideo: "",
    fullVideo: "",
    avatar: "",
  });

  // Lesson files management
  const [lessonFiles, setLessonFiles] = useState({});
  const [newLessonFile, setNewLessonFile] = useState(null);
  const [newLessonVideoPreview, setNewLessonVideoPreview] = useState("");

  const [newLesson, setNewLesson] = useState({
    title: "",
    duration: 0,
    isPreview: false,
  });

  useEffect(() => {
    fetchCourses();
    fetchCategories();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/courses?limit=100");
      setCourses(response.data.courses || []);
    } catch (error) {
      console.error("Error fetching courses:", error);
      alert("কোর্স লোড করতে সমস্যা হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axiosInstance.get("/categories");
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  // Handle file changes
  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const maxSizes = {
      thumbnail: 10 * 1024 * 1024, // 10MB
      previewVideo: 100 * 1024 * 1024, // 100MB
      fullVideo: 2000 * 1024 * 1024, // 2GB
      avatar: 2 * 1024 * 1024, // 2MB
    };

    if (file.size > maxSizes[type]) {
      alert(
        `ফাইল সাইজ বেশি বড়! সর্বোচ্চ: ${maxSizes[type] / (1024 * 1024)}MB`,
      );
      return;
    }

    setFiles((prev) => ({ ...prev, [type]: file }));

    if (type === "thumbnail" || type === "avatar") {
      setPreviews((prev) => ({
        ...prev,
        [type]: URL.createObjectURL(file),
      }));
    } else {
      setPreviews((prev) => ({ ...prev, [type]: file.name }));
    }
  };

  // Handle lesson video change
  const handleLessonVideoChange = (e, lessonIndex) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2000 * 1024 * 1024) {
      alert("ভিডিও সাইজ 2GB এর বেশি হতে পারবে না");
      return;
    }

    setLessonFiles((prev) => ({
      ...prev,
      [lessonIndex]: file,
    }));
  };

  // Add new lesson
  const addLesson = () => {
    if (!newLesson.title.trim()) {
      alert("লেসনের নাম দিন");
      return;
    }
    if (!newLessonFile) {
      alert("ভিডিও ফাইল আপলোড করুন");
      return;
    }

    const lessonIndex = formData.lessons.length;

    const lesson = {
      title: newLesson.title.trim(),
      duration: Number(newLesson.duration) || 0,
      isPreview: newLesson.isPreview,
      order: lessonIndex + 1,
    };

    setLessonFiles((prev) => ({
      ...prev,
      [lessonIndex]: newLessonFile,
    }));

    setFormData((prev) => ({
      ...prev,
      lessons: [...prev.lessons, lesson],
    }));

    // Reset
    setNewLesson({ title: "", duration: 0, isPreview: false });
    setNewLessonFile(null);
    setNewLessonVideoPreview("");
  };

  // Remove lesson
  const removeLesson = (index) => {
    const updatedLessons = formData.lessons.filter((_, i) => i !== index);
    const reordered = updatedLessons.map((l, i) => ({ ...l, order: i + 1 }));

    setFormData((prev) => ({ ...prev, lessons: reordered }));

    // Update lesson files mapping
    const updatedFiles = {};
    Object.keys(lessonFiles).forEach((key) => {
      const keyNum = parseInt(key);
      if (keyNum < index) {
        updatedFiles[keyNum] = lessonFiles[keyNum];
      } else if (keyNum > index) {
        updatedFiles[keyNum - 1] = lessonFiles[keyNum];
      }
    });
    setLessonFiles(updatedFiles);
  };

  // Move lesson
  const moveLesson = (index, direction) => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === formData.lessons.length - 1)
    ) {
      return;
    }

    const newIndex = direction === "up" ? index - 1 : index + 1;
    const lessons = [...formData.lessons];
    [lessons[index], lessons[newIndex]] = [lessons[newIndex], lessons[index]];

    const reordered = lessons.map((l, i) => ({ ...l, order: i + 1 }));
    setFormData((prev) => ({ ...prev, lessons: reordered }));

    // Swap files
    const newFiles = { ...lessonFiles };
    const temp = newFiles[index];
    newFiles[index] = newFiles[newIndex];
    newFiles[newIndex] = temp;
    setLessonFiles(newFiles);
  };

  // Update lesson field
  const updateLesson = (index, field, value) => {
    const updatedLessons = [...formData.lessons];
    updatedLessons[index] = { ...updatedLessons[index], [field]: value };
    setFormData((prev) => ({ ...prev, lessons: updatedLessons }));
  };

  // Handle edit
  const handleEdit = (course) => {
    setEditingCourse(course);
    setLessonFiles({});

    const loadedLessons = (course.lessons || []).map((l, i) => ({
      _id: l._id,
      title: l.title || "",
      videoId: l.videoId || "",
      videoUrl: l.videoUrl || "",
      duration: l.duration || 0,
      isPreview: l.isPreview || false,
      order: l.order || i + 1,
      resources: l.resources || [],
      hasExistingVideo: !!(l.videoUrl && l.videoId),
    }));

    setFormData({
      title: course.title || "",
      description: course.description || "",
      price: course.price || "",
      discountPrice: course.discountPrice || "",
      category: course.category?._id || "",
      level: course.level || "All Levels",
      courseLanguage: course.courseLanguage || "Bengali",
      instructor: {
        name: course.instructor?.name || "",
        bio: course.instructor?.bio || "",
        avatar: course.instructor?.avatar || "",
      },
      requirements: course.requirements || [],
      whatYouWillLearn: course.whatYouWillLearn || [],
      isPublished: course.isPublished || false,
      metaTitle: course.metaTitle || "",
      metaDescription: course.metaDescription || "",
      lessons: loadedLessons,
    });

    setFiles({
      thumbnail: null,
      previewVideo: null,
      fullVideo: null,
      avatar: null,
    });

    setPreviews({
      thumbnail: course.thumbnail?.url || "",
      previewVideo: course.shortVideo?.url || "",
      fullVideo: course.fullVideo?.url || "",
      avatar: course.instructor?.avatar || "",
    });

    setNewLesson({ title: "", duration: 0, isPreview: false });
    setNewLessonFile(null);
    setNewLessonVideoPreview("");
    setIsModalOpen(true);
  };

  // Handle add new
  const handleAddNew = () => {
    setEditingCourse(null);
    setLessonFiles({});
    setFormData({
      title: "",
      description: "",
      price: "",
      discountPrice: "",
      category: "",
      level: "All Levels",
      courseLanguage: "Bengali",
      instructor: { name: "", bio: "", avatar: "" },
      requirements: [],
      whatYouWillLearn: [],
      isPublished: false,
      metaTitle: "",
      metaDescription: "",
      lessons: [],
    });
    setFiles({
      thumbnail: null,
      previewVideo: null,
      fullVideo: null,
      avatar: null,
    });
    setPreviews({ thumbnail: "", previewVideo: "", fullVideo: "", avatar: "" });
    setNewLesson({ title: "", duration: 0, isPreview: false });
    setNewLessonFile(null);
    setIsModalOpen(true);
  };

  // Handle submit
const handleSubmit = async (e) => {
  e.preventDefault();

  if (!formData.title.trim()) {
    alert("কোর্সের নাম দিন");
    return;
  }
  if (!formData.description.trim()) {
    alert("বিবরণ দিন");
    return;
  }
  if (!formData.price) {
    alert("মূল্য দিন");
    return;
  }
  if (!formData.category) {
    alert("ক্যাটেগরি সিলেক্ট করুন");
    return;
  }
  if (!formData.instructor.name.trim()) {
    alert("ইন্সট্রাক্টরের নাম দিন");
    return;
  }
  if (!editingCourse && !files.thumbnail) {
    alert("থাম্বনেইল আপলোড করুন");
    return;
  }

  setSubmitting(true);

  try {
    const formDataToSend = new FormData();

    // Basic fields
    formDataToSend.append("title", formData.title.trim());
    formDataToSend.append("description", formData.description.trim());
    formDataToSend.append("price", Number(formData.price));
    formDataToSend.append("category", formData.category);
    formDataToSend.append("level", formData.level);
    formDataToSend.append("courseLanguage", formData.courseLanguage);
    formDataToSend.append("isPublished", formData.isPublished);
    formDataToSend.append("instructor", JSON.stringify(formData.instructor));

    if (formData.discountPrice) {
      formDataToSend.append("discountPrice", Number(formData.discountPrice));
    }
    if (formData.metaTitle) {
      formDataToSend.append("metaTitle", formData.metaTitle);
    }
    if (formData.metaDescription) {
      formDataToSend.append("metaDescription", formData.metaDescription);
    }

    // Arrays
    formDataToSend.append(
      "requirements",
      JSON.stringify(formData.requirements.filter((r) => r.trim()))
    );
    formDataToSend.append(
      "whatYouWillLearn",
      JSON.stringify(formData.whatYouWillLearn.filter((w) => w.trim()))
    );

    // ✅ FIXED: Lessons - সহজ উপায়
    const lessonsData = [];
    const videoFileIndices = [];
    
    formData.lessons.forEach((lesson, index) => {
      // ✅ এই lesson-এ নতুন video আছে কিনা চেক করুন
      const hasNewVideo = lessonFiles[index] !== undefined && lessonFiles[index] !== null;
      
      console.log(`Lesson ${index}: ${lesson.title}, hasNewVideo: ${hasNewVideo}`);
      
      if (hasNewVideo) {
        videoFileIndices.push(index);
        lessonsData.push({
          title: lesson.title,
          duration: lesson.duration,
          isPreview: lesson.isPreview,
          order: lesson.order
        });
      } else {
        lessonsData.push({
          title: lesson.title,
          videoId: lesson.videoId || "",
          videoUrl: lesson.videoUrl || "",
          duration: lesson.duration,
          isPreview: lesson.isPreview,
          order: lesson.order,
          ...(lesson._id && { _id: lesson._id }),
        });
      }
    });

    formDataToSend.append("lessons", JSON.stringify(lessonsData));
    formDataToSend.append("lessonVideoIndices", JSON.stringify(videoFileIndices));

    // ✅ FIXED: lessonVideos ফাইল append করুন - গুরুত্বপূর্ণ!
    videoFileIndices.forEach((index) => {
      const file = lessonFiles[index];
      if (file) {
        formDataToSend.append("lessonVideos", file);
        console.log(`Appending lesson video ${index}:`, file.name, file.size);
      }
    });

    // Main files
    if (files.thumbnail) formDataToSend.append("thumbnail", files.thumbnail);
    if (files.previewVideo) formDataToSend.append("previewVideo", files.previewVideo);
    if (files.fullVideo) formDataToSend.append("fullVideo", files.fullVideo);
    if (files.avatar) formDataToSend.append("avatar", files.avatar);

    // ✅ DEBUG: FormData চেক করুন
    console.log("=== FORM DATA CHECK ===");
    console.log("lessonsData:", lessonsData);
    console.log("videoFileIndices:", videoFileIndices);
    console.log("lessonFiles keys:", Object.keys(lessonFiles));
    for (let pair of formDataToSend.entries()) {
      if (pair[1] instanceof File) {
        console.log(`${pair[0]}: File - ${pair[1].name}`);
      } else {
        console.log(`${pair[0]}: ${pair[1].toString().substring(0, 100)}`);
      }
    }

    // API call
    const url = editingCourse ? `/courses/${editingCourse._id}` : "/courses";
    const method = editingCourse ? "put" : "post";

    const response = await axiosInstance[method](url, formDataToSend, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 0,
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        console.log(`Upload: ${percentCompleted}%`);
      },
    });

    alert(editingCourse ? "কোর্স আপডেট হয়েছে" : "কোর্স তৈরি হয়েছে");
    setIsModalOpen(false);
    fetchCourses();
    resetForm();
  } catch (error) {
    console.error("Error:", error);
    alert(error.response?.data?.message || "সেভ করতে সমস্যা");
  } finally {
    setSubmitting(false);
  }
};

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      price: "",
      discountPrice: "",
      category: "",
      level: "All Levels",
      courseLanguage: "Bengali",
      instructor: { name: "", bio: "", avatar: "" },
      requirements: [],
      whatYouWillLearn: [],
      isPublished: false,
      metaTitle: "",
      metaDescription: "",
      lessons: [],
    });
    setFiles({
      thumbnail: null,
      previewVideo: null,
      fullVideo: null,
      avatar: null,
    });
    setPreviews({ thumbnail: "", previewVideo: "", fullVideo: "", avatar: "" });
    setLessonFiles({});
    setNewLessonFile(null);
    setEditingCourse(null);
  };

  const handleDelete = async (id) => {
    if (!confirm("আপনি কি নিশ্চিত যে এই কোর্সটি ডিলিট করতে চান?")) return;

    try {
      await axiosInstance.delete(`/courses/${id}`);
      setCourses(courses.filter((c) => c._id !== id));
      alert("কোর্স সফলভাবে ডিলিট হয়েছে");
    } catch (error) {
      console.error("Error deleting course:", error);
      alert("কোর্স ডিলিট করতে সমস্যা হয়েছে");
    }
  };

  const filteredCourses = courses.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">কোর্স ম্যানেজমেন্ট</h1>
        <button
          onClick={handleAddNew}
          className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          <Plus className="w-5 h-5 mr-2" />
          নতুন কোর্স
        </button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="কোর্স খুঁজুন..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-200"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-600" />
          <p className="mt-2 text-gray-600">লোড হচ্ছে...</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  কোর্স
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  ইন্সট্রাক্টর
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  মূল্য
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  স্ট্যাটাস
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  অ্যাকশন
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCourses.map((course) => (
                <tr key={course._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <img
                        src={course.thumbnail?.url || "/placeholder-course.jpg"}
                        alt={course.title}
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                      <div className="ml-3">
                        <p className="font-medium text-gray-900">
                          {course.title}
                        </p>
                        <p className="text-sm text-gray-500">
                          {course.category?.name?.bn ||
                            course.category?.name?.en ||
                            course.category?.name}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      {course.instructor?.avatar ? (
                        <img
                          src={course.instructor.avatar}
                          alt={course.instructor.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                          <User className="w-4 h-4 text-purple-600" />
                        </div>
                      )}
                      <span>{course.instructor?.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium text-gray-900">
                      {formatPrice(course.price)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        course.isPublished
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {course.isPublished ? "প্রকাশিত" : "ড্রাফট"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleEdit(course)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg mr-1"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(course._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {editingCourse ? "কোর্স এডিট" : "নতুন কোর্স"}
              </h2>
              <button
                onClick={() => !submitting && setIsModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
                disabled={submitting}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="border-b px-6">
              <div className="flex space-x-6">
                {[
                  { id: "basic", label: "বেসিক", icon: List },
                  { id: "lessons", label: "লেসনস", icon: PlayCircle },
                  { id: "media", label: "মিডিয়া", icon: Video },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center py-3 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? "border-purple-600 text-purple-600"
                        : "border-transparent text-gray-500"
                    }`}
                  >
                    <tab.icon className="w-4 h-4 mr-2" />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              {/* Basic Tab */}
              {activeTab === "basic" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        কোর্সের নাম *
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) =>
                          setFormData({ ...formData, title: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-200"
                        placeholder="কোর্সের নাম"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        বিবরণ *
                      </label>
                      <textarea
                        rows={4}
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-200"
                        placeholder="কোর্সের বিবরণ"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ক্যাটেগরি *
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) =>
                          setFormData({ ...formData, category: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-200"
                      >
                        <option value="">সিলেক্ট করুন</option>
                        {categories.map((cat) => (
                          <option key={cat._id} value={cat._id}>
                            {cat.name?.bn || cat.name?.en || cat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        লেভেল
                      </label>
                      <select
                        value={formData.level}
                        onChange={(e) =>
                          setFormData({ ...formData, level: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="Beginner">বিগিনার</option>
                        <option value="Intermediate">ইন্টারমিডিয়েট</option>
                        <option value="Advanced">এডভান্সড</option>
                        <option value="All Levels">সব লেভেল</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        মূল্য *
                      </label>
                      <input
                        type="number"
                        value={formData.price}
                        onChange={(e) =>
                          setFormData({ ...formData, price: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="০"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ডিসকাউন্ট মূল্য
                      </label>
                      <input
                        type="number"
                        value={formData.discountPrice}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            discountPrice: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="০"
                      />
                    </div>
                  </div>

                  {/* Instructor */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      ইন্সট্রাক্টর
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          অ্যাভাটার
                        </label>
                        <div className="flex items-center gap-4">
                          {previews.avatar ? (
                            <img
                              src={previews.avatar}
                              alt="Avatar"
                              className="w-20 h-20 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center">
                              <User className="w-8 h-8 text-purple-400" />
                            </div>
                          )}
                          <label className="cursor-pointer px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                            <Upload className="w-4 h-4 inline mr-2" />
                            ছবি সিলেক্ট
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleFileChange(e, "avatar")}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          নাম *
                        </label>
                        <input
                          type="text"
                          value={formData.instructor.name}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              instructor: {
                                ...formData.instructor,
                                name: e.target.value,
                              },
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          placeholder="ইন্সট্রাক্টরের নাম"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          বায়ো
                        </label>
                        <textarea
                          rows={3}
                          value={formData.instructor.bio}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              instructor: {
                                ...formData.instructor,
                                bio: e.target.value,
                              },
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          placeholder="বায়ো"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Arrays */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      অতিরিক্ত তথ্য
                    </h3>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        প্রয়োজনীয়তা
                      </label>
                      {formData.requirements.map((req, index) => (
                        <div key={index} className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={req}
                            onChange={(e) => {
                              const newReqs = [...formData.requirements];
                              newReqs[index] = e.target.value;
                              setFormData({
                                ...formData,
                                requirements: newReqs,
                              });
                            }}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newReqs = formData.requirements.filter(
                                (_, i) => i !== index,
                              );
                              setFormData({
                                ...formData,
                                requirements: newReqs,
                              });
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            requirements: [...formData.requirements, ""],
                          })
                        }
                        className="text-sm text-purple-600 font-medium"
                      >
                        + যোগ করুন
                      </button>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        কী শিখবেন
                      </label>
                      {formData.whatYouWillLearn.map((item, index) => (
                        <div key={index} className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={item}
                            onChange={(e) => {
                              const newItems = [...formData.whatYouWillLearn];
                              newItems[index] = e.target.value;
                              setFormData({
                                ...formData,
                                whatYouWillLearn: newItems,
                              });
                            }}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newItems = formData.whatYouWillLearn.filter(
                                (_, i) => i !== index,
                              );
                              setFormData({
                                ...formData,
                                whatYouWillLearn: newItems,
                              });
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            whatYouWillLearn: [
                              ...formData.whatYouWillLearn,
                              "",
                            ],
                          })
                        }
                        className="text-sm text-purple-600 font-medium"
                      >
                        + যোগ করুন
                      </button>
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      SEO
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          মেটা টাইটেল
                        </label>
                        <input
                          type="text"
                          value={formData.metaTitle}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              metaTitle: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          মেটা ডেসক্রিপশন
                        </label>
                        <textarea
                          rows={2}
                          value={formData.metaDescription}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              metaDescription: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isPublished"
                      checked={formData.isPublished}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          isPublished: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-purple-600"
                    />
                    <label
                      htmlFor="isPublished"
                      className="ml-2 text-sm font-medium"
                    >
                      এখনই প্রকাশ করুন
                    </label>
                  </div>
                </div>
              )}

              {/* Lessons Tab */}
              {activeTab === "lessons" && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      লেসন লিস্ট ({formData.lessons.length}টি)
                    </h3>

                    {formData.lessons.map((lesson, index) => (
                      <div
                        key={lesson._id || index}
                        className="bg-gray-50 rounded-lg p-4 border"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex flex-col items-center">
                            <button
                              type="button"
                              onClick={() => moveLesson(index, "up")}
                              disabled={index === 0}
                              className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
                            >
                              <GripVertical className="w-4 h-4 rotate-180" />
                            </button>
                            <span className="text-sm font-medium">
                              {lesson.order}
                            </span>
                            <button
                              type="button"
                              onClick={() => moveLesson(index, "down")}
                              disabled={index === formData.lessons.length - 1}
                              className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
                            >
                              <GripVertical className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="flex-1 space-y-3">
                            <input
                              type="text"
                              value={lesson.title}
                              onChange={(e) =>
                                updateLesson(index, "title", e.target.value)
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                              placeholder="লেসনের নাম"
                            />

                            {/* Existing video */}
                            {lesson.hasExistingVideo && lesson.videoUrl && (
                              <div className="bg-green-50 border border-green-200 rounded p-3">
                                <p className="text-xs text-green-700 mb-2">
                                  <CheckCircle className="w-3 h-3 inline mr-1" />
                                  আগে আপলোড করা ভিডিও আছে
                                </p>
                                <video
                                  src={lesson.videoUrl}
                                  className="w-full h-32 object-cover rounded"
                                  controls
                                />
                              </div>
                            )}

                            {/* New file selected */}
                            {lessonFiles[index] && (
                              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                                <p className="text-xs text-blue-700">
                                  নতুন: {lessonFiles[index].name}
                                </p>
                              </div>
                            )}

                            {/* Upload new video */}
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                {lesson.hasExistingVideo
                                  ? "নতুন ভিডিও (ঐচ্ছিক)"
                                  : "ভিডিও আপলোড করুন *"}
                              </label>
                              <label
                                className={`cursor-pointer border-2 border-dashed rounded-lg p-3 block ${
                                  lessonFiles[index]
                                    ? "border-purple-500 bg-purple-50"
                                    : "border-gray-300"
                                }`}
                              >
                                <div className="flex items-center justify-center">
                                  <Upload className="w-4 h-4 mr-2 text-gray-400" />
                                  <span className="text-xs">
                                    {lessonFiles[index]
                                      ? lessonFiles[index].name
                                      : "ভিডিও সিলেক্ট করুন"}
                                  </span>
                                </div>
                                <input
                                  type="file"
                                  accept="video/*"
                                  onChange={(e) =>
                                    handleLessonVideoChange(e, index)
                                  }
                                  className="hidden"
                                />
                              </label>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  সময়কাল (সেকেন্ড)
                                </label>
                                <input
                                  type="number"
                                  value={lesson.duration}
                                  onChange={(e) =>
                                    updateLesson(
                                      index,
                                      "duration",
                                      Number(e.target.value),
                                    )
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                />
                              </div>
                              <div className="flex items-center">
                                <label className="flex items-center cursor-pointer mt-5">
                                  <input
                                    type="checkbox"
                                    checked={lesson.isPreview}
                                    onChange={(e) =>
                                      updateLesson(
                                        index,
                                        "isPreview",
                                        e.target.checked,
                                      )
                                    }
                                    className="w-4 h-4 text-purple-600"
                                  />
                                  <span className="ml-2 text-sm">
                                    ফ্রি প্রিভিউ
                                  </span>
                                </label>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => removeLesson(index)}
                              className="text-red-600 text-sm hover:underline"
                            >
                              ডিলিট করুন
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add new lesson */}
                  <div className="border-t pt-6">
                    <h4 className="text-md font-medium mb-4">নতুন লেসন</h4>
                    <div className="bg-purple-50 rounded-lg p-4 space-y-4">
                      <input
                        type="text"
                        value={newLesson.title}
                        onChange={(e) =>
                          setNewLesson({ ...newLesson, title: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="লেসনের নাম"
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            ভিডিও ফাইল *
                          </label>
                          <label
                            className={`cursor-pointer border-2 border-dashed border-gray-300 rounded-lg p-4 block ${
                              newLessonFile
                                ? "border-purple-500 bg-purple-50"
                                : ""
                            }`}
                          >
                            <div className="flex flex-col items-center">
                              <Video className="w-8 h-8 text-gray-400 mb-2" />
                              <span className="text-sm text-center">
                                {newLessonFile
                                  ? newLessonFile.name
                                  : "ভিডিও সিলেক্ট করুন"}
                              </span>
                              <input
                                type="file"
                                accept="video/*"
                                onChange={(e) => {
                                  const file = e.target.files[0];
                                  if (file) {
                                    if (file.size > 2000 * 1024 * 1024) {
                                      alert("সর্বোচ্চ 2GB");
                                      return;
                                    }
                                    setNewLessonFile(file);
                                    setNewLessonVideoPreview(
                                      URL.createObjectURL(file),
                                    );
                                  }
                                }}
                                className="hidden"
                              />
                            </div>
                          </label>
                        </div>

                        <div>
                          {newLessonVideoPreview && (
                            <video
                              src={newLessonVideoPreview}
                              className="w-full h-32 object-cover rounded-lg"
                              controls
                            />
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            সময়কাল
                          </label>
                          <input
                            type="number"
                            value={newLesson.duration}
                            onChange={(e) =>
                              setNewLesson({
                                ...newLesson,
                                duration: Number(e.target.value),
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          />
                        </div>
                        <div className="flex items-center">
                          <label className="flex items-center cursor-pointer mt-6">
                            <input
                              type="checkbox"
                              checked={newLesson.isPreview}
                              onChange={(e) =>
                                setNewLesson({
                                  ...newLesson,
                                  isPreview: e.target.checked,
                                })
                              }
                              className="w-4 h-4 text-purple-600"
                            />
                            <span className="ml-2 text-sm">ফ্রি প্রিভিউ</span>
                          </label>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={addLesson}
                        disabled={!newLessonFile}
                        className={`w-full py-2 rounded-lg font-medium ${
                          newLessonFile
                            ? "bg-purple-600 text-white hover:bg-purple-700"
                            : "bg-gray-300 text-gray-500"
                        }`}
                      >
                        লেসন যোগ করুন
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Media Tab */}
              {activeTab === "media" && (
                <div className="space-y-6">
                  {/* Thumbnail */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      থাম্বনেইল {editingCourse ? "" : "*"}
                    </label>
                    <div className="flex items-center gap-4">
                      <label className="flex-1 cursor-pointer border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-purple-500">
                        <div className="flex flex-col items-center">
                          <ImageIcon className="w-10 h-10 text-gray-400 mb-2" />
                          <span className="text-sm text-gray-600">
                            {files.thumbnail
                              ? files.thumbnail.name
                              : "ছবি সিলেক্ট করুন"}
                          </span>
                          <span className="text-xs text-gray-400">
                            JPG, PNG, WebP (সর্বোচ্চ 10MB)
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileChange(e, "thumbnail")}
                            className="hidden"
                          />
                        </div>
                      </label>
                      {previews.thumbnail && (
                        <img
                          src={previews.thumbnail}
                          alt="Thumbnail"
                          className="w-32 h-24 object-cover rounded-lg border"
                        />
                      )}
                    </div>
                  </div>

                  {/* Preview Video */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        প্রিভিউ ভিডিও (ঐচ্ছিক)
                      </label>
                      <label className="cursor-pointer border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-purple-500 block">
                        <div className="flex flex-col items-center">
                          <Video className="w-10 h-10 text-gray-400 mb-2" />
                          <span className="text-sm text-gray-600 text-center">
                            {files.previewVideo
                              ? files.previewVideo.name
                              : "ভিডিও সিলেক্ট করুন"}
                          </span>
                          <span className="text-xs text-gray-400 mt-1">
                            MP4, MOV (সর্বোচ্চ 100MB)
                          </span>
                          <input
                            type="file"
                            accept="video/*"
                            onChange={(e) =>
                              handleFileChange(e, "previewVideo")
                            }
                            className="hidden"
                          />
                        </div>
                      </label>
                      {previews.previewVideo && !files.previewVideo && (
                        <video
                          src={previews.previewVideo}
                          className="w-full h-32 mt-2 rounded-lg"
                          controls
                        />
                      )}
                    </div>

                    {/* Full Video */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ফুল ভিডিও (ঐচ্ছিক)
                      </label>
                      <label className="cursor-pointer border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-purple-500 block">
                        <div className="flex flex-col items-center">
                          <Video className="w-10 h-10 text-gray-400 mb-2" />
                          <span className="text-sm text-gray-600 text-center">
                            {files.fullVideo
                              ? files.fullVideo.name
                              : "ভিডিও সিলেক্ট করুন"}
                          </span>
                          <span className="text-xs text-gray-400 mt-1">
                            MP4, MOV (সর্বোচ্চ 2GB)
                          </span>
                          <input
                            type="file"
                            accept="video/*"
                            onChange={(e) => handleFileChange(e, "fullVideo")}
                            className="hidden"
                          />
                        </div>
                      </label>
                      {previews.fullVideo &&
                        !files.fullVideo &&
                        typeof previews.fullVideo === "string" &&
                        previews.fullVideo.startsWith("http") && (
                          <video
                            src={previews.fullVideo}
                            className="w-full h-32 mt-2 rounded-lg"
                            controls
                          />
                        )}
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      💡 <strong>টিপ:</strong> যদি আপনি মাল্টি-লেসন কোর্স না
                      চান, শুধু "ফুল ভিডিও" আপলোড করুন। এটি সিঙ্গেল ভিডিও কোর্স
                      হিসেবে কাজ করবে।
                    </p>
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex gap-4 pt-6 border-t mt-6">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      আপলোড হচ্ছে...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {editingCourse ? "আপডেট করুন" : "সেভ করুন"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageCourses;
