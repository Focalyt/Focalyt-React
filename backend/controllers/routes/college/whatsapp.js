const express = require('express');
const router = express.Router();
const axios = require('axios');
const AWS = require("aws-sdk");
const uuid = require('uuid/v1');
const multer = require('multer');
const FormData = require('form-data');
const { College, WhatsAppMessage, WhatsAppTemplate } = require('../../models');
const { isCollege } = require('../../../helpers');
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
		
		console.log('=== Fetched Templates ===');
		const templates = response.data.data || [];
		
		// Get college ID for database lookup
		const collegeId = req.collegeId || req.college?._id || req.user?.college?._id;
		
		// Fetch database media URLs for each template
		const templatesWithMedia = await Promise.all(templates.map(async (template) => {
			try {
				if (collegeId && WhatsAppTemplate) {
					// Find template in database
					const dbTemplate = await WhatsAppTemplate.findOne({
						collegeId: collegeId,
						templateName: template.name
					});
					
					if (dbTemplate) {
						console.log(`Found database media for template: ${template.name}`);
						
						// Replace Facebook handles with S3 URLs in components
						if (template.components) {
							template.components = template.components.map(component => {
								// Handle HEADER component
								if (component.type === 'HEADER' && component.example?.header_handle) {
									if (dbTemplate.headerMedia?.s3Url) {
										component.example.header_handle = [dbTemplate.headerMedia.s3Url];
										console.log(`  - Replaced header handle with S3 URL: ${dbTemplate.headerMedia.s3Url.substring(0, 60)}...`);
									}
								}
								
								// Handle CAROUSEL components
								if (component.type === 'CAROUSEL' && component.cards) {
									component.cards = component.cards.map((card, cardIndex) => {
										const cardMedia = dbTemplate.carouselMedia?.[cardIndex];
										if (cardMedia?.s3Url && card.components) {
											card.components = card.components.map(cardComp => {
												if (cardComp.type === 'HEADER' && cardComp.example?.header_handle) {
													cardComp.example.header_handle = [cardMedia.s3Url];
													console.log(`  - Replaced carousel card ${cardIndex} header with S3 URL`);
												}
												return cardComp;
											});
										}
										return card;
									});
								}
								
								return component;
							});
						}
					}
				}
				
				return template;
			} catch (dbError) {
				console.error(`Error fetching media for template ${template.name}:`, dbError.message);
				return template; // Return original template if DB lookup fails
			}
		}));
		
		templatesWithMedia.forEach(template => {
			console.log(`Template: ${template.name}, Language: ${template.language}, Status: ${template.status}`);
		});

		res.json({
			success: true,
			message: 'Templates fetched successfully',
			data: templatesWithMedia
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
					'file_offset': 0,
					'Content-Type': contentType
				},
				maxContentLength: Infinity,
				maxBodyLength: Infinity,
				timeout: 30000
			}
		);

		let fileHandle = uploadResponse.data.h;
		console.log('Upload response handle type:', typeof fileHandle);
		console.log('Upload response handle value:', fileHandle);
		
		// Handle case where Facebook returns multiple handles (for large files/chunks)
		// WhatsApp API expects only one handle, so take the first one
		if (Array.isArray(fileHandle)) {
			console.log('Handle is array, taking first element');
			fileHandle = fileHandle[0];
		} else if (typeof fileHandle === 'string' && fileHandle.includes('\n')) {
			console.log('Handle contains newlines, splitting and taking first');
			fileHandle = fileHandle.split('\n')[0];
		}
		
		console.log('Final handle to use:', fileHandle);
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
		else if (req.files && req.files.length > 0) {
			const filesArray = Array.isArray(req.files) ? req.files : [req.files];
			const uploadPromises = [];

			filesArray.forEach((item) => {
				const fileName = item.originalname;
				const mimetype = item.mimetype;
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
					uploadFileToFacebook(fileName, item.buffer, mimetype).then((fileHandle) => {
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
			console.log(`Added example for HEADER component (${component.format}):`, processedComponent.example);
			console.log(`File handle length: ${uploadedFiles[fileIndex].fileHandle.length} chars`);
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

	console.log('✓ Template created successfully on Facebook!');
	console.log('Template ID:', response.data?.id);

	// Save header media to S3 AFTER successful template creation
	let savedHeaderMedia = null;
	
	if (base64File && base64File.name && base64File.body) {
		console.log(`\n=== Uploading header media to S3 ===`);
		
		try {
			const { name: fileName, body: base64Data } = base64File;
			
			// Clean base64 data
			const base64Clean = base64Data.replace(/^data:[^;]+;base64,/, '');
			const buffer = Buffer.from(base64Clean, 'base64');
			
			// Determine file extension and content type
			const ext = fileName.split('.').pop().toLowerCase();
			let contentType = 'image/jpeg';
			let mediaType = 'IMAGE';
			
			if (ext === 'png') {
				contentType = 'image/png';
			} else if (ext === 'jpg' || ext === 'jpeg') {
				contentType = 'image/jpeg';
			} else if (ext === 'webp') {
				contentType = 'image/webp';
			} else if (ext === 'mp4') {
				contentType = 'video/mp4';
				mediaType = 'VIDEO';
			} else if (ext === 'pdf') {
				contentType = 'application/pdf';
				mediaType = 'DOCUMENT';
			}
			
			// Generate S3 key
			const key = `whatsapp-templates/${req.college?._id || req.collegeId}/${name}/header_${uuid()}.${ext}`;
			
			const params = {
				Bucket: bucketName,
				Key: key,
				Body: buffer,
				ContentType: contentType
			};
			
			console.log(`  - Uploading header ${mediaType}: ${fileName}`);
			
			const uploadResult = await s3.upload(params).promise();
			
			savedHeaderMedia = {
				mediaType: mediaType,
				s3Url: uploadResult.Location,
				s3Key: key,
				fileName: fileName
			};
			
			console.log(`  ✓ Header media saved to S3: ${uploadResult.Location}`);
		} catch (s3Error) {
			console.error(`  ❌ Header media S3 upload failed:`, s3Error.message);
		}
	}

	// Save carousel media to S3 AFTER successful template creation
	const savedCarouselMedia = [];
	
	if (carouselFiles && Array.isArray(carouselFiles) && carouselFiles.length > 0) {
		console.log(`\n=== Uploading ${carouselFiles.length} carousel files to S3 ===`);
		const s3UploadPromises = [];
		
		carouselFiles.forEach((carouselFile) => {
			const { name: fileName, body: base64Data, cardIndex } = carouselFile;
			
			// Clean base64 data
			const base64Clean = base64Data.replace(/^data:[^;]+;base64,/, '');
			
			// Convert to buffer
			const buffer = Buffer.from(base64Clean, 'base64');
			
			// Determine file extension and content type
			const ext = fileName.split('.').pop().toLowerCase();
			let contentType = 'image/jpeg';
			if (ext === 'png') {
				contentType = 'image/png';
			} else if (ext === 'jpg' || ext === 'jpeg') {
				contentType = 'image/jpeg';
			} else if (ext === 'webp') {
				contentType = 'image/webp';
			} else if (ext === 'mp4') {
				contentType = 'video/mp4';
			} else if (ext === 'pdf') {
				contentType = 'application/pdf';
			}
			
		// Generate S3 key (same pattern as courses.js)
		const key = `whatsapp-templates/${req.college?._id || req.collegeId}/${name}/carousel_${cardIndex}_${uuid()}.${ext}`;
		
		const params = {
			Bucket: bucketName,
			Key: key,
			Body: buffer,
			ContentType: contentType
		};
			
			console.log(`  - Uploading Card ${cardIndex}: ${fileName}`);
			
			s3UploadPromises.push(
				s3.upload(params).promise().then((uploadResult) => {
					const mediaType = allowedVideoExtensions.includes(ext) ? 'VIDEO' : 'IMAGE';
					savedCarouselMedia.push({
						cardIndex: cardIndex,
						mediaType: mediaType,
						s3Url: uploadResult.Location,
						s3Key: key,
						fileName: fileName
					});
					console.log(`  ✓ Card ${cardIndex} saved to S3: ${uploadResult.Location}`);
				}).catch((s3Error) => {
					console.error(`  ❌ Card ${cardIndex} S3 upload failed:`, s3Error.message);
				})
			);
		});
		
		// Wait for all S3 uploads to complete
		await Promise.all(s3UploadPromises);
		console.log(`=== ${savedCarouselMedia.length} files uploaded to S3 ===\n`);
	}
	
	// Save template data to database AFTER S3 upload
	try {
		if (savedCarouselMedia.length > 0 || savedHeaderMedia || response.data?.id) {
			const collegeId = req.collegeId || req.college?._id || req.user?.college?._id;
			
			if (collegeId && WhatsAppTemplate && typeof WhatsAppTemplate.create === 'function') {
				const templateDoc = await WhatsAppTemplate.create({
					collegeId: collegeId,
					templateId: response.data?.id,
					templateName: name,
					language: language,
					category: category,
					status: response.data?.status || 'PENDING',
					carouselMedia: savedCarouselMedia,
					headerMedia: savedHeaderMedia // Save header media
				});
				
				console.log(`✓ Template metadata saved to database: ${templateDoc._id}`);
				if (savedHeaderMedia) {
					console.log(`  - Header media: ${savedHeaderMedia.mediaType} at ${savedHeaderMedia.s3Url}`);
				}
				if (savedCarouselMedia.length > 0) {
					console.log(`  - Carousel media: ${savedCarouselMedia.length} files`);
				}
			} else {
				console.log('⚠ Skipping database save:', !collegeId ? 'collegeId not found' : 'WhatsAppTemplate model not available');
			}
		}
	} catch (dbError) {
		console.error('Error saving template to database (non-critical):', dbError.message);
		// Continue even if DB save fails - template is already created
	}

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
			savedToS3: savedCarouselMedia.length + (savedHeaderMedia ? 1 : 0),
			s3Files: savedCarouselMedia.map(file => ({
				cardIndex: file.cardIndex,
				s3Url: file.s3Url,
				fileName: file.fileName
			})),
			headerMedia: savedHeaderMedia ? {
				mediaType: savedHeaderMedia.mediaType,
				s3Url: savedHeaderMedia.s3Url,
				fileName: savedHeaderMedia.fileName
			} : null,
				response: response.data
			}
		});

	} catch (error) {
		console.error('Error creating WhatsApp template:', error);
		console.error('Facebook Error Response:', JSON.stringify(error.response?.data, null, 2));
		
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
router.delete('/delete-template/:name', isCollege, async (req, res) => {
	try {
		const { name } = req.params;

		// Validate template name
		if (!name) {
			return res.status(400).json({ 
				success: false, 
				message: 'Template name is required'
			});
		}

		console.log(`Deleting template: ${name}`);

		// Get environment variables
		const businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
		const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

		if (!businessAccountId || !accessToken) {
			return res.status(500).json({
				success: false,
				message: 'WhatsApp Business Account ID or Access Token not configured'
			});
		}

		// Delete template via Facebook Graph API
		const response = await axios.delete(
			`https://graph.facebook.com/v23.0/${businessAccountId}/message_templates`,
			{
			headers: {
					'Authorization': `Bearer ${accessToken}`,
					'Content-Type': 'application/json'
				},
				params: {
					name: name
				}
			}
		);

		console.log('✓ Template deleted from Facebook:', response.data);

		// Also delete from database if exists
		try {
			const deletedTemplate = await WhatsAppTemplate.findOneAndDelete({
				collegeId: req.college?._id || req.collegeId,
				templateName: name
			});
			
			if (deletedTemplate) {
				console.log('✓ Template deleted from database');
			}
		} catch (dbError) {
			console.error('Error deleting from database:', dbError.message);
			// Continue even if DB delete fails
		}

		res.json({
			success: true,
			message: 'Template deleted successfully',
			data: {
				templateName: name,
				response: response.data
			}
		});

	} catch (error) {
		console.error('Error deleting WhatsApp template:', error.response?.data || error.message);
		
		// Check if error is "template not found" - treat as success since template doesn't exist
		const errorSubcode = error.response?.data?.error?.error_subcode;
		const errorMessage = error.response?.data?.error?.error_user_msg || error.response?.data?.error?.message;
		
		if (errorSubcode === 2593002 || (errorMessage && errorMessage.toLowerCase().includes("wasn't found"))) {
			console.log('✓ Template already does not exist in Facebook - treating as success');
			
			// Still try to delete from database if exists
			try {
				const deletedTemplate = await WhatsAppTemplate.findOneAndDelete({
					collegeId: req.college?._id || req.collegeId,
					templateName: req.params.name
				});
				
				if (deletedTemplate) {
					console.log('✓ Template deleted from database');
				}
			} catch (dbError) {
				console.error('Error deleting from database:', dbError.message);
			}
			
			return res.json({
				success: true,
				message: 'Template deleted successfully (was already not present in Facebook)',
				data: {
					templateName: req.params.name,
					note: 'Template did not exist in Facebook system'
				}
			});
		}
		
		// Handle other error cases
		let errorMsg = 'Failed to delete template';
		if (error.response?.data?.error?.message) {
			errorMsg = error.response.data.error.message;
		} else if (error.response?.data?.message) {
			errorMsg = error.response.data.message;
		} else if (error.response?.data?.error) {
			errorMsg = error.response.data.error;
		}

		res.status(500).json({ 
			success: false, 
			message: errorMsg,
			error: error.response?.data || error.message
		});
	}
});





// router.post('/send-template', [isCollege], upload.array('files', 10), async (req, res) => {
// 	try {
// 		let { name, language, category, components, to, carouselFiles, base64File } = req.body;

// 		console.log('=== Send Template Request ===');
// 		console.log('Template Name:', name);
// 		console.log('Language Code:', language);
// 		console.log('Recipient:', to);
		
// 		// Parse JSON strings if needed
// 		if (typeof components === 'string') {
// 			components = JSON.parse(components);
// 		}
// 		if (typeof carouselFiles === 'string') {
// 			carouselFiles = JSON.parse(carouselFiles);
// 		}
		
// 		console.log('Components:', JSON.stringify(components, null, 2));
// 		if (carouselFiles && carouselFiles.length > 0) {
// 			console.log('Carousel Files:', carouselFiles.length, 'files provided');
// 		}
// 		if (base64File) {
// 			console.log('Base64 File provided:', base64File.name);
// 		}
	
// 			// Validate required fields
// 		if (!name || !language || !to) {
// 				return res.status(400).json({ 
// 					success: false, 
// 				message: 'Template name, language, and recipient phone number are required' 
// 			});
// 		}

// 		// Format phone number
// 		let phoneNumber = String(to).trim();
// 		if (!phoneNumber.startsWith('+') && !phoneNumber.startsWith('91')) {
// 			phoneNumber = '91' + phoneNumber;
// 		}
// 		phoneNumber = phoneNumber.replace(/^\+/, '');
// 		console.log('Formatted phone number:', phoneNumber);

// 		// Get environment variables
// 		const phoneNumberId = process.env.WHATSAPP_PHONE_ID;
// 			const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
// 		const businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
	
// 		if (!phoneNumberId || !accessToken || !businessAccountId) {
// 				return res.status(500).json({ 
// 					success: false, 
// 				message: 'WhatsApp configuration not complete.' 
// 			});
// 		}

// 		// Fetch template details from Facebook API
// 		let normalizedLanguage = language;
// 		let templateCarouselData = null;
		
// 		try {
// 			console.log('Fetching template details from Facebook...');
// 			const templateResponse = await axios.get(
// 				`https://graph.facebook.com/v23.0/${businessAccountId}/message_templates`,
// 						{
// 							headers: {
// 								'Authorization': `Bearer ${accessToken}`,
// 								'Content-Type': 'application/json'
// 					},
// 					params: {
// 						fields: 'name,language,status,components',
// 						name: name
// 					}
// 				}
// 			);

// 			const templates = templateResponse.data.data || [];
// 			console.log(`Found ${templates.length} templates with name "${name}"`);
			
// 			const matchingTemplate = templates.find(t => 
// 				t.name === name && 
// 				t.status === 'APPROVED' &&
// 				(t.language === language || t.language.startsWith(language))
// 			);

// 			if (matchingTemplate) {
// 				normalizedLanguage = matchingTemplate.language;
// 				console.log(`✓ Found approved template with language: ${normalizedLanguage}`);
				
// 				if (matchingTemplate.components) {
// 					const carouselComponent = matchingTemplate.components.find(c => c.type === 'CAROUSEL');
// 					if (carouselComponent && carouselComponent.cards) {
// 						console.log(`✓ Found carousel with ${carouselComponent.cards.length} cards`);
// 						templateCarouselData = carouselComponent;
// 					}
// 				}
// 			}
// 		} catch (fetchError) {
// 			console.error('Error fetching template:', fetchError.message);
// 		}
		
// 		console.log('Final language code:', normalizedLanguage);

// 		// Fetch template media from database (S3 URLs)
// 		let templateMediaData = null;
// 		try {
// 			console.log('\n=== Fetching template media from database ===');
// 			templateMediaData = await WhatsAppTemplate.findOne({
// 				collegeId: req.college._id,
// 				templateName: name
// 			});
			
// 			if (templateMediaData) {
// 				console.log('✓ Template found in database');
// 				if (templateMediaData.carouselMedia && templateMediaData.carouselMedia.length > 0) {
// 					console.log(`  - Carousel media: ${templateMediaData.carouselMedia.length} files`);
// 				}
// 				if (templateMediaData.headerMedia) {
// 					console.log(`  - Header media: ${templateMediaData.headerMedia.mediaType}`);
// 				}
// 			} else {
// 				console.log('⚠ Template not found in database (might be created externally)');
// 			}
// 		} catch (dbError) {
// 			console.error('Error fetching template from database:', dbError.message);
// 		}

// 		// Handle file uploads for carousel (if needed)
// 		let uploadedCarouselFiles = [];
		
// 		// Function to upload file to WhatsApp and get media ID
// 		const uploadFileToWhatsApp = async (fileName, fileBuffer, mimeType) => {
// 			try {
// 				console.log(`Uploading file to WhatsApp:`);
// 				console.log(`  - File: ${fileName}`);
// 				console.log(`  - MIME: ${mimeType}`);
// 				console.log(`  - Size: ${fileBuffer.length} bytes`);
				
// 				// Validate buffer
// 				if (!fileBuffer || fileBuffer.length === 0) {
// 					throw new Error('File buffer is empty');
// 				}
				
// 				// Validate MIME type
// 				const validMimeTypes = [
// 					'image/jpeg', 'image/jpg', 'image/png', 
// 					'video/mp4', 'video/3gpp',
// 					'application/pdf'
// 				];
				
// 				if (!validMimeTypes.includes(mimeType)) {
// 					console.warn(`⚠ Uncommon MIME type: ${mimeType}, may fail`);
// 				}
				
// 				// Create form-data (Node.js FormData from 'form-data' package)
// 				const formData = new FormData();
// 				formData.append('messaging_product', 'whatsapp');
// 				formData.append('file', fileBuffer, {
// 					filename: fileName,
// 					contentType: mimeType,
// 					knownLength: fileBuffer.length
// 				});
				
// 				console.log(`  - FormData size: ${formData.getLengthSync()} bytes`);
				
// 				const response = await axios.post(
// 					`https://graph.facebook.com/v23.0/${phoneNumberId}/media`,
// 					formData,
// 						{
// 							headers: {
// 								'Authorization': `Bearer ${accessToken}`,
// 							...formData.getHeaders()
// 							},
// 							maxBodyLength: Infinity,
// 						maxContentLength: Infinity
// 					}
// 				);
				
// 				console.log(`✓ File uploaded successfully!`);
// 				console.log(`  - Media ID: ${response.data.id}`);
// 				return response.data.id;
// 				} catch (error) {
// 				console.error('❌ Error uploading file to WhatsApp:');
// 				console.error('  - File:', fileName);
// 				console.error('  - Error:', error.response?.data || error.message);
// 					throw error;
// 				}
// 			};
			
// 		// If no carousel files from frontend, fetch from database/S3
// 		if ((!carouselFiles || carouselFiles.length === 0) && 
// 			templateMediaData && 
// 			templateMediaData.carouselMedia && 
// 			templateMediaData.carouselMedia.length > 0) {
			
// 			console.log('\n=== Fetching carousel files from S3 (database) ===');
// 			carouselFiles = [];
			
// 			for (const mediaItem of templateMediaData.carouselMedia) {
// 				try {
// 					console.log(`  - Card ${mediaItem.cardIndex}: ${mediaItem.s3Url.substring(0, 60)}...`);
					
// 					// Fetch from S3 URL
// 					const s3Response = await axios.get(mediaItem.s3Url, {
// 						responseType: 'arraybuffer'
// 					});
					
// 					const buffer = Buffer.from(s3Response.data);
// 					const base64String = buffer.toString('base64');
					
// 					console.log(`    Downloaded: ${buffer.length} bytes → ${base64String.length} chars base64`);
					
// 					carouselFiles.push({
// 						name: mediaItem.fileName || `card_${mediaItem.cardIndex}_image.png`,
// 						body: base64String,
// 						cardIndex: mediaItem.cardIndex
// 					});
					
// 					console.log(`    ✓ Card ${mediaItem.cardIndex} ready`);
// 				} catch (fetchError) {
// 					console.error(`    ❌ Failed to fetch card ${mediaItem.cardIndex}:`, fetchError.message);
// 				}
// 			}
			
// 			console.log(`=== Fetched ${carouselFiles.length} files from S3 ===\n`);
// 		}
		
// 		// Process carousel files if provided
// 		if (carouselFiles && Array.isArray(carouselFiles) && carouselFiles.length > 0) {
// 			console.log(`\n=== Processing ${carouselFiles.length} carousel files ===`);
			
// 			for (const carouselFile of carouselFiles) {
// 				const { name: fileName, body: base64Data, cardIndex } = carouselFile;
				
// 				console.log(`\nCard ${cardIndex}:`);
// 				console.log(`  - File: ${fileName}`);
				
// 				if (!base64Data) {
// 					throw new Error(`Card ${cardIndex}: No image data provided`);
// 				}
				
// 				// Remove data URI prefix if present (e.g., "data:image/jpeg;base64,")
// 				let base64Clean = base64Data;
// 				if (base64Data.includes('base64,')) {
// 					base64Clean = base64Data.split('base64,')[1];
// 					console.log(`  - Removed data URI prefix`);
// 				}
				
// 				// Validate base64
// 				if (!base64Clean || base64Clean.length === 0) {
// 					throw new Error(`Card ${cardIndex}: Invalid base64 data`);
// 				}
				
// 				console.log(`  - Base64 length: ${base64Clean.length} chars`);
	
// 				// Convert base64 to buffer
// 				const buffer = Buffer.from(base64Clean, 'base64');
// 				console.log(`  - Buffer size: ${buffer.length} bytes`);
				
// 				if (buffer.length === 0) {
// 					throw new Error(`Card ${cardIndex}: Failed to create buffer from base64`);
// 				}
				
// 				// Determine content type from extension
// 				const ext = fileName.split('.').pop().toLowerCase();
// 				let mimeType;
				
// 				if (ext === 'jpg' || ext === 'jpeg') {
// 					mimeType = 'image/jpeg';
// 				} else if (ext === 'png') {
// 					mimeType = 'image/png';
// 				} else if (ext === 'webp') {
// 					mimeType = 'image/webp';
// 				} else if (ext === 'gif') {
// 					mimeType = 'image/gif';
// 				} else if (ext === 'mp4') {
// 					mimeType = 'video/mp4';
// 				} else if (ext === '3gpp' || ext === '3gp') {
// 					mimeType = 'video/3gpp';
// 				} else if (ext === 'pdf') {
// 					mimeType = 'application/pdf';
// 				} else {
// 					// Default to JPEG for unknown image types
// 					console.warn(`  - Unknown extension "${ext}", defaulting to image/jpeg`);
// 					mimeType = 'image/jpeg';
// 				}
				
// 				console.log(`  - MIME type: ${mimeType}`);
				
// 				// Upload to WhatsApp
// 				try {
// 					const mediaId = await uploadFileToWhatsApp(fileName, buffer, mimeType);
					
// 					uploadedCarouselFiles.push({
// 						cardIndex: cardIndex,
// 						mediaId: mediaId,
// 						fileName: fileName
// 					});
					
// 					console.log(`✓ Card ${cardIndex}: Upload complete (Media ID: ${mediaId})\n`);
// 				} catch (uploadError) {
// 					console.error(`❌ Card ${cardIndex}: Upload failed`);
// 					throw new Error(`Failed to upload media for card ${cardIndex}: ${uploadError.message}`);
// 				}
// 			}
			
// 			console.log(`=== All ${uploadedCarouselFiles.length} files uploaded successfully ===\n`);
// 		}

// 		// Handle base64File for non-carousel media templates (IMAGE/VIDEO/DOCUMENT header)
// 		let uploadedHeaderMediaId = null;
		
// 		// If no base64File from frontend, check database for header media
// 		if ((!base64File || !base64File.body) && 
// 			templateMediaData && 
// 			templateMediaData.headerMedia && 
// 			templateMediaData.headerMedia.s3Url) {
			
// 			console.log('\n=== Fetching header media from S3 (database) ===');
			
// 			try {
// 				const headerMedia = templateMediaData.headerMedia;
// 				console.log(`  - Fetching from S3: ${headerMedia.s3Url.substring(0, 60)}...`);
				
// 				// Fetch from S3
// 				const s3Response = await axios.get(headerMedia.s3Url, {
// 					responseType: 'arraybuffer'
// 				});
				
// 				const buffer = Buffer.from(s3Response.data);
// 				const base64String = buffer.toString('base64');
				
// 				console.log(`  - Downloaded: ${buffer.length} bytes → ${base64String.length} chars base64`);
				
// 				base64File = {
// 					name: headerMedia.fileName || 'header_media',
// 					body: base64String
// 				};
				
// 				console.log('  - ✓ Header media fetched from S3');
// 			} catch (fetchError) {
// 				console.error('  - ❌ Failed to fetch header media from S3:', fetchError.message);
// 			}
// 		}
		
// 		if (base64File && base64File.name && base64File.body) {
// 			console.log('\n=== Processing header media file ===');
// 			console.log('  - File:', base64File.name);
			
// 			// Remove data URI prefix if present
// 			let base64Clean = base64File.body;
// 			if (base64File.body.includes('base64,')) {
// 				base64Clean = base64File.body.split('base64,')[1];
// 				console.log('  - Removed data URI prefix');
// 			}
			
// 			console.log('  - Base64 length:', base64Clean.length, 'chars');
			
// 			// Convert to buffer
// 			const buffer = Buffer.from(base64Clean, 'base64');
// 			console.log('  - Buffer size:', buffer.length, 'bytes');
			
// 			if (buffer.length < 100) {
// 				throw new Error('Header media file too small or invalid');
// 			}
			
// 			// Determine MIME type
// 			const ext = base64File.name.split('.').pop().toLowerCase();
// 			let mimeType;
			
// 			if (ext === 'jpg' || ext === 'jpeg') {
// 				mimeType = 'image/jpeg';
// 			} else if (ext === 'png') {
// 				mimeType = 'image/png';
// 			} else if (ext === 'webp') {
// 				mimeType = 'image/webp';
// 			} else if (ext === 'mp4') {
// 				mimeType = 'video/mp4';
// 			} else if (ext === '3gpp' || ext === '3gp') {
// 				mimeType = 'video/3gpp';
// 			} else if (ext === 'pdf') {
// 				mimeType = 'application/pdf';
// 			} else {
// 				console.warn('  - Unknown extension, defaulting to image/jpeg');
// 				mimeType = 'image/jpeg';
// 			}
			
// 			console.log('  - MIME type:', mimeType);
			
// 			// Upload to WhatsApp
// 			try {
// 				uploadedHeaderMediaId = await uploadFileToWhatsApp(base64File.name, buffer, mimeType);
// 				console.log('✓ Header media uploaded, Media ID:', uploadedHeaderMediaId);
// 			} catch (uploadError) {
// 				console.error('❌ Failed to upload header media:', uploadError.message);
// 				throw new Error(`Failed to upload header media: ${uploadError.message}`);
// 			}
// 		}

// 		// Convert components to WhatsApp API format
// 		const templateComponents = [];
		
// 		if (components && Array.isArray(components)) {
// 			// CRITICAL: Use for...of instead of forEach for async operations
// 			for (const component of components) {
// 				const componentType = component.type?.toLowerCase();
				
// 				// Handle CAROUSEL
// 				if (componentType === 'carousel' && component.cards && Array.isArray(component.cards)) {
// 					console.log('Processing carousel with', component.cards.length, 'cards');
					
// 					const carouselComponent = {
// 						type: 'carousel',
// 						cards: []
// 					};
					
// 					for (let cardIndex = 0; cardIndex < component.cards.length; cardIndex++) {
// 						const card = component.cards[cardIndex];
// 						const cardComponents = [];
						
// 						if (card.components && Array.isArray(card.components)) {
// 							for (const cardComp of card.components) {
// 								const cardCompType = cardComp.type?.toLowerCase();
								
// 								// Handle HEADER (required for carousel)
// 								if (cardCompType === 'header' && cardComp.format) {
// 									const format = cardComp.format.toLowerCase();
// 									let headerHandle = cardComp.example?.header_handle?.[0];
									
// 									// Check if we have uploaded file for this card
// 									const uploadedFile = uploadedCarouselFiles.find(f => f.cardIndex === cardIndex);
									
// 									if (uploadedFile) {
// 										// Use the newly uploaded media ID
// 										cardComponents.push({
// 											type: 'header',
// 											parameters: [{
// 												type: format,
// 												[format]: { id: uploadedFile.mediaId }
// 											}]
// 										});
// 										console.log(`Card ${cardIndex}: ✓ Using newly uploaded media ID: ${uploadedFile.mediaId}`);
// 						} else {
// 										// If no uploaded file, try to get from template or use existing
// 										if ((!headerHandle || headerHandle === 'placeholder_handle' || headerHandle === '') && templateCarouselData) {
// 											const templateCard = templateCarouselData.cards?.[cardIndex];
// 											if (templateCard?.components) {
// 												const templateHeader = templateCard.components.find(c => c.type === 'HEADER');
// 												if (templateHeader?.example?.header_handle?.[0]) {
// 													headerHandle = templateHeader.example.header_handle[0];
// 													console.log(`Card ${cardIndex}: Found media from template`);
// 												}
// 											}
// 										}
										
// 										// Check if it's a WhatsApp CDN URL
// 										const isWhatsAppCDN = headerHandle && headerHandle.includes('scontent.whatsapp.net');
										
// 										if (isWhatsAppCDN) {
// 											// WhatsApp CDN URLs cannot be reused - ask frontend to send files
// 											const errorMsg = `❌ Carousel template error: WhatsApp CDN URLs cannot be reused.\n\n` +
// 												`The template "${name}" uses temporary WhatsApp CDN links that expire.\n\n` +
// 												`Please send the carousel files from frontend using the "carouselFiles" parameter.\n\n` +
// 												`Example:\n` +
// 												`carouselFiles: [\n` +
// 												`  { name: "image1.jpg", body: "base64data...", cardIndex: 0 },\n` +
// 												`  { name: "image2.jpg", body: "base64data...", cardIndex: 1 }\n` +
// 												`]`;
											
// 											console.error(errorMsg);
// 											throw new Error(errorMsg);
// 										}
										
// 										// Validate media
// 										const hasValidMedia = headerHandle && 
// 											headerHandle !== 'placeholder_handle' && 
// 											headerHandle !== '' &&
// 											(headerHandle.startsWith('http') || headerHandle.match(/^\d+$/));
										
// 										if (hasValidMedia) {
// 											const isMediaId = headerHandle.match(/^\d+$/);
											
// 											if (isMediaId) {
// 												cardComponents.push({
// 													type: 'header',
// 													parameters: [{
// 														type: format,
// 														[format]: { id: headerHandle }
// 													}]
// 												});
// 												console.log(`Card ${cardIndex}: ✓ Using existing media ID`);
// 											} else {
// 												cardComponents.push({
// 													type: 'header',
// 													parameters: [{
// 														type: format,
// 														[format]: { link: headerHandle }
// 													}]
// 												});
// 												console.log(`Card ${cardIndex}: ✓ Using URL: ${headerHandle.substring(0, 50)}...`);
// 											}
// 										} else {
// 											throw new Error(`Card ${cardIndex}: Missing required media. Please send carousel files or provide valid URLs/media IDs.`);
// 										}
// 									}
// 								}
								
// 								// Handle BODY variables
// 								else if (cardCompType === 'body' && cardComp.text) {
// 									const variables = cardComp.text.match(/\{\{([^}]+)\}\}/g);
// 									if (variables && variables.length > 0) {
// 										cardComponents.push({
// 											type: 'body',
// 											parameters: variables.map(v => ({
// 												type: 'text',
// 												text: v.replace(/\{\{|\}\}/g, '')
// 											}))
// 										});
// 										console.log(`Card ${cardIndex}: Added body parameters`);
// 									}
// 								}
								
// 								// Handle BUTTON URLs
// 								else if (cardCompType === 'buttons' && cardComp.buttons) {
// 									cardComp.buttons.forEach((button, btnIndex) => {
// 										if ((button.type === 'URL' || button.type === 'url') && 
// 											button.url && button.url.includes('{{')) {
											
// 											const urlVariables = button.url.match(/\{\{([^}]+)\}\}/g);
// 											if (urlVariables && urlVariables.length > 0) {
// 												cardComponents.push({
// 													type: 'button',
// 													sub_type: 'url',
// 													index: btnIndex.toString(),
// 													parameters: [{ type: 'text', text: 'dynamic_value' }]
// 												});
// 											}
// 										}
// 									});
// 								}
// 							}
// 						}
						
// 						carouselComponent.cards.push({
// 							card_index: cardIndex,
// 							components: cardComponents
// 						});
// 					}
					
// 					templateComponents.push(carouselComponent);
// 					console.log('✓ Carousel ready with', carouselComponent.cards.length, 'cards');
// 				}
				
// 				// Handle HEADER (non-carousel)
// 				else if (componentType === 'header' && component.format) {
// 					const format = component.format.toUpperCase();
					
// 					if (format === 'IMAGE' || format === 'VIDEO' || format === 'DOCUMENT') {
// 						// Check if we have uploaded media from base64File
// 						if (uploadedHeaderMediaId) {
// 							console.log('Using uploaded header media ID:', uploadedHeaderMediaId);
// 							templateComponents.push({
// 								type: 'header',
// 								parameters: [{
// 									type: format.toLowerCase(),
// 									[format.toLowerCase()]: { id: uploadedHeaderMediaId }
// 								}]
// 							});
// 						} 
// 						// Otherwise check if component has media link/ID
// 						else if (component.example?.header_handle?.[0]) {
// 							const headerHandle = component.example.header_handle[0];
// 							const isMediaId = headerHandle.match(/^\d+$/);
							
// 							if (isMediaId) {
// 								console.log('Using media ID from component:', headerHandle);
// 								templateComponents.push({
// 									type: 'header',
// 									parameters: [{
// 										type: format.toLowerCase(),
// 										[format.toLowerCase()]: { id: headerHandle }
// 									}]
// 								});
// 							} else {
// 								console.log('Using link from component:', headerHandle.substring(0, 50) + '...');
// 								templateComponents.push({
// 									type: 'header',
// 									parameters: [{
// 										type: format.toLowerCase(),
// 										[format.toLowerCase()]: { link: headerHandle }
// 									}]
// 								});
// 							}
// 						}
// 						// If no media provided, skip header parameters (template will use defaults if possible)
// 						else {
// 							console.warn('⚠ HEADER format is', format, 'but no media provided - skipping header parameters');
// 						}
// 					} else if (format === 'TEXT' && component.text) {
// 						const variables = component.text.match(/\{\{([^}]+)\}\}/g);
// 						if (variables && variables.length > 0) {
// 							templateComponents.push({
// 								type: 'header',
// 								parameters: variables.map(v => ({
// 									type: 'text',
// 									text: v.replace(/\{\{|\}\}/g, '')
// 								}))
// 							});
// 						}
// 					} else if (format === 'LOCATION' && component.location) {
// 						templateComponents.push({
// 							type: 'header',
// 							parameters: [{ type: 'location', location: component.location }]
// 						});
// 					}
// 				}
				
// 				// Handle BODY (non-carousel)
// 				else if (componentType === 'body' && component.text) {
// 					const variables = component.text.match(/\{\{([^}]+)\}\}/g);
// 					if (variables && variables.length > 0) {
// 						templateComponents.push({
// 							type: 'body',
// 							parameters: variables.map(v => ({
// 								type: 'text',
// 								text: 'User'
// 							}))
// 						});
// 					}
// 				}
				
// 				// Handle BUTTONS (non-carousel)
// 				else if (componentType === 'buttons' && component.buttons) {
// 					component.buttons.forEach((button, index) => {
// 						if (button.type === 'QUICK_REPLY' || button.type === 'quick_reply') {
// 							templateComponents.push({
// 								type: 'button',
// 								sub_type: 'quick_reply',
// 								index: index.toString(),
// 								parameters: [{ type: 'payload', payload: button.text || `button_${index}` }]
// 							});
// 						} else if (button.type === 'URL' || button.type === 'url') {
// 							const urlVariables = button.url?.match(/\{\{([^}]+)\}\}/g);
// 							if (urlVariables && urlVariables.length > 0) {
// 								templateComponents.push({
// 									type: 'button',
// 									sub_type: 'url',
// 									index: index.toString(),
// 									parameters: [{ type: 'text', text: 'dynamic_value' }]
// 								});
// 							}
// 						}
// 					});
// 				}
// 			}
// 		}

// 		// Prepare payload
// 		const messagePayload = {
// 			messaging_product: "whatsapp",
// 			recipient_type: "individual",
// 			to: phoneNumber,
// 			type: "template",
// 			template: {
// 				name: name,
// 				language: { code: normalizedLanguage }
// 			}
// 		};

// 		if (templateComponents.length > 0) {
// 			messagePayload.template.components = templateComponents;
// 		}

// 		console.log('=== Final WhatsApp API Payload ===');
// 		console.log(JSON.stringify(messagePayload, null, 2));

// 		// Send message
// 		const response = await axios.post(
// 			`https://graph.facebook.com/v23.0/${phoneNumberId}/messages`,
// 			messagePayload,
// 			{
// 				headers: {
// 					'Authorization': `Bearer ${accessToken}`,
// 					'Content-Type': 'application/json'
// 				}
// 			}
// 		);

// 		// Store in database (optional - only if WhatsAppMessage model exists)
// 		try {
// 			if (WhatsAppMessage && typeof WhatsAppMessage.create === 'function') {
// 				const collegeId = req.collegeId || req.college?._id || req.user?.college?._id;
				
// 				if (collegeId) {
// 					await WhatsAppMessage.create({
// 						collegeId: collegeId,
// 						templateName: name,
// 						recipientPhone: phoneNumber,
// 						messageId: response.data.messages[0]?.id,
// 						status: 'sent',
// 						sentAt: new Date()
// 					});
// 					console.log('✓ Message sent to database');
// 				} else {
// 					console.log('⚠ collegeId not found in request, skipping database save');
// 				}
// 			} else {
// 				console.log('⚠ WhatsAppMessage model not available, skipping database save');
// 			}
// 		} catch (dbError) {
// 			console.error('DB error (non-critical):', dbError.message);
// 			// Continue execution - DB save is optional
// 		}

// 		// WebSocket notification
// 		if (global.wsServer) {
// 			global.wsServer.sendWhatsAppNotification(req.college._id, {
// 				type: 'message_sent',
// 				templateName: name,
// 				recipientPhone: phoneNumber,
// 				messageId: response.data.messages[0]?.id,
// 				timestamp: new Date().toISOString()
// 			});
// 		}
	
// 			res.json({
// 				success: true,
// 			message: 'Template message sent successfully',
// 				data: {
// 				messageId: response.data.messages[0]?.id,
// 				recipientPhone: phoneNumber,
// 					templateName: name,
// 				whatsappId: response.data.contacts[0]?.wa_id,
// 					response: response.data
// 				}
// 			});
	
// 		} catch (error) {
// 		console.error('=== Error sending template ===');
// 		console.error('Error:', error.response?.data || error.message);
		
// 		let errorMessage = 'Failed to send template message';
// 		let errorCode = null;

// 		if (error.response?.data?.error) {
// 			const errorData = error.response.data.error;
// 			errorMessage = errorData.message || errorMessage;
// 			errorCode = errorData.code;

// 			if (errorCode === 132001) {
// 				errorMessage = 'Template not found or language mismatch. Check template name and language code.';
// 			} else if (errorCode === 131049) {
// 				errorMessage = 'Marketing template limit reached. Wait 24 hours before resending.';
// 			} else if (errorCode === 131050) {
// 				errorMessage = 'User has opted out of marketing messages.';
// 			}
// 		} else if (error.message && !error.response) {
// 			errorMessage = error.message;
// 		}

// 		if (global.wsServer) {
// 			global.wsServer.sendWhatsAppNotification(req.college._id, {
// 				type: 'message_send_error',
// 				error: errorMessage,
// 				errorCode: errorCode,
// 				timestamp: new Date().toISOString()
// 			});
// 		}

// 		res.status(500).json({
// 			success: false,
// 			message: errorMessage,
// 			errorCode: errorCode,
// 			error: error.response?.data || error.message
// 		});
// 	}
// });


/*
===========================================
INSTALL REQUIRED PACKAGES
===========================================
npm install express axios mongoose dotenv
===========================================
*/


// WhatsApp Configuration
const WHATSAPP_API_URL =  'https://graph.facebook.com/v23.0';
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_ID;
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

/**
 * Format phone number - add +91 if not present
 */
function formatPhoneNumber(phoneNumber) {
	if(!phoneNumber) return null;

	if(typeof phoneNumber !== 'string') {
		phoneNumber = phoneNumber.toString();
	};
  // Remove all spaces, dashes, and special characters (but keep + if at start)
  let cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '');
  
  // If already has + at start, remove it temporarily for validation
  let hasPlus = cleaned.startsWith('+');
  if (hasPlus) {
    cleaned = cleaned.substring(1);
  }
  
  // Validate and format the number
  let formattedNumber;
  
  // If number starts with 91 and is 12 digits
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    formattedNumber = cleaned;
  }
  // If 10 digit Indian mobile number, add 91
  else if (cleaned.length === 10 && /^[6-9]\d{9}$/.test(cleaned)) {
    formattedNumber = '91' + cleaned;
  }
  // If already has country code (12 digits starting with 91)
  else if (cleaned.length === 12 && cleaned.startsWith('91')) {
    formattedNumber = cleaned;
  }
  else {
    throw new Error('Invalid phone number format');
  }
  
  // ALWAYS return with + prefix for WhatsApp
  return '+' + formattedNumber;
}

/**
 * Get media URL from database
 * Since URL is already saved in database during template creation
 */
function getMediaUrl(s3Url) {
  return s3Url || null;
}

/**
 * Convert Facebook handle to WhatsApp media URL
 */
async function convertHandleToMediaUrl(handle) {
  try {
    if (!handle) return null;
    
    // If it's already a WhatsApp CDN URL, return as is
    if (handle.includes('scontent.whatsapp.net') || handle.includes('whatsapp.net')) {
      return handle;
    }
    
    // If it's a Facebook handle, we need to get the media URL
    // For now, return the handle as is - WhatsApp will handle the conversion
    // In production, you might need to call Facebook API to get the actual media URL
    return handle;
    
  } catch (error) {
    console.error('Error converting handle to media URL:', error);
    return handle; // Return original handle as fallback
  }
}

/**
 * Fetch template from Facebook/WhatsApp API to verify correct details
 */
async function fetchTemplateFromFacebook(templateName) {
  try {
    const businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;

	if(!businessAccountId) {
		console.log('⚠ WhatsApp Business Account ID not found');
		return null;
	}

    const url = `${WHATSAPP_API_URL}/${businessAccountId}/message_templates`;
    
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
      },
      params: {
        name: templateName,
        limit: 1
      }
    });

    if (response.data && response.data.data && response.data.data.length > 0) {
      const fbTemplate = response.data.data[0];
      console.log('✅ Template found on Facebook:');
      console.log('  - Name:', fbTemplate.name);
      console.log('  - Language:', fbTemplate.language);
      console.log('  - Status:', fbTemplate.status);
      return fbTemplate;
    }
    
    console.log('⚠ Template not found on Facebook');
    return null;
  } catch (error) {
    console.error('❌ Error fetching template from Facebook:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Save message to database
 */
async function saveMessageToDatabase(messageData) {
  try {
    const { to, message, templateName, collegeId, messageType = 'text', templateData = null, candidateId = null, candidateName = null, whatsappMessageId = null } = messageData;
    
    // Create message document
    const messageDoc = {
      collegeId: collegeId,
      to: to,
      message: message,
      templateName: templateName,
      messageType: messageType,
      templateData: templateData,
      status: 'sent',
      sentAt: new Date(),
      candidateId: candidateId,
      candidateName: candidateName,
      whatsappMessageId: whatsappMessageId
    };
    
    // Save to database
    const savedMessage = await WhatsAppMessage.create(messageDoc);
    console.log('Message saved to database:', savedMessage._id);
    console.log('WhatsApp Message ID:', whatsappMessageId);
    
    return savedMessage;
  } catch (error) {
    console.error('Error saving message to database:', error);
    throw error;
  }
}

/**
 * Send WhatsApp message with template
 */
async function sendWhatsAppMessage(to, template, mediaUrls = {}) {
  const url = `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
  
  // Fetch template from Facebook to verify language and status
  const fbTemplate = await fetchTemplateFromFacebook(template.templateName);
  
  // Use Facebook template language if available, otherwise fallback to DB
  const actualLanguage = fbTemplate ? fbTemplate.language : template.language;
 
  
  // Check if template is approved on Facebook
  if (fbTemplate && fbTemplate.status !== 'APPROVED') {
    console.warn('⚠ Template status on Facebook:', fbTemplate.status);
  }
  
  const messagePayload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: to,
    type: 'template',
    template: {
      name: template.templateName,
      language: {
        code: actualLanguage
      }
    }
  };

  // Add components for templates with media
  const components = [];

  // Handle regular header media (IMAGE/VIDEO/DOCUMENT)
  if (template.headerMedia && template.headerMedia.mediaType && mediaUrls.headerUrl) {
    components.push({
      type: 'header',
      parameters: [{
        type: template.headerMedia.mediaType.toLowerCase(),
        [template.headerMedia.mediaType.toLowerCase()]: {
          link: mediaUrls.headerUrl
        }
      }]
    });
  }

  // Handle carousel media
  if (template.carouselMedia && template.carouselMedia.length > 0 && mediaUrls.carouselUrls) {
    const carouselCards = template.carouselMedia.map((card, index) => ({
      card_index: card.cardIndex,
      components: [{
        type: 'header',
        parameters: [{
          type: card.mediaType.toLowerCase(),
          [card.mediaType.toLowerCase()]: {
            link: mediaUrls.carouselUrls[index]
          }
        }]
      }]
    }));

    components.push({
      type: 'carousel',
      cards: carouselCards
    });
  }

  // Add components to payload if any exist
  if (components.length > 0) {
    messagePayload.template.components = components;
  }

  console.log('messagePayload', JSON.stringify(messagePayload, null, 2));
  console.log('📞 Phone number format check:', to, '(should have + prefix)');

  try {
    const response = await axios.post(url, messagePayload, {
      headers: {
        'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

	console.log('response', response.data);
    
    return response.data;
  } catch (error) {
    console.error('WhatsApp API Error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error?.message || 'Failed to send WhatsApp message');
  }
}

/**
 * POST /api/whatsapp/send
 * Send WhatsApp message with template
 */
router.post('/send-template', isCollege, async (req, res) => {
  try {
    const { templateName, to, collegeId } = req.body;

    // Validation
    if (!templateName || !to) {
      return res.status(400).json({
        success: false,
        message: 'templateName and to are required'
      });
    }

    // Format phone number
    let formattedPhone;
    try {
      formattedPhone = formatPhoneNumber(to);
		} catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    // Fetch template from database
    const query = { templateName };
    if (collegeId) {
      query.collegeId = collegeId;
    }

    const template = await WhatsAppTemplate.findOne(query);

    if (!template) {
      return res.status(404).json({
				success: false, 
        message: 'Template not found'
      });
    }

    // Check if template is approved
    // if (template.status !== 'APPROVED') {
    //   return res.status(400).json({
    //     success: false,
    //     message: `Template status is ${template.status}. Only APPROVED templates can be sent.`
    //   });
    // }

    // Get media URLs directly from database
    const mediaUrls = {};

    // Get header media URL if exists
    if (template.headerMedia && template.headerMedia.s3Url) {
      mediaUrls.headerUrl = getMediaUrl(template.headerMedia.s3Url);
    }

    // Get carousel media URLs if exists
    if (template.carouselMedia && template.carouselMedia.length > 0) {
      mediaUrls.carouselUrls = template.carouselMedia.map(card => 
        getMediaUrl(card.s3Url)
      );
    }

    // Send WhatsApp message
    const whatsappResponse = await sendWhatsAppMessage(
      formattedPhone,
      template,
      mediaUrls
    );

    // Fetch full template details from Facebook to get all components
    const fbTemplate = await fetchTemplateFromFacebook(template.templateName);
    
    // Prepare template data with components for saving
    const templateDataToSave = {
      templateName: template.templateName,
      language: fbTemplate ? fbTemplate.language : template.language,
      category: fbTemplate ? fbTemplate.category : template.category,
      components: fbTemplate ? fbTemplate.components : [],
      headerMedia: template.headerMedia,
      carouselMedia: template.carouselMedia
    };

    // Save message to database
    try {
      await saveMessageToDatabase({
        collegeId: collegeId || req.college?._id,
        to: formattedPhone,
        message: `Template: ${template.templateName}`,
        templateName: template.templateName,
        messageType: 'template',
        templateData: templateDataToSave,
        whatsappMessageId: whatsappResponse.messages[0].id
      });
      console.log('✓ Template message saved to database with components');
    } catch (dbError) {
      console.error('⚠ DB save error (non-critical):', dbError.message);
      // Continue - DB save is optional
    }

    // Return success response
    return res.status(200).json({
      success: true,
      message: 'WhatsApp message sent successfully',
      data: {
        messageId: whatsappResponse.messages[0].id,
        to: formattedPhone,
        templateName: template.templateName,
        templateData: templateDataToSave,
        status: 'sent'
      }
    });

	} catch (error) {
    console.error('Send WhatsApp Error:', error);
    return res.status(500).json({
			success: false,
      message: error.message || 'Failed to send WhatsApp message',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
		});
	}
});






/**
 * GET /api/whatsapp/verify-template/:templateName
 * Manually verify template details from Facebook
 */
router.get('/verify-template/:templateName', async (req, res) => {
  try {
    const { templateName } = req.params;
    
    if (!templateName) {
      return res.status(400).json({
        success: false,
        message: 'Template name is required'
      });
    }

    const fbTemplate = await fetchTemplateFromFacebook(templateName);
    
    if (!fbTemplate) {
      return res.status(404).json({
        success: false,
        message: 'Template not found on Facebook/WhatsApp'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        name: fbTemplate.name,
        language: fbTemplate.language,
        status: fbTemplate.status,
        category: fbTemplate.category,
        id: fbTemplate.id,
        components: fbTemplate.components
      }
    });
  } catch (error) {
    console.error('Verify Template Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to verify template'
    });
	}
});

// Send regular WhatsApp message (not template)
router.post('/send-message', isCollege, async (req, res) => {
	try {
		const { to, message, collegeId } = req.body;

		// Validation
		if (!to || !message) {
			return res.status(400).json({
				success: false,
				message: 'to and message are required'
			});
		}

		// Format phone number
		let formattedPhone;
		try {
			formattedPhone = formatPhoneNumber(to);
		} catch (error) {
			return res.status(400).json({
				success: false,
				message: error.message
			});
		}

		// Send message via WhatsApp API
		const url = `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
		
		const messageData = {
			messaging_product: 'whatsapp',
			to: formattedPhone,
			type: 'text',
			text: {
				body: message
			}
		};

		const response = await axios.post(url, messageData, {
			headers: {
				'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
				'Content-Type': 'application/json'
			}
		});

		// Save message to database
		await saveMessageToDatabase({
			to: formattedPhone,
			message: message,
			collegeId: collegeId,
			messageType: 'text'
		});

		res.json({
			success: true,
			message: 'Message sent successfully',
			data: {
				messageId: response.data.messages[0].id,
				to: formattedPhone,
				status: 'sent'
			}
		});

	} catch (error) {
		console.error('Send Message Error:', error);
		res.status(500).json({
			success: false,
			message: error.response?.data?.error?.message || 'Failed to send message',
			error: process.env.NODE_ENV === 'development' ? error.stack : undefined
		});
	}
});

// Get chat history for a specific contact
router.get('/chat-history/:phone', [isCollege], async (req, res) => {
	try {
		const { phone } = req.params;
		const collegeId = req.collegeId || req.college?._id || req.user?.college?._id;
		
		if (!phone || !collegeId) {
			return res.status(400).json({
				success: false,
				message: 'Phone number and college ID are required'
			});
		}
		
		// Format phone number
		const formattedPhone = formatPhoneNumber(phone);
		
		// Fetch messages from database
		const messages = await WhatsAppMessage.find({
			collegeId: collegeId,
			to: formattedPhone
		}).sort({ sentAt: 1 });
		
		res.json({
			success: true,
			message: 'Chat history fetched successfully',
			data: messages
		});
		
	} catch (error) {
		console.error('Get Chat History Error:', error);
		res.status(500).json({
			success: false,
			message: 'Failed to fetch chat history',
			error: process.env.NODE_ENV === 'development' ? error.message : undefined
		});
	}
});

/**
 * Webhook Verification (GET)
 * Facebook/WhatsApp will send a verification request to this endpoint
 */
router.get('/webhook', async (req, res) => {
	try {
		const mode = req.query['hub.mode'];
		const token = req.query['hub.verify_token'];
		const challenge = req.query['hub.challenge'];

		// Get verify token from environment
		const VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'focalyt_webhook_token_2024';

		console.log('📞 Webhook Verification Request:', { mode, token });

		// Check if mode and token are correct
		if (mode === 'subscribe' && token === VERIFY_TOKEN) {
			console.log('✅ Webhook verified successfully');
			return res.status(200).send(challenge);
		} else {
			console.error('❌ Webhook verification failed');
			return res.sendStatus(403);
		}
	} catch (error) {
		console.error('Webhook Verification Error:', error);
		return res.sendStatus(500);
	}
});

/**
 * Webhook Handler (POST)
 * Receives status updates, incoming messages, and other events from WhatsApp
 */
router.post('/webhook', async (req, res) => {
	try {
		const body = req.body;

		console.log('📨 Webhook received:', JSON.stringify(body, null, 2));

		// Check if this is a WhatsApp Business API event
		if (body.object === 'whatsapp_business_account') {
			// Loop through entries (can have multiple)
			for (const entry of body.entry) {
				// Loop through changes
				for (const change of entry.changes) {
					// Get the value object
					const value = change.value;

					// Handle status updates
					if (value.statuses) {
						await handleStatusUpdates(value.statuses);
					}

					// Handle incoming messages (optional - for future use)
					if (value.messages) {
						await handleIncomingMessages(value.messages, value.metadata);
					}

					// Handle template status updates (approval/rejection)
					if (value.message_template_status_update) {
						await handleTemplateStatusUpdate(value.message_template_status_update);
					}

					// Handle errors
					if (value.errors) {
						console.error('WhatsApp Error:', value.errors);
					}
				}
			}

			// Send 200 OK response
			return res.sendStatus(200);
		} else {
			console.warn('Unknown webhook event:', body.object);
			return res.sendStatus(404);
		}
	} catch (error) {
		console.error('Webhook Handler Error:', error);
		// Always return 200 to avoid webhook retry storms
		return res.sendStatus(200);
	}
});

/**
 * Handle status updates (sent, delivered, read, failed)
 */
async function handleStatusUpdates(statuses) {
	try {
		for (const status of statuses) {
			const messageId = status.id; // WhatsApp message ID
			const recipientId = status.recipient_id; // Phone number
			const statusValue = status.status; // sent, delivered, read, failed
			const timestamp = status.timestamp; // Unix timestamp

			console.log(`📊 Status Update: ${statusValue} for message ${messageId} to ${recipientId}`);

			// Find and update message in database
			const updateData = {
				status: statusValue
			};

			// Update specific timestamp based on status
			if (statusValue === 'delivered') {
				updateData.deliveredAt = new Date(parseInt(timestamp) * 1000);
			} else if (statusValue === 'read') {
				updateData.readAt = new Date(parseInt(timestamp) * 1000);
			} else if (statusValue === 'failed') {
				updateData.errorMessage = status.errors?.[0]?.title || 'Message failed';
			}

			// Update in database
			const updatedMessage = await WhatsAppMessage.findOneAndUpdate(
				{ whatsappMessageId: messageId },
				updateData,
				{ new: true }
			);

			if (updatedMessage) {
				console.log(`✅ Updated message ${messageId} status to ${statusValue}`);

				const notificationData = {
					type: 'message_status_update',
					messageId: messageId,
					status: statusValue,
					to: recipientId,
					candidateId: updatedMessage.candidateId,
					timestamp: new Date(parseInt(timestamp) * 1000),
					message: updatedMessage.message
				};

			// Broadcast Socket.io notification to ALL active clients
			if (global.io) {
				try {
					const totalClients = global.io.sockets.sockets.size;
					const broadcastData = {
						collegeId: updatedMessage.collegeId,
						...notificationData
					};
					
					console.log(`🔔 [WhatsApp Broadcast] Attempting to broadcast to ${totalClients} active client(s)`);
					console.log(`🔔 [WhatsApp Broadcast] College ID: ${updatedMessage.collegeId}`);
					console.log(`🔔 [WhatsApp Broadcast] Broadcast data:`, JSON.stringify(broadcastData, null, 2));
					
					global.io.emit('whatsapp_message_update', broadcastData);
					
					console.log(`✅ [WhatsApp Broadcast] Successfully broadcasted to all ${totalClients} client(s)`);
				} catch (ioError) {
					console.error('❌ [WhatsApp Broadcast] Socket.io notification failed:', ioError.message);
					console.error('❌ [WhatsApp Broadcast] Error stack:', ioError.stack);
				}
			} else {
				console.log('⚠️ [WhatsApp Broadcast] Socket.io not available - global.io is undefined');
			}
			} else {
				console.warn(`⚠️ Message not found in database: ${messageId}`);
			}

			// Handle conversation events
			if (status.conversation) {
				console.log('💬 Conversation:', status.conversation);
			}

			// Handle pricing
			if (status.pricing) {
				console.log('💰 Pricing:', status.pricing);
			}
		}
	} catch (error) {
		console.error('Error handling status updates:', error);
		throw error;
	}
}

/**
 * Handle incoming messages (for future implementation)
 */
async function handleIncomingMessages(messages, metadata) {
	try {
		for (const message of messages) {
			console.log('📬 Incoming message:', {
				from: message.from,
				type: message.type,
				timestamp: message.timestamp,
				messageId: message.id
			});

			// Future: Save incoming messages to database
			// Future: Send WebSocket notification to agent dashboard
			// Future: Auto-reply logic
		}
	} catch (error) {
		console.error('Error handling incoming messages:', error);
	}
}

/**
 * Handle template status updates (approval/rejection)
 */
async function handleTemplateStatusUpdate(templateStatusUpdates) {
	try {
		for (const templateUpdate of templateStatusUpdates) {
			const templateId = templateUpdate.id;
			const templateName = templateUpdate.name;
			const status = templateUpdate.status; // APPROVED, REJECTED, PENDING
			const rejectionReason = templateUpdate.rejected_reason;
			const timestamp = templateUpdate.timestamp;

			console.log(`📋 Template Status Update: ${templateName} (${templateId}) - ${status}`);

			// Find template in database by templateId or templateName
			const updateData = {
				status: status,
				updatedAt: new Date(parseInt(timestamp) * 1000)
			};

			// Add rejection reason if template was rejected
			if (status === 'REJECTED' && rejectionReason) {
				updateData.rejectionReason = rejectionReason;
				console.log(`❌ Template rejected: ${rejectionReason}`);
			}

			// Update template in database
			const updatedTemplate = await WhatsAppTemplate.findOneAndUpdate(
				{ 
					$or: [
						{ templateId: templateId },
						{ templateName: templateName }
					]
				},
				updateData,
				{ new: true }
			);

			if (updatedTemplate) {
				console.log(`✅ Template status updated in database: ${templateName} - ${status}`);

				const templateNotificationData = {
					type: 'template_status_update',
					templateId: templateId,
					templateName: templateName,
					status: status,
					rejectionReason: rejectionReason,
					timestamp: new Date(parseInt(timestamp) * 1000),
					message: status === 'APPROVED' 
						? `Template "${templateName}" has been approved and is ready to use!`
						: status === 'REJECTED'
						? `Template "${templateName}" was rejected: ${rejectionReason}`
						: `Template "${templateName}" status updated to ${status}`
				};

				// Broadcast Socket.io notification to ALL active clients
				if (global.io) {
					try {
						const totalClients = global.io.sockets.sockets.size;
						global.io.emit('whatsapp_template_update', {
							collegeId: updatedTemplate.collegeId,
							...templateNotificationData
						});
						console.log(`🔔 Broadcasted WhatsApp template update to ${totalClients} active client(s)`);
					} catch (ioError) {
						console.error('Template status Socket.io notification failed:', ioError.message);
					}
				}
			} else {
				console.warn(`⚠️ Template not found in database: ${templateName} (${templateId})`);
			}
		}
	} catch (error) {
		console.error('Error handling template status updates:', error);
		throw error;
	}
}

module.exports = router;