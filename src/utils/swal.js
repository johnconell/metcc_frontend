import Swal from 'sweetalert2';
import '../styles/swal.css';

const BRAND = '#7A1F2B';

const motion = {
  showClass: {
    popup: 'metcc-swal-in',
    backdrop: 'metcc-swal-backdrop-in',
    icon: 'metcc-swal-icon-in',
  },
  hideClass: {
    popup: 'metcc-swal-out',
    backdrop: 'metcc-swal-backdrop-out',
    icon: 'metcc-swal-icon-out',
  },
};

const base = {
  ...motion,
  confirmButtonColor: BRAND,
  cancelButtonColor: '#6b7280',
  buttonsStyling: true,
  reverseButtons: true,
  focusCancel: true,
  customClass: {
    popup: 'metcc-swal-popup',
    confirmButton: 'metcc-swal-confirm',
    cancelButton: 'metcc-swal-cancel',
    actions: 'metcc-swal-actions',
  },
};

/**
 * Success toast — brief, non-blocking, auto-vanishes (~1.2s).
 * @param {string} message Body text (e.g. "User Created Successfully")
 * @param {string} [detail] Optional secondary text
 */
export function toastSuccess(message = 'Completed successfully.', detail = '') {
  const text = [message, detail].filter(Boolean).join(' — ') || undefined;
  return Swal.fire({
    ...base,
    toast: true,
    position: 'top-end',
    icon: 'success',
    title: 'Success',
    text,
    timer: 1200,
    timerProgressBar: true,
    showConfirmButton: false,
    allowOutsideClick: true,
    allowEscapeKey: true,
    showClass: {
      popup: 'metcc-swal-toast-in',
    },
    hideClass: {
      popup: 'metcc-swal-toast-out',
    },
    customClass: {
      ...base.customClass,
      popup: 'metcc-swal-popup metcc-swal-toast',
      title: 'metcc-swal-toast-title',
      htmlContainer: 'metcc-swal-toast-text',
    },
  });
}

export function toastError(title = 'Error', text = '') {
  return Swal.fire({
    ...base,
    icon: 'error',
    title,
    text: text || undefined,
    confirmButtonText: 'OK',
    focusCancel: false,
  });
}

export function toastWarning(title = 'Warning', text = '') {
  return Swal.fire({
    ...base,
    icon: 'warning',
    title,
    text: text || undefined,
    confirmButtonText: 'OK',
    focusCancel: false,
  });
}

export function toastInfo(title, text = '') {
  return Swal.fire({
    ...base,
    icon: 'info',
    title,
    text: text || undefined,
    confirmButtonText: 'OK',
    focusCancel: false,
  });
}

/**
 * Standard confirmation — Yes / No.
 * @returns {Promise<boolean>}
 */
export async function confirmAction({
  title = 'Are you sure?',
  text = 'This action cannot be undone.',
  confirmText = 'Yes',
  cancelText = 'No',
  icon = 'warning',
} = {}) {
  const result = await Swal.fire({
    ...base,
    icon,
    title,
    text,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
  });
  return Boolean(result.isConfirmed);
}

/**
 * Delete confirmation — Delete / Cancel.
 * @returns {Promise<boolean>}
 */
export async function confirmDelete({
  title = 'Delete Record?',
  text = 'This action cannot be undone.',
  confirmText = 'Delete',
  cancelText = 'Cancel',
} = {}) {
  return confirmAction({
    title,
    text,
    confirmText,
    cancelText,
    icon: 'warning',
  });
}

/**
 * Examination key send confirmation — Send / Cancel.
 * @returns {Promise<boolean>}
 */
export async function confirmSendExaminationKey({
  title = 'Send Examination Key?',
  text = 'The examination key will be distributed to authorized proctors.',
} = {}) {
  return confirmAction({
    title,
    text,
    confirmText: 'Send',
    cancelText: 'Cancel',
    icon: 'question',
  });
}

/**
 * Blocking loading modal. Call closeLoading() when finished.
 */
export function showLoading(title = 'Please wait...') {
  Swal.fire({
    ...base,
    title,
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    customClass: {
      ...base.customClass,
      popup: 'metcc-swal-popup metcc-swal-loading',
    },
    didOpen: () => {
      Swal.showLoading();
    },
  });
}

export function closeLoading() {
  Swal.close();
}

/**
 * Run an async task with a loading modal, then success or error.
 */
export async function withLoading(title, task, { successMessage } = {}) {
  showLoading(title);
  try {
    const result = await task();
    closeLoading();
    if (successMessage) {
      await toastSuccess(successMessage);
    }
    return result;
  } catch (err) {
    closeLoading();
    throw err;
  }
}

export async function alertFromApiError(err, fallback = 'Something went wrong.') {
  const first = err?.response?.data?.errors
    ? Object.values(err.response.data.errors).flat()[0]
    : null;
  const message = first || err?.response?.data?.message || err?.message || fallback;
  const status = err?.response?.status;
  let title = 'Error';
  if (!err?.response) title = 'Network Error';
  else if (status === 422) title = 'Validation Failed';
  else if (status >= 500) title = 'Server Error';
  await toastError(title, message);
  return message;
}
