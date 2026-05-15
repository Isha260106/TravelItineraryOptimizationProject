import Button from '../../ui/Button';

const NAV = [
  { id: 'constraints', label: 'Trip setup', hint: 'Days, start, stops', icon: 'tune', tone: 'text-sky-300' },
  { id: 'discovery', label: 'Explore', hint: 'Search & map picks', icon: 'explore', tone: 'text-teal-300' },
  { id: 'itinerary', label: 'Itinerary', hint: 'Day-by-day timeline', icon: 'map', tone: 'text-cyan-200' },
];

export default function AppSidebar({
  activeTab,
  onTabChange,
  locations,
  onOptimize,
  loading,
  mobileMenuOpen,
  onNavigate,
}) {
  const handleNav = (id) => {
    onTabChange(id);
    onNavigate?.();
  };

  return (
    <aside
      id="app-sidebar"
      className={`sidebar ${mobileMenuOpen ? 'open' : ''}`}
      aria-label="Primary navigation"
    >
      <div className="sidebar-header">
        <div className="flex-row align-center gap-sm">
          <div className="icon flex-row align-center justify-center font-bold" style={{
            width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))',
            color: '#fff', fontSize: '20px', boxShadow: '0 4px 10px rgba(0, 210, 255, 0.3)'
          }}>
            V
          </div>
          <div>
            <h1 className="sidebar-title">Voyage</h1>
            <p className="text-sm text-muted">Itinerary optimizer</p>
          </div>
        </div>
      </div>

      <div className="p-sm">
        <p className="text-sm text-muted">
          Balance travel time, hours, and must-see stops in one workspace.
        </p>
      </div>

      <nav className="sidebar-nav" aria-label="Sections">
        {NAV.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => handleNav(item.id)}
            aria-current={activeTab === item.id ? 'page' : undefined}
            className={`nav-btn ${activeTab === item.id ? 'active' : ''}`}
          >
            <span className="icon" aria-hidden style={{ color: activeTab === item.id ? 'var(--primary-color)' : 'inherit' }}>
              {item.icon}
            </span>
            <span className="flex-col" style={{ textAlign: 'left', minWidth: 0 }}>
              <span style={{ fontWeight: activeTab === item.id ? '600' : '500', color: activeTab === item.id ? 'var(--primary-color)' : 'var(--text-main)' }}>{item.label}</span>
              <span className="text-sm text-muted">{item.hint}</span>
            </span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer flex-col gap-sm">
        <p className="text-sm text-muted">
          {locations.length === 0
            ? 'Add stops in Trip setup or Explore. Plans refresh after you pause typing.'
            : `${locations.length} stop${locations.length === 1 ? '' : 's'} — run optimize when ready.`}
        </p>
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={() => {
            onOptimize();
            onNavigate?.();
          }}
          disabled={locations.length === 0 || loading}
          title={locations.length === 0 ? 'Add at least one destination first' : 'Run route optimization'}
        >
          <span className="icon" aria-hidden>
            rocket_launch
          </span>
          Optimize route
        </Button>
      </div>
    </aside>
  );
}
