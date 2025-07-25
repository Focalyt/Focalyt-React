const express = require("express");
const axios = require("axios");
const router = express.Router();

// Import models
const User = require('../../../models/users');
const College = require('../../../models/college');

// Import config
const { authKey, templateId, msg91Url } = require("../../../../config");

/**
 * @route   POST /api/android/login/send-otp
 * @desc    Send OTP to mobile number for Android login
 * @access  Public
 */
router.post('/send-otp', async (req, res) => {
  try {
    const { mobile } = req.body;

    // Validate mobile number
    if (!mobile || !/^\d{10}$/.test(mobile)) {
      return res.status(400).json({
        status: false,
        message: 'Please provide a valid 10-digit mobile number'
      });
    }

    // Check if user exists with role 2 (college user)
    const user = await User.findOne({ mobile: parseInt(mobile), role: 2 });
    
    if (!user) {
      return res.status(404).json({
        status: false,
        message: 'User not found. Please contact your administrator.'
      });
    }

    if (user.status === false) {
      return res.status(403).json({
        status: false,
        message: 'Your account has been disabled. Please contact support.'
      });
    }

    // Send OTP via MSG91
    const url = msg91Url
      .replace("<<template>>", templateId)
      .replace("<<mobile>>", mobile)
      .replace("<<auth>>", authKey);

    const data = await axios.get(url);
    
    if (data.data.type !== 'success') {
      return res.status(500).json({
        status: false,
        message: 'Failed to send OTP. Please try again.'
      });
    }
    console.log(data.data);

    return res.status(200).json({
      status: true,
      message: 'OTP sent successfully to your mobile number'
    });

  } catch (err) {
    console.error('Send OTP Error:', err);
    return res.status(500).json({
      status: false,
      message: 'Something went wrong. Please try again.'
    });
  }
});

/**
 * @route   POST /api/android/login/verify-otp
 * @desc    Verify OTP and login user for Android
 * @access  Public
 */
router.post('/verify-otp', async (req, res) => {
  try {
    const { mobile, otp } = req.body;

    // Validate inputs
    if (!mobile || !otp) {
      return res.status(400).json({
        status: false,
        message: 'Mobile number and OTP are required'
      });
    }

    if (!/^\d{10}$/.test(mobile)) {
      return res.status(400).json({
        status: false,
        message: 'Please provide a valid 10-digit mobile number'
      });
    }

    // Verify OTP with MSG91
    const url = `https://control.msg91.com/api/verifyRequestOTP.php?authkey=${authKey}&mobile=91${mobile}&otp=${otp}`;
    
    const result = await axios.get(url);
    
    // Check if OTP is valid (including test OTP '2025')
    if (result.data.type === 'status' || result.data.message === "already_verified" || otp === '2025') {
      
      // Find user
      const user = await User.findOne({ mobile: parseInt(mobile), role: 2 });
      console.log('user' , user);
      
      if (!user) {
        return res.status(404).json({
          status: false,
          message: 'User not found'
        });
      }
    //   console.log('user' , user);
      if (user.status === false) {
        return res.status(403).json({
          status: false,
          message: 'Your account has been disabled'
        });
      }

      console.log('user._id' , user._id);

      // Find associated college
      const college = await College.findOne({ '_concernPerson._id': user._id });

      console.log('college' , college);

      if (!college) {
        return res.status(404).json({
          status: false,
          message: 'College information not found'
        });
      }

      // Extract isDefaultAdmin from _concernPerson
      const concernPersonData = college._concernPerson.find(p => p._id.toString() === user._id.toString());
      const isDefaultAdmin = concernPersonData?.isDefaultAdmin || false;

      // Generate authentication token
      const token = await user.generateAuthToken();

      // Prepare user data
      const userData = user;

      return res.status(200).json({
        status: true,
        message: 'Login successful',
        data: {
          user: userData,
          token
        }
      });

    } else {
      return res.status(400).json({
        status: false,
        message: 'Invalid OTP. Please try again.'
      });
    }

  } catch (err) {
    console.error('Verify OTP Error:', err);
    return res.status(500).json({
      status: false,
      message: 'Something went wrong. Please try again.'
    });
  }
});

/**
 * @route   POST /api/android/login/logout
 * @desc    Logout user and invalidate token
 * @access  Private
 */
router.post('/logout', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        status: false,
        message: 'Token is required'
      });
    }

    // Remove token from user's authTokens array
    await User.findOneAndUpdate(
      { authTokens: token },
      { $pull: { authTokens: token } }
    );

    return res.status(200).json({
      status: true,
      message: 'Logged out successfully'
    });

  } catch (err) {
    console.error('Logout Error:', err);
    return res.status(500).json({
      status: false,
      message: 'Something went wrong'
    });
  }
});

/**
 * @route   GET /api/android/login/profile
 * @desc    Get user profile information
 * @access  Private
 */
router.get('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        status: false,
        message: 'Authentication token required'
      });
    }

    // Find user by token
    const user = await User.findOne({ authTokens: token, role: 2 });
    
    if (!user) {
      return res.status(401).json({
        status: false,
        message: 'Invalid or expired token'
      });
    }

    // Find associated college
    const college = await College.findOne({
      _concernPerson: { $elemMatch: { _id: user._id } }
    }, "name _concernPerson");

    if (!college) {
      return res.status(404).json({
        status: false,
        message: 'College information not found'
      });
    }

    // Extract isDefaultAdmin from _concernPerson
    const concernPersonData = college._concernPerson.find(p => p._id.toString() === user._id.toString());
    const isDefaultAdmin = concernPersonData?.isDefaultAdmin || false;

    const userData = {
      _id: user._id,
      name: user.name,
      role: 2,
      email: user.email,
      mobile: user.mobile,
      designation: user.designation,
      collegeName: college.name,
      collegeId: college._id,
      isDefaultAdmin,
      status: user.status
    };

    return res.status(200).json({
      status: true,
      data: userData
    });

  } catch (err) {
    console.error('Profile Error:', err);
    return res.status(500).json({
      status: false,
      message: 'Something went wrong'
    });
  }
});

module.exports = router;
