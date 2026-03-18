// server.js
const express = require("express");
const mongoose = require('mongoose');
const cors = require('cors');
const router = express.Router();

const { isCollege, auth1, authenti, logUserActivity, getAllTeamMembers } = require("../../../helpers");




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
const Source = require('../../models/source');

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
 * 
 * 
 */

router.get('/', isCollege, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const user = req.user;

    const query = { '_concernPerson._id': user._id };
    // const totalCount = await College.countDocuments(query);

    const colleges = await College.find(query)
      .populate({
        path: '_concernPerson._id',
        select: 'name email mobile designation permissions reporting_managers createdAt status my_team'
      })
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    let users = await Promise.all(colleges.flatMap(college => college._concernPerson.map(concernPerson => concernPerson._id)));

    for (let user of users) {
      user.my_team = await getAllTeamMembers(user?._id)
    }

    totalCount = users.length

    // Fetch user details


    res.json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalUsers: totalCount,
          limit
        }
      }
    });

  } catch (err) {
    console.error('Error in GET /users:', err);
    res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
});

router.post('/add', [isCollege, checkPermission('can_add_users'), logUserActivity((req) => `Add user: ${req.body.name}`)], async (req, res) => {

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

    if (!college) {
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

    validReportingManagers.map(async (manager) => {
      const managerUser = await User.findOne({ _id: manager });
      if (managerUser) {
        managerUser.my_team.push(savedUser._id);
        await managerUser.save();
      }
    });



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
    // console.log('updatedCollege', updatedCollege)



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

//update User

router.post('/update/:userId', [isCollege, checkPermission('can_update_users'), logUserActivity((req) => `Update user: ${req.body.name}`)], async (req, res) => {
  try {

    let body = req.body;

    body.permission = body.permissions;
    // console.log(body, 'body')


    let user = req.user
    let { userId } = req.params;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    if (typeof userId === 'string') {
      userId = new mongoose.Types.ObjectId(userId);
    }

    let editUser = await User.findById(userId);
    if (!editUser) {
      return res.status(400).json({
        success: false,
        message: 'User not found'
      });
    }


    if (body.email) {

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.email)) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid email address'
        });
      }
    }

    if (body.mobile) {
      // Mobile validation (10 digits)
      if (!/^[0-9]{10}$/.test(body.mobile.toString())) {
        return res.status(400).json({
          success: false,
          message: 'Mobile number must be exactly 10 digits'
        });
      }
    }

    // Check if email already exists

    if (body.email && body.email !== editUser.email) {
      const existingUser = await User.findOne({
        email: body.email.toLowerCase(),
        role: 2,
        isDeleted: false,
        _id: { $ne: userId }
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists'
        });
      }
    }


    if (body.mobile && body.mobile !== editUser.mobile) {
      // Check if mobile already exists
      const existingMobile = await User.findOne({
        mobile: parseInt(body.mobile),
        role: 2,
        isDeleted: false,
        _id: { $ne: userId }
      });

      if (existingMobile) {
        return res.status(400).json({
          success: false,
          message: 'User with this mobile number already exists'
        });
      }


    }

    // Map access level to permissions (role will always be 2 for college users)


    if (body.access_level) {

      switch (body.access_level) {
        case 'admin':
          body.permissions = {}
          body.permissions.permission_type = 'Admin';
          body.permissions.custom_permissions = {};
          break;

        case 'view_only':
          body.permissions = {}
          body.permissions.permission_type = 'View Only';
          body.permissions.custom_permissions = {};
          break;

        case 'custom':
          body.permissions = {}
          body.permissions.permission_type = 'Custom';
          body.permissions.custom_permissions = body.permission || {};
          break;

        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid access level. Must be admin, view_only, or custom'
          });
      }
      delete body.access_level;
    }

    if (body.reporting_managers) {
      const oldReportingManagers = editUser.reporting_managers.map(manager => manager.toString());
      const newReportingManagers = body.reporting_managers.map(manager => manager.toString());

      const removedManagers = oldReportingManagers.filter(manager =>
        !newReportingManagers.includes(manager)  // Ensure you're comparing the correct format (e.g., ObjectId as string)
      );

      // console.log('Removed Managers:', removedManagers);

      for (let removedManager of removedManagers) {
        removedManager = new mongoose.Types.ObjectId(removedManager);
        await User.updateOne(
          { _id: removedManager },  // Find the manager by ID
          { $pull: { my_team: userId } }  // Remove the userId from the 'my_team' array
        );
      }

      body.reporting_managers = await Promise.all(
        body.reporting_managers.map(async (manager) => {
          // Always convert to ObjectId if string
          if (typeof manager === 'string') {
            manager = new mongoose.Types.ObjectId(manager);
          }

          // console.log('manager', manager)
          // console.log('userId', userId)

          // Update the reporting manager and add userId to their my_team array if it's not already there
          const updateMyTeam = await User.findOneAndUpdate(
            { _id: manager },
            { $addToSet: { my_team: userId } },  // Using $addToSet to avoid duplicates
            { new: true }
          );


          return updateMyTeam._id;
        })
      );
    }




    // Generate temporary password
    const currentUserId = req.user ? req.user.id : null;

    if (currentUserId) {
      body.userUpdatedby = currentUserId;
    }




    // Save user to database
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: body },
      { new: true }
    );

    res.status(200).json({
      status: true,
      message: `User "${body.name}" updated successfully with ${body.permission.permissionType} access`,
      data: updatedUser
    });

  } catch (error) {
    console.error('Update User Error:', error);

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
      message: 'Internal server error while updating user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});


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
router.delete('/:userId', [isCollege, checkPermission('can_delete_users'), logUserActivity((req) => `Delete user: ${req.body.name}`)], async (req, res) => {
  try {
    let { userId } = req.params;
    if (typeof userId === 'string') {
      userId = new mongoose.Types.ObjectId(userId);
    }
    // Remove this user from other users' reporting_managers arrays
    await User.updateMany(
      { reporting_managers: userId },
      { $pull: { reporting_managers: userId } }
    );

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

router.post('/restore/:userId', [isCollege, checkPermission('can_delete_users'), logUserActivity((req) => `Restore user: ${req.body.name}`)], async (req, res) => {
  try {
    let { userId } = req.params;
    // console.log('userId', userId)
    if (typeof userId === 'string') {
      userId = new mongoose.Types.ObjectId(userId);
    }
    const user = await User.findOneAndUpdate(
      { _id: userId, isDeleted: true },
      { isDeleted: false, status: true, userUpdatedby: req.user.id },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    res.status(200).json({
      success: true,
      message: `User "${user.name}" restored successfully`,
      data: user
    });
  } catch (error) {
    console.error('Restore User Error:', error);
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

router.post('/reset-password', async (req, res) => {
  try {
    const { module, userInput, password } = req.body;

    // console.log('userInput', userInput, 'module', module)
    let user = null;
    const isMobile = /^\d{10}$/.test(userInput); // 10 digit check

    if (isMobile) {
      user = await User.findOne({ mobile: parseInt(userInput), role: 2 });
    } else {
      user = await User.findOne({ email: userInput.toLowerCase(), role: 2 });
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.password = password;
    await user.save();
    res.json({
      status: true,
      message: 'Password reset successfully',
      data: user
    });
  } catch (err) {
    console.error('Error in POST /add-user:', err);
    res.status(500).json({
      status: false,
      message: "Server Error"
    });
  }
});
router.post('/reset-trainer-password', async (req, res) => {
  try {
    const { module, userInput, password } = req.body;

    // console.log('userInput', userInput, 'module', module)
    let user = null;
    const isMobile = /^\d{10}$/.test(userInput); // 10 digit check

    if (isMobile) {
      user = await User.findOne({ mobile: parseInt(userInput), role: 4 });
    } else {
      user = await User.findOne({ email: userInput.toLowerCase(), role: 4 });
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.password = password;
    await user.save();
    res.json({
      status: true,
      message: 'Password reset successfully',
      data: user
    });
  } catch (err) {
    console.error('Error in POST /add-user:', err);
    res.status(500).json({
      status: false,
      message: "Server Error"
    });
  }
});

router.get('/users-details/:userId', [isCollege, checkPermission('can_view_users')], async (req, res) => {
  try {
    const { userId } = req.params;

    let user = await User.findOne({
      _id: userId,
    })
    const my_team = await getAllTeamMembers(userId)
    // console.log('my_team', my_team)
    user.my_team = my_team
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    res.status(200).json({
      status: true,
      data: user
    });
  } catch (error) {
    console.error('Get User Details Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user details'
    });
  }
});


router.post("/addSource", isCollege, async (req, res) => {
  try {
  
    const { name, mobile } = req.body;
    // console.log("source data" , req.body)
    const source = new Source({ name, mobile });
    // console.log("source" , source)
    await source.save();
    res.status(200).json({
      success: true,
      message: 'Source added successfully',
      data: source
    });
  } catch (error) {
    console.log(error);
  }
});

router.get('/sources', isCollege, async (req, res) => {
  try {
    const sources = await Source.find({});
    res.status(200).json({
      success: true,
      data: sources
    });
  } catch (error) {
    console.log(error);
  }
});

router.put('/updateSource/:sourceId', isCollege, async (req, res) => {
  try {
    const { sourceId } = req.params;
    const { name, mobile } = req.body;
    const source = await Source.findByIdAndUpdate(sourceId, { name, mobile }, { new: true });
    res.status(200).json({
      success: true,
      message: 'Source updated successfully',
      data: source
    });
  } catch (error) {
    console.log(error);
  }
});

router.get('/b2b-users', isCollege, async (req, res) => {

  try {

    const user = req.user;
    console.log('👥 [BACKEND] /b2b-users - Request from user:', {
      userId: user._id.toString(),
      userName: user.name,
      permissionType: user.permissions?.permission_type
    });

    // Find college where current user is concern person
    const college = await College.findOne({ "_concernPerson._id": new mongoose.Types.ObjectId(user._id) });
    
    if (!college) {
      console.log('⚠️ [BACKEND] No college found for user');
      return res.status(200).json({
        success: true,
        data: []
      });
    }

    console.log('🏫 [BACKEND] College found:', {
      collegeId: college._id.toString(),
      concernPersonsCount: college._concernPerson?.length || 0
    });

    // Get all concern persons from college
    const concernPersonIds = college._concernPerson?.map(cp => cp._id) || [];
    console.log('👤 [BACKEND] Concern Person IDs:', concernPersonIds.map(id => id.toString()));

    // Fetch all users who are concern persons
    const allConcernPersons = await User.find({
      _id: { $in: concernPersonIds }
    }).select('_id name email permissions').lean();

    console.log('📋 [BACKEND] All Concern Persons:', {
      total: allConcernPersons.length,
      users: allConcernPersons.map(u => ({
        id: u._id.toString(),
        name: u.name,
        hasPermission: u.permissions?.custom_permissions?.can_view_leads_b2b || false,
        permissionType: u.permissions?.permission_type,
        isAdmin: u.permissions?.permission_type === 'Admin'
      }))
    });

    // Filter: Users with can_view_leads_b2b permission OR Admin users
    const finalUsers = allConcernPersons
      .filter(u => {
        const hasPermission = u.permissions?.custom_permissions?.can_view_leads_b2b || false;
        const isAdmin = u.permissions?.permission_type === 'Admin';
        return hasPermission || isAdmin;
      })
      .map(u => ({
        _id: u._id,
        name: u.name
      }));

    console.log('✅ [BACKEND] Filtered Users (can_view_leads_b2b OR Admin):', {
      total: finalUsers.length,
      users: finalUsers.map(u => ({
        id: u._id.toString(),
        name: u.name
      }))
    });

    console.log('📊 [BACKEND] Final Users List:', {
      total: finalUsers.length,
      users: finalUsers.map(u => ({
        id: u._id.toString(),
        name: u.name
      }))
    });

    res.status(200).json({
      success: true,
      data: finalUsers
    });

  }

  catch (err) {

    console.error('❌ [BACKEND] Error fetching b2b users:', err);

    res.status(500).json({
      success: false,
      message: 'Error fetching b2b users'
    });
  }
})
module.exports = router;