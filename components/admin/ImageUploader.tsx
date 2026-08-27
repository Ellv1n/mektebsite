"use client";

import Image from "next/image";
import { useRef, useState } from "react";

/**
 * Çoxlu şəkil yükləmə + önizləmə (ecommerce.md §3.4).
 * Siyahıdakı BİRİNCİ şəkil məhsulun əsas şəklidir.
 */
export function ImageUploader({
  value,
  onChange,
  max = 10,
  label = "Şəkillər",
}: {
  value: string[];
  onChange: (images: string[]) => void;
  max?: number;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setError(null);

    const remaining = max - value.length;
    if (remaining <= 0) {
      setError(`Ən çox ${max} şəkil əlavə etmək olar.`);
      return;
    }

    const files = Array.from(fileList).slice(0, remaining);
    const formData = new FormData();
    for (const file of files) formData.append("files", file);

    setUploading(true);
    try {
      const response = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const data = (await response.json().catch(() => null)) as
        | { urls?: string[]; error?: string }
        | null;

      if (!response.ok || !data?.urls) {
        setError(data?.error ?? "Şəkil yüklənmədi. Yenidən yoxlayın.");
        return;
      }

      onChange([...value, ...data.urls].slice(0, max));
    } catch {
      setError("Serverə qoşulmaq mümkün olmadı.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function remove(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <span className="text-xs text-gray-400">
          {value.length}/{max} · maks. 5 MB · JPG, PNG, WEBP
        </span>
      </div>

      {value.length > 0 && (
        <ul className="mb-3 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
          {value.map((src, index) => (
            <li
              key={src}
              className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white"
            >
              <div className="relative aspect-square">
                <Image
                  src={src}
                  alt={`Şəkil ${index + 1}`}
                  fill
                  sizes="160px"
                  className="object-contain p-1"
                />
              </div>

              {index === 0 && (
                <span className="absolute left-1 top-1 rounded bg-brand-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  Əsas
                </span>
              )}

              <div className="flex border-t border-gray-200 text-xs">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label="Sola daşı"
                  className="flex-1 py-1.5 text-gray-500 hover:bg-gray-50 disabled:opacity-30"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  aria-label="Şəkli sil"
                  className="flex-1 border-x border-gray-200 py-1.5 text-red-600 hover:bg-red-50"
                >
                  Sil
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === value.length - 1}
                  aria-label="Sağa daşı"
                  className="flex-1 py-1.5 text-gray-500 hover:bg-gray-50 disabled:opacity-30"
                >
                  →
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={(e) => handleFiles(e.target.files)}
        disabled={uploading || value.length >= max}
        className="block w-full cursor-pointer rounded-lg border border-dashed border-gray-300 px-3 py-3 text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-brand-700 hover:border-brand-300 disabled:opacity-50"
      />

      {uploading && <p className="mt-2 text-sm text-gray-500">Yüklənir…</p>}
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
