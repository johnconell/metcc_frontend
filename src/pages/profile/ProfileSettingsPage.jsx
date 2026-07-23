import { useEffect, useRef, useState } from 'react';
import { Eye, EyeOff, Languages, Monitor, Moon, Sun, Upload } from 'lucide-react';
import { profileApi } from '../../api/profileApi';
import { authApi } from '../../api/authApi';
import { useAuth } from '../../auth/useAuth';
import { tokenStorage } from '../../auth/tokenStorage';
import { usePreferences } from '../../preferences/PreferencesContext';
import './profile-settings.css';

function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function AlertBanner({ type, message, onClose }) {
  if (!message) return null;
  return (
    <div className={`profile-alert profile-alert--${type}`} role={type === 'error' ? 'alert' : 'status'}>
      <span>{message}</span>
      {onClose && (
        <button type="button" className="profile-alert__close" onClick={onClose} aria-label="Dismiss">
          ×
        </button>
      )}
    </div>
  );
}

function PasswordInput({ id, label, value, onChange, show, onToggle }) {
  return (
    <label className="profile-field" htmlFor={id}>
      <span className="profile-field__label">{label}</span>
      <div style={{ position: 'relative' }}>
        <input
          id={id}
          className="profile-field__input"
          style={{ paddingRight: 42 }}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          autoComplete="new-password"
          required
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={show ? 'Hide password' : 'Show password'}
          style={{
            position: 'absolute',
            right: 10,
            top: '50%',
            transform: 'translateY(-50%)',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            color: '#6d6865',
            display: 'inline-flex',
          }}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </label>
  );
}

export default function ProfileSettingsPage() {
  const { user, fetchUser } = useAuth();
  const { theme, locale, setTheme, setLocale, syncFromUser, t, languages } = usePreferences();
  const fileInputRef = useRef(null);

  const [profileForm, setProfileForm] = useState({ name: '', email: '' });
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    password: '',
    password_confirmation: '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (!user) return;
    setProfileForm({ name: user.name || '', email: user.email || '' });
    syncFromUser(user);
  }, [user, syncFromUser]);

  useEffect(() => {
    if (!message) return undefined;
    const timer = window.setTimeout(() => setMessage(''), 4500);
    return () => window.clearTimeout(timer);
  }, [message]);

  const showSuccess = (text) => {
    setMessage(text);
    setError('');
  };

  const showError = (err, fallback) => {
    const data = err?.response?.data;
    const detail = data?.errors
      ? Object.values(data.errors).flat().join(' ')
      : data?.message;
    setError(detail || fallback);
    setMessage('');
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setSavingProfile(true);
    try {
      await profileApi.update({
        name: profileForm.name.trim(),
        email: profileForm.email.trim(),
      });
      await fetchUser();
      showSuccess(t('profileUpdated'));
    } catch (err) {
      showError(err, 'Update failed.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePhoto = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      await profileApi.uploadPhoto(file);
      await fetchUser();
      showSuccess(t('photoUploaded'));
    } catch (err) {
      showError(err, 'Upload failed.');
    }
  };

  const handleRemovePhoto = async () => {
    try {
      await profileApi.removePhoto();
      await fetchUser();
      showSuccess(t('photoRemoved'));
    } catch (err) {
      showError(err, 'Remove failed.');
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    if (passwordForm.password !== passwordForm.password_confirmation) {
      setError('Passwords do not match.');
      setMessage('');
      return;
    }

    setSavingPassword(true);
    try {
      const { data } = await authApi.changePassword(passwordForm);
      if (data?.data?.token) {
        tokenStorage.set(data.data.token);
      }
      setPasswordForm({ current_password: '', password: '', password_confirmation: '' });
      showSuccess(t('passwordUpdated'));
    } catch (err) {
      showError(err, 'Change password failed.');
    } finally {
      setSavingPassword(false);
    }
  };

  const persistPreference = async (payload, applyLocal) => {
    applyLocal();
    setSavingPrefs(true);
    try {
      await profileApi.update(payload);
      await fetchUser();
      showSuccess(t('preferencesSaved'));
    } catch (err) {
      showError(err, 'Could not save preferences.');
    } finally {
      setSavingPrefs(false);
    }
  };

  const themeOptions = [
    { value: 'light', label: t('lightMode'), icon: Sun },
    { value: 'dark', label: t('darkMode'), icon: Moon },
    { value: 'system', label: t('systemDefault'), icon: Monitor },
  ];

  const languageOptions = languages.map((option) => ({
    value: option.value,
    label: `${t(option.labelKey)} · ${option.nativeLabel}`,
  }));

  return (
    <div className="profile-page">
      <header className="profile-page__header">
        <h1>{t('profileSettings')}</h1>
        <p>{t('profileSubtitle')}</p>
      </header>

      <AlertBanner type="success" message={message} onClose={() => setMessage('')} />
      <AlertBanner type="error" message={error} onClose={() => setError('')} />

      <section className="profile-section" aria-labelledby="manage-account-title">
        <h2 id="manage-account-title" className="profile-section__title">{t('manageAccount')}</h2>
        <p className="profile-section__hint">{t('manageAccountHint')}</p>

        <div className="profile-section__body">
          <div className="profile-photo">
            <div className="profile-photo__avatar" aria-hidden="true">
              {user?.profile_photo_url ? (
                <img
                  key={user.profile_photo_url}
                  src={`${user.profile_photo_url}${user.profile_photo_url.includes('?') ? '&' : '?'}t=${user.updated_at || Date.now()}`}
                  alt=""
                />
              ) : (
                getInitials(user?.name)
              )}
            </div>
            <div>
              <div className="profile-section__title" style={{ fontSize: 15 }}>{t('profilePicture')}</div>
              <p className="profile-section__hint">{t('profilePictureHint')}</p>
              <div className="profile-photo__actions" style={{ marginTop: 10 }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="profile-photo__file"
                  onChange={handlePhoto}
                />
                <button
                  type="button"
                  className="profile-btn profile-btn--secondary"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={15} aria-hidden="true" />
                  {t('changePhoto')}
                </button>
                {user?.profile_photo_url && (
                  <button type="button" className="profile-btn profile-btn--secondary" onClick={handleRemovePhoto}>
                    {t('removePhoto')}
                  </button>
                )}
              </div>
            </div>
          </div>

          <form className="profile-form" style={{ marginTop: 20 }} onSubmit={handleProfileSubmit}>
            <h3 className="profile-section__title" style={{ fontSize: 15 }}>{t('profileInformation')}</h3>
            <label className="profile-field">
              <span className="profile-field__label">{t('fullName')}</span>
              <input
                className="profile-field__input"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                required
                autoComplete="name"
              />
            </label>
            <label className="profile-field">
              <span className="profile-field__label">{t('emailAddress')}</span>
              <input
                className="profile-field__input"
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                required
                autoComplete="email"
              />
            </label>
            <div className="profile-actions">
              <button type="submit" className="profile-btn profile-btn--primary" disabled={savingProfile}>
                {savingProfile ? t('saving') : t('saveChanges')}
              </button>
            </div>
          </form>
        </div>
      </section>

      <section className="profile-section" aria-labelledby="change-password-title">
        <h2 id="change-password-title" className="profile-section__title">{t('changePassword')}</h2>
        <p className="profile-section__hint">{t('changePasswordHint')}</p>
        <form className="profile-form profile-section__body" onSubmit={handlePasswordSubmit}>
          <PasswordInput
            id="current-password"
            label={t('currentPassword')}
            value={passwordForm.current_password}
            onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
            show={showCurrent}
            onToggle={() => setShowCurrent((v) => !v)}
          />
          <PasswordInput
            id="new-password"
            label={t('newPassword')}
            value={passwordForm.password}
            onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })}
            show={showNew}
            onToggle={() => setShowNew((v) => !v)}
          />
          <PasswordInput
            id="confirm-password"
            label={t('confirmPassword')}
            value={passwordForm.password_confirmation}
            onChange={(e) => setPasswordForm({ ...passwordForm, password_confirmation: e.target.value })}
            show={showConfirm}
            onToggle={() => setShowConfirm((v) => !v)}
          />
          <div className="profile-actions">
            <button type="submit" className="profile-btn profile-btn--primary" disabled={savingPassword}>
              {savingPassword ? t('saving') : t('updatePassword')}
            </button>
          </div>
        </form>
      </section>

      <section className="profile-section" aria-labelledby="theme-settings-title">
        <h2 id="theme-settings-title" className="profile-section__title">{t('themeSettings')}</h2>
        <p className="profile-section__hint">{t('themeHint')}</p>
        <div className="profile-choice-grid profile-section__body" role="radiogroup" aria-label={t('themeSettings')}>
          {themeOptions.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={theme === value}
              className={`profile-choice${theme === value ? ' profile-choice--active' : ''}`}
              disabled={savingPrefs}
              onClick={() => persistPreference({ theme: value }, () => setTheme(value))}
            >
              <span className="profile-choice__icon"><Icon size={16} aria-hidden="true" /></span>
              <span className="profile-choice__label">{label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="profile-section" aria-labelledby="language-settings-title">
        <h2 id="language-settings-title" className="profile-section__title">{t('languageSettings')}</h2>
        <p className="profile-section__hint">{t('languageHint')}</p>
        <div className="profile-choice-grid profile-section__body" role="radiogroup" aria-label={t('languageSettings')}>
          {languageOptions.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={locale === value}
              className={`profile-choice${locale === value ? ' profile-choice--active' : ''}`}
              disabled={savingPrefs}
              onClick={() => persistPreference({ locale: value }, () => setLocale(value))}
            >
              <span className="profile-choice__icon"><Languages size={16} aria-hidden="true" /></span>
              <span className="profile-choice__label">{label}</span>
            </button>
          ))}
        </div>
      </section>

      <p className="profile-note">{t('accountNote')}</p>
    </div>
  );
}
