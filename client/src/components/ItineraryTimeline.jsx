import React from 'react';
import { Clock, MapPin, AlertTriangle, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const ItineraryTimeline = ({ itinerary }) => {
  if (!itinerary) return null;

  return (
    <div className="flex flex-col gap-6 overflow-y-auto custom-scrollbar h-full pb-20">
      {itinerary.days.map((day, dIdx) => (
        <div key={dIdx} className="relative">
          <div className="sticky top-0 z-10 py-2 bg-slate-900/80 backdrop-blur-md mb-4 border-b border-white/5">
            <h3 className="text-lg font-bold text-sky-400 flex items-center gap-2">
              <CheckCircle size={18} /> Day {day.day}
            </h3>
          </div>

          <div className="space-y-4 ml-4 border-l-2 border-slate-700">
            {day.route.map((step, sIdx) => (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: sIdx * 0.1 }}
                key={sIdx}
                className="relative pl-6 pb-4 group"
              >
                {/* Node dot */}
                <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-slate-700 border-2 border-slate-900 group-hover:bg-sky-500 transition-colors" />
                
                <div className="glass-panel p-4 rounded-xl space-y-2 hover:border-sky-500/50 transition-all duration-300">
                  <div className="flex justify-between items-start">
                    <h4 className="font-semibold text-slate-100 flex items-center gap-2">
                      <MapPin size={16} className="text-sky-400" />
                      {step.location.name}
                    </h4>
                    <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-1 rounded">
                      {step.arrivalTime} - {step.departureTime}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-slate-400">
                    <div className="flex items-center gap-1">
                      <Clock size={14} />
                      <span>{step.location.duration} min visit</span>
                    </div>
                    {step.travelFromPrev > 0 && (
                      <div className="text-xs text-slate-500">
                        {step.travelFromPrev} min travel from prev
                      </div>
                    )}
                  </div>

                  {/* Warnings for this specific location */}
                  {itinerary.warnings.filter(w => w.includes(step.location.name)).map((w, wIdx) => (
                    <div key={wIdx} className="mt-2 text-xs text-amber-400 flex items-center gap-1 bg-amber-400/10 p-2 rounded border border-amber-400/20">
                      <AlertTriangle size={12} />
                      {w}
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ))}

      {itinerary.warnings.length > 0 && (
        <div className="mt-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
          <h4 className="text-red-400 font-bold flex items-center gap-2 mb-2">
            <AlertTriangle size={18} /> Feasibility Alerts
          </h4>
          <ul className="space-y-1">
            {itinerary.warnings.map((w, i) => (
              <li key={i} className="text-xs text-red-300/80">• {w}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ItineraryTimeline;
