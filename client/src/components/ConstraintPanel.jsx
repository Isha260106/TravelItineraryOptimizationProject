import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE } from '../config';

function formatMinutesLabel(mins) {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

const ConstraintPanel = ({ locations, setLocations, constraints, setConstraints, startLocationName, setStartLocationName, notify = () => {} }) => {
  const [newLocName, setNewLocName] = useState('');
  const [startSuggestions, setStartSuggestions] = useState([]);
  const [destSuggestions, setDestSuggestions] = useState([]);
  const [showStartSuggestions, setShowStartSuggestions] = useState(false);
  const [showDestSuggestions, setShowDestSuggestions] = useState(false);

  useEffect(() => {
    const fetchAutocomplete = async () => {
      if (!startLocationName || startLocationName.length < 3) {
        setStartSuggestions([]);
        return;
      }
      try {
        const res = await axios.get(`${API_BASE}/autocomplete`, { params: { input: startLocationName } });
        setStartSuggestions(res.data.predictions || []);
      } catch (err) {
        console.error(err);
      }
    };
    const timer = setTimeout(fetchAutocomplete, 300);
    return () => clearTimeout(timer);
  }, [startLocationName]);

  useEffect(() => {
    const fetchAutocomplete = async () => {
      if (!newLocName || newLocName.length < 3) {
        setDestSuggestions([]);
        return;
      }
      try {
        const res = await axios.get(`${API_BASE}/autocomplete`, { params: { input: newLocName } });
        setDestSuggestions(res.data.predictions || []);
      } catch (err) {
        console.error(err);
      }
    };
    const timer = setTimeout(fetchAutocomplete, 300);
    return () => clearTimeout(timer);
  }, [newLocName]);

  const handleSetStartLocation = async () => {
    if (!startLocationName) return;
    try {
      const response = await axios.get(`${API_BASE}/nearby-places`, {
        params: { location: startLocationName, radius: 100 },
      });
      if (response.data.center) {
        notify('Starting location verified.', 'success');
      }
    } catch (error) {
      console.error('Verification failed', error);
      notify('Could not verify that starting location. Check spelling or try a more specific address.', 'error');
    }
  };

  const addLocation = async () => {
    if (!newLocName) return;
    try {
      const response = await axios.get(`${API_BASE}/nearby-places`, {
        params: { location: newLocName, radius: 5000 },
      });
      const results = response.data.places;
      if (results && results.length > 0) {
        const place = results[0];
        const newLocations = [
          {
            name: place.name,
            lat: place.lat,
            lng: place.lng,
            duration: 60,
            mandatory: false,
            timeWindow: { open: 9 * 60, close: 18 * 60 },
          },
        ];
        const existingNames = new Set(locations.map((l) => l.name));
        const filtered = newLocations.filter((nl) => !existingNames.has(nl.name));
        setLocations((prev) => [...prev, ...filtered]);
      } else {
        notify(`No tourist locations found near "${newLocName}".`, 'warning');
      }
    } catch (error) {
      console.error('Error fetching from Google Places API:', error);
      notify('Could not load places. Check that the API server is running and your Google key is set.', 'error');
    }
    setNewLocName('');
  };

  const updateLocation = (idx, field, value) => {
    const updated = [...locations];
    updated[idx] = { ...updated[idx], [field]: value };
    setLocations(updated);
  };

  const removeLocation = (idx) => {
    setLocations(locations.filter((_, i) => i !== idx));
  };

  return (
    <div className="flex-col h-full w-full">
      <div className="p-md" style={{ borderBottom: '1px solid var(--border-color)', flexShrink: 0 }}>
        <div className="flex-row justify-between align-center mb-md">
          <div>
            <h2 className="font-bold text-main" style={{ margin: 0 }}>Schedule & start</h2>
            <p className="text-sm text-muted">Trip length, first departure, and where the day begins.</p>
          </div>
          <span className="badge badge-primary">Step 1</span>
        </div>

        <div className="grid grid-cols-2 gap-md mb-md">
          <div className="input-group">
            <label className="input-label">Trip length</label>
            <div className="flex-row align-center gap-sm">
              <input
                type="number"
                min={1}
                max={30}
                value={constraints.maxDays}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  setConstraints({
                    ...constraints,
                    maxDays: Number.isFinite(v) ? Math.min(30, Math.max(1, v)) : 1,
                  });
                }}
                className="input-field"
                style={{ width: '80px', fontFamily: 'monospace' }}
              />
              <span className="text-sm text-muted">days</span>
            </div>
          </div>
          <div className="input-group">
            <label className="input-label">First departure</label>
            <div className="relative">
              <span className="icon absolute" style={{ right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                schedule
              </span>
              <input
                type="number"
                min={0}
                max={1439}
                value={constraints.startTime}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  setConstraints({
                    ...constraints,
                    startTime: Number.isFinite(v) ? Math.min(1439, Math.max(0, v)) : 540,
                  });
                }}
                className="input-field"
                style={{ paddingRight: '2.5rem', fontFamily: 'monospace' }}
              />
            </div>
            <p className="text-sm text-muted">Shown as: {formatMinutesLabel(constraints.startTime)}</p>
          </div>
        </div>

        <div className="input-group relative">
          <label className="input-label">Starting point</label>
          <div className="flex-row gap-xs">
            <div className="relative flex-1">
              <span className="icon absolute" style={{ left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                location_on
              </span>
              <input
                type="text"
                value={startLocationName}
                onChange={(e) => {
                  setStartLocationName(e.target.value);
                  setShowStartSuggestions(true);
                }}
                onFocus={() => setShowStartSuggestions(true)}
                onBlur={() => setTimeout(() => setShowStartSuggestions(false), 200)}
                placeholder={locations.length > 0 ? `Defaults to ${locations[0].name}` : 'Hotel, station, or address…'}
                className="input-field"
                style={{ paddingLeft: '2.5rem' }}
              />
              {showStartSuggestions && startSuggestions.length > 0 && (
                <div className="absolute" style={{ top: '100%', left: 0, right: 0, zIndex: 50, marginTop: '4px', background: 'var(--surface-color)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', maxHeight: '150px', overflowY: 'auto' }}>
                  {startSuggestions.map((s, i) => (
                    <button
                      type="button"
                      key={s.place_id || i}
                      style={{ width: '100%', padding: '10px', textAlign: 'left', background: 'none', border: 'none', color: 'var(--text-main)', borderBottom: '1px solid var(--border-color)', cursor: 'pointer' }}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setStartLocationName(s.description);
                        setShowStartSuggestions(false);
                      }}
                    >
                      {s.description}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={handleSetStartLocation}
              className="btn-secondary"
              title="Verify on map"
            >
              <span className="icon">check_circle</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex-col p-md min-h-0">
        <div className="flex-row justify-between align-center mb-md shrink-0">
          <div>
            <h2 className="font-bold text-main" style={{ margin: 0 }}>Destinations</h2>
            <p className="text-sm text-muted">Build your list — order is optimized automatically.</p>
          </div>
          <span className="badge badge-primary">{locations.length} stops</span>
        </div>

        <div className="input-group mb-md shrink-0">
          <label className="input-label">Add a place</label>
          <div className="flex-row gap-xs relative">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search or paste a place name…"
                value={newLocName}
                onChange={(e) => {
                  setNewLocName(e.target.value);
                  setShowDestSuggestions(true);
                }}
                onFocus={() => setShowDestSuggestions(true)}
                onBlur={() => setTimeout(() => setShowDestSuggestions(false), 200)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addLocation();
                  }
                }}
                className="input-field"
              />
              {showDestSuggestions && destSuggestions.length > 0 && (
                <div className="absolute" style={{ top: '100%', left: 0, right: 0, zIndex: 50, marginTop: '4px', background: 'var(--surface-color)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', maxHeight: '150px', overflowY: 'auto' }}>
                  {destSuggestions.map((s, i) => (
                    <button
                      type="button"
                      key={s.place_id || i}
                      style={{ width: '100%', padding: '10px', textAlign: 'left', background: 'none', border: 'none', color: 'var(--text-main)', borderBottom: '1px solid var(--border-color)', cursor: 'pointer' }}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setNewLocName(s.description);
                        setShowDestSuggestions(false);
                      }}
                    >
                      {s.description}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={addLocation}
              className="btn btn-primary"
              style={{ width: 'auto' }}
              title="Add destination"
            >
              <span className="icon">add</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {locations.map((loc, idx) => (
            <div
              key={idx}
              className="list-item"
              style={{ borderColor: loc.mandatory ? 'var(--primary-color)' : 'var(--border-color)' }}
            >
              <div className="list-item-header">
                <div className="min-w-0 flex-1">
                  <h3 className="list-item-title" title={loc.name}>
                    {loc.name}
                  </h3>
                  <div className="mt-sm">
                    <span className={`badge ${loc.mandatory ? 'badge-primary' : ''}`}>
                      {loc.mandatory ? 'Must visit' : 'Optional'}
                    </span>
                  </div>
                </div>
                <div className="flex-row gap-xs">
                  <button
                    type="button"
                    onClick={() => updateLocation(idx, 'mandatory', !loc.mandatory)}
                    className="btn-icon"
                    style={{ color: loc.mandatory ? 'var(--primary-color)' : 'var(--text-muted)' }}
                    title={loc.mandatory ? 'Mark optional' : 'Mark must-visit'}
                  >
                    <span className="icon">{loc.mandatory ? 'verified_user' : 'star_outline'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => removeLocation(idx)}
                    className="btn-icon"
                    title="Remove"
                  >
                    <span className="icon">delete</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-md mt-sm">
                <div className="flex-col gap-xs">
                  <p className="text-sm text-muted">Visit (mins)</p>
                  <input
                    type="number"
                    value={loc.duration}
                    onChange={(e) => updateLocation(idx, 'duration', parseInt(e.target.value, 10))}
                    className="input-field text-sm"
                    style={{ padding: '0.4rem' }}
                  />
                </div>
                <div className="flex-col gap-xs">
                  <p className="text-sm text-muted">Close (min)</p>
                  <input
                    type="number"
                    value={loc.timeWindow.close}
                    onChange={(e) =>
                      updateLocation(idx, 'timeWindow', { ...loc.timeWindow, close: parseInt(e.target.value, 10) })
                    }
                    className="input-field text-sm"
                    style={{ padding: '0.4rem' }}
                  />
                </div>
              </div>
            </div>
          ))}

          {locations.length === 0 && (
            <div className="empty-state">
              <span className="icon">pin_drop</span>
              <p className="font-bold text-main">No stops yet</p>
              <p className="mt-sm text-sm" style={{ maxWidth: '250px' }}>Search above or use Explore to drop pins on the map.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConstraintPanel;
