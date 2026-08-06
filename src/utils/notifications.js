const STORAGE_KEY = 'metcc.notifications.v1';

function seedNotifications() {
  const now = Date.now();
  return [
    {
      id: 'n1',
      title: 'New applicants registered',
      body: 'Review today\'s student list for upcoming exam batches.',
      href: '/management/students',
      createdAt: now - 1000 * 60 * 12,
      read: false,
    },
    {
      id: 'n2',
      title: 'Question bank reminder',
      body: 'Confirm the active school-year question bank before exam day.',
      href: '/management/question-bank',
      createdAt: now - 1000 * 60 * 55,
      read: false,
    },
    {
      id: 'n3',
      title: 'Schedule check',
      body: 'Verify room assignments and proctor coverage for tomorrow.',
      href: '/management/schedules',
      createdAt: now - 1000 * 60 * 60 * 5,
      read: false,
    },
    {
      id: 'n4',
      title: 'Results available',
      body: 'Recent exam batches are ready for review in Exam Results.',
      href: '/results/exam-results',
      createdAt: now - 1000 * 60 * 60 * 26,
      read: true,
    },
  ];
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = seedNotifications();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : seedNotifications();
  } catch {
    return seedNotifications();
  }
}

function save(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function getNotifications() {
  return load().sort((a, b) => b.createdAt - a.createdAt);
}

export function getUnreadCount() {
  return getNotifications().filter((n) => !n.read).length;
}

export function markNotificationRead(id) {
  const next = load().map((n) => (n.id === id ? { ...n, read: true } : n));
  save(next);
  return next;
}

export function markAllNotificationsRead() {
  const next = load().map((n) => ({ ...n, read: true }));
  save(next);
  return next;
}

export function formatNotificationTime(ts) {
  const diff = Math.max(0, Date.now() - ts);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
