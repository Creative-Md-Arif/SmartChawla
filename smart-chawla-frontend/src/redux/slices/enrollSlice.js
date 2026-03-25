import { createSlice } from "@reduxjs/toolkit";

// Load enrollments from localStorage
const loadEnrollmentsFromStorage = () => {
  try {
    const savedEnrollments = localStorage.getItem("enrollments");
    return savedEnrollments
      ? JSON.parse(savedEnrollments)
      : {
          items: [], // enrolled courses
          totalAmount: 0,
          courseCount: 0,
        };
  } catch (error) {
    return { items: [], totalAmount: 0, courseCount: 0 };
  }
};

// Save enrollments to localStorage
const saveEnrollmentsToStorage = (enrollments) => {
  try {
    localStorage.setItem("enrollments", JSON.stringify(enrollments));
  } catch (error) {
    console.error("Error saving enrollments:", error);
  }
};

// Calculate totals
const calculateTotals = (items) => {
  return items.reduce(
    (acc, item) => ({
      totalAmount: acc.totalAmount + (item.price || 0),
      courseCount: acc.courseCount + 1,
    }),
    { totalAmount: 0, courseCount: 0 },
  );
};

const initialState = loadEnrollmentsFromStorage();

const enrollSlice = createSlice({
  name: "enrollments",
  initialState,
  reducers: {
    // Course এ enroll করো (cart থেকে checkout এর পর)
    enrollCourse: (state, action) => {
      const {
        courseId,
        title,
        price,
        discountPrice,
        thumbnail,
        instructor,
        duration,
        level,
        enrolledAt = new Date().toISOString(),
      } = action.payload;

      // Check if already enrolled
      const existingIndex = state.items.findIndex(
        (item) => item.courseId === courseId,
      );

      if (existingIndex >= 0) {
        // Already enrolled - update না করো (একবার enroll হলেই হলো)
        console.warn("Already enrolled in this course");
        return;
      }

      // Add new enrollment
      state.items.push({
        courseId,
        title,
        price: discountPrice || price || 0,
        originalPrice: price,
        thumbnail,
        instructor,
        duration,
        level,
        enrolledAt,
        progress: 0, // Course progress percentage
        lastAccessed: enrolledAt,
        completedLessons: [],
        status: "active", // active, completed, paused
      });

      const totals = calculateTotals(state.items);
      state.totalAmount = totals.totalAmount;
      state.courseCount = totals.courseCount;

      saveEnrollmentsToStorage(state);
    },

    // Multiple courses enroll (bulk enrollment)
    enrollMultipleCourses: (state, action) => {
      const courses = action.payload; // array of courses

      courses.forEach((course) => {
        const {
          courseId,
          title,
          price,
          discountPrice,
          thumbnail,
          instructor,
          duration,
          level,
        } = course;

        // Skip if already enrolled
        const alreadyEnrolled = state.items.some(
          (item) => item.courseId === courseId,
        );

        if (!alreadyEnrolled) {
          state.items.push({
            courseId,
            title,
            price: discountPrice || price || 0,
            originalPrice: price,
            thumbnail,
            instructor,
            duration,
            level,
            enrolledAt: new Date().toISOString(),
            progress: 0,
            lastAccessed: new Date().toISOString(),
            completedLessons: [],
            status: "active",
          });
        }
      });

      const totals = calculateTotals(state.items);
      state.totalAmount = totals.totalAmount;
      state.courseCount = totals.courseCount;

      saveEnrollmentsToStorage(state);
    },

    // Remove enrollment (unenroll)
    unenrollCourse: (state, action) => {
      const { courseId } = action.payload;

      state.items = state.items.filter((item) => item.courseId !== courseId);

      const totals = calculateTotals(state.items);
      state.totalAmount = totals.totalAmount;
      state.courseCount = totals.courseCount;

      saveEnrollmentsToStorage(state);
    },

    // Update course progress
    updateProgress: (state, action) => {
      const { courseId, progress, completedLessonId } = action.payload;

      const courseIndex = state.items.findIndex(
        (item) => item.courseId === courseId,
      );

      if (courseIndex >= 0) {
        state.items[courseIndex].progress = progress;
        state.items[courseIndex].lastAccessed = new Date().toISOString();

        // Add completed lesson if provided
        if (completedLessonId) {
          if (
            !state.items[courseIndex].completedLessons.includes(
              completedLessonId,
            )
          ) {
            state.items[courseIndex].completedLessons.push(completedLessonId);
          }
        }

        // Auto-update status if 100% complete
        if (progress >= 100) {
          state.items[courseIndex].status = "completed";
        }

        saveEnrollmentsToStorage(state);
      }
    },

    // Mark course as completed
    markAsCompleted: (state, action) => {
      const { courseId } = action.payload;

      const courseIndex = state.items.findIndex(
        (item) => item.courseId === courseId,
      );

      if (courseIndex >= 0) {
        state.items[courseIndex].progress = 100;
        state.items[courseIndex].status = "completed";
        state.items[courseIndex].lastAccessed = new Date().toISOString();
        state.items[courseIndex].completedAt = new Date().toISOString();

        saveEnrollmentsToStorage(state);
      }
    },

    // Pause/Resume course
    toggleCourseStatus: (state, action) => {
      const { courseId } = action.payload;

      const courseIndex = state.items.findIndex(
        (item) => item.courseId === courseId,
      );

      if (courseIndex >= 0) {
        const currentStatus = state.items[courseIndex].status;
        state.items[courseIndex].status =
          currentStatus === "paused" ? "active" : "paused";
        state.items[courseIndex].lastAccessed = new Date().toISOString();

        saveEnrollmentsToStorage(state);
      }
    },

    // Update last accessed
    updateLastAccessed: (state, action) => {
      const { courseId } = action.payload;

      const courseIndex = state.items.findIndex(
        (item) => item.courseId === courseId,
      );

      if (courseIndex >= 0) {
        state.items[courseIndex].lastAccessed = new Date().toISOString();
        saveEnrollmentsToStorage(state);
      }
    },

    // Clear all enrollments
    clearEnrollments: (state) => {
      state.items = [];
      state.totalAmount = 0;
      state.courseCount = 0;
      saveEnrollmentsToStorage(state);
    },

    // Sync with server data (after login)
    syncEnrollments: (state, action) => {
      const serverEnrollments = action.payload;

      // Merge local and server (server takes priority)
      const mergedItems = [...state.items];

      serverEnrollments.forEach((serverItem) => {
        const localIndex = mergedItems.findIndex(
          (item) => item.courseId === serverItem.courseId,
        );

        if (localIndex >= 0) {
          // Update with server data but keep local progress if newer
          const localDate = new Date(mergedItems[localIndex].lastAccessed);
          const serverDate = new Date(serverItem.lastAccessed);

          mergedItems[localIndex] = {
            ...serverItem,
            progress:
              localDate > serverDate
                ? mergedItems[localIndex].progress
                : serverItem.progress,
            completedLessons:
              localDate > serverDate
                ? mergedItems[localIndex].completedLessons
                : serverItem.completedLessons,
          };
        } else {
          mergedItems.push(serverItem);
        }
      });

      state.items = mergedItems;

      const totals = calculateTotals(state.items);
      state.totalAmount = totals.totalAmount;
      state.courseCount = totals.courseCount;

      saveEnrollmentsToStorage(state);
    },

    // Check if enrolled (utility reducer)
    checkEnrollment: (state, action) => {
      // This doesn't modify state, just for selector use
      return state;
    },
  },
});

// Selectors
export const selectIsEnrolled = (state, courseId) =>
  state.enrollments.items.some((item) => item.courseId === courseId);

export const selectCourseProgress = (state, courseId) => {
  const course = state.enrollments.items.find(
    (item) => item.courseId === courseId,
  );
  return course ? course.progress : 0;
};

export const selectEnrolledCourses = (state) => state.enrollments.items;

export const selectActiveCourses = (state) =>
  state.enrollments.items.filter((item) => item.status === "active");

export const selectCompletedCourses = (state) =>
  state.enrollments.items.filter((item) => item.status === "completed");

export const {
  enrollCourse,
  enrollMultipleCourses,
  unenrollCourse,
  updateProgress,
  markAsCompleted,
  toggleCourseStatus,
  updateLastAccessed,
  clearEnrollments,
  syncEnrollments,
  checkEnrollment,
} = enrollSlice.actions;

export default enrollSlice.reducer;
