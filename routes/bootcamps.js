const express = require('express');
const router = express.Router();

const Bootcamp = require('../models/Bootcamp');
const advancedResults = require('../middlewares/advancedResults');

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
  .post(createBootcamp);

router
  .route('/:id')
  .get(getBootcamp)
  .put(updateBootcamp)
  .delete(deleteBootcamp);

router.route('/:id/photo').put(bootcampPhotoUpload);

// Re-route into other resource routers
router.use('/:bootcampId/courses', courseRoute);

router.route('/radius/:zipcode/:distance').get(getBootcampsInRadius);

module.exports = router;
