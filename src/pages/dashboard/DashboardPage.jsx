import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  BarChart3,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileCheck,
  Home,
  Loader2,
  Mail,
  Settings,
  Shield,
  TrendingUp,
  UserCheck,
  UserCog,
  Users,
  Zap,
} from 'lucide-react';
import { dashboardApi } from '../../api/dashboardApi';
import { useAuth } from '../../auth/useAuth';
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
      label: 'Total Examinees',
      value: formatNumber(stats.total_examinees),
      hint: `${formatNumber(stats.examinees_today)} expected today`,
      icon: Users,
      iconClass: 'rose',
      trendColor: 'green',
    },
    {
      label: 'Active Sessions',
      value: formatNumber(stats.active_sessions),
      hint: `${formatNumber(stats.rooms_today)} classrooms in use today`,
      icon: Calendar,
      iconClass: 'orange',
      trendColor: 'green',
    },
    {
      label: 'Proctors On Duty',
      value: formatNumber(stats.proctors_on_duty),
      hint: 'Typically 3–4 per time slot',
      icon: Shield,
      iconClass: 'amber',
      trendColor: 'amber',
    },
    {
      label: 'Completed Exams',
      value: formatNumber(stats.completed_exams),
      hint: `${formatNumber(stats.pending_registrations)} pending registrations`,
      icon: FileCheck,
      iconClass: 'green',
      trendColor: 'green',
    },
  ];

  if (loading) {
    return (
      <div className="dashboard-state">
        <Loader2 className="dashboard-state__spin" size={22} />
        Loading dashboard...
      </div>
    );
  }

  if (error) {
    return <div className="dashboard-state dashboard-state--error" role="alert">{error}</div>;
  }

  return (
    <>
      <nav className="dashboard-breadcrumbs" aria-label="Breadcrumb">
        <span className="dashboard-breadcrumbs__item"><Home size={14} /></span>
        <ChevronRight className="dashboard-breadcrumbs__sep" />
        <span className="dashboard-breadcrumbs__item">Dashboard</span>
        <ChevronRight className="dashboard-breadcrumbs__sep" />
        <span className="dashboard-breadcrumbs__item dashboard-breadcrumbs__current">Home</span>
      </nav>

      <header className="dashboard-page-header">
        <h1>Dashboard</h1>
        <p>
          Welcome back, {firstName}. Each batch is a time slot (for example{' '}
          <strong>09:30–10:30</strong>) with about <strong>400–500 examinees/day</strong>,{' '}
          <strong>3–5 open classrooms</strong>, and a <strong>different proctor per room</strong>.
          Students are not fixed to one room — they only have a schedule time.
        </p>
      </header>

      <section className="dashboard-stats" aria-label="Statistics overview">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <article key={card.label} className="dashboard-stat-card">
              <div className="dashboard-stat-card__top">
                <span className="dashboard-stat-card__label">{card.label}</span>
                <div className={`dashboard-stat-card__icon dashboard-stat-card__icon--${card.iconClass}`}>
                  <Icon size={20} />
                </div>
              </div>
              <div className="dashboard-stat-card__value">{card.value}</div>
              <div className={`dashboard-stat-card__trend dashboard-stat-card__trend--${card.trendColor}`}>
                <TrendingUp size={14} />
                <span>{card.hint}</span>
              </div>
            </article>
          );
        })}
      </section>

      <div className="dashboard-row">
        <section className="dashboard-card" aria-label="Upcoming Examination Schedule">
          <div className="dashboard-card__header">
            <div className="dashboard-card__title-group">
              <div className="dashboard-card__title-icon"><Calendar size={17} /></div>
              <h2 className="dashboard-card__title">Upcoming Examination Schedule</h2>
            </div>
            <Link to="/management/schedules" className="dashboard-card__btn">View all</Link>
          </div>

          <div className="dashboard-table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Batch</th>
                  <th>Time Slot</th>
                  <th>Open Classrooms</th>
                  <th>Proctors Available</th>
                  <th>Students</th>
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
                        <strong>{row.batch_label || `${row.date_label}, ${row.batch_code}`}</strong>
                        <span>Entrance Examination</span>
                      </Link>
                    </td>
                    <td>{row.time_slot || row.start_time}</td>
                    <td>
                      <div>{row.room_count} rooms</div>
                      <div className="dashboard-table__sub" title={row.rooms_label}>{row.rooms_label}</div>
                    </td>
                    <td>
                      <div>{row.proctor_count || 0} proctors</div>
                      <div className="dashboard-table__sub">
                        {(row.proctor_names || []).slice(0, 2).join(', ') || 'Unassigned'}
                        {(row.proctor_names || []).length > 2 ? '…' : ''}
                      </div>
                    </td>
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
              <button
                type="button"
                className="dashboard-pagination__btn"
                disabled={page <= 1}
                aria-label="Previous page"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`dashboard-pagination__btn${page === n ? ' dashboard-pagination__btn--active' : ''}`}
                  aria-current={page === n ? 'page' : undefined}
                  onClick={() => setPage(n)}
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                className="dashboard-pagination__btn"
                disabled={page >= totalPages}
                aria-label="Next page"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </section>

        <section className="dashboard-card" aria-label="Recent Activities">
          <div className="dashboard-card__header">
            <div className="dashboard-card__title-group">
              <div className="dashboard-card__title-icon"><Activity size={17} /></div>
              <h2 className="dashboard-card__title">Recent Activities</h2>
            </div>
          </div>

          <div className="dashboard-activities">
            {(data.recent_activities || []).length === 0 ? (
              <div className="dashboard-empty">No recent activities.</div>
            ) : data.recent_activities.map((activity) => {
              const style = ACTIVITY_STYLE[activity.action] || ACTIVITY_STYLE.default;
              const Icon = style.icon;
              return (
                <article key={activity.id} className="dashboard-activity">
                  <div className="dashboard-activity__marker">
                    <span className="dashboard-activity__dot" style={{ backgroundColor: style.dotColor }} />
                    <div className="dashboard-activity__icon" style={{ backgroundColor: style.iconBg, color: style.iconColor }}>
                      <Icon size={16} />
                    </div>
                  </div>
                  <div className="dashboard-activity__content">
                    <div className="dashboard-activity__title">{activity.title}</div>
                    <div className="dashboard-activity__desc">{activity.description}</div>
                  </div>
                  <time className="dashboard-activity__time">{activity.time_label}</time>
                </article>
              );
            })}
          </div>
        </section>
      </div>

      <div className="dashboard-row">
        <section className="dashboard-card" aria-label="Examination Performance Overview">
          <div className="dashboard-card__header">
            <div className="dashboard-card__title-group">
              <div className="dashboard-card__title-icon"><BarChart3 size={17} /></div>
              <h2 className="dashboard-card__title">Daily Examinee Volume</h2>
            </div>
            <button type="button" className="dashboard-card__btn dashboard-card__btn--dropdown">
              Last 7 days
              <ChevronDown size={14} />
            </button>
          </div>

          <PerformanceChart
            points={data.performance?.points || []}
            average={data.performance?.average || 0}
            max={data.performance?.max || 500}
          />

          <div className="dashboard-chart-legend">
            <div className="dashboard-chart-legend__item">
              <span className="dashboard-chart-legend__line dashboard-chart-legend__line--maroon" />
              Expected examinees / day
            </div>
            <div className="dashboard-chart-legend__item">
              <span className="dashboard-chart-legend__line dashboard-chart-legend__line--gold" />
              Average ({formatNumber(data.performance?.average || 0)})
            </div>
          </div>
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
