import { useState } from 'react';
import { Search, Compass, Star, MapPin, Plus, Check, ShieldCheck } from 'lucide-react';
import axios from 'axios';
import { motion } from 'framer-motion';

const DiscoveryPanel = ({ onAddLocations, onSearchResults }) => {
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
      if (onSearchResults) onSearchResults(response.data.places);
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
    if (onSearchResults) onSearchResults([]);
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
            className="w-full bg-[var(--bg-dark)] border border-[var(--panel-border)] rounded-xl pl-10 pr-4 py-3 text-sm focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(0,240,255,0.3)] outline-none transition-all"
          />
          <Search className="absolute left-3 top-3.5 text-[var(--text-muted)]" size={18} />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-widest">
            <span>Radius</span>
            <span className="neon-text-cyan">{radius/1000}km</span>
          </div>
          <input 
            type="range" 
            min="1000" 
            max="20000" 
            step="1000"
            value={radius}
            onChange={(e) => setRadius(parseInt(e.target.value))}
            className="w-full accent-cyan-400 h-1 bg-[var(--panel-border)] rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <button 
          onClick={searchNearby}
          disabled={loading || !query}
          className="w-full bg-[var(--bg-dark)] hover:bg-[#0a0f1e] text-[var(--text-main)] py-3 rounded-xl border border-[var(--panel-border)] hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(0,240,255,0.2)] flex items-center justify-center gap-2 transition-all disabled:opacity-50"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin shadow-[0_0_10px_#00f0ff]" />
          ) : (
            <><Compass size={18} className="text-cyan-400 drop-shadow-[0_0_5px_#00f0ff]" /> Discover Nearby Places</>
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
              className={`p-3 rounded-xl border transition-all cursor-pointer glass-panel-hover ${
                selectedIds.has(place.id) 
                  ? 'bg-cyan-400/10 border-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.3)]' 
                  : 'glass-panel hover:border-cyan-400/50'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-100">{place.name}</h4>
                  <div className="flex items-center gap-3 text-[10px] text-[var(--text-muted)]">
                    <span className="flex items-center gap-1 text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.6)]">
                      <Star size={10} fill="currentColor" /> {place.rating}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin size={10} /> {(place.distance/1000).toFixed(1)}km
                    </span>
                    <span className="bg-[var(--bg-dark)] border border-cyan-400/30 px-1.5 py-0.5 rounded neon-text-cyan font-mono text-[8px] uppercase">
                      Score: {place.score}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {selectedIds.has(place.id) && (
                    <button 
                      onClick={(e) => toggleMandatory(e, place.id)}
                      className={`p-1.5 rounded transition-all ${mandatoryIds.has(place.id) ? 'neon-text-cyan bg-cyan-400/20 shadow-[0_0_8px_rgba(0,240,255,0.4)]' : 'text-[var(--text-muted)] hover:text-cyan-400'}`}
                      title="Mark as Mandatory"
                    >
                      <ShieldCheck size={16} />
                    </button>
                  )}
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                    selectedIds.has(place.id) ? 'bg-cyan-400 border-cyan-400 shadow-[0_0_10px_rgba(0,240,255,0.5)]' : 'border-[var(--text-muted)]'
                  }`}>
                    {selectedIds.has(place.id) && <Check size={12} className="text-[#050511] font-bold" />}
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
          className="w-full bg-gradient-to-r from-cyan-500 to-fuchsia-600 hover:from-cyan-400 hover:to-fuchsia-500 text-white font-bold py-3 rounded-xl shadow-[0_0_20px_rgba(255,0,85,0.4)] hover:shadow-[0_0_30px_rgba(0,240,255,0.6)] flex items-center justify-center gap-2 transition-all transform hover:-translate-y-1"
        >
          <Plus size={18} /> Add {selectedIds.size} Locations to Engine
        </button>
      )}
    </div>
  );
};

export default DiscoveryPanel;
