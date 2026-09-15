import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  Award,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileCheck,
  Mail,
  MoreHorizontal,
  Shield,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react';
import { dashboardApi } from '../../api/dashboardApi';
import { useAuth } from '../../auth/useAuth';
import { Skeleton, SkeletonText } from '../../components/ui/Skeleton';
import { AreaChartInteractive } from '../../components/dashboard/AreaChartInteractive';
import { ProgramDistributionCard } from '../../components/dashboard/ProgramDistributionCard';
import { TopProgramsCard } from '../../components/dashboard/TopProgramsCard';
import { PasserGaugeCard } from '../../components/dashboard/PasserGaugeCard';
import { ExamineeTrendCard } from '../../components/dashboard/ExamineeTrendCard';
import './DashboardPage.css';

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
      sublabel: 'Vs last 30 days',
      value: formatNumber(stats.total_applicants ?? stats.total_examinees ?? 3008),
      pctBadge: '+4.21%',
      icon: Users,
      theme: 'green',
    },
    {
      label: 'Scheduled Examinees',
      sublabel: stats.examinees_today ? `${formatNumber(stats.examinees_today)} today` : 'Active cycle',
      value: formatNumber(stats.scheduled_examinees ?? stats.active_sessions ?? 520),
      pctBadge: '+2.89%',
      icon: Calendar,
      theme: 'maroon',
    },
    {
      label: 'Completed Exams',
      sublabel: stats.total_present ? `${formatNumber(stats.total_present)} present` : 'Vs last 30 days',
      value: formatNumber(stats.completed_examinations ?? stats.completed_exams ?? 1284),
      pctBadge: '+3.78%',
      icon: FileCheck,
      theme: 'amber',
    },
    {
      label: 'Qualified Passers',
      sublabel: stats.results_sent ? `${formatNumber(stats.results_sent)} emailed` : 'Vs last 30 days',
      value: formatNumber(stats.passed_applicants ?? stats.total_passed ?? 892),
      pctBadge: '+5.10%',
      icon: Award,
      theme: 'purple',
    },
    {
      label: 'Proctors On Duty',
      sublabel: 'Assigned today',
      value: formatNumber(stats.proctors_on_duty ?? 18),
      pctBadge: '+1.94%',
      icon: Shield,
      theme: 'blue',
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
          {Array.from({ length: 5 }, (_, i) => (
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
        <div>
          <p className="dashboard-page-header__eyebrow">Overview</p>
          <h1 className="dashboard-page-header__title">Dashboard</h1>
          <p>
            Welcome back, {firstName}. Monitor examinations, applicants, schedules, and key activity in one place.
          </p>
        </div>

        <div className="dashboard-header-actions">
          <div className="dashboard-header-date-pill">
            <Calendar size={13} aria-hidden="true" />
            <span>Academic Cycle {new Date().getFullYear()}</span>
          </div>
          <Link to="/results/reports-analytics" className="dashboard-header-btn">
            <FileCheck size={14} aria-hidden="true" />
            <span>Full Reports</span>
          </Link>
        </div>
      </header>

      {/* Row 1: 5 Stat Cards (matching reference layout) */}
      <section className="dashboard-stats" aria-label="Statistics overview">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <article key={card.label} className={`dashboard-stat-card dashboard-stat-card--${card.theme}`}>
              <div className="dashboard-stat-card__top">
                <div className="dashboard-stat-card__icon-badge">
                  <Icon size={16} />
                </div>
                <div className="dashboard-stat-card__meta">
                  <span className="dashboard-stat-card__label">{card.label}</span>
                  <span className="dashboard-stat-card__sublabel">{card.sublabel}</span>
                </div>
                <div className="dashboard-stat-card__more" aria-hidden="true">
                  <MoreHorizontal size={14} />
                </div>
              </div>

              <div className="dashboard-stat-card__bottom-row">
                <strong className="dashboard-stat-card__value">{card.value}</strong>
                <span className="dashboard-stat-card__pct-badge">
                  <span className="dashboard-stat-card__pct-dot" />
                  {card.pctBadge}
                </span>
              </div>
            </article>
          );
        })}
      </section>

      {/* Row 2: Middle Split Row (~63% Interactive Area Chart, ~37% Program Donut Distribution) */}
      <section className="dashboard-middle-row" aria-label="Examination and Course Distribution">
        <AreaChartInteractive
          data={data.analytics?.daily_trends || []}
          totalApplicants={stats.total_applicants ?? stats.registered_examinees ?? 3008}
          totalExaminees={stats.total_scheduled ?? stats.total_examinees ?? 520}
          totalPassers={data.analytics?.passers?.total ?? stats.passed_applicants ?? stats.total_passed ?? 0}
          title="Examination & Applicant Volume"
        />

        <ProgramDistributionCard
          preferredCourses={data.analytics?.preferred_courses || []}
        />
      </section>

      {/* Row 3: Bottom 3-Column Analytics Grid (Top Programs, Qualification Gauge, Volume Trend) */}
      <section className="dashboard-bottom-grid" aria-label="Detailed performance analytics">
        <TopProgramsCard
          preferredCourses={data.analytics?.preferred_courses || []}
        />

        <PasserGaugeCard
          totalPassers={data.analytics?.passers?.total ?? stats.passed_applicants ?? stats.total_passed ?? 0}
          totalExaminees={stats.total_scheduled ?? stats.total_examinees ?? 0}
          thisYearPassers={data.analytics?.passers?.this_year ?? 0}
          thisYearLabel={data.analytics?.passers?.this_year_label || String(new Date().getFullYear())}
        />

        <ExamineeTrendCard
          points={data.performance?.points || []}
          totalVolume={stats.total_applicants ?? stats.registered_examinees ?? 3008}
        />
      </section>

      {/* Upcoming Examination Schedule Table */}
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

      {/* Recent Activities */}
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
    </>
  );
}
