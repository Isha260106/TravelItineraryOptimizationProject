
import { Clock, MapPin, AlertTriangle, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const ItineraryTimeline = ({ itinerary }) => {
  if (!itinerary) return null;

  return (
    <div className="flex flex-col gap-6 overflow-y-auto custom-scrollbar h-full pb-20">
      {itinerary.days.map((day, dIdx) => (
        <div key={dIdx} className="relative">
          <div className="sticky top-0 z-10 py-2 bg-[var(--bg-dark)]/90 backdrop-blur-md mb-4 border-b border-[var(--panel-border)]">
            <h3 className="text-lg font-bold neon-text-cyan flex items-center gap-2">
              <CheckCircle size={18} /> Day {day.day}
            </h3>
          </div>

          <div className="space-y-4 ml-4 border-l-2 border-cyan-900/50 relative">
            {day.route.map((step, sIdx) => (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: sIdx * 0.1 }}
                key={sIdx}
                className="relative pl-6 pb-4 group"
              >
                {/* Node dot */}
                <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-[#050511] border-2 border-cyan-800 group-hover:border-cyan-400 group-hover:bg-cyan-400 group-hover:shadow-[0_0_10px_#00f0ff] transition-all" />
                
                <div className="glass-panel glass-panel-hover p-4 rounded-xl space-y-2 transition-all duration-300">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-white drop-shadow-md flex items-center gap-2">
                      <MapPin size={16} className="text-cyan-400 drop-shadow-[0_0_5px_#00f0ff]" />
                      {step.location.name}
                    </h4>
                    <span className="text-xs font-mono text-cyan-200 bg-[var(--bg-dark)] border border-cyan-400/20 shadow-[inset_0_0_5px_rgba(0,240,255,0.1)] px-2 py-1 rounded">
                      {step.arrivalTime} - {step.departureTime}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-[var(--text-muted)]">
                    <div className="flex items-center gap-1">
                      <Clock size={14} />
                      <span>{step.location.duration} min visit</span>
                    </div>
                    {step.travelFromPrev > 0 && (
                      <div className="text-xs text-[var(--text-muted)]">
                        {step.travelFromPrev} min travel from prev
                      </div>
                    )}
                  </div>

                  {/* Warnings for this specific location */}
                  {itinerary.warnings.filter(w => w.includes(step.location.name)).map((w, wIdx) => (
                    <div key={wIdx} className="mt-2 text-xs text-yellow-400 flex items-center gap-1 bg-yellow-400/10 p-2 rounded border border-yellow-400/30 shadow-[0_0_10px_rgba(250,204,21,0.2)]">
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
        <div className="mt-8 p-4 bg-fuchsia-500/10 border border-fuchsia-500/30 shadow-[0_0_15px_rgba(255,0,85,0.2)] rounded-xl">
          <h4 className="text-fuchsia-400 drop-shadow-[0_0_5px_rgba(255,0,85,0.5)] font-bold flex items-center gap-2 mb-2">
            <AlertTriangle size={18} /> Feasibility Alerts
          </h4>
          <ul className="space-y-1">
            {itinerary.warnings.map((w, i) => (
              <li key={i} className="text-xs text-fuchsia-200">• {w}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ItineraryTimeline;
