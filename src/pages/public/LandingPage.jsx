import { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  CalendarDays,
  Clock3,
  GraduationCap,
  HelpCircle,
  MapPin,
  Megaphone,
  Phone,
  Search,
  ShieldCheck,
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

const ANNOUNCEMENTS = [
  {
    title: 'Important Notice',
    body: 'Examinees must present a valid ID and their examination slip on exam day.',
  },
  {
    title: 'Examination Guidelines',
    body: 'Arrive 30 minutes early. Electronic devices are not allowed unless instructed by proctors.',
  },
  {
    title: 'Schedule Updates',
    body: 'Check this page regularly for batch and room updates before examination day.',
  },
  {
    title: 'Admission Announcements',
    body: 'Course preference confirmation and admission results follow the official admissions calendar.',
  },
];

const FAQS = [
  {
    q: 'How do I find my examination schedule?',
    a: 'Use Student Portal search below. You can search by Applicant ID, student name, or reference number. Matching schedules show date, time, room, batch, and status.',
  },
  {
    q: 'What should I bring during the examination?',
    a: 'Bring a valid ID, pencil/pen, and any documents required by the admissions office. Electronic devices are not allowed unless instructed.',
  },
  {
    q: 'What time should I arrive?',
    a: 'Arrive at least 30 minutes before your assigned time slot for verification and seating.',
  },
  {
    q: 'Who do I contact for concerns?',
    a: 'Contact the TCC Admissions / Entrance Examination office using the contact details at the bottom of this page.',
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
    <div className="landing">
      <header className="landing-nav">
        <div className="landing-nav__brand">
          <img src={tccLogo} alt="Tagoloan Community College" className="landing-nav__logo" />
          <div>
            <strong>Tagoloan Community College</strong>
            <span>Entrance Examination System</span>
          </div>
        </div>
        <nav className="landing-nav__actions" aria-label="Landing navigation">
          <a href="#student-portal" className="landing-btn landing-btn--ghost">Student Portal</a>
          <a href="#schedule-search" className="landing-btn landing-btn--ghost">Search Schedule</a>
          {isAuthenticated ? (
            <Link to="/dashboard" className="landing-btn landing-btn--primary">Dashboard</Link>
          ) : (
            <Link to="/login" className="landing-btn landing-btn--primary">Admin Sign In</Link>
          )}
        </nav>
      </header>

      {flashMessage && (
        <div className="landing-flash" role="status">
          <p>{flashMessage}</p>
          <button type="button" onClick={() => setFlashMessage('')} aria-label="Dismiss message">
            ×
          </button>
        </div>
      )}

      <section className="landing-hero" aria-labelledby="landing-hero-title">
        <div className="landing-hero__content">
          <img src={tccLogo} alt="Tagoloan Community College logo" className="landing-hero__logo" />
          <p className="landing-hero__eyebrow">Tagoloan Community College</p>
          <h1 id="landing-hero-title">
            Welcome to the Tagoloan Community College Entrance Examination Management System
          </h1>
          <p className="landing-hero__lede">
            Find your examination schedule, review guidelines, and stay updated on admission announcements—all in one official portal.
          </p>
          <div className="landing-hero__cta">
            <a href="#schedule-search" className="landing-btn landing-btn--gold">
              <Search size={16} aria-hidden="true" /> Search Examination Schedule
            </a>
            <a href="#student-portal" className="landing-btn landing-btn--ghost-light">
              <GraduationCap size={16} aria-hidden="true" /> Student Portal
            </a>
            <a href="#guidelines" className="landing-btn landing-btn--ghost-light">
              View Examination Information
            </a>
          </div>
        </div>
      </section>

      <section id="student-portal" className="landing-section landing-portal" aria-labelledby="portal-title">
        <div className="landing-section__head">
          <h2 id="portal-title"><GraduationCap size={20} /> Student Portal</h2>
          <p>
            Look up your assigned examination day using your Applicant ID, full or partial name, or reference number.
          </p>
        </div>
        <div className="landing-portal__hint">
          <p>
            Tip: Prefer Applicant ID or Reference Number for the most accurate match when multiple students share similar names.
          </p>
        </div>
      </section>

      <section id="schedule-search" className="landing-section landing-search" aria-labelledby="search-title">
        <div className="landing-section__head">
          <h2 id="search-title"><CalendarDays size={20} /> Examination Schedule Search</h2>
          <p>Search by Applicant ID, student name, or reference number.</p>
        </div>

        <form className="landing-search__form" onSubmit={handleSearch}>
          <label className="landing-search__field landing-search__field--type">
            <span>Search by</span>
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              aria-label="Search field type"
            >
              {SEARCH_TYPES.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </label>
          <label className="landing-search__field landing-search__field--query">
            <span>Search query</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={PLACEHOLDERS[searchType] || PLACEHOLDERS.auto}
              autoComplete="off"
              enterKeyHint="search"
            />
          </label>
          <button type="submit" className="landing-btn landing-btn--primary" disabled={loading}>
            <Search size={16} aria-hidden="true" />
            {loading ? 'Searching...' : 'Search Schedule'}
          </button>
        </form>

        {error && <div className="landing-alert" role="alert">{error}</div>}
        {searched && !error && <p className="landing-search__meta">{resultCountLabel}</p>}

        {results.length > 0 && (
          <div className="landing-results">
            {results.map((row) => (
              <article
                key={`${row.applicant_code}-${row.exam_date}-${row.time_slot}`}
                className="landing-result-card"
              >
                <h3>{row.applicant_name}</h3>
                <p className="landing-result-card__code">
                  {row.applicant_code}
                  {row.reference_number ? ` · ${row.reference_number}` : ''}
                </p>
                <dl>
                  <div><dt><CalendarDays size={14} /> Examination Date</dt><dd>{row.date_label}</dd></div>
                  <div><dt><Clock3 size={14} /> Examination Time</dt><dd>{row.time_slot}</dd></div>
                  <div><dt><MapPin size={14} /> Examination Room</dt><dd>{row.rooms_label}</dd></div>
                  <div><dt><ShieldCheck size={14} /> Assigned Batch</dt><dd>{row.batch_code}</dd></div>
                  <div><dt>Examination Status</dt><dd className="landing-pill">{row.status}</dd></div>
                </dl>
              </article>
            ))}
          </div>
        )}
      </section>

      <section id="guidelines" className="landing-section" aria-labelledby="announce-title">
        <div className="landing-section__head">
          <h2 id="announce-title"><Megaphone size={20} /> Announcements</h2>
          <p>Important notices, examination guidelines, schedule updates, and admission announcements.</p>
        </div>
        <div className="landing-cards">
          {ANNOUNCEMENTS.map((item) => (
            <article key={item.title} className="landing-card">
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section landing-section--soft" aria-labelledby="faq-title">
        <div className="landing-section__head">
          <h2 id="faq-title"><HelpCircle size={20} /> Frequently Asked Questions</h2>
        </div>
        <div className="landing-faq">
          {FAQS.map((item) => (
            <details key={item.q} className="landing-faq__item">
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="landing-section" aria-labelledby="contact-title">
        <div className="landing-section__head">
          <h2 id="contact-title"><Phone size={20} /> Contact Information</h2>
          <p>For schedule concerns and admission questions.</p>
        </div>
        <div className="landing-contact">
          <p><strong>Tagoloan Community College</strong></p>
          <p>Admissions / Entrance Examination Office</p>
          <p>Email: admissions@tcc.edu.ph</p>
          <p>Phone: (088) 000-0000</p>
          <p>Office hours: Mon–Fri, 8:00 AM – 5:00 PM</p>
        </div>
      </section>

      <footer className="landing-footer">
        <img src={tccLogo} alt="" />
        <p>© {new Date().getFullYear()} Tagoloan Community College · Entrance Examination System</p>
      </footer>
    </div>
  );
}
