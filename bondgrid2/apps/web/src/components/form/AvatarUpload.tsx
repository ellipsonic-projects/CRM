'use client';

import { ChangeEvent, DragEvent, useRef, useState } from 'react';
import { ImagePlus, RefreshCw, UserRound } from 'lucide-react';

const MAX_IMAGE_SIZE_BYTES = 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

interface AvatarUploadProps {
  value: string;
  name: string;
  onChange: (value: string) => void;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export default function AvatarUpload({
  value,
  name,
  onChange,
}: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string>();
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (file?: File) => {
    setError(undefined);

    if (!file) {
      return;
    }

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setError('Upload a JPG, PNG, or WebP image.');
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setError('Image must be 1 MB or smaller.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onChange(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleFile(event.target.files?.[0]);
    event.target.value = '';
  };

  const handleDrop = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setIsDragging(false);
    handleFile(event.dataTransfer.files[0]);
  };

  return (
    <div>
      <button
        type="button"
        className={`flex w-full items-center gap-4 rounded-xl border border-dashed p-4 text-left transition ${
          isDragging
            ? 'border-blue-400 bg-blue-950/40'
            : 'border-slate-700 bg-slate-900/70 hover:border-blue-500'
        }`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <span className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-800 ring-2 ring-slate-700">
          {value ? (
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : getInitials(name) ? (
            <span className="text-lg font-semibold text-slate-100">
              {getInitials(name)}
            </span>
          ) : (
            <UserRound className="text-slate-400" size={32} />
          )}
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2 font-medium text-slate-100">
            {value ? <RefreshCw size={16} /> : <ImagePlus size={16} />}
            {value ? 'Replace profile picture' : 'Upload profile picture'}
          </span>
          <span className="mt-1 block text-sm text-slate-400">
            Click to choose or drop an image. JPG, PNG, or WebP up to 1 MB.
          </span>
        </span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(',')}
        className="hidden"
        onChange={handleInputChange}
      />

      {error ? <p className="mt-2 text-sm text-red-300">{error}</p> : null}
    </div>
  );
}
