import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Map as MapIcon, Calendar, Settings2, Info, ChevronRight } from 'lucide-react';
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
        source: { name: "Hotel (Start)", lat: 40.7549, lng: -73.9840 },
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
    <div className="flex h-screen w-full bg-[#0f172a] text-slate-200 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-96 flex flex-col border-r border-white/5 z-20 glass-panel">
        <header className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-sky-600 rounded-xl flex items-center justify-center shadow-lg shadow-sky-500/20">
              <MapIcon className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-xl tracking-tight">CAA-TIOS</h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Constraint-Aware Engine</p>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <div className="flex px-6 pt-6 gap-6 text-sm font-medium border-b border-white/5">
          <button 
            onClick={() => setActiveTab('constraints')}
            className={`pb-4 border-b-2 transition-all ${activeTab === 'constraints' ? 'border-sky-500 text-sky-400' : 'border-transparent text-slate-500'}`}
          >
            Constraints
          </button>
          <button 
            onClick={() => setActiveTab('discovery')}
            className={`pb-4 border-b-2 transition-all ${activeTab === 'discovery' ? 'border-sky-500 text-sky-400' : 'border-transparent text-slate-500'}`}
          >
            Discovery
          </button>
          <button 
            onClick={() => setActiveTab('itinerary')}
            className={`pb-4 border-b-2 transition-all ${activeTab === 'itinerary' ? 'border-sky-500 text-sky-400' : 'border-transparent text-slate-500'}`}
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
                <DiscoveryPanel onAddLocations={handleAddLocations} />
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
      <main className="flex-1 relative">
        <MapComponent locations={locations} itinerary={itinerary} />
        
        {/* Floating Info Overlay */}
        <div className="absolute top-6 right-6 space-y-4">
          {itinerary && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel p-4 rounded-2xl border border-sky-500/20 shadow-2xl min-w-[200px]"
            >
              <div className="text-[10px] uppercase text-sky-400 font-bold mb-2">Trip Summary</div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xl font-bold">{itinerary.days.length}</div>
                  <div className="text-[10px] text-slate-500 uppercase">Days</div>
                </div>
                <div>
                  <div className="text-xl font-bold">{Math.round(itinerary.totalTravelTime / 60)}h</div>
                  <div className="text-[10px] text-slate-500 uppercase">Travel</div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
                <div className="text-[10px] uppercase text-slate-500 font-bold mb-1">Train ML Agent</div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => sendFeedback('PREFERENCE_TIME')}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-[10px] py-1.5 rounded transition-all"
                  >
                    Prioritize Time
                  </button>
                  <button 
                    onClick={() => sendFeedback('PREFERENCE_DISTANCE')}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-[10px] py-1.5 rounded transition-all"
                  >
                    Prioritize Dist
                  </button>
                </div>
              </div>
            </motion.div>
          )}
          
          <div className="glass-panel p-4 rounded-2xl border border-white/5 shadow-2xl flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
             <span className="text-xs font-medium text-slate-400">Optimization Engine Active</span>
          </div>
        </div>

        {loading && (
          <div className="absolute inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sky-400 font-medium animate-pulse">Running Genetic Algorithm...</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
