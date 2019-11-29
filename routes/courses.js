const express = require('express');
const router = express.Router({ mergeParams: true });

const Course = require('../models/Course');
const advancedResults = require('../middlewares/advancedResults');

const { protect, authorize } = require('../middlewares/auth');

const {
  getCourses,
  getCourse,
  addCourse,
  deleteCourse,
  updateCourse
} = require('../controllers/courses');

router
  .route('/')
  .get(
    advancedResults(Course, {
      path: 'bootcamp',
      select: 'name description'
    }),
    getCourses
  )
  .post(protect, authorize('publisher', 'admin'), addCourse);

router
  .route('/:id')
  .get(getCourse)
  .delete(protect, authorize('publisher', 'admin'), deleteCourse)
  .put(protect, authorize('publisher', 'admin'), updateCourse);

module.exports = router;
