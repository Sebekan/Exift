"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, CloudUpload, Loader2, Star, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { toUserMessage } from "@/lib/api/errors";
import { LIMITS } from "@/lib/validation";
import { IMAGE_ACCEPT_ATTR, uploadService, validateImageFile } from "@/services";
import { InlineAlert } from "@/components/ui/States";

export interface ImageUploaderProps {
  /** Yüklenmiş görsellerin kalıcı URL'leri; ilk eleman kapak görselidir. */
  images: string[];
  onChange: (images: string[]) => void;
  max?: number;
  disabled?: boolean;
}

/**
 * Görseller SEÇİLİR SEÇİLMEZ Cloudinary'ye yüklenir ve state'te yalnızca kalıcı
 * https URL'leri tutulur. (Önceki sürüm base64 data URI'yi doğrudan API'ye
 * gönderiyordu; image_url sütunu String(500) olduğu için ilan oluşturma
 * sunucu hatasıyla düşüyordu.)
 */
export function ImageUploader({
  images,
  onChange,
  max = LIMITS.maxImages,
  disabled = false,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const remaining = max - images.length;
  const isFull = remaining <= 0;

  async function handleFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    setError(null);

    if (files.length > remaining) {
      setError(`En fazla ${max} görsel ekleyebilirsin. İlk ${remaining} tanesi yüklenecek.`);
      files.splice(remaining);
    }

    // Ağ trafiği başlamadan önce yerel doğrulama.
    for (const file of files) {
      const localError = validateImageFile(file);
      if (localError) {
        setError(`${file.name}: ${localError}`);
        return;
      }
    }

    setUploading(true);
    setProgress({ done: 0, total: files.length });

    const uploaded: string[] = [];
    try {
      for (const file of files) {
        uploaded.push(await uploadService.image(file, "products"));
        setProgress((p) => ({ ...p, done: p.done + 1 }));
      }
      onChange([...images, ...uploaded]);
    } catch (err) {
      // Kısmen yüklenenler korunur — kullanıcı baştan başlamak zorunda kalmaz.
      if (uploaded.length > 0) onChange([...images, ...uploaded]);
      setError(toUserMessage(err, "Görsel yüklenemedi."));
    } finally {
      setUploading(false);
      setProgress({ done: 0, total: 0 });
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function remove(index: number) {
    onChange(images.filter((_, i) => i !== index));
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-3">
      {images.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((url, index) => (
            <li
              key={url}
              className="group relative aspect-square overflow-hidden rounded-2xl border border-border bg-bg-body"
            >
              <Image src={url} alt={`Görsel ${index + 1}`} fill sizes="200px" className="object-cover" />

              {index === 0 && (
                <span className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-primary px-2 py-1 text-[10px] font-bold text-white shadow-sm">
                  <Star size={10} className="fill-white" aria-hidden /> Kapak
                </span>
              )}

              <button
                type="button"
                onClick={() => remove(index)}
                disabled={disabled || uploading}
                aria-label={`${index + 1}. görseli kaldır`}
                className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-opacity hover:bg-red-600 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none disabled:opacity-50"
              >
                <X size={14} />
              </button>

              {images.length > 1 && (
                <div className="absolute inset-x-2 bottom-2 flex justify-between gap-1">
                  <button
                    type="button"
                    onClick={() => move(index, -1)}
                    disabled={index === 0 || disabled || uploading}
                    aria-label="Sola taşı"
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-opacity hover:bg-black/80 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none disabled:opacity-30"
                  >
                    <ArrowLeft size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={index === images.length - 1 || disabled || uploading}
                    aria-label="Sağa taşı"
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-opacity hover:bg-black/80 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none disabled:opacity-30"
                  >
                    <ArrowRight size={13} />
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {!isFull && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled && !uploading) setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (disabled || uploading) return;
            if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
          }}
          className={cn(
            "relative flex min-h-[160px] w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-6 text-center transition-colors duration-200",
            dragOver
              ? "border-primary bg-primary-light text-primary"
              : "border-border bg-bg-body text-text-secondary",
            (disabled || uploading) && "pointer-events-none opacity-70",
          )}
        >
          {uploading ? (
            <>
              <Loader2 size={26} className="animate-spin text-primary" aria-hidden />
              <span className="text-[13px] font-semibold text-text-main">
                Yükleniyor... ({progress.done}/{progress.total})
              </span>
            </>
          ) : (
            <>
              <CloudUpload size={26} aria-hidden />
              <span className="text-[13px] font-semibold">
                Fotoğrafları sürükle veya{" "}
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="font-bold text-primary underline underline-offset-2 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                >
                  dosya seç
                </button>
              </span>
              <span className="text-[11.5px] text-text-muted">
                JPG, PNG veya WebP &middot; en fazla 5MB &middot; {remaining} görsel daha
              </span>
            </>
          )}

          <input
            ref={inputRef}
            type="file"
            accept={IMAGE_ACCEPT_ATTR}
            multiple
            className="sr-only"
            disabled={disabled || uploading}
            onChange={(e) => {
              if (e.target.files?.length) handleFiles(e.target.files);
            }}
          />
        </div>
      )}

      {error && <InlineAlert variant="error">{error}</InlineAlert>}

      {images.length > 1 && (
        <p className="text-[11.5px] text-text-muted">
          İlk görsel ilanının kapağı olur. Sırayı oklarla değiştirebilirsin.
        </p>
      )}
    </div>
  );
}
