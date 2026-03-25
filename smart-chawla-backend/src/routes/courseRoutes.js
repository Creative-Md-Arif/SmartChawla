// routes/courseRoutes.js
const express = require("express");
const router = express.Router();
const courseController = require("../controllers/courseController");
const { authenticate } = require("../middlewares/authMiddleware");
const { authorize } = require("../middlewares/adminMiddleware");
const { uploadFields } = require("../middlewares/upload");


const handleLargePayload = (req, res, next) => {
  req.setTimeout(30 * 60 * 1000); // 30 minutes
  res.setTimeout(30 * 60 * 1000);
  next();
};


// ========== PUBLIC ROUTES ==========
router.get("/", courseController.getAllCourses);
router.get("/my-courses", authenticate, courseController.getMyCourses);

router.get("/my/enrolled", authenticate, courseController.getMyCourses);
router.get("/:slug/preview", courseController.getCoursePreview);
router.get("/:slug", courseController.getCourseBySlug);

// ========== PROTECTED ROUTES ==========

router.post("/:id/progress", authenticate, courseController.updateProgress);
router.get("/:slug/learn", authenticate, courseController.getSecureVideoUrl);
router.get(
  "/:courseId/lessons/:lessonId/video",
  authenticate,
  courseController.getLessonVideoUrl,
);

// ========== ADMIN ROUTES ==========

// Create course
router.post(
  "/",
  authenticate,
  authorize("admin"),
  handleLargePayload,
  uploadFields([
    { name: "thumbnail", type: "image", maxCount: 1 },
    { name: "previewVideo", type: "video", maxCount: 1 },
    { name: "fullVideo", type: "video", maxCount: 1 },
    { name: "avatar", type: "image", maxCount: 1 }, // ✅ "avatar" নামে চেঞ্জ
    { name: "lessonVideos", type: "video", maxCount: 50 },
  ]),
  courseController.createCourse,
);

// Update course - Single PUT route ✅
router.put(
  "/:id",
  authenticate,
  authorize("admin"),
  handleLargePayload,
  uploadFields([
    { name: "thumbnail", type: "image", maxCount: 1 },
    { name: "previewVideo", type: "video", maxCount: 1 },
    { name: "fullVideo", type: "video", maxCount: 1 },
    { name: "avatar", type: "image", maxCount: 1 }, // ✅ "avatar" নামে চেঞ্জ
    { name: "lessonVideos", type: "video", maxCount: 50 },
  ]),
  courseController.updateCourse,
);

// Delete course
router.delete(
  "/:id",
  authenticate,
  authorize("admin"),
  courseController.deleteCourse,
);

module.exports = router;
