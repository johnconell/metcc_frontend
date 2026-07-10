import { Eye, History, Pencil } from 'lucide-react';
import { ManagementButton } from '../../components/management/ManagementToolbar';
import { StatusBadge } from '../../components/management/StatusBadge';
import '../../components/management/management.css';
import './management-pages.css';

const RULES = [
  {
    label: 'Rules & Regulations',
    text: 'Examinees must remain seated, follow proctor instructions, and complete the exam within the allotted time.',
  },
  {
    label: 'Identity Verification',
    text: 'Photo capture and ID validation are required before the exam timer starts.',
  },
  {
    label: 'Late Entry',
    text: 'No entry after 15 minutes from the official start time. Late examinees are marked absent.',
  },
  {
    label: 'Auto Lock',
    text: 'The exam locks automatically after 3 tab switches or 5 minutes of inactivity.',
  },
  {
    label: 'Anti-Cheat',
    text: 'Fullscreen is enforced, the clipboard is disabled, and item order is randomized per examinee.',
  },
];

const REQUIREMENTS = [
  { key: 'Allowed items', value: 'Valid ID + exam permit' },
  { key: 'Personal devices', value: 'Stored before entry' },
  { key: 'Browser', value: 'Latest Chrome or Edge' },
  { key: 'JavaScript', value: 'Required' },
  { key: 'Pop-up blocker', value: 'Disabled for exam domain' },
];

export default function LobbyPage() {
  return (
    <div className="mp-page">
      <header className="mp-header">
        <div>
          <p className="mp-header__eyebrow">Management</p>
          <h1 className="mp-header__title">Examination Lobby</h1>
          <p className="mp-header__lede">
            The rules and requirements every examinee sees before their exam begins.
          </p>
        </div>
        <div className="mp-header__actions">
          <ManagementButton variant="secondary">
            <Eye size={16} aria-hidden="true" /> Preview
          </ManagementButton>
          <ManagementButton variant="secondary">
            <History size={16} aria-hidden="true" /> History
          </ManagementButton>
          <ManagementButton variant="secondary">
            <Pencil size={16} aria-hidden="true" /> Edit
          </ManagementButton>
          <ManagementButton variant="primary">Publish</ManagementButton>
        </div>
      </header>

      <div className="mp-status-line">
        <StatusBadge variant="success">Published</StatusBadge>
        <span>Version 4 · last published May 26, 2025 by Kent Russel Casino</span>
      </div>

      <div className="mp-split">
        <section className="mp-panel" aria-label="Lobby rules">
          <h2 className="mp-panel__title">Lobby Rules</h2>
          <ol className="mp-rules">
            {RULES.map((rule) => (
              <li key={rule.label} className="mp-rules__item">
                <span className="mp-rules__num" aria-hidden="true" />
                <div>
                  <h3 className="mp-rules__label">{rule.label}</h3>
                  <p className="mp-rules__text">{rule.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          <aside className="mp-panel" aria-label="Entry requirements">
            <h2 className="mp-panel__title">Entry Requirements</h2>
            <div className="mp-kv">
              {REQUIREMENTS.map((req) => (
                <div key={req.key} className="mp-kv__row">
                  <span className="mp-kv__key">{req.key}</span>
                  <span className="mp-kv__val">{req.value}</span>
                </div>
              ))}
            </div>
          </aside>

          <aside className="mp-panel" aria-label="Support contact">
            <h2 className="mp-panel__title">Need Help?</h2>
            <div className="mp-kv">
              <div className="mp-kv__row">
                <span className="mp-kv__key">Help desk</span>
                <span className="mp-kv__val">helpdesk@tcc.edu.ph</span>
              </div>
              <div className="mp-kv__row">
                <span className="mp-kv__key">Phone</span>
                <span className="mp-kv__val">Local 210</span>
              </div>
              <div className="mp-kv__row">
                <span className="mp-kv__key">Hours</span>
                <span className="mp-kv__val">7:00 AM – 5:00 PM, Mon–Fri</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
