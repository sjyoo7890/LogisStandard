import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/', icon: '📊', label: '대시보드' },
  { to: '/sorting-plan', icon: '📋', label: '구분계획' },
  { to: '/monitoring', icon: '🖥️', label: '실시간 모니터링' },
  { to: '/statistics', icon: '📈', label: '통계' },
  { to: '/alarms', icon: '🔔', label: '알람 관리' },
  { to: '/logs', icon: '📝', label: '통신 로그' },
  { to: '/relay', icon: '🔄', label: '중계기 관리' },
  { to: '/keying', icon: '⌨️', label: '타건기' },
  { to: '/chute-display', icon: '📦', label: '슈트현황판' },
  { to: '/situation', icon: '🗺️', label: '상황관제' },
];

export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  return (
    <aside className={`fixed left-0 top-0 h-full z-30 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-sm transition-all duration-300 ${collapsed ? 'w-16' : 'w-56'}`}>
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-gray-200 dark:border-gray-700">
        {!collapsed && <span className="font-bold text-kpost-primary dark:text-blue-400 text-sm truncate">우정 자동화 플랫폼</span>}
        <button
          onClick={onToggle}
          className={`text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-lg ${collapsed ? 'mx-auto' : 'ml-auto'}`}
        >
          {collapsed ? '»' : '«'}
        </button>
      </div>

      {/* Navigation */}
      <nav className="mt-2 px-2 space-y-0.5">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'sidebar-link-active' : 'sidebar-link-inactive'}`
            }
            title={collapsed ? item.label : undefined}
          >
            <span className="text-base shrink-0">{item.icon}</span>
            {!collapsed && <span className="truncate">{item.label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
