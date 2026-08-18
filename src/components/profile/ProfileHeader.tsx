"use client";

import { useRef, useState } from "react";
import { Calendar, Camera, LogOut, Pencil, Tag } from "lucide-react";
import type { UserProfile } from "@/types";
import { formatDate } from "@/lib/format";
import { toUserMessage } from "@/lib/api/errors";
import { IMAGE_ACCEPT_ATTR, uploadService, validateImageFile } from "@/services";
import { useAppData } from "@/context/AppDataContext";
import { useToast } from "@/context/ToastContext";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";

export interface ProfileHeaderProps {
  profile: UserProfile;
  activeListingCount: number;
  onEdit: () => void;
  onLogout: () => void;
}

export function ProfileHeader({
  profile,
  activeListingCount,
  onEdit,
  onLogout,
}: ProfileHeaderProps) {
  const { updateProfile } = useAppData();
  const { showToast, showError } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleAvatarChange(file: File) {
    const localError = validateImageFile(file);
    if (localError) return showError(localError);

    setUploading(true);
    try {
      // Önce Cloudinary'ye yükle, sonra kalıcı URL'i profile yaz.
      const url = await uploadService.image(file, "avatars");
      const result = await updateProfile({ avatarUrl: url });
      if (result.ok) showToast("Profil fotoğrafın güncellendi.");
      else showError(result.error ?? "Fotoğraf kaydedilemedi.");
    } catch (error) {
      showError(toUserMessage(error, "Fotoğraf yüklenemedi."));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <header className="mb-6 overflow-hidden rounded-3xl border border-border bg-bg-card shadow-card">
      <div className="relative h-[120px] overflow-hidden bg-gradient-to-br from-primary via-primary-hover to-accent md:h-[160px]">
        <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute bottom-[-30px] left-1/3 h-28 w-28 rounded-full bg-white/10 blur-xl" />
      </div>

      <div className="px-5 pb-6 sm:px-7 md:px-9">
        {/* Negatif kenar boşluğu YALNIZCA avatara uygulanır. Tüm satıra
            uygulanırsa kullanıcı adı da yukarı kayıp pembe bandın üzerine
            binerek okunamaz hâle gelir. */}
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex w-full min-w-0 flex-col items-start gap-4 md:w-auto md:flex-row md:items-start">
            <div className="relative -mt-11 shrink-0 md:-mt-[52px]">
              <Avatar
                nickname={profile.nickname}
                avatarUrl={profile.avatarUrl}
                size={96}
                className="border-4 border-bg-card shadow-hover"
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                aria-label="Profil fotoğrafını değiştir"
                className="absolute right-0 bottom-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-bg-card bg-primary text-white transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-60 motion-reduce:hover:scale-100"
              >
                <Camera size={14} />
              </button>
              {uploading && (
                <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 text-[10px] font-bold text-white">
                  Yükleniyor
                </span>
              )}
              <input
                ref={fileRef}
                type="file"
                accept={IMAGE_ACCEPT_ATTR}
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleAvatarChange(file);
                }}
              />
            </div>

            <div className="min-w-0 md:pt-3">
              <h1 className="mb-1 font-heading text-[21px] font-extrabold break-words text-text-main md:text-[22px]">
                {profile.nickname}
              </h1>
              {profile.bio ? (
                <p className="mb-2 max-w-[52ch] text-[13px] leading-relaxed text-text-secondary italic">
                  {profile.bio}
                </p>
              ) : (
                <button
                  onClick={onEdit}
                  className="mb-2 text-[13px] text-text-muted italic underline underline-offset-2 hover:text-primary"
                >
                  Kendinden bahsetmek ister misin?
                </button>
              )}
              <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-text-muted">
                  <Calendar size={12} className="text-primary" aria-hidden /> Katıldı:{" "}
                  {formatDate(profile.joinedAt)}
                </span>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-text-muted">
                  <Tag size={12} className="text-primary" aria-hidden /> {activeListingCount} aktif ilan
                </span>
              </div>
            </div>
          </div>

          <div className="flex w-full shrink-0 gap-2 md:w-auto md:pt-3">
            <Button
              size="sm"
              variant="ghost"
              onClick={onEdit}
              leftIcon={<Pencil size={14} />}
              className="flex-1 rounded-full md:flex-none"
            >
              Profili Düzenle
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={onLogout}
              leftIcon={<LogOut size={14} />}
              className="flex-1 rounded-full hover:border-red-500 hover:text-red-600 md:flex-none"
            >
              Çıkış
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
