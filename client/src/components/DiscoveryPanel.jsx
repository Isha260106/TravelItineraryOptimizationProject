import { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { API_BASE } from '../config';

const DiscoveryPanel = ({ onAddLocations, onSearchResults }) => {
  const [query, setQuery] = useState('');
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
      const response = await axios.get(`${API_BASE}/nearby-places`, {
        params: { location: query, radius },
      });
      setResults(response.data.places);
      if (onSearchResults) onSearchResults(response.data.places);
    } catch (err) {
      console.error('Search failed', err);
      setError(err.response?.data?.error || 'Search failed. Check your API key and billing.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (place) => {
    const next = new Set(selectedIds);
    if (next.has(place.id)) next.delete(place.id);
    else next.add(place.id);
    setSelectedIds(next);
  };

  const handleIntegrate = () => {
    const selectedPlaces = results
      .filter((r) => selectedIds.has(r.id))
      .map((r) => ({
        name: r.name,
        lat: r.lat,
        lng: r.lng,
        duration: 60,
        mandatory: false,
        timeWindow: { open: 9 * 60, close: 18 * 60 },
      }));

    onAddLocations(selectedPlaces);
    setResults([]);
    if (onSearchResults) onSearchResults([]);
    setSelectedIds(new Set());
    setQuery('');
  };

  return (
    <div className="flex-col h-full w-full">
      <div className="p-md shrink-0" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <div className="flex-row justify-between align-center mb-md">
          <div>
            <h2 className="font-bold text-main" style={{ margin: 0 }}>Explore an area</h2>
            <p className="text-sm text-muted">Search a city or neighborhood, then scan for nearby sights.</p>
          </div>
          <span className="badge badge-primary">Step 2</span>
        </div>

        <div className="flex-col gap-sm">
          <div className="relative">
            <span className="icon absolute" style={{ left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
              search
            </span>
            <input
              type="text"
              placeholder="e.g. Shibuya, Tokyo"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && query && !loading) {
                  e.preventDefault();
                  searchNearby();
                }
              }}
              className="input-field"
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>

          <div className="input-group">
            <div className="flex-row justify-between text-sm text-muted font-bold">
              <span>Search radius</span>
              <span style={{ color: 'var(--primary-color)' }}>{(radius / 1000).toFixed(0)} km</span>
            </div>
            <input
              type="range"
              min="1000"
              max="20000"
              step="1000"
              value={radius}
              onChange={(e) => setRadius(parseInt(e.target.value, 10))}
              style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--primary-color)' }}
            />
          </div>

          <button
            type="button"
            onClick={searchNearby}
            disabled={loading || !query}
            className="btn btn-secondary w-full flex-row align-center justify-center gap-xs mt-sm"
          >
            {loading ? (
              <span className="icon spinner">autorenew</span>
            ) : (
              <>
                <span className="icon">travel_explore</span>
                Scan area
              </>
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 flex-col p-md min-h-0">
        <div className="flex-row justify-between align-center mb-sm shrink-0">
          <h3 className="font-bold text-main">Results</h3>
          <span className="text-sm text-muted">{results.length} places</span>
        </div>

        <div className="flex-1 overflow-auto flex-col gap-sm">
          {error && (
            <div className="p-sm" style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(239, 68, 68, 0.4)' }}>
              {error}
            </div>
          )}

          {results.length > 0 ? (
            results.map((place) => {
              const isSelected = selectedIds.has(place.id);
              return (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={place.id}
                  onClick={() => toggleSelect(place)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleSelect(place);
                    }
                  }}
                  className="list-item"
                  style={{
                    borderColor: isSelected ? 'var(--primary-color)' : 'var(--border-color)',
                    backgroundColor: isSelected ? 'rgba(0, 210, 255, 0.1)' : 'var(--surface-hover)',
                    cursor: 'pointer'
                  }}
                >
                  <div className="flex-row justify-between align-center w-full">
                    <div className="min-w-0 flex-1">
                      <h4 className="list-item-title">{place.name}</h4>
                      <div className="flex-row align-center gap-sm mt-xs text-sm text-muted">
                        <span className="flex-row align-center gap-xs" style={{ color: '#fbbf24' }}>
                          <span className="icon" style={{ fontSize: '16px' }}>star</span>
                          {place.rating}
                        </span>
                        <span className="flex-row align-center gap-xs">
                          <span className="icon" style={{ fontSize: '16px' }}>near_me</span>
                          {(place.distance / 1000).toFixed(1)} km
                        </span>
                      </div>
                    </div>
                    <div className="flex-row align-center gap-xs shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddLocations([
                            {
                              name: place.name,
                              lat: place.lat,
                              lng: place.lng,
                              duration: 60,
                              mandatory: false,
                              timeWindow: { open: 9 * 60, close: 18 * 60 },
                            },
                          ]);
                        }}
                        className="btn-icon"
                        title="Add to trip"
                      >
                        <span className="icon">add</span>
                      </button>
                      <span className="icon" style={{ color: isSelected ? 'var(--primary-color)' : 'var(--text-muted)' }}>
                        {isSelected ? 'check_circle' : 'radio_button_unchecked'}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })
          ) : (
            !loading && (
              <div className="empty-state">
                <span className="icon">radar</span>
                <p className="font-bold text-main">Nothing scanned yet</p>
                <p className="mt-sm text-sm" style={{ maxWidth: '250px' }}>Enter an area and tap Scan — or press Enter in the search field.</p>
              </div>
            )
          )}
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="p-md shrink-0" style={{ borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--surface-color)' }}>
          <button
            type="button"
            onClick={handleIntegrate}
            className="btn btn-primary w-full flex-row align-center justify-center gap-xs"
          >
            <span className="icon">add_task</span>
            Add {selectedIds.size} to trip
          </button>
        </div>
      )}
    </div>
  );
};

export default DiscoveryPanel;
