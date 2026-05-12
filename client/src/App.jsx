import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Map as MapIcon, Settings2 } from 'lucide-react';
import MapComponent from './components/MapComponent';
import ItineraryTimeline from './components/ItineraryTimeline';
import ConstraintPanel from './components/ConstraintPanel';
import DiscoveryPanel from './components/DiscoveryPanel';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = "http://localhost:5000/api";

function App() {
  const [locations, setLocations] = useState([
    { name: "Central Park", lat: 40.7829, lng: -73.9654, duration: 120, mandatory: true, timeWindow: { open: 480, close: 1200 } },
    { name: "Times Square", lat: 40.7580, lng: -73.9855, duration: 60, mandatory: false, timeWindow: { open: 0, close: 1440 } },
    { name: "Empire State Building", lat: 40.7484, lng: -73.9857, duration: 90, mandatory: true, timeWindow: { open: 480, close: 1320 } },
  ]);

  const [constraints, setConstraints] = useState({
    maxDays: 2,
    startTime: 540, // 9 AM
  });

  const [itinerary, setItinerary] = useState(null);
  const [activeTab, setActiveTab] = useState('constraints');
  const [loading, setLoading] = useState(false);
  const [directions, setDirections] = useState(null);
  const [discoveryResults, setDiscoveryResults] = useState([]);
  const [startLocationName, setStartLocationName] = useState("Hotel (Start)");

  // Auto-optimize when locations or constraints change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (locations.length > 0) {
        handleOptimize();
      }
    }, 1000); // 1s debounce

    return () => clearTimeout(timer);
  }, [locations, constraints]);

  const handleOptimize = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/optimize`, {
        source: { name: startLocationName || "Start Location", lat: 40.7549, lng: -73.9840 },
        destinations: locations,
        constraints
      });
      setItinerary(response.data);
      setActiveTab('itinerary');
    } catch (error) {
      console.error("Optimization failed", error);
      alert("Error optimizing itinerary. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const handleAddLocations = (newLocations) => {
    // Prevent duplicates by name
    const existingNames = new Set(locations.map(l => l.name));
    const filtered = newLocations.filter(nl => !existingNames.has(nl.name));
    setLocations([...locations, ...filtered]);
    setActiveTab('constraints');
    
    // Check for capacity warning
    if (locations.length + filtered.length > 8) {
      alert("Warning: Selected locations might exceed feasible travel capacity for the given days.");
    }
  };

  const sendFeedback = async (actionType) => {
    try {
      await axios.post(`${API_BASE}/feedback`, { actionType });
      handleOptimize(); // Re-run with new weights
    } catch (error) {
      console.error("Feedback failed", error);
    }
  };

  return (
    <div className="flex flex-col-reverse md:flex-row h-screen w-full bg-[var(--bg-dark)] text-[var(--text-main)] overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="flex-none w-full md:w-96 h-[45vh] md:h-screen flex flex-col border-t md:border-t-0 md:border-r border-[var(--panel-border)] shadow-[2px_0_20px_rgba(0,0,0,0.5)] z-20 glass-panel">
        <header className="p-6 border-b border-[var(--panel-border)]">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.4)]">
              <MapIcon className="text-white drop-shadow-md" />
            </div>
            <div>
              <h1 className="font-bold text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-fuchsia-500">CAA-TIOS</h1>
              <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-bold">Constraint-Aware Engine</p>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <div className="flex px-6 pt-6 gap-6 text-sm font-medium border-b border-[var(--panel-border)]">
          <button 
            onClick={() => setActiveTab('constraints')}
            className={`pb-4 border-b-2 transition-all ${activeTab === 'constraints' ? 'border-cyan-400 neon-text-cyan' : 'border-transparent text-[var(--text-muted)] hover:text-cyan-300'}`}
          >
            Constraints
          </button>
          <button 
            onClick={() => setActiveTab('discovery')}
            className={`pb-4 border-b-2 transition-all ${activeTab === 'discovery' ? 'border-cyan-400 neon-text-cyan' : 'border-transparent text-[var(--text-muted)] hover:text-cyan-300'}`}
          >
            Discovery
          </button>
          <button 
            onClick={() => setActiveTab('itinerary')}
            className={`pb-4 border-b-2 transition-all ${activeTab === 'itinerary' ? 'border-cyan-400 neon-text-cyan' : 'border-transparent text-[var(--text-muted)] hover:text-cyan-300'}`}
          >
            Itinerary
          </button>
        </div>

        <div className="flex-1 p-6 overflow-hidden">
          <AnimatePresence mode="wait">
            {activeTab === 'constraints' ? (
              <motion.div 
                key="constraints"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full"
              >
                <ConstraintPanel 
                  onOptimize={handleOptimize} 
                  locations={locations} 
                  setLocations={setLocations}
                  constraints={constraints}
                  setConstraints={setConstraints}
                  startLocationName={startLocationName}
                  setStartLocationName={setStartLocationName}
                />
              </motion.div>
            ) : activeTab === 'discovery' ? (
              <motion.div 
                key="discovery"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full"
              >
                <DiscoveryPanel onAddLocations={handleAddLocations} onSearchResults={setDiscoveryResults} />
              </motion.div>
            ) : (
              <motion.div 
                key="itinerary"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="h-full"
              >
                {itinerary ? (
                  <ItineraryTimeline itinerary={itinerary} />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4 text-slate-500">
                    <Settings2 size={48} className="opacity-20" />
                    <p>No itinerary generated yet.<br/>Configure constraints and run optimization.</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </aside>

      {/* Main Map Area */}
      <main className="flex-1 relative h-[55vh] md:h-screen min-w-0">
        <MapComponent locations={locations} itinerary={itinerary} discoveryResults={discoveryResults} />
        
        {/* Floating Info Overlay */}
        <div className="absolute top-6 right-6 space-y-4">
          {itinerary && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel p-4 rounded-2xl neon-border-cyan shadow-2xl min-w-[200px]"
            >
              <div className="text-[10px] uppercase neon-text-cyan font-bold mb-2 tracking-wider">Trip Summary</div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-cyan-200">{itinerary.days.length}</div>
                  <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Days</div>
                </div>
                <div>
                  <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-cyan-200">{Math.round(itinerary.totalTravelTime / 60)}h</div>
                  <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Travel</div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-[var(--panel-border)] space-y-2">
                <div className="text-[10px] uppercase text-[var(--text-muted)] font-bold mb-1 tracking-wider">Train ML Agent</div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => sendFeedback('PREFERENCE_TIME')}
                    className="flex-1 bg-[var(--bg-dark)] hover:bg-slate-800 text-[10px] py-1.5 rounded transition-all border border-[var(--panel-border)] hover:border-cyan-400/50"
                  >
                    Prioritize Time
                  </button>
                  <button 
                    onClick={() => sendFeedback('PREFERENCE_DISTANCE')}
                    className="flex-1 bg-[var(--bg-dark)] hover:bg-slate-800 text-[10px] py-1.5 rounded transition-all border border-[var(--panel-border)] hover:border-cyan-400/50"
                  >
                    Prioritize Dist
                  </button>
                </div>
              </div>
            </motion.div>
          )}
          
          <div className="glass-panel p-4 rounded-2xl border border-[var(--panel-border)] shadow-2xl flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f0ff] animate-pulse" />
             <span className="text-xs font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-fuchsia-500 tracking-wider">Optimization Engine Active</span>
          </div>
        </div>

        {loading && (
          <div className="absolute inset-0 z-50 bg-[#050511]/80 backdrop-blur-md flex items-center justify-center">
            <div className="flex flex-col items-center space-y-6">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 border-4 border-cyan-400/20 rounded-full" />
                <div className="absolute inset-0 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin shadow-[0_0_15px_#00f0ff]" />
                <div className="absolute inset-2 border-4 border-fuchsia-500/20 rounded-full" />
                <div className="absolute inset-2 border-4 border-fuchsia-500 border-b-transparent rounded-full animate-spin-reverse shadow-[0_0_10px_#ff0055]" style={{animationDirection: "reverse"}} />
              </div>
              <p className="neon-text-cyan font-bold tracking-widest animate-pulse uppercase text-sm">Running Genetic Algorithm...</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
