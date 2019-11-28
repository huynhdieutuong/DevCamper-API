const express = require('express');
const router = express.Router();

const Bootcamp = require('../models/Bootcamp');
const advancedResults = require('../middlewares/advancedResults');

const { protect } = require('../middlewares/auth');

// Include other resource routers
const courseRoute = require('./courses');

const {
  getBootcamps,
  getBootcamp,
  createBootcamp,
  updateBootcamp,
  deleteBootcamp,
  getBootcampsInRadius,
  bootcampPhotoUpload
} = require('../controllers/bootcamps');

router
  .route('/')
  .get(advancedResults(Bootcamp, 'courses'), getBootcamps)
  .post(protect, createBootcamp);

router
  .route('/:id')
  .get(getBootcamp)
  .put(protect, updateBootcamp)
  .delete(protect, deleteBootcamp);

router.route('/:id/photo').put(protect, bootcampPhotoUpload);

// Re-route into other resource routers
router.use('/:bootcampId/courses', courseRoute);

router.route('/radius/:zipcode/:distance').get(getBootcampsInRadius);

module.exports = router;
