import { motion } from 'framer-motion';

const ItineraryTimeline = ({ itinerary }) => {
  if (!itinerary) return null;

  return (
    <div className="flex flex-col gap-6 overflow-y-auto custom-scrollbar h-full pb-20">
      {itinerary.days.map((day, dIdx) => (
        <div key={dIdx} className="relative">
          <div className="sticky top-0 z-10 py-2 bg-surface-container-lowest/90 backdrop-blur-md mb-4 border-b border-outline-variant">
            <h3 className="font-mono text-2xl font-semibold leading-tight text-primary flex items-center gap-2 tracking-widest">
              <span className="material-symbols-outlined text-[20px]">calendar_today</span> 
              DAY {day.day}
            </h3>
          </div>

          <div className="space-y-4 ml-4 border-l border-outline-variant relative">
            {day.route.map((step, sIdx) => (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: sIdx * 0.1 }}
                key={sIdx}
                className="relative pl-6 pb-4 group"
              >
                {/* Node dot */}
                <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-surface-container-lowest border border-outline-variant group-hover:border-primary group-hover:bg-primary shadow-sm group-hover:shadow-[0_0_8px_#baf2ff] transition-all" />
                
                <div className="bg-surface-container border border-outline-variant p-3 rounded-lg group-hover:border-primary/50 transition-all duration-300">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-sans text-base font-normal font-bold text-on-surface flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px] text-primary">location_on</span>
                      {step.location.name}
                    </h4>
                    <span className="font-mono text-[10px] text-primary bg-primary/10 border border-primary/20 px-2 py-1 rounded uppercase">
                      {step.arrivalTime} - {step.departureTime}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-[10px] font-mono text-on-surface-variant uppercase">
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">schedule</span>
                      <span>{step.location.duration}m DWELL</span>
                    </div>
                    {step.travelFromPrev > 0 && (
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">route</span>
                        <span>{step.travelFromPrev}m TRANSIT</span>
                      </div>
                    )}
                  </div>

                  {/* Warnings for this specific location */}
                  {itinerary.warnings.filter(w => w.includes(step.location.name)).map((w, wIdx) => (
                    <div key={wIdx} className="mt-3 text-[10px] font-mono text-tertiary-container flex items-center gap-2 bg-tertiary-container/10 p-2 border border-tertiary-container/30 rounded">
                      <span className="material-symbols-outlined text-[14px]">warning</span>
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
        <div className="mt-8 p-3 bg-error/10 border border-error/30 rounded-lg">
          <h4 className="text-error font-mono text-[12px] font-bold flex items-center gap-2 mb-2 tracking-widest">
            <span className="material-symbols-outlined text-[18px]">gpp_bad</span> 
            CRITICAL MISSION ALERTS
          </h4>
          <ul className="space-y-1">
            {itinerary.warnings.map((w, i) => (
              <li key={i} className="font-mono text-[10px] text-error/80">• {w}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ItineraryTimeline;
