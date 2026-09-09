import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  BarChart3,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileCheck,
  Mail,
  Settings,
  Shield,
  UserCheck,
  UserCog,
  Users,
  Zap,
} from 'lucide-react';
import { dashboardApi } from '../../api/dashboardApi';
import { useAuth } from '../../auth/useAuth';
import { Skeleton, SkeletonText } from '../../components/ui/Skeleton';
import './DashboardPage.css';

const QUICK_ACTIONS = [
  {
    title: 'Create Examination',
    subtitle: 'Set up rooms & time slots',
    icon: Calendar,
    color: 'maroon',
    path: '/management/schedules',
  },
  {
    title: 'Manage Schedules',
    subtitle: 'Daily 400–500 examinees',
    icon: ClipboardList,
    color: 'gold',
    path: '/management/schedules',
  },
  {
    title: 'Applicant List',
    subtitle: 'View registered examinees',
    icon: Users,
    color: 'maroon',
    path: '/management/students',
  },
  {
    title: 'Manage Proctors',
    subtitle: '3–4 proctors per wave',
    icon: Shield,
    color: 'gold',
    path: '/management/proctors',
  },
  {
    title: 'Exam Results',
    subtitle: 'Pass / fail outcomes',
    icon: FileCheck,
    color: 'maroon',
    path: '/results/exam-results',
  },
  {
    title: 'Reports',
    subtitle: 'Analytics & reports',
    icon: BarChart3,
    color: 'gold',
    path: '/results/reports-analytics',
  },
  {
    title: 'Manage Users',
    subtitle: 'Admin accounts',
    icon: UserCog,
    color: 'maroon',
    path: '/management/users',
  },
  {
    title: 'System Settings',
    subtitle: 'Portal configuration',
    icon: Settings,
    color: 'gold',
    path: '/system/settings',
  },
];

const ACTIVITY_STYLE = {
  applicant_registered: { icon: Users, iconBg: '#e8f5ee', iconColor: '#16a34a', dotColor: '#16a34a' },
  schedule_updated: { icon: Calendar, iconBg: '#fef3e6', iconColor: '#d97706', dotColor: '#d97706' },
  schedule_created: { icon: ClipboardList, iconBg: '#e8f0fe', iconColor: '#2563eb', dotColor: '#2563eb' },
  exam_started: { icon: Activity, iconBg: '#fef3e6', iconColor: '#d97706', dotColor: '#d97706' },
  result_recorded: { icon: FileCheck, iconBg: '#e8f5ee', iconColor: '#16a34a', dotColor: '#16a34a' },
  proctor_assigned: { icon: Shield, iconBg: '#f3e8fd', iconColor: '#9333ea', dotColor: '#9333ea' },
  user_login: { icon: UserCheck, iconBg: '#f3e8fd', iconColor: '#9333ea', dotColor: '#9333ea' },
  default: { icon: Mail, iconBg: '#fce8ec', iconColor: '#c4455a', dotColor: '#c4455a' },
};

function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}



function PerformanceChart({ points = [], average = 0, max = 500 }) {
  const W = 640;
  const H = 220;
  const padL = 48;
  const padR = 16;
  const padT = 12;
  const padB = 36;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;
  const yMax = Math.max(max, 100);

  if (!points.length) {
    return <div className="dashboard-empty">No examinee volume data yet.</div>;
  }

  const toX = (i) => padL + (points.length === 1 ? chartW / 2 : (i / (points.length - 1)) * chartW);
  const toY = (v) => padT + chartH - (v / yMax) * chartH;
  const linePoints = points.map((d, i) => `${toX(i)},${toY(d.value)}`).join(' ');
  const avgY = toY(average);
  const yLabels = [
    { value: yMax, label: `${Math.round(yMax / 100) / 10}K`.replace('.0K', 'K') },
    { value: Math.round(yMax * 0.75), label: String(Math.round(yMax * 0.75)) },
    { value: Math.round(yMax * 0.5), label: String(Math.round(yMax * 0.5)) },
    { value: Math.round(yMax * 0.25), label: String(Math.round(yMax * 0.25)) },
    { value: 0, label: '0' },
  ];

  return (
    <div className="dashboard-chart-body">
      <svg className="dashboard-chart-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Daily examinee volume">
        {yLabels.map(({ value, label }) => {
          const y = toY(value);
          return (
            <g key={value}>
              <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="#E9E3DE" strokeWidth="1" strokeDasharray={value === 0 ? '0' : '4 4'} />
              <text x={padL - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#9a9490">{label}</text>
            </g>
          );
        })}
        <line x1={padL} y1={avgY} x2={W - padR} y2={avgY} stroke="#C98A18" strokeWidth="2" strokeDasharray="6 5" />
        <polyline points={linePoints} fill="none" stroke="#7B1020" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {points.map((d, i) => (
          <circle key={d.label} cx={toX(i)} cy={toY(d.value)} r="4.5" fill="#7B1020" stroke="#fff" strokeWidth="2" />
        ))}
        {points.map((d, i) => (
          <text key={`label-${d.label}`} x={toX(i)} y={H - 10} textAnchor="middle" fontSize="9.5" fill="#9a9490">
            {d.label}
          </text>
        ))}
      </svg>
    </div>
  );
}

function QuickAction({ action }) {
  const Icon = action.icon;
  const content = (
    <>
      <div className={`dashboard-quick-action__icon dashboard-quick-action__icon--${action.color}`}>
        <Icon size={18} />
      </div>
      <div className="dashboard-quick-action__text">
        <div className="dashboard-quick-action__title">{action.title}</div>
        <div className="dashboard-quick-action__subtitle">{action.subtitle}</div>
      </div>
      <ChevronRight className="dashboard-quick-action__chevron" />
    </>
  );

  return (
    <Link to={action.path} className="dashboard-quick-action">
      {content}
    </Link>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 5;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const { data: response } = await dashboardApi.getOverview();
        if (!cancelled) setData(response.data);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Unable to load dashboard.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const schedules = data?.upcoming_schedules || [];
  const totalPages = Math.max(1, Math.ceil(schedules.length / pageSize));
  const pageRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return schedules.slice(start, start + pageSize);
  }, [schedules, page]);

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [page, totalPages]);

  const stats = data?.stats || {};
  const firstName = user?.name?.split(' ')[0] || 'Administrator';

  const statCards = [
    {
      label: 'Total Applicants',
      value: formatNumber(stats.total_applicants ?? stats.total_examinees),
      trendSymbol: '▲',
      trendText: stats.pending_registrations
        ? `${formatNumber(stats.pending_registrations)} pending`
        : '3.2% vs last week',
      icon: Users,
      theme: 'green',
      bars: [7, 10, 8, 13, 16, 20],
    },
    {
      label: 'Scheduled Examinees',
      value: formatNumber(stats.scheduled_examinees ?? stats.active_sessions),
      trendSymbol: '▲',
      trendText: stats.examinees_today
        ? `${formatNumber(stats.examinees_today)} scheduled today`
        : '2 new since 6am',
      icon: Calendar,
      theme: 'orange',
      bars: [6, 9, 13, 10, 15, 18],
    },
    {
      label: 'Completed Examinations',
      value: formatNumber(stats.completed_examinations ?? stats.completed_exams),
      trendSymbol: '▲',
      trendText: stats.total_present
        ? `${formatNumber(stats.total_present)} confirmed present`
        : '1.8 pts this month',
      icon: FileCheck,
      theme: 'amber',
      bars: [8, 12, 11, 15, 17, 21],
    },
    {
      label: 'Passed Applicants',
      value: formatNumber(stats.passed_applicants ?? stats.total_passed),
      trendSymbol: '●',
      trendText: stats.results_sent
        ? `${formatNumber(stats.results_sent)} results emailed`
        : '5 high-priority',
      icon: UserCheck,
      theme: 'purple',
      bars: [6, 10, 14, 11, 18, 22],
    },
  ];

  if (loading) {
    return (
      <div className="dashboard-skeleton" aria-busy="true" aria-label="Loading dashboard">
        <div className="dashboard-skeleton__header">
          <Skeleton className="ui-skeleton--page-title" />
          <Skeleton className="ui-skeleton--lede" style={{ width: '70%', marginTop: 12 }} />
        </div>
        <div className="dashboard-skeleton__stats">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="dashboard-skeleton__stat">
              <Skeleton className="ui-skeleton--stat" />
              <Skeleton className="ui-skeleton--label" />
              <Skeleton className="ui-skeleton--line" style={{ width: '55%', marginTop: 10 }} />
            </div>
          ))}
        </div>
        <div className="dashboard-skeleton__grid">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="dashboard-skeleton__card">
              <Skeleton className="ui-skeleton--icon" />
              <Skeleton className="ui-skeleton--title" />
              <SkeletonText lines={2} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="dashboard-state dashboard-state--error" role="alert">{error}</div>;
  }

  return (
    <>
      <header className="dashboard-page-header">
        <h1>Dashboard</h1>
        <p>
          Welcome back, {firstName}. Monitor examinations, applicants, schedules, and key activity in one place.
        </p>
      </header>

      <section className="dashboard-stats" aria-label="Statistics overview">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <article key={card.label} className={`dashboard-stat-card dashboard-stat-card--${card.theme}`}>
              <div className="dashboard-stat-card__icon-badge">
                <Icon size={18} />
              </div>
              <span className="dashboard-stat-card__label">{card.label}</span>
              <div className="dashboard-stat-card__bottom-row">
                <div className="dashboard-stat-card__metric">
                  <div className="dashboard-stat-card__value">{card.value}</div>
                  <div className="dashboard-stat-card__trend">
                    <span className="dashboard-stat-card__trend-symbol">{card.trendSymbol}</span>
                    <span>{card.trendText}</span>
                  </div>
                </div>
                <div className="dashboard-stat-card__bars" aria-hidden="true">
                  {card.bars.map((height, i) => (
                    <span key={i} style={{ height: `${height}px` }} />
                  ))}
                </div>
              </div>
            </article>
          );
        })}
      </section>

      <section className="dashboard-card dashboard-card--full" aria-label="Upcoming Examination Schedule">
          <div className="dashboard-card__header">
            <div className="dashboard-card__title-group">
              <div className="dashboard-card__title-icon"><Calendar size={17} /></div>
              <h2 className="dashboard-card__title">Upcoming Examination Schedule</h2>
            </div>
            <Link to="/management/schedules" className="dashboard-card__btn">View all</Link>
          </div>

          <div className="dashboard-table-wrap">
            <table className="dashboard-table dashboard-table--compact">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Room</th>
                  <th>Program</th>
                  <th>Examinees</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="dashboard-empty-cell">No upcoming examination schedules.</td>
                  </tr>
                ) : pageRows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <Link to={`/management/schedules/${row.id}`} className="dashboard-batch-link">
                        <strong>{row.date_label || row.exam_date}</strong>
                      </Link>
                    </td>
                    <td>{row.time_slot || row.start_time || '—'}</td>
                    <td title={row.rooms_label}>{row.rooms_label || `${row.room_count || 0} rooms`}</td>
                    <td>{row.course || 'General'}</td>
                    <td>{formatNumber(row.registered_count || row.expected_examinees)}</td>
                    <td>
                      <span className={`dashboard-badge dashboard-badge--${String(row.status).toLowerCase()}`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="dashboard-pagination">
            <span>
              Showing {schedules.length === 0 ? 0 : (page - 1) * pageSize + 1}
              {' '}to {Math.min(page * pageSize, schedules.length)} of {schedules.length} entries
            </span>
            <div className="dashboard-pagination__controls">
              <button type="button" className="dashboard-pagination__btn" disabled={page <= 1} aria-label="Previous page" onClick={() => setPage((p) => Math.max(1, p - 1))}>
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button key={n} type="button" className={`dashboard-pagination__btn${page === n ? ' dashboard-pagination__btn--active' : ''}`} aria-current={page === n ? 'page' : undefined} onClick={() => setPage(n)}>
                  {n}
                </button>
              ))}
              <button type="button" className="dashboard-pagination__btn" disabled={page >= totalPages} aria-label="Next page" onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
      </section>

      <section className="dashboard-card dashboard-card--full" aria-label="Recent Activities">
          <div className="dashboard-card__header">
            <div className="dashboard-card__title-group">
              <div className="dashboard-card__title-icon"><Activity size={17} /></div>
              <h2 className="dashboard-card__title">Recent Activities</h2>
            </div>
          </div>

          <div className="dashboard-table-wrap">
            <table className="dashboard-table dashboard-table--compact">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Activity</th>
                  <th>Date</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {(data.recent_activities || []).length === 0 ? (
                  <tr><td colSpan={4} className="dashboard-empty-cell">No recent activities.</td></tr>
                ) : data.recent_activities.map((activity) => (
                  <tr key={activity.id}>
                    <td>{activity.user_name || 'System'}</td>
                    <td>
                      <strong>{activity.title}</strong>
                      <div className="dashboard-table__sub">{activity.description}</div>
                    </td>
                    <td>{activity.date_label || '—'}</td>
                    <td>{activity.time_label || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
      </section>

      <div className="dashboard-row">
        <section className="dashboard-card" aria-label="Examination Performance Overview">
          <div className="dashboard-card__header">
            <div className="dashboard-card__title-group">
              <div className="dashboard-card__title-icon"><BarChart3 size={17} /></div>
              <h2 className="dashboard-card__title">Daily Examinee Volume</h2>
            </div>
          </div>

          <PerformanceChart
            points={data.performance?.points || []}
            average={data.performance?.average || 0}
            max={data.performance?.max || 500}
          />
        </section>

        <section className="dashboard-card" aria-label="Quick Actions">
          <div className="dashboard-card__header">
            <div className="dashboard-card__title-group">
              <div className="dashboard-card__title-icon dashboard-card__title-icon--gold"><Zap size={17} /></div>
              <h2 className="dashboard-card__title">Quick Actions</h2>
            </div>
          </div>

          <div className="dashboard-quick-actions">
            {QUICK_ACTIONS.map((action) => (
              <QuickAction key={action.title} action={action} />
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
