import { useTheme } from '../../context/ThemeContext';
import Button from '../../ui/Button';

export default function AppHeader({ activeTab, apiOnline, menuOpen, onMenuClick }) {
  const { theme, toggleTheme } = useTheme();

  const title =
    activeTab === 'constraints' ? 'Trip setup' : activeTab === 'discovery' ? 'Explore places' : 'Your itinerary';

  return (
    <header className="app-header" role="banner">
      <div className="flex-row align-center gap-sm flex-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mobile-menu-btn btn-icon"
          onClick={onMenuClick}
          aria-expanded={menuOpen}
          aria-controls="app-sidebar"
        >
          <span className="icon" aria-hidden>
            menu
          </span>
          <span className="sr-only">Open navigation menu</span>
        </Button>
        <div className="min-w-0 flex-col">
          <p className="input-label" style={{ fontSize: '0.7rem' }}>
            Current view
          </p>
          <h2 className="font-bold" style={{ fontSize: '1.2rem', margin: 0 }}>
            {title}
          </h2>
        </div>
      </div>

      <div className="flex-row align-center gap-md">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="btn-icon"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
        >
          <span className="icon" aria-hidden>
            {theme === 'dark' ? 'light_mode' : 'dark_mode'}
          </span>
        </Button>

        <div
          className="flex-row align-center gap-xs badge"
          title={apiOnline === false ? 'Start the API: cd server && npm start' : 'API connection'}
          style={{ padding: '0.4rem 0.8rem', backgroundColor: 'var(--surface-color)' }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: apiOnline === null ? '#94a3b8' : apiOnline ? '#22c55e' : '#ef4444',
              boxShadow: apiOnline === null ? 'none' : apiOnline ? '0 0 8px rgba(34, 197, 94, 0.6)' : '0 0 8px rgba(239, 68, 68, 0.6)',
              animation: apiOnline === null ? 'pulse 1.5s infinite' : 'none'
            }}
          />
          <span className="text-sm font-bold" style={{ color: 'var(--text-muted)' }}>
            {apiOnline === null ? 'Checking…' : apiOnline ? 'Connected' : 'Offline'}
          </span>
        </div>
      </div>
    </header>
  );
}
