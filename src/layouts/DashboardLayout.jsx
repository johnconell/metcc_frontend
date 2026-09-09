import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ChevronDown,
  Menu,
  Search,
  Bell,
  Moon,
  Sun,
  User,
  LogOut,
  FolderKanban,
  ClipboardCheck,
  LineChart,
  Settings,
  SlidersHorizontal,
  FileText,
  HardDrive,
  Upload,
  CalendarDays,
  BookOpen,
  Users,
  Shield,
  UserCog,
  Building2,
  CheckCheck,
} from 'lucide-react';
import { useAuth } from '../auth/useAuth';
import { usePreferences } from '../preferences/PreferencesContext';
import { preferenceStorage } from '../preferences/preferenceStorage';
import { AppBreadcrumbs } from '../components/layout/AppBreadcrumbs';
import {
  formatNotificationTime,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../utils/notifications';
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
];

const SYSTEM_ITEMS = [
  { labelKey: 'navSettings', icon: SlidersHorizontal, path: '/system/settings' },
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
  const { t, resolvedTheme, setTheme } = usePreferences();
  const location = useLocation();
  const navigate = useNavigate();
  const notifyWrapRef = useRef(null);
  const searchWrapRef = useRef(null);
  const profileWrapRef = useRef(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => preferenceStorage.getSidebarCollapsed());
  const initialSections = useMemo(() => preferenceStorage.getSidebarSections(), []);
  const [managementOpen, setManagementOpen] = useState(initialSections.management);
  const [resultsOpen, setResultsOpen] = useState(initialSections.results);
  const [systemOpen, setSystemOpen] = useState(initialSections.system);
  const [loggingOut, setLoggingOut] = useState(false);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [notifications, setNotifications] = useState(() => getNotifications());
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const displayName = user?.name || 'Administrator';
  const displayRole = user?.role?.name || 'Administrator';
  const initials = getInitials(displayName);
  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const managementActive = location.pathname.startsWith('/management');
  const resultsActive = location.pathname.startsWith('/results');
  const systemActive = location.pathname.startsWith('/system');

  const searchItems = useMemo(() => {
    const items = [
      { key: 'dashboard', label: t('dashboard'), meta: t('mainMenu'), path: '/dashboard' },
      ...MANAGEMENT_SUBMENU
        .filter((item) => !item.adminOnly || isAdmin)
        .map((item) => ({ key: item.path, label: t(item.labelKey), meta: t('management'), path: item.path })),
      ...RESULTS_ITEMS.map((item) => ({ key: item.path, label: t(item.labelKey), meta: t('resultsReports'), path: item.path })),
      ...SYSTEM_ITEMS.map((item) => ({ key: item.path, label: t(item.labelKey), meta: t('system'), path: item.path })),
      { key: 'profile', label: t('profileSettings'), meta: t('account'), path: '/profile' },
      { key: 'change-password', label: t('changePassword'), meta: t('account'), path: '/profile/change-password' },
    ];

    return items;
  }, [isAdmin, t]);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return searchItems;

    return searchItems.filter((item) => {
      const label = item.label.toLowerCase();
      const meta = item.meta.toLowerCase();
      const path = item.path.toLowerCase();
      return label.includes(q) || meta.includes(q) || path.includes(q);
    });
  }, [searchItems, searchQuery]);

  useEffect(() => {
    preferenceStorage.setSidebarCollapsed(sidebarCollapsed);
  }, [sidebarCollapsed]);

  useEffect(() => {
    preferenceStorage.setSidebarSections({
      management: managementOpen,
      results: resultsOpen,
      system: systemOpen,
    });
  }, [managementOpen, resultsOpen, systemOpen]);

  useEffect(() => {
    setNotifyOpen(false);
    setSearchOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!notifyOpen && !searchOpen && !profileOpen) return undefined;

    const onPointerDown = (event) => {
      if (notifyOpen && notifyWrapRef.current && !notifyWrapRef.current.contains(event.target)) {
        setNotifyOpen(false);
      }
      if (searchOpen && searchWrapRef.current && !searchWrapRef.current.contains(event.target)) {
        setSearchOpen(false);
      }
      if (profileOpen && profileWrapRef.current && !profileWrapRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [notifyOpen, searchOpen, profileOpen]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (searchOpen) setSearchOpen(false);
        if (notifyOpen) setNotifyOpen(false);
        if (profileOpen) setProfileOpen(false);
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [searchOpen, notifyOpen, profileOpen]);

  const closeSidebar = () => {
    if (sidebarOpen) setSidebarOpen(false);
  };
  const toggleSidebar = () => {
    if (window.innerWidth <= 768) {
      setSidebarCollapsed(false);
      setSidebarOpen((open) => !open);
      return;
    }

    setSidebarOpen(false);
    setSidebarCollapsed((collapsed) => !collapsed);
  };

  const refreshNotifications = () => {
    setNotifications(getNotifications());
  };

  const openNotifications = () => {
    refreshNotifications();
    setNotifyOpen((open) => !open);
  };

  const handleNotificationClick = (item) => {
    markNotificationRead(item.id);
    refreshNotifications();
    setNotifyOpen(false);
    if (item.href) navigate(item.href);
  };

  const handleMarkAllRead = () => {
    markAllNotificationsRead();
    refreshNotifications();
  };

  const handleSearchNavigate = (path) => {
    setSearchOpen(false);
    setSearchQuery('');
    navigate(path);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    if (searchResults.length === 0) return;
    handleSearchNavigate(searchResults[0].path);
  };

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
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

          <div className="dashboard-header__search" ref={searchWrapRef}>
            <form onSubmit={handleSearchSubmit}>
              <Search className="dashboard-header__search-icon" />
              <input
                type="search"
                className="dashboard-header__search-input"
                placeholder={t('searchPlaceholder')}
                aria-label={t('searchPlaceholder')}
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setSearchOpen(true);
                }}
                onFocus={() => setSearchOpen(true)}
                aria-expanded={searchOpen}
                aria-controls="dashboard-header-search-panel"
                autoComplete="off"
              />
            </form>

            {searchOpen && (
              <div id="dashboard-header-search-panel" className="dashboard-header__search-panel" role="listbox" aria-label="Header search results">
                {searchResults.length === 0 ? (
                  <p className="dashboard-header__search-empty">No matches found.</p>
                ) : (
                  searchResults.map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      className="dashboard-header__search-item"
                      onClick={() => handleSearchNavigate(item.path)}
                    >
                      <span className="dashboard-header__search-item-title">{item.label}</span>
                      <span className="dashboard-header__search-item-meta">{item.meta}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="dashboard-header__actions">
            <button
              type="button"
              className="dashboard-header__theme-toggle"
              onClick={toggleTheme}
              aria-label={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              title={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {resolvedTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <div className="dashboard-header__notify-wrap" ref={notifyWrapRef}>
              <button
                type="button"
                className={`dashboard-header__notify${notifyOpen ? ' dashboard-header__notify--open' : ''}`}
                aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
                aria-expanded={notifyOpen}
                aria-controls="header-notifications"
                onClick={openNotifications}
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="dashboard-header__badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
              </button>

              {notifyOpen && (
                <div id="header-notifications" className="dashboard-header__notify-panel" role="dialog" aria-label="Notifications">
                  <div className="dashboard-header__notify-head">
                    <strong>Notifications</strong>
                    <button
                      type="button"
                      className="dashboard-header__notify-mark"
                      onClick={handleMarkAllRead}
                      disabled={unreadCount === 0}
                    >
                      <CheckCheck size={14} aria-hidden="true" />
                      Mark all read
                    </button>
                  </div>
                  <div className="dashboard-header__notify-list">
                    {notifications.length === 0 ? (
                      <p className="dashboard-header__notify-empty">You are all caught up.</p>
                    ) : (
                      notifications.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          className={`dashboard-header__notify-item${item.read ? '' : ' is-unread'}`}
                          onClick={() => handleNotificationClick(item)}
                        >
                          <span className="dashboard-header__notify-item-title">{item.title}</span>
                          <span className="dashboard-header__notify-item-body">{item.body}</span>
                          <span className="dashboard-header__notify-item-time">{formatNotificationTime(item.createdAt)}</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="dashboard-header__profile-wrap" ref={profileWrapRef}>
              <button
                type="button"
                className={`dashboard-header__profile${profileOpen ? ' dashboard-header__profile--open' : ''}`}
                onClick={() => setProfileOpen((open) => !open)}
                aria-expanded={profileOpen}
                aria-haspopup="menu"
              >
                <span className="dashboard-header__profile-avatar">
                  {user?.profile_photo_url ? <img src={user.profile_photo_url} alt="" /> : <User size={16} />}
                </span>
                <span>{t('profileSettings')}</span>
                <ChevronDown className="dashboard-header__profile-chevron" />
              </button>

              {profileOpen && (
                <div className="dashboard-header__profile-menu" role="menu" aria-label="Profile menu">
                  <div className="dashboard-header__profile-menu-user">
                    <span className="dashboard-header__profile-menu-avatar">{initials}</span>
                    <span><strong>{displayName}</strong><small>{displayRole}</small></span>
                  </div>
                  <Link to="/profile" role="menuitem" onClick={() => setProfileOpen(false)}>Profile Settings</Link>
                  <Link to="/system/settings" role="menuitem" onClick={() => setProfileOpen(false)}>Settings &amp; privacy</Link>
                  <button type="button" role="menuitem" onClick={handleLogout} disabled={loggingOut}>
                    <LogOut size={16} /> {loggingOut ? t('loggingOut') : t('logout')}
                  </button>
                </div>
              )}
            </div>

          </div>
        </header>

        <div className="dashboard-content">
          <AppBreadcrumbs pathname={location.pathname} />
          <Outlet />
        </div>
      </div>
    </div>
  );
}
