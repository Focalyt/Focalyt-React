import React, { useState, useEffect, useRef } from 'react';

const Attendance = () => {
// Sample employee data
const [employees, setEmployees] = useState([
  { id: 1, name: 'John Smith', department: 'Engineering', email: 'john.smith@company.com', empId: 'EMP001', mobile: '+91-98765-43210', designation: 'Senior Developer' },
  { id: 2, name: 'Sarah Johnson', department: 'Marketing', email: 'sarah.johnson@company.com', empId: 'EMP002', mobile: '+91-98765-43211', designation: 'Marketing Manager' },
  { id: 3, name: 'Mike Davis', department: 'Sales', email: 'mike.davis@company.com', empId: 'EMP003', mobile: '+91-98765-43212', designation: 'Sales Executive' },
  { id: 4, name: 'Emily Wilson', department: 'HR', email: 'emily.wilson@company.com', empId: 'EMP004', mobile: '+91-98765-43213', designation: 'HR Specialist' },
  { id: 5, name: 'David Brown', department: 'Finance', email: 'david.brown@company.com', empId: 'EMP005', mobile: '+91-98765-43214', designation: 'Financial Analyst' },
  { id: 6, name: 'Lisa Garcia', department: 'Engineering', email: 'lisa.garcia@company.com', empId: 'EMP006', mobile: '+91-98765-43215', designation: 'Frontend Developer' },
  { id: 7, name: 'Tom Anderson', department: 'Operations', email: 'tom.anderson@company.com', empId: 'EMP007', mobile: '+91-98765-43216', designation: 'Operations Manager' },
  { id: 8, name: 'Anna Martinez', department: 'Design', email: 'anna.martinez@company.com', empId: 'EMP008', mobile: '+91-98765-43217', designation: 'UI/UX Designer' }
]);

// Modal states
const [showModal, setShowModal] = useState(false);
const [showLocationModal, setShowLocationModal] = useState(false);
const [showTimelineModal, setShowTimelineModal] = useState(false);
const [currentEmployee, setCurrentEmployee] = useState(null);
const [currentDate, setCurrentDate] = useState(null);
const [currentStatus, setCurrentStatus] = useState(null);
const [selectedEmployeeTimeline, setSelectedEmployeeTimeline] = useState(null);



const [formData, setFormData] = useState({
  name: '',
  empId: '',
  mobile: '',
  email: '',
  designation: '',
  department: ''
});

// Location state
const [currentLocation, setCurrentLocation] = useState(null);
const [locationLoading, setLocationLoading] = useState(false);
const [locationError, setLocationError] = useState(null);

// Google Maps refs
const mapRef = useRef(null);
const googleMapRef = useRef(null);
const directionsServiceRef = useRef(null);
const directionsRendererRef = useRef(null);
const animationIntervalRef = useRef(null);
const movingMarkerRef = useRef(null);

// Office location (Chandigarh coordinates)
const OFFICE_LOCATION = {
  latitude: 30.7333,
  longitude: 76.7794,
  radius: 500,
  name: "Head Office, Chandigarh"
};

// Generate realistic path data for employees with exact routes
const generateEmployeePathData = (employeeId) => {
  const pathPoints = [
    { 
      location: { name: "Home - Sector 43", lat: 30.7046, lng: 76.7179, type: "home" },
      time: "08:00",
      action: "started_from_home",
      punchType: null
    },
    { 
      location: { name: "Morning Walk - Rose Garden", lat: 30.7194, lng: 76.7645, type: "recreation" },
      time: "08:15",
      action: "morning_walk",
      punchType: null
    },
    { 
      location: { name: "Breakfast - CCD Sector 17", lat: 30.7298, lng: 76.7732, type: "restaurant" },
      time: "08:45",
      action: "breakfast",
      punchType: null
    },
    { 
      location: { name: "Head Office - Sector 34", lat: 30.7333, lng: 76.7794, type: "work" },
      time: "09:30",
      action: "arrived_office",
      punchType: "punch_in"
    },
    { 
      location: { name: "Bank Work - PNB Sector 22", lat: 30.7411, lng: 76.7869, type: "work" },
      time: "11:00",
      action: "bank_work",
      punchType: "punch_out_office"
    },
    { 
      location: { name: "Client Meeting - IT Park", lat: 30.7455, lng: 76.7901, type: "work" },
      time: "11:45",
      action: "client_meeting",
      punchType: null
    },
    { 
      location: { name: "Lunch - Elante Mall", lat: 30.7589, lng: 76.7834, type: "restaurant" },
      time: "13:00",
      action: "lunch_break",
      punchType: null
    },
    { 
      location: { name: "Head Office - Return", lat: 30.7333, lng: 76.7794, type: "work" },
      time: "14:00",
      action: "returned_office",
      punchType: "punch_in_return"
    },
    { 
      location: { name: "Office Canteen", lat: 30.7340, lng: 76.7800, type: "restaurant" },
      time: "16:30",
      action: "tea_break",
      punchType: null
    },
    { 
      location: { name: "Head Office - Work End", lat: 30.7333, lng: 76.7794, type: "work" },
      time: "18:00",
      action: "work_end",
      punchType: "punch_out_final"
    },
    { 
      location: { name: "Gym - Fitness First", lat: 30.7123, lng: 76.7567, type: "health" },
      time: "18:30",
      action: "workout",
      punchType: null
    },
    { 
      location: { name: "Grocery - Big Bazaar", lat: 30.7200, lng: 76.7600, type: "shopping" },
      time: "19:30",
      action: "shopping",
      punchType: null
    },
    { 
      location: { name: "Home - Sector 43", lat: 30.7046, lng: 76.7179, type: "home" },
      time: "20:30",
      action: "reached_home",
      punchType: null
    }
  ];

  // Add some randomization for different employees
  return pathPoints.map((point, index) => ({
    ...point,
    id: index,
    location: {
      ...point.location,
      lat: point.location.lat + (Math.random() - 0.5) * 0.002 * (employeeId % 3),
      lng: point.location.lng + (Math.random() - 0.5) * 0.002 * (employeeId % 3)
    },
    duration: index > 0 ? Math.floor(Math.random() * 60) + 15 + " mins" : "Start",
    distanceFromPrevious: index > 0 ? (Math.random() * 5 + 1).toFixed(1) + " km" : "0 km"
  }));
};

// Initialize REAL Google Maps
const initializeGoogleMaps = () => {
  if (typeof window !== 'undefined' && window.google && window.google.maps) {
    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: OFFICE_LOCATION.latitude, lng: OFFICE_LOCATION.longitude },
      zoom: 12,
      mapTypeId: 'roadmap',
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'on' }]
        },
        {
          featureType: 'road',
          elementType: 'geometry',
          stylers: [{ color: '#f5f5f5' }]
        }
      ]
    });

    googleMapRef.current = map;
    directionsServiceRef.current = new window.google.maps.DirectionsService();
    directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
      suppressMarkers: false,
      polylineOptions: {
        strokeColor: '#4285f4',
        strokeWeight: 4,
        strokeOpacity: 0.8
      }
    });
    directionsRendererRef.current.setMap(map);


    
    return map;
  } else {
    // Fallback: Load Google Maps Script
    loadGoogleMapsScript();
  }
  return null;
};

// Load Real Google Maps Script
const loadGoogleMapsScript = () => {
  if (window.google && window.google.maps) {
    initializeGoogleMaps();
    return;
  }

  const script = document.createElement('script');
  // Replace with your actual API key
//  add secret key here from env 
  script.async = true;
  script.defer = true;
  
  // Create global callback
  window.initMap = () => {
    setTimeout(() => {
      if (showTimelineModal && selectedEmployeeTimeline) {
        initializeGoogleMaps();
        setTimeout(() => plotEmployeePath(generateEmployeePathData(selectedEmployeeTimeline.id)), 500);
      }
    }, 100);
  };
  
  script.onerror = () => {
    // If Google Maps fails to load, show fallback
    createFallbackMap();
  };
  
  document.head.appendChild(script);
};

// Create Fallback Map (when Google Maps API is not available)
const createFallbackMap = () => {
  if (mapRef.current) {
    mapRef.current.innerHTML = `
      <div style="width: 100%; height: 100%; background: linear-gradient(45deg, #e8f5e8 0%, #f0f8ff 100%); position: relative; overflow: hidden; border-radius: 8px;">
        <div style="position: absolute; top: 20px; left: 20px; background: white; padding: 12px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); z-index: 1000;">
          <h6 style="margin: 0; color: #1976d2; font-size: 14px;">📍 Demo Path Tracking</h6>
          <small style="color: #666;">Add Google Maps API key for real maps</small>
        </div>
        


        <svg width="100%" height="100%" style="position: absolute; top: 0; left: 0;">
          <defs>
            <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style="stop-color:#4285f4;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#34a853;stop-opacity:1" />
            </linearGradient>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#1976d2" />
            </marker>
          </defs>
          
          <!-- Base path (light gray) -->
          <path id="basePath" d="M 50 120 Q 150 100 250 140 Q 350 120 450 160 Q 550 140 650 180 Q 750 160 850 200" 
                stroke="#e0e0e0" stroke-width="8" fill="none" stroke-linecap="round"/>
          
          <!-- Animated path (colored) -->
          <path id="animatedPath" d="M 50 120" 
                stroke="url(#pathGradient)" stroke-width="6" fill="none" 
                stroke-linecap="round" marker-end="url(#arrowhead)"
                style="stroke-dasharray: 0, 1000;">
          </path>
          
          <!-- Moving marker -->
          <circle id="movingMarker" cx="50" cy="120" r="8" fill="#ff4444" stroke="white" stroke-width="3" style="display: none;">
            <animate attributeName="r" values="8;12;8" dur="1s" repeatCount="indefinite"/>
          </circle>
        </svg>
        
        <!-- Static location markers -->
        <div id="markers-container" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"></div>
      </div>
    `;
    
    // Setup fallback animation controls
    setTimeout(() => {
      const pathData = generateEmployeePathData(selectedEmployeeTimeline?.id || 1);
      plotFallbackPath(pathData);
    }, 200);
  }
};



// Load Google Maps Script (Real Implementation)
useEffect(() => {
  if (showTimelineModal && selectedEmployeeTimeline) {
    setTimeout(() => {
      initializeGoogleMaps();
      setTimeout(() => {
        const pathData = generateEmployeePathData(selectedEmployeeTimeline.id);
        if (googleMapRef.current) {
          plotRealEmployeePath(pathData);
        } else {
          plotEmployeePath(pathData);
        }
      }, 500);
    }, 100);
  }
}, [showTimelineModal, selectedEmployeeTimeline]);

// Plot employee path on REAL Google Maps with MOVING LINES
const plotRealEmployeePath = (pathData) => {
  if (!googleMapRef.current || !window.google) return;

  const map = googleMapRef.current;
  
  // Clear existing overlays
  if (window.currentOverlays) {
    window.currentOverlays.forEach(overlay => {
      if (overlay.setMap) overlay.setMap(null);
    });
  }
  window.currentOverlays = [];

  // Create bounds to fit all markers
  const bounds = new window.google.maps.LatLngBounds();
  const pathCoordinates = [];

  // Build coordinates array
  pathData.forEach(point => {
    const position = { lat: point.location.lat, lng: point.location.lng };
    pathCoordinates.push(position);
    bounds.extend(position);
  });

  // Create markers for each location
  pathData.forEach((point, index) => {
    const position = { lat: point.location.lat, lng: point.location.lng };
    
    // Different marker colors based on type
    let markerColor = '#1976d2';
    let markerIcon = '';
    
    switch (point.location.type) {
      case 'home':
        markerColor = '#2e7d32'; // green
        markerIcon = '🏠';
        break;
      case 'work':
        markerColor = '#d32f2f'; // red
        markerIcon = '🏢';
        break;
      case 'restaurant':
        markerColor = '#f57c00'; // orange
        markerIcon = '🍽️';
        break;
      case 'recreation':
        markerColor = '#0288d1'; // cyan
        markerIcon = '🌳';
        break;
      case 'health':
        markerColor = '#7b1fa2'; // purple
        markerIcon = '💪';
        break;
      case 'shopping':
        markerColor = '#ff6f00'; // orange
        markerIcon = '🛒';
        break;
      default:
        markerColor = '#1976d2';
        markerIcon = '📍';
    }

    // Create custom marker
    const marker = new window.google.maps.Marker({
      position: position,
      map: map,
      title: `${index + 1}. ${point.location.name} - ${point.time}`,
      label: {
        text: (index + 1).toString(),
        color: 'white',
        fontWeight: 'bold',
        fontSize: '12px'
      },
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 16,
        fillColor: markerColor,
        fillOpacity: 1,
        strokeColor: 'white',
        strokeWeight: 3
      },
      zIndex: 1000 + index,
      animation: window.google.maps.Animation.DROP
    });

    // Add info window
    const infoWindow = new window.google.maps.InfoWindow({
      content: `
        <div style="padding: 12px; min-width: 280px; font-family: 'Segoe UI', sans-serif;">
          <div style="border-bottom: 1px solid #eee; padding-bottom: 8px; margin-bottom: 8px;">
            <h6 style="margin: 0; color: ${markerColor}; font-weight: bold;">
              ${markerIcon} ${point.location.name}
            </h6>
            <div style="font-size: 11px; color: #666; margin-top: 2px;">
              📍 Stop ${index + 1} of ${pathData.length}
            </div>
          </div>
          <div style="font-size: 13px; line-height: 1.4;">
            <div style="margin-bottom: 4px;">
              <strong>🕐 Time:</strong> ${point.time}
            </div>
            <div style="margin-bottom: 4px;">
              <strong>📍 Action:</strong> ${point.action.replace(/_/g, ' ')}
            </div>
            ${point.punchType ? `
              <div style="margin-bottom: 4px;">
                <strong>👆 Punch:</strong> 
                <span style="color: #d32f2f; font-weight: bold;">
                  ${point.punchType.replace(/_/g, ' ')}
                </span>
              </div>
            ` : ''}
            <div style="margin-bottom: 4px;">
              <strong>⏱️ Duration:</strong> ${point.duration}
            </div>
            <div style="margin-bottom: 4px;">
              <strong>📏 Distance:</strong> ${point.distanceFromPrevious}
            </div>
            ${index > 0 ? `
              <div style="background: #f8f9fa; padding: 6px; border-radius: 4px; margin: 8px 0; font-size: 11px;">
                <strong>🛣️ Path Info:</strong><br/>
                From: ${pathData[index - 1].location.name}<br/>
                To: ${point.location.name}<br/>
                Route: ${point.distanceFromPrevious} in ${point.duration}
              </div>
            ` : ''}
            <div style="color: #666; font-size: 11px; margin-top: 8px; padding-top: 8px; border-top: 1px solid #eee;">
              <strong>GPS:</strong> ${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}
            </div>
          </div>
        </div>
      `
    });

    marker.addListener('click', () => {
      if (window.currentInfoWindow) {
        window.currentInfoWindow.close();
      }
      infoWindow.open(map, marker);
      window.currentInfoWindow = infoWindow;
    });

    window.currentOverlays.push(marker);
  });

  // Create the main path polyline connecting all markers
  const mainPathPolyline = new window.google.maps.Polyline({
    path: pathCoordinates,
    geodesic: true,
    strokeColor: '#4285f4',
    strokeOpacity: 0.8,
    strokeWeight: 6,
    icons: [{
      icon: {
        path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
        scale: 3,
        strokeColor: '#4285f4',
        fillColor: '#4285f4',
        fillOpacity: 1
      },
      repeat: '100px'
    }],
    map: map,
    zIndex: 500
  });

  // Add the polyline to overlays for cleanup
  window.currentOverlays.push(mainPathPolyline);

  // Store path data for animation
  window.currentPathData = pathData;
  window.currentPathCoordinates = pathCoordinates;

  // Fit map to show all points
  map.fitBounds(bounds);
  
  // Limit zoom level
  setTimeout(() => {
    const currentZoom = map.getZoom();
    if (currentZoom > 15) {
      map.setZoom(15);
    }
  }, 500);
};





// Plot Fallback Path (when Google Maps is not available)
const plotFallbackPath = (pathData) => {
  const markersContainer = mapRef.current?.querySelector('#markers-container');
  if (!markersContainer) return;

  // Clear existing markers
  markersContainer.innerHTML = '';

  // Create markers for each location
  pathData.forEach((point, index) => {
    const xPos = 50 + (index * 70); // Spread markers horizontally
    const yPos = 120 + Math.sin(index * 0.5) * 40; // Add some curve
    
    const markerDiv = document.createElement('div');
    markerDiv.innerHTML = `
      <div class="location-marker" id="marker-${index}" style="
        position: absolute;
        left: ${xPos}px;
        top: ${yPos}px;
        width: 36px;
        height: 36px;
        background: ${getMarkerColor(point.location.type)};
        border: 3px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 12px;
        box-shadow: 0 3px 10px rgba(0,0,0,0.3);
        cursor: pointer;
        z-index: 200;
        transform: scale(0);
        animation: popIn 0.4s ease-out ${index * 0.1}s forwards;
      " title="${point.location.name} - ${point.time}">
        ${index + 1}
      </div>
    `;
    markersContainer.appendChild(markerDiv);

    // Add click event for marker info
    const marker = markerDiv.querySelector('.location-marker');
    marker.addEventListener('click', () => {
      showLocationInfo(point, index);
    });
  });

  // Create connecting lines between markers
  const svg = mapRef.current?.querySelector('svg');
  if (svg) {
    // Create path coordinates for connecting lines
    const pathPoints = pathData.map((point, i) => {
      const x = 50 + (i * 70);
      const y = 120 + Math.sin(i * 0.5) * 40;
      return { x, y };
    });

    // Create the main connecting path
    const mainPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    let pathString = `M ${pathPoints[0].x} ${pathPoints[0].y}`;
    
    for (let i = 1; i < pathPoints.length; i++) {
      const prevPoint = pathPoints[i - 1];
      const currPoint = pathPoints[i];
      const controlX = (prevPoint.x + currPoint.x) / 2;
      const controlY = Math.min(prevPoint.y, currPoint.y) - 20;
      
      pathString += ` Q ${controlX} ${controlY} ${currPoint.x} ${currPoint.y}`;
    }

    mainPath.setAttribute('d', pathString);
    mainPath.setAttribute('stroke', '#4285f4');
    mainPath.setAttribute('stroke-width', '4');
    mainPath.setAttribute('fill', 'none');
    mainPath.setAttribute('stroke-linecap', 'round');
    mainPath.setAttribute('marker-end', 'url(#arrowhead)');
    mainPath.style.opacity = '0.8';
    mainPath.style.zIndex = '100';

    svg.appendChild(mainPath);
  }


};

// Plot employee path (Universal function - works with both real maps and fallback)
const plotEmployeePath = (pathData) => {
  if (googleMapRef.current && window.google) {
    // Use real Google Maps
    plotRealEmployeePath(pathData);
  } else {
    // Use fallback
    plotFallbackPath(pathData);
  }
};







// Show location info
const showLocationInfo = (point, index) => {
  alert(`Location ${index + 1}: ${point.location.name}\nTime: ${point.time}\nAction: ${point.action.replace(/_/g, ' ')}\n${point.punchType ? 'Punch: ' + point.punchType.replace(/_/g, ' ') : ''}`);
};



// Get marker color based on location type
const getMarkerColor = (type) => {
  const colors = {
    home: '#28a745',      // green
    work: '#dc3545',      // red  
    restaurant: '#ffc107', // yellow
    recreation: '#17a2b8', // cyan
    health: '#6f42c1',    // purple
    shopping: '#fd7e14'   // orange
  };
  return colors[type] || '#007bff';
};

// Get current location
const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser.'));
      return;
    }

    setLocationLoading(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date().toISOString()
        };
        setCurrentLocation(location);
        setLocationLoading(false);
        resolve(location);
      },
      (error) => {
        let errorMessage;
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied by user.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out.";
            break;
          default:
            errorMessage = "An unknown error occurred.";
            break;
        }
        setLocationError(errorMessage);
        setLocationLoading(false);
        reject(new Error(errorMessage));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
};

// Calculate distance between two coordinates
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
};

// Check if location is within office premises
const isWithinOfficeRadius = (userLat, userLon) => {
  const distance = calculateDistance(
    OFFICE_LOCATION.latitude, 
    OFFICE_LOCATION.longitude,
    userLat, 
    userLon
  );
  return distance <= OFFICE_LOCATION.radius;
};

// Handle attendance change with location
const handleAttendanceChange = async (employeeId, date, status) => {
  if (status === 'absent') {
    setAttendance(prev => ({
      ...prev,
      [employeeId]: {
        ...prev[employeeId],
        [date]: {
          status: status,
          location: null
        }
      }
    }));
    return;
  }

  setCurrentEmployee(employeeId);
  setCurrentDate(date);
  setCurrentStatus(status);
  setShowLocationModal(true);

  try {
    await getCurrentLocation();
  } catch (error) {
    console.error('Location error:', error);
  }
};

// Confirm attendance with location
const confirmAttendanceWithLocation = () => {
  if (!currentLocation) {
    alert('Location is required to mark attendance. Please allow location access.');
    return;
  }

  const isInOffice = isWithinOfficeRadius(currentLocation.latitude, currentLocation.longitude);
  
  if (!isInOffice) {
    const proceed = window.confirm(
      `Warning: You are ${Math.round(calculateDistance(
        OFFICE_LOCATION.latitude, 
        OFFICE_LOCATION.longitude,
        currentLocation.latitude, 
        currentLocation.longitude
      ))} meters away from the office. Do you want to continue?`
    );
    
    if (!proceed) {
      setShowLocationModal(false);
      return;
    }
  }

  setAttendance(prev => ({
    ...prev,
    [currentEmployee]: {
      ...prev[currentEmployee],
      [currentDate]: {
        status: currentStatus,
        location: currentLocation
      }
    }
  }));

  setShowLocationModal(false);
  setCurrentEmployee(null);
  setCurrentDate(null);
  setCurrentStatus(null);
};

// Show employee timeline with map
const showEmployeeTimeline = (employee) => {
  setSelectedEmployeeTimeline(employee);
  setShowTimelineModal(true);
};

// Handle timeline item click to show location on map
const handleTimelineItemClick = (item, index) => {
  if (!googleMapRef.current || !window.google) return;

  const map = googleMapRef.current;
  const position = { lat: item.location.lat, lng: item.location.lng };

  // Pan map to the clicked location
  map.panTo(position);
  map.setZoom(16); // Zoom in to show the location clearly

  // Highlight the clicked marker
  if (window.currentOverlays) {
    window.currentOverlays.forEach((overlay, i) => {
      if (overlay.setMap && i < window.currentOverlays.length - 1) { // Exclude polyline
        if (i === index) {
          // Highlight the clicked marker
          overlay.setAnimation(window.google.maps.Animation.BOUNCE);
          overlay.setZIndex(2000);
          
          // Open info window for the clicked marker
          if (window.currentInfoWindow) {
            window.currentInfoWindow.close();
          }
          
          // Create and open info window
          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div style="padding: 12px; min-width: 280px; font-family: 'Segoe UI', sans-serif;">
                <div style="border-bottom: 1px solid #eee; padding-bottom: 8px; margin-bottom: 8px;">
                  <h6 style="margin: 0; color: ${getMarkerColor(item.location.type)}; font-weight: bold;">
                    ${getIconByType(item.location.type)} ${item.location.name}
                  </h6>
                  <div style="font-size: 11px; color: #666; margin-top: 2px;">
                    📍 Stop ${index + 1} of ${generateEmployeePathData(selectedEmployeeTimeline?.id || 1).length}
                  </div>
                </div>
                <div style="font-size: 13px; line-height: 1.4;">
                  <div style="margin-bottom: 4px;">
                    <strong>🕐 Time:</strong> ${item.time}
                  </div>
                  <div style="margin-bottom: 4px;">
                    <strong>📍 Action:</strong> ${getActionText(item.action)}
                  </div>
                  ${item.punchType ? `
                    <div style="margin-bottom: 4px;">
                      <strong>👆 Punch:</strong> 
                      <span style="color: #d32f2f; font-weight: bold;">
                        ${getPunchTypeText(item.punchType)}
                      </span>
                    </div>
                  ` : ''}
                  <div style="margin-bottom: 4px;">
                    <strong>⏱️ Duration:</strong> ${item.duration}
                  </div>
                  <div style="margin-bottom: 4px;">
                    <strong>📏 Distance:</strong> ${item.distanceFromPrevious}
                  </div>
                  <div style="color: #666; font-size: 11px; margin-top: 8px; padding-top: 8px; border-top: 1px solid #eee;">
                    <strong>GPS:</strong> ${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}
                  </div>
                </div>
              </div>
            `
          });
          
          infoWindow.open(map, overlay);
          window.currentInfoWindow = infoWindow;
          
          // Stop bouncing after 3 seconds
          setTimeout(() => {
            overlay.setAnimation(null);
            overlay.setZIndex(1000 + index);
          }, 3000);
        } else {
          // Reset other markers
          overlay.setAnimation(null);
          overlay.setZIndex(1000 + i);
        }
      }
    });
  }
};

// Generate last 7 days
const generateDates = () => {
  const dates = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
  }
  return dates;
};

const [dates] = useState(generateDates());
const [selectedDate, setSelectedDate] = useState(dates[dates.length - 1]);

// Attendance state with location data
const [attendance, setAttendance] = useState(() => {
  const initialAttendance = {};
  employees.forEach(emp => {
    initialAttendance[emp.id] = {};
    dates.forEach(date => {
      const randomStatus = Math.random() > 0.3 ? 'present' : Math.random() > 0.5 ? 'absent' : 'late';
      initialAttendance[emp.id][date] = {
        status: randomStatus,
        location: randomStatus !== 'absent' ? {
          latitude: OFFICE_LOCATION.latitude + (Math.random() - 0.5) * 0.01,
          longitude: OFFICE_LOCATION.longitude + (Math.random() - 0.5) * 0.01,
          timestamp: new Date().toISOString(),
          accuracy: Math.floor(Math.random() * 50) + 10
        } : null
      };
    });
  });
  return initialAttendance;
});

const handleInputChange = (e) => {
  const { name, value } = e.target;
  setFormData(prev => ({
    ...prev,
    [name]: value
  }));
};

const handleAddEmployee = () => {
  if (!formData.name || !formData.empId || !formData.email || !formData.mobile || !formData.designation) {
    alert('Please fill in all required fields');
    return;
  }

  if (employees.some(emp => emp.empId === formData.empId)) {
    alert('Employee ID already exists');
    return;
  }

  const newEmployee = {
    id: Math.max(...employees.map(e => e.id)) + 1,
    ...formData
  };

  setEmployees(prev => [...prev, newEmployee]);

  setAttendance(prev => ({
    ...prev,
    [newEmployee.id]: dates.reduce((acc, date) => ({
      ...acc,
      [date]: { status: '', location: null }
    }), {})
  }));

  setFormData({
    name: '',
    empId: '',
    mobile: '',
    email: '',
    designation: '',
    department: ''
  });
  setShowModal(false);
};

const handleExport = () => {
  const headers = [
    'Employee Name', 'Employee ID', 'Department', 'Designation', 'Mobile', 'Email',
    ...dates.map(date => formatDate(date)),
    'Present Days', 'Absent Days', 'Late Days', 'Total Days', 'Attendance %'
  ];

  const csvData = employees.map(employee => {
    const attendanceRecord = dates.map(date => {
      const record = attendance[employee.id]?.[date];
      const status = record?.status;
      return status === 'present' ? 'P' : 
             status === 'absent' ? 'A' : 
             status === 'late' ? 'L' : '-';
    });

    const presentDays = attendanceRecord.filter(status => status === 'P').length;
    const absentDays = attendanceRecord.filter(status => status === 'A').length;
    const lateDays = attendanceRecord.filter(status => status === 'L').length;
    const totalDays = dates.length;
    const attendancePercentage = ((presentDays + lateDays) / totalDays * 100).toFixed(1);

    return [
      employee.name, employee.empId, employee.department, employee.designation,
      employee.mobile, employee.email, ...attendanceRecord,
      presentDays, absentDays, lateDays, totalDays, `${attendancePercentage}%`
    ];
  });

  const csvContent = [
    headers.join(','),
    ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `attendance_report_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const getAttendanceStats = () => {
  let present = 0, absent = 0, late = 0;
  employees.forEach(emp => {
    const record = attendance[emp.id]?.[selectedDate];
    const status = record?.status;
    if (status === 'present') present++;
    else if (status === 'absent') absent++;
    else if (status === 'late') late++;
  });
  return { present, absent, late };
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  });
};

const stats = getAttendanceStats();

const getIconByType = (type) => {
  const icons = {
    home: "🏠",
    restaurant: "🍽️",
    work: "🏢",
    shopping: "🛒",
    health: "💪",
    recreation: "🌳"
  };
  return icons[type] || "📍";
};

const getActionText = (action) => {
  const actions = {
    started_from_home: "Started from home",
    morning_walk: "Morning walk",
    breakfast: "Breakfast",
    arrived_office: "Arrived at office",
    bank_work: "Bank work",
    client_meeting: "Client meeting",
    lunch_break: "Lunch break",
    returned_office: "Returned to office",
    tea_break: "Tea break",
    work_end: "Work ended",
    workout: "Workout",
    shopping: "Shopping",
    reached_home: "Reached home"
  };
  return actions[action] || action;
};

const getPunchTypeText = (punchType) => {
  const types = {
    punch_in: "Punch In",
    punch_out_office: "Punch Out (Office)",
    punch_in_return: "Punch In (Return)",
    punch_out_final: "Final Punch Out"
  };
  return types[punchType] || punchType;
};

const getPunchStyle = (punchType) => {
  const styles = {
    'punch_in': { bg: 'success', icon: '🟢' },
    'punch_out_office': { bg: 'warning', icon: '🟡' },
    'punch_in_return': { bg: 'info', icon: '🔵' },
    'punch_out_final': { bg: 'danger', icon: '🔴' }
  };
  return styles[punchType] || { bg: 'light', icon: '⚪' };
};

return (
  <div className="container-fluid py-4" style={{backgroundColor: '#f8f9fa', minHeight: '100vh'}}>
    {/* Header */}
    <div className="row mb-4">
      <div className="col-12">
        <div className="d-flex justify-content-between align-items-center">
          <h2 className="mb-0 text-primary fw-bold">
            <i className="bi bi-geo-alt-fill me-2"></i>
            Employee Attendance Record
          </h2>
          <div className="d-flex gap-2">
            <button className="btn btn-outline-primary" onClick={handleExport}>
              <i className="bi bi-download me-1"></i>
              Export CSV
            </button>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <i className="bi bi-plus-lg me-1"></i>
              Add Employee
            </button>
          </div>
        </div>
      </div>
    </div>

    {/* Stats Cards */}
    <div className="row mb-4">
      <div className="col-md-3">
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <h6 className="card-title text-muted mb-3">Select Date</h6>
            <select 
              className="form-select"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            >
              {dates.map(date => (
                <option key={date} value={date}>
                  {formatDate(date)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <div className="col-md-3">
        <div className="card border-0 shadow-sm bg-success">
          <div className="card-body text-center text-white">
            <h3 className="card-title h2 mb-0">{stats.present}</h3>
            <p className="card-text">Present Today</p>
          </div>
        </div>
      </div>
      <div className="col-md-3">
        <div className="card border-0 shadow-sm bg-danger">
          <div className="card-body text-center text-white">
            <h3 className="card-title h2 mb-0">{stats.absent}</h3>
            <p className="card-text">Absent Today</p>
          </div>
        </div>
      </div>
      <div className="col-md-3">
        <div className="card border-0 shadow-sm bg-warning">
          <div className="card-body text-center text-dark">
            <h3 className="card-title h2 mb-0">{stats.late}</h3>
            <p className="card-text">Late Today</p>
          </div>
        </div>
      </div>
    </div>

    {/* Location Confirmation Modal */}
    {showLocationModal && (
      <div className="modal fade show d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header bg-success text-white">
              <h5 className="modal-title">
                <i className="bi bi-geo-alt-fill me-2"></i>
                Confirm Location for Attendance
              </h5>
              <button type="button" className="btn-close btn-close-white" onClick={() => setShowLocationModal(false)}></button>
            </div>
            <div className="modal-body">
              {locationLoading && (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Getting location...</span>
                  </div>
                  <p className="mt-2 text-muted">Getting your current location...</p>
                </div>
              )}

              {locationError && (
                <div className="alert alert-danger">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  {locationError}
                  <div className="mt-2">
                    <button className="btn btn-sm btn-outline-danger" onClick={getCurrentLocation}>
                      Try Again
                    </button>
                  </div>
                </div>
              )}

              {currentLocation && (
                <div>
                  <div className="alert alert-info">
                    <i className="bi bi-info-circle-fill me-2"></i>
                    Location captured successfully!
                  </div>
                  
                  <div className="row mb-3">
                    <div className="col-sm-4 fw-bold">Latitude:</div>
                    <div className="col-sm-8">{currentLocation.latitude.toFixed(6)}</div>
                  </div>
                  <div className="row mb-3">
                    <div className="col-sm-4 fw-bold">Longitude:</div>
                    <div className="col-sm-8">{currentLocation.longitude.toFixed(6)}</div>
                  </div>
                  <div className="row mb-3">
                    <div className="col-sm-4 fw-bold">Accuracy:</div>
                    <div className="col-sm-8">{Math.round(currentLocation.accuracy)} meters</div>
                  </div>
                  <div className="row mb-3">
                    <div className="col-sm-4 fw-bold">Distance from Office:</div>
                    <div className="col-sm-8">
                      <span className={
                        isWithinOfficeRadius(currentLocation.latitude, currentLocation.longitude) 
                          ? 'text-success' : 'text-warning'
                      }>
                        {Math.round(calculateDistance(
                          OFFICE_LOCATION.latitude, 
                          OFFICE_LOCATION.longitude,
                          currentLocation.latitude, 
                          currentLocation.longitude
                        ))} meters
                      </span>
                      {isWithinOfficeRadius(currentLocation.latitude, currentLocation.longitude) && (
                        <i className="bi bi-check-circle-fill text-success ms-1"></i>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowLocationModal(false)}>
                Cancel
              </button>
              <button 
                type="button" 
                className="btn btn-success"
                onClick={confirmAttendanceWithLocation}
                disabled={!currentLocation}
              >
                Confirm Attendance
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Employee Path Timeline Modal with MOVING LINES */}
    {showTimelineModal && selectedEmployeeTimeline && (
      <div className="modal fade show d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
        <div className="modal-dialog modal-fullscreen">
          <div className="modal-content">
            <div className="modal-header bg-primary text-white">
              <h5 className="modal-title">
                <i className="bi bi-map me-2"></i>
                Real Google Maps Timeline: {selectedEmployeeTimeline.name} - {formatDate(selectedDate)}
              </h5>
              <button type="button" className="btn-close btn-close-white" onClick={() => setShowTimelineModal(false)}></button>
            </div>
            <div className="modal-body p-0" style={{height: '80vh'}}>
              <div className="row h-100 g-0">
                {/* Moving Lines Map - Left Side */}
                <div className="col-md-8 h-100">
                  <div 
                    ref={mapRef} 
                    style={{width: '100%', height: '100%'}}
                    className="border-end"
                  ></div>
                </div>
                
                {/* Timeline List - Right Side */}
                <div className="col-md-4 h-100" style={{overflowY: 'auto', backgroundColor: '#f8f9fa'}}>
                  <div className="p-3">
                    <h6 className="fw-bold mb-3 text-primary">
                      <i className="bi bi-clock-history me-2"></i>
                      Daily Timeline & Punch Records
                    </h6>
                    

                    
                    {/* Path Summary */}
                    <div className="card border-0 shadow-sm mb-3" style={{borderLeft: '4px solid #4285f4'}}>
                      <div className="card-body p-3">
                        <h6 className="card-title fw-bold mb-3 text-primary">
                          <i className="bi bi-map me-2"></i>
                          🛣️ Path Summary
                        </h6>
                        <div className="row text-center small">
                          <div className="col-6 mb-2">
                            <div className="text-primary h6">
                              <i className="bi bi-geo-alt-fill me-1"></i>
                              {generateEmployeePathData(selectedEmployeeTimeline?.id || 1).length}
                            </div>
                            <div className="text-muted">📍 Stops</div>
                          </div>
                          <div className="col-6 mb-2">
                            <div className="text-success h6">
                              <i className="bi bi-clock-fill me-1"></i>
                              12h 30m
                            </div>
                            <div className="text-muted">⏱️ Total Time</div>
                          </div>
                          <div className="col-6">
                            <div className="text-warning h6">
                              <i className="bi bi-arrow-right-circle me-1"></i>
                              28.5km
                            </div>
                            <div className="text-muted">📏 Total Distance</div>
                          </div>
                          <div className="col-6">
                            <div className="text-info h6">
                              <i className="bi bi-hand-index-thumb me-1"></i>
                              {generateEmployeePathData(selectedEmployeeTimeline?.id || 1).filter(p => p.punchType).length}
                            </div>
                            <div className="text-muted">👆 Punch Records</div>
                          </div>
                        </div>
                        
                        {/* Additional Path Details */}
                        <div className="mt-3 pt-3 border-top">
                          <div className="row small text-muted">
                            <div className="col-6">
                              <div className="d-flex justify-content-between mb-1">
                                <span>🏠 Home Visits:</span>
                                <strong>2</strong>
                              </div>
                              <div className="d-flex justify-content-between mb-1">
                                <span>🏢 Office Time:</span>
                                <strong>8h 30m</strong>
                              </div>
                            </div>
                            <div className="col-6">
                              <div className="d-flex justify-content-between mb-1">
                                <span>🍽️ Breaks:</span>
                                <strong>3</strong>
                              </div>
                              <div className="d-flex justify-content-between">
                                <span>💪 Activities:</span>
                                <strong>2</strong>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Timeline Items */}
                    <div className="timeline-container">
                      {generateEmployeePathData(selectedEmployeeTimeline.id).map((item, index) => {
                        const punchStyle = getPunchStyle(item.punchType);
                        
                        return (
                          <div key={item.id} className="d-flex mb-3">
                            <div className="flex-shrink-0 me-3">
                              <div 
                                className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold position-relative"
                                style={{
                                  width: '40px', 
                                  height: '40px', 
                                  backgroundColor: getMarkerColor(item.location.type),
                                  fontSize: '12px',
                                  transition: 'all 0.3s ease'
                                }}
                              >
                                {index + 1}
                              </div>
                              {index < generateEmployeePathData(selectedEmployeeTimeline.id).length - 1 && (
                                <div 
                                  className="ms-3 mt-1"
                                  style={{
                                    width: '2px', 
                                    height: '40px', 
                                    backgroundColor: '#dee2e6',
                                    marginLeft: '19px'
                                  }}
                                ></div>
                              )}
                            </div>
                            <div className="flex-grow-1">
                              <div 
                                className="card border-0 shadow-sm"
                                style={{ 
                                  cursor: 'pointer',
                                  transition: 'all 0.3s ease'
                                }}
                                onClick={() => handleTimelineItemClick(item, index)}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.transform = 'scale(1.02)';
                                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = 'scale(1)';
                                  e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
                                }}
                                title={`Click to view ${item.location.name} on map`}
                              >
                                <div className="card-body p-2">
                                  <div className="d-flex justify-content-between align-items-start mb-1">
                                    <h6 className="card-title mb-0 fw-bold small">
                                      {getIconByType(item.location.type)} {item.location.name}
                                    </h6>
                                    <span className="badge bg-primary">{item.time}</span>
                                  </div>
                                  <p className="card-text text-muted small mb-1">
                                    {getActionText(item.action)}
                                  </p>
                                  
                                  {item.punchType && (
                                    <div className={`alert alert-${punchStyle.bg} py-1 px-2 mb-1 small`}>
                                      <i className="bi bi-hand-index-thumb me-1"></i>
                                      <strong>{punchStyle.icon} {getPunchTypeText(item.punchType)}</strong>
                                    </div>
                                  )}
                                  
                                  <div className="small text-muted">
                                    <div className="row">
                                      <div className="col-6">
                                        <i className="bi bi-clock me-1"></i>
                                        {item.duration}
                                      </div>
                                      <div className="col-6">
                                        <i className="bi bi-arrow-right me-1"></i>
                                        {item.distanceFromPrevious}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Click indicator */}
                                  <div className="text-center mt-2">
                                    <small className="text-primary">
                                      <i className="bi bi-cursor me-1"></i>
                                      Click to view on map
                                    </small>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Punch Summary */}
                    <div className="card border-0 shadow-sm mt-3">
                      <div className="card-header bg-light py-2">
                        <h6 className="mb-0 small fw-bold">
                          <i className="bi bi-hand-index-thumb me-2"></i>
                          Punch In/Out Summary
                        </h6>
                      </div>
                      <div className="card-body p-2">
                        <div className="small">
                          <div className="d-flex justify-content-between mb-1">
                            <span className="text-success">
                              <i className="bi bi-box-arrow-in-right me-1"></i>
                              First Punch In:
                            </span>
                            <strong>09:30 AM</strong>
                          </div>
                          <div className="d-flex justify-content-between mb-1">
                            <span className="text-warning">
                              <i className="bi bi-box-arrow-left me-1"></i>
                              Lunch Break:
                            </span>
                            <strong>11:00 AM - 02:00 PM</strong>
                          </div>
                          <div className="d-flex justify-content-between">
                            <span className="text-danger">
                              <i className="bi bi-box-arrow-right me-1"></i>
                              Final Punch Out:
                            </span>
                            <strong>06:00 PM</strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowTimelineModal(false)}>
                Close Map
              </button>
              <button type="button" className="btn btn-success">
                <i className="bi bi-download me-1"></i>
                Export Path Data
              </button>
              <button type="button" className="btn btn-primary">
                <i className="bi bi-share me-1"></i>
                Share Route
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Add Employee Modal */}
    {showModal && (
      <div className="modal fade show d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header bg-primary text-white">
              <h5 className="modal-title">
                <i className="bi bi-person-plus me-2"></i>
                Add New Employee
              </h5>
              <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
            </div>
            <div className="modal-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <label htmlFor="name" className="form-label">
                    Employee Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter full name"
                  />
                </div>
                <div className="col-md-6">
                  <label htmlFor="empId" className="form-label">
                    Employee ID <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="empId"
                    name="empId"
                    value={formData.empId}
                    onChange={handleInputChange}
                    placeholder="e.g., EMP009"
                  />
                </div>
                <div className="col-md-6">
                  <label htmlFor="mobile" className="form-label">
                    Mobile Number <span className="text-danger">*</span>
                  </label>
                  <input
                    type="tel"
                    className="form-control"
                    id="mobile"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleInputChange}
                    placeholder="+91-XXXXXXXXXX"
                  />
                </div>
                <div className="col-md-6">
                  <label htmlFor="email" className="form-label">
                    Email Address <span className="text-danger">*</span>
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="employee@company.com"
                  />
                </div>
                <div className="col-md-6">
                  <label htmlFor="designation" className="form-label">
                    Designation <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="designation"
                    name="designation"
                    value={formData.designation}
                    onChange={handleInputChange}
                    placeholder="e.g., Software Engineer"
                  />
                </div>
                <div className="col-md-6">
                  <label htmlFor="department" className="form-label">
                    Department <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select"
                    id="department"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                  >
                    <option value="">Select Department</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Sales">Sales</option>
                    <option value="HR">HR</option>
                    <option value="Finance">Finance</option>
                    <option value="Operations">Operations</option>
                    <option value="Design">Design</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={handleAddEmployee}>
                Add Employee
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Instructions */}
    <div className="row mb-3">
      <div className="col-12">
        <div className="alert alert-info border-0 shadow-sm">
          <div className="row align-items-center">
            <div className="col-md-8">
              <h6 className="alert-heading mb-2">
                <i className="bi bi-map text-primary me-2"></i>
                Real Google Maps Timeline Feature
              </h6>
              <p className="mb-0">
                <strong>🗺️ NEW:</strong> Now with Real Google Maps integration!<br/>
                <strong>Step 1:</strong> Click any <span className="badge bg-primary mx-1">View Path</span> button below<br/>
                <strong>Step 2:</strong> Click <span className="badge bg-success mx-1">▶️ Start</span> in map controls<br/>
                <strong>Step 3:</strong> Watch real animated movement with actual map locations
              </p>
            </div>
            <div className="col-md-4 text-center">
              <div className="bg-white p-3 rounded shadow-sm">
                <i className="bi bi-globe text-primary" style={{fontSize: '2rem'}}></i>
                <div className="mt-2 small text-muted">Real Google Maps</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Attendance Table */}
    <div className="row">
      <div className="col-12">
        <div className="card border-0 shadow-sm">

          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="px-4 py-3">Employee</th>
                    <th className="px-3 py-3" style={{whiteSpace: 'nowrap'}}>Emp ID</th>
                    <th className="px-3 py-3">Department</th>
                    <th className="px-3 py-3">Mobile</th>
                    {dates.map(date => (
                      <th key={date} className="text-center px-2 py-3" style={{minWidth: '120px'}}>
                        {formatDate(date)}
                      </th>
                    ))}
                    <th className="px-3 py-3" style={{whiteSpace: 'nowrap'}}>Moving Path</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map(employee => (
                    <tr key={employee.id}>
                      <td className="px-3 py-3">
                        <div className="d-flex align-items-center">
                          <div 
                            className="avatar-circle bg-primary text-white me-3 d-flex align-items-center justify-content-center fw-bold" 
                            style={{width: '40px', height: '40px', borderRadius: '50%'}}
                          >
                            {employee.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <div className="fw-bold">{employee.name}</div>
                            <small className="text-muted">{employee.designation}</small>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-3">
                        <span className="badge bg-secondary">{employee.empId}</span>
                      </td>
                      <td className="px-2 py-3">
                        <span className="badge bg-light text-dark">{employee.department}</span>
                      </td>
                      <td className="px-2 py-3" style={{whiteSpace: 'nowrap'}}>
                        <small className="text-muted">{employee.mobile}</small>
                      </td>
                      {dates.map(date => {
                        const record = attendance[employee.id]?.[date];
                        const status = record?.status;
                        const hasLocation = record?.location;
                        
                        return (
                          <td key={date} className="text-center px-1 py-3">
                            <div className="d-flex flex-column align-items-center">
                              <select
                                className={`form-select form-select-sm border-0 mb-1 fw-bold ${
                                  status === 'present' ? 'bg-success text-white' :
                                  status === 'absent' ? 'bg-danger text-white' :
                                  status === 'late' ? 'bg-warning text-dark' :
                                  'bg-light'
                                }`}
                                value={status || ''}
                                onChange={(e) => handleAttendanceChange(employee.id, date, e.target.value)}
                                style={{fontSize: '12px', width: '60px'}}
                              >
                                <option value="">-</option>
                                <option value="present">P</option>
                                <option value="absent">A</option>
                                <option value="late">L</option>
                              </select>
                             
                            </div>
                          </td>
                        );
                      })}
                      <td className="px-2 py-3 text-center">
                        <button 
                          className="btn btn-sm btn-primary d-flex align-items-center justify-content-center mx-auto"
                          onClick={() => showEmployeeTimeline(employee)}
                          title="Click to view moving lines timeline animation"
                          style={{minWidth: '100px' , whiteSpace: 'nowrap'}}
                        >
                          <i className="bi bi-arrow-right-circle me-1"></i>
                          View Path
                        </button>
                        
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
);
};

export default Attendance;