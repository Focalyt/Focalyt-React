import React, { useState, useEffect, useRef } from 'react';

const GoogleMapsLocationPicker = ({ 
  onLocationSelect, 
  selectedLocation, 
  placeholder = "Enter business address...",
  className = "",
  disabled = false 
}) => {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [address, setAddress] = useState(selectedLocation?.address || '');
  const [isLoading, setIsLoading] = useState(false);
  const mapRef = useRef(null);
  const autocompleteRef = useRef(null);

  // Load Google Maps API
  useEffect(() => {
    const loadGoogleMapsAPI = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        console.log('Google Maps already loaded');
        setMapLoaded(true);
        window.googleMapsLoaded = true;
        initializeAutocomplete();
        return;
      }

      // Check if script is already loading
      if (document.querySelector('script[src*="maps.googleapis.com/maps/api"]')) {
        console.log('Google Maps script already loading');
        return;
      }

      const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        console.warn('Google Maps API key not found. Using fallback mode.');
        setMapLoaded(true);
        return;
      }

      console.log('Loading Google Maps API...');
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        console.log('Google Maps API loaded successfully');
        setMapLoaded(true);
        window.googleMapsLoaded = true;
        initializeAutocomplete();
      };
      script.onerror = () => {
        console.error('Failed to load Google Maps API');
        setMapLoaded(true); // Continue without API
      };
      document.head.appendChild(script);
    };

    loadGoogleMapsAPI();
  }, []);

  // Initialize autocomplete
  const initializeAutocomplete = () => {
    if (!window.google || !window.google.maps || !window.google.maps.places) {
      console.log('Google Maps not loaded yet, retrying...');
      setTimeout(initializeAutocomplete, 500);
      return;
    }

    // Wait for DOM to be ready
    setTimeout(() => {
      const input = document.getElementById('location-input');
      if (input) {
        console.log('Initializing autocomplete for input:', input);
        
        // Remove existing autocomplete if any
        if (autocompleteRef.current) {
          try {
            window.google.maps.event.clearInstanceListeners(input);
          } catch (error) {
            console.log('Error clearing listeners:', error);
          }
        }

        try {
          const autocomplete = new window.google.maps.places.Autocomplete(input, {
            types: ['address', 'establishment', 'geocode'],
            componentRestrictions: { country: 'IN' },
            fields: ['formatted_address', 'geometry', 'place_id', 'name', 'address_components']
          });

          // Add styling to ensure visibility
          input.style.backgroundColor = "#ffffff";
          input.style.color = "#000000";

          autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            console.log('Place selected:', place);
            
            if (place.geometry) {
              const location = {
                address: place.formatted_address,
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
                placeId: place.place_id,
                name: place.name
              };
              setAddress(place.formatted_address);
              onLocationSelect(location);
              console.log('Location set:', location);
            } else {
              console.log('No geometry found for selected place');
            }
          });

          autocompleteRef.current = autocomplete;
          console.log('Autocomplete initialized successfully');
        } catch (error) {
          console.error('Error initializing autocomplete:', error);
        }
      } else {
        console.log('Input not found, retrying...');
        setTimeout(initializeAutocomplete, 500);
      }
    }, 100);
  };

  // Get current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        if (window.google && window.google.maps) {
          const geocoder = new window.google.maps.Geocoder();
          const latlng = { lat: latitude, lng: longitude };
          
          geocoder.geocode({ location: latlng }, (results, status) => {
            setIsLoading(false);
            if (status === 'OK' && results[0]) {
              const location = {
                address: results[0].formatted_address,
                lat: latitude,
                lng: longitude,
                placeId: results[0].place_id
              };
              setAddress(results[0].formatted_address);
              onLocationSelect(location);
            } else {
              alert('Unable to get address for current location. Please enter address manually.');
            }
          });
        } else {
          setIsLoading(false);
          alert('Google Maps not loaded. Please enter address manually.');
        }
      },
      (error) => {
        setIsLoading(false);
        console.error('Error getting current location:', error);
        alert('Unable to get current location. Please enter address manually.');
      }
    );
  };

  // Initialize map
  const initializeMap = () => {
    if (!mapRef.current || !window.google) return;

    const defaultCenter = { lat: 20.5937, lng: 78.9629 }; // India center
    const center = selectedLocation ? { lat: selectedLocation.lat, lng: selectedLocation.lng } : defaultCenter;

    const map = new window.google.maps.Map(mapRef.current, {
      center: center,
      zoom: 12,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
      zoomControl: true,
      scaleControl: true
    });

    let marker = null;
    let infoWindow = null;

    // Add click listener to map
    map.addListener('click', (event) => {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();
      
      // Remove existing marker and info window
      if (marker) {
        marker.setMap(null);
      }
      if (infoWindow) {
        infoWindow.close();
      }

      // Add new marker
      marker = new window.google.maps.Marker({
        position: { lat, lng },
        map: map,
        draggable: true,
        title: 'Selected Location'
      });

      // Geocode the clicked location
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const location = {
            address: results[0].formatted_address,
            lat: lat,
            lng: lng,
            placeId: results[0].place_id
          };
          setAddress(results[0].formatted_address);
          onLocationSelect(location);

          // Show info window
          infoWindow = new window.google.maps.InfoWindow({
            content: `<div><strong>Selected Location:</strong><br>${results[0].formatted_address}</div>`
          });
          infoWindow.open(map, marker);
        }
      });

      // Add drag end listener
      marker.addListener('dragend', (event) => {
        const newLat = event.latLng.lat();
        const newLng = event.latLng.lng();
        
        geocoder.geocode({ location: { lat: newLat, lng: newLng } }, (results, status) => {
          if (status === 'OK' && results[0]) {
            const location = {
              address: results[0].formatted_address,
              lat: newLat,
              lng: newLng,
              placeId: results[0].place_id
            };
            setAddress(results[0].formatted_address);
            onLocationSelect(location);
          }
        });
      });
    });

    // Add marker for selected location if exists
    if (selectedLocation) {
      marker = new window.google.maps.Marker({
        position: { lat: selectedLocation.lat, lng: selectedLocation.lng },
        map: map,
        draggable: true,
        title: 'Current Location'
      });
      map.setCenter({ lat: selectedLocation.lat, lng: selectedLocation.lng });
    }
  };

  // Initialize map when shown
  useEffect(() => {
    if (showMap && mapLoaded && window.google) {
      initializeMap();
    }
  }, [showMap, mapLoaded, selectedLocation]);

  // Reinitialize autocomplete when map is loaded
  useEffect(() => {
    if (mapLoaded) {
      initializeAutocomplete();
    }
  }, [mapLoaded]);

  // Update address when selectedLocation changes
  useEffect(() => {
    if (selectedLocation?.address) {
      setAddress(selectedLocation.address);
    }
  }, [selectedLocation]);

  return (
    <div className={`google-maps-location-picker ${className}`}>
      {/* Address Input */}
      <div className="location-input-group">
        <input
          id="location-input"
          type="text"
          className={`form-control location-input ${disabled ? 'disabled' : ''}`}
          placeholder={placeholder}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          disabled={disabled}
        />
        <button
          type="button"
          className="btn btn-outline-primary"
          onClick={() => setShowMap(!showMap)}
          disabled={disabled || !mapLoaded}
          title="Toggle Map"
        >
          <i className="fas fa-map-marker-alt"></i>
        </button>
        <button
          type="button"
          className="btn btn-outline-success"
          onClick={getCurrentLocation}
          disabled={disabled || !mapLoaded || isLoading}
          title="Get Current Location"
        >
          <i className={`fas ${isLoading ? 'fa-spinner fa-spin' : 'fa-crosshairs'}`}></i>
        </button>
      </div>

      {/* Map Container */}
      {showMap && (
        <div className="map-container mt-3">
          {!mapLoaded ? (
            <div className="map-loading">
              <i className="fas fa-spinner fa-spin fa-2x mb-2"></i>
              <p>Loading map...</p>
            </div>
          ) : (
            <>
              <div 
                ref={mapRef} 
                style={{ 
                  width: '100%', 
                  height: '300px',
                  borderRadius: '8px',
                  border: '1px solid #ddd'
                }}
              />
              <div className="map-buttons">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => setShowMap(false)}
                >
                  <i className="fas fa-times me-1"></i>
                  Close Map
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-info"
                  onClick={getCurrentLocation}
                  disabled={isLoading}
                >
                  <i className={`fas ${isLoading ? 'fa-spinner fa-spin' : 'fa-crosshairs'} me-1`}></i>
                  Current Location
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Location Info */}
      {selectedLocation && (
        <div className="location-info mt-2">
          <small>
            <i className="fas fa-check-circle text-success me-1"></i>
            <strong>Selected:</strong> {selectedLocation.address}
            {selectedLocation.lat && selectedLocation.lng && (
              <span className="ms-2 text-muted">
                (Lat: {selectedLocation.lat.toFixed(6)}, Lng: {selectedLocation.lng.toFixed(6)})
              </span>
            )}
          </small>
        </div>
      )}

      {/* CSS Styles */}
      <style jsx>{`
        .google-maps-location-picker {
          position: relative;
        }
        
        .location-input-group {
          display: flex;
          gap: 8px;
        }
        
        .location-input {
          flex: 1;
        }
        
        .map-container {
          position: relative;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .map-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 300px;
          background: #f8f9fa;
          color: #6c757d;
        }
        
        .location-info {
          background: #e8f5e8;
          border: 1px solid #28a745;
          border-radius: 4px;
          padding: 8px 12px;
        }
        
        .map-buttons {
          display: flex;
          gap: 8px;
          margin-top: 8px;
        }
        
        .map-buttons .btn {
          flex: 1;
          font-size: 0.875rem;
        }
        
        /* Google Maps Autocomplete Styles */
        .pac-container {
          z-index: 9999 !important;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          border: 1px solid #ddd;
        }
        
        .pac-item {
          padding: 8px 12px;
          border-bottom: 1px solid #f0f0f0;
        }
        
        .pac-item:last-child {
          border-bottom: none;
        }
        
        .pac-item:hover {
          background-color: #f8f9fa;
        }
        
        .pac-item-selected {
          background-color: #e3f2fd;
        }
      `}</style>
    </div>
  );
};

export default GoogleMapsLocationPicker; 