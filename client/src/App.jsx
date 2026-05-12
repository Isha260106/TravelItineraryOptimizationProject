import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MapComponent from './components/MapComponent';
import ItineraryTimeline from './components/ItineraryTimeline';
import ConstraintPanel from './components/ConstraintPanel';
import DiscoveryPanel from './components/DiscoveryPanel';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = "http://localhost:5000/api";

function App() {
  const [locations, setLocations] = useState([]);

  const [constraints, setConstraints] = useState({
    maxDays: 2,
    startTime: 540, // 9 AM
  });

  const [itinerary, setItinerary] = useState(null);
  const [activeTab, setActiveTab] = useState('constraints');
  const [loading, setLoading] = useState(false);
  const [directions, setDirections] = useState(null);
  const [discoveryResults, setDiscoveryResults] = useState([]);
  const [startLocationName, setStartLocationName] = useState("");

  // Auto-optimize when locations or constraints change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (locations.length > 0) {
        handleOptimize(false);
      }
    }, 1000); // 1s debounce

    return () => clearTimeout(timer);
  }, [locations, constraints]);

  const handleOptimize = async (isManual = false) => {
    if (locations.length === 0) {
      if (isManual) alert("Please add at least one destination before running the optimization engine.");
      return;
    }

    setLoading(true);
    try {
      let sourceLat = locations.length > 0 ? locations[0].lat : 40.7549;
      let sourceLng = locations.length > 0 ? locations[0].lng : -73.9840;

      if (startLocationName && startLocationName.toLowerCase() !== "hotel (start)") {
        try {
          const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
          const geoRes = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json`, {
            params: { address: startLocationName, key: apiKey }
          });
          if (geoRes.data.status === 'OK' && geoRes.data.results.length > 0) {
            sourceLat = geoRes.data.results[0].geometry.location.lat;
            sourceLng = geoRes.data.results[0].geometry.location.lng;
          }
        } catch (e) {
          console.error("Geocoding failed for start location", e);
        }
      }

      const response = await axios.post(`${API_BASE}/optimize`, {
        source: { name: startLocationName || (locations.length > 0 ? locations[0].name : "Start Location"), lat: sourceLat, lng: sourceLng },
        destinations: locations,
        constraints
      });
      setItinerary(response.data);
      if (isManual === true) {
        setActiveTab('itinerary');
      }
    } catch (error) {
      console.error("Optimization failed", error);
      if (isManual) alert("Error optimizing itinerary. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const handleAddLocations = (newLocations) => {
    // Prevent duplicates by name
    setLocations(prevLocations => {
      const existingNames = new Set(prevLocations.map(l => l.name));
      const filtered = newLocations.filter(nl => !existingNames.has(nl.name));

      // Check for capacity warning
      if (prevLocations.length + filtered.length > 8) {
        alert("Warning: Selected locations might exceed feasible travel capacity for the given days.");
      }

      return [...prevLocations, ...filtered];
    });
  };

  const sendFeedback = async (actionType) => {
    try {
      await axios.post(`${API_BASE}/feedback`, { actionType });
      handleOptimize(false); // Re-run with new weights
    } catch (error) {
      console.error("Feedback failed", error);
    }
  };

  return (
    <div className="bg-background text-on-background flex h-screen overflow-hidden font-sans">
      {/* Side Navigation */}
      <aside className="flex flex-col h-full py-6 bg-surface-container-lowest border-r border-outline-variant fixed w-[256px] left-0 top-0 z-50">
        <div className="px-6 mb-10">
          <h1 className="font-mono text-2xl font-semibold leading-tight font-bold text-primary">CAA-TIOS-ND</h1>
          <p className="font-mono text-[11px] font-bold tracking-[0.15em] uppercase text-on-surface-variant tracking-widest mt-1">MISSION CONTROL</p>
        </div>

        <nav className="flex-1 space-y-1">
          <button
            onClick={() => setActiveTab('constraints')}
            className={`w-full flex items-center px-6 py-3 transition-colors duration-200 ${activeTab === 'constraints'
                ? 'text-primary border-l-2 border-primary bg-surface-container-highest neon-glow-left'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
              }`}
          >
            <span className="material-symbols-outlined mr-3">tune</span>
            <span className="font-mono text-[11px] font-bold tracking-[0.15em] uppercase">SETTINGS</span>
          </button>

          <button
            onClick={() => setActiveTab('discovery')}
            className={`w-full flex items-center px-6 py-3 transition-colors duration-200 ${activeTab === 'discovery'
                ? 'text-primary border-l-2 border-primary bg-surface-container-highest neon-glow-left'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
              }`}
          >
            <span className="material-symbols-outlined mr-3">explore</span>
            <span className="font-mono text-[11px] font-bold tracking-[0.15em] uppercase">DISCOVERY</span>
          </button>

          <button
            onClick={() => setActiveTab('itinerary')}
            className={`w-full flex items-center px-6 py-3 transition-colors duration-200 ${activeTab === 'itinerary'
                ? 'text-primary border-l-2 border-primary bg-surface-container-highest neon-glow-left'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
              }`}
          >
            <span className="material-symbols-outlined mr-3">map</span>
            <span className="font-mono text-[11px] font-bold tracking-[0.15em] uppercase">ITINERARY</span>
          </button>
        </nav>

        <div className="px-4 mt-auto">
          <button
            onClick={() => handleOptimize(true)}
            className="w-full py-3 px-4 bg-primary text-on-primary font-bold text-[11px] font-bold tracking-[0.15em] uppercase rounded-lg flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all"
          >
            <span className="material-symbols-outlined">rocket_launch</span>
            RUN OPTIMIZATION
          </button>
        </div>
      </aside>

      {/* Top App Bar */}
      <header className="fixed top-0 right-0 left-[256px] h-[64px] w-[calc(100%-256px)] flex justify-between items-center px-6 bg-[#131b2e] border-b border-[#3b494c] z-50">
        <div className="flex items-center gap-8">
          <span className="font-mono text-2xl font-semibold leading-tight text-[#baf2ff] font-bold">
            {activeTab === 'constraints' ? 'LOGISTICS CONFIGURATION' :
              activeTab === 'discovery' ? 'DISCOVERY ENGINE' : 'ITINERARY VISUALIZATION'}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#4edea3] shadow-[0_0_8px_#4edea3]"></div>
            <span className="font-mono text-[10px] font-medium tracking-tight text-[#bac9cd] uppercase">System Online</span>
          </div>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="ml-[256px] mt-[64px] flex w-[calc(100%-256px)] h-[calc(100vh-64px)] overflow-hidden bg-[#060e20]">

        {/* Left Panel (30-40% depending on tab) */}
        <section className={`border-r border-outline-variant bg-surface-container flex flex-col custom-scrollbar overflow-y-auto transition-all duration-300 ${activeTab === 'itinerary' ? 'w-full' : 'w-1/3 min-w-[400px]'}`}>
          <AnimatePresence mode="wait">
            {activeTab === 'constraints' && (
              <motion.div
                key="constraints"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full flex flex-col"
              >
                <ConstraintPanel
                  onOptimize={() => handleOptimize(true)}
                  locations={locations}
                  setLocations={setLocations}
                  constraints={constraints}
                  setConstraints={setConstraints}
                  startLocationName={startLocationName}
                  setStartLocationName={setStartLocationName}
                />
              </motion.div>
            )}

            {activeTab === 'discovery' && (
              <motion.div
                key="discovery"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full flex flex-col"
              >
                <DiscoveryPanel onAddLocations={handleAddLocations} onSearchResults={setDiscoveryResults} />
              </motion.div>
            )}

            {activeTab === 'itinerary' && (
              <motion.div
                key="itinerary"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="h-full flex flex-col p-6"
              >
                {itinerary ? (
                  <ItineraryTimeline itinerary={itinerary} />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4 text-outline">
                    <span className="material-symbols-outlined text-[48px] opacity-20">settings_alert</span>
                    <p className="font-mono">NO ITINERARY GENERATED<br />CONFIGURE CONSTRAINTS AND RUN OPTIMIZATION</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Right Map Interface */}
        {activeTab !== 'itinerary' && (
          <section className="flex-1 relative bg-[#060e20]">
            <MapComponent
              locations={locations}
              itinerary={itinerary}
              discoveryResults={discoveryResults}
              onAddFromMap={(place) => {
                handleAddLocations([{
                  name: place.name,
                  lat: place.lat,
                  lng: place.lng,
                  duration: 60,
                  mandatory: false,
                  timeWindow: { open: 540, close: 1080 }
                }]);
              }}
            />

            {/* Overlays */}
            {loading && (
              <div className="absolute inset-0 z-50 bg-surface-container-lowest/80 backdrop-blur-md flex items-center justify-center">
                <div className="flex flex-col items-center space-y-6">
                  <div className="relative w-16 h-16">
                    <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
                    <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-[0_0_15px_#baf2ff]" />
                  </div>
                  <p className="font-mono text-primary tracking-widest animate-pulse">RUNNING GENETIC ALGORITHM...</p>
                </div>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
