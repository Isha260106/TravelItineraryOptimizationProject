import { useState, useEffect } from 'react';
import axios from 'axios';

const ConstraintPanel = ({ onOptimize, locations, setLocations, constraints, setConstraints, startLocationName, setStartLocationName }) => {
  const [newLocName, setNewLocName] = useState("");
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
        const res = await axios.get(`http://localhost:5000/api/autocomplete`, { params: { input: startLocationName } });
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
        const res = await axios.get(`http://localhost:5000/api/autocomplete`, { params: { input: newLocName } });
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
      const response = await axios.get(`http://localhost:5000/api/nearby-places`, {
        params: { location: startLocationName, radius: 100 }
      });
      if (response.data.center) {
        alert("Starting location verified!");
      }
    } catch (error) {
      console.error("Verification failed", error);
      alert("Could not verify starting location.");
    }
  };

  const addLocation = async () => {
    if (!newLocName) return;
    try {
      const response = await axios.get(`http://localhost:5000/api/nearby-places`, {
        params: { location: newLocName, radius: 5000 }
      });
      const results = response.data.places;
      if (results && results.length > 0) {
        const place = results[0];
        const newLocations = [{
          name: place.name,
          lat: place.lat,
          lng: place.lng,
          duration: 60,
          mandatory: false,
          timeWindow: { open: 9 * 60, close: 18 * 60 }
        }];
        const existingNames = new Set(locations.map(l => l.name));
        const filtered = newLocations.filter(nl => !existingNames.has(nl.name));
        setLocations(prev => [...prev, ...filtered]);
      } else {
        alert(`No tourist locations found near "${newLocName}".`);
      }
    } catch (error) {
      console.error("Error fetching from Google Places API:", error);
      alert("Failed to fetch locations from Google API.");
    }
    setNewLocName("");
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
    <div className="flex flex-col h-full w-full">
      {/* Section 1: General Settings */}
      <div className="p-6 border-b border-outline-variant shrink-0">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-mono text-[11px] font-bold tracking-[0.15em] uppercase text-primary tracking-widest flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">tune</span>
            GENERAL SETTINGS
          </h2>
          <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-mono">CONFIG-01</span>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="space-y-1">
            <label className="font-mono text-[11px] font-bold tracking-[0.15em] uppercase text-on-surface-variant">TOTAL DAYS</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={constraints.maxDays}
                onChange={e => setConstraints({ ...constraints, maxDays: parseInt(e.target.value) })}
                className="w-full bg-background border border-outline-variant px-3 py-2 text-sm font-medium tracking-tight font-mono rounded focus:border-primary outline-none transition-all text-on-surface"
              />
              <span className="text-on-surface-variant font-mono text-[10px]">DAYS</span>
            </div>
          </div>
          <div className="space-y-1">
            <label className="font-mono text-[11px] font-bold tracking-[0.15em] uppercase text-on-surface-variant">START TIME (MIN)</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute right-3 top-2 text-[18px] text-outline">schedule</span>
              <input
                type="number"
                value={constraints.startTime}
                onChange={e => setConstraints({ ...constraints, startTime: parseInt(e.target.value) })}
                className="w-full bg-background border border-outline-variant px-3 py-2 pr-10 text-sm font-medium tracking-tight font-mono rounded focus:border-primary outline-none transition-all text-on-surface"
              />
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <label className="font-mono text-[11px] font-bold tracking-[0.15em] uppercase text-on-surface-variant">STARTING LOCATION</label>
          <div className="relative flex gap-2">
            <span className="material-symbols-outlined absolute left-3 top-2 text-[18px] text-outline z-10">location_on</span>
            <input
              type="text"
              value={startLocationName}
              onChange={e => { setStartLocationName(e.target.value); setShowStartSuggestions(true); }}
              onFocus={() => setShowStartSuggestions(true)}
              onBlur={() => setTimeout(() => setShowStartSuggestions(false), 200)}
              placeholder={locations.length > 0 ? `Defaults to: ${locations[0].name}` : "Search operational hub..."}
              className="w-full bg-background border border-outline-variant pl-10 pr-4 py-2 text-sm font-medium tracking-tight font-mono rounded focus:border-primary outline-none transition-all text-on-surface"
            />
            {showStartSuggestions && startSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-12 z-50 bg-surface-container-high border border-outline-variant rounded mt-1 max-h-40 overflow-y-auto shadow-lg custom-scrollbar">
                {startSuggestions.map((s, i) => (
                  <div 
                    key={i} 
                    className="px-3 py-2 text-xs font-mono cursor-pointer hover:bg-surface-container-highest hover:text-primary transition-all border-b border-outline-variant last:border-0 truncate"
                    onClick={() => {
                      setStartLocationName(s.description);
                      setShowStartSuggestions(false);
                    }}
                  >
                    {s.description}
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={handleSetStartLocation}
              className="px-3 py-2 bg-surface-container-high border border-outline-variant rounded hover:border-primary hover:text-primary transition-all flex items-center justify-center shrink-0"
              title="Verify Start Location"
            >
              <span className="material-symbols-outlined text-[20px]">check_circle</span>
            </button>
          </div>
        </div>
      </div>

      {/* Section 2: Destinations */}
      <div className="p-6 flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-6 shrink-0">
          <h2 className="font-mono text-[11px] font-bold tracking-[0.15em] uppercase text-primary tracking-widest flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">add_location</span>
            DESTINATIONS LOG
          </h2>
          <span className="text-[10px] text-on-surface-variant font-mono">{locations.length} TARGETS</span>
        </div>

        <div className="space-y-1 mb-4 shrink-0">
          <div className="relative flex gap-2">
            <input
              type="text"
              placeholder="Add POI Coordinate..."
              value={newLocName}
              onChange={e => { setNewLocName(e.target.value); setShowDestSuggestions(true); }}
              onFocus={() => setShowDestSuggestions(true)}
              onBlur={() => setTimeout(() => setShowDestSuggestions(false), 200)}
              className="w-full bg-background border border-outline-variant px-3 py-2 text-sm font-medium tracking-tight font-mono rounded focus:border-primary outline-none transition-all text-on-surface"
            />
            {showDestSuggestions && destSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-12 z-50 bg-surface-container-high border border-outline-variant rounded mt-1 max-h-40 overflow-y-auto shadow-lg custom-scrollbar">
                {destSuggestions.map((s, i) => (
                  <div 
                    key={i} 
                    className="px-3 py-2 text-xs font-mono cursor-pointer hover:bg-surface-container-highest hover:text-primary transition-all border-b border-outline-variant last:border-0 truncate"
                    onClick={() => {
                      setNewLocName(s.description);
                      setShowDestSuggestions(false);
                    }}
                  >
                    {s.description}
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={addLocation}
              className="px-3 py-2 bg-primary text-on-primary font-bold rounded hover:opacity-90 active:scale-95 transition-all flex items-center justify-center shrink-0"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-1">
          {locations.map((loc, idx) => (
            <div key={idx} className={`p-3 bg-surface-container-high border ${loc.mandatory ? 'border-primary shadow-[0_0_10px_rgba(186,242,255,0.1)]' : 'border-outline-variant'} rounded-lg transition-all group`}>
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1 overflow-hidden pr-2">
                  <h3 className="font-sans text-base font-normal font-bold text-on-surface truncate" title={loc.name}>{loc.name}</h3>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${loc.mandatory ? 'bg-primary' : 'bg-secondary'}`}></span>
                    <span className={`font-mono text-[10px] ${loc.mandatory ? 'text-primary' : 'text-secondary'}`}>
                      {loc.mandatory ? 'MANDATORY TARGET' : 'OPTIONAL WAYPOINT'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => updateLocation(idx, 'mandatory', !loc.mandatory)}
                    className={`material-symbols-outlined transition-colors text-[20px] ${loc.mandatory ? 'text-primary' : 'text-outline hover:text-primary'}`}
                    title="Toggle Mandatory"
                  >
                    {loc.mandatory ? 'verified_user' : 'gpp_bad'}
                  </button>
                  <button
                    onClick={() => removeLocation(idx)}
                    className="material-symbols-outlined text-outline hover:text-error transition-colors text-[20px]"
                  >
                    delete
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <p className="font-mono text-[9px] text-on-surface-variant uppercase">Visit Duration (m)</p>
                  <input
                    type="number"
                    value={loc.duration}
                    onChange={e => updateLocation(idx, 'duration', parseInt(e.target.value))}
                    className="w-full bg-background border border-outline-variant px-2 py-1 text-sm font-medium tracking-tight font-mono text-[12px] rounded focus:border-primary outline-none transition-all text-on-surface"
                  />
                </div>
                <div className="space-y-1">
                  <p className="font-mono text-[9px] text-on-surface-variant uppercase">Closing (m)</p>
                  <input
                    type="number"
                    value={loc.timeWindow.close}
                    onChange={e => updateLocation(idx, 'timeWindow', { ...loc.timeWindow, close: parseInt(e.target.value) })}
                    className="w-full bg-background border border-outline-variant px-2 py-1 text-sm font-medium tracking-tight font-mono text-[12px] rounded focus:border-error outline-none transition-all text-error"
                  />
                </div>
              </div>
            </div>
          ))}
          {locations.length === 0 && (
            <div className="h-32 flex flex-col items-center justify-center text-outline text-center border-2 border-dashed border-outline-variant rounded-lg mt-4">
              <span className="material-symbols-outlined mb-2 text-3xl opacity-50">pin_drop</span>
              <p className="font-mono text-[10px]">NO TARGETS LOGGED</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConstraintPanel;
