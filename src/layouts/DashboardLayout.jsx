import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ChevronDown,
  Menu,
  Search,
  Bell,
  User,
  LogOut,
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
import { usePreferences } from '../preferences/PreferencesContext';
import { preferenceStorage } from '../preferences/preferenceStorage';
import tccLogo from '../assets/tcc_logo.png';
import './DashboardLayout.css';

const MANAGEMENT_SUBMENU = [
  { labelKey: 'navSchedules', icon: CalendarDays, path: '/management/schedules' },
  { labelKey: 'navQuestionBank', icon: BookOpen, path: '/management/question-bank' },
  { labelKey: 'navStudents', icon: Users, path: '/management/students' },
  { labelKey: 'navProctors', icon: Shield, path: '/management/proctors' },
  { labelKey: 'navUsers', icon: UserCog, path: '/management/users', adminOnly: true },
  { labelKey: 'navLobby', icon: Building2, path: '/management/lobby' },
];

const RESULTS_ITEMS = [
  { labelKey: 'navExamResults', icon: ClipboardCheck, path: '/results/exam-results' },
  { labelKey: 'navReports', icon: LineChart, path: '/results/reports-analytics' },
  { labelKey: 'navEmail', icon: Mail, path: '/results/email-notification' },
];

const SYSTEM_ITEMS = [
  { labelKey: 'navSettings', icon: Settings, path: '/system/settings' },
  { labelKey: 'navLogs', icon: FileText, path: '/system/logs' },
  { labelKey: 'navBackup', icon: HardDrive, path: '/system/backup' },
  { labelKey: 'navImport', icon: Upload, path: '/system/import' },
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
  const { user, isAdmin, logout } = useAuth();
  const { t } = usePreferences();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => preferenceStorage.getSidebarCollapsed());
  const [managementOpen, setManagementOpen] = useState(true);
  const [resultsOpen, setResultsOpen] = useState(true);
  const [systemOpen, setSystemOpen] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  const displayName = user?.name || 'Administrator';
  const displayRole = user?.role?.name || 'Administrator';
  const initials = getInitials(displayName);

  const managementActive = location.pathname.startsWith('/management');
  const resultsActive = location.pathname.startsWith('/results');
  const systemActive = location.pathname.startsWith('/system');

  useEffect(() => {
    preferenceStorage.setSidebarCollapsed(sidebarCollapsed);
  }, [sidebarCollapsed]);

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

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } catch {
      // Session is cleared locally even if the API call fails.
    }
    // Hard redirect avoids ProtectedRoute racing to /login after user becomes null.
    window.location.replace('/');
  };

  return (
    <div className={`dashboard-app${sidebarCollapsed ? ' dashboard-app--sidebar-collapsed' : ''}`}>
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
            <span>{t('mainMenu')}</span>
          </div>

          <NavLink
            to="/dashboard"
            end
            className={navItemClass}
            onClick={closeSidebar}
            title={t('dashboard')}
            data-tooltip={t('dashboard')}
          >
            <LayoutDashboard className="sidebar-nav__icon" />
            <span className="sidebar-nav__label">{t('dashboard')}</span>
          </NavLink>

          <div className="sidebar-section__header">
            <span>{t('general')}</span>
          </div>

          <div className="sidebar-section">
            <button
              type="button"
              className={`sidebar-parent${managementActive ? ' sidebar-parent--active' : ''}`}
              onClick={() => setManagementOpen((open) => !open)}
              aria-expanded={managementOpen}
              aria-controls="management-submenu"
              title={t('management')}
              data-tooltip={t('management')}
            >
              <FolderKanban size={18} />
              <span className="sidebar-parent__label">{t('management')}</span>
              <ChevronDown
                className={`sidebar-parent__chevron${managementOpen ? ' sidebar-parent__chevron--open' : ''}`}
              />
            </button>

            {managementOpen && (
              <ul id="management-submenu" className="sidebar-submenu">
                {MANAGEMENT_SUBMENU.filter((item) => !item.adminOnly || isAdmin).map((item) => {
                  const label = t(item.labelKey);
                  return (
                    <li key={item.path}>
                      <NavLink
                        to={item.path}
                        className={({ isActive }) => submenuClass(isActive)}
                        onClick={closeSidebar}
                        title={label}
                        data-tooltip={label}
                      >
                        <item.icon className="sidebar-submenu__icon sidebar-nav__icon" />
                        <span className="sidebar-submenu__label">{label}</span>
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="sidebar-section">
            <button
              type="button"
              className={`sidebar-parent${resultsActive ? ' sidebar-parent--active' : ''}`}
              onClick={() => setResultsOpen((open) => !open)}
              aria-expanded={resultsOpen}
              title={t('resultsReports')}
              data-tooltip={t('resultsReports')}
            >
              <LineChart size={18} />
              <span className="sidebar-parent__label">{t('resultsReports')}</span>
              <ChevronDown
                className={`sidebar-parent__chevron${resultsOpen ? ' sidebar-parent__chevron--open' : ''}`}
              />
            </button>

            {resultsOpen && (
              <ul className="sidebar-submenu">
                {RESULTS_ITEMS.map(({ labelKey, icon: Icon, path }) => {
                  const label = t(labelKey);
                  return (
                    <li key={path}>
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
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="sidebar-section__header">
            <span>{t('account')}</span>
          </div>

          <div className="sidebar-section">
            <button
              type="button"
              className={`sidebar-parent${systemActive ? ' sidebar-parent--active' : ''}`}
              onClick={() => setSystemOpen((open) => !open)}
              aria-expanded={systemOpen}
              title={t('system')}
              data-tooltip={t('system')}
            >
              <Settings size={18} />
              <span className="sidebar-parent__label">{t('system')}</span>
              <ChevronDown className={`sidebar-parent__chevron${systemOpen ? ' sidebar-parent__chevron--open' : ''}`} />
            </button>

            {systemOpen && (
              <ul className="sidebar-submenu">
                {SYSTEM_ITEMS.map(({ labelKey, icon: Icon, path }) => {
                  const label = t(labelKey);
                  return (
                    <li key={path}>
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
                    </li>
                  );
                })}
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
        aria-label={t('closeSidebar')}
        onClick={closeSidebar}
        tabIndex={sidebarOpen ? 0 : -1}
      />

      <div className="dashboard-main">
        <header className="dashboard-header">
          <button
            type="button"
            className="dashboard-header__menu"
            aria-label={sidebarCollapsed ? t('expandSidebar') : t('collapseSidebar')}
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
              placeholder={t('searchPlaceholder')}
              aria-label={t('searchPlaceholder')}
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
              <span>{t('profileSettings')}</span>
              <ChevronDown className="dashboard-header__profile-chevron" />
            </Link>

            <button
              type="button"
              className="dashboard-header__logout"
              onClick={handleLogout}
              disabled={loggingOut}
            >
              <LogOut size={16} aria-hidden="true" />
              <span>{loggingOut ? t('loggingOut') : t('logout')}</span>
            </button>
          </div>
        </header>

        <div className="dashboard-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
