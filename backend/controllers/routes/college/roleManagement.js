const express = require("express");
const mongoose = require('mongoose');
const { Roles, User, College } = require("../../models");


const { isCollege, auth1, logUserActivity } = require("../../../helpers");

const router = express.Router();

router.use(isCollege);





router.post('/add-role', logUserActivity('role-added'), async (req, res) => {
	try {
		const { roleName, description, permissions } = req.body;

		// Check if role already exists
		const existing = await Roles.findOne({ roleName });
		if (existing) {
			return res.status(400).json({ success: false, message: 'Role already exists' });
		}

		const role = new Roles({
			roleName,
			description,
			permissions: permissions.map(key => ({ key }))
		});

		await role.save();
		return res.status(201).json({ success: true, message: 'Role created successfully', data: role });

	} catch (error) {
		console.error('Error creating role:', error);
		return res.status(500).json({ success: false, message: 'Internal server error' });
	}
});

router.put('/edit-role/:id', logUserActivity((req) => `Updated role: ${req.body.roleName}`), async (req, res) => {
	try {
		const { id } = req.params;
		const { roleName, description, permissions } = req.body;

		const role = await Roles.findById(id);
		if (!role) {
			return res.status(404).json({ success: false, message: 'Role not found' });
		}

		role.roleName = roleName;
		role.description = description;
		role.permissions = permissions.map(key => ({ key }));

		await role.save();

		return res.status(200).json({ success: true, message: 'Role updated successfully', data: role });
	} catch (err) {
		console.error('Error updating role:', err);
		return res.status(500).json({ success: false, message: 'Internal server error' });
	}
});


router.get('/all-roles', logUserActivity('Visit all roles page'), async (req, res) => {
	try {
		const roles = await Roles.find().sort({ createdAt: -1 });
		return res.status(200).json({ success: true, data: roles });
	} catch (error) {
		console.error('Error fetching roles:', error);
		return res.status(500).json({ success: false, message: 'Internal server error' });
	}
});

router.get('/all-roleslist', async (req, res) => {
	try {
		const roles = await Roles.find().sort({ createdAt: -1 });

		const formattedRoles = roles.map(role => ({
			_id: role._id,
			roleName: role.roleName,
			description: role.description,
			permissions: role.permissions.map(p => p.key)
		}));

		// Create rolePermissions map
		const rolePermissionsMap = {};
		formattedRoles.forEach(role => {
			rolePermissionsMap[role.roleName] = role.permissions;
		});

		return res.status(200).json({
			success: true,
			data: formattedRoles,
			rolePermissions: rolePermissionsMap  // send this to frontend
		});

	} catch (error) {
		console.error('Error fetching roles:', error);
		return res.status(500).json({ success: false, message: 'Internal server error' });
	}
});



router.delete('/delete-role/:id', logUserActivity((req) => `Deleted role id: ${req.params.id}`), async (req, res) => {
	try {
		let roleId = req.params.id;

		if (!roleId) {
			return res.status(404).json({ success: false, message: 'Role id is not defined' });
		};

		// Validate ObjectId
		if (!mongoose.Types.ObjectId.isValid(roleId)) {
			return res.status(400).json({ success: false, message: 'Invalid role ID' });
		};

		// Convert to ObjectId
		roleId = new mongoose.Types.ObjectId(roleId);

		// Check if role exists
		const role = await Roles.findById(roleId);
		if (!role) {
			return res.status(404).json({ success: false, message: 'Role not found' });
		}

		// Check if any users have this role assigned
		const usersWithRole = await User.find({ roleId: roleId });
		if (usersWithRole.length > 0) {
			return res.status(400).json({
				success: false,
				message: `Cannot delete role "${role.roleName}" because it is assigned to ${usersWithRole.length} user(s).`,
			});
		}

		// Proceed to delete role
		await Roles.findByIdAndDelete(roleId);

		return res.status(200).json({ success: true, message: 'Role deleted successfully' });
	} catch (err) {
		console.error('Error deleting role:', err);
		return res.status(500).json({ success: false, message: 'Server error' });
	}
});

// router.post("/users/add-concern-person", logUserActivity((req) => `Add user: ${req.body.name}`),
// 	async (req, res) => {
// 		try {
// 			const {	name,email,	mobile,designation,permissions } = req.body;
// 			const user = req.user

// 			const college =  await College.findOne({'_concernPerson._id':user._id})


// 			const collegeId = college._id

// 			console.log('college',college)
// 			console.log('collegeId',collegeId)

// 			// 1. Validation
// 			if (!collegeId || !email || !mobile || !name || !designation || !permissions) {
// 				return res.status(400).json({ status: false, error: "All fields are required" });
// 			}
// 			// 2. Check existing user
// 			const existingUser = await User.findOne({
// 				$or: [{ email }, { mobile }],
// 				isDeleted: false,
// 				role: 2
// 			});

// 			if (existingUser) {
// 				return res.status(400).json({ status: false, error: "Email or mobile already exists" });
// 			}

// 			// 3. Create new user
// 			const newUser = await User.create({
// 				name,
// 				collegeId,
// 				email,
// 				mobile,
// 				role: 2,
// 				password: 'Focalyt@123',
// 				designation,
// 				permissions,
// 				userAddedby:user._id
// 			});

// 			if (!newUser) {
// 				return res.status(500).json({ status: false, error: "User creation failed" });
// 			}

// 			// 4. Add to _concernPerson array
// 			const updatedCollege = await College.findByIdAndUpdate(
// 				collegeId,
// 				{ $addToSet: { _concernPerson: { _id: newUser._id } } },
// 				{ new: true }
// 			);

// 			if (!updatedCollege) {
// 				return res.status(500).json({ status: false, error: "Failed to update college" });
// 			}

// 			return res.status(200).json({ status: true, message: "Concerned person added successfully", userId: newUser._id });
// 		} catch (err) {
// 			console.error("Add concern person error:", err.message);
// 			return res.status(500).json({ status: false, error: err.message });
// 		}
// 	});

router.put("/users/:id", logUserActivity((req) => `Edit user: ${req.body.name}`), async (req, res) => {
	try {
		const { id } = req.params;
		const { name, email, mobile, designation, password, confirmPassword } = req.body;

		if (password && password !== confirmPassword) {
			return res.status(400).json({ status: false, error: "Passwords do not match" });
		}

		const user = await User.findById(id);
		if (!user) return res.status(404).json({ status: false, error: "User not found" });

		user.name = name;
		user.email = email;
		user.mobile = mobile;
		user.designation = designation;
		if (password) user.password = password; // will be hashed by pre-save hook

		await user.save();
		return res.status(200).json({ status: true, message: "User updated successfully" });
	} catch (err) {
		console.error("Update user error:", err.message);
		return res.status(500).json({ status: false, error: err.message });
	}
});

// GET /college/users/concern-persons/:collegeId
router.get("/users/concern-persons/:collegeId", async (req, res) => {
	try {
		const { collegeId } = req.params;

		if (!collegeId) return res.status(400).json({ success: false, message: "College ID missing" });

		if (typeof collegeId === 'string') {
			new mongoose.Types.ObjectId(collegeId)
		}

		const college = await College.findById(collegeId);

		if (!college) {
			return res.status(404).json({ success: false, message: "College not found" });
		}

		return res.status(200).json({ success: true, users: college._concernPerson });
	} catch (err) {
		console.error("Error fetching concern persons:", err.message);
		return res.status(500).json({ success: false, message: "Server error" });
	}
});

module.exports = router;
