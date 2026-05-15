import { lazy, Suspense, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import ItineraryTimeline from './components/ItineraryTimeline';
import ConstraintPanel from './components/ConstraintPanel';
import DiscoveryPanel from './components/DiscoveryPanel';
import AppSidebar from './components/layout/AppSidebar';
import AppHeader from './components/layout/AppHeader';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE } from './config';
import ToastBanner from './ui/ToastBanner';
import Spinner from './ui/Spinner';
import Button from './ui/Button';

const MapComponent = lazy(() => import('./components/MapComponent'));

function App() {
  const [locations, setLocations] = useState([]);

  const [constraints, setConstraints] = useState({
    maxDays: 2,
    startTime: 540,
  });

  const [itinerary, setItinerary] = useState(null);
  const [activeTab, setActiveTab] = useState('constraints');
  const [loading, setLoading] = useState(false);
  const [discoveryResults, setDiscoveryResults] = useState([]);
  const [startLocationName, setStartLocationName] = useState('');
  const [toast, setToast] = useState(null);
  const [apiOnline, setApiOnline] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const notify = useCallback((message, variant = 'info') => {
    setToast({ message, variant, id: Date.now() });
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 5200);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!mobileMenuOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileMenuOpen]);

  useEffect(() => {
    let cancelled = false;
    const ping = async () => {
      try {
        await axios.get(`${API_BASE}/health`, { timeout: 4000 });
        if (!cancelled) setApiOnline(true);
      } catch {
        if (!cancelled) setApiOnline(false);
      }
    };
    ping();
    const id = setInterval(ping, 30000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const handleOptimize = useCallback(
    async (isManual = false) => {
      if (locations.length === 0) {
        if (isManual) {
          notify('Add at least one destination before running optimization.', 'warning');
        }
        return;
      }

      setLoading(true);
      try {
        let sourceLat = locations.length > 0 ? locations[0].lat : 40.7549;
        let sourceLng = locations.length > 0 ? locations[0].lng : -73.984;

        if (startLocationName && startLocationName.toLowerCase() !== 'hotel (start)') {
          try {
            const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
            if (apiKey) {
              const geoRes = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
                params: { address: startLocationName, key: apiKey },
              });
              if (geoRes.data.status === 'OK' && geoRes.data.results.length > 0) {
                sourceLat = geoRes.data.results[0].geometry.location.lat;
                sourceLng = geoRes.data.results[0].geometry.location.lng;
              }
            }
          } catch (e) {
            console.error('Geocoding failed for start location', e);
          }
        }

        const response = await axios.post(`${API_BASE}/optimize`, {
          source: {
            name: startLocationName || (locations.length > 0 ? locations[0].name : 'Start Location'),
            lat: sourceLat,
            lng: sourceLng,
          },
          destinations: locations,
          constraints,
        });
        setItinerary(response.data);
        if (isManual === true) {
          setActiveTab('itinerary');
          notify('Itinerary updated.', 'success');
        }
      } catch (error) {
        console.error('Optimization failed', error);
        if (isManual) {
          notify('Could not reach the optimizer. Start the API server (npm start in server/) and try again.', 'error');
        }
      } finally {
        setLoading(false);
      }
    },
    [locations, constraints, startLocationName, notify]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      if (locations.length > 0) {
        handleOptimize(false);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [locations, constraints, startLocationName, handleOptimize]);

  const handleAddLocations = (newLocations) => {
    let shouldWarnCapacity = false;
    setLocations((prevLocations) => {
      const existingNames = new Set(prevLocations.map((l) => l.name));
      const filtered = newLocations.filter((nl) => !existingNames.has(nl.name));
      if (prevLocations.length + filtered.length > 8) {
        shouldWarnCapacity = true;
      }
      return [...prevLocations, ...filtered];
    });
    if (shouldWarnCapacity) {
      notify('You have many stops; consider fewer destinations or more days for a realistic plan.', 'warning');
    }
  };

  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);

  return (
    <div className="app-container">
      <a href="#main-content" className="skip-link" style={{ position: 'absolute', top: '-1000px' }}>
        Skip to content
      </a>

      <AppSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        locations={locations}
        onOptimize={() => handleOptimize(true)}
        loading={loading}
        mobileMenuOpen={mobileMenuOpen}
        onNavigate={closeMobileMenu}
      />

      {mobileMenuOpen && (
        <button
          type="button"
          className="overlay mobile-menu-btn"
          aria-label="Close navigation menu"
          onClick={closeMobileMenu}
        />
      )}

      <div className="flex-1 flex-col h-full relative" style={{ minWidth: 0 }}>
        <AppHeader
          activeTab={activeTab}
          apiOnline={apiOnline}
          menuOpen={mobileMenuOpen}
          onMenuClick={() => setMobileMenuOpen((o) => !o)}
        />

        <main id="main-content" tabIndex={-1} className="main-content">
          <section className="glass-panel panel-container" data-full={activeTab === 'itinerary'}>
            <AnimatePresence mode="wait">
              {activeTab === 'constraints' && (
                <motion.div
                  key="constraints"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                  className="flex-col h-full"
                >
                  <ConstraintPanel
                    locations={locations}
                    setLocations={setLocations}
                    constraints={constraints}
                    setConstraints={setConstraints}
                    startLocationName={startLocationName}
                    setStartLocationName={setStartLocationName}
                    notify={notify}
                  />
                </motion.div>
              )}

              {activeTab === 'discovery' && (
                <motion.div
                  key="discovery"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                  className="flex-col h-full"
                >
                  <DiscoveryPanel onAddLocations={handleAddLocations} onSearchResults={setDiscoveryResults} />
                </motion.div>
              )}

              {activeTab === 'itinerary' && (
                <motion.div
                  key="itinerary"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                  className="flex-col h-full p-md"
                >
                  {itinerary ? (
                    <ItineraryTimeline itinerary={itinerary} />
                  ) : (
                    <div className="empty-state">
                      <span className="icon" aria-hidden>route</span>
                      <h3 style={{ marginBottom: '8px', color: 'var(--text-main)' }}>No plan yet</h3>
                      <p style={{ maxWidth: '300px' }}>
                        Add destinations, then use <strong>Optimize route</strong> in the sidebar to build your timeline.
                      </p>
                      <div className="flex-row justify-center gap-sm mt-md">
                        <Button variant="secondary" size="md" onClick={() => setActiveTab('constraints')}>
                          Trip setup
                        </Button>
                        <Button variant="primary" size="md" onClick={() => setActiveTab('discovery')}>
                          Explore places
                        </Button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {activeTab !== 'itinerary' && (
            <section className="map-container">
              <Suspense
                fallback={
                  <div className="h-full flex-col align-center justify-center" style={{ backgroundColor: 'var(--bg-color)' }}>
                    <Spinner label="Loading map" />
                  </div>
                }
              >
                <MapComponent
                  locations={locations}
                  itinerary={itinerary}
                  discoveryResults={discoveryResults}
                  onAddFromMap={(place) => {
                    handleAddLocations([
                      {
                        name: place.name,
                        lat: place.lat,
                        lng: place.lng,
                        duration: 60,
                        mandatory: false,
                        timeWindow: { open: 540, close: 1080 },
                      },
                    ]);
                  }}
                />
              </Suspense>

              {loading && (
                <div className="overlay">
                  <div className="glass-panel p-md flex-col align-center gap-sm" style={{ width: '300px', textAlign: 'center' }}>
                    <Spinner label="Optimizing route" />
                    <p style={{ fontWeight: 600 }}>Optimizing your route…</p>
                    <p className="text-sm text-muted">
                      Live distances apply when your Google Maps keys are configured.
                    </p>
                  </div>
                </div>
              )}
            </section>
          )}
        </main>
      </div>

      <AnimatePresence>
        {toast && <ToastBanner toast={toast} onDismiss={() => setToast(null)} />}
      </AnimatePresence>
    </div>
  );
}

export default App;
