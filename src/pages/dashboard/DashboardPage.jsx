import { Link } from 'react-router-dom';
import {
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Home,
  Calendar,
  Users,
  AlarmClock,
  FileCheck,
  TrendingUp,
  Activity,
  BarChart3,
  Zap,
  ClipboardList,
  BookOpen,
  UserCheck,
  Mail,
} from 'lucide-react';
import './DashboardPage.css';

const STAT_CARDS = [
  {
    label: 'Total Examinees',
    value: '2,483',
    trend: '6.4%',
    trendColor: 'green',
    icon: Users,
    iconClass: 'rose',
  },
  {
    label: 'Active Examinations',
    value: '12',
    trend: '9.1%',
    trendColor: 'green',
    icon: Calendar,
    iconClass: 'orange',
  },
  {
    label: 'Pending Registrations',
    value: '148',
    trend: '2.7%',
    trendColor: 'amber',
    icon: AlarmClock,
    iconClass: 'amber',
  },
  {
    label: 'Completed Exams',
    value: '2,196',
    trend: '12.3%',
    trendColor: 'green',
    icon: FileCheck,
    iconClass: 'green',
  },
];

const SCHEDULE_ROWS = [
  {
    date: 'May 28, 2025',
    examination: 'College Admission Test',
    room: 'Room 101',
    proctor: 'Maria D. Santos',
    status: 'Scheduled',
  },
  {
    date: 'May 29, 2025',
    examination: 'Scholarship Examination',
    room: 'Room 102',
    proctor: 'John Mark Rivera',
    status: 'Scheduled',
  },
  {
    date: 'May 30, 2025',
    examination: 'Course Placement Test',
    room: 'Room 103',
    proctor: 'Ana L. Gonzales',
    status: 'Ongoing',
  },
  {
    date: 'May 31, 2025',
    examination: 'College Admission Test',
    room: 'Room 104',
    proctor: 'Michael P. Tampus',
    status: 'Scheduled',
  },
  {
    date: 'Jun 1, 2025',
    examination: 'NSTP Qualifying Exam',
    room: 'Room 105',
    proctor: 'Rosemarie J. Villa',
    status: 'Scheduled',
  },
];

const ACTIVITIES = [
  {
    title: 'New student registered',
    description: 'Juan Dela Cruz',
    time: '10:24 AM',
    icon: Users,
    iconBg: '#e8f5ee',
    iconColor: '#16a34a',
    dotColor: '#16a34a',
  },
  {
    title: 'Examination published',
    description: 'College Admission Test',
    time: '09:15 AM',
    icon: ClipboardList,
    iconBg: '#fef3e6',
    iconColor: '#d97706',
    dotColor: '#d97706',
  },
  {
    title: 'Question bank updated',
    description: 'General Knowledge Set 2025',
    time: '08:48 AM',
    icon: BookOpen,
    iconBg: '#e8f0fe',
    iconColor: '#2563eb',
    dotColor: '#2563eb',
  },
  {
    title: 'Administrator login',
    description: 'Kent Russel Casino',
    time: '08:30 AM',
    icon: UserCheck,
    iconBg: '#f3e8fd',
    iconColor: '#9333ea',
    dotColor: '#9333ea',
  },
  {
    title: 'Email notification sent',
    description: 'To 148 pending examinees',
    time: '08:10 AM',
    icon: Mail,
    iconBg: '#fce8ec',
    iconColor: '#c4455a',
    dotColor: '#c4455a',
  },
];

const QUICK_ACTIONS = [
  {
    title: 'Create Examination',
    subtitle: 'Set up a new exam',
    icon: Calendar,
    color: 'maroon',
    path: null,
  },
  {
    title: 'Add Student',
    subtitle: 'Register a new student',
    icon: Users,
    color: 'gold',
    path: null,
  },
  {
    title: 'Manage Question Bank',
    subtitle: 'Add or update questions',
    icon: BookOpen,
    color: 'maroon',
    path: '/test-items',
  },
  {
    title: 'View Reports',
    subtitle: 'View analytics & reports',
    icon: BarChart3,
    color: 'gold',
    path: null,
  },
];

const CHART_DATA = [
  { label: 'May 1', value: 420 },
  { label: 'May 5', value: 560 },
  { label: 'May 9', value: 710 },
  { label: 'May 13', value: 880 },
  { label: 'May 17', value: 1050 },
  { label: 'May 21', value: 1320 },
  { label: 'May 25', value: 1620 },
  { label: 'May 29', value: 1920 },
];

const CHART_Y_MAX = 2000;
const CHART_AVERAGE = 1050;

function PerformanceChart() {
  const W = 640;
  const H = 220;
  const padL = 48;
  const padR = 16;
  const padT = 12;
  const padB = 36;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  const toX = (i) => padL + (i / (CHART_DATA.length - 1)) * chartW;
  const toY = (v) => padT + chartH - (v / CHART_Y_MAX) * chartH;

  const linePoints = CHART_DATA.map((d, i) => `${toX(i)},${toY(d.value)}`).join(' ');
  const avgY = toY(CHART_AVERAGE);

  const yLabels = [
    { value: 2000, label: '2K' },
    { value: 1500, label: '1.5K' },
    { value: 1000, label: '1K' },
    { value: 500, label: '500' },
    { value: 0, label: '0' },
  ];

  return (
    <div className="dashboard-chart-body">
      <svg
        className="dashboard-chart-svg"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Examination performance line chart showing examinees over May"
      >
        {yLabels.map(({ value, label }) => {
          const y = toY(value);
          return (
            <g key={value}>
              <line
                x1={padL}
                y1={y}
                x2={W - padR}
                y2={y}
                stroke="#E9E3DE"
                strokeWidth="1"
                strokeDasharray={value === 0 ? '0' : '4 4'}
              />
              <text x={padL - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#9a9490">
                {label}
              </text>
            </g>
          );
        })}

        <line
          x1={padL}
          y1={avgY}
          x2={W - padR}
          y2={avgY}
          stroke="#C98A18"
          strokeWidth="2"
          strokeDasharray="6 5"
        />

        <polyline
          points={linePoints}
          fill="none"
          stroke="#7B1020"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {CHART_DATA.map((d, i) => (
          <circle
            key={d.label}
            cx={toX(i)}
            cy={toY(d.value)}
            r="4.5"
            fill="#7B1020"
            stroke="#fff"
            strokeWidth="2"
          />
        ))}

        {CHART_DATA.map((d, i) => (
          <text
            key={`label-${d.label}`}
            x={toX(i)}
            y={H - 10}
            textAnchor="middle"
            fontSize="9.5"
            fill="#9a9490"
          >
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

  if (action.path) {
    return (
      <Link to={action.path} className="dashboard-quick-action">
        {content}
      </Link>
    );
  }

  return (
    <button type="button" className="dashboard-quick-action">
      {content}
    </button>
  );
}

export default function DashboardPage() {
  return (
    <>
      <nav className="dashboard-breadcrumbs" aria-label="Breadcrumb">
        <span className="dashboard-breadcrumbs__item">
          <Home size={14} />
        </span>
        <ChevronRight className="dashboard-breadcrumbs__sep" />
        <span className="dashboard-breadcrumbs__item">Dashboard</span>
        <ChevronRight className="dashboard-breadcrumbs__sep" />
        <span className="dashboard-breadcrumbs__item">Home</span>
        <ChevronRight className="dashboard-breadcrumbs__sep" />
        <span className="dashboard-breadcrumbs__item dashboard-breadcrumbs__current">Dashboard</span>
      </nav>

      <header className="dashboard-page-header">
        <h1>Dashboard</h1>
        <p>
          Welcome back, Administrator. Here is an overview of today&apos;s entrance examination
          activities.
        </p>
      </header>

      <section className="dashboard-stats" aria-label="Statistics overview">
        {STAT_CARDS.map((card) => {
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
                {card.trend}
                <span>vs last month</span>
              </div>
            </article>
          );
        })}
      </section>

      <div className="dashboard-row">
        <section className="dashboard-card" aria-label="Upcoming Examination Schedule">
          <div className="dashboard-card__header">
            <div className="dashboard-card__title-group">
              <div className="dashboard-card__title-icon">
                <Calendar size={17} />
              </div>
              <h2 className="dashboard-card__title">Upcoming Examination Schedule</h2>
            </div>
            <button type="button" className="dashboard-card__btn">
              View all
            </button>
          </div>

          <div className="dashboard-table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Examination</th>
                  <th>Room</th>
                  <th>Proctor</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {SCHEDULE_ROWS.map((row) => (
                  <tr key={`${row.date}-${row.examination}`}>
                    <td>{row.date}</td>
                    <td>{row.examination}</td>
                    <td>{row.room}</td>
                    <td>{row.proctor}</td>
                    <td>
                      <span className={`dashboard-badge dashboard-badge--${row.status.toLowerCase()}`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="dashboard-pagination">
            <span>Showing 1 to 5 of 12 entries</span>
            <div className="dashboard-pagination__controls">
              <button type="button" className="dashboard-pagination__btn" disabled aria-label="Previous page">
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                className="dashboard-pagination__btn dashboard-pagination__btn--active"
                aria-current="page"
              >
                1
              </button>
              <button type="button" className="dashboard-pagination__btn">
                2
              </button>
              <button type="button" className="dashboard-pagination__btn">
                3
              </button>
              <button type="button" className="dashboard-pagination__btn" aria-label="Next page">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </section>

        <section className="dashboard-card" aria-label="Recent Activities">
          <div className="dashboard-card__header">
            <div className="dashboard-card__title-group">
              <div className="dashboard-card__title-icon">
                <Activity size={17} />
              </div>
              <h2 className="dashboard-card__title">Recent Activities</h2>
            </div>
          </div>

          <div className="dashboard-activities">
            {ACTIVITIES.map((activity) => {
              const Icon = activity.icon;
              return (
                <article key={activity.title} className="dashboard-activity">
                  <div className="dashboard-activity__marker">
                    <span
                      className="dashboard-activity__dot"
                      style={{ backgroundColor: activity.dotColor }}
                    />
                    <div
                      className="dashboard-activity__icon"
                      style={{ backgroundColor: activity.iconBg, color: activity.iconColor }}
                    >
                      <Icon size={16} />
                    </div>
                  </div>
                  <div className="dashboard-activity__content">
                    <div className="dashboard-activity__title">{activity.title}</div>
                    <div className="dashboard-activity__desc">{activity.description}</div>
                  </div>
                  <time className="dashboard-activity__time">{activity.time}</time>
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
              <div className="dashboard-card__title-icon">
                <BarChart3 size={17} />
              </div>
              <h2 className="dashboard-card__title">Examination Performance Overview</h2>
            </div>
            <button type="button" className="dashboard-card__btn dashboard-card__btn--dropdown">
              This Month
              <ChevronDown size={14} />
            </button>
          </div>

          <PerformanceChart />

          <div className="dashboard-chart-legend">
            <div className="dashboard-chart-legend__item">
              <span className="dashboard-chart-legend__line dashboard-chart-legend__line--maroon" />
              Examinees
            </div>
            <div className="dashboard-chart-legend__item">
              <span className="dashboard-chart-legend__line dashboard-chart-legend__line--gold" />
              Average
            </div>
          </div>
        </section>

        <section className="dashboard-card" aria-label="Quick Actions">
          <div className="dashboard-card__header">
            <div className="dashboard-card__title-group">
              <div className="dashboard-card__title-icon dashboard-card__title-icon--gold">
                <Zap size={17} />
              </div>
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
