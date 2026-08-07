import { useCallback, useEffect, useState } from 'react';
import { Building2, ClipboardList, Loader2, Mail, Plus, Save, Shield, Trash2, Users } from 'lucide-react';
import { examinationSettingsApi } from '../../api/examinationSettingsApi';
import { gradingApi } from '../../api/gradingApi';
import { ManagementButton } from '../../components/management/ManagementToolbar';
import { SkeletonTable } from '../../components/ui/Skeleton';
import {
  alertFromApiError,
  confirmAction,
  confirmDelete,
  showLoading,
  closeLoading,
  toastSuccess,
} from '../../utils/swal';
import '../../components/management/management.css';
import '../management/management-pages.css';
import './system-pages.css';

const SETTINGS_SECTIONS = [
  { key: 'school', label: 'School Information', icon: Building2 },
  { key: 'examination', label: 'Examination Settings', icon: ClipboardList },
  { key: 'user', label: 'User Settings', icon: Users },
  { key: 'email', label: 'Email Settings', icon: Mail },
  { key: 'security', label: 'Security Settings', icon: Shield },
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('school');
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [courseError, setCourseError] = useState('');
  const [courseNotice, setCourseNotice] = useState('');
  const [savingId, setSavingId] = useState(null);
  const [newCourse, setNewCourse] = useState({
    course_name: '',
    course_code: '',
    passing_percentage: 75,
  });
  const [examSettings, setExamSettings] = useState({
    duration_minutes: 90,
    shuffle_questions: true,
    shuffle_categories: false,
    shuffle_both: false,
  });
  const [examSaving, setExamSaving] = useState(false);
  const [examError, setExamError] = useState('');
  const [examNotice, setExamNotice] = useState('');

  const loadCourses = useCallback(async () => {
    setLoadingCourses(true);
    setCourseError('');
    try {
      const { data } = await gradingApi.list({ sync: 1 });
      setCourses(data.data || []);
    } catch (err) {
      setCourseError(err.response?.data?.message || 'Unable to load course grading settings.');
    } finally {
      setLoadingCourses(false);
    }
  }, []);

  const loadExamSettings = useCallback(async () => {
    setExamError('');
    try {
      const { data } = await examinationSettingsApi.get();
      const row = data.data || {};
      setExamSettings({
        duration_minutes: row.duration_minutes ?? 90,
        shuffle_questions: Boolean(row.shuffle_questions),
        shuffle_categories: Boolean(row.shuffle_categories),
        shuffle_both: Boolean(row.shuffle_both),
      });
    } catch (err) {
      setExamError(err.response?.data?.message || 'Unable to load examination settings.');
    }
  }, []);

  useEffect(() => {
    if (activeSection === 'examination') {
      loadCourses();
      loadExamSettings();
    }
  }, [activeSection, loadCourses, loadExamSettings]);

  const saveExamSettings = async (event) => {
    event.preventDefault();
    const ok = await confirmAction({
      title: 'Are you sure?',
      text: 'Save examination settings?',
    });
    if (!ok) return;

    setExamSaving(true);
    setExamError('');
    setExamNotice('');
    showLoading('Saving Settings...');
    try {
      const { data } = await examinationSettingsApi.update({
        duration_minutes: Number(examSettings.duration_minutes) || 90,
        allow_late_entry: false,
        shuffle_questions: Boolean(examSettings.shuffle_questions),
        shuffle_categories: Boolean(examSettings.shuffle_categories),
        shuffle_both: Boolean(examSettings.shuffle_both),
        default_start_at: null,
        default_end_at: null,
      });
      const row = data.data || {};
      setExamSettings({
        duration_minutes: row.duration_minutes ?? 90,
        shuffle_questions: Boolean(row.shuffle_questions),
        shuffle_categories: Boolean(row.shuffle_categories),
        shuffle_both: Boolean(row.shuffle_both),
      });
      closeLoading();
      setExamNotice('Examination settings saved.');
      await toastSuccess('Settings Saved Successfully');
    } catch (err) {
      closeLoading();
      setExamError(err.response?.data?.message || 'Unable to save examination settings.');
      await alertFromApiError(err, 'Unable to save examination settings.');
    } finally {
      setExamSaving(false);
    }
  };

  const updateLocal = (id, patch) => {
    setCourses((rows) => rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const saveCourse = async (row) => {
    const ok = await confirmAction({
      title: 'Are you sure?',
      text: `Save grading settings for ${row.course_name}?`,
    });
    if (!ok) return;

    setSavingId(row.id);
    setCourseNotice('');
    setCourseError('');
    showLoading('Saving Settings...');
    try {
      const { data } = await gradingApi.update(row.id, {
        course_name: row.course_name,
        passing_percentage: Number(row.passing_percentage),
        failing_grade_point: 5,
        is_active: row.is_active !== false,
      });
      updateLocal(row.id, data.data || row);
      closeLoading();
      setCourseNotice(`Saved passing grade for ${row.course_name}.`);
      await toastSuccess('Settings Saved Successfully');
    } catch (err) {
      closeLoading();
      setCourseError(err.response?.data?.message || 'Unable to save grading setting.');
      await alertFromApiError(err, 'Unable to save grading setting.');
    } finally {
      setSavingId(null);
    }
  };

  const createCourse = async (event) => {
    event.preventDefault();
    if (!newCourse.course_name.trim()) return;
    const ok = await confirmAction({
      title: 'Are you sure?',
      text: `Add grading settings for "${newCourse.course_name.trim()}"?`,
    });
    if (!ok) return;

    setSavingId('new');
    setCourseError('');
    showLoading('Saving Settings...');
    try {
      await gradingApi.create({
        course_name: newCourse.course_name.trim(),
        course_code: newCourse.course_code.trim() || undefined,
        passing_percentage: Number(newCourse.passing_percentage) || 75,
        failing_grade_point: 5,
      });
      setNewCourse({ course_name: '', course_code: '', passing_percentage: 75 });
      closeLoading();
      setCourseNotice('Course grading setting added.');
      await toastSuccess('Settings Saved Successfully');
      await loadCourses();
    } catch (err) {
      closeLoading();
      setCourseError(err.response?.data?.message || 'Unable to add course.');
      await alertFromApiError(err, 'Unable to add course.');
    } finally {
      setSavingId(null);
    }
  };

  const removeCourse = async (row) => {
    if (row.course_code === 'GENERAL') return;
    const ok = await confirmDelete({
      text: `Remove grading settings for ${row.course_name}? This action cannot be undone.`,
    });
    if (!ok) return;
    showLoading('Deleting...');
    try {
      await gradingApi.remove(row.id);
      closeLoading();
      setCourseNotice(`Removed ${row.course_name}.`);
      await toastSuccess('Record Deleted Successfully');
      await loadCourses();
    } catch (err) {
      closeLoading();
      setCourseError(err.response?.data?.message || 'Unable to delete setting.');
      await alertFromApiError(err, 'Unable to delete setting.');
    }
  };

  return (
    <div className="mp-page">
      <header className="mp-header">
        <div>
          <p className="mp-header__eyebrow">System</p>
          <h1 className="mp-header__title">Settings</h1>
          <p className="mp-header__lede">
            Configure school information, examination rules, user preferences, email, and security.
          </p>
        </div>
      </header>

      <div className="sp-settings-layout">
        <section className="mp-panel sp-settings-content" aria-label="Settings form">
          {activeSection === 'school' && (
            <>
              <h2 className="mp-panel__title">School Information</h2>
              <div className="sp-form">
                <label className="sp-form__label" htmlFor="school-name">School Name</label>
                <input id="school-name" type="text" className="sp-form__input" defaultValue="Tagoloan Community College" />
                <label className="sp-form__label" htmlFor="school-address">Address</label>
                <input id="school-address" type="text" className="sp-form__input" defaultValue="Tagoloan, Misamis Oriental" />
                <label className="sp-form__label" htmlFor="school-contact">Contact Number</label>
                <input id="school-contact" type="text" className="sp-form__input" defaultValue="+63 912 345 6789" />
                <label className="sp-form__label" htmlFor="school-email">Official Email</label>
                <input id="school-email" type="email" className="sp-form__input" defaultValue="info@tcc.edu.ph" />
              </div>
            </>
          )}

          {activeSection === 'examination' && (
            <>
              <h2 className="mp-panel__title">Examination Settings</h2>
              <p className="mp-panel__hint">
                These settings control exam length and how questions are ordered for students on mobile.
              </p>

              {examError ? <div className="mp-alert mp-alert--error" role="alert">{examError}</div> : null}
              {examNotice ? <div className="mp-alert mp-alert--success" role="status">{examNotice}</div> : null}

              <form className="sp-form sp-settings-cards" onSubmit={saveExamSettings} style={{ marginBottom: 28 }}>
                <div className="sp-settings-card">
                  <h3 className="sp-settings-card__title">Duration</h3>
                  <p className="sp-settings-card__hint">How long students have once the proctor starts the exam.</p>
                  <label className="sp-form__label" htmlFor="exam-duration">Minutes</label>
                  <input
                    id="exam-duration"
                    type="number"
                    min={1}
                    max={600}
                    className="sp-form__input"
                    value={examSettings.duration_minutes}
                    onChange={(e) => setExamSettings((s) => ({ ...s, duration_minutes: e.target.value }))}
                    required
                  />
                </div>

                <div className="sp-settings-card">
                  <h3 className="sp-settings-card__title">Question order</h3>
                  <p className="sp-settings-card__hint">
                    Choose how categories and questions are shuffled for each student.
                  </p>

                  <label className="sp-toggle-row">
                    <input
                      type="checkbox"
                      checked={examSettings.shuffle_questions}
                      onChange={(e) => setExamSettings((s) => ({ ...s, shuffle_questions: e.target.checked, shuffle_both: false }))}
                    />
                    <span>
                      <strong>Shuffle questions within each category</strong>
                      <small>Math questions appear in a different order for each student.</small>
                    </span>
                  </label>

                  <label className="sp-toggle-row">
                    <input
                      type="checkbox"
                      checked={examSettings.shuffle_categories}
                      onChange={(e) => setExamSettings((s) => ({ ...s, shuffle_categories: e.target.checked, shuffle_both: false }))}
                    />
                    <span>
                      <strong>Shuffle category order</strong>
                      <small>One student may see English first; another may see Math first.</small>
                    </span>
                  </label>

                  <label className="sp-toggle-row">
                    <input
                      type="checkbox"
                      checked={examSettings.shuffle_both}
                      onChange={(e) => setExamSettings((s) => ({
                        ...s,
                        shuffle_both: e.target.checked,
                        shuffle_questions: e.target.checked ? true : s.shuffle_questions,
                        shuffle_categories: e.target.checked ? true : s.shuffle_categories,
                      }))}
                    />
                    <span>
                      <strong>Full shuffle</strong>
                      <small>Turns on both category shuffle and question shuffle.</small>
                    </span>
                  </label>
                </div>

                <div className="sp-form__actions">
                  <ManagementButton type="submit" variant="primary" disabled={examSaving}>
                    {examSaving ? <Loader2 size={16} className="mp-loading__icon" /> : <Save size={16} />}
                    Save examination settings
                  </ManagementButton>
                </div>
              </form>

              <h2 className="mp-panel__title">Course passing grades</h2>
              <p className="mp-panel__hint">
                Scores are shown as correct answers over total exam items (example: <strong>45/50</strong>).
                Pass/fail still uses each course&apos;s passing percentage. A 5-point grade (1.00 best → 5.00 fail)
                is also computed and stored.
              </p>

              {courseError ? <div className="mp-alert mp-alert--error" role="alert">{courseError}</div> : null}
              {courseNotice ? <div className="mp-alert mp-alert--success" role="status">{courseNotice}</div> : null}

              {loadingCourses ? (
                <SkeletonTable rows={4} cols={4} />
              ) : (
                <div className="mp-table-wrap" style={{ marginBottom: 20 }}>
                  <table className="mp-table">
                    <thead>
                      <tr>
                        <th>Course / Program</th>
                        <th>Code</th>
                        <th>Passing %</th>
                        <th>Fail grade point</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {courses.map((row) => (
                        <tr key={row.id}>
                          <td>
                            <input
                              className="mp-field__input"
                              value={row.course_name}
                              onChange={(e) => updateLocal(row.id, { course_name: e.target.value })}
                            />
                          </td>
                          <td>{row.course_code}</td>
                          <td style={{ maxWidth: 110 }}>
                            <input
                              className="mp-field__input"
                              type="number"
                              min={0}
                              max={100}
                              step={0.01}
                              value={row.passing_percentage}
                              onChange={(e) => updateLocal(row.id, { passing_percentage: e.target.value })}
                            />
                          </td>
                          <td>5.00</td>
                          <td>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <ManagementButton
                                type="button"
                                variant="primary"
                                size="sm"
                                disabled={savingId === row.id}
                                onClick={() => saveCourse(row)}
                              >
                                {savingId === row.id ? <Loader2 size={14} className="mp-loading__icon" /> : <Save size={14} />}
                                Save
                              </ManagementButton>
                              {row.course_code !== 'GENERAL' ? (
                                <ManagementButton
                                  type="button"
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => removeCourse(row)}
                                >
                                  <Trash2 size={14} />
                                </ManagementButton>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <h3 className="mp-panel__title" style={{ fontSize: 15 }}>Add course passing grade</h3>
              <form className="sp-form" onSubmit={createCourse}>
                <label className="sp-form__label" htmlFor="new-course-name">Course name</label>
                <input
                  id="new-course-name"
                  className="sp-form__input"
                  value={newCourse.course_name}
                  onChange={(e) => setNewCourse((c) => ({ ...c, course_name: e.target.value }))}
                  placeholder="Bachelor of Science in Information Technology"
                  required
                />
                <label className="sp-form__label" htmlFor="new-course-code">Course code (optional)</label>
                <input
                  id="new-course-code"
                  className="sp-form__input"
                  value={newCourse.course_code}
                  onChange={(e) => setNewCourse((c) => ({ ...c, course_code: e.target.value }))}
                  placeholder="BSIT"
                />
                <label className="sp-form__label" htmlFor="new-pass">Passing percentage</label>
                <input
                  id="new-pass"
                  type="number"
                  min={0}
                  max={100}
                  className="sp-form__input"
                  value={newCourse.passing_percentage}
                  onChange={(e) => setNewCourse((c) => ({ ...c, passing_percentage: e.target.value }))}
                />
                <ManagementButton type="submit" variant="primary" disabled={savingId === 'new'}>
                  <Plus size={16} /> Add course
                </ManagementButton>
              </form>
            </>
          )}

          {activeSection === 'user' && (
            <>
              <h2 className="mp-panel__title">User Settings</h2>
              <div className="sp-form">
                <label className="sp-form__label" htmlFor="default-role">Default Role for New Users</label>
                <select id="default-role" className="sp-form__input">
                  <option>Proctor</option>
                  <option>Admin</option>
                </select>
              </div>
            </>
          )}

          {activeSection === 'email' && (
            <>
              <h2 className="mp-panel__title">Email Settings</h2>
              <div className="sp-form">
                <label className="sp-form__label" htmlFor="smtp-host">SMTP Host</label>
                <input id="smtp-host" type="text" className="sp-form__input" placeholder="smtp.example.com" />
              </div>
            </>
          )}

          {activeSection === 'security' && (
            <>
              <h2 className="mp-panel__title">Security Settings</h2>
              <div className="sp-form">
                <label className="sp-form__label" htmlFor="session-timeout">Session timeout (minutes)</label>
                <input id="session-timeout" type="number" className="sp-form__input" defaultValue={60} />
              </div>
            </>
          )}
        </section>

        <nav className="mp-panel sp-settings-nav" aria-label="Settings sections">
          {SETTINGS_SECTIONS.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.key}
                type="button"
                className={`sp-settings-nav__item${activeSection === section.key ? ' is-active' : ''}`}
                onClick={() => setActiveSection(section.key)}
              >
                <Icon size={16} />
                {section.label}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
