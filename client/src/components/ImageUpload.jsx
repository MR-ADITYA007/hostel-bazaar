import { useRef, useState } from 'react';

const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ImageUpload({ onFileSelect, currentImageUrl }) {
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  function handleFile(selected) {
    if (!selected) return;

    if (!ACCEPTED_TYPES.includes(selected.type)) {
      setError('Only JPG, PNG, or WebP images are allowed.');
      return;
    }
    if (selected.size > MAX_SIZE_BYTES) {
      setError('Image must be under 5 MB.');
      return;
    }

    setError('');
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    onFileSelect(selected);
  }

  function handleChange(e) {
    handleFile(e.target.files?.[0] ?? null);
    // Reset input so the same file can be re-selected
    e.target.value = '';
  }

  const displayUrl = preview ?? currentImageUrl ?? null;
  const hasImage = Boolean(displayUrl);

  return (
    <div className="flex flex-col gap-2">
      {/* Preview or empty state */}
      {hasImage ? (
        <div className="relative rounded-xl overflow-hidden border border-gray-200">
          <img
            src={displayUrl}
            alt="Preview"
            className="w-full max-h-64 object-contain bg-gray-50"
          />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 py-10 text-gray-400 text-sm">
          <svg
            className="w-10 h-10 mb-2 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4-4a3 3 0 014.24 0L16 16m-2-2l1.586-1.586a3 3 0 014.243 0L20 14M14 8h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          No image selected
        </div>
      )}

      {/* File info */}
      {file && (
        <p className="text-xs text-gray-500">
          {file.name} &mdash; {formatBytes(file.size)}
        </p>
      )}

      {/* Error */}
      {error && <p className="text-xs text-red-600">{error}</p>}

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        onChange={handleChange}
      />

      {/* Trigger button */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="self-start px-4 py-2 rounded-lg bg-indigo-50 text-indigo-700 text-sm font-medium hover:bg-indigo-100 transition-colors border border-indigo-200"
      >
        {hasImage ? 'Change Image' : 'Upload Image'}
      </button>
    </div>
  );
}
