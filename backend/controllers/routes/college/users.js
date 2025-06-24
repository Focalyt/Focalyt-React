// server.js
const express = require("express");
const mongoose = require('mongoose');
const cors = require('cors');
const router = express.Router();

const { isCollege, auth1, authenti, logUserActivity } = require("../../../helpers");




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
  console.log(user, 'user')
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
    const totalCount = await College.countDocuments(query);

    const colleges = await College.find(query)
      .populate({
        path: '_concernPerson._id',
        select: 'name email mobile designation permissions reporting_managers createdAt status'
      })
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    // Helper to resolve verify permissions parent entities - Add this near other helper functions
    const resolveParentEntities = async (parentEntities) => {
      const resolved = [];
      for (const parentEntity of parentEntities) {
        try {
          const entities = await getEntityNames([parentEntity.entity_id], parentEntity.entity_type);
          if (entities.length > 0) {
            resolved.push({
              id: parentEntity.entity_id,
              name: entities[0].name,
              type: parentEntity.entity_type,
              originalName: parentEntity.entity_name
            });
          }
        } catch (error) {
          console.error('Error resolving parent entity:', parentEntity, error);
        }
      }
      return resolved;
    };

    // Helper function to get entity names with correct model names
    const getEntityNames = async (entityIds, entityType) => {
      try {
        let Model;
        switch (entityType) {
          case 'VERTICAL':
            Model = Vertical;
            break;
          case 'PROJECT':
            Model = Project;
            break;
          case 'CENTER':
            Model = Center;
            break;
          case 'COURSE':
            Model = Courses; // ← आपका correct model name
            break;
          case 'BATCH':
            Model = Batch;
            break;
          default:
            console.log(`Unknown entity type: ${entityType}`);
            return [];
        }

        const entities = await Model.find({
          _id: { $in: entityIds }
        }).select('name').lean();

        return entities.map(entity => ({
          id: entity._id.toString(),
          name: entity.name
        }));
      } catch (error) {
        console.error(`Error fetching ${entityType}:`, error);
        return [];
      }
    };

    // Helper to resolve entity_names format (like "CENTER_id")
    const resolveEntityNames = async (entityKeys) => {
      console.log('entityKeys', entityKeys); // Debug log
      const resolved = [];

      for (const key of entityKeys) {
        try {
          const [type, id] = key.split('_');
          console.log(`Resolving: ${type} with ID: ${id}`); // Debug log

          const entities = await getEntityNames([id], type);
          if (entities.length > 0) {
            resolved.push({
              id: id,
              name: entities[0].name,
              type: type
            });
            console.log(`Resolved: ${entities[0].name} (${type})`); // Debug log
          } else {
            console.log(`No entity found for ${type}_${id}`); // Debug log
          }
        } catch (error) {
          console.error('Error resolving entity:', key, error);
        }
      }
      return resolved;
    };

    // Process users (rest of the code remains same)
    const usersWithSimplifiedAccess = await Promise.all(
      colleges.flatMap(college =>
        college._concernPerson.map(async (concernPerson) => {
          const userData = concernPerson._id;
          const permissions = userData.permissions || {};

          // 1. VIEW PERMISSIONS
          let viewPermissions = {
            type: permissions.view_permissions?.global ? 'Global' : 'Specific',
            global: permissions.view_permissions?.global || false,
            entities: {
              verticals: [],
              projects: [],
              centers: [],
              courses: [],
              batches: []
            },
            summary: { verticals: 0, projects: 0, centers: 0, courses: 0, batches: 0 }
          };

          if (!permissions.view_permissions?.global && permissions.view_permissions?.hierarchical_selection) {
            const hs = permissions.view_permissions.hierarchical_selection;

            if (hs.selected_verticals?.length > 0) {
              viewPermissions.entities.verticals = await getEntityNames(hs.selected_verticals, 'VERTICAL');
              viewPermissions.summary.verticals = viewPermissions.entities.verticals.length;
            }
            if (hs.selected_projects?.length > 0) {
              viewPermissions.entities.projects = await getEntityNames(hs.selected_projects, 'PROJECT');
              viewPermissions.summary.projects = viewPermissions.entities.projects.length;
            }
            if (hs.selected_centers?.length > 0) {
              viewPermissions.entities.centers = await getEntityNames(hs.selected_centers, 'CENTER');
              viewPermissions.summary.centers = viewPermissions.entities.centers.length;
            }
            if (hs.selected_courses?.length > 0) {
              viewPermissions.entities.courses = await getEntityNames(hs.selected_courses, 'COURSE');
              viewPermissions.summary.courses = viewPermissions.entities.courses.length;
            }
            if (hs.selected_batches?.length > 0) {
              viewPermissions.entities.batches = await getEntityNames(hs.selected_batches, 'BATCH');
              viewPermissions.summary.batches = viewPermissions.entities.batches.length;
            }
          }

          // 2. ADD PERMISSIONS
          let addPermissions = {
            type: permissions.add_permissions?.global ? 'Global' : 'Specific',
            global: permissions.add_permissions?.global || false,
            permissions: [],
            count: 0
          };

          if (!permissions.add_permissions?.global && permissions.add_permissions?.specific_permissions) {
            for (const perm of permissions.add_permissions.specific_permissions) {
              let entities = [];
              if (perm.selected_entities?.length > 0) {
                entities = await getEntityNames(perm.selected_entities, perm.permission_level);
              }

              addPermissions.permissions.push({
                level: perm.permission_level,
                entities: entities,
                canAddTypes: perm.can_add_types || [],
                summary: `Can add ${(perm.can_add_types || []).join(', ')} in ${entities.length} ${perm.permission_level?.toLowerCase()}(s)`
              });
            }
            addPermissions.count = addPermissions.permissions.length;
          }

          // 3. EDIT PERMISSIONS
          let editPermissions = {
            type: permissions.edit_permissions?.global ? 'Global' : 'Specific',
            global: permissions.edit_permissions?.global || false,
            permissions: [],
            count: 0
          };

          if (!permissions.edit_permissions?.global && permissions.edit_permissions?.specific_permissions) {
            for (const perm of permissions.edit_permissions.specific_permissions) {
              let entities = [];
              let summary = '';

              if (perm.edit_type === 'specific_entity_level') {
                summary = `Can edit all entities at: ${(perm.permission_levels || []).join(', ')} levels`;
              } else if (perm.edit_type === 'specific_entity_with_children') {
                summary = `Can edit all entities at: ${(perm.permission_levels || []).join(', ')} levels + children`;
              } else if (perm.entity_names?.length > 0) {
                entities = await resolveEntityNames(perm.entity_names);
                summary = `Can edit specific entities: ${entities.map(e => e.name).join(', ')}`;
              }

              editPermissions.permissions.push({
                editType: perm.edit_type,
                levels: perm.permission_levels || [],
                entities: entities,
                withChildren: perm.with_child_levels || false,
                summary: summary
              });
            }
            editPermissions.count = editPermissions.permissions.length;
          }

          // 4. VERIFY PERMISSIONS - Add this after editPermissions
          let verifyPermissions = {
            type: permissions.verify_permissions?.type || 'Not set',
            global: permissions.verify_permissions?.global || false,
            permissions: [],
            count: 0,
            summary: 'No verify permissions set'
          };

          if (permissions.verify_permissions?.type) {
            if (permissions.verify_permissions.type === 'global') {
              verifyPermissions.summary = 'Can verify any content anywhere in the system';
              verifyPermissions.count = 1;
            }
            else if (permissions.verify_permissions.type === 'entity_children') {
              // Specific Entity's Children
              if (permissions.verify_permissions.parent_entities?.length > 0) {
                const parentEntities = await resolveParentEntities(permissions.verify_permissions.parent_entities);
                verifyPermissions.permissions = [{
                  type: 'entity_children',
                  parentEntities: parentEntities,
                  summary: `Can verify all children of: ${parentEntities.map(e => `${e.name} (${e.type})`).join(', ')}`
                }];
                verifyPermissions.count = parentEntities.length;
                verifyPermissions.summary = `Can verify children of ${parentEntities.length} parent entities`;
              }
            }
            else if (permissions.verify_permissions.type === 'specific_levels_children') {
              // Specific Entity Levels' Children
              if (permissions.verify_permissions.selected_levels?.length > 0) {
                const selectedLevels = permissions.verify_permissions.selected_levels;
                verifyPermissions.permissions = [{
                  type: 'levels_children',
                  selectedLevels: selectedLevels,
                  summary: `Can verify children of entities at: ${selectedLevels.join(', ')} levels`
                }];
                verifyPermissions.count = selectedLevels.length;
                verifyPermissions.summary = `Can verify children at ${selectedLevels.length} entity levels`;
              }
            }
          }

          // 4. LEAD PERMISSIONS
          const leadPermissions = {
            enabled: Object.values(permissions.lead_permissions || {}).filter(Boolean).length,
            details: permissions.lead_permissions || {}
          };

          return {
            _id: userData._id,
            name: userData.name,
            email: userData.email,
            mobile: userData.mobile,
            designation: userData.designation,
            status: userData.status,
            createdAt: userData.createdAt,
            defaultAdmin: concernPerson.defaultAdmin,
            college: {
              _id: college._id,
              name: college.name,
              type: college.type
            },
            accessSummary: {
              permissionType: permissions.permission_type || 'Not set',
              viewPermissions,
              addPermissions,
              editPermissions,
              leadPermissions,
              verifyPermissions,
              reportingManagers: userData.reporting_managers?.length || 0
            }
          };
        })
      )
    );

    res.json({
      success: true,
      data: {
        users: usersWithSimplifiedAccess,
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

//update User

router.post('/update/:userId', [isCollege, checkPermission('can_update_users'), logUserActivity((req) => `Update user: ${req.body.name}`)], async (req, res) => {
  console.log('api called add user')
  try {

    let body = req.body;
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

    if(body.email && body.email !== editUser.email){
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


  if(body.mobile && body.mobile !== editUser.mobile){
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
          body.permission = {}
          body.permission.permissionType = 'Admin';
          body.permission.customPermissions = {};
          break;

        case 'view_only': 
          body.permission = {}
          body.permission.permissionType = 'View Only';
          body.permission.customPermissions = {};
          break;

        case 'custom':
          body.permission = {}
          body.permission.permissionType = 'Custom';
          body.permission.customPermissions = body.permissions || {};
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
      
      console.log('Removed Managers:', removedManagers);

      for (let removedManager of removedManagers) {
        removedManager = new mongoose.Types.ObjectId(removedManager);
        await User.updateOne(
          { _id: removedManager },  // Find the manager by ID
          { $pull: { my_team: userId } }  // Remove the userId from the 'my_team' array
        );
      }

      body.reporting_managers = await Promise.all(
        body.reporting_managers.map(async (manager) => {
          if (typeof manager === 'string') {
            return new mongoose.Types.ObjectId(manager);
          }
          
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

    if(currentUserId){
      body.userUpdatedby = currentUserId;
    }

    // Save user to database
    const updatedUser = await User.findByIdAndUpdate(userId, body, { new: true });
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

router.post('/reset-password', async (req, res) => {
  try {
    const { module, userInput, password } = req.body;

    console.log('userInput', userInput, 'module', module)
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

router.get('/users-details/:userId', [isCollege, checkPermission('can_view_users')], async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findOne({
      _id: userId,
      isDeleted: false
    })
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


module.exports = router;