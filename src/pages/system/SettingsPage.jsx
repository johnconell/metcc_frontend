import { useState } from 'react';
import { Building2, ClipboardList, Mail, Save, Shield, Users } from 'lucide-react';
import { ManagementButton } from '../../components/management/ManagementToolbar';
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
        <div className="mp-header__actions">
          <ManagementButton variant="primary">
            <Save size={16} aria-hidden="true" /> Save Changes
          </ManagementButton>
        </div>
      </header>

      <div className="mp-split">
        <nav className="mp-panel sp-settings-nav" aria-label="Settings sections">
          {SETTINGS_SECTIONS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              className={`sp-settings-nav__item${activeSection === key ? ' sp-settings-nav__item--active' : ''}`}
              onClick={() => setActiveSection(key)}
            >
              <Icon size={16} aria-hidden="true" />
              {label}
            </button>
          ))}
        </nav>

        <section className="mp-panel" aria-label="Settings form">
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
              <div className="sp-form">
                <label className="sp-form__label" htmlFor="exam-duration">Default Exam Duration (minutes)</label>
                <input id="exam-duration" type="number" className="sp-form__input" defaultValue="120" />
                <label className="sp-form__label" htmlFor="passing-score">Passing Score (%)</label>
                <input id="passing-score" type="number" className="sp-form__input" defaultValue="60" />
                <label className="sp-form__label" htmlFor="late-entry">Late Entry Grace Period (minutes)</label>
                <input id="late-entry" type="number" className="sp-form__input" defaultValue="15" />
                <label className="sp-form__toggle">
                  <input type="checkbox" defaultChecked />
                  <span>Enable anti-cheat (fullscreen, tab switch lock)</span>
                </label>
                <label className="sp-form__toggle">
                  <input type="checkbox" defaultChecked />
                  <span>Randomize question order per examinee</span>
                </label>
              </div>
            </>
          )}

          {activeSection === 'user' && (
            <>
              <h2 className="mp-panel__title">User Settings</h2>
              <div className="sp-form">
                <label className="sp-form__label" htmlFor="default-role">Default Role for New Users</label>
                <select id="default-role" className="sp-form__input">
                  <option>Proctor</option>
                  <option>Administrator</option>
                  <option>Staff</option>
                </select>
                <label className="sp-form__toggle">
                  <input type="checkbox" defaultChecked />
                  <span>Require email verification on registration</span>
                </label>
                <label className="sp-form__toggle">
                  <input type="checkbox" />
                  <span>Allow self-registration for students</span>
                </label>
                <label className="sp-form__label" htmlFor="session-timeout">Session Timeout (minutes)</label>
                <input id="session-timeout" type="number" className="sp-form__input" defaultValue="30" />
              </div>
            </>
          )}

          {activeSection === 'email' && (
            <>
              <h2 className="mp-panel__title">Email Settings</h2>
              <div className="sp-form">
                <label className="sp-form__label" htmlFor="smtp-host">SMTP Host</label>
                <input id="smtp-host" type="text" className="sp-form__input" defaultValue="smtp.gmail.com" />
                <label className="sp-form__label" htmlFor="smtp-port">SMTP Port</label>
                <input id="smtp-port" type="number" className="sp-form__input" defaultValue="587" />
                <label className="sp-form__label" htmlFor="sender-email">Sender Email</label>
                <input id="sender-email" type="email" className="sp-form__input" defaultValue="noreply@tcc.edu.ph" />
                <label className="sp-form__label" htmlFor="sender-name">Sender Name</label>
                <input id="sender-name" type="text" className="sp-form__input" defaultValue="TCC Examination System" />
              </div>
            </>
          )}

          {activeSection === 'security' && (
            <>
              <h2 className="mp-panel__title">Security Settings</h2>
              <div className="sp-form">
                <label className="sp-form__label" htmlFor="min-password">Minimum Password Length</label>
                <input id="min-password" type="number" className="sp-form__input" defaultValue="8" />
                <label className="sp-form__toggle">
                  <input type="checkbox" defaultChecked />
                  <span>Require uppercase and numbers in passwords</span>
                </label>
                <label className="sp-form__toggle">
                  <input type="checkbox" defaultChecked />
                  <span>Enable two-factor authentication for admins</span>
                </label>
                <label className="sp-form__toggle">
                  <input type="checkbox" />
                  <span>Lock account after 5 failed login attempts</span>
                </label>
                <label className="sp-form__label" htmlFor="lockout-duration">Lockout Duration (minutes)</label>
                <input id="lockout-duration" type="number" className="sp-form__input" defaultValue="15" />
              </div>
            </>
          )}

          <div className="sp-form__actions">
            <ManagementButton variant="primary">
              <Save size={16} aria-hidden="true" /> Save Changes
            </ManagementButton>
          </div>
        </section>
      </div>
    </div>
  );
}
