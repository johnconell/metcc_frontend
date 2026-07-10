import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ChevronDown,
  Menu,
  Search,
  Bell,
  User,
  FolderKanban,
  ClipboardCheck,
  LineChart,
  Mail,
  Settings,
  FileText,
  HardDrive,
  Upload,
} from 'lucide-react';
import { useAuth } from '../auth/useAuth';
import tccLogo from '../assets/tcc_logo.jpg';
import './DashboardLayout.css';

const MANAGEMENT_SUBMENU = [
  { label: 'Examination / Schedules', path: null },
  { label: 'Question Bank', path: '/test-items' },
  { label: 'Student List', path: null },
  { label: 'Proctor', path: null },
  { label: 'User Management', path: '/admin/users', adminOnly: true },
  { label: 'Lobby', path: null },
];

const RESULTS_ITEMS = [
  { label: 'Exam Results', icon: ClipboardCheck, path: null },
  { label: 'Reports & Analytics', icon: LineChart, path: null },
  { label: 'Email Notification', icon: Mail, path: null },
];

const SYSTEM_ITEMS = [
  { label: 'Settings', icon: Settings, path: '/profile' },
  { label: 'Logs', icon: FileText, path: null },
  { label: 'Backup', icon: HardDrive, path: null },
  { label: 'Import', icon: Upload, path: null },
];

function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function navItemClass({ isActive }) {
  return `sidebar-nav__item${isActive ? ' sidebar-nav__item--active' : ''}`;
}

function submenuClass(isActive) {
  return `sidebar-submenu__item${isActive ? ' sidebar-submenu__item--active' : ''}`;
}

export function DashboardLayout() {
  const { user, isAdmin } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [managementOpen, setManagementOpen] = useState(true);
  const [resultsOpen, setResultsOpen] = useState(true);
  const [systemOpen, setSystemOpen] = useState(true);

  const displayName = user?.name || 'Kent Russel Casino';
  const displayRole = user?.role?.name || 'Administrator';
  const initials = getInitials(displayName);

  const managementActive = MANAGEMENT_SUBMENU.some(
    (item) => item.path && location.pathname.startsWith(item.path),
  );

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="dashboard-app">
      <aside className={`dashboard-sidebar${sidebarOpen ? ' dashboard-sidebar--open' : ''}`}>
        <Link to="/dashboard" className="sidebar-brand" onClick={closeSidebar}>
          <img src={tccLogo} alt="Tagoloan Community College" className="sidebar-brand__logo" />
          <div className="sidebar-brand__text">
            <span className="sidebar-brand__name">TAGOLOAN</span>
            <span className="sidebar-brand__name">COMMUNITY COLLEGE</span>
          </div>
        </Link>

        <div className="sidebar-brand__divider" />

        <nav className="sidebar-nav" aria-label="Main navigation">
          <NavLink to="/dashboard" end className={navItemClass} onClick={closeSidebar}>
            <LayoutDashboard className="sidebar-nav__icon" />
            Dashboard
          </NavLink>

          <div className="sidebar-section">
            <button
              type="button"
              className="sidebar-parent"
              onClick={() => setManagementOpen((open) => !open)}
              aria-expanded={managementOpen}
            >
              <FolderKanban size={18} />
              Management
              <ChevronDown
                className={`sidebar-parent__chevron${managementOpen || managementActive ? ' sidebar-parent__chevron--open' : ''}`}
              />
            </button>

            {(managementOpen || managementActive) && (
              <ul className="sidebar-submenu">
                {MANAGEMENT_SUBMENU.filter((item) => !item.adminOnly || isAdmin).map((item) => (
                  <li key={item.label}>
                    {item.path ? (
                      <NavLink
                        to={item.path}
                        className={({ isActive }) => submenuClass(isActive)}
                        onClick={closeSidebar}
                      >
                        {item.label}
                      </NavLink>
                    ) : (
                      <button type="button" className="sidebar-submenu__item">
                        {item.label}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="sidebar-section">
            <button
              type="button"
              className="sidebar-parent"
              onClick={() => setResultsOpen((open) => !open)}
              aria-expanded={resultsOpen}
            >
              <LineChart size={18} />
              Results &amp; Reports
              <ChevronDown
                className={`sidebar-parent__chevron${resultsOpen ? ' sidebar-parent__chevron--open' : ''}`}
              />
            </button>

            {resultsOpen && (
              <ul className="sidebar-submenu">
                {RESULTS_ITEMS.map(({ label, icon: Icon, path }) => (
                  <li key={label}>
                    {path ? (
                      <NavLink
                        to={path}
                        className={({ isActive }) => submenuClass(isActive)}
                        onClick={closeSidebar}
                      >
                        <Icon className="sidebar-nav__icon" />
                        {label}
                      </NavLink>
                    ) : (
                      <button type="button" className="sidebar-submenu__item">
                        <Icon className="sidebar-nav__icon" />
                        {label}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="sidebar-section">
            <button
              type="button"
              className="sidebar-parent"
              onClick={() => setSystemOpen((open) => !open)}
              aria-expanded={systemOpen}
            >
              <Settings size={18} />
              System
              <ChevronDown className={`sidebar-parent__chevron${systemOpen ? ' sidebar-parent__chevron--open' : ''}`} />
            </button>

            {systemOpen && (
              <ul className="sidebar-submenu">
                {SYSTEM_ITEMS.map(({ label, icon: Icon, path }) => (
                  <li key={label}>
                    {path ? (
                      <NavLink
                        to={path}
                        className={({ isActive }) => submenuClass(isActive)}
                        onClick={closeSidebar}
                      >
                        <Icon className="sidebar-nav__icon" />
                        {label}
                      </NavLink>
                    ) : (
                      <button type="button" className="sidebar-submenu__item">
                        <Icon className="sidebar-nav__icon" />
                        {label}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </nav>

        <Link to="/profile" className="sidebar-profile" onClick={closeSidebar}>
          <div className="sidebar-profile__avatar" aria-hidden="true">
            {user?.profile_photo_url ? (
              <img src={user.profile_photo_url} alt="" />
            ) : (
              initials
            )}
          </div>
          <div className="sidebar-profile__info">
            <div className="sidebar-profile__name">{displayName}</div>
            <div className="sidebar-profile__role">{displayRole}</div>
          </div>
          <ChevronDown className="sidebar-profile__chevron" />
        </Link>
      </aside>

      <button
        type="button"
        className={`sidebar-overlay${sidebarOpen ? ' sidebar-overlay--visible' : ''}`}
        aria-label="Close sidebar"
        onClick={closeSidebar}
        tabIndex={sidebarOpen ? 0 : -1}
      />

      <div className="dashboard-main">
        <header className="dashboard-header">
          <button
            type="button"
            className="dashboard-header__menu"
            aria-label="Toggle navigation menu"
            onClick={() => setSidebarOpen((open) => !open)}
          >
            <Menu size={20} />
          </button>

          <div className="dashboard-header__search">
            <Search className="dashboard-header__search-icon" />
            <input
              type="search"
              className="dashboard-header__search-input"
              placeholder="Search anything..."
              aria-label="Search"
            />
          </div>

          <div className="dashboard-header__actions">
            <button type="button" className="dashboard-header__notify" aria-label="Notifications, 3 unread">
              <Bell size={18} />
              <span className="dashboard-header__badge">3</span>
            </button>

            <Link to="/profile" className="dashboard-header__profile">
              <span className="dashboard-header__profile-avatar">
                {user?.profile_photo_url ? (
                  <img src={user.profile_photo_url} alt="" />
                ) : (
                  <User size={16} />
                )}
              </span>
              <span>Profile Settings</span>
              <ChevronDown className="dashboard-header__profile-chevron" />
            </Link>
          </div>
        </header>

        <div className="dashboard-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
