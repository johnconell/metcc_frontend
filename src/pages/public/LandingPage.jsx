import { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Calendar,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock,
  Clock3,
  ExternalLink,
  GraduationCap,
  HelpCircle,
  Layers,
  MapPin,
  Megaphone,
  Phone,
  Search,
  Shield,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react';
import tccLogo from '../../assets/tcc_logo.png';
import { publicApi } from '../../api/publicApi';
import { useAuth } from '../../auth/useAuth';
import './landing.css';

const SEARCH_TYPES = [
  { value: 'auto', label: 'Any field' },
  { value: 'name', label: 'Student Name' },
  { value: 'applicant_id', label: 'Applicant ID' },
  { value: 'reference', label: 'Reference Number' },
];

const PLACEHOLDERS = {
  auto: 'Name, Applicant ID, or Reference No.',
  name: 'e.g. Juan Dela Cruz',
  applicant_id: 'e.g. APP-2026-0001',
  reference: 'e.g. REF-2026-0001',
};

const PARTNERS = [
  { name: 'College of Information Technology', abbr: 'CIT' },
  { name: 'College of Education', abbr: 'COE' },
  { name: 'College of Business Administration', abbr: 'CBA' },
  { name: 'College of Arts & Sciences', abbr: 'CAS' },
  { name: 'Commission on Higher Education', abbr: 'CHED' },
  { name: 'Municipality of Tagoloan', abbr: 'LGU' },
];

const ANNOUNCEMENTS = [
  {
    title: 'Important Exam Notice',
    body: 'Examinees must present a valid ID and official examination slip on their designated testing date.',
    tag: 'Urgent',
    date: 'Academic Year 2026–2027',
  },
  {
    title: 'Examination Day Guidelines',
    body: 'Arrive 30 minutes early. Electronic devices and unauthorized study materials are strictly prohibited.',
    tag: 'Guidelines',
    date: 'Admissions Office',
  },
  {
    title: 'Batch & Room Assignments',
    body: 'Daily testing runs in batches of 400–500 examinees across designated classrooms with assigned proctors.',
    tag: 'Schedule',
    date: 'Updated Daily',
  },
  {
    title: 'Admission Results Release',
    body: 'Official entrance examination scores and program qualification statuses follow the institutional admissions calendar.',
    tag: 'Admissions',
    date: 'Official Portal',
  },
];

const FAQS = [
  {
    q: 'How do I verify my examination schedule?',
    a: 'Use the Examination Schedule Search tool on this portal. Simply enter your Applicant ID (e.g. APP-2026-0001), full name, or reference number to retrieve your date, time slot, room assignment, and batch.',
  },
  {
    q: 'What should I bring on examination day?',
    a: 'Bring a valid photo ID (school ID, government ID), your printed or digital examination slip, and standard test pencils (No. 2) or black ballpoint pens.',
  },
  {
    q: 'What time should I arrive at the campus?',
    a: 'Examinees are required to arrive at least 30 to 45 minutes before their assigned batch time slot for security verification and room seating.',
  },
  {
    q: 'Can I reschedule my entrance examination date?',
    a: 'Rescheduling is evaluated on a case-by-case basis under official grounds. Please visit or contact the TCC Admissions Office promptly before your scheduled test date.',
  },
  {
    q: 'Who should I contact for technical or schedule assistance?',
    a: 'You can contact the TCC Admissions & Examination Office directly via admissions@tcc.edu.ph or visit the administration building during regular office hours.',
  },
];

export default function LandingPage() {
  const { user } = useAuth();
  const location = useLocation();
  const isAuthenticated = Boolean(user);

  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState('auto');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const [flashMessage, setFlashMessage] = useState(location.state?.message || '');

  const handleSearch = async (event) => {
    event.preventDefault();
    const q = query.trim();
    if (q.length < 2) {
      setError('Enter at least 2 characters (name, applicant ID, or reference number).');
      setResults([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    setError('');
    setSearched(true);
    try {
      const { data } = await publicApi.searchSchedule({ q, type: searchType });
      setResults(data.data || []);
    } catch (err) {
      setResults([]);
      setError(err.response?.data?.message || 'Unable to search schedules right now.');
    } finally {
      setLoading(false);
    }
  };

  const resultCountLabel = useMemo(() => {
    if (!searched) return '';
    if (results.length === 0) return 'No matching examinee schedules found.';
    return `${results.length} schedule${results.length === 1 ? '' : 's'} found`;
  }, [searched, results.length]);

  return (
    <div className="landing-root">
      {/* Top Glass Navbar matching reference */}
      <header className="landing-navbar">
        <div className="landing-navbar__inner">
          <Link to="/" className="landing-brand">
            <img src={tccLogo} alt="Tagoloan Community College" className="landing-brand__logo" />
            <div className="landing-brand__meta">
              <span className="landing-brand__title">Tagoloan Community College</span>
              <span className="landing-brand__sub">Entrance Examination Portal</span>
            </div>
          </Link>

          <nav className="landing-nav-links" aria-label="Main Navigation">
            <a href="#about" className="landing-nav-link">About us</a>
            <a href="#process" className="landing-nav-link">Process</a>
            <a href="#schedule-search" className="landing-nav-link">Schedule Search</a>
            <a href="#announcements" className="landing-nav-link">Announcements</a>
            <a href="#faq" className="landing-nav-link">FAQ</a>
          </nav>

          <div className="landing-nav-actions">
            <a href="#contact" className="landing-nav-link landing-nav-link--contact">Contact</a>
            {isAuthenticated ? (
              <Link to="/dashboard" className="landing-nav-btn landing-nav-btn--primary">
                Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="landing-nav-link landing-nav-link--login">
                  Login
                </Link>
                <a href="#schedule-search" className="landing-nav-btn landing-nav-btn--primary">
                  Student Portal
                </a>
              </>
            )}
          </div>
        </div>
      </header>

      {flashMessage && (
        <div className="landing-flash" role="status">
          <p>{flashMessage}</p>
          <button type="button" onClick={() => setFlashMessage('')} aria-label="Dismiss message">
            ×
          </button>
        </div>
      )}

      {/* Hero Section replicating reference concept with floating dashboard mockup */}
      <section className="landing-hero" id="about">
        <div className="landing-hero__aurora" aria-hidden="true" />

        <div className="landing-hero__header">
          <div className="landing-hero__pill-tag">
            <Sparkles size={13} className="landing-hero__sparkle-icon" />
            <span>Academic Cycle 2026–2027</span>
          </div>

          <h1 className="landing-hero__headline">
            Your Path to Higher Education<br />Starts Here.
          </h1>

          <p className="landing-hero__subheadline">
            Verify your official entrance examination schedule, room assignment, batch, and
            qualification results — all in one place, in real time.
          </p>

          <div className="landing-hero__actions">
            <a href="#schedule-search" className="landing-btn-hero">
              <span>Find My Schedule</span>
            </a>
          </div>
        </div>

        {/* Hero Interactive Showcase Mockup Container */}
        <div className="landing-showcase">
          <div className="landing-showcase__frame">
            {/* Top Left Floating Stat Pill */}
            <div className="landing-float-card landing-float-card--top-left">
              <div className="landing-float-card__icon-grid">
                <span className="dot dot--maroon" />
                <span className="dot dot--gold" />
                <span className="dot dot--maroon-light" />
                <span className="dot dot--gold-light" />
              </div>
              <div className="landing-float-card__meta">
                <span className="landing-float-card__label">Academic Year</span>
                <strong className="landing-float-card__value">2026–2027</strong>
              </div>
            </div>

            {/* Top Right Floating Notice Card */}
            <div className="landing-float-card landing-float-card--top-right">
              <div className="landing-float-card__icon-badge">
                <Megaphone size={14} />
              </div>
              <div className="landing-float-card__meta">
                <span className="landing-float-card__label">Admissions Open</span>
                <span className="landing-float-card__badge-num">TCC EEMS</span>
              </div>
              <div className="landing-float-card__bar-indicator" />
            </div>

            {/* Middle Left Floating Chart Card: Exam Completion */}
            <div className="landing-float-card landing-float-card--mid-left">
              <div className="landing-float-card__head">
                <span className="landing-float-card__title">Exam Completion</span>
                <span className="landing-float-card__subpill">Batch</span>
              </div>
              <div className="landing-mini-bars">
                <div className="mini-bar mini-bar--1" style={{ height: '45%' }} />
                <div className="mini-bar mini-bar--2" style={{ height: '70%' }} />
                <div className="mini-bar mini-bar--3" style={{ height: '95%' }} />
                <div className="mini-bar mini-bar--4" style={{ height: '55%' }} />
                <div className="mini-bar mini-bar--5" style={{ height: '85%' }} />
              </div>
            </div>

            {/* Center Main Dashboard Showcase: Exam Results Analytics */}
            <div className="landing-showcase-center">
              <div className="landing-showcase-center__header">
                <span className="landing-showcase-center__title">Exam Results Analytics</span>
              </div>

              <div className="landing-showcase-chart-wrap">
                <div className="landing-showcase-axis">
                  <span>High</span>
                  <span>Mid</span>
                  <span>Low</span>
                  <span>Base</span>
                </div>

                <div className="landing-showcase-svg-container">
                  <svg viewBox="0 0 540 200" className="landing-showcase-svg" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="curveGradient1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#D8901F" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#D8901F" stopOpacity="0.0" />
                      </linearGradient>
                      <linearGradient id="curveGradient2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#7b1020" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#7b1020" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Grid lines */}
                    <line x1="0" y1="20" x2="540" y2="20" stroke="rgba(226, 232, 240, 0.6)" strokeDasharray="3 3" />
                    <line x1="0" y1="70" x2="540" y2="70" stroke="rgba(226, 232, 240, 0.6)" strokeDasharray="3 3" />
                    <line x1="0" y1="120" x2="540" y2="120" stroke="rgba(226, 232, 240, 0.6)" strokeDasharray="3 3" />
                    <line x1="0" y1="170" x2="540" y2="170" stroke="rgba(226, 232, 240, 0.6)" strokeDasharray="3 3" />

                    {/* Area 1 - Gold */}
                    <path
                      d="M 0,160 Q 70,140 130,120 T 260,80 T 360,110 T 450,70 T 540,90 L 540,200 L 0,200 Z"
                      fill="url(#curveGradient1)"
                    />
                    <path
                      d="M 0,160 Q 70,140 130,120 T 260,80 T 360,110 T 450,70 T 540,90"
                      fill="none"
                      stroke="#D8901F"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />

                    {/* Area 2 - Maroon */}
                    <path
                      d="M 0,180 Q 80,165 150,140 T 270,75 T 380,135 T 470,100 T 540,120 L 540,200 L 0,200 Z"
                      fill="url(#curveGradient2)"
                    />
                    <path
                      d="M 0,180 Q 80,165 150,140 T 270,75 T 380,135 T 470,100 T 540,120"
                      fill="none"
                      stroke="#7b1020"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />

                    {/* Peak Point */}
                    <circle cx="270" cy="75" r="5" fill="#7b1020" stroke="#ffffff" strokeWidth="2.5" />
                  </svg>

                  {/* Floating tooltip badge pinned on curve peak */}
                  <div className="landing-chart-tooltip-pin">
                    <span className="tooltip-value">Qualified</span>
                    <span className="tooltip-icon" />
                  </div>
                </div>
              </div>
            </div>

            {/* Middle Right Floating Card: Exam Status */}
            <div className="landing-float-card landing-float-card--mid-right">
              <span className="landing-float-card__sm-label">Exam Status</span>
              <strong className="landing-float-card__lg-val">Active</strong>

              <div className="landing-donut-preview">
                <span className="landing-float-card__sub-caption">Pass Rate</span>
                <div className="mini-donut-circle">
                  <svg viewBox="0 0 36 36" className="donut-svg">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#f5e4c3"
                      strokeWidth="6"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 14.1 8.5"
                      fill="none"
                      stroke="#7b1020"
                      strokeWidth="6"
                    />
                    <path
                      d="M32.1 10.5845 a 15.9155 15.9155 0 0 1 -3.1 16.5"
                      fill="none"
                      stroke="#D8901F"
                      strokeWidth="6"
                    />
                    <path
                      d="M29 27.0845 a 15.9155 15.9155 0 0 1 -11 6.8"
                      fill="none"
                      stroke="rgba(123, 16, 32, 0.3)"
                      strokeWidth="6"
                    />
                  </svg>
                </div>
                <div className="mini-donut-bars">
                  <span className="mini-donut-bar mini-donut-bar--blue" />
                  <span className="mini-donut-bar mini-donut-bar--purple" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Partner / Department Brand Row matching reference */}
      <section className="landing-partners-bar" aria-label="Academic Departments and Accreditations">
        <div className="landing-partners-inner">
          {PARTNERS.map((p) => (
            <div key={p.name} className="landing-partner-item">
              <span className="partner-abbr">{p.abbr}</span>
              <span className="partner-name">{p.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 3-Step Process Section replicating reference middle section */}
      <section className="landing-section landing-process" id="process">
        <div className="landing-section-title-wrap">
          <h2 className="landing-section-title">
            How the Examination<br />Portal Works
          </h2>
        </div>

        <div className="landing-steps-grid">
          {/* Step 1 */}
          <div className="landing-step-card">
            <div className="landing-step-mockup">
              <div className="mockup-card mockup-card--user">
                <div className="mockup-avatar" />
                <div className="mockup-lines">
                  <span className="mockup-line mockup-line--long" />
                  <span className="mockup-line mockup-line--short" />
                </div>
                <div className="mockup-btn-pill" />
              </div>
            </div>

            <h3 className="landing-step-title">
              Search Your<br />Examination Schedule
            </h3>
            <p className="landing-step-desc">
              Enter your Applicant ID, full name, or reference number to instantly retrieve your exam date, time slot, and room assignment.
            </p>
          </div>

          {/* Dotted Connector 1 to 2 */}
          <div className="landing-step-connector" aria-hidden="true">
            <svg viewBox="0 0 120 40" fill="none" className="connector-curve">
              <path
                d="M 10,25 C 40,5 80,35 110,15"
                stroke="#D8901F"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
            </svg>
          </div>

          {/* Step 2 */}
          <div className="landing-step-card">
            <div className="landing-step-mockup">
              <div className="mockup-card mockup-card--connect">
                <div className="mockup-badge-row">
                  <span className="mockup-badge-num">Batch A</span>
                  <div className="mockup-brand-icons">
                    <span className="brand-dot brand-dot--green" />
                    <span className="brand-dot brand-dot--red" />
                  </div>
                </div>
                <div className="mockup-lines">
                  <span className="mockup-line mockup-line--long" />
                  <span className="mockup-line mockup-line--mid" />
                </div>
              </div>
            </div>

            <h3 className="landing-step-title">
              Verify Your Room<br />&amp; Batch Assignment
            </h3>
            <p className="landing-step-desc">
              Confirm your assigned classroom, proctor, and batch schedule before examination day to avoid delays.
            </p>
          </div>

          {/* Dotted Connector 2 to 3 */}
          <div className="landing-step-connector" aria-hidden="true">
            <svg viewBox="0 0 120 40" fill="none" className="connector-curve">
              <path
                d="M 10,15 C 40,35 80,5 110,25"
                stroke="#D8901F"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
            </svg>
          </div>

          {/* Step 3 */}
          <div className="landing-step-card">
            <div className="landing-step-mockup">
              <div className="mockup-card mockup-card--chart">
                <div className="mockup-chart-header">
                  <span className="mockup-pct-pill">40% ↗</span>
                </div>
                <div className="mockup-vertical-bars">
                  <span style={{ height: '35%' }} />
                  <span style={{ height: '65%' }} />
                  <span style={{ height: '90%' }} />
                  <span style={{ height: '50%' }} />
                </div>
              </div>
            </div>

            <h3 className="landing-step-title">
              Take the Exam &amp;<br />View Your Results
            </h3>
            <p className="landing-step-desc">
              Complete your entrance examination and receive your official qualification status directly through the portal.
            </p>
          </div>
        </div>
      </section>

      {/* Dark Value Banner replicating bottom reference section */}
      <section className="landing-promise-section">
        <div className="landing-promise-banner">
          <div className="landing-promise-glow" aria-hidden="true" />

          <div className="landing-promise-header">
            <h2 className="landing-promise-title">Committed to Fair &amp; Transparent Admissions</h2>
            <p className="landing-promise-desc">
              Every applicant deserves a clear, fair path to higher education. Our entrance
              examination portal ensures accurate scheduling, unbiased scoring, and timely
              results — every academic cycle.
            </p>
          </div>

          <div className="landing-promise-cards">
            <div className="landing-promise-card">
              <div className="promise-card-icon">
                <Clock size={20} />
              </div>
              <h4 className="promise-card-title">Real-Time Schedule Updates</h4>
              <p className="promise-card-text">
                Instant lookups for exam dates, room assignments, batch numbers, and proctor information — always current.
              </p>
            </div>

            <div className="landing-promise-card">
              <div className="promise-card-icon">
                <Users size={20} />
              </div>
              <h4 className="promise-card-title">Structured Batch Management</h4>
              <p className="promise-card-text">
                Examinees are organized into batches with designated rooms and proctors for an orderly, stress-free testing experience.
              </p>
            </div>

            <div className="landing-promise-card">
              <div className="promise-card-icon">
                <CheckCircle2 size={20} />
              </div>
              <h4 className="promise-card-title">Official Qualification Results</h4>
              <p className="promise-card-text">
                Fair, transparent scoring with reliable qualification outcomes published through the official admissions portal.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Examination Schedule Search Section */}
      <section id="schedule-search" className="landing-section landing-search-section">
        <div className="landing-section-title-wrap">
          <div className="landing-hero__pill-tag">
            <Calendar size={13} />
            <span>Examinee Schedule Verification</span>
          </div>
          <h2 className="landing-section-title">Search Examination Schedule</h2>
          <p className="landing-section-subtitle">
            Find your official test date, room assignment, time slot, and assigned batch.
          </p>
        </div>

        <form className="landing-search-box" onSubmit={handleSearch}>
          <div className="landing-search-field landing-search-field--select">
            <label htmlFor="searchTypeSelect">Search by</label>
            <select
              id="searchTypeSelect"
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
            >
              {SEARCH_TYPES.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="landing-search-field landing-search-field--input">
            <label htmlFor="searchQueryInput">Search query</label>
            <div className="landing-input-wrap">
              <Search size={17} className="input-search-icon" aria-hidden="true" />
              <input
                id="searchQueryInput"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={PLACEHOLDERS[searchType] || PLACEHOLDERS.auto}
                autoComplete="off"
                enterKeyHint="search"
              />
            </div>
          </div>

          <button type="submit" className="landing-search-submit" disabled={loading}>
            <Search size={16} aria-hidden="true" />
            <span>{loading ? 'Searching...' : 'Search Schedule'}</span>
          </button>
        </form>

        {error && <div className="landing-alert" role="alert">{error}</div>}
        {searched && !error && <p className="landing-search-count">{resultCountLabel}</p>}

        {results.length > 0 && (
          <div className="landing-results-grid">
            {results.map((row) => (
              <article
                key={`${row.applicant_code}-${row.exam_date}-${row.time_slot}`}
                className="landing-result-card"
              >
                <div className="result-card-header">
                  <div className="result-card-avatar">
                    <UserCheck size={18} />
                  </div>
                  <div>
                    <h3 className="result-card-name">{row.applicant_name}</h3>
                    <span className="result-card-code">
                      {row.applicant_code}
                      {row.reference_number ? ` · ${row.reference_number}` : ''}
                    </span>
                  </div>
                </div>

                <div className="result-card-details">
                  <div className="result-detail-row">
                    <span className="detail-label"><CalendarDays size={14} /> Date</span>
                    <strong className="detail-value">{row.date_label}</strong>
                  </div>
                  <div className="result-detail-row">
                    <span className="detail-label"><Clock3 size={14} /> Time</span>
                    <strong className="detail-value">{row.time_slot}</strong>
                  </div>
                  <div className="result-detail-row">
                    <span className="detail-label"><MapPin size={14} /> Room</span>
                    <strong className="detail-value">{row.rooms_label}</strong>
                  </div>
                  <div className="result-detail-row">
                    <span className="detail-label"><ShieldCheck size={14} /> Batch</span>
                    <strong className="detail-value">{row.batch_code}</strong>
                  </div>
                </div>

                <div className="result-card-footer">
                  <span className={`landing-status-badge status--${String(row.status).toLowerCase()}`}>
                    {row.status}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Announcements & Guidelines */}
      <section id="announcements" className="landing-section landing-announcements">
        <div className="landing-section-title-wrap">
          <h2 className="landing-section-title">Official Announcements</h2>
          <p className="landing-section-subtitle">
            Stay informed with the latest updates from the TCC Entrance Examination Committee.
          </p>
        </div>

        <div className="landing-announcements-grid">
          {ANNOUNCEMENTS.map((item) => (
            <article key={item.title} className="landing-announcement-card">
              <div className="announcement-card-top">
                <span className="announcement-tag">{item.tag}</span>
                <span className="announcement-date">{item.date}</span>
              </div>
              <h3 className="announcement-title">{item.title}</h3>
              <p className="announcement-body">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section id="faq" className="landing-section landing-faq-section">
        <div className="landing-section-title-wrap">
          <h2 className="landing-section-title">Frequently Asked Questions</h2>
          <p className="landing-section-subtitle">
            Everything you need to know about the entrance examination process.
          </p>
        </div>

        <div className="landing-faq-container">
          {FAQS.map((item) => (
            <details key={item.q} className="landing-faq-item">
              <summary className="faq-question">
                <span>{item.q}</span>
                <ChevronRight size={16} className="faq-chevron" />
              </summary>
              <div className="faq-answer">
                <p>{item.a}</p>
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="landing-section landing-contact-section">
        <div className="landing-contact-card">
          <div className="contact-info-block">
            <h2 className="contact-title">Need Assistance?</h2>
            <p className="contact-desc">
              Contact the Admissions & Entrance Examination Office for schedule verification,
              accommodations, and admissions questions.
            </p>

            <div className="contact-details">
              <div className="contact-item">
                <MapPin size={17} className="contact-icon" />
                <span>Tagoloan Community College, Baluarte, Tagoloan, Misamis Oriental</span>
              </div>
              <div className="contact-item">
                <Phone size={17} className="contact-icon" />
                <span>(088) 000-0000 · Mon–Fri, 8:00 AM – 5:00 PM</span>
              </div>
              <div className="contact-item">
                <GraduationCap size={17} className="contact-icon" />
                <span>admissions@tcc.edu.ph</span>
              </div>
            </div>
          </div>

          <div className="contact-action-block">
            <a href="#schedule-search" className="landing-btn-hero">
              <span>Verify My Schedule</span>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="footer-left">
            <img src={tccLogo} alt="" className="footer-logo" />
            <div>
              <strong>Tagoloan Community College</strong>
              <p>Entrance Examination Management System · Admissions Portal</p>
            </div>
          </div>
          <div className="footer-right">
            <p>© {new Date().getFullYear()} Tagoloan Community College. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
