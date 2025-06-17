const bcrypt = require("bcryptjs");
const { sign, verify } = require("jsonwebtoken");
const { Schema, model } = require("mongoose");

const { jwtSecret } = require("../../config");

const { ObjectId } = Schema.Types;

// Permissions Schema
const entityTypes = ['VERTICAL', 'PROJECT', 'CENTER', 'COURSE', 'BATCH'];
const permissionTypes = ['hierarchical', 'lead_based', 'hybrid'];
const editTypes = [
  'specific_entity_level',
  'specific_entity_with_children',
  'specific_entity_and_children',
  'specific_entities_only',''
];
const verifyTypes = ['global', 'entity_children', 'specific_levels_children',''];

const hierarchicalSelectionSchema = new Schema({
  selected_verticals: [{ type: String }],
  selected_projects: [{ type: String }],
  selected_centers: [{ type: String}],
  selected_courses: [{ type: String}],
  selected_batches: [{ type: String}]
}, { _id: false });

const viewPermissionsSchema = new Schema({
  global: { type: Boolean, default: false },
  hierarchical_selection: {
	type: hierarchicalSelectionSchema,
	required: true,
	default: () => ({
	  selected_verticals: [],
	  selected_projects: [],
	  selected_centers: [],
	  selected_courses: [],
	  selected_batches: []
	})
  }
}, { _id: false });

const addSpecificPermissionSchema = new Schema({
  id: { type: Schema.Types.Mixed },
  permission_level: { type: String, enum: entityTypes },
  selected_entities: [{ type: String }],
  can_add_types: [{ type: String, enum: entityTypes }]
}, { _id: false });

const addPermissionsSchema = new Schema({
  global: { type: Boolean, default: false },
  specific_permissions: [{ type: addSpecificPermissionSchema}]
}, { _id: false });

const editSpecificPermissionSchema = new Schema({
  id: { type: Schema.Types.Mixed },
  edit_type: { type: String, enum: editTypes },
  permission_levels: [{ type: String, enum: entityTypes }],
  with_child_levels: { type: Boolean, default: false },
  specific_entities: [{ type: String}],
  entity_names: [{ type: String }]
}, { _id: false });

const editPermissionsSchema = new Schema({
  global: { type: Boolean, default: false },
  specific_permissions: [{ type: editSpecificPermissionSchema }]
}, { _id: false });

const parentEntitySchema = new Schema({
  entity_type: { type: String, enum: entityTypes },
  entity_id: { type: String },
  entity_name: { type: String }
}, { _id: false });

const verifyPermissionsSchema = new Schema({
  global: { type: Boolean, default: false },
  type: { type: String, enum: verifyTypes, default: '' },
  parent_entities: [{ type: parentEntitySchema }],
  selected_levels: [{ type: String, enum: entityTypes }]
}, { _id: false });

const leadPermissionsSchema = new Schema({
  view_own_leads: { type: Boolean, default: false },
  add_leads: { type: Boolean, default: false },
  edit_leads: { type: Boolean, default: false },
  view_team_leads: { type: Boolean, default: false },
  manage_assignments: { type: Boolean, default: false },
  kyc_verification: { type: Boolean, default: false },
  bulk_status_change: { type: Boolean, default: false },
  bulk_communication: { type: Boolean, default: false }
}, { _id: false });

const permissionsSchema = new Schema({
  is_counseling_team: { type: Boolean, default: false },
  permission_type: { type: String, enum: permissionTypes },
  view_permissions: { type: viewPermissionsSchema},
  add_permissions: { type: addPermissionsSchema },
  edit_permissions: { type: editPermissionsSchema},
  verify_permissions: { type: verifyPermissionsSchema},
  lead_permissions: { type: leadPermissionsSchema},
  
  // ✅ Updated to ObjectId references
  reporting_managers: [{ type: Schema.Types.ObjectId, ref: 'User' }],

user_management: {
	can_view_users: { type: Boolean, default: false },
	can_add_users: { type: Boolean, default: false },
	can_delete_users: { type: Boolean, default: false }
  }
}, { _id: false });
//user schema
const userSchema = new Schema(
	{
		name: { type: String, trim: true },
		email: {
			type: String,
			lowercase: true,
			trim: true,
		},
		mobile: {
			type: Number,
			trim: true,
			// unique: "Mobile number already exists!",
		},
		whatsapp: {
			type: Number,
			trim: true,
			// unique: "Mobile number already exists!",
		},
		_zone: [{ type: ObjectId, ref: "Zone" }],
		cityId: String,
		stateId: String,
		countryId: String,
		address: String,
		designation: String,
		authTokens: [String],
		password: {
			type: String,
			required: false,
		},
		permissions: { type: permissionsSchema, default: () => ({}) },
		passReset: {
			type: Boolean,
			default: false,
		},
		role: { type: Number, trim: true }, // 0-admin, 1-company, 2-college, 3-student, 10-admin view		
		status: {
			type: Boolean,
			default: true,
		},
		isDeleted: {
			type: Boolean,
			default: false,
		},
		isImported: {
			type: Boolean,
			default: false,
		},
		userAddedby:{
			type: ObjectId, ref:'User'
		},
		userUpdatedby:{
			type: ObjectId, ref:'User'
		}
		
		
	},
	{ timestamps: true }
);

userSchema.pre("save", function preSave(next) {
	if (this.isModified("password")) {
		bcrypt.genSalt(10, (err, salt) => {
			bcrypt.hash(this.password, salt, (err2, hash) => {
				this.password = hash;
				next();
			});
		});
	} else {
		next();
	}
});

userSchema.methods = {
	validPassword: function validPassword(password) {
		return bcrypt.compareSync(password, this.password);
	},
	generateAuthToken: async function generateAuthToken() {
		const data = { id: this._id.toHexString() };
		const token = sign(data, jwtSecret).toString();
		if (!this.authTokens || !Array.isArray(this.authTokens))
			this.authTokens = [];
		this.authTokens.push(token);
		await this.save();
		return token;
	},
};

userSchema.statics = {
	deleteToken(token) {
		this.findOneAndUpdate(
			{ authTokens: token },
			{ $pull: { authTokens: token } }
		).exec();
	},

	findByToken(token) {
		try {
			const decoded = verify(token, jwtSeceret);
			return this.findOne({ _id: decoded.id, authTokens: token });
		} catch (err) {
			this.deleteToken(token);
			throw err;
		}
	},
};
module.exports = model("User", userSchema);
