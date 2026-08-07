import { FaFileExcel, FaFileWord, FaFilePdf, FaFileAlt } from 'react-icons/fa';

const PRESETS = {
  excel: {
    label: 'Excel',
    Icon: FaFileExcel,
    color: '#217346',
    bg: 'rgba(33, 115, 70, 0.12)',
    border: 'rgba(33, 115, 70, 0.35)',
  },
  word: {
    label: 'Word',
    Icon: FaFileWord,
    color: '#2b579a',
    bg: 'rgba(43, 87, 154, 0.12)',
    border: 'rgba(43, 87, 154, 0.35)',
  },
  pdf: {
    label: 'PDF',
    Icon: FaFilePdf,
    color: '#c43e1c',
    bg: 'rgba(196, 62, 28, 0.12)',
    border: 'rgba(196, 62, 28, 0.35)',
  },
  documents: {
    label: 'Documents',
    Icon: FaFileAlt,
    color: '#5b6572',
    bg: 'rgba(91, 101, 114, 0.12)',
    border: 'rgba(91, 101, 114, 0.35)',
  },
};

export function getFileTypePreset(type) {
  return PRESETS[type] || PRESETS.documents;
}

export function FileTypeIcon({ type = 'documents', size = 28, className = '' }) {
  const preset = getFileTypePreset(type);
  const Icon = preset.Icon;
  return (
    <span
      className={`mp-filetype-icon ${className}`.trim()}
      style={{ color: preset.color }}
      title={preset.label}
      aria-hidden="true"
    >
      <Icon size={size} />
    </span>
  );
}

export { PRESETS as FILE_TYPE_PRESETS };
