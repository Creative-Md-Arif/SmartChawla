// controllers/courseController.js
const Course = require("../models/courseModel");
const User = require("../models/userModel");
const { uploadToCloudinary, cloudinary } = require("../config/cloudinary");
const fs = require("fs");
const AppError = require("../utils/errorHandler");
const { cleanupFiles } = require("../middlewares/upload");

const formatMedia = (result) => ({
  public_id: result.public_id,
  url: result.secure_url,
  duration: result.duration || 0,
});



exports.createCourse = async (req, res, next) => {
  try {
    console.log("=== CREATE COURSE ===");
    const courseData = { ...req.body };

    // Parse JSON fields
    if (typeof courseData.lessons === "string") {
      courseData.lessons = JSON.parse(courseData.lessons);
    }
    if (typeof courseData.requirements === "string") {
      courseData.requirements = JSON.parse(courseData.requirements);
    }
    if (typeof courseData.whatYouWillLearn === "string") {
      courseData.whatYouWillLearn = JSON.parse(courseData.whatYouWillLearn);
    }
    if (typeof courseData.instructor === "string") {
      courseData.instructor = JSON.parse(courseData.instructor);
    }

    // Parse lesson video indices - ✅ FIXED
    let lessonVideoIndices = [];
    if (courseData.lessonVideoIndices) {
      lessonVideoIndices = JSON.parse(courseData.lessonVideoIndices);
    }

    console.log("Lesson video indices:", lessonVideoIndices);

    // Get lesson video files - ✅ FIXED
    let lessonVideoFiles = [];
    if (req.files?.lessonVideos) {
      lessonVideoFiles = Array.isArray(req.files.lessonVideos)
        ? req.files.lessonVideos
        : [req.files.lessonVideos];
    }

    console.log("Lesson video files count:", lessonVideoFiles.length);

    // 1. Upload Thumbnail
    if (req.files?.thumbnail?.[0]) {
      console.log("Uploading thumbnail...");
      const result = await uploadToCloudinary(
        req.files.thumbnail[0].path,
        "images/courses",
        "image",
      );
      courseData.thumbnail = {
        public_id: result.public_id,
        url: result.secure_url,
      };
    }

    // 2. Upload Preview Video
    if (req.files?.previewVideo?.[0]) {
      console.log("Uploading preview video...");
      const result = await uploadToCloudinary(
        req.files.previewVideo[0].path,
        "videos/courses/previews",
        "video",
      );
      courseData.shortVideo = {
        public_id: result.public_id,
        url: result.secure_url,
        duration: result.duration || 0,
      };
    }

    // 3. Upload Full Video
    if (req.files?.fullVideo?.[0]) {
      console.log("Uploading full video...");
      const result = await uploadToCloudinary(
        req.files.fullVideo[0].path,
        "videos/courses/full",
        "video",
      );
      courseData.fullVideo = {
        public_id: result.public_id,
        url: result.secure_url,
        duration: result.duration || 0,
      };
    }

    // 4. Upload Instructor Avatar
    if (req.files?.avatar?.[0]) {
      console.log("Uploading avatar...");
      const result = await uploadToCloudinary(
        req.files.avatar[0].path,
        "images/instructors",
        "image",
      );
      courseData.instructor = {
        ...courseData.instructor,
        avatar: result.secure_url,
      };
    }

    // 5. Process Lessons with Videos - ✅ FIXED
    const finalLessons = [];

    if (Array.isArray(courseData.lessons)) {
      for (let i = 0; i < courseData.lessons.length; i++) {
        const lesson = courseData.lessons[i];

        // ✅ CRITICAL: Find if this lesson index exists in video indices array
        const videoIndexPosition = lessonVideoIndices.indexOf(i);

        console.log(
          `Lesson ${i} (${lesson.title}): videoIndexPosition = ${videoIndexPosition}`,
        );

        if (videoIndexPosition !== -1 && lessonVideoFiles[videoIndexPosition]) {
          // This lesson has a new video to upload
          const videoFile = lessonVideoFiles[videoIndexPosition];
          console.log(
            `Uploading video for lesson ${i}: ${videoFile.originalname}`,
          );

          try {
            const result = await uploadToCloudinary(
              videoFile.path,
              `videos/lessons`,
              "video",
            );

            console.log(`Upload success: ${result.public_id}`);
            console.log("Result received:", result);
            console.log("Result keys:", result ? Object.keys(result) : "null");

            finalLessons.push({
              title: lesson.title,
              videoId: result.public_id, // ✅ Cloudinary ID
              videoUrl: result.secure_url, // ✅ Cloudinary URL
              duration: result.duration || lesson.duration || 0,
              isPreview: lesson.isPreview || false,
              order: lesson.order || i + 1,
              resources: lesson.resources || [],
            });
          } catch (uploadErr) {
            console.error(`Failed to upload lesson ${i} video:`, uploadErr);
            // Continue with empty video or throw error
            finalLessons.push({
              title: lesson.title,
              videoId: "",
              videoUrl: "",
              duration: lesson.duration || 0,
              isPreview: lesson.isPreview || false,
              order: lesson.order || i + 1,
              resources: lesson.resources || [],
            });
          }
        } else {
          // No new video for this lesson
          finalLessons.push({
            title: lesson.title,
            videoId: lesson.videoId || "",
            videoUrl: lesson.videoUrl || "",
            duration: lesson.duration || 0,
            isPreview: lesson.isPreview || false,
            order: lesson.order || i + 1,
            resources: lesson.resources || [],
          });
        }
      }
    }

    courseData.lessons = finalLessons;

    console.log(
      "Final lessons saved:",
      finalLessons.map((l) => ({
        title: l.title,
        hasVideo: !!l.videoUrl,
        videoId: l.videoId ? "YES" : "NO",
      })),
    );

    const course = await Course.create(courseData);
    console.log("Course created successfully:", course._id);

    // Cleanup temp files
    if (req.files) {
      Object.values(req.files).forEach((file) => {
        if (Array.isArray(file)) {
          file.forEach((f) => cleanupFiles(f));
        } else {
          cleanupFiles(file);
        }
      });
    }

    res.status(201).json({
      success: true,
      course,
    });
  } catch (error) {
    console.error("Create course error:", error);
    // Cleanup on error
    if (req.files) {
      Object.values(req.files).forEach((file) => {
        if (Array.isArray(file)) {
          file.forEach((f) => cleanupFiles(f));
        } else {
          cleanupFiles(file);
        }
      });
    }
    next(error);
  }
};

// controllers/courseController.js - updateCourse FULL FIX

exports.updateCourse = async (req, res, next) => {
  try {
    console.log("=== UPDATE COURSE ===");
    const { id } = req.params;
    const updateData = { ...req.body };

    // Parse JSON fields
    if (typeof updateData.lessons === "string") {
      updateData.lessons = JSON.parse(updateData.lessons);
    }
    if (typeof updateData.requirements === "string") {
      updateData.requirements = JSON.parse(updateData.requirements);
    }
    if (typeof updateData.whatYouWillLearn === "string") {
      updateData.whatYouWillLearn = JSON.parse(updateData.whatYouWillLearn);
    }
    if (typeof updateData.instructor === "string") {
      updateData.instructor = JSON.parse(updateData.instructor);
    }

    // Parse lesson video indices
    let lessonVideoIndices = [];
    if (updateData.lessonVideoIndices) {
      lessonVideoIndices = JSON.parse(updateData.lessonVideoIndices);
    }

    const existingCourse = await Course.findById(id);
    if (!existingCourse) {
      return next(new AppError("Course not found", 404));
    }

    let lessonVideoFiles = [];
    if (req.files?.lessonVideos) {
      lessonVideoFiles = Array.isArray(req.files.lessonVideos)
        ? req.files.lessonVideos
        : [req.files.lessonVideos];
    }

    console.log("Lesson video indices:", lessonVideoIndices);
    console.log("Lesson video files count:", lessonVideoFiles.length);

    // 1. Update Thumbnail
    if (req.files?.thumbnail?.[0]) {
      if (existingCourse.thumbnail?.public_id) {
        await cloudinary.uploader.destroy(existingCourse.thumbnail.public_id);
      }
      const result = await uploadToCloudinary(
        req.files.thumbnail[0].path,
        "images/courses",
        "image",
      );
      updateData.thumbnail = {
        public_id: result.public_id,
        url: result.secure_url,
      };
    }

    // 2. Update Preview Video
    if (req.files?.previewVideo?.[0]) {
      if (existingCourse.shortVideo?.public_id) {
        await cloudinary.uploader.destroy(existingCourse.shortVideo.public_id, {
          resource_type: "video",
        });
      }
      const result = await uploadToCloudinary(
        req.files.previewVideo[0].path,
        "videos/courses/previews",
        "video",
      );
      updateData.shortVideo = {
        public_id: result.public_id,
        url: result.secure_url,
        duration: result.duration || 0,
      };
    }

    // 3. Update Full Video
    if (req.files?.fullVideo?.[0]) {
      if (existingCourse.fullVideo?.public_id) {
        await cloudinary.uploader.destroy(existingCourse.fullVideo.public_id, {
          resource_type: "video",
        });
      }
      const result = await uploadToCloudinary(
        req.files.fullVideo[0].path,
        "videos/courses/full",
        "video",
      );
      updateData.fullVideo = {
        public_id: result.public_id,
        url: result.secure_url,
        duration: result.duration || 0,
      };
    }

    // 4. Update Instructor Avatar
    if (req.files?.avatar?.[0]) {
      if (existingCourse.instructor?.avatar) {
        try {
          const urlParts = existingCourse.instructor.avatar.split("/");
          const filenameWithExt = urlParts[urlParts.length - 1];
          const publicId = filenameWithExt.split(".")[0];
          if (publicId) {
            await cloudinary.uploader.destroy(`images/instructors/${publicId}`);
          }
        } catch (err) {
          console.log("Old avatar delete error:", err.message);
        }
      }

      const result = await uploadToCloudinary(
        req.files.avatar[0].path,
        "images/instructors",
        "image",
      );

      updateData.instructor = {
        ...(updateData.instructor || existingCourse.instructor),
        avatar: result.secure_url,
      };
    }

    // 5. Process Lessons - ✅ FIXED
    if (Array.isArray(updateData.lessons)) {
      const processedLessons = [];

      for (let i = 0; i < updateData.lessons.length; i++) {
        const lesson = updateData.lessons[i];
        const videoIndexPosition = lessonVideoIndices.indexOf(i);
        const isExistingLesson = lesson._id && !lesson._id.startsWith("temp-");

        console.log(
          `Lesson ${i} (${lesson.title}): videoIndexPosition = ${videoIndexPosition}`,
        );

        if (videoIndexPosition !== -1 && lessonVideoFiles[videoIndexPosition]) {
          // New video uploaded for this lesson
          if (lesson.videoId) {
            try {
              await cloudinary.uploader.destroy(lesson.videoId, {
                resource_type: "video",
              });
              console.log("Deleted old video:", lesson.videoId);
            } catch (err) {
              console.log("Old video delete error:", err.message);
            }
          }

          const result = await uploadToCloudinary(
            lessonVideoFiles[videoIndexPosition].path,
            `videos/lessons/${id}`,
            "video",
          );

          console.log(`Uploaded new video: ${result.public_id}`);
          console.log("Result received:", result);
          console.log("Result keys:", result ? Object.keys(result) : "null");

          processedLessons.push({
            ...(isExistingLesson && { _id: lesson._id }),
            title: lesson.title,
            videoId: result.public_id,
            videoUrl: result.secure_url,
            duration: result.duration || lesson.duration || 0,
            isPreview: lesson.isPreview || false,
            order: lesson.order || i + 1,
            resources: lesson.resources || [],
          });
        } else {
          // Keep existing lesson data
          processedLessons.push({
            ...(lesson._id && { _id: lesson._id }),
            title: lesson.title,
            videoId: lesson.videoId || "",
            videoUrl: lesson.videoUrl || "",
            duration: lesson.duration || 0,
            isPreview: lesson.isPreview || false,
            order: lesson.order || i + 1,
            resources: lesson.resources || [],
          });
        }
      }

      processedLessons.sort((a, b) => (a.order || 0) - (b.order || 0));
      updateData.lessons = processedLessons;

      console.log(
        "Processed lessons:",
        processedLessons.map((l) => ({
          title: l.title,
          hasVideo: !!l.videoUrl,
        })),
      );
    }

    // Update slug if title changed
    if (updateData.title && updateData.title !== existingCourse.title) {
      const slugify = require("slugify");
      updateData.slug =
        slugify(updateData.title, { lower: true, strict: true }) +
        "-" +
        Date.now();
    }

    const course = await Course.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    console.log("Course updated successfully:", course._id);

    // Cleanup
    if (req.files) {
      Object.values(req.files).forEach((file) => {
        if (Array.isArray(file)) {
          file.forEach((f) => cleanupFiles(f));
        } else {
          cleanupFiles(file);
        }
      });
    }

    res.status(200).json({
      success: true,
      course,
    });
  } catch (error) {
    console.error("Update course error:", error);
    if (req.files) {
      Object.values(req.files).forEach((file) => {
        if (Array.isArray(file)) {
          file.forEach((f) => cleanupFiles(f));
        } else {
          cleanupFiles(file);
        }
      });
    }
    next(error);
  }
};

// Get all courses
exports.getAllCourses = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 12,
      sort = "-createdAt",
      category,
      level,
      search,
    } = req.query;

    const query = { isPublished: true };

    if (category) query.category = category;
    if (level) query.level = level;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const courses = await Course.find(query)
      .populate("category", "name slug")
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const total = await Course.countDocuments(query);

    res.status(200).json({
      success: true,
      courses,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get course by slug
exports.getCourseBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;

    const course = await Course.findOne({ slug, isPublished: true }).populate(
      "category",
      "name slug",
    );

    if (!course) {
      return next(new AppError("Course not found", 404));
    }

    course.totalViews += 1;
    await course.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      course,
    });
  } catch (error) {
    next(error);
  }
};

// Delete course
exports.deleteCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const course = await Course.findById(id);

    if (!course) {
      return next(new AppError("Course not found", 404));
    }

    // Delete files from Cloudinary
    const deletePromises = [];

    if (course.thumbnail?.public_id) {
      deletePromises.push(
        cloudinary.uploader.destroy(course.thumbnail.public_id),
      );
    }
    if (course.shortVideo?.public_id) {
      deletePromises.push(
        cloudinary.uploader.destroy(course.shortVideo.public_id, {
          resource_type: "video",
        }),
      );
    }
    if (course.fullVideo?.public_id) {
      deletePromises.push(
        cloudinary.uploader.destroy(course.fullVideo.public_id, {
          resource_type: "video",
        }),
      );
    }

    // Delete lesson videos
    if (course.lessons?.length > 0) {
      course.lessons.forEach((lesson) => {
        if (lesson.videoId && lesson.videoId.includes("smart-chawla")) {
          deletePromises.push(
            cloudinary.uploader.destroy(lesson.videoId, {
              resource_type: "video",
            }),
          );
        }
      });
    }

    await Promise.all(deletePromises);
    await course.deleteOne();

    res.status(200).json({
      success: true,
      message: "Course deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

exports.getMyCourses = async (req, res, next) => {
  try {
    const User = require("../models/userModel");
    const user = await User.findById(req.user.id).populate({
      path: "purchasedCourses.course",
      select: "title slug thumbnail instructor duration level price",
    });

    res.status(200).json({
      success: true,
      courses: user.purchasedCourses || [],
    });
  } catch (error) {
    next(error);
  }
};

exports.updateProgress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { lessonId, progress } = req.body;

    const User = require("../models/userModel");
    const user = await User.findById(req.user.id);

    const courseIndex = user.purchasedCourses.findIndex(
      (pc) => pc.course.toString() === id,
    );

    if (courseIndex === -1) {
      return next(new AppError("Course not found in purchases", 404));
    }

    if (!user.purchasedCourses[courseIndex].completedLessons) {
      user.purchasedCourses[courseIndex].completedLessons = [];
    }

    const lessonIdStr = lessonId.toString();
    const alreadyCompleted = user.purchasedCourses[
      courseIndex
    ].completedLessons.some((lid) => lid.toString() === lessonIdStr);

    if (!alreadyCompleted) {
      user.purchasedCourses[courseIndex].completedLessons.push(lessonId);
    }

    user.purchasedCourses[courseIndex].progress = progress;
    user.purchasedCourses[courseIndex].lastAccessed = new Date();

    await user.save();

    res.status(200).json({
      success: true,
      message: "Progress updated",
    });
  } catch (error) {
    next(error);
  }
};

exports.getCoursePreview = async (req, res, next) => {
  try {
    const { slug } = req.params;

    const course = await Course.findOne({ slug, isPublished: true })
      .select("title description thumbnail shortVideo lessons instructor")
      .lean();

    if (!course) {
      return next(new AppError("Course not found", 404));
    }

    const previewLessons = (course.lessons || []).filter(
      (lesson) => lesson.isPreview,
    );

    res.status(200).json({
      success: true,
      preview: {
        ...course,
        lessons: previewLessons,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getSecureVideoUrl = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const userId = req.user.id;

    const course = await Course.findOne({ slug });

    if (!course) {
      return next(new AppError("Course not found", 404));
    }

    const isEnrolled =
      course.enrolledStudents.some((s) => s.toString() === userId) ||
      req.user.role === "admin";

    if (!isEnrolled) {
      return next(new AppError("You are not enrolled in this course", 403));
    }

    res.status(200).json({
      success: true,
      course,
    });
  } catch (error) {
    next(error);
  }
};

exports.getLessonVideoUrl = async (req, res, next) => {
  try {
    const { courseId, lessonId } = req.params;
    const userId = req.user.id;

    const course = await Course.findById(courseId);

    if (!course) {
      return next(new AppError("Course not found", 404));
    }

    const isEnrolled =
      course.enrolledStudents.some((s) => s.toString() === userId) ||
      req.user.role === "admin";

    if (!isEnrolled) {
      return next(new AppError("Not enrolled", 403));
    }

    const lesson = course.lessons.id(lessonId);
    if (!lesson) {
      return next(new AppError("Lesson not found", 404));
    }

    if (!lesson.isPreview && !isEnrolled) {
      return next(new AppError("Lesson is locked", 403));
    }

    res.status(200).json({
      success: true,
      videoUrl: lesson.videoUrl,
      lesson: {
        title: lesson.title,
        duration: lesson.duration,
      },
    });
  } catch (error) {
    next(error);
  }
};