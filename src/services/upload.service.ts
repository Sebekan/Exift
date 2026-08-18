import { http } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import type { ApiUploadResponse } from "@/lib/api/types";

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // backend ile aynı sınır
export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
];

/** Dosya seçici için `accept` niteliği. */
export const IMAGE_ACCEPT_ATTR = ACCEPTED_IMAGE_TYPES.join(",");

/**
 * Ağa çıkmadan önce yerel doğrulama — kullanıcı 5MB'lık bir dosyayı boşuna
 * yüklemeyi beklemesin diye. Sunucu tarafı doğrulama yine de yetkilidir.
 */
export function validateImageFile(file: File): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return "Sadece JPG, PNG, WebP veya GIF yükleyebilirsin.";
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return "Dosya boyutu 5MB'ı aşamaz.";
  }
  return null;
}

export type UploadFolder = "products" | "avatars";

export const uploadService = {
  /** Görseli Cloudinary'ye yükler ve kalıcı https URL'ini döner. */
  async image(file: File, folder: UploadFolder = "products"): Promise<string> {
    const localError = validateImageFile(file);
    if (localError) throw new ApiError(400, "validation", localError, localError);

    const formData = new FormData();
    formData.append("file", file);

    const res = await http.upload<ApiUploadResponse>(
      `/api/upload/image?folder=${folder}`,
      formData,
    );
    return res.url;
  },

  /** Birden çok görseli sırayla yükler; sıra korunur. */
  async images(files: File[], folder: UploadFolder = "products"): Promise<string[]> {
    const urls: string[] = [];
    for (const file of files) {
      urls.push(await this.image(file, folder));
    }
    return urls;
  },
};
