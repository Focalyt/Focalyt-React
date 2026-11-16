import React, { useEffect, useRef, useState } from 'react';
import { Crosshair, MapPin } from 'lucide-react';

const loadGoogleMaps = () =>
  new Promise((resolve) => {
    if (window.google?.maps?.places) {
      resolve(true);
      return;
    }

    const existing = document.querySelector('script[src*="maps.googleapis.com/maps/api"]');
    if (existing) {
      const wait = setInterval(() => {
        if (window.google?.maps?.places) {
          clearInterval(wait);
          resolve(true);
        }
      }, 150);
      setTimeout(() => {
        clearInterval(wait);
        resolve(Boolean(window.google?.maps?.places));
      }, 8000);
      return;
    }

    const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      resolve(false);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });

const asLocation = ({ address, lat, lng, placeId, name }) => ({
  address: String(address || name || '').trim(),
  lat: Number(lat),
  lng: Number(lng),
  placeId: placeId || '',
  name: name || '',
});

export const ClubVenuePicker = ({ value, onChange, error }) => {
  const inputRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const autocompleteRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const [mapsReady, setMapsReady] = useState(false);
  const [locating, setLocating] = useState(false);
  const [localError, setLocalError] = useState('');

  const hasPin = Number.isFinite(Number(value?.lat)) && Number.isFinite(Number(value?.lng));
  onChangeRef.current = onChange;

  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps().then((ok) => {
      if (!cancelled) setMapsReady(ok);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!mapsReady || !inputRef.current || !window.google?.maps?.places) return undefined;

    const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
      fields: ['formatted_address', 'geometry', 'place_id', 'name'],
      componentRestrictions: { country: 'in' },
    });
    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (!place?.geometry?.location) return;
      setLocalError('');
      onChangeRef.current(
        asLocation({
          address: place.formatted_address || place.name || inputRef.current.value,
          name: place.name,
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
          placeId: place.place_id,
        })
      );
    });
    autocompleteRef.current = autocomplete;

    return () => {
      window.google.maps.event.clearInstanceListeners(autocomplete);
      autocompleteRef.current = null;
    };
  }, [mapsReady]);

  useEffect(() => {
    if (!mapsReady || !mapRef.current || !window.google?.maps || !hasPin) return undefined;

    const center = { lat: Number(value.lat), lng: Number(value.lng) };
    const applyLatLng = (lat, lng) => {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        onChangeRef.current(
          asLocation({
            address:
              status === 'OK' && results?.[0]?.formatted_address
                ? results[0].formatted_address
                : inputRef.current?.value,
            lat,
            lng,
            placeId: results?.[0]?.place_id,
          })
        );
      });
    };

    if (!mapInstanceRef.current) {
      const map = new window.google.maps.Map(mapRef.current, {
        center,
        zoom: 16,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });
      const marker = new window.google.maps.Marker({
        position: center,
        map,
        draggable: true,
      });
      map.addListener('click', (event) => {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        marker.setPosition({ lat, lng });
        applyLatLng(lat, lng);
      });
      marker.addListener('dragend', (event) => {
        applyLatLng(event.latLng.lat(), event.latLng.lng());
      });
      mapInstanceRef.current = map;
      markerRef.current = marker;
    } else {
      mapInstanceRef.current.setCenter(center);
      markerRef.current?.setPosition(center);
    }

    return undefined;
  }, [mapsReady, hasPin, value?.lat, value?.lng]);

  useEffect(() => {
    if (!hasPin) {
      mapInstanceRef.current = null;
      markerRef.current = null;
    }
  }, [hasPin]);

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocalError('This browser cannot read your location.');
      return;
    }
    setLocating(true);
    setLocalError('');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        if (window.google?.maps) {
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            setLocating(false);
            if (status === 'OK' && results?.[0]) {
              onChange(
                asLocation({
                  address: results[0].formatted_address,
                  lat,
                  lng,
                  placeId: results[0].place_id,
                })
              );
              return;
            }
            onChange(asLocation({ address: value?.address || 'Current location', lat, lng }));
          });
          return;
        }
        setLocating(false);
        onChange(asLocation({ address: value?.address || 'Current location', lat, lng }));
      },
      () => {
        setLocating(false);
        setLocalError('Allow location access, or search the venue.');
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };

  return (
    <div className="club-venue-picker">
      <div className="club-venue-picker__row">
        <span className="club-venue-picker__icon">
          <MapPin size={16} />
        </span>
        <input
          ref={inputRef}
          id="act-venue"
          type="text"
          className="form-input"
          placeholder="Search venue or use current location"
          value={value?.address || ''}
          onChange={(e) =>
            onChange({
              address: e.target.value,
              lat: value?.lat,
              lng: value?.lng,
              placeId: value?.placeId || '',
            })
          }
        />
        <button
          type="button"
          className="club-icon-btn"
          title="Use current location"
          aria-label="Use current location"
          onClick={useCurrentLocation}
          disabled={locating}
        >
          <Crosshair size={16} />
        </button>
      </div>
      {hasPin && mapsReady ? <div ref={mapRef} className="club-venue-picker__map" /> : null}
      {hasPin ? (
        <span className="club-list-page__meta">
          {Number(value.lat).toFixed(5)}, {Number(value.lng).toFixed(5)}
          {locating ? ' · Locating…' : ''}
        </span>
      ) : (
        <span className="club-list-page__meta">
          {locating ? 'Locating…' : 'Search a place or use current location to drop a pin.'}
        </span>
      )}
      {error || localError ? <span className="form-error">{error || localError}</span> : null}
    </div>
  );
};

export default ClubVenuePicker;
