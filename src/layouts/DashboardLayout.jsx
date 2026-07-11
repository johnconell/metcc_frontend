import { useEffect, useState } from 'react';
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
  CalendarDays,
  BookOpen,
  Users,
  Shield,
  UserCog,
  Building2,
} from 'lucide-react';
import { useAuth } from '../auth/useAuth';
import tccLogo from '../assets/tcc_logo.jpg';
import './DashboardLayout.css';

const MANAGEMENT_SUBMENU = [
  { label: 'Examination / Schedules', icon: CalendarDays, path: '/management/schedules' },
  { label: 'Question Bank', icon: BookOpen, path: '/management/question-bank' },
  { label: 'Student List', icon: Users, path: '/management/students' },
  { label: 'Proctor', icon: Shield, path: '/management/proctors' },
  { label: 'User Management', icon: UserCog, path: '/management/users', adminOnly: true },
  { label: 'Lobby', icon: Building2, path: '/management/lobby' },
];

const RESULTS_ITEMS = [
  { label: 'Exam Results', icon: ClipboardCheck, path: '/results/exam-results' },
  { label: 'Reports & Analytics', icon: LineChart, path: '/results/reports-analytics' },
  { label: 'Email Notification', icon: Mail, path: '/results/email-notification' },
];

const SYSTEM_ITEMS = [
  { label: 'Settings', icon: Settings, path: '/system/settings' },
  { label: 'Logs', icon: FileText, path: '/system/logs' },
  { label: 'Backup', icon: HardDrive, path: '/system/backup' },
  { label: 'Import', icon: Upload, path: '/system/import' },
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [managementOpen, setManagementOpen] = useState(true);
  const [resultsOpen, setResultsOpen] = useState(true);
  const [systemOpen, setSystemOpen] = useState(true);

  const displayName = user?.name || 'Kent Russel Casino';
  const displayRole = user?.role?.name || 'Administrator';
  const initials = getInitials(displayName);

  const managementActive = location.pathname.startsWith('/management');
  const resultsActive = location.pathname.startsWith('/results');
  const systemActive = location.pathname.startsWith('/system');

  useEffect(() => {
    if (managementActive) {
      queueMicrotask(() => setManagementOpen(true));
    }
  }, [managementActive]);

  useEffect(() => {
    if (resultsActive) {
      queueMicrotask(() => setResultsOpen(true));
    }
  }, [resultsActive]);

  useEffect(() => {
    if (systemActive) {
      queueMicrotask(() => setSystemOpen(true));
    }
  }, [systemActive]);

  const closeSidebar = () => setSidebarOpen(false);
  const toggleSidebar = () => {
    if (window.innerWidth <= 768) {
      setSidebarCollapsed(false);
      setSidebarOpen((open) => !open);
      return;
    }

    setSidebarOpen(false);
    setSidebarCollapsed((collapsed) => !collapsed);
  };

  return (
    <div className="dashboard-app">
      <aside
        id="dashboard-sidebar"
        className={`dashboard-sidebar${sidebarOpen ? ' dashboard-sidebar--open' : ''}${sidebarCollapsed ? ' dashboard-sidebar--collapsed' : ''}`}
      >
        <Link to="/dashboard" className="sidebar-brand" onClick={closeSidebar} title="Dashboard" data-tooltip="Dashboard">
          <img src={tccLogo} alt="Tagoloan Community College" className="sidebar-brand__logo" />
          <div className="sidebar-brand__text">
            <span className="sidebar-brand__name">TAGOLOAN</span>
            <span className="sidebar-brand__name">COMMUNITY COLLEGE</span>
          </div>
        </Link>

        <div className="sidebar-brand__divider" />

        <nav className="sidebar-nav" aria-label="Main navigation">
          <div className="sidebar-section__header sidebar-section__header--spaced">
            <span>Main Menu</span>
          </div>

          <NavLink
            to="/dashboard"
            end
            className={navItemClass}
            onClick={closeSidebar}
            title="Dashboard"
            data-tooltip="Dashboard"
          >
            <LayoutDashboard className="sidebar-nav__icon" />
            <span className="sidebar-nav__label">Dashboard</span>
          </NavLink>

          <div className="sidebar-section__header">
            <span>General</span>
          </div>

          <div className="sidebar-section">
            <button
              type="button"
              className={`sidebar-parent${managementActive ? ' sidebar-parent--active' : ''}`}
              onClick={() => setManagementOpen((open) => !open)}
              aria-expanded={managementOpen}
              aria-controls="management-submenu"
              title="Management"
              data-tooltip="Management"
            >
              <FolderKanban size={18} />
              <span className="sidebar-parent__label">Management</span>
              <ChevronDown
                className={`sidebar-parent__chevron${managementOpen ? ' sidebar-parent__chevron--open' : ''}`}
              />
            </button>

            {managementOpen && (
              <ul id="management-submenu" className="sidebar-submenu">
                {MANAGEMENT_SUBMENU.filter((item) => !item.adminOnly || isAdmin).map((item) => (
                  <li key={item.label}>
                    <NavLink
                      to={item.path}
                      className={({ isActive }) => submenuClass(isActive)}
                      onClick={closeSidebar}
                      title={item.label}
                      data-tooltip={item.label}
                    >
                      <item.icon className="sidebar-submenu__icon sidebar-nav__icon" />
                      <span className="sidebar-submenu__label">{item.label}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="sidebar-section">
            <button
              type="button"
              className={`sidebar-parent${resultsActive ? ' sidebar-parent--active' : ''}`}
              onClick={() => setResultsOpen((open) => !open)}
              aria-expanded={resultsOpen}
              title="Results & Reports"
              data-tooltip="Results & Reports"
            >
              <LineChart size={18} />
              <span className="sidebar-parent__label">Results &amp; Reports</span>
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
                        title={label}
                        data-tooltip={label}
                      >
                        <Icon className="sidebar-nav__icon" />
                        <span className="sidebar-submenu__label">{label}</span>
                      </NavLink>
                    ) : (
                      <button type="button" className="sidebar-submenu__item" title={label} data-tooltip={label}>
                        <Icon className="sidebar-nav__icon" />
                        <span className="sidebar-submenu__label">{label}</span>
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="sidebar-section__header">
            <span>Account</span>
          </div>

          <div className="sidebar-section">
            <button
              type="button"
              className={`sidebar-parent${systemActive ? ' sidebar-parent--active' : ''}`}
              onClick={() => setSystemOpen((open) => !open)}
              aria-expanded={systemOpen}
              title="System"
              data-tooltip="System"
            >
              <Settings size={18} />
              <span className="sidebar-parent__label">System</span>
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
                        title={label}
                        data-tooltip={label}
                      >
                        <Icon className="sidebar-nav__icon" />
                        <span className="sidebar-submenu__label">{label}</span>
                      </NavLink>
                    ) : (
                      <button type="button" className="sidebar-submenu__item" title={label} data-tooltip={label}>
                        <Icon className="sidebar-nav__icon" />
                        <span className="sidebar-submenu__label">{label}</span>
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </nav>

        <Link to="/profile" className="sidebar-profile" onClick={closeSidebar} title={displayName} data-tooltip={displayName}>
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
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-pressed={sidebarCollapsed}
            aria-controls="dashboard-sidebar"
            onClick={toggleSidebar}
          >
            <Menu size={20} className={`dashboard-header__menu-icon${sidebarCollapsed ? ' dashboard-header__menu-icon--collapsed' : ''}`} />
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
