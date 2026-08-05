const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const s3 = require('./objectStorage');
const { normalizeStorageKey } = require('./s3Storage');

const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v23.0';

function getWhatsAppPhoneNumberId() {
	return process.env.WHATSAPP_PHONE_ID || process.env.WHATSAPP_PHONE_NUMBER_ID;
}

function getWhatsAppAccessToken() {
	return process.env.WHATSAPP_ACCESS_TOKEN || process.env.WHATSAPP_API_TOKEN;
}

function mimeTypeFromName(fileNameOrKey) {
	const ext = String(fileNameOrKey || '').split('.').pop().toLowerCase();
	const map = {
		png: 'image/png',
		jpg: 'image/jpeg',
		jpeg: 'image/jpeg',
		webp: 'image/webp',
		gif: 'image/gif',
		mp4: 'video/mp4',
		'3gpp': 'video/3gpp',
		pdf: 'application/pdf',
	};
	return map[ext] || 'application/octet-stream';
}

/**
 * Upload a local/Hostinger storage object to WhatsApp Media API.
 * Use media id in template sends — Meta often cannot fetch Hostinger public URLs.
 */
async function uploadStorageKeyToWhatsApp(storageKey, fileName) {
	const key = normalizeStorageKey(storageKey);
	if (!key) {
		throw new Error('Missing storage key for WhatsApp media upload');
	}

	const phoneNumberId = getWhatsAppPhoneNumberId();
	const accessToken = getWhatsAppAccessToken();
	if (!phoneNumberId || !accessToken) {
		throw new Error('WhatsApp phone number id or access token not configured');
	}

	const filePath = path.join(s3.getUploadDir(), key);
	if (!fs.existsSync(filePath)) {
		throw new Error(`Media file not found on disk: ${key}`);
	}

	const stat = fs.statSync(filePath);
	if (!stat.size) {
		throw new Error(`Empty media file for key: ${key}`);
	}
	// Cloned Meta handles saved as "images" are ~78 bytes and Meta rejects them
	if (stat.size < 200) {
		throw new Error(
			`Media file too small (${stat.size} bytes) for key: ${key}. Re-upload a real image/video for this template.`
		);
	}

	const uploadName = fileName || path.basename(key) || 'media.bin';
	const mimeType = mimeTypeFromName(uploadName);
	const fileStream = fs.createReadStream(filePath);

	const formData = new FormData();
	formData.append('messaging_product', 'whatsapp');
	formData.append('type', mimeType);
	formData.append('file', fileStream, {
		filename: uploadName,
		contentType: mimeType,
		knownLength: stat.size,
	});

	console.log(
		`📤 Uploading media to WhatsApp: ${uploadName} (${mimeType}, ${stat.size} bytes) → ${phoneNumberId}/media`
	);

	try {
		const response = await axios.post(
			`${WHATSAPP_API_URL}/${phoneNumberId}/media`,
			formData,
			{
				headers: {
					Authorization: `Bearer ${accessToken}`,
					...formData.getHeaders(),
				},
				maxBodyLength: Infinity,
				maxContentLength: Infinity,
				transformRequest: [(data) => data],
			}
		);

		if (!response.data?.id) {
			throw new Error('WhatsApp media upload returned no id');
		}

		console.log(`✓ Uploaded ${uploadName} to WhatsApp media id=${response.data.id}`);
		return response.data.id;
	} catch (error) {
		console.error(
			'❌ WhatsApp /media upload failed:',
			JSON.stringify(error.response?.data || error.message, null, 2)
		);
		throw new Error(
			error.response?.data?.error?.message ||
				error.message ||
				'Failed to upload media to WhatsApp'
		);
	}
}

module.exports = {
	uploadStorageKeyToWhatsApp,
	mimeTypeFromName,
	getWhatsAppPhoneNumberId,
	getWhatsAppAccessToken,
	WHATSAPP_API_URL,
};
