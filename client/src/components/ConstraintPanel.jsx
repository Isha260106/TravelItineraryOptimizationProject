import React, { useState } from 'react';
import { Plus, Trash2, ShieldCheck, MapPin, Calendar, Clock } from 'lucide-react';

const ConstraintPanel = ({ onOptimize, locations, setLocations, constraints, setConstraints }) => {
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
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">General Settings</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs text-slate-500 flex items-center gap-1">
              <Calendar size={12} /> Total Days
            </label>
            <input 
              type="number" 
              value={constraints.maxDays} 
              onChange={e => setConstraints({...constraints, maxDays: parseInt(e.target.value)})}
              className="w-full bg-slate-800/50 border border-white/10 rounded px-3 py-2 text-sm focus:border-sky-500 outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-500 flex items-center gap-1">
              <Clock size={12} /> Start Time (min)
            </label>
            <input 
              type="number" 
              value={constraints.startTime} 
              onChange={e => setConstraints({...constraints, startTime: parseInt(e.target.value)})}
              className="w-full bg-slate-800/50 border border-white/10 rounded px-3 py-2 text-sm focus:border-sky-500 outline-none"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Destinations</h3>
        
        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder="Add a place..."
            value={newLocName}
            onChange={e => setNewLocName(e.target.value)}
            className="flex-1 bg-slate-800/50 border border-white/10 rounded px-3 py-2 text-sm focus:border-sky-500 outline-none"
          />
          <button 
            onClick={addLocation}
            className="bg-sky-600 hover:bg-sky-500 p-2 rounded transition-colors"
          >
            <Plus size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
          {locations.map((loc, idx) => (
            <div key={idx} className="bg-slate-800/30 border border-white/5 p-3 rounded-lg space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-200">{loc.name}</span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => updateLocation(idx, 'mandatory', !loc.mandatory)}
                    className={`p-1.5 rounded transition-colors ${loc.mandatory ? 'text-sky-400 bg-sky-400/10' : 'text-slate-500'}`}
                    title="Mandatory"
                  >
                    <ShieldCheck size={16} />
                  </button>
                  <button 
                    onClick={() => removeLocation(idx)}
                    className="text-slate-500 hover:text-red-400 p-1.5 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase tracking-tighter">Visit Duration (min)</span>
                  <input 
                    type="number" 
                    value={loc.duration} 
                    onChange={e => updateLocation(idx, 'duration', parseInt(e.target.value))}
                    className="w-full bg-slate-900/50 border border-white/5 rounded px-2 py-1 text-xs outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase tracking-tighter">Closing Time (min)</span>
                  <input 
                    type="number" 
                    value={loc.timeWindow.close} 
                    onChange={e => updateLocation(idx, 'timeWindow', { ...loc.timeWindow, close: parseInt(e.target.value) })}
                    className="w-full bg-slate-900/50 border border-white/5 rounded px-2 py-1 text-xs outline-none"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button 
        onClick={onOptimize}
        className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-sky-900/20 transition-all transform active:scale-95"
      >
        Run Optimization Engine
      </button>
    </div>
  );
};

export default ConstraintPanel;
