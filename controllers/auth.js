const crypto = require('crypto');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middlewares/async');
const User = require('../models/User');
const Token = require('../models/Token');

const sendEmail = require('../utils/sendEmail');

// @desc    Register user
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password, role } = req.body;

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    role
  });

  // Create a verification token for this user
  const token = crypto.randomBytes(16).toString('hex');

  await Token.create({
    user: user._id,
    email: user.email,
    token: crypto
      .createHash('sha256')
      .update(token)
      .digest('hex'),
    tokenExpire:
      Date.now() + process.env.VERIFICATION_TOKEN_EXPIRE * 60 * 60 * 1000
  });

  // Send email
  const tokenUrl = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/auth/confirmation/${token}`;

  const message = `Hello ${user.name},\n\n Please verify your account by clicking the link below: \n\n ${tokenUrl}`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Account verification token',
      message
    });

    res.status(200).json({
      success: true,
      data: `A verification email has been sent to ${user.email}.`
    });
  } catch (error) {
    console.error(error);

    return next(new ErrorResponse('Verification email could not be sent', 500));
  }
});

// @desc    Confirmation email
// @route   GET /api/v1/auth/confirmation/:token
// @access  Public
exports.confirmationEmail = asyncHandler(async (req, res, next) => {
  // Get hashed token
  const confirmationToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  // Check token
  const token = await Token.findOne({
    token: confirmationToken,
    tokenExpire: { $gt: Date.now() }
  });
  if (!token) {
    return next(new ErrorResponse('Invalid token', 400));
  }

  // Update status verified and email
  const user = await User.findByIdAndUpdate(
    token.user,
    { isVerified: true, email: token.email },
    { runValidators: true, new: true }
  );

  // Delete token
  await Token.findByIdAndDelete(token._id);

  sendTokenResponse(user, 200, res);
});

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Validate email & password
  if (!email || !password) {
    return next(new ErrorResponse('Please provide an email and password', 400));
  }

  // Check for user
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // Check for password
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // Make sure the user has been verified
  if (!user.isVerified) {
    return next(new ErrorResponse('Your account has not been verified', 401));
  }

  sendTokenResponse(user, 200, res);
});

// @desc    Get logged in user
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  res.status(200).json({
    success: true,
    data: req.user
  });
});

// @desc    Forgot password
// @route   POST /api/v1/auth/forgotpassword
// @access  Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(
      new ErrorResponse(
        `There is no user with the email address ${req.body.email}`,
        404
      )
    );
  }

  const resetToken = user.getResetPasswordToken();

  await user.save({ validateBeforeSave: false });

  // Send email
  const resetUrl = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/auth/resetpassword/${resetToken}`;

  const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Password reset token',
      message
    });

    res.status(200).json({
      success: true,
      data: 'Email sent'
    });
  } catch (error) {
    console.error(error);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save({ validateBeforeSave: false });

    return next(new ErrorResponse('Reset email could not be sent', 500));
  }
});

// @desc    Reset password
// @route   PUT /api/v1/auth/resetpassword/:resettoken
// @access  Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
  // Get hashed token
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resettoken)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() }
  });

  if (!user) {
    return next(new ErrorResponse('Invalid token', 400));
  }

  // Set new password
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save({ validateBeforeSave: false });

  sendTokenResponse(user, 200, res);
});

// @desc    Update user details
// @route   PUT /api/v1/auth/updatedetails
// @access  Private
exports.updateDetails = asyncHandler(async (req, res, next) => {
  const { name, role } = req.body;
  const fieldToUpdate = {};
  if (name) fieldToUpdate.name = name;
  if (role) fieldToUpdate.role = role;

  const user = await User.findByIdAndUpdate(req.user._id, fieldToUpdate, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Update user password
// @route   PUT /api/v1/auth/updatepassword
// @access  Private
exports.updatePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  let user = await User.findById(req.user._id).select('password');

  if (!currentPassword || !newPassword) {
    return next(
      new ErrorResponse('Please enter current password and new password', 400)
    );
  }

  if (!(await user.matchPassword(currentPassword))) {
    return next(new ErrorResponse('Current password is incorrect', 401));
  }

  user.password = newPassword;
  await user.save();

  sendTokenResponse(user, 200, res);
});

// @desc    Update user email
// @route   POST /api/v1/auth/updateemail
// @access  Private
exports.updateEmail = asyncHandler(async (req, res, next) => {
  const { newEmail } = req.body;

  // Check if not new email
  if (!newEmail) {
    return next(new ErrorResponse('Please enter a new email', 400));
  }

  // Check if duplicate current email
  if (newEmail === req.user.email) {
    return next(new ErrorResponse('This is your current email', 400));
  }

  // Create token
  const token = crypto.randomBytes(16).toString('hex');

  await Token.create({
    user: req.user._id,
    email: newEmail,
    token: crypto
      .createHash('sha256')
      .update(token)
      .digest('hex'),
    tokenExpire:
      Date.now() + process.env.VERIFICATION_TOKEN_EXPIRE * 60 * 60 * 1000
  });

  // Send email
  const tokenUrl = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/auth/confirmation/${token}`;

  const message = `Hello ${req.user.name}, \n\n Please verify your account by clicking the link below: \n\n ${tokenUrl}`;

  try {
    await sendEmail({
      email: newEmail,
      subject: 'Confirm to update email',
      message
    });

    res.status(200).json({
      success: true,
      data: `A verification email has been sent to ${newEmail}.`
    });
  } catch (error) {
    console.error(error);

    return next(new ErrorResponse('Verification email could not be sent', 500));
  }
});

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token
    });
};
