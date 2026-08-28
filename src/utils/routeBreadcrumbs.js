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

const SEGMENT_LABELS = {
  dashboard: 'Dashboard',
  management: 'Management',
  schedules: 'Schedules',
  'question-bank': 'Question Bank',
  subjects: 'Subjects',
  'exam-preview': 'Exam Preview',
  students: 'Students',
  proctors: 'Proctors',
  users: 'Users',
  lobby: 'Lobby',
  results: 'Results',
  'exam-results': 'Exam Results',
  'reports-analytics': 'Reports & Analytics',
  system: 'System',
  settings: 'Settings',
  logs: 'Logs',
  backup: 'Backup',
  import: 'Import',
  profile: 'Profile',
  'change-password': 'Change Password',
  'test-items': 'Test Items',
  create: 'Create',
  edit: 'Edit',
  admin: 'Admin',
};

/**
 * Build breadcrumb trail from a pathname.
 * Uses explicit route patterns so trails stay short and readable
 * (no duplicate "Question Bank → Question bank → Subjects → Subject").
 * @param {string} pathname
 * @returns {{ label: string, to?: string }[]}
 */
export function buildBreadcrumbs(pathname) {
  const clean = (pathname || '/').split('?')[0].replace(/\/+$/, '') || '/';

  const home = { label: 'Home', to: '/dashboard' };

  const patterns = [
    {
      test: /^\/dashboard$/,
      crumbs: [home, { label: 'Dashboard' }],
    },
    {
      test: /^\/management\/schedules$/,
      crumbs: [home, { label: 'Management', to: '/management/schedules' }, { label: 'Schedules' }],
    },
    {
      test: /^\/management\/schedules\/([^/]+)$/,
      crumbs: [
        home,
        { label: 'Management', to: '/management/schedules' },
        { label: 'Schedules', to: '/management/schedules' },
        { label: 'Schedule' },
      ],
    },
    {
      test: /^\/management\/question-bank$/,
      crumbs: [home, { label: 'Management', to: '/management/question-bank' }, { label: 'Question Bank' }],
    },
    {
      test: /^\/management\/question-bank\/([^/]+)\/exam-preview$/,
      crumbs: (m) => [
        home,
        { label: 'Management', to: '/management/question-bank' },
        { label: 'Question Bank', to: '/management/question-bank' },
        { label: 'Bank', to: `/management/question-bank/${m[1]}` },
        { label: 'Exam Preview' },
      ],
    },
    {
      test: /^\/management\/question-bank\/([^/]+)\/subjects\/([^/]+)$/,
      crumbs: (m) => [
        home,
        { label: 'Management', to: '/management/question-bank' },
        { label: 'Question Bank', to: '/management/question-bank' },
        { label: 'Bank', to: `/management/question-bank/${m[1]}` },
        { label: 'Category' },
      ],
    },
    {
      test: /^\/management\/question-bank\/([^/]+)\/([^/]+)$/,
      crumbs: (m) => [
        home,
        { label: 'Management', to: '/management/question-bank' },
        { label: 'Question Bank', to: '/management/question-bank' },
        { label: 'Bank', to: `/management/question-bank/${m[1]}` },
        { label: 'Subject' },
      ],
    },
    {
      test: /^\/management\/question-bank\/([^/]+)$/,
      crumbs: (m) => [
        home,
        { label: 'Management', to: '/management/question-bank' },
        { label: 'Question Bank', to: '/management/question-bank' },
        { label: 'Bank', to: `/management/question-bank/${m[1]}` },
        { label: 'Overview' },
      ],
    },
    {
      test: /^\/management\/students$/,
      crumbs: [home, { label: 'Management', to: '/management/students' }, { label: 'Students' }],
    },
    {
      test: /^\/management\/proctors$/,
      crumbs: [home, { label: 'Management', to: '/management/proctors' }, { label: 'Proctors' }],
    },
    {
      test: /^\/management\/proctors\/([^/]+)$/,
      crumbs: [home, { label: 'Management', to: '/management/proctors' }, { label: 'Proctors', to: '/management/proctors' }, { label: 'Assignment' }],
    },
    {
      test: /^\/management\/users$/,
      crumbs: [home, { label: 'Management', to: '/management/users' }, { label: 'Users' }],
    },
    {
      test: /^\/management\/lobby$/,
      crumbs: [home, { label: 'Management', to: '/management/lobby' }, { label: 'Lobby' }],
    },
    {
      test: /^\/results\/exam-results$/,
      crumbs: [home, { label: 'Results', to: '/results/exam-results' }, { label: 'Exam Results' }],
    },
    {
      test: /^\/results\/reports-analytics$/,
      crumbs: [home, { label: 'Results', to: '/results/reports-analytics' }, { label: 'Reports & Analytics' }],
    },
    {
      test: /^\/system\/settings$/,
      crumbs: [home, { label: 'System', to: '/system/settings' }, { label: 'Settings' }],
    },
    {
      test: /^\/system\/logs$/,
      crumbs: [home, { label: 'System', to: '/system/logs' }, { label: 'Logs' }],
    },
    {
      test: /^\/system\/backup$/,
      crumbs: [home, { label: 'System', to: '/system/backup' }, { label: 'Backup' }],
    },
    {
      test: /^\/system\/import$/,
      crumbs: [home, { label: 'System', to: '/system/import' }, { label: 'Import' }],
    },
    {
      test: /^\/profile\/change-password$/,
      crumbs: [home, { label: 'Profile', to: '/profile' }, { label: 'Change Password' }],
    },
    {
      test: /^\/profile$/,
      crumbs: [home, { label: 'Profile' }],
    },
    {
      test: /^\/admin\/users\/create$/,
      crumbs: [home, { label: 'Admin', to: '/admin/users' }, { label: 'Users', to: '/admin/users' }, { label: 'Create' }],
    },
    {
      test: /^\/admin\/users\/([^/]+)\/edit$/,
      crumbs: (m) => [
        home,
        { label: 'Admin', to: '/admin/users' },
        { label: 'Users', to: '/admin/users' },
        { label: 'User', to: `/admin/users/${m[1]}` },
        { label: 'Edit' },
      ],
    },
    {
      test: /^\/admin\/users\/([^/]+)$/,
      crumbs: [
        home,
        { label: 'Admin', to: '/admin/users' },
        { label: 'Users', to: '/admin/users' },
        { label: 'User' },
      ],
    },
    {
      test: /^\/admin\/users$/,
      crumbs: [home, { label: 'Admin', to: '/admin/users' }, { label: 'Users' }],
    },
    {
      test: /^\/test-items\/create$/,
      crumbs: [home, { label: 'Test Items', to: '/test-items' }, { label: 'Create' }],
    },
    {
      test: /^\/test-items\/([^/]+)\/edit$/,
      crumbs: (m) => [
        home,
        { label: 'Test Items', to: '/test-items' },
        { label: 'Item', to: `/test-items/${m[1]}` },
        { label: 'Edit' },
      ],
    },
    {
      test: /^\/test-items\/([^/]+)$/,
      crumbs: [home, { label: 'Test Items', to: '/test-items' }, { label: 'Item' }],
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

  // Fallback for unknown routes: skip raw id segments and structural fillers.
  const parts = clean.split('/').filter(Boolean);
  if (parts.length === 0) return [home];

  const crumbs = [home];
  let acc = '';
  const skipSegments = new Set(['subjects']);

  parts.forEach((segment, index) => {
    acc += `/${segment}`;
    const isLast = index === parts.length - 1;
    const isIdLike = /^\d+$/.test(segment) || /^[0-9a-f-]{8,}$/i.test(segment);

    if (!isLast && skipSegments.has(segment)) return;

    let label = SEGMENT_LABELS[segment];
    if (!label) {
      if (isIdLike) {
        const parent = parts[index - 1];
        if (parent === 'schedules') label = 'Schedule';
        else if (parent === 'question-bank') label = 'Bank';
        else if (parent === 'subjects') label = 'Category';
        else if (parent === 'users') label = 'User';
        else if (parent === 'test-items') label = 'Item';
        else label = 'Details';
      } else {
        label = segment
          .split('-')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
      }
    }

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
