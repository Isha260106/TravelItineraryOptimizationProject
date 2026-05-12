import { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

const DiscoveryPanel = ({ onAddLocations, onSearchResults }) => {
  const [query, setQuery] = useState("");
  const [radius, setRadius] = useState(5000);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());

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
    } else {
      newSelected.add(place.id);
    }
    setSelectedIds(newSelected);
  };

  const handleIntegrate = () => {
    const selectedPlaces = results
      .filter(r => selectedIds.has(r.id))
      .map(r => ({
        name: r.name,
        lat: r.lat,
        lng: r.lng,
        duration: 60, // Default duration
        mandatory: false,
        timeWindow: { open: 9 * 60, close: 18 * 60 } // Default 9AM - 6PM
      }));
    
    onAddLocations(selectedPlaces);
    setResults([]);
    if (onSearchResults) onSearchResults([]);
    setSelectedIds(new Set());
    setQuery("");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Scan Config Section */}
      <div className="p-6 border-b border-outline-variant shrink-0">
        <h2 className="font-mono text-[11px] font-bold tracking-[0.15em] uppercase text-primary tracking-widest flex items-center gap-2 mb-6">
          <span className="material-symbols-outlined text-[18px]">cell_tower</span>
          RADAR CONFIGURATION
        </h2>
        
        <div className="space-y-3">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-outline">search</span>
            <input 
              type="text" 
              placeholder="Search area (e.g. London)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-background border border-outline-variant pl-10 pr-4 py-2 text-sm font-medium tracking-tight font-mono rounded focus:border-primary outline-none transition-all text-on-surface"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between font-mono text-[10px] text-on-surface-variant uppercase">
              <span>SCAN RADIUS</span>
              <span className="text-secondary">{radius/1000} KM</span>
            </div>
            <input 
              type="range" 
              min="1000" 
              max="20000" 
              step="1000"
              value={radius}
              onChange={(e) => setRadius(parseInt(e.target.value))}
              className="w-full h-1 bg-outline-variant rounded-lg appearance-none cursor-pointer accent-secondary"
            />
          </div>

          <button 
            onClick={searchNearby}
            disabled={loading || !query}
            className="w-full py-2 border border-outline-variant text-on-surface-variant font-mono text-[11px] font-bold tracking-[0.15em] uppercase hover:bg-surface-container-highest hover:text-primary hover:border-primary flex items-center justify-center gap-2 transition-all disabled:opacity-50 rounded"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <><span className="material-symbols-outlined text-[18px]">radar</span> INITIATE SCAN</>
            )}
          </button>
        </div>
      </div>

      {/* Results Section */}
      <div className="p-6 flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-6 shrink-0">
          <h2 className="font-mono text-[11px] font-bold tracking-[0.15em] uppercase text-primary tracking-widest flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">my_location</span>
            DISCOVERY RESULTS
          </h2>
          <span className="text-[10px] text-on-surface-variant font-mono">{results.length} NODES</span>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-1">
          {error && (
            <div className="p-3 bg-error/10 border border-error/20 rounded-lg text-error text-[10px] font-mono">
              ERR: {error}
            </div>
          )}

          {results.length > 0 ? (
            results.map((place) => {
              const isSelected = selectedIds.has(place.id);
              return (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={place.id}
                  onClick={() => toggleSelect(place)}
                  className={`p-3 bg-surface-container-high border rounded-lg transition-all cursor-pointer group ${
                    isSelected 
                      ? 'border-primary shadow-[0_0_15px_rgba(186,242,255,0.15)] bg-primary/5' 
                      : 'border-outline-variant hover:border-primary/50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="pr-4">
                      <h3 className="font-sans text-base font-normal font-bold text-on-surface leading-tight mb-1">{place.name}</h3>
                      <div className="flex items-center gap-3 text-[10px] text-on-surface-variant font-mono">
                        <span className="flex items-center gap-1 text-tertiary-container">
                          <span className="material-symbols-outlined text-[12px]">star</span> {place.rating}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]">distance</span> {(place.distance/1000).toFixed(1)}km
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0 flex gap-2 items-center">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddLocations([{
                            name: place.name,
                            lat: place.lat,
                            lng: place.lng,
                            duration: 60,
                            mandatory: false,
                            timeWindow: { open: 9 * 60, close: 18 * 60 }
                          }]);
                        }}
                        className="w-8 h-8 rounded bg-background border border-outline-variant flex items-center justify-center text-on-surface-variant hover:text-primary hover:border-primary transition-all shadow-sm group-hover:shadow-[0_0_10px_rgba(186,242,255,0.2)]"
                        title="Add directly to Itinerary"
                      >
                        <span className="material-symbols-outlined text-[18px]">add</span>
                      </button>
                      {isSelected ? (
                        <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                      ) : (
                        <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors text-[20px]">radio_button_unchecked</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          ) : !loading && (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-outline border-2 border-dashed border-outline-variant rounded-lg">
              <span className="material-symbols-outlined text-[40px] opacity-30 mb-4">radar</span>
              <p className="font-mono text-[10px] uppercase">AWAITING SCAN COMMAND.<br/>ENTER COORDINATES TO BEGIN.</p>
            </div>
          )}
        </div>
      </div>

      {/* Integration Action */}
      {selectedIds.size > 0 && (
        <div className="p-6 border-t border-outline-variant bg-surface-container-lowest shrink-0">
          <button 
            onClick={handleIntegrate}
            className="w-full py-3 bg-primary text-on-primary font-bold text-[11px] font-bold tracking-[0.15em] uppercase rounded flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-[0_0_15px_rgba(186,242,255,0.3)] active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-[18px]">add_task</span> 
            INTEGRATE {selectedIds.size} NODES
          </button>
        </div>
      )}
    </div>
  );
};

export default DiscoveryPanel;
