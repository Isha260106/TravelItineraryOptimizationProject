import { useState } from 'react';
import { Plus, Trash2, ShieldCheck, Calendar, Clock } from 'lucide-react';

const ConstraintPanel = ({ onOptimize, locations, setLocations, constraints, setConstraints, startLocationName, setStartLocationName }) => {
  const [newLocName, setNewLocName] = useState("");

  const addLocation = () => {
    if (!newLocName) return;
    const newLoc = {
      name: newLocName,
      lat: 40.7128 + (Math.random() - 0.5) * 0.1,
      lng: -74.0060 + (Math.random() - 0.5) * 0.1,
      duration: 60,
      mandatory: false,
      timeWindow: { open: 9 * 60, close: 18 * 60 }
    };
    setLocations([...locations, newLoc]);
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
    <div className="flex flex-col h-full space-y-6">
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--text-muted)] border-b border-[var(--panel-border)] pb-2">General Settings</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs neon-text-cyan flex items-center gap-1">
              <Calendar size={12} /> Total Days
            </label>
            <input 
              type="number" 
              value={constraints.maxDays} 
              onChange={e => setConstraints({...constraints, maxDays: parseInt(e.target.value)})}
              className="w-full bg-[var(--bg-dark)] border border-[var(--panel-border)] rounded-lg px-3 py-2 text-sm focus:border-cyan-400 focus:shadow-[0_0_10px_rgba(0,240,255,0.3)] outline-none transition-all"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs neon-text-cyan flex items-center gap-1">
              <Clock size={12} /> Start Time (min)
            </label>
            <input 
              type="number" 
              value={constraints.startTime} 
              onChange={e => setConstraints({...constraints, startTime: parseInt(e.target.value)})}
              className="w-full bg-[var(--bg-dark)] border border-[var(--panel-border)] rounded-lg px-3 py-2 text-sm focus:border-cyan-400 focus:shadow-[0_0_10px_rgba(0,240,255,0.3)] outline-none transition-all"
            />
          </div>
          <div className="space-y-1 col-span-2">
            <label className="text-xs neon-text-cyan flex items-center gap-1">
              Starting Location
            </label>
            <input 
              type="text" 
              value={startLocationName} 
              onChange={e => setStartLocationName(e.target.value)}
              placeholder="e.g. Grand Hyatt Hotel"
              className="w-full bg-[var(--bg-dark)] border border-[var(--panel-border)] rounded-lg px-3 py-2 text-sm focus:border-cyan-400 focus:shadow-[0_0_10px_rgba(0,240,255,0.3)] outline-none transition-all"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
        <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--text-muted)] border-b border-[var(--panel-border)] pb-2">Destinations</h3>
        
        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder="Add a place..."
            value={newLocName}
            onChange={e => setNewLocName(e.target.value)}
            className="flex-1 bg-[var(--bg-dark)] border border-[var(--panel-border)] rounded-lg px-3 py-2 text-sm focus:border-cyan-400 focus:shadow-[0_0_10px_rgba(0,240,255,0.3)] outline-none transition-all"
          />
          <button 
            onClick={addLocation}
            className="bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.4)] text-[#050511] p-2 rounded-lg transition-all transform hover:scale-105"
          >
            <Plus size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2 pb-4">
          {locations.map((loc, idx) => (
            <div key={idx} className="glass-panel glass-panel-hover p-3 rounded-xl space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-cyan-100">{loc.name}</span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => updateLocation(idx, 'mandatory', !loc.mandatory)}
                    className={`p-1.5 rounded transition-all ${loc.mandatory ? 'neon-text-cyan bg-cyan-400/10 shadow-[0_0_8px_rgba(0,240,255,0.3)]' : 'text-[var(--text-muted)] hover:text-cyan-400 hover:shadow-[0_0_8px_rgba(0,240,255,0.3)]'}`}
                    title="Mandatory"
                  >
                    <ShieldCheck size={16} />
                  </button>
                  <button 
                    onClick={() => removeLocation(idx)}
                    className="text-[var(--text-muted)] hover:text-fuchsia-500 hover:shadow-[0_0_8px_rgba(255,0,85,0.3)] p-1.5 rounded transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest">Visit Duration (min)</span>
                  <input 
                    type="number" 
                    value={loc.duration} 
                    onChange={e => updateLocation(idx, 'duration', parseInt(e.target.value))}
                    className="w-full bg-[var(--bg-dark)] border border-[var(--panel-border)] rounded px-2 py-1 text-xs focus:border-cyan-400 focus:shadow-[0_0_8px_rgba(0,240,255,0.3)] outline-none transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest">Closing Time (min)</span>
                  <input 
                    type="number" 
                    value={loc.timeWindow.close} 
                    onChange={e => updateLocation(idx, 'timeWindow', { ...loc.timeWindow, close: parseInt(e.target.value) })}
                    className="w-full bg-[var(--bg-dark)] border border-[var(--panel-border)] rounded px-2 py-1 text-xs focus:border-cyan-400 focus:shadow-[0_0_8px_rgba(0,240,255,0.3)] outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button 
        onClick={onOptimize}
        className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold py-3 rounded-xl shadow-[0_0_20px_rgba(138,43,226,0.4)] hover:shadow-[0_0_30px_rgba(0,240,255,0.6)] transition-all transform hover:-translate-y-1 active:scale-95 border border-[rgba(255,255,255,0.1)]"
      >
        Run Optimization Engine
      </button>
    </div>
  );
};

export default ConstraintPanel;
