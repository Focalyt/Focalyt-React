const express = require('express');
const router = express.Router();
const axios = require('axios');
const AWS = require("aws-sdk");
const uuid = require('uuid/v1');
const multer = require('multer');
const FormData = require('form-data');
const { College, WhatsAppMessage } = require('../../models');
const {isCollege}  = require('../../../helpers');
const {
	accessKeyId,
	secretAccessKey,
	bucketName,
	region,
} = require("../../../config");

// Configure AWS S3
AWS.config.update({
	accessKeyId,
	secretAccessKey,
	region,
});
const s3 = new AWS.S3({ region, signatureVersion: 'v4' });

const allowedVideoExtensions = ['mp4', 'mkv', 'mov', 'avi', 'wmv'];
const allowedImageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
const allowedExtensions = [...allowedVideoExtensions, ...allowedImageExtensions, 'pdf'];

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
	storage: storage,
	limits: {
		fileSize: 25 * 1024 * 1024, // 25MB limit for WhatsApp
	},
	fileFilter: (req, file, cb) => {
		const ext = file.originalname.split('.').pop().toLowerCase();
		if (allowedExtensions.includes(ext)) {
			cb(null, true);
		} else {
			cb(new Error(`File type not supported: ${ext}`), false);
		}
	}
});



router.get('/templates', [isCollege], async (req, res) => {
	try {    
      // Get environment variables for Facebook API
      const businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
      const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
      if (!businessAccountId || !accessToken) {
        res.status(500).json({ success: false, message: 'WhatsApp Business Account ID or Access Token not configured in environment variables.' });
        return;
      }
		
    const response = await axios.get(
      `https://graph.facebook.com/v18.0/${businessAccountId}/message_templates`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        params: {
          fields: 'id,name,status,category,language,components,quality_score,rejected_reason,code_expiration_minutes'
        }
      }
    );
		
// console.log("response",response.data)

		res.json({
			success: true,
			message: 'Templates fetched successfully',
			data: response.data.data || []
		});
	} catch (err) {
		console.error('Error fetching whatsapp templates:', err);
		res.status(500).json({ success: false, message: 'Server error' });
	}
});

// Sync templates from Meta
router.post('/sync-templates', isCollege, async (req, res) => {
	try {
		// Make API call to sync templates from Meta
		const response = await axios.get('https://wa.jflindia.co.in/api/v1/whatsapp/syncTemplatesFromMeta', {
			params: {
				apiKey: process.env.WHATSAPP_API_TOKEN
			},
			headers: {
				'accept': 'application/json',
				'x-phone-id': process.env.WHATSAPP_PHONE_ID,
				'x-api-key': process.env.WHATSAPP_API_TOKEN
			}
		});

		// Send WebSocket notification
		if (global.wsServer) {
			global.wsServer.sendWhatsAppNotification(req.collegeId, {
				type: 'templates_synced',
				message: 'Templates synced successfully from Meta',
				timestamp: new Date().toISOString()
			});
		}

		res.json({
			success: true,
			message: 'Templates synced successfully from Meta',
			data: response.data
		});

	} catch (error) {
		console.error('Error syncing templates from Meta:', error);
		
		// Handle specific error cases
		let errorMessage = 'Failed to sync templates from Meta';
		if (error.response?.data?.message) {
			errorMessage = error.response.data.message;
		} else if (error.response?.data?.error) {
			errorMessage = error.response.data.error;
		}

		// Send WebSocket error notification
		if (global.wsServer) {
			global.wsServer.sendWhatsAppNotification(req.collegeId, {
				type: 'templates_sync_error',
				error: errorMessage,
				timestamp: new Date().toISOString()
			});
		}

		res.status(500).json({ 
			success: false, 
			message: errorMessage,
			error: error.response?.data || error.message
		});
	}
});

// Create WhatsApp template
router.post('/create-template', isCollege, upload.array('file', 5), async (req, res) => {
	try {
		const { name, language, category, components, base64File, carouselFiles } = req.body;
		let files = req.files;

    // console.log(req.body, "req.body");
		console.log("Files", files);

		// Validate required fields
		if (!name || !language || !category || !components) {
			return res.status(400).json({ 
				success: false, 
				message: 'Name, language, category, and components are required' 
			});
		}

		// Validate category
		const validCategories = ['UTILITY', 'MARKETING', 'AUTHENTICATION'];
		if (!validCategories.includes(category)) {
			return res.status(400).json({ 
				success: false, 
				message: 'Invalid category. Must be one of: UTILITY, MARKETING, AUTHENTICATION' 
			});
		}

		// Validate components structure
		if (!Array.isArray(components) || components.length === 0) {
			return res.status(400).json({ 
				success: false, 
				message: 'Components must be a non-empty array' 
			});
		}

		// Get environment variables for Facebook API
		const businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
		const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

		if (!businessAccountId || !accessToken) {
			return res.status(500).json({ 
				success: false, 
				message: 'WhatsApp Business Account ID or Access Token not configured' 
			});
		}

		// Handle file uploads to Facebook if files are provided
		let uploadedFiles = [];
		let carouselUploadedFiles = [];
		
		// Function to upload file using Facebook Resumable Upload API
		const uploadFileToFacebook = async (fileName, fileBuffer, contentType) => {
			try {
				// Get Facebook App ID from environment
				const facebookAppId = process.env.FACEBOOK_APP_ID;
				if (!facebookAppId) {
					throw new Error('FACEBOOK_APP_ID not configured in environment variables');
				}


				// Step 1: Start upload session
				const uploadSessionResponse = await axios.post(
					`https://graph.facebook.com/v23.0/${facebookAppId}/uploads`,
					{
						file_name: fileName,
						file_length: fileBuffer.length,
						file_type: contentType
					},
					{
						headers: {
							'Authorization': `Bearer ${accessToken}`,
							'Content-Type': 'application/json'
						}
					}
				);

				const uploadSessionId = uploadSessionResponse.data.id.replace('upload:', '');
				
				if (!uploadSessionId) {
					throw new Error('Failed to create upload session');
				}

				// Step 2: Upload file data
				const uploadResponse = await axios.post(
					`https://graph.facebook.com/v23.0/upload:${uploadSessionId}`,
					fileBuffer,
					{
						headers: {
							'Authorization': `Bearer ${accessToken}`,
							'file_offset': '0',
							'Content-Type': contentType
						},
						maxContentLength: Infinity,
						maxBodyLength: Infinity,
						timeout: 30000
					}
				);

				const fileHandle = uploadResponse.data.h;
				
				return fileHandle;
			} catch (error) {
				console.error('Error uploading file to Facebook:', error.response?.data || error.message);
				throw error;
			}
		};
		
		// Handle base64 files first (as this is how files are coming from frontend)
		if (base64File && base64File.name && base64File.body) {
			
			const ext = base64File.name?.split('.').pop().toLowerCase();
			
			if (!allowedExtensions.includes(ext)) {
				console.log("File type not supported");
				throw new Error(`File type not supported: ${ext}`);
			}

			// // Special handling for video files
			// if (allowedVideoExtensions.includes(ext)) {
			// 	console.log(`Processing video file: ${base64File.name}, extension: ${ext}`);
			// }

			let fileType = "document";
			if (allowedImageExtensions.includes(ext)) {
				fileType = "image";
			} else if (allowedVideoExtensions.includes(ext)) {
				fileType = "video";
			}

			// Convert base64 to buffer
			const base64Data = base64File.body.replace(/^data:[^;]+;base64,/, '');
			const buffer = Buffer.from(base64Data, 'base64');

			// Determine content type based on file extension
			let contentType = `image/${ext}`;
			if (allowedVideoExtensions.includes(ext)) {
				// Map video extensions to proper MIME types
				if (ext === 'mp4') {
					contentType = 'video/mp4';
				} else if (ext === '3gpp') {
					contentType = 'video/3gpp';
				} else {
					contentType = `video/${ext}`;
				}
			} else if (ext === 'pdf') {
				contentType = 'application/pdf';
			}

			// Upload to Facebook using Resumable Upload API
			const fileHandle = await uploadFileToFacebook(base64File.name, buffer, contentType);
			
			uploadedFiles.push({
				fileHandle: fileHandle,
				fileType,
				fileName: base64File.name,
			});
			
		}
		
		// Handle multipart files (fallback for direct file uploads)
		else if (files && files.length > 0) {
			const filesArray = Array.isArray(files) ? files : [files];
			const uploadPromises = [];

			filesArray.forEach((item) => {
				const { name: fileName, mimetype } = item;
				const ext = fileName?.split('.').pop().toLowerCase();

				console.log(`Processing File: ${fileName}, Extension: ${ext}`);

				if (!allowedExtensions.includes(ext)) {
					console.log("File type not supported");
					throw new Error(`File type not supported: ${ext}`);
				}

				let fileType = "document";
				if (allowedImageExtensions.includes(ext)) {
					fileType = "image";
				} else if (allowedVideoExtensions.includes(ext)) {
					fileType = "video";
				}

				uploadPromises.push(
					uploadFileToFacebook(fileName, item.data, mimetype).then((fileHandle) => {
						uploadedFiles.push({
							fileHandle: fileHandle,
							fileType,
							fileName,
						});
					})
				);
			});

			await Promise.all(uploadPromises);
		}

		// Handle carousel file uploads
		if (carouselFiles && carouselFiles.length > 0) {
			const carouselUploadPromises = [];
			
			carouselFiles.forEach((carouselFile) => {
				const { name: fileName, body: base64Data, cardIndex } = carouselFile;
				
				// Convert base64 to buffer
				const buffer = Buffer.from(base64Data, 'base64');
				
				// Determine content type based on file extension
				const ext = fileName.split('.').pop().toLowerCase();
				let contentType = `image/${ext}`;
				if (allowedVideoExtensions.includes(ext)) {
					if (ext === 'mp4') {
						contentType = 'video/mp4';
					} else if (ext === '3gpp') {
						contentType = 'video/3gpp';
					} else {
						contentType = `video/${ext}`;
					}
				} else if (ext === 'pdf') {
					contentType = 'application/pdf';
				}
				
				carouselUploadPromises.push(
					uploadFileToFacebook(fileName, buffer, contentType).then((fileHandle) => {
						carouselUploadedFiles.push({
							fileHandle: fileHandle,
							cardIndex: cardIndex,
							fileName: fileName
						});
					})
				);
			});
			
			await Promise.all(carouselUploadPromises);
		}

		// Prepare template data for Facebook API
		const templateData = {
			name,
			language,
			category,
			components: []
		};

		// Process components and add file URLs if files were uploaded
		let fileIndex = 0;
		components.forEach((component) => {
			const processedComponent = { ...component };
			
			// Handle carousel components
			if (component.type === 'carousel' && component.cards) {
				processedComponent.cards = component.cards.map((card, cardIndex) => {
					const processedCard = { ...card };
					
					// Find uploaded file for this card
					const cardFile = carouselUploadedFiles.find(file => file.cardIndex === cardIndex);
					
					if (cardFile) {
						// Update header component with file handle
						processedCard.components = card.components.map(comp => {
							if (comp.type === 'header' && comp.format) {
								return {
									...comp,
									example: {
										header_handle: [cardFile.fileHandle]
									}
								};
							}
							return comp;
						});
					}
					
					return processedCard;
				});
			}
			// Handle HEADER components with media
			else if (component.type === 'HEADER' && component.format && uploadedFiles[fileIndex]) {
				// Facebook API expects example with header_handle array containing file handle
				processedComponent.example = {
					header_handle: [uploadedFiles[fileIndex].fileHandle]
				};
				console.log(`Added example for HEADER component:`, processedComponent.example);
				fileIndex++;
			}
			// If HEADER has format but no uploaded file, this might cause the error
			else if (component.type === 'HEADER' && component.format && !uploadedFiles[fileIndex]) {
				console.log(`Warning: HEADER component with format ${component.format} but no uploaded file found`);
			}
			// Handle HEADER components without media (TEXT format)
			else if (component.type === 'HEADER' && component.format === 'TEXT' && component.text) {
				processedComponent.example = {
					header_text: [component.text]
				};
			}
			
			// Handle BUTTONS component - ensure proper structure
			if (component.type === 'BUTTONS' && component.buttons) {
				processedComponent.buttons = component.buttons.map(button => ({
					type: button.type,
					text: button.text,
					...(button.url && { url: button.url })
				}));
			}
			
			// Remove example property if it's empty or undefined
			if (!processedComponent.example || Object.keys(processedComponent.example).length === 0) {
				delete processedComponent.example;
			}
			
			templateData.components.push(processedComponent);
		});


		// Create template directly via Facebook Graph API
		const response = await axios.post(
			`https://graph.facebook.com/v23.0/${businessAccountId}/message_templates`,
			templateData,
			{
				headers: {
					'Authorization': `Bearer ${accessToken}`,
					'Content-Type': 'application/json'
				}
			}
		);

		res.json({
			success: true,
			message: 'Template created successfully',
			data: {
				templateName: name,
				templateId: response.data?.id,
				category,
				language,
				uploadedFiles: uploadedFiles.map(file => ({
					fileName: file.fileName,
					fileType: file.fileType,
					fileHandle: file.fileHandle
				})),
				carouselFiles: carouselUploadedFiles.map(file => ({
					fileName: file.fileName,
					cardIndex: file.cardIndex,
					fileHandle: file.fileHandle
				})),
				response: response.data
			}
		});

	} catch (error) {
		console.error('Error creating WhatsApp template:', error);
		
		// Handle specific error cases
		let errorMessage = 'Failed to create template';
		if (error.response?.data?.error?.message) {
			errorMessage = error.response.data.error.message;
		} else if (error.response?.data?.message) {
			errorMessage = error.response.data.message;
		} else if (error.response?.data?.error) {
			errorMessage = error.response.data.error;
		}

		res.status(500).json({ 
			success: false, 
			message: errorMessage,
			error: error.response?.data || error.message
		});
	}
});

// Delete WhatsApp template
router.delete('/delete-template/:id', isCollege, async (req, res) => {
	try {
		const { id } = req.params;

		// Validate template ID
		if (!id) {
			return res.status(400).json({ 
				success: false, 
				message: 'Template ID is required' 
			});
		}

		console.log(`Deleting template with ID: ${id}`);

		// Delete template via external API
		const response = await axios.delete(`https://wa.jflindia.co.in/api/v1/messageTemplate/${id}`, {
			headers: {
				'accept': 'application/json',
				'x-phone-id': process.env.WHATSAPP_PHONE_ID,
				'Content-Type': 'application/json',
				'x-api-key': process.env.WHATSAPP_API_TOKEN
			}
		});

    console.log(response, "response");

		res.json({
			success: true,
			message: 'Template deleted successfully',
			data: {
				templateId: id,
				response: response.data
			}
		});

	} catch (error) {
		console.error('Error deleting WhatsApp template:', error);
		
		// Handle specific error cases
		let errorMessage = 'Failed to delete template';
		if (error.response?.data?.message) {
			errorMessage = error.response.data.message;
		} else if (error.response?.data?.error) {
			errorMessage = error.response.data.error;
		}

		res.status(500).json({ 
			success: false, 
			message: errorMessage,
			error: error.response?.data || error.message
		});
	}
});




router.post('/send-template', [isCollege], async (req, res) => {
	try {
		const { name, language, category, components, base64File, carouselFiles } = req.body;
		let files = req.files;

		console.log(req.body, "req.body");
		console.log(files, "files");

	} catch (error) {
		console.error('Error sending WhatsApp template:', error);
		res.status(500).json({
			success: false,
			error: error.response?.data || error.message
		});
	}
});

module.exports = router; 