

const mongoose = require('mongoose');

const WhatsAppTemplateSchema = new mongoose.Schema({
	collegeId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'College',
		required: true
	},
	templateId: {
		type: String,
		required: false // Facebook/WhatsApp template ID
	},
	templateName: {
		type: String,
		required: true
	},
	language: {
		type: String,
		required: true
	},
	category: {
		type: String,
		enum: ['UTILITY', 'MARKETING', 'AUTHENTICATION'],
		required: true
	},
	status: {
		type: String,
		enum: ['PENDING', 'APPROVED', 'REJECTED', 'PAUSED'],
		default: 'PENDING'
	},
	// For non-carousel templates with IMAGE/VIDEO/DOCUMENT header
	headerMedia: {
		mediaType: {
			type: String,
			enum: ['IMAGE', 'VIDEO', 'DOCUMENT']
		},
		s3Url: String,
		s3Key: String,
		fileName: String
	},
	// For carousel templates
	carouselMedia: [{
		cardIndex: {
			type: Number,
			required: true
		},
		mediaType: {
			type: String,
			enum: ['IMAGE', 'VIDEO']
		},
		s3Url: {
			type: String,
			required: true
		},
		s3Key: {
			type: String,
			required: true
		},
		fileName: String
	}],
	// Variable mappings: stores which numbered variable maps to which named variable
	// Example: [{ position: 1, variableName: 'name' }, { position: 2, variableName: 'email' }]
	// This means {{1}} = name, {{2}} = email
	variableMappings: [{
		position: {
			type: Number,
			required: true
		},
		variableName: {
			type: String,
			required: true
		}
	}],
	createdAt: {
		type: Date,
		default: Date.now
	},
	updatedAt: {
		type: Date,
		default: Date.now
	}
}, {
	timestamps: true
});

// Index for faster lookups
WhatsAppTemplateSchema.index({ collegeId: 1, templateName: 1 });

module.exports = mongoose.model('WhatsAppTemplate', WhatsAppTemplateSchema);

