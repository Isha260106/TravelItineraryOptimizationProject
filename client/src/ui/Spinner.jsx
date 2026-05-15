export default function Spinner({ className = '', label = 'Loading' }) {
  return (
    <div className={`flex-col align-center justify-center gap-md ${className}`} role="status" aria-live="polite">
      <span style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', borderWidth: 0 }}>
        {label}
      </span>
      <div className="spinner icon" style={{ fontSize: '40px', color: 'var(--primary-color)' }} aria-hidden>
        autorenew
      </div>
    </div>
  );
}
