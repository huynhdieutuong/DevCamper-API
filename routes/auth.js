const express = require('express');
const router = express.Router();

const { protect } = require('../middlewares/auth');

const {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  updateDetails,
  updatePassword,
  updateEmail,
  confirmationEmail,
  resendToken
} = require('../controllers/auth');

router.route('/register').post(register);

router.route('/confirmation/:token').get(confirmationEmail);

// router.route('/resend').get(protect, resendToken);

router.route('/login').post(login);

router.route('/me').get(protect, getMe);

router.route('/updatedetails').put(protect, updateDetails);

router.route('/updatepassword').put(protect, updatePassword);

router.route('/updateemail').post(protect, updateEmail);

router.route('/forgotpassword').post(forgotPassword);

router.route('/resetpassword/:resettoken').put(resetPassword);

module.exports = router;
