const Bootcamp = require('../models/Bootcamp');

// @desc    Get all bootcamps
// @route   GET /api/vi/bootcamps
// @access  Public
exports.getBootcamps = async (req, res, next) => {
  try {
    const bootcamps = await Bootcamp.find();

    res.status(200).json({
      success: true,
      count: bootcamps.length,
      data: bootcamps
    });
  } catch (error) {
    res.status(400).json({
      success: false
    });
  }
};

// @desc    Get single bootcamp
// @route   GET /api/vi/bootcamps/:id
// @access  Public
exports.getBootcamp = async (req, res, next) => {
  try {
    const bootcamp = await Bootcamp.findById(req.params.id);

    if (!bootcamp) {
      return res.status(404).json({
        success: false,
        msg: 'Bootcamp not found'
      });
    }

    res.status(200).json({
      success: true,
      data: bootcamp
    });
  } catch (error) {
    res.status(400).json({
      success: false
    });
  }
};

// @desc    Create new bootcamp
// @route   POST /api/vi/bootcamps
// @access  Private
exports.createBootcamp = async (req, res, next) => {
  try {
    const bootcamp = await Bootcamp.create(req.body);

    res.status(200).json({
      success: true,
      data: bootcamp
    });
  } catch (error) {
    res.status(400).json({
      success: false
    });
  }
};

// @desc    Update bootcamp
// @route   PUT /api/vi/bootcamps/:id
// @access  Private
exports.updateBootcamp = async (req, res, next) => {
  try {
    let bootcamp = await Bootcamp.findById(req.params.id);

    if (!bootcamp) {
      return res.status(404).json({
        success: false,
        msg: 'Bootcamp not found'
      });
    }

    bootcamp = await Bootcamp.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    res.status(200).json({
      success: true,
      data: bootcamp
    });
  } catch (error) {
    res.status(400).json({
      success: false
    });
  }
};

// @desc    Delete bootcamp
// @route   DELETE /api/vi/bootcamps/:id
// @access  Private
exports.deleteBootcamp = async (req, res, next) => {
  try {
    const bootcamp = await Bootcamp.findById(req.params.id);

    if (!bootcamp) {
      return res.status(404).json({
        success: false,
        msg: 'Bootcamp not found'
      });
    }

    await Bootcamp.findByIdAndDelete(req.params.id);
    res.status(200).json({
      success: true,
      msg: `Deleted bootcamp ${req.params.id}`
    });
  } catch (error) {
    res.status(400).json({
      success: false
    });
  }
};
