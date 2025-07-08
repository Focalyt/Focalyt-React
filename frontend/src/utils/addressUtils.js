/**
 * Standardized address parsing utility for Google Places API
 */

/**
 * Parse address components from Google Places API response
 * @param {Object} place - Google Places API place object
 * @returns {Object} Parsed address data
 */
export const parseAddressComponents = (place) => {
  if (!place || !place.address_components) {
    return {
      fullAddress: '',
      city: '',
      state: '',
      pincode: '',
      country: '',
      locality: '',
      sublocality: ''
    };
  }

  let city = '', state = '', pincode = '', country = '', locality = '', sublocality = '';

  place.address_components.forEach((component) => {
    const types = component.types;
    
    // Postal code
    if (types.includes('postal_code')) {
      pincode = component.long_name;
    }
    
    // City/Locality (primary)
    if (types.includes('locality')) {
      city = component.long_name;
      locality = component.long_name;
    }
    
    // Sub-locality (if no city found)
    if (!city && types.includes('sublocality')) {
      city = component.long_name;
      sublocality = component.long_name;
    }
    
    // State
    if (types.includes('administrative_area_level_1')) {
      state = component.long_name;
    }
    
    // Country
    if (types.includes('country')) {
      country = component.long_name;
    }
  });

  // Fallback for city if not found
  if (!city && sublocality) {
    city = sublocality;
  }

  return {
    fullAddress: place.formatted_address || place.name || '',
    city,
    state,
    pincode,
    country,
    locality,
    sublocality
  };
};

/**
 * Get coordinates in correct format for MongoDB
 * @param {Object} place - Google Places API place object
 * @returns {Array} [longitude, latitude] for MongoDB
 */
export const getCoordinates = (place) => {
  if (!place || !place.geometry || !place.geometry.location) {
    return [0, 0];
  }
  
  const lat = place.geometry.location.lat();
  const lng = place.geometry.location.lng();
  
  // MongoDB expects [longitude, latitude]
  return [lng, lat];
};

/**
 * Create location object for database storage
 * @param {Object} place - Google Places API place object
 * @returns {Object} Location object for database
 */
export const createLocationObject = (place) => {
  const coordinates = getCoordinates(place);
  const addressData = parseAddressComponents(place);
  
  return {
    type: 'Point',
    coordinates,
    city: addressData.city,
    state: addressData.state,
    fullAddress: addressData.fullAddress,
    latitude: coordinates[1], // latitude
    longitude: coordinates[0] // longitude
  };
};

/**
 * Validate if place has valid geometry
 * @param {Object} place - Google Places API place object
 * @returns {boolean}
 */
export const isValidPlace = (place) => {
  return place && 
         place.geometry && 
         place.geometry.location && 
         typeof place.geometry.location.lat === 'function' &&
         typeof place.geometry.location.lng === 'function';
}; 