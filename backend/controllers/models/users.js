const bcrypt = require("bcryptjs");
const { sign, verify } = require("jsonwebtoken");
const { Schema, model } = require("mongoose");

const { jwtSecret } = require("../../config");

const { ObjectId } = Schema.Types;

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
		designation: String,
		trainerBriefSummary: String,
		cv: String,
		passportSizePhoto: String,
		cityId: String,
		stateId: String,
		countryId: String,
		address: String,
		reporting_managers: [ObjectId],
		my_team: [ObjectId],
		authTokens: [String],
		permissions: {
			permission_type: { type: String, default: 'Admin' },
			custom_permissions: {
				// Lead Management (B2B)
				can_view_leads_b2b: { type: Boolean, default: false },
				can_add_leads_b2b: { type: Boolean, default: false },
				can_edit_leads_b2b: { type: Boolean, default: false },
				can_assign_leads_b2b: { type: Boolean, default: false },
				can_delete_leads_b2b: { type: Boolean, default: false },

				can_view_leads: { type: Boolean, default: false },
				can_add_leads: { type: Boolean, default: false },
				can_edit_leads: { type: Boolean, default: false },
				can_assign_leads: { type: Boolean, default: false },
				can_delete_leads: { type: Boolean, default: false },

				// KYC Verification
				can_view_kyc: { type: Boolean, default: false },
				can_verify_reject_kyc: { type: Boolean, default: false },
				can_request_kyc: { type: Boolean, default: false },

				// Training Management
				can_view_training: { type: Boolean, default: false },
				can_add_vertical: { type: Boolean, default: false },
				can_add_project: { type: Boolean, default: false },
				can_add_center: { type: Boolean, default: false },
				can_add_course: { type: Boolean, default: false },
				can_add_batch: { type: Boolean, default: false },
				can_assign_batch: { type: Boolean, default: false },

				// User Management
				can_view_users: { type: Boolean, default: false },
				can_add_users: { type: Boolean, default: false },
				can_edit_users: { type: Boolean, default: false },
				can_delete_users: { type: Boolean, default: false },
				can_manage_roles: { type: Boolean, default: false },

				// Bulk Actions
				can_bulk_import: { type: Boolean, default: false },
				can_bulk_export: { type: Boolean, default: false },
				can_bulk_update: { type: Boolean, default: false },
				can_bulk_delete: { type: Boolean, default: false },
				can_bulk_communication: { type: Boolean, default: false }
			}
		},
		password: {
			type: String,
			required: false,
		},

		passReset: {
			type: Boolean,
			default: false,
		},
		role: { type: Number, trim: true }, // 0-admin, 1-company, 2-college, 3-student, 4 trainer, 10-admin view		
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
		userAddedby: {
			type: ObjectId, ref: 'User'
		},
		userUpdatedby: {
			type: ObjectId, ref: 'User'
		},
		source: {
			type: String,
			default: 'website'
		},
		googleAuthToken: {
			// Access token (better naming)
			accessToken: {
				type: String,
				default: ''
			},

			// Token expiry time (better naming)
			expiresAt: {
				type: Date,
				index: true // Index for efficient expiry checks
			},

			// Refresh token
			refreshToken: {
				type: String,
				default: ''
			},

			// Scopes as array (more flexible)
			scopes: {
				type: [String], // Array of strings
				default: []
			},

			// Additional useful fields
			tokenType: {
				type: String,
				default: 'Bearer'
			},

			// When tokens were last updated
			lastUpdated: {
				type: Date,
				default: Date.now
			},

			// ID token (for user profile info)
			idToken: {
				type: String,
				default: ''
			}
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
