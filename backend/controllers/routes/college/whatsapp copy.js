const express = require('express');
const router = express.Router();
const axios = require('axios');
const AWS = require("aws-sdk");
const uuid = require('uuid/v1');
const multer = require('multer');
const FormData = require('form-data');
const { College, WhatsAppMessage, WhatsAppTemplate, Candidate } = require('../../models');
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
const allowedAudioExtensions = ['mp3', 'aac', 'm4a', 'amr', 'ogg', 'opus'];
const allowedDocumentExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'];
const allowedExtensions = [...allowedVideoExtensions, ...allowedImageExtensions, ...allowedAudioExtensions, ...allowedDocumentExtensions];

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
	storage: storage,
	limits: {
		fileSize: 25 * 1024 * 1024, // 25MB limit for WhatsApp
	},
	fileFilter: (req, file, cb) => {
		const ext = file.originalname.split('.').pop().toLowerCase();
		console.log(`🔍 Multer fileFilter - checking extension: ${ext}`);
		if (allowedExtensions.includes(ext)) {
			console.log(`✅ Extension ${ext} is allowed`);
			cb(null, true);
		} else {
			console.log(`❌ Extension ${ext} is NOT allowed`);
			cb(new Error(`File type not supported: ${ext}. Allowed: ${allowedExtensions.join(', ')}`), false);
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
						// console.log(`Found database media for template: ${template.name}`);
						
						// Add variable mappings to template
						if (dbTemplate.variableMappings && dbTemplate.variableMappings.length > 0) {
							template.variableMappings = dbTemplate.variableMappings;
							console.log(`  - Added variable mappings:`, dbTemplate.variableMappings);
						}
						
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

		// Send Socket.io notification
		if (global.io) {
			global.io.emit('whatsapp_template_sync', {
				collegeId: req.collegeId,
				type: 'templates_synced',
				message: 'Templates synced successfully from Meta',
				timestamp: new Date().toISOString()
			});
			console.log('📤 Socket.io event emitted: whatsapp_template_sync');
			console.log('   - College ID:', req.collegeId);
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

		// Send Socket.io error notification
		if (global.io) {
			global.io.emit('whatsapp_template_sync_error', {
				collegeId: req.collegeId,
				type: 'templates_sync_error',
				error: errorMessage,
				timestamp: new Date().toISOString()
			});
			console.log('📤 Socket.io event emitted: whatsapp_template_sync_error');
			console.log('   - College ID:', req.collegeId);
			console.log('   - Error:', errorMessage);
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
		
		// Track variable mappings for database storage
		let variableMappings = [];

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
			
			// Handle BODY component - convert named variables to numbered and add examples
			if (component.type === 'BODY' && component.text) {
				// Find all variables in format {{variable_name}} or {{1}}, {{2}}, etc.
				const variableRegex = /\{\{[^}]+\}\}/g;
				const variables = component.text.match(variableRegex);
				
				if (variables && variables.length > 0) {
					// Convert named variables to numbered format for WhatsApp API
					let numberedText = component.text;
					const bodyVariableMappings = [];
					
					variables.forEach((variable, index) => {
						// Extract variable name/number from {{...}}
						const varName = variable.replace(/\{\{|\}\}/g, '').trim();
						
						// Check if it's already a number
						const isNumber = /^\d+$/.test(varName);
						
						if (!isNumber) {
							// Convert named variable to numbered: {{name}} -> {{1}}
							numberedText = numberedText.replace(variable, `{{${index + 1}}}`);
							// Store mapping: position -> variable name
							bodyVariableMappings.push({
								position: index + 1,
								variableName: varName
							});
						}
					});
					
					// Store variable mappings for this template
					if (bodyVariableMappings.length > 0) {
						variableMappings = bodyVariableMappings;
					}
					
					// Update component text with numbered variables
					processedComponent.text = numberedText;
					
					// Use example from frontend if provided, otherwise generate defaults
					let exampleValues = [];
					
					if (component.example && component.example.body_text && Array.isArray(component.example.body_text[0])) {
						// Frontend ne example values bheje hain - use those
						exampleValues = component.example.body_text[0];
						console.log(`✅ Using examples from frontend:`, exampleValues);
					} else {
						// Generate default examples as fallback
						console.log(`⚠️  No examples from frontend, generating defaults...`);
						exampleValues = variables.map((variable, index) => {
							const varName = variable.replace(/\{\{|\}\}/g, '').trim();
							
							// Create appropriate example value based on variable name
							if (varName === 'name' || varName.includes('name')) {
								return 'John Doe';
							} else if (varName === 'gender') {
								return 'Male';
							} else if (varName === 'mobile' || varName.includes('mobile') || varName.includes('phone')) {
								return '9876543210';
							} else if (varName === 'email') {
								return 'user@example.com';
							} else if (varName.includes('course')) {
								return 'Sample Course';
							} else if (varName.includes('job')) {
								return 'Sample Job';
							} else if (varName.includes('batch')) {
								return 'Batch 2025';
							} else if (varName.includes('date')) {
								return '2025-01-01';
							} else {
								return 'Sample Value';
							}
						});
					}
					
					// Ensure we have enough examples for all variables
					if (exampleValues.length < variables.length) {
						console.warn(`⚠️  Example count (${exampleValues.length}) < Variable count (${variables.length})`);
						// Pad with 'Sample Value'
						while (exampleValues.length < variables.length) {
							exampleValues.push('Sample Value');
						}
					}
					
					// Add example to component
					// WhatsApp API expects: { "body_text": [["value1", "value2", ...]] }
					processedComponent.example = {
						body_text: [exampleValues]
					};
					
					console.log(`✅ Converted ${variables.length} variables to numbered format`);
					console.log(`   Original: ${component.text.substring(0, 100)}...`);
					console.log(`   Numbered: ${numberedText.substring(0, 100)}...`);
					console.log(`   Examples:`, exampleValues);
					console.log(`   Mappings:`, bodyVariableMappings);
				}
			}
			
			// Handle BUTTONS component - ensure proper structure
			if (component.type === 'BUTTONS' && component.buttons) {
				processedComponent.buttons = component.buttons.map(button => ({
					type: button.type,
					text: button.text,
					...(button.url && { url: button.url })
				}));
			}
			
			// Remove example property if it's empty or undefined (but keep valid examples)
			if (!processedComponent.example || Object.keys(processedComponent.example).length === 0) {
				delete processedComponent.example;
			} else {
				// Log the example being kept for debugging
				console.log(`Keeping example for ${component.type}:`, JSON.stringify(processedComponent.example, null, 2));
			}
			
			templateData.components.push(processedComponent);
		});

		// Debug: Log final template data being sent to Facebook
		console.log('=== Final Template Data Being Sent to Facebook ===');
		console.log(JSON.stringify(templateData, null, 2));

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
					headerMedia: savedHeaderMedia, // Save header media
					variableMappings: variableMappings // Save variable mappings
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
    // console.log('Message saved to database:', savedMessage._id);
    // console.log('WhatsApp Message ID:', whatsappMessageId);
    
    return savedMessage;
  } catch (error) {
    console.error('Error saving message to database:', error);
    throw error;
  }
}

/**
 * Send WhatsApp message with template
 */
async function sendWhatsAppMessage(to, template, mediaUrls = {}, candidateData = null, variableValues = null) {
  const url = `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
  const { getVariablesInText, replaceVariables } = require('../../../helpers/whatsappVariableMapper');
  
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

  // Add components for templates with media and variables
  const components = [];
  
  // Extract variables from template and prepare parameters
  let bodyParameters = [];
  if (fbTemplate && fbTemplate.components) {
    const bodyComponent = fbTemplate.components.find(c => c.type === 'BODY');
    if (bodyComponent && bodyComponent.text) {
      const variables = getVariablesInText(bodyComponent.text);
      console.log('📝 Variables found in template:', variables);
      
      // Use variableValues from frontend if provided (preferred method)
      if (variableValues && Array.isArray(variableValues) && variableValues.length > 0) {
        console.log('✅ Using variableValues from frontend (same as preview):', variableValues);
        
        bodyParameters = variableValues.map((value, index) => {
          const varName = variables[index] || `${index + 1}`;
          console.log(`   {{${varName}}} → ${value}`);
          
          return {
            type: 'text',
            text: value || `[Variable ${varName}]`
          };
        });
      } else if (candidateData) {
        // Fallback: Calculate from candidateData if variableValues not provided
        console.log('⚠️  variableValues not provided, calculating from candidateData...');
      
      // Get variable mappings from database template
      const variableMappings = template.variableMappings || [];
      console.log('🗺️  Variable mappings from DB:', variableMappings);
      
      // Create parameters array with actual values
      bodyParameters = variables.map(varName => {
        // varName will be like "1", "2", "3" (numbered)
        const isNumbered = /^\d+$/.test(varName);
        
        let actualValue = '';
        
        if (isNumbered && variableMappings.length > 0) {
          // Find the mapping for this numbered variable
          const mapping = variableMappings.find(m => m.position === parseInt(varName));
          
          if (mapping) {
              // Get the actual variable name (e.g., "name", "email", "course_name")
            const actualVarName = mapping.variableName;
            console.log(`   {{${varName}}} → ${actualVarName}`);
            
              // Get value directly from candidate data based on variable name
              switch (actualVarName) {
                case 'name':
                  actualValue = candidateData.name || candidateData.candidate_name || 'User';
                  break;
                case 'gender':
                  actualValue = candidateData.gender || 'Male';
                  break;
                case 'mobile':
                  actualValue = candidateData.mobile || candidateData.phone || 'Mobile';
                  break;
                case 'email':
                  actualValue = candidateData.email || 'Email';
                  break;
                case 'course_name':
                  actualValue = candidateData._appliedCourse?.courseName || candidateData.courseName || 'Course Name';
                  break;
                case 'counselor_name':
                  actualValue = candidateData._concernPerson?.name || 
                                (candidateData.leadAssignment && candidateData.leadAssignment.length > 0 
                                  ? candidateData.leadAssignment[candidateData.leadAssignment.length - 1].counsellorName 
                                  : null) || 'Counselor';
                  break;
                case 'job_name':
                  actualValue = candidateData._appliedJob?.title || candidateData.jobTitle || 'Job Title';
                  break;
                case 'project_name':
                  actualValue = candidateData._project?.name || candidateData._college?.name || 'Project Name';
                  break;
                case 'batch_name':
                  actualValue = candidateData._batch?.name || candidateData.batchName || 'Batch Name';
                  break;
                case 'lead_owner_name':
                  actualValue = candidateData.registeredBy?.name || candidateData._concernPerson?.name || 'Lead Owner';
                  break;
                default:
                  // Try using replaceVariables for other variables
            actualValue = replaceVariables(`{{${actualVarName}}}`, candidateData);
            actualValue = actualValue.replace(/^\[|\]$/g, '');
                  if (!actualValue || actualValue === `[${actualVarName}]`) {
                    // Fallback to direct property access
                    actualValue = candidateData[actualVarName] || `[${actualVarName}]`;
                  }
              }
              
            console.log(`      Value: ${actualValue}`);
          } else {
            console.warn(`   ⚠️  No mapping found for {{${varName}}}`);
            actualValue = `[Variable ${varName}]`;
          }
        } else {
          // If not numbered or no mappings, use direct replacement
          actualValue = replaceVariables(`{{${varName}}}`, candidateData);
          actualValue = actualValue.replace(/^\[|\]$/g, '');
            if (!actualValue || actualValue === `[${varName}]`) {
              // Fallback to direct property access
              actualValue = candidateData[varName] || `[${varName}]`;
            }
          console.log(`   ${varName} = ${actualValue}`);
        }
        
        return {
          type: 'text',
          text: actualValue
        };
      });
      }
    }
  }
  
  // Add BODY component with variable parameters if exists
  if (bodyParameters.length > 0) {
    components.push({
      type: 'body',
      parameters: bodyParameters
    });
  }

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
/**
 * POST /api/whatsapp/validate-template-variables
 * Validate if candidate has all required variable data
 */
router.post('/validate-template-variables', isCollege, async (req, res) => {
  try {
    const { templateName, candidateId, registrationId, collegeId, mobile } = req.body;
    
    if (!templateName) {
      return res.status(400).json({
        success: false,
        message: 'templateName is required'
      });
    }
    
    // Fetch candidate data
    const { Candidate, CandidateRegister, College } = require('../../models');
    const { validateCandidateData } = require('../../../helpers/whatsappVariableMapper');
    
    let candidateData = null;
    
    // Try by candidateId first
    if (candidateId) {
      candidateData = await Candidate.findById(candidateId)
        .populate('_concernPerson', 'name email mobile')
        .populate({
          path: 'appliedCourses',
          select: 'courseName fees duration courseType',
          model: 'courses'
        })
        .populate({
          path: 'appliedJobs',
          select: 'title company location salary',
          model: 'Vacancy'
        })
        .lean();
        
      if (candidateData) {
        candidateData._appliedCourse = candidateData.appliedCourses?.[0] || null;
        candidateData._appliedJob = candidateData.appliedJobs?.[0] || null;
      }
    }
    
    // Try by registrationId
    if (!candidateData && registrationId) {
      candidateData = await CandidateRegister.findById(registrationId)
        .populate('_concernPerson', 'name email mobile')
        .lean();
    }
    
    // Try by mobile number as fallback
    if (!candidateData && mobile) {
      // Convert to string first if it's a number
      const mobileStr = String(mobile);
      let cleanMobile = mobileStr.replace(/^\+91/, '').replace(/^\+/, '').replace(/\s/g, '');
      
      candidateData = await Candidate.findOne({ 
        $or: [
          { mobile: cleanMobile },
          { mobile: parseInt(cleanMobile) },
          { mobile: mobile },
          { mobile: mobileStr },
          { mobile: `+${cleanMobile}` },
          { mobile: `91${cleanMobile}` },
          { mobile: parseInt(`91${cleanMobile}`) }
        ]
      })
        .populate('_concernPerson', 'name email mobile')
        .populate({
          path: 'appliedCourses',
          select: 'courseName fees duration courseType',
          model: 'courses'
        })
        .populate({
          path: 'appliedJobs',
          select: 'title company location salary',
          model: 'Vacancy'
        })
        .lean();
      
      if (candidateData) {
        candidateData._appliedCourse = candidateData.appliedCourses?.[0] || null;
        candidateData._appliedJob = candidateData.appliedJobs?.[0] || null;
      } else {
        // Try CandidateRegister model by mobile
        candidateData = await CandidateRegister.findOne({ 
          $or: [
            { mobile: cleanMobile },
            { mobile: parseInt(cleanMobile) },
            { mobile: mobile },
            { mobile: mobileStr },
            { mobile: `+${cleanMobile}` },
            { mobile: `91${cleanMobile}` }
          ]
        })
          .populate('_concernPerson', 'name email mobile')
          .lean();
      }
    }
    
    if (collegeId && candidateData) {
      const collegeInfo = await College.findById(collegeId)
        .select('name email phone address')
        .lean();
      candidateData._college = collegeInfo;
    }
    
    if (!candidateData) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found by ID or mobile number'
      });
    }
    
    // Fetch template
    const template = await WhatsAppTemplate.findOne({ templateName });
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }
    
    // Get template from Facebook to get actual body text
    const fbTemplate = await fetchTemplateFromFacebook(templateName);
    if (!fbTemplate) {
      return res.status(404).json({
        success: false,
        message: 'Template not found on WhatsApp'
      });
    }
    
    const bodyComponent = fbTemplate.components?.find(c => c.type === 'BODY');
    if (!bodyComponent || !bodyComponent.text) {
      return res.status(200).json({
        success: true,
        valid: true,
        message: 'No variables in template',
        missingVariables: []
      });
    }
    
    // Validate candidate data
    const validation = validateCandidateData(bodyComponent.text, candidateData);
    
    return res.status(200).json({
      success: true,
      ...validation,
      message: validation.valid ? 'All variables are available' : 'Some variables are missing'
    });
    
  } catch (error) {
    console.error('Validation Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to validate template variables'
    });
  }
});

router.post('/send-template', isCollege, async (req, res) => {
  try {
    const { templateName, to, collegeId, candidateId, registrationId, variableValues } = req.body;

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

    // Fetch candidate/registration data
    // Priority: candidateId > registrationId > mobile number
    let candidateData = null;
    const { Candidate, CandidateRegister, Course, User, College, Vacancy, AppliedCourses } = require('../../models');
    const { replaceVariablesInComponents } = require('../../../helpers/whatsappVariableMapper');
    
    console.log('🔍 Request params:', { templateName, to, candidateId, registrationId, collegeId });
    
    // Try to fetch candidate data by ID first
    if (candidateId) {
      console.log('📥 Fetching candidate data by ID:', candidateId);
      candidateData = await Candidate.findById(candidateId)
        .populate('_concernPerson', 'name email mobile')
        .populate({
          path: 'appliedCourses',
          select: 'courseName fees duration courseType',
          model: 'courses'
        })
        .populate({
          path: 'appliedJobs',
          select: 'title company location salary',
          model: 'Vacancy'
        })
        .lean();
        
      if (candidateData) {
        console.log('✅ Candidate data found by ID');
      }
    } 
    
    // If not found by ID, try registration ID (AppliedCourses model)
    if (!candidateData && registrationId) {
      console.log('📥 Fetching registration data by ID from AppliedCourses:', registrationId);
      const appliedCourse = await AppliedCourses.findById(registrationId)
        .populate('_candidate', 'name gender mobile email')
        .populate({
          path: '_course',
          select: 'name courseName fees duration courseType',
          populate: {
            path: 'project',
            select: 'name'
          }
        })
        .populate('counsellor', 'name email mobile')
        .populate('registeredBy', 'name email mobile')
        .populate('batch', 'name startDate timing')
        .lean();
      
      if (appliedCourse) {
        console.log('✅ AppliedCourses data found by ID');
        
        // Structure data to match variable mapper expectations
        candidateData = {
          // Basic info from candidate
          name: appliedCourse._candidate?.name,
          gender: appliedCourse._candidate?.gender,
          mobile: appliedCourse._candidate?.mobile || appliedCourse._candidate?.mobile,
          email: appliedCourse._candidate?.email,
          
          // Course info
          _appliedCourse: {
            courseName: appliedCourse._course?.name || appliedCourse._course?.courseName,
            fees: appliedCourse._course?.fees,
            duration: appliedCourse._course?.duration,
            courseType: appliedCourse._course?.courseType
          },
          
          // Counsellor info
          _concernPerson: appliedCourse.counsellor ? {
            name: appliedCourse.counsellor.name,
            email: appliedCourse.counsellor.email,
            mobile: appliedCourse.counsellor.mobile
          } : (appliedCourse.leadAssignment && appliedCourse.leadAssignment.length > 0 ? {
            name: appliedCourse.leadAssignment[appliedCourse.leadAssignment.length - 1].counsellorName
          } : null),
          
          // Lead owner (registeredBy)
          registeredBy: appliedCourse.registeredBy ? {
            name: appliedCourse.registeredBy.name
          } : null,
          
          // Batch info
          _batch: appliedCourse.batch ? {
            name: appliedCourse.batch.name,
            startDate: appliedCourse.batch.startDate,
            timing: appliedCourse.batch.timing
          } : null,
          
          // Project/College info
          _project: appliedCourse._course?.project ? {
            name: appliedCourse._course.project.name
          } : null,
          
          // Lead assignment history (for fallback)
          leadAssignment: appliedCourse.leadAssignment || []
        };
        
        console.log('✅ Registration data structured:', {
          name: candidateData.name,
          course: candidateData._appliedCourse?.courseName,
          counsellor: candidateData._concernPerson?.name,
          registeredBy: candidateData.registeredBy?.name
        });
      }
    }
    
    // If still not found, try to find by mobile number
    if (!candidateData && to) {
      console.log('📥 Fetching candidate data by mobile number:', to);
      
      // Convert to string first if it's a number
      const mobileStr = String(to);
      
      // Clean mobile number (remove + and country code if present)
      let cleanMobile = mobileStr.replace(/^\+91/, '').replace(/^\+/, '').replace(/\s/g, '');
      
      // Try to find candidate by mobile (check both string and number formats)
      candidateData = await Candidate.findOne({ 
        $or: [
          { mobile: cleanMobile },
          { mobile: parseInt(cleanMobile) },
          { mobile: to },
          { mobile: mobileStr },
          { mobile: `+${cleanMobile}` },
          { mobile: `91${cleanMobile}` },
          { mobile: parseInt(`91${cleanMobile}`) }
        ]
      })
        .populate('_concernPerson', 'name email mobile')
        .populate({
          path: 'appliedCourses',
          select: 'courseName fees duration courseType',
          model: 'courses'
        })
        .populate({
          path: 'appliedJobs',
          select: 'title company location salary',
          model: 'Vacancy'
        })
        .lean();
      
      if (candidateData) {
        console.log('✅ Candidate data found by mobile number:', {
          name: candidateData.name,
          mobile: candidateData.mobile,
          email: candidateData.email,
          coursesCount: candidateData.appliedCourses?.length || 0
        });
      } else {
        // Try registration model with same mobile variations
        candidateData = await CandidateRegister.findOne({ 
          $or: [
            { mobile: cleanMobile },
            { mobile: parseInt(cleanMobile) },
            { mobile: to },
            { mobile: mobileStr },
            { mobile: `+${cleanMobile}` },
            { mobile: `91${cleanMobile}` },
            { mobile: parseInt(`91${cleanMobile}`) }
          ]
        })
          .populate('_concernPerson', 'name email mobile')
          .lean();
        
        if (candidateData) {
          console.log('✅ Registration data found by mobile number');
        }
      }
    }
    
    // Set course/job if found
    if (candidateData) {
      candidateData._appliedCourse = candidateData.appliedCourses?.[0] || null;
      candidateData._appliedJob = candidateData.appliedJobs?.[0] || null;
      
      console.log('📊 Final candidate data:', {
        name: candidateData.name,
        mobile: candidateData.mobile,
        email: candidateData.email,
        counselor: candidateData._concernPerson?.name || 'N/A',
        course: candidateData._appliedCourse?.courseName || 'N/A'
      });
    } else {
      console.warn('⚠️  No candidate data found - variables will use default values');
    }
    
    // Fetch college info if collegeId exists
    if (collegeId && candidateData) {
      const collegeInfo = await College.findById(collegeId)
        .select('name email phone address')
        .lean();
      candidateData._college = collegeInfo;
      console.log('✅ College info added:', collegeInfo?.name);
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

    // Send WhatsApp message with variable values from frontend (or candidate data as fallback)
    const whatsappResponse = await sendWhatsAppMessage(
      formattedPhone,
      template,
      mediaUrls,
      candidateData,
      variableValues // ✅ Pass variableValues from frontend (same as preview)
    );
    
    console.log('✅ WhatsApp message sent with variables:', candidateData ? 'YES' : 'NO');

    // Fetch full template details from Facebook to get all components
    const fbTemplate = await fetchTemplateFromFacebook(template.templateName);
    
    // Generate filled message text for database storage using stored variable mappings
    const generateFilledMessageForDB = (templateText, candidateData, variableMappings) => {
      if (!templateText || !candidateData) return `Template: ${template.templateName}`;
      
      let text = templateText;
      
      // Use stored variable mappings from database to replace variables correctly
      if (variableMappings && variableMappings.length > 0) {
        console.log('🗺️  Using stored variable mappings for DB message:', variableMappings);
        
        variableMappings.forEach(mapping => {
          const position = mapping.position;
          const variableName = mapping.variableName;
          
          // Get value based on actual variable name from mapping
          let value = '';
		  console.log('candidateData',candidateData)
          
          switch (variableName) {
            case 'name':
              value = candidateData.name || candidateData.candidate_name || 'User';
              break;
            case 'gender':
              value = candidateData.gender || 'Male';
              break;
            case 'mobile':
              value = candidateData.mobile || candidateData.phone || 'Mobile';
              break;
            case 'email':
              value = candidateData.email || 'Email';
              break;
            case 'course_name':
              value = candidateData._appliedCourse?.courseName || candidateData.courseName || 'Course Name';
              break;
            case 'counselor_name':
              value = candidateData._concernPerson?.name || 
                      (candidateData.leadAssignment && candidateData.leadAssignment.length > 0 
                        ? candidateData.leadAssignment[candidateData.leadAssignment.length - 1].counsellorName 
                        : null) || 'Counselor';
              break;
            case 'job_name':
              value = candidateData._appliedJob?.title || candidateData.jobTitle || 'Job Title';
              break;
            case 'project_name':
              value = candidateData._project?.name || candidateData._college?.name || 'Project Name';
              break;
            case 'batch_name':
              value = candidateData._batch?.name || candidateData.batchName || 'Batch Name';
              break;
            case 'lead_owner_name':
              value = candidateData.registeredBy?.name || candidateData._concernPerson?.name || 'Lead Owner';
              break;
            default:
              // Try direct property access
              value = candidateData[variableName] || `[${variableName}]`;
              break;
          }
          
          // Replace the numbered variable with actual value
          text = text.replace(new RegExp(`\\{\\{${position}\\}\\}`, 'g'), value);
          console.log(`   {{${position}}} (${variableName}) → ${value}`);
        });
      } else {
        console.log('⚠️  No variable mappings found, using fallback replacement');
        
        // Fallback: Use default mapping if no stored mappings
        text = text.replace(/\{\{1\}\}/g, candidateData.name || candidateData.candidate_name || 'User');
        text = text.replace(/\{\{2\}\}/g, candidateData.gender || 'Male');
        text = text.replace(/\{\{3\}\}/g, candidateData.mobile || candidateData.phone || 'Mobile');
        text = text.replace(/\{\{4\}\}/g, candidateData.email || 'Email');
        text = text.replace(/\{\{5\}\}/g, candidateData._appliedCourse?.courseName || candidateData.courseName || 'Course Name');
        text = text.replace(/\{\{6\}\}/g, candidateData._concernPerson?.name || 'Counselor');
        text = text.replace(/\{\{7\}\}/g, candidateData._appliedJob?.title || candidateData.jobTitle || 'Job Title');
        text = text.replace(/\{\{8\}\}/g, candidateData._college?.name || 'Project Name');
        text = text.replace(/\{\{9\}\}/g, candidateData.batchName || 'Batch Name');
        text = text.replace(/\{\{10\}\}/g, candidateData._concernPerson?.name || 'Lead Owner');
      }
      
      return text;
    };
    
    // Get filled message text - use variableValues from frontend if available
    const bodyComponent = fbTemplate?.components?.find(c => c.type === 'BODY');
    let filledMessage;
    
    if (variableValues && Array.isArray(variableValues) && variableValues.length > 0 && bodyComponent?.text) {
      // Use variableValues from frontend (same as preview and delivery)
      filledMessage = bodyComponent.text;
      const variableRegex = /\{\{(\d+)\}\}/g;
      const matches = [...bodyComponent.text.matchAll(variableRegex)];
      
      matches.forEach((match, index) => {
        if (index < variableValues.length && variableValues[index]) {
          const position = match[1];
          const replaceRegex = new RegExp(`\\{\\{${position}\\}\\}`, 'g');
          filledMessage = filledMessage.replace(replaceRegex, variableValues[index]);
        }
      });
      
      console.log('✅ Generated filledMessage from variableValues (frontend):', filledMessage);
    } else {
      // Fallback: Calculate from candidateData
      filledMessage = generateFilledMessageForDB(bodyComponent?.text, candidateData, template.variableMappings);
      console.log('⚠️  Generated filledMessage from candidateData (fallback):', filledMessage);
    }
    
    // Generate actual example values from candidateData for database storage
    const generateActualExamples = (templateText, candidateData, variableMappings) => {
      if (!templateText || !candidateData || !variableMappings || variableMappings.length === 0) {
        return [];
      }
      
      // Extract numbered variables from template ({{1}}, {{2}}, etc.)
      const variableRegex = /\{\{(\d+)\}\}/g;
      const matches = [...templateText.matchAll(variableRegex)];
      
      // Create example values array based on variable mappings
      const exampleValues = matches.map(match => {
        const position = parseInt(match[1]);
        const mapping = variableMappings.find(m => m.position === position);
        
        if (!mapping) return 'Sample Value';
        
        const variableName = mapping.variableName;
        let value = '';
        
        switch (variableName) {
          case 'name':
            value = candidateData.name || candidateData.candidate_name || 'User';
            break;
          case 'gender':
            value = candidateData.gender || 'Male';
            break;
          case 'mobile':
            value = candidateData.mobile || candidateData.phone || 'Mobile';
            break;
          case 'email':
            value = candidateData.email || 'Email';
            break;
          case 'course_name':
            value = candidateData._appliedCourse?.courseName || candidateData.courseName || 'Course Name';
            break;
          case 'counselor_name':
            value = candidateData._concernPerson?.name || 
                    (candidateData.leadAssignment && candidateData.leadAssignment.length > 0 
                      ? candidateData.leadAssignment[candidateData.leadAssignment.length - 1].counsellorName 
                      : null) || 'Counselor';
            break;
          case 'job_name':
            value = candidateData._appliedJob?.title || candidateData.jobTitle || 'Job Title';
            break;
          case 'project_name':
            value = candidateData._project?.name || candidateData._college?.name || 'Project Name';
            break;
          case 'batch_name':
            value = candidateData._batch?.name || candidateData.batchName || 'Batch Name';
            break;
          case 'lead_owner_name':
            value = candidateData.registeredBy?.name || candidateData._concernPerson?.name || 'Lead Owner';
            break;
          default:
            value = candidateData[variableName] || `[${variableName}]`;
        }
        
        return value;
      });
      
      return exampleValues;
    };
    
    // Prepare template data with components for saving
    let componentsToSave = fbTemplate ? JSON.parse(JSON.stringify(fbTemplate.components)) : [];
    
    // Update BODY component example with actual values used
    if (bodyComponent) {
      const bodyComponentIndex = componentsToSave.findIndex(c => c.type === 'BODY');
      if (bodyComponentIndex !== -1) {
        let actualExamples = [];
        
        // Use variableValues from frontend (same values that were sent to WhatsApp and shown in preview)
        if (variableValues && Array.isArray(variableValues) && variableValues.length > 0) {
          actualExamples = variableValues;
          console.log('✅ Using variableValues for BODY component example (from frontend):', actualExamples);
        } else if (candidateData && template.variableMappings) {
          // Fallback: Calculate from candidateData if variableValues not provided
          actualExamples = generateActualExamples(bodyComponent.text, candidateData, template.variableMappings);
        //   console.log('⚠️  Calculated example values from candidateData (fallback):', actualExamples);
        }
        
        if (actualExamples.length > 0) {
          componentsToSave[bodyComponentIndex].example = {
            body_text: [actualExamples]
          };
          console.log('✅ Updated BODY component example with values:', actualExamples);
        }
      }
    }
    
    const templateDataToSave = {
      templateName: template.templateName,
      language: fbTemplate ? fbTemplate.language : template.language,
      category: fbTemplate ? fbTemplate.category : template.category,
      components: componentsToSave,
      headerMedia: template.headerMedia,
      carouselMedia: template.carouselMedia
    };

    // Save message to database with FILLED message
    try {
      await saveMessageToDatabase({
        collegeId: collegeId || req.college?._id,
        to: formattedPhone,
        message: filledMessage, // ✅ Use filled message instead of generic
        templateName: template.templateName,
        messageType: 'template',
        templateData: templateDataToSave,
        candidateId: candidateData?._id,
        candidateName: candidateData?.name,
        whatsappMessageId: whatsappResponse.messages[0].id
      });
      console.log('✓ Template message saved to database with FILLED variables');
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
        filledMessage: filledMessage, // Include filled message for frontend display
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
		const { to, message, candidateId, candidateName } = req.body;
		
		// Get college ID from authenticated user
		const collegeId = req.collegeId || req.college?._id || req.user?.college?._id;

		// console.log('📤 Sending free text message:', { 
		// 	to, 
		// 	message: message.substring(0, 50), 
		// 	candidateId,
		// 	collegeId 
		// });

		// Validation
		if (!to || !message) {
			return res.status(400).json({
				success: false,
				message: 'to and message are required'
			});
		}
		
		if (!collegeId) {
			return res.status(400).json({
				success: false,
				message: 'College ID not found in session'
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

		// console.log('📡 Calling WhatsApp API:', { url, to: formattedPhone });

		const response = await axios.post(url, messageData, {
			headers: {
				'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
				'Content-Type': 'application/json'
			}
		});

		console.log('✅ WhatsApp API response:', response.data);

		// Save message to database
		const messageDoc = {
			collegeId: collegeId,
			to: formattedPhone,
			message: message,
			messageType: 'text',
			status: 'sent',
			direction: 'outgoing',
			whatsappMessageId: response.data.messages[0].id,
			sentAt: new Date(),
			candidateId: candidateId || null,
			candidateName: candidateName || null
		};

		console.log('💾 Saving message to database:', { 
			collegeId, 
			to: formattedPhone, 
			messageType: 'text',
			whatsappMessageId: response.data.messages[0].id 
		});

		const savedMessage = await WhatsAppMessage.create(messageDoc);
		console.log('✅ Message saved to database with ID:', savedMessage._id);

		// Send WebSocket notification
		if (global.io) {
			global.io.emit('whatsapp_message_sent', {
				messageId: response.data.messages[0].id,
				to: formattedPhone,
				message: message,
				candidateId: candidateId,
				timestamp: new Date()
			});
			console.log('📡 WebSocket notification sent');
		}

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
		console.error('❌ Send Message Error:', error.response?.data || error.message);
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
		
		// Fetch BOTH sent and received messages
		// Sent messages: collegeId + to = phone
		// Received messages: from = phone
		const messages = await WhatsAppMessage.find({
			$or: [
				{ collegeId: collegeId, to: formattedPhone }, // Sent by college
				{ from: formattedPhone } // Received from user
			]
		}).sort({ sentAt: 1 });
		
		// console.log(`📥 Fetched ${messages.length} messages for ${formattedPhone}`);
		// console.log(`   - Sent: ${messages.filter(m => m.direction !== 'incoming').length}`);
		// console.log(`   - Received: ${messages.filter(m => m.direction === 'incoming').length}`);
		
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
 * Debug endpoint - Check if candidate exists with mobile number
 * GET /api/college/whatsapp/debug-candidate/:mobile
 */
router.get('/debug-candidate/:mobile', [isCollege], async (req, res) => {
	try {
		const mobileString = req.params.mobile;
		const mobileStr = mobileString.replace(/\D/g, '');
		const mobile = parseInt(mobileStr);
		
		// Try with and without country code
		const mobileWithoutCode = mobileStr.startsWith('91') ? mobileStr.substring(2) : mobileStr;
		const mobileWithoutCodeNumber = parseInt(mobileWithoutCode);
		
		console.log('🔍 Debug: Searching candidate');
		console.log('   - Input:', mobileString);
		console.log('   - Cleaned:', mobileStr);
		console.log('   - With country code:', mobile);
		console.log('   - Without country code:', mobileWithoutCodeNumber);
		
		// Try finding with multiple formats
		const candidate = await Candidate.findOne({
			$or: [
				{ mobile: mobile },                    // 918699081947
				{ mobile: mobileWithoutCodeNumber },   // 8699081947
				{ mobile: mobileStr },                 // "918699081947"
				{ mobile: mobileWithoutCode },         // "8699081947"
				{ mobile: mobileString },              // Original input
				{ mobile: `+${mobileStr}` },          // "+918699081947"
				{ mobile: `+91${mobileWithoutCode}` }  // "+918699081947"
			]
		});
		
		if (candidate) {
			const now = new Date();
			const expiresAt = candidate.whatsappSessionWindowExpiresAt;
			const isOpen = expiresAt && new Date(expiresAt) > now;
			
			res.json({
				success: true,
				found: true,
				searchedFormats: {
					withCode: mobile,
					withoutCode: mobileWithoutCodeNumber,
					stringWithCode: mobileStr,
					stringWithoutCode: mobileWithoutCode
				},
				candidate: {
					_id: candidate._id,
					name: candidate.name,
					mobile: candidate.mobile,
					mobileType: typeof candidate.mobile,
					whatsappLastIncomingMessageAt: candidate.whatsappLastIncomingMessageAt,
					whatsappSessionWindowExpiresAt: candidate.whatsappSessionWindowExpiresAt,
					sessionWindowOpen: isOpen,
					remainingTimeMs: isOpen ? new Date(expiresAt) - now : 0
				}
			});
		} else {
			res.json({
				success: true,
				found: false,
				searchedFormats: {
					withCode: mobile,
					withoutCode: mobileWithoutCodeNumber,
					stringWithCode: mobileStr,
					stringWithoutCode: mobileWithoutCode
				},
				message: 'No candidate found with any mobile format'
			});
		}
	} catch (error) {
		res.status(500).json({ success: false, error: error.message });
	}
});

/**
 * Check WhatsApp 24-hour session window status
 * GET /api/college/whatsapp/session-window/:mobile
 * Checks directly from WhatsAppMessage collection instead of Candidate
 */
router.get('/session-window/:mobile', [isCollege], async (req, res) => {
	try {
		const mobileStr = req.params.mobile.replace(/\D/g, '');
		
		// Prepare mobile number formats for matching
		const mobileWithoutCode = mobileStr.startsWith('91') ? mobileStr.substring(2) : mobileStr;
		const mobileWithPlus91 = `+91${mobileWithoutCode}`;
		const mobileWith91 = `91${mobileWithoutCode}`;
		const mobilePlus = `+${mobileStr}`;
		
		console.log('🔍 Checking session window from WhatsAppMessage collection');
		console.log('   - Mobile formats to search:', {
			withPlus91: mobileWithPlus91,
			with91: mobileWith91,
			withPlus: mobilePlus,
			original: mobileStr,
			withoutCode: mobileWithoutCode
		});
		
		// Find last incoming message from this mobile number (try multiple formats)
		const lastIncomingMessage = await WhatsAppMessage.findOne({
			direction: 'incoming',
			$or: [
				{ from: mobileWithPlus91 },      // "+918699081947"
				{ from: mobileWith91 },          // "918699081947"
				{ from: mobilePlus },             // "+918699081947"
				{ from: mobileStr },              // "918699081947"
				{ from: mobileWithoutCode },     // "8699081947"
				{ from: `+${mobileStr}` }         // "+918699081947"
			]
		})
		.sort({ sentAt: -1 })  // Latest message first
		.lean();
		
		const now = new Date();
		let isSessionWindowOpen = false;
		let lastIncomingMessageAt = null;
		let expiresAt = null;
		let remainingTimeMs = 0;
		
		if (lastIncomingMessage && lastIncomingMessage.sentAt) {
			lastIncomingMessageAt = new Date(lastIncomingMessage.sentAt);
			expiresAt = new Date(lastIncomingMessageAt.getTime() + 24 * 60 * 60 * 1000); // 24 hours from message
			isSessionWindowOpen = expiresAt > now;
			
			if (isSessionWindowOpen) {
				remainingTimeMs = expiresAt - now;
			}
			
			console.log('📊 Session Window Check (from WhatsAppMessage):');
			console.log('   - Last incoming message at:', lastIncomingMessageAt.toISOString());
			console.log('   - Window expires at:', expiresAt.toISOString());
			console.log('   - Current time:', now.toISOString());
			console.log('   - Is window open?', isSessionWindowOpen);
			console.log('   - Remaining time (hours):', (remainingTimeMs / (1000 * 60 * 60)).toFixed(2));
		} else {
			console.log('📊 Session Window Check:');
			console.log('   - ⚠️ No incoming messages found - window closed');
			console.log('   - User must send a message first to open 24-hour window');
		}
		
		const response = {
			success: true,
			sessionWindow: {
				isOpen: isSessionWindowOpen,
				lastIncomingMessageAt: lastIncomingMessageAt,
				expiresAt: expiresAt,
				remainingTimeMs: remainingTimeMs
			},
			messaging: {
				canSendManualMessages: isSessionWindowOpen,
				requiresTemplate: !isSessionWindowOpen
			}
		};
		
		// console.log('✅ Returning response:', {
		// 	isOpen: response.sessionWindow.isOpen,
		// 	canSendManualMessages: response.messaging.canSendManualMessages,
		// 	requiresTemplate: response.messaging.requiresTemplate
		// });
		
		res.json(response);
	} catch (error) {
		console.error('Error checking session window:', error);
		res.status(500).json({
			success: false,
			message: 'Failed to check session window',
			error: error.message
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

				// Send Socket.io notification for WhatsApp status updates
				if (global.io) {
					try {
						global.io.emit('whatsapp_message_status_update', status);
						console.log('🔔 Socket.io event emitted: whatsapp_status_update');
						console.log('   - Message ID:', messageId);
						console.log('   - Status:', statusValue);
						console.log('   - To:', recipientId);
					} catch (ioError) {
						console.error('❌ Socket.io notification failed:', ioError.message);
					}
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
 * Download media from WhatsApp and upload to S3
 */
async function downloadAndUploadMedia(mediaId, mediaType) {
	try {
		const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_API_TOKEN;
		const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v21.0';
		
		// Step 1: Get media URL from WhatsApp
		console.log(`📥 Fetching media URL for ID: ${mediaId}`);
		const mediaResponse = await axios.get(`${WHATSAPP_API_URL}/${mediaId}`, {
			headers: {
				'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`
			}
		});

		const mediaUrl = mediaResponse.data.url;
		const mimeType = mediaResponse.data.mime_type;
		
		console.log(`📥 Media URL received: ${mediaUrl}`);
		console.log(`📥 MIME type: ${mimeType}`);

		// Step 2: Download media from WhatsApp
		const downloadResponse = await axios.get(mediaUrl, {
			headers: {
				'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`
			},
			responseType: 'arraybuffer'
		});

		const mediaBuffer = Buffer.from(downloadResponse.data);
		
		// Step 3: Determine file extension
		const extensionMap = {
			'image/jpeg': 'jpg',
			'image/jpg': 'jpg',
			'image/png': 'png',
			'image/gif': 'gif',
			'image/webp': 'webp',
			'video/mp4': 'mp4',
			'video/3gpp': '3gp',
			'audio/aac': 'aac',
			'audio/mp4': 'm4a',
			'audio/mpeg': 'mp3',
			'audio/amr': 'amr',
			'audio/ogg': 'ogg',
			'application/pdf': 'pdf',
			'application/vnd.ms-powerpoint': 'ppt',
			'application/msword': 'doc',
			'application/vnd.ms-excel': 'xls',
			'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
			'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
			'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx'
		};

		const fileExtension = extensionMap[mimeType] || 'bin';
		const fileName = `whatsapp_incoming_${Date.now()}_${uuid()}.${fileExtension}`;
		
		// Step 4: Upload to S3
		console.log(`📤 Uploading to S3: ${fileName}`);
		const s3Params = {
			Bucket: bucketName,
			Key: `whatsapp/incoming/${fileName}`,
			Body: mediaBuffer,
			ContentType: mimeType,
			ACL: 'public-read'
		};

		await s3.upload(s3Params).promise();
		const s3Url = `https://${bucketName}.s3.${region}.amazonaws.com/whatsapp/incoming/${fileName}`;
		
		console.log(`✅ Media uploaded to S3: ${s3Url}`);
		
		return {
			s3Url,
			fileName,
			mimeType,
			mediaType
		};
		
	} catch (error) {
		console.error('❌ Error downloading/uploading media:', error.response?.data || error.message);
		throw error;
	}
}

/**
 * Handle incoming messages from users
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

			// Normalize phone number by adding + prefix if not present
			let from = message.from;
			if (!from.startsWith('+')) {
				from = '+' + from;
				console.log(`📞 Normalized phone number: ${message.from} → ${from}`);
			}
			
			const messageId = message.id;
			const timestamp = message.timestamp;
			const messageType = message.type;

			let messageText = '';
			let mediaUrl = null;
			let mediaData = null;

			// Extract message content based on type
			switch (messageType) {
				case 'text':
					messageText = message.text?.body || '';
					break;
					
				case 'image':
					messageText = message.image?.caption || '[Image]';
					// Download and upload image to S3
					if (message.image?.id) {
						try {
							mediaData = await downloadAndUploadMedia(message.image.id, 'image');
							mediaUrl = mediaData.s3Url;
						} catch (error) {
							console.error('Failed to process image:', error.message);
						}
					}
					break;
					
				case 'video':
					messageText = message.video?.caption || '[Video]';
					if (message.video?.id) {
						try {
							mediaData = await downloadAndUploadMedia(message.video.id, 'video');
							mediaUrl = mediaData.s3Url;
						} catch (error) {
							console.error('Failed to process video:', error.message);
						}
					}
					break;
					
				case 'audio':
					messageText = '[Audio]';
					if (message.audio?.id) {
						try {
							mediaData = await downloadAndUploadMedia(message.audio.id, 'audio');
							mediaUrl = mediaData.s3Url;
						} catch (error) {
							console.error('Failed to process audio:', error.message);
						}
					}
					break;
					
				case 'document':
					messageText = message.document?.filename || '[Document]';
					if (message.document?.id) {
						try {
							mediaData = await downloadAndUploadMedia(message.document.id, 'document');
							mediaUrl = mediaData.s3Url;
						} catch (error) {
							console.error('Failed to process document:', error.message);
						}
					}
					break;
					
				case 'sticker':
					messageText = '[Sticker]';
					if (message.sticker?.id) {
						try {
							mediaData = await downloadAndUploadMedia(message.sticker.id, 'sticker');
							mediaUrl = mediaData.s3Url;
						} catch (error) {
							console.error('Failed to process sticker:', error.message);
						}
					}
					break;
					
				case 'location':
					const lat = message.location?.latitude;
					const lng = message.location?.longitude;
					messageText = `[Location: ${lat}, ${lng}]`;
					break;
					
				case 'contacts':
					messageText = '[Contact Card]';
					break;
					
				default:
					messageText = `[Unsupported message type: ${messageType}]`;
			}

			// Save incoming message to database
			try {
				// Look up collegeId from the last message with this phone number
				let collegeId = null;
				try {
					const lastMessage = await WhatsAppMessage.findOne({
						$or: [
							{ from: from },
							{ to: from }
						]
					}).sort({ sentAt: -1 }).limit(1);
					
					if (lastMessage && lastMessage.collegeId) {
						collegeId = lastMessage.collegeId;
						console.log('✅ Found collegeId from previous conversation:', collegeId);
					} else {
						console.warn('⚠️ No previous message found for phone number:', from);
						// Skip saving this message if we can't find the college
						console.log('⚠️ Skipping message save - collegeId is required');
						return;
					}
				} catch (lookupError) {
					console.error('❌ Failed to lookup collegeId:', lookupError.message);
					return;
				}

				const incomingMessageDoc = {
					from: from,
					to: metadata?.phone_number_id || 'unknown',
					message: messageText,
					messageType: messageType,
					whatsappMessageId: messageId,
					status: 'received',
					sentAt: new Date(parseInt(timestamp) * 1000),
					receivedAt: new Date(),
					direction: 'incoming', // Important: Mark as incoming
					mediaUrl: mediaUrl,
					mediaData: mediaData,
					collegeId: collegeId
				};

				const savedMessage = await WhatsAppMessage.create(incomingMessageDoc);
				console.log('✅ Incoming message saved to database:', savedMessage._id);

				// Update Candidate's WhatsApp 24-hour session window
				try {
					const phoneWithoutPlus = from.replace('+', '');
					const phoneNumberWithCode = parseInt(phoneWithoutPlus); // e.g., 918699081947
					const phoneWithoutCountryCode = phoneWithoutPlus.startsWith('91') 
						? phoneWithoutPlus.substring(2) 
						: phoneWithoutPlus; // e.g., 8699081947
					const phoneNumberWithoutCode = parseInt(phoneWithoutCountryCode);
					
					const now = new Date();
					const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now
					
					console.log('🔍 Looking for candidate with mobile formats:');
					console.log('   - With country code (91):', phoneNumberWithCode);
					console.log('   - Without country code:', phoneNumberWithoutCode);
					console.log('   - String formats:', phoneWithoutPlus, phoneWithoutCountryCode);
					
					// Try multiple mobile number formats to match candidate
					const updateResult = await Candidate.updateOne(
						{
							$or: [
								{ mobile: phoneNumberWithCode },        // 918699081947
								{ mobile: phoneNumberWithoutCode },     // 8699081947
								{ mobile: phoneWithoutPlus },           // "918699081947"
								{ mobile: phoneWithoutCountryCode },    // "8699081947"
								{ mobile: `+${phoneWithoutPlus}` },     // "+918699081947"
								{ mobile: from }                         // Original "+918699081947"
							]
						},
						{
							$set: {
								whatsappLastIncomingMessageAt: now,
								whatsappSessionWindowExpiresAt: expiresAt
							}
						}
					);
					
					if (updateResult.matchedCount > 0) {
						console.log('✅ Updated 24-hour session window for candidate');
						console.log('   - Window opens at:', now.toISOString());
						console.log('   - Window expires at:', expiresAt.toISOString());
						console.log('   - Documents matched:', updateResult.matchedCount);
						console.log('   - Documents modified:', updateResult.modifiedCount);
					} else {
						console.warn('⚠️ Candidate not found with any mobile format');
						console.warn('   - Tried formats:', {
							withCode: phoneNumberWithCode,
							withoutCode: phoneNumberWithoutCode,
							stringWithCode: phoneWithoutPlus,
							stringWithoutCode: phoneWithoutCountryCode,
							original: from
						});
						
						// Debug: Try to find any candidate to understand the format
						console.warn('   - Searching for any candidate with similar number...');
						const candidate = await Candidate.findOne({
							$or: [
								{ mobile: phoneNumberWithCode },
								{ mobile: phoneNumberWithoutCode },
								{ mobile: { $regex: phoneWithoutCountryCode, $options: 'i' } }
							]
						});
						if (candidate) {
							console.log('   - Found candidate:', {
								id: candidate._id,
								name: candidate.name,
								mobile: candidate.mobile,
								mobileType: typeof candidate.mobile
							});
						} else {
							console.log('   - No candidate exists with this mobile number in any format');
						}
					}
				} catch (candidateUpdateError) {
					console.error('⚠️ Failed to update candidate session window:', candidateUpdateError.message);
				}

				// Send WebSocket notification to frontend
				if (global.io) {
					try {
						const now = new Date();
						const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
						
						global.io.emit('whatsapp_incoming_message', {
							messageId: savedMessage._id,
							whatsappMessageId: messageId,
							collegeId: collegeId,
							from: from,
							message: messageText,
							messageType: messageType,
							mediaUrl: mediaUrl,
							timestamp: timestamp,
							sentAt: new Date(parseInt(timestamp) * 1000).toISOString(),
							direction: 'incoming',
							sessionWindow: {
								isOpen: true,
								openedAt: now.toISOString(),
								expiresAt: expiresAt.toISOString()
							}
						});
						console.log('🔔 Socket.io event emitted: whatsapp_incoming_message');
						console.log('   - College ID:', collegeId);
						console.log('   - From:', from);
						console.log('   - Type:', messageType);
						console.log('   - Message:', messageText.substring(0, 50));
					} catch (ioError) {
						console.error('❌ Socket.io notification failed:', ioError.message);
					}
				}
			} catch (dbError) {
				console.error('❌ Failed to save incoming message:', dbError.message);
			}
		}
	} catch (error) {
		console.error('Error handling incoming messages:', error);
		throw error;
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

				// Send Socket.io notification to frontend
				if (global.io) {
					try {
						global.io.emit('whatsapp_template_status_update', {
							collegeId: updatedTemplate.collegeId,
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
						});
						console.log('🔔 Socket.io event emitted: whatsapp_template_status_update');
						console.log('   - College ID:', updatedTemplate.collegeId);
						console.log('   - Template:', templateName);
						console.log('   - Status:', status);
					} catch (ioError) {
						console.error('❌ Socket.io notification failed:', ioError.message);
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

// Send emoji message (emojis are just text in WhatsApp)
router.post('/send-emoji', isCollege, async (req, res) => {
	try {
		const { to, emoji, candidateId, candidateName } = req.body;
		
		// Get college ID from authenticated user
		const collegeId = req.collegeId || req.college?._id || req.user?.college?._id;

		console.log('😊 Sending emoji message:', { 
			to, 
			emoji, 
			candidateId,
			collegeId 
		});

		// Validation
		if (!to || !emoji) {
			return res.status(400).json({
				success: false,
				message: 'to and emoji are required'
			});
		}
		
		if (!collegeId) {
			return res.status(400).json({
				success: false,
				message: 'College ID not found in session'
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

		// Send emoji via WhatsApp API (emojis are sent as text)
		const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_API_TOKEN;
		const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v21.0';
		const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
		const url = `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
		
		const messageData = {
			messaging_product: 'whatsapp',
			to: formattedPhone,
			type: 'text',
			text: {
				body: emoji
			}
		};

		console.log('📡 Calling WhatsApp API for emoji:', { url, to: formattedPhone });

		const response = await axios.post(url, messageData, {
			headers: {
				'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
				'Content-Type': 'application/json'
			}
		});

		console.log('✅ WhatsApp emoji API response:', response.data);

		// Save message to database
		const messageDoc = {
			collegeId: collegeId,
			candidateId: candidateId,
			candidateName: candidateName,
			phone: formattedPhone,
			messageId: response.data.messages?.[0]?.id,
			message: emoji,
			messageType: 'emoji',
			direction: 'outgoing',
			status: 'sent',
			timestamp: new Date(),
			metadata: {
				wamid: response.data.messages?.[0]?.id
			}
		};

		// Save to database
		if (WhatsAppMessage && typeof WhatsAppMessage.create === 'function') {
			await WhatsAppMessage.create(messageDoc);
			console.log('💾 Emoji message saved to database');
		}

		// Update candidate's last message time
		if (candidateId && Candidate) {
			await Candidate.findByIdAndUpdate(candidateId, {
				lastWhatsAppMessageAt: new Date()
			});
		}

		return res.status(200).json({
			success: true,
			message: 'Emoji sent successfully',
			data: {
				messageId: response.data.messages?.[0]?.id,
				phone: formattedPhone
			}
		});

	} catch (error) {
		console.error('❌ Send Emoji Error:', error.response?.data || error.message);
		return res.status(500).json({
			success: false,
			message: error.response?.data?.error?.message || 'Failed to send emoji',
			error: error.message
		});
	}
});

// Send audio message with S3 upload
router.post('/send-audio', isCollege, upload.single('audio'), async (req, res) => {
	try {
		console.log('📥 Received audio upload request');
		console.log('  - Body:', req.body);
		console.log('  - File:', req.file ? { name: req.file.originalname, size: req.file.size } : 'No file');
		console.log('  - Headers:', req.headers['content-type']);
		
		const { to, candidateId, candidateName } = req.body;
		const audioFile = req.file;
		
		// Get college ID from authenticated user
		const collegeId = req.collegeId || req.college?._id || req.user?.college?._id;

		console.log('🎵 Sending audio message:', { 
			to, 
			candidateId,
			collegeId,
			fileName: audioFile?.originalname
		});

		// Validation
		if (!to || !audioFile) {
			console.error('❌ Validation failed:', { to: !!to, audioFile: !!audioFile });
			return res.status(400).json({
				success: false,
				message: 'to and audio file are required',
				debug: { hasTo: !!to, hasFile: !!audioFile, body: req.body }
			});
		}
		
		if (!collegeId) {
			return res.status(400).json({
				success: false,
				message: 'College ID not found in session'
			});
		}

		// Validate audio file type
		const audioExtensions = ['mp3', 'aac', 'm4a', 'amr', 'ogg', 'opus'];
		const ext = audioFile.originalname.split('.').pop().toLowerCase();
		if (!audioExtensions.includes(ext)) {
			return res.status(400).json({
				success: false,
				message: `Audio format not supported. Allowed formats: ${audioExtensions.join(', ')}`
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

		// Step 1: Upload audio to S3
		console.log('📤 Uploading audio to S3...');
		const fileName = `whatsapp_audio_${Date.now()}_${uuid()}.${ext}`;
		const key = `whatsapp/outgoing/audio/${collegeId}/${fileName}`;
		
		const contentTypeMap = {
			'mp3': 'audio/mpeg',
			'aac': 'audio/aac',
			'm4a': 'audio/mp4',
			'amr': 'audio/amr',
			'ogg': 'audio/ogg',
			'opus': 'audio/opus'
		};
		
		const s3Params = {
			Bucket: bucketName,
			Key: key,
			Body: audioFile.buffer,
			ContentType: contentTypeMap[ext] || 'audio/mpeg',
			// ACL: 'public-read'
		};

		const uploadResult = await s3.upload(s3Params).promise();
		const s3Url = uploadResult.Location;
		
		console.log(`✅ Audio uploaded to S3: ${s3Url}`);

		// Step 2: Send audio via WhatsApp API
		// const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_API_TOKEN;
		// const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v21.0';
		// const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
		// const url = `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
		const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
		const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v21.0';
		const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_ID;
		
		
		const url = `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
	
		const messageData = {
			messaging_product: 'whatsapp',
			to: formattedPhone,
			type: 'audio',
			audio: {
				link: s3Url
			}
		};

		console.log('📡 Calling WhatsApp API for audio:', { url, to: formattedPhone });

		const response = await axios.post(url, messageData, {
			headers: {
				'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
				'Content-Type': 'application/json'
			}
		});

		console.log('✅ WhatsApp audio API response:', response.data);

		// Step 3: Save message to database
		const messageDoc = {
			collegeId: collegeId,
			candidateId: candidateId,
			candidateName: candidateName,
			to: formattedPhone,
			messageId: response.data.messages?.[0]?.id,
			message: '[Audio]',
			messageType: 'audio',
			direction: 'outgoing',
			status: 'sent',
			timestamp: new Date(),
			mediaUrl: s3Url,
			metadata: {
				wamid: response.data.messages?.[0]?.id,
				fileName: audioFile.originalname,
				fileSize: audioFile.size,
				s3Key: key
			}
		};

		// Save to database
		if (WhatsAppMessage && typeof WhatsAppMessage.create === 'function') {
			await WhatsAppMessage.create(messageDoc);
			console.log('💾 Audio message saved to database');
		}

		// Update candidate's last message time
		if (candidateId && Candidate) {
			await Candidate.findByIdAndUpdate(candidateId, {
				lastWhatsAppMessageAt: new Date()
			});
		}

		return res.status(200).json({
			success: true,
			message: 'Audio sent successfully',
			data: {
				messageId: response.data.messages?.[0]?.id,
				phone: formattedPhone,
				s3Url: s3Url
			}
		});

	} catch (error) {
		console.error('❌ Send Audio Error:', error.response?.data || error.message);
		return res.status(500).json({
			success: false,
			message: error.response?.data?.error?.message || 'Failed to send audio',
			error: error.message
		});
	}
});

// Send file message (document, image, video) with S3 upload
router.post('/send-file', isCollege, upload.single('file'), async (req, res) => {
	try {
		console.log('📥 Received file upload request');
		console.log('  - Body:', req.body);
		console.log('  - File:', req.file ? { name: req.file.originalname, size: req.file.size } : 'No file');
		console.log('  - Headers:', req.headers['content-type']);
		
		const { to, candidateId, candidateName, caption } = req.body;
		const file = req.file;
		
		// Get college ID from authenticated user
		const collegeId = req.collegeId || req.college?._id || req.user?.college?._id;

		console.log('📎 Sending file message:', { 
			to, 
			candidateId,
			collegeId,
			fileName: file?.originalname,
			caption: caption?.substring(0, 50)
		});

		// Validation
		if (!to || !file) {
			console.error('❌ Validation failed:', { to: !!to, file: !!file });
			return res.status(400).json({
				success: false,
				message: 'to and file are required',
				debug: { hasTo: !!to, hasFile: !!file, body: req.body }
			});
		}
		
		if (!collegeId) {
			return res.status(400).json({
				success: false,
				message: 'College ID not found in session'
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

		// Determine file type and WhatsApp message type
		const ext = file.originalname.split('.').pop().toLowerCase();
		let messageType = 'document';
		let contentType = file.mimetype;
		
		if (allowedImageExtensions.includes(ext)) {
			messageType = 'image';
		} else if (allowedVideoExtensions.includes(ext)) {
			messageType = 'video';
		} else if (ext === 'pdf') {
			messageType = 'document';
			contentType = 'application/pdf';
		}

		// Step 1: Upload file to S3
		console.log(`📤 Uploading ${messageType} to S3...`);
		const fileName = `whatsapp_${messageType}_${Date.now()}_${uuid()}.${ext}`;
		const key = `whatsapp/outgoing/${messageType}/${collegeId}/${fileName}`;
		
		const s3Params = {
			Bucket: bucketName,
			Key: key,
			Body: file.buffer,
			ContentType: contentType,
			// ACL: 'public-read'
		};

		const uploadResult = await s3.upload(s3Params).promise();
		const s3Url = uploadResult.Location;
		
		console.log(`✅ File uploaded to S3: ${s3Url}`);

		// Step 2: Send file via WhatsApp API
		// const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_API_TOKEN;
		// const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v21.0';
		// const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
		// const url = `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
		

		const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
		const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v21.0';
		const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_ID;
		
		
		const url = `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
		
		const messageData = {
			messaging_product: 'whatsapp',
			to: formattedPhone,
			type: messageType
		};

		// Add media object based on type
		messageData[messageType] = {
			link: s3Url
		};

		// Add caption if provided
		if (caption) {
			messageData[messageType].caption = caption;
		}

		// Add filename for documents
		if (messageType === 'document') {
			messageData[messageType].filename = file.originalname;
		}

		console.log(`📡 Calling WhatsApp API for ${messageType}:`, { url, to: formattedPhone });

		const response = await axios.post(url, messageData, {
			headers: {
				'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
				'Content-Type': 'application/json'
			}
		});

		console.log(`✅ WhatsApp ${messageType} API response:`, response.data);

		// Step 3: Save message to database
		const messageDoc = {
			collegeId: collegeId,
			candidateId: candidateId,
			candidateName: candidateName,
			to: formattedPhone,
			phone: formattedPhone,
			messageId: response.data.messages?.[0]?.id,
			message: caption || `[${messageType.toUpperCase()}]`,
			messageType: messageType,
			direction: 'outgoing',
			status: 'sent',
			timestamp: new Date(),
			mediaUrl: s3Url,
			metadata: {
				wamid: response.data.messages?.[0]?.id,
				fileName: file.originalname,
				fileSize: file.size,
				s3Key: key,
				caption: caption
			}
		};

		// Save to database
		if (WhatsAppMessage && typeof WhatsAppMessage.create === 'function') {
			await WhatsAppMessage.create(messageDoc);
			console.log(`💾 ${messageType} message saved to database`);
		}

		// Update candidate's last message time
		if (candidateId && Candidate) {
			await Candidate.findByIdAndUpdate(candidateId, {
				lastWhatsAppMessageAt: new Date()
			});
		}

		return res.status(200).json({
			success: true,
			message: `${messageType} sent successfully`,
			data: {
				messageId: response.data.messages?.[0]?.id,
				phone: formattedPhone,
				s3Url: s3Url,
				messageType: messageType
			}
		});

	} catch (error) {
		console.error('❌ Send File Error:', error.response?.data || error.message);
		return res.status(500).json({
			success: false,
			message: error.response?.data?.error?.message || 'Failed to send file',
			error: error.message
		});
	}
});

module.exports = router;