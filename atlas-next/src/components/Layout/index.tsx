import { type ReactNode, useState, useCallback } from 'react';
import { NavLink } from 'react-router';
import { routes, type RouteConfig } from '@/routes';
import { UserBar } from '@/components/UserBar';

export interface LayoutProps {
  children: ReactNode;
}

/**
 * Main application layout with sidebar navigation, header, and content area.
 * Sidebar navigation is dynamically generated from route definitions.
 */
export function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleSidebar();
      }
    },
    [toggleSidebar],
  );

  const visibleRoutes = routes.filter((r) => !r.hidden);

  return (
    <div className="flex h-screen overflow-hidden" data-testid="app-layout">
      {/* Sidebar */}
      <nav
        className={`flex flex-col bg-gray-900 text-white transition-all duration-200 ${
          sidebarOpen ? 'w-60' : 'w-16'
        }`}
        aria-label="Main navigation"
        role="navigation"
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          {sidebarOpen && (
            <span className="text-lg font-semibold" data-testid="app-title">
              Atlas
            </span>
          )}
          <button
            type="button"
            onClick={toggleSidebar}
            onKeyDown={handleKeyDown}
            className="p-1 rounded hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            aria-expanded={sidebarOpen}
          >
            <span aria-hidden="true">{sidebarOpen ? '◀' : '▶'}</span>
          </button>
        </div>

        <ul className="flex-1 overflow-y-auto py-2" role="menubar" aria-orientation="vertical">
          {visibleRoutes.map((route) => (
            <SidebarItem key={route.path} route={route} collapsed={!sidebarOpen} />
          ))}
        </ul>
      </nav>

      {/* Main content area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <header
          className="flex items-center justify-end px-4 py-2 bg-white border-b border-gray-200 shadow-sm"
          role="banner"
        >
          <UserBar />
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4" role="main" data-testid="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}

interface SidebarItemProps {
  route: RouteConfig;
  collapsed: boolean;
}

function SidebarItem({ route, collapsed }: SidebarItemProps) {
  return (
    <li role="none">
      <NavLink
        to={route.path}
        role="menuitem"
        className={({ isActive }) =>
          `flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
            isActive
              ? 'bg-blue-600 text-white'
              : 'text-gray-300 hover:bg-gray-800 hover:text-white'
          } focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-400`
        }
        title={route.title}
        aria-label={route.title}
      >
        <span className="w-5 text-center" aria-hidden="true">
          {getIconSymbol(route.icon)}
        </span>
        {!collapsed && <span>{route.title}</span>}
      </NavLink>
    </li>
  );
}

/** Map icon names to simple unicode symbols for the sidebar. */
function getIconSymbol(icon: string): string {
  const iconMap: Record<string, string> = {
    home: '🏠',
    book: '📖',
    users: '👥',
    'shopping-cart': '🛒',
    'bar-chart': '📊',
    signal: '📈',
    random: '🔀',
    flash: '⚡',
    'eye-open': '👁',
    user: '👤',
    tasks: '📋',
    wrench: '🔧',
    hdd: '💾',
    comment: '💬',
    cog: '⚙',
    retweet: '🔄',
    tags: '🏷',
  };
  return iconMap[icon] ?? '•';
}

export default Layout;
