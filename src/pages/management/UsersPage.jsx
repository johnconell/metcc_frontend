import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Eye,
  EyeOff,
  Loader2,
  Pencil,
  RefreshCw,
  UserPlus,
  UserX,
  Users,
} from 'lucide-react';
import { userApi } from '../../api/userApi';
import { roleApi } from '../../api/roleApi';
import { ManagementToolbar, ManagementButton } from '../../components/management/ManagementToolbar';
import { DataTable } from '../../components/management/DataTable';
import { StatusBadge } from '../../components/management/StatusBadge';
import { Pagination } from '../../components/management/Pagination';
import { useTableState, statusVariant } from './useTableState';
import { formatDate } from '../../utils/formatDate';
import '../../components/management/management.css';
import './management-pages.css';

const EMPTY_FORM = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  role_id: '',
  status: 'active',
};

function formatStatusLabel(status) {
  if (status === 'active') return 'Active';
  if (status === 'inactive') return 'Disabled';
  return status;
}

function mapUserToRow(user) {
  return {
    id: user.id,
    user: user.name,
    email: user.email,
    role: user.role?.name ?? '—',
    roleSlug: user.role?.slug,
    status: formatStatusLabel(user.status),
    statusRaw: user.status,
    createdAt: user.created_at ? formatDate(user.created_at) : '—',
    raw: user,
  };
}

function extractErrorMessage(error) {
  const data = error.response?.data;
  if (data?.errors) {
    return Object.values(data.errors).flat().join(' ');
  }
  return data?.message || 'Something went wrong. Please try again.';
}

function PageAlert({ type = 'error', message, onClose }) {
  if (!message) return null;

  return (
    <div className={`mp-alert mp-alert--${type}`} role={type === 'error' ? 'alert' : 'status'}>
      <span>{message}</span>
      {onClose && (
        <button type="button" className="mp-alert__close" onClick={onClose} aria-label="Dismiss">
          ×
        </button>
      )}
    </div>
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  required = false,
  showPassword,
  onToggleVisibility,
  invalid = false,
  errorMessage,
}) {
  return (
    <label className="mp-field" htmlFor={id}>
      <span className="mp-field__label">{label}</span>
      <div className={`mp-field__password${invalid ? ' mp-field__password--invalid' : ''}`}>
        <input
          id={id}
          className="mp-field__input mp-field__input--password"
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          required={required}
          autoComplete="new-password"
          aria-invalid={invalid}
          aria-describedby={invalid ? `${id}-error` : undefined}
        />
        <button
          type="button"
          className="mp-field__toggle"
          onClick={onToggleVisibility}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
        </button>
      </div>
      {invalid && errorMessage && (
        <span id={`${id}-error`} className="mp-field__error">
          {errorMessage}
        </span>
      )}
    </label>
  );
}

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formError, setFormError] = useState('');
  const [passwordMismatch, setPasswordMismatch] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const showSuccess = useCallback((message) => {
    setSuccess(message);
    setError('');
  }, []);

  const loadUsers = useCallback(async ({ silent = false } = {}) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError('');
    try {
      const { data } = await userApi.list({ per_page: 100 });
      return Array.isArray(data.data) ? data.data : [];
    } catch (err) {
      setError(extractErrorMessage(err));
      return null;
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadRoles = useCallback(async () => {
    try {
      const { data } = await roleApi.list();
      return Array.isArray(data.data) ? data.data : [];
    } catch {
      return [];
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function initializePage() {
      const [nextUsers, nextRoles] = await Promise.all([loadUsers(), loadRoles()]);
      if (cancelled) return;
      if (nextUsers) setUsers(nextUsers);
      setRoles(nextRoles);
    }

    initializePage();

    return () => {
      cancelled = true;
    };
  }, [loadUsers, loadRoles]);

  useEffect(() => {
    if (!success) return undefined;
    const timer = window.setTimeout(() => setSuccess(''), 5000);
    return () => window.clearTimeout(timer);
  }, [success]);

  const tableRows = useMemo(() => users.map(mapUserToRow), [users]);

  const filteredRows = useMemo(() => {
    return tableRows.filter((row) => {
      if (roleFilter && row.roleSlug !== roleFilter) return false;
      if (statusFilter && row.statusRaw !== statusFilter) return false;
      return true;
    });
  }, [tableRows, roleFilter, statusFilter]);

  const table = useTableState(filteredRows, {
    searchKeys: ['user', 'email', 'role', 'status'],
    pageSize: 10,
  });

  const stats = useMemo(() => ({
    total: users.length,
    activeCount: users.filter((user) => user.status === 'active').length,
    disabledCount: users.filter((user) => user.status === 'inactive').length,
    adminCount: users.filter((user) => user.role?.slug === 'admin').length,
    proctorCount: users.filter((user) => user.role?.slug === 'proctor').length,
  }), [users]);

  const resetPasswordFields = () => {
    setShowPassword(false);
    setShowConfirmPassword(false);
    setPasswordMismatch(false);
  };

  const refreshUsers = async () => {
    const nextUsers = await loadUsers({ silent: true });
    if (nextUsers) setUsers(nextUsers);
  };

  const openCreateForm = () => {
    setEditingUser(null);
    setForm({
      ...EMPTY_FORM,
      role_id: roles.find((role) => role.slug === 'proctor')?.id?.toString() || '',
    });
    setFormError('');
    resetPasswordFields();
    setShowForm(true);
  };

  const openEditForm = (row) => {
    const user = row.raw;
    setEditingUser(user);
    setForm({
      name: user.name,
      email: user.email,
      password: '',
      confirmPassword: '',
      role_id: user.role?.id?.toString() || '',
      status: user.status,
    });
    setFormError('');
    resetPasswordFields();
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingUser(null);
    setForm(EMPTY_FORM);
    setFormError('');
    resetPasswordFields();
  };

  const validatePasswords = () => {
    const password = form.password.trim();
    const confirmPassword = form.confirmPassword.trim();

    if (!editingUser) {
      if (!password) {
        setFormError('Password is required for new users.');
        return false;
      }
      if (password !== confirmPassword) {
        setPasswordMismatch(true);
        setFormError('Passwords do not match.');
        return false;
      }
      return true;
    }

    if (password && password !== confirmPassword) {
      setPasswordMismatch(true);
      setFormError('Passwords do not match.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setFormError('');
    setPasswordMismatch(false);

    if (!validatePasswords()) {
      setSaving(false);
      return;
    }

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      role_id: Number(form.role_id),
      status: form.status,
    };

    if (form.password.trim()) {
      payload.password = form.password;
    }

    try {
      if (editingUser) {
        await userApi.update(editingUser.id, payload);
        showSuccess(`${payload.name} was updated successfully.`);
      } else {
        await userApi.create({ ...payload, password: form.password });
        showSuccess(`${payload.name} was created successfully.`);
      }

      closeForm();
      await refreshUsers();
    } catch (err) {
      setFormError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (row) => {
    const isActive = row.statusRaw === 'active';
    const action = isActive ? 'disable' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} ${row.user}?`)) return;

    setError('');
    try {
      if (isActive) {
        await userApi.disable(row.id);
        showSuccess(`${row.user} has been disabled.`);
      } else {
        await userApi.enable(row.id);
        showSuccess(`${row.user} has been activated.`);
      }
      await refreshUsers();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  const handlePasswordChange = (value) => {
    setForm((current) => ({ ...current, password: value }));
    if (passwordMismatch) {
      setPasswordMismatch(false);
      setFormError('');
    }
  };

  const handleConfirmPasswordChange = (value) => {
    setForm((current) => ({ ...current, confirmPassword: value }));
    if (passwordMismatch) {
      setPasswordMismatch(false);
      setFormError('');
    }
  };

  const passwordsDoNotMatch =
    passwordMismatch ||
    (form.password.trim() &&
      form.confirmPassword.trim() &&
      form.password !== form.confirmPassword);

  const isSubmitDisabled =
    saving ||
    passwordsDoNotMatch ||
    (!editingUser && (!form.password.trim() || !form.confirmPassword.trim()));

  const columns = [
    { key: 'user', label: 'Name', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'role', label: 'Role', sortable: true },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (row) => (
        <StatusBadge variant={statusVariant(row.statusRaw === 'active' ? 'Active' : 'Inactive')}>
          {row.status}
        </StatusBadge>
      ),
    },
    { key: 'createdAt', label: 'Created', sortable: true },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="mgmt-table__actions">
          <ManagementButton
            variant="tertiary"
            size="sm"
            aria-label={`Edit ${row.user}`}
            onClick={() => openEditForm(row)}
          >
            <Pencil size={14} aria-hidden="true" />
          </ManagementButton>
          <ManagementButton
            variant="tertiary"
            size="sm"
            aria-label={row.statusRaw === 'active' ? `Disable ${row.user}` : `Activate ${row.user}`}
            onClick={() => handleToggleStatus(row)}
          >
            <UserX size={14} aria-hidden="true" />
          </ManagementButton>
        </div>
      ),
    },
  ];

  return (
    <div className="mp-page mp-users-page">
      <header className="mp-users-topbar">
        <div>
          <h1 className="mp-users-topbar__title">User Management</h1>
          <p className="mp-users-topbar__subtitle">
            Manage admin and proctor accounts
          </p>
        </div>
        <div className="mp-users-topbar__actions">
          <ManagementButton
            variant="secondary"
            onClick={refreshUsers}
            disabled={refreshing || loading}
          >
            <RefreshCw size={16} className={refreshing ? 'mp-loading__icon' : undefined} aria-hidden="true" />
            Refresh
          </ManagementButton>
          <ManagementButton variant="primary" onClick={openCreateForm}>
            <UserPlus size={16} aria-hidden="true" /> Add User
          </ManagementButton>
        </div>
      </header>

      <PageAlert type="success" message={success} onClose={() => setSuccess('')} />
      <PageAlert type="error" message={error} onClose={() => setError('')} />

      <div className="mp-users-chips" aria-label="Account summary">
        <span className="mp-users-chip"><strong>{stats.total}</strong> Total</span>
        <span className="mp-users-chip mp-users-chip--success"><strong>{stats.activeCount}</strong> Active</span>
        <span className="mp-users-chip mp-users-chip--muted"><strong>{stats.disabledCount}</strong> Disabled</span>
        <span className="mp-users-chip"><strong>{stats.adminCount}</strong> Admins</span>
        <span className="mp-users-chip"><strong>{stats.proctorCount}</strong> Proctors</span>
      </div>

      <section className="mp-panel mp-users-panel" aria-label="User accounts">
        <ManagementToolbar
          searchId="user-search"
          searchValue={table.search}
          onSearchChange={table.setSearch}
          searchPlaceholder="Search name or email..."
          filters={[
            <select
              key="role-filter"
              className="mp-select"
              value={roleFilter}
              onChange={(event) => {
                setRoleFilter(event.target.value);
                table.setPage(1);
              }}
              aria-label="Filter by role"
            >
              <option value="">All roles</option>
              {roles.map((role) => (
                <option key={role.id} value={role.slug}>{role.name}</option>
              ))}
            </select>,
            <select
              key="status-filter"
              className="mp-select"
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                table.setPage(1);
              }}
              aria-label="Filter by status"
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Disabled</option>
            </select>,
          ]}
        />

        {loading ? (
          <div className="mp-loading mp-loading--compact" aria-live="polite">
            <Loader2 size={18} className="mp-loading__icon" aria-hidden="true" />
            Loading users...
          </div>
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={table.rows}
              rowKey="id"
              sortKey={table.sortKey}
              sortDir={table.sortDir}
              onSort={table.onSort}
              emptyTitle="No users found"
              emptyDescription="Adjust your search or add a new user."
              emptyIcon={Users}
            />
            <Pagination
              page={table.page}
              pageSize={table.pageSize}
              total={table.total}
              onPageChange={table.setPage}
            />
          </>
        )}
      </section>

      {showForm && (
        <div className="mp-modal-overlay" role="presentation" onClick={closeForm}>
          <div
            className="mp-modal mp-users-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-form-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mp-modal__header">
              <div>
                <h2 id="user-form-title" className="mp-modal__title">
                  {editingUser ? 'Edit User' : 'Add User'}
                </h2>
                <p className="mp-modal__subtitle">
                  {editingUser ? 'Update account details.' : 'Create an admin or proctor account.'}
                </p>
              </div>
              <button type="button" className="mp-modal__close" onClick={closeForm} aria-label="Close">
                ×
              </button>
            </div>

            <PageAlert type="error" message={formError} onClose={() => setFormError('')} />

            <form className="mp-form mp-form--grid" onSubmit={handleSubmit} noValidate>
              <label className="mp-field">
                <span className="mp-field__label">Full name</span>
                <input
                  className="mp-field__input"
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  required
                  autoComplete="name"
                />
              </label>

              <label className="mp-field">
                <span className="mp-field__label">Email address</span>
                <input
                  className="mp-field__input"
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                  required
                  autoComplete="email"
                />
              </label>

              <PasswordField
                id="user-password"
                label={editingUser ? 'New password (optional)' : 'Password'}
                value={form.password}
                onChange={(event) => handlePasswordChange(event.target.value)}
                required={!editingUser}
                showPassword={showPassword}
                onToggleVisibility={() => setShowPassword((current) => !current)}
                invalid={passwordsDoNotMatch}
              />

              <PasswordField
                id="user-confirm-password"
                label={editingUser ? 'Confirm new password' : 'Confirm password'}
                value={form.confirmPassword}
                onChange={(event) => handleConfirmPasswordChange(event.target.value)}
                required={!editingUser || Boolean(form.password.trim())}
                showPassword={showConfirmPassword}
                onToggleVisibility={() => setShowConfirmPassword((current) => !current)}
                invalid={passwordsDoNotMatch}
                errorMessage={passwordsDoNotMatch ? 'Passwords do not match.' : undefined}
              />

              <label className="mp-field">
                <span className="mp-field__label">Role</span>
                <select
                  className="mp-field__input"
                  value={form.role_id}
                  onChange={(event) => setForm({ ...form, role_id: event.target.value })}
                  required
                >
                  <option value="">Select role</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
              </label>

              <label className="mp-field">
                <span className="mp-field__label">Status</span>
                <select
                  className="mp-field__input"
                  value={form.status}
                  onChange={(event) => setForm({ ...form, status: event.target.value })}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Disabled</option>
                </select>
              </label>

              <div className="mp-modal__actions mp-form__actions">
                <ManagementButton type="button" variant="secondary" onClick={closeForm} disabled={saving}>
                  Cancel
                </ManagementButton>
                <ManagementButton type="submit" variant="primary" disabled={isSubmitDisabled}>
                  {saving ? 'Saving...' : editingUser ? 'Save Changes' : 'Create User'}
                </ManagementButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
