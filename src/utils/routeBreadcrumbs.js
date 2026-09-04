/** Route label map for dashboard breadcrumbs and global search. */

export const ROUTE_SEARCH_INDEX = [
  { path: '/dashboard', title: 'Dashboard', keywords: ['home', 'overview', 'stats'], group: 'Main' },
  { path: '/management/schedules', title: 'Schedules', keywords: ['exam', 'schedule', 'calendar', 'batch'], group: 'Management' },
  { path: '/management/question-bank', title: 'Question Bank', keywords: ['questions', 'subjects', 'categories', 'exam'], group: 'Management' },
  { path: '/management/students', title: 'Students', keywords: ['applicants', 'examinees', 'students', 'list'], group: 'Management' },
  { path: '/management/proctors', title: 'Proctors', keywords: ['proctor', 'staff', 'invigilator'], group: 'Management' },
  { path: '/management/users', title: 'Users', keywords: ['accounts', 'admin', 'roles'], group: 'Management', adminOnly: true },
  { path: '/management/lobby', title: 'Lobby', keywords: ['waiting', 'lobby', 'room'], group: 'Management' },
  { path: '/results/exam-results', title: 'Exam Results', keywords: ['scores', 'results', 'grades'], group: 'Results' },
  { path: '/results/reports-analytics', title: 'Reports & Analytics', keywords: ['reports', 'analytics', 'charts'], group: 'Results' },
  { path: '/system/settings', title: 'Settings', keywords: ['preferences', 'configuration'], group: 'System' },
  { path: '/system/logs', title: 'Logs', keywords: ['activity', 'audit', 'history'], group: 'System' },
  { path: '/system/backup', title: 'Backup', keywords: ['backup', 'restore', 'export'], group: 'System' },
  { path: '/system/import', title: 'Import', keywords: ['import', 'upload', 'csv'], group: 'System' },
  { path: '/profile', title: 'Profile Settings', keywords: ['account', 'password', 'photo'], group: 'Account' },
];

/**
 * Build breadcrumb trail from a pathname.
 * Returns only functional, valid, non-redundant paths.
 * @param {string} pathname
 * @returns {{ label: string, to?: string }[]}
 */
export function buildBreadcrumbs(pathname) {
  const clean = (pathname || '/').split('?')[0].replace(/\/+$/, '') || '/';

  const home = { label: 'Dashboard', to: '/dashboard' };

  const patterns = [
    {
      test: /^\/dashboard$/,
      crumbs: [home],
    },
    // Schedules & Passkeys
    {
      test: /^\/management\/schedules\/by-date\/([^/]+)\/passkeys$/,
      crumbs: () => [
        home,
        { label: 'Schedules', to: '/management/schedules' },
        { label: 'Examination Keys' },
      ],
    },
    {
      test: /^\/management\/schedules\/([^/]+)\/passkeys$/,
      crumbs: (m) => [
        home,
        { label: 'Schedules', to: '/management/schedules' },
        { label: 'Schedule Details', to: `/management/schedules/${m[1]}` },
        { label: 'Examination Keys' },
      ],
    },
    {
      test: /^\/management\/schedules\/([^/]+)$/,
      crumbs: [
        home,
        { label: 'Schedules', to: '/management/schedules' },
        { label: 'Schedule Details' },
      ],
    },
    {
      test: /^\/management\/schedules$/,
      crumbs: [home, { label: 'Schedules' }],
    },

    // Question Bank
    {
      test: /^\/management\/question-bank\/([^/]+)\/exam-preview$/,
      crumbs: (m) => [
        home,
        { label: 'Question Bank', to: '/management/question-bank' },
        { label: 'Bank Overview', to: `/management/question-bank/${m[1]}` },
        { label: 'Exam Preview' },
      ],
    },
    {
      test: /^\/management\/question-bank\/([^/]+)\/subjects\/([^/]+)$/,
      crumbs: (m) => [
        home,
        { label: 'Question Bank', to: '/management/question-bank' },
        { label: 'Bank Overview', to: `/management/question-bank/${m[1]}` },
        { label: 'Subject Questions' },
      ],
    },
    {
      test: /^\/management\/question-bank\/([^/]+)$/,
      crumbs: [
        home,
        { label: 'Question Bank', to: '/management/question-bank' },
        { label: 'Bank Overview' },
      ],
    },
    {
      test: /^\/management\/question-bank$/,
      crumbs: [home, { label: 'Question Bank' }],
    },

    // Other Management
    {
      test: /^\/management\/students$/,
      crumbs: [home, { label: 'Students' }],
    },
    {
      test: /^\/management\/proctors\/([^/]+)$/,
      crumbs: [
        home,
        { label: 'Proctors', to: '/management/proctors' },
        { label: 'Proctor Details' },
      ],
    },
    {
      test: /^\/management\/proctors$/,
      crumbs: [home, { label: 'Proctors' }],
    },
    {
      test: /^\/management\/users$/,
      crumbs: [home, { label: 'Users' }],
    },
    {
      test: /^\/management\/lobby$/,
      crumbs: [home, { label: 'Lobby' }],
    },

    // Results
    {
      test: /^\/results\/exam-results$/,
      crumbs: [home, { label: 'Exam Results' }],
    },
    {
      test: /^\/results\/reports-analytics$/,
      crumbs: [home, { label: 'Reports & Analytics' }],
    },

    // System
    {
      test: /^\/system\/settings$/,
      crumbs: [home, { label: 'Settings' }],
    },
    {
      test: /^\/system\/logs$/,
      crumbs: [home, { label: 'Logs' }],
    },
    {
      test: /^\/system\/backup$/,
      crumbs: [home, { label: 'Backup' }],
    },
    {
      test: /^\/system\/import$/,
      crumbs: [home, { label: 'Import' }],
    },

    // Profile
    {
      test: /^\/profile\/change-password$/,
      crumbs: [
        home,
        { label: 'Profile', to: '/profile' },
        { label: 'Change Password' },
      ],
    },
    {
      test: /^\/profile$/,
      crumbs: [home, { label: 'Profile Settings' }],
    },

    // Admin Users
    {
      test: /^\/admin\/users\/create$/,
      crumbs: [
        home,
        { label: 'Users', to: '/admin/users' },
        { label: 'Create User' },
      ],
    },
    {
      test: /^\/admin\/users\/([^/]+)\/edit$/,
      crumbs: (m) => [
        home,
        { label: 'Users', to: '/admin/users' },
        { label: 'User Details', to: `/admin/users/${m[1]}` },
        { label: 'Edit User' },
      ],
    },
    {
      test: /^\/admin\/users\/([^/]+)$/,
      crumbs: [
        home,
        { label: 'Users', to: '/admin/users' },
        { label: 'User Details' },
      ],
    },
    {
      test: /^\/admin\/users$/,
      crumbs: [home, { label: 'Users' }],
    },

    // Test Items
    {
      test: /^\/test-items\/create$/,
      crumbs: [
        home,
        { label: 'Test Items', to: '/test-items' },
        { label: 'Create Item' },
      ],
    },
    {
      test: /^\/test-items\/([^/]+)\/edit$/,
      crumbs: (m) => [
        home,
        { label: 'Test Items', to: '/test-items' },
        { label: 'Item Details', to: `/test-items/${m[1]}` },
        { label: 'Edit Item' },
      ],
    },
    {
      test: /^\/test-items\/([^/]+)$/,
      crumbs: [
        home,
        { label: 'Test Items', to: '/test-items' },
        { label: 'Item Details' },
      ],
    },
    {
      test: /^\/test-items$/,
      crumbs: [home, { label: 'Test Items' }],
    },
  ];

  for (const pattern of patterns) {
    const match = clean.match(pattern.test);
    if (!match) continue;
    return typeof pattern.crumbs === 'function' ? pattern.crumbs(match) : pattern.crumbs;
  }

  // Fallback for unknown routes
  const parts = clean.split('/').filter(Boolean);
  if (parts.length === 0) return [];

  const crumbs = [home];
  let acc = '';

  parts.forEach((segment, index) => {
    acc += `/${segment}`;
    const isLast = index === parts.length - 1;
    const label = segment
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

    crumbs.push(isLast ? { label } : { label, to: acc });
  });

  return crumbs;
}

/**
 * @param {string} query
 * @param {{ isAdmin?: boolean }} options
 */
export function searchAppRoutes(query, { isAdmin = false } = {}) {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  return ROUTE_SEARCH_INDEX
    .filter((item) => !item.adminOnly || isAdmin)
    .map((item) => {
      const haystack = [item.title, item.group, ...(item.keywords || [])].join(' ').toLowerCase();
      const score =
        (item.title.toLowerCase().startsWith(q) ? 30 : 0)
        + (item.title.toLowerCase().includes(q) ? 20 : 0)
        + (haystack.includes(q) ? 10 : 0)
        + (item.keywords?.some((k) => k.startsWith(q)) ? 15 : 0);
      return { ...item, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);
}
