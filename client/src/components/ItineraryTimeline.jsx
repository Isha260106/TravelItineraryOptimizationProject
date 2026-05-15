import { motion } from 'framer-motion';

const ItineraryTimeline = ({ itinerary }) => {
  if (!itinerary) return null;

  const warnings = itinerary.warnings ?? [];

  return (
    <div className="timeline-container">
      <header className="timeline-header">
        <p className="input-label" style={{ fontSize: '0.75rem', marginBottom: '0.5rem' }}>Optimized plan</p>
        <h2 className="font-bold text-main" style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Your timeline</h2>
        <p className="text-sm text-muted">Stops and travel segments per day. Warnings highlight tight timing or closed venues.</p>
      </header>

      {itinerary.days.map((day, dIdx) => (
        <div key={dIdx} className="relative" style={{ marginBottom: '2rem' }}>
          <div className="flex-row align-center gap-sm p-sm" style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--surface-color)', backdropFilter: 'var(--glass-blur)', borderBottom: '1px solid var(--border-color)', marginBottom: '1rem', borderRadius: 'var(--radius-md)' }}>
            <span className="flex-row align-center justify-center font-bold" style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--surface-hover)', color: 'var(--primary-color)', border: '1px solid rgba(0, 210, 255, 0.2)' }}>
              {day.day}
            </span>
            <div>
              <h3 className="font-bold text-main" style={{ fontSize: '1.2rem', margin: 0 }}>Day {day.day}</h3>
              <p className="text-sm text-muted">{day.route.length} stop{day.route.length === 1 ? '' : 's'}</p>
            </div>
          </div>

          <div className="relative" style={{ marginLeft: '16px', paddingLeft: '16px' }}>
            <div className="timeline-line"></div>
            {day.route.map((step, sIdx) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: sIdx * 0.05 }}
                key={sIdx}
                className="timeline-node"
              >
                <div className={`timeline-dot ${sIdx === 0 ? 'start' : sIdx === day.route.length - 1 ? 'end' : ''}`} />

                <div className="timeline-content">
                  <div className="flex-row justify-between align-center mb-sm" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
                    <h4 className="flex-row align-center gap-xs font-bold text-main" style={{ margin: 0, fontSize: '1.1rem' }}>
                      <span className="icon" style={{ color: 'var(--primary-color)' }}>
                        location_on
                      </span>
                      <span>{step.location.name}</span>
                    </h4>
                    <span className="badge badge-primary" style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                      {step.arrivalTime} – {step.departureTime}
                    </span>
                  </div>

                  <div className="flex-row gap-md text-sm text-muted" style={{ flexWrap: 'wrap' }}>
                    <span className="flex-row align-center gap-xs">
                      <span className="icon" style={{ fontSize: '16px' }}>schedule</span>
                      {step.location.duration} min on site
                    </span>
                    {step.travelFromPrev > 0 && (
                      <span className="flex-row align-center gap-xs">
                        <span className="icon" style={{ fontSize: '16px' }}>directions</span>
                        {step.travelFromPrev} min travel
                      </span>
                    )}
                  </div>

                  {warnings
                    .filter((w) => w.includes(step.location.name))
                    .map((w, wIdx) => (
                      <div
                        key={wIdx}
                        className="flex-row gap-xs mt-sm p-sm"
                        style={{ borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#fcd34d', fontSize: '0.85rem' }}
                      >
                        <span className="icon" style={{ color: '#fbbf24', fontSize: '18px' }}>
                          warning
                        </span>
                        {w}
                      </div>
                    ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ))}

      {warnings.length > 0 && (
        <div className="p-md" style={{ borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(225, 29, 72, 0.1)', border: '1px solid rgba(225, 29, 72, 0.3)' }}>
          <h4 className="flex-row align-center gap-xs font-bold mb-sm" style={{ color: '#fecdd3' }}>
            <span className="icon">
              gpp_maybe
            </span>
            Planner notes
          </h4>
          <ul className="flex-col gap-xs text-sm" style={{ color: '#ffe4e6', paddingLeft: '1.5rem' }}>
            {warnings.map((w, i) => (
              <li key={i} style={{ listStyleType: 'disc' }}>
                {w}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ItineraryTimeline;
