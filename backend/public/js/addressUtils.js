/**
 * Standardized address parsing utility for Google Places API (Backend)
 */

/**
 * Parse address components from Google Places API response
 * @param {Object} place - Google Places API place object
 * @returns {Object} Parsed address data
 */
function parseAddressComponents(place) {
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
    
    // City/Locality
    if (types.includes('locality')) {
      city = component.long_name;
    }
    
    // State/Administrative area
    if (types.includes('administrative_area_level_1')) {
      state = component.long_name;
    }
    
    // Country
    if (types.includes('country')) {
      country = component.long_name;
    }
    
    // Sub-locality (for areas within cities)
    if (types.includes('sublocality')) {
      sublocality = component.long_name;
    }
  });

  // If no city found, try sublocality
  if (!city && sublocality) {
    city = sublocality;
  }

  return {
    fullAddress: place.formatted_address || place.name || '',
    city,
    state,
    pincode,
    country,
    locality: city,
    sublocality
  };
}

/**
 * Get coordinates in correct format for MongoDB
 * @param {Object} place - Google Places API place object
 * @returns {Array} [longitude, latitude] for MongoDB
 */
function getCoordinates(place) {
  if (!place || !place.geometry || !place.geometry.location) {
    return [0, 0];
  }
  
  const lat = place.geometry.location.lat();
  const lng = place.geometry.location.lng();
  
  // MongoDB expects [longitude, latitude] format
  return [lng, lat];
}

/**
 * Validate if place object is valid
 * @param {Object} place - Google Places API place object
 * @returns {boolean} True if valid
 */
function isValidPlace(place) {
  return place && 
         place.geometry && 
         place.geometry.location && 
         place.address_components &&
         Array.isArray(place.address_components);
}

/**
 * Initialize Google Maps Autocomplete with standardized parsing
 * @param {HTMLElement} inputElement - Input element for autocomplete
 * @param {Function} callback - Callback function with parsed data
 * @param {Object} options - Additional options
 */
function initAutocomplete(inputElement, callback, options = {}) {
  if (!window.google || !window.google.maps || !window.google.maps.places) {
    console.error('Google Maps API not loaded');
    return null;
  }

  const defaultOptions = {
    types: ['geocode'],
    componentRestrictions: { country: 'in' }
  };

  const autocomplete = new google.maps.places.Autocomplete(
    inputElement, 
    { ...defaultOptions, ...options }
  );

  autocomplete.addListener('place_changed', () => {
    const place = autocomplete.getPlace();
    
    if (!isValidPlace(place)) {
      console.warn('Invalid place selected');
      return;
    }

    const coordinates = getCoordinates(place);
    const addressData = parseAddressComponents(place);

    // Debug logging
    console.log('Autocomplete result:', {
      place: place.name,
      coordinates,
      addressData
    });

    // Call callback with standardized data
    if (callback) {
      callback({
        place,
        coordinates,
        addressData,
        location: {
          type: 'Point',
          coordinates: coordinates,
          city: addressData.city,
          state: addressData.state,
          fullAddress: addressData.fullAddress,
          pincode: addressData.pincode
        }
      });
    }
  });

  return autocomplete;
}

// Make functions globally available
window.parseAddressComponents = parseAddressComponents;
window.getCoordinates = getCoordinates;
window.isValidPlace = isValidPlace;
window.initAutocomplete = initAutocomplete; 