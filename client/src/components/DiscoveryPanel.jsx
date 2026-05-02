import React, { useState } from 'react';
import { Search, Compass, Star, MapPin, Plus, Check, ShieldCheck } from 'lucide-react';
import axios from 'axios';
import { motion } from 'framer-motion';

const DiscoveryPanel = ({ onAddLocations }) => {
  const [query, setQuery] = useState("");
  const [radius, setRadius] = useState(5000);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [mandatoryIds, setMandatoryIds] = useState(new Set());

  const searchNearby = async () => {
    if (!query) return;
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`http://localhost:5000/api/nearby-places`, {
        params: { location: query, radius }
      });
      setResults(response.data.places);
    } catch (error) {
      console.error("Search failed", error);
      setError(error.response?.data?.error || "Search failed. Check your API key and billing.");
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (place) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(place.id)) {
      newSelected.delete(place.id);
      mandatoryIds.delete(place.id);
    } else {
      newSelected.add(place.id);
    }
    setSelectedIds(newSelected);
  };

  const toggleMandatory = (e, id) => {
    e.stopPropagation();
    const newMandatory = new Set(mandatoryIds);
    if (newMandatory.has(id)) {
      newMandatory.delete(id);
    } else {
      newMandatory.add(id);
    }
    setMandatoryIds(newMandatory);
  };

  const handleIntegrate = () => {
    const selectedPlaces = results
      .filter(r => selectedIds.has(r.id))
      .map(r => ({
        name: r.name,
        lat: r.lat,
        lng: r.lng,
        duration: 60, // Default duration
        mandatory: mandatoryIds.has(r.id),
        timeWindow: { open: 540, close: 1080 } // Default 9AM - 6PM
      }));
    
    onAddLocations(selectedPlaces);
    // Reset state
    setResults([]);
    setSelectedIds(new Set());
    setMandatoryIds(new Set());
    setQuery("");
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="space-y-4">
        <div className="relative">
          <input 
            type="text" 
            placeholder="Search area (e.g. London)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-slate-800/50 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:border-sky-500 outline-none transition-all"
          />
          <Search className="absolute left-3 top-3.5 text-slate-500" size={18} />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-[10px] uppercase font-bold text-slate-500">
            <span>Radius</span>
            <span className="text-sky-400">{radius/1000}km</span>
          </div>
          <input 
            type="range" 
            min="1000" 
            max="20000" 
            step="1000"
            value={radius}
            onChange={(e) => setRadius(parseInt(e.target.value))}
            className="w-full accent-sky-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <button 
          onClick={searchNearby}
          disabled={loading || !query}
          className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 py-3 rounded-xl border border-white/5 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <><Compass size={18} className="text-sky-400" /> Discover Nearby Places</>
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
            {error}
          </div>
        )}

        {results.length > 0 ? (
          results.map((place) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={place.id}
              onClick={() => toggleSelect(place)}
              className={`p-3 rounded-xl border transition-all cursor-pointer ${
                selectedIds.has(place.id) 
                  ? 'bg-sky-500/10 border-sky-500/50' 
                  : 'bg-slate-800/30 border-white/5 hover:border-white/20'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-slate-100">{place.name}</h4>
                  <div className="flex items-center gap-3 text-[10px] text-slate-400">
                    <span className="flex items-center gap-1 text-amber-400">
                      <Star size={10} fill="currentColor" /> {place.rating}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin size={10} /> {(place.distance/1000).toFixed(1)}km
                    </span>
                    <span className="bg-slate-800 px-1.5 py-0.5 rounded text-sky-400 font-mono">
                      Score: {place.score}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {selectedIds.has(place.id) && (
                    <button 
                      onClick={(e) => toggleMandatory(e, place.id)}
                      className={`p-1.5 rounded transition-colors ${mandatoryIds.has(place.id) ? 'text-sky-400 bg-sky-400/20' : 'text-slate-500 hover:text-slate-300'}`}
                      title="Mark as Mandatory"
                    >
                      <ShieldCheck size={16} />
                    </button>
                  )}
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                    selectedIds.has(place.id) ? 'bg-sky-500 border-sky-500' : 'border-slate-600'
                  }`}>
                    {selectedIds.has(place.id) && <Check size={12} className="text-white" />}
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        ) : !loading && (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
            <Compass size={40} className="opacity-10 mb-4" />
            <p className="text-xs">Search for a location to find top-rated tourist attractions nearby.</p>
          </div>
        )}
      </div>

      {selectedIds.size > 0 && (
        <button 
          onClick={handleIntegrate}
          className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-sky-900/20 flex items-center justify-center gap-2"
        >
          <Plus size={18} /> Add {selectedIds.size} Locations to Engine
        </button>
      )}
    </div>
  );
};

export default DiscoveryPanel;
