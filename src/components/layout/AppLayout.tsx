import { BarChart3, Egg, Home, Sprout, UserRound, Wheat } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { useFarmData } from '../../context/FarmDataContext';

const navItems = [
  { to: '/', label: 'Dashboard', icon: Home },
  { to: '/flocks', label: 'Flocks', icon: Sprout },
  { to: '/eggs', label: 'Eggs', icon: Egg },
  { to: '/feed', label: 'Feed', icon: Wheat },
  { to: '/profile', label: 'Profile', icon: UserRound },
];

export function AppLayout() {
  const { data } = useFarmData();

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">PM</div>
          <div>
            <strong>{data.profile.farmName}</strong>
            <span>{data.profile.farmLocation || 'Local farm'}</span>
          </div>
        </div>
        <nav className="nav-list">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <Icon size={22} aria-hidden />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
        <div className="offline-pill">
          <BarChart3 size={18} aria-hidden />
          Offline ready
        </div>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
