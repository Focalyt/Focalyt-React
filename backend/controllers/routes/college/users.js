// server.js
const express = require("express");
const mongoose = require('mongoose');
const cors = require('cors');
const router = express.Router();

const { isCollege, auth1, authenti } = require("../../../helpers");




// Status Model
const User = require('../../models/users');
const College = require('../../models/college');
const Courses = require('../../models/courses');
const Center = require('../../models/center');
const Batch = require('../../models/batch');
const Vertical = require('../../models/verticals');
const Project = require('../../models/Project');
const University = require('../../models/university');
const Qualification = require('../../models/qualification');
const AppliedCourses = require('../../models/appliedCourses');


// Permission Checker Utility Function
const hasPermission = (user, permission) => {
  const permissionType = user.permissions?.permission_type;
  
  if (permissionType === 'Admin') return true;
  
  if (permissionType === 'View Only') {
    const viewPermissions = [
      'can_view_leads', 'can_view_kyc', 'can_view_training', 
      'can_view_users', 'can_bulk_export'
    ];
    return viewPermissions.includes(permission);
  }
  
  if (permissionType === 'Custom' && user.permissions?.custom_permissions) {
    return user.permissions.custom_permissions[permission] || false;
  }
  
  return false;
};

// Middleware to check if user has permission
const checkPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!hasPermission(req.user, permission)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

/**
 * @route   POST /api/users/add
 * @desc    Add new user
 * @access  Private (requires can_add_users permission)
 */
router.post('/add', [checkPermission('can_add_users'), isCollege], async (req, res) => {
  console.log('api called add user')
  try {

    const {
      name,
      email,
      mobile,
      role_designation,
      description,
      reporting_managers,
      access_level,
      permissions
    } = req.body;

    const user = req.user
    const college = user.college

    if(!college){
      return res.status(400).json({
        status: false,
        message: 'College not found'
      });
    }

    // Basic validation
    if (!name || !email || !mobile || !role_designation || !access_level) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, email, mobile, role_designation, access_level'
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // Mobile validation (10 digits)
    if (!/^[0-9]{10}$/.test(mobile.toString())) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number must be exactly 10 digits'
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ 
      email: email.toLowerCase(),
      role: 2,
      isDeleted: false 
    });
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Check if mobile already exists
    const existingMobile = await User.findOne({ 
      mobile: parseInt(mobile),
      role: 2,
      isDeleted: false 
    });
    
    if (existingMobile) {
      return res.status(400).json({
        success: false,
        message: 'User with this mobile number already exists'
      });
    }

    // Map access level to permissions (role will always be 2 for college users)
    let permissionType;
    let customPermissions = {};

    switch (access_level) {
      case 'admin':
        permissionType = 'Admin';
        customPermissions = {};
        break;
        
      case 'view_only':
        permissionType = 'View Only';
        customPermissions = {};
        break;
        
      case 'custom':
        permissionType = 'Custom';
        customPermissions = permissions || {};
        break;
        
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid access level. Must be admin, view_only, or custom'
        });
    }

    // Validate reporting managers if provided
    let validReportingManagers = [];
    if (reporting_managers && reporting_managers.length > 0) {
      const managers = await User.find({
        _id: { $in: reporting_managers },
        isDeleted: false,
        status: true
      });
      
      validReportingManagers = managers.map(manager => manager._id);
      
      if (validReportingManagers.length !== reporting_managers.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more reporting managers not found or inactive'
        });
      }
    }

    // Generate temporary password
    const currentUserId = req.user ? req.user.id : null;

    // Create user object (role is always 2 for college users)
    const newUser = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      mobile: parseInt(mobile),
      designation: role_designation.trim(),
      description: description ? description.trim() : '',
      reporting_managers: validReportingManagers,
      role: 2, // Always 2 for college users
      permissions: {
        permission_type: permissionType,
        custom_permissions: customPermissions
      },
      status: true,
      password: 'Focalyt',
      isDeleted: false,
      userAddedby: currentUserId
    });

    // Save user to database
    const savedUser = await newUser.save();

    // Return success response
    const userResponse = {
      id: savedUser._id,
      name: savedUser.name,
      email: savedUser.email,
      mobile: savedUser.mobile,
      designation: savedUser.designation,
      description: savedUser.description,
      role: savedUser.role,
      access_level: access_level,
      permission_type: permissionType,
      reporting_managers: validReportingManagers,
      status: savedUser.status,
      created_at: savedUser.createdAt
    };


    const updatedCollege = await College.findOneAndUpdate(
      { _id: college._id },
      { $push: { _concernPerson: { _id: savedUser._id, defaultAdmin: false } } },
      { new: true }
    )
    console.log('updatedCollege', updatedCollege)



    res.status(200).json({
      status: true,
      message: `User "${name}" added successfully with ${access_level} access`,
      data: userResponse
    });

  } catch (error) {
    console.error('Add User Error:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        status: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `User with this ${field} already exists`
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error while adding user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/users
 * @desc    Get all users with filtering and pagination
 * @access  Private (requires can_view_users permission)
 */
// router.get('/', checkPermission('can_view_users'), async (req, res) => {
//   try {
//     const { status, role, search, page = 1, limit = 10 } = req.query;
    
//     // Build filter object
//     let filter = { isDeleted: false };
    
//     if (status) {
//       filter.status = status === 'active';
//     }
    
//     if (role) {
//       filter.role = parseInt(role);
//     }
    
//     if (search) {
//       filter.$or = [
//         { name: { $regex: search, $options: 'i' } },
//         { email: { $regex: search, $options: 'i' } },
//         { designation: { $regex: search, $options: 'i' } }
//       ];
//     }

//     // Calculate pagination
//     const skip = (parseInt(page) - 1) * parseInt(limit);
    
//     // Get users with pagination
//     const users = await User.find(filter)
//       .select('-password -authTokens')
//       .populate('reporting_managers', 'name email designation')
//       .populate('userAddedby', 'name email')
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(parseInt(limit));

//     // Get total count
//     const totalUsers = await User.countDocuments(filter);
//     const totalPages = Math.ceil(totalUsers / parseInt(limit));

//     // Format users for frontend
//     const formattedUsers = users.map(user => ({
//       id: user._id,
//       user_id: user._id,
//       name: user.name,
//       email: user.email,
//       mobile: user.mobile,
//       designation: user.designation,
//       description: user.description,
//       role: user.role,
//       access_level: user.permissions?.permission_type === 'Admin' ? 'admin' : 
//                    user.permissions?.permission_type === 'View Only' ? 'view_only' : 'custom',
//       permission_type: user.permissions?.permission_type || 'Custom',
//       permissions: user.permissions?.custom_permissions || {},
//       reporting_managers: user.reporting_managers || [],
//       status: user.status ? 'active' : 'inactive',
//       created_at: user.createdAt,
//       userAddedby: user.userAddedby?.email || 'system'
//     }));

//     res.status(200).json({
//       success: true,
//       data: {
//         users: formattedUsers,
//         pagination: {
//           current_page: parseInt(page),
//           total_pages: totalPages,
//           total_users: totalUsers,
//           per_page: parseInt(limit)
//         }
//       }
//     });

//   } catch (error) {
//     console.error('Get Users Error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching users',
//       error: process.env.NODE_ENV === 'development' ? error.message : undefined
//     });
//   }
// });

/**
 * @route   GET /api/users/reporting-managers
 * @desc    Get active users for reporting manager selection
 * @access  Private (requires can_view_users permission)
 */
router.get('/reporting-managers', checkPermission('can_view_users'), async (req, res) => {
  try {
    const users = await User.find({
      status: true,
      isDeleted: false
    })
    .select('name email designation mobile')
    .sort({ name: 1 });

    const formattedUsers = users.map(user => ({
      user_id: user._id,
      name: user.name,
      email: user.email,
      designation: user.designation,
      mobile: user.mobile
    }));

    res.status(200).json({
      success: true,
      data: formattedUsers
    });

  } catch (error) {
    console.error('Get Reporting Managers Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reporting managers'
    });
  }
});

/**
 * @route   GET /api/users/:userId
 * @desc    Get single user details
 * @access  Private (requires can_view_users permission)
 */
router.get('/:userId', checkPermission('can_view_users'), async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findOne({
      _id: userId,
      isDeleted: false
    })
    .select('-password -authTokens')
    .populate('reporting_managers', 'name email designation')
    .populate('userAddedby', 'name email')
    .populate('userUpdatedby', 'name email');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userDetails = {
      id: user._id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      designation: user.designation,
      description: user.description,
      role: user.role,
      access_level: user.permissions?.permission_type === 'Admin' ? 'admin' : 
                   user.permissions?.permission_type === 'View Only' ? 'view_only' : 'custom',
      permission_type: user.permissions?.permission_type || 'Custom',
      permissions: user.permissions?.custom_permissions || {},
      reporting_managers: user.reporting_managers || [],
      status: user.status ? 'active' : 'inactive',
      created_at: user.createdAt,
      updated_at: user.updatedAt,
      userAddedby: user.userAddedby?.email || 'system',
      userUpdatedby: user.userUpdatedby?.email || null
    };

    res.status(200).json({
      success: true,
      data: userDetails
    });

  } catch (error) {
    console.error('Get User Details Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user details'
    });
  }
});

/**
 * @route   PUT /api/users/:userId/status
 * @desc    Update user status (activate/deactivate)
 * @access  Private (requires can_edit_users permission)
 */
router.put('/:userId/status', checkPermission('can_edit_users'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either active or inactive'
      });
    }

    const user = await User.findOneAndUpdate(
      { _id: userId, isDeleted: false },
      { 
        status: status === 'active',
        userUpdatedby: req.user ? req.user.id : null
      },
      { new: true }
    ).select('-password -authTokens');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: `User status updated to ${status}`,
      data: {
        id: user._id,
        name: user.name,
        status: user.status ? 'active' : 'inactive'
      }
    });

  } catch (error) {
    console.error('Update User Status Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user status'
    });
  }
});

/**
 * @route   DELETE /api/users/:userId
 * @desc    Soft delete user
 * @access  Private (requires can_delete_users permission)
 */
router.delete('/:userId', checkPermission('can_delete_users'), async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findOneAndUpdate(
      { _id: userId, isDeleted: false },
      { 
        isDeleted: true,
        status: false,
        userUpdatedby: req.user.id
      },
      { new: true }
    ).select('name email');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: `User "${user.name}" deleted successfully`,
      data: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Delete User Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user'
    });
  }
});

/**
 * @route   GET /api/users/permissions/matrix
 * @desc    Get permissions matrix for all users
 * @access  Private (requires can_view_users permission)
 */
router.get('/permissions/matrix', checkPermission('can_view_users'), async (req, res) => {
  try {
    const users = await User.find({
      isDeleted: false,
      status: true
    })
    .select('name email designation role permissions')
    .sort({ name: 1 });

    const permissionsList = [
      'can_view_leads', 'can_add_leads', 'can_edit_leads', 'can_assign_leads', 'can_delete_leads',
      'can_view_kyc', 'can_verify_reject_kyc', 'can_request_kyc',
      'can_view_training', 'can_add_vertical', 'can_add_project', 'can_add_center', 
      'can_add_course', 'can_add_batch', 'can_assign_batch',
      'can_view_users', 'can_add_users', 'can_edit_users', 'can_delete_users', 'can_manage_roles',
      'can_bulk_import', 'can_bulk_export', 'can_bulk_update', 'can_bulk_delete', 'can_bulk_communication'
    ];

    const matrix = users.map(user => {
      const userPermissions = {};
      
      permissionsList.forEach(permission => {
        userPermissions[permission] = hasPermission(user, permission);
      });

      return {
        id: user._id,
        name: user.name,
        email: user.email,
        designation: user.designation,
        role: user.role,
        access_level: user.permissions?.permission_type === 'Admin' ? 'admin' : 
                     user.permissions?.permission_type === 'View Only' ? 'view_only' : 'custom',
        permissions: userPermissions
      };
    });

    res.status(200).json({
      success: true,
      data: {
        users: matrix,
        permission_list: permissionsList
      }
    });

  } catch (error) {
    console.error('Get Permissions Matrix Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching permissions matrix'
    });
  }
});

module.exports = router;