import { motion } from 'framer-motion';

const variantStyles = {
  error: { border: '1px solid rgba(244, 63, 94, 0.3)', backgroundColor: 'rgba(76, 5, 25, 0.9)', color: '#fff1f2' },
  warning: { border: '1px solid rgba(245, 158, 11, 0.25)', backgroundColor: 'rgba(69, 26, 3, 0.9)', color: '#fffbeb' },
  success: { border: '1px solid rgba(16, 185, 129, 0.25)', backgroundColor: 'rgba(2, 44, 34, 0.9)', color: '#ecfdf5' },
  info: { border: '1px solid var(--border-strong)', backgroundColor: 'var(--surface-elevated)', color: 'var(--text-primary)' },
};

export default function ToastBanner({ toast, onDismiss }) {
  if (!toast) return null;

  const style = variantStyles[toast.variant] || variantStyles.info;

  return (
    <motion.div
      key={toast.id}
      role="alert"
      aria-live="polite"
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 16, scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      className="flex-row align-center gap-md"
      style={{
        position: 'fixed',
        bottom: '2rem',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 120,
        width: 'calc(100% - 1.5rem)',
        maxWidth: '400px',
        padding: '1rem 1.25rem',
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        backdropFilter: 'var(--glass-blur)',
        ...style
      }}
    >
      <p className="flex-1 text-sm m-0" style={{ lineHeight: 1.4 }}>{toast.message}</p>
      <button
        type="button"
        onClick={onDismiss}
        className="btn-icon"
        aria-label="Dismiss notification"
        style={{ color: 'inherit', border: 'none' }}
      >
        <span className="icon">close</span>
      </button>
    </motion.div>
  );
}
