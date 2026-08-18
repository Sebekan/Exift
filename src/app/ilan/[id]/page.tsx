"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bookmark,
  CheckCircle2,
  Eye,
  EyeOff,
  Flag,
  Heart,
  MapPin,
  MessageSquare,
  Pencil,
  Share2,
  Trash2,
} from "lucide-react";
import type { Product } from "@/types";
import { cn } from "@/lib/cn";
import { formatPrice, formatRelativeDate } from "@/lib/format";
import { getCategoryLabel } from "@/lib/categories";
import { getProductActions } from "@/lib/ownership";
import { toUserMessage } from "@/lib/api/errors";
import { listingService } from "@/services";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useAppData } from "@/context/AppDataContext";
import { useAuthGate } from "@/context/AuthGateContext";
import { useToast } from "@/context/ToastContext";
import { Container } from "@/components/layout/Container";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button, ButtonLink, IconButton } from "@/components/ui/Button";
import { ConfirmDialog, Modal } from "@/components/ui/Modal";
import { ErrorState, LoadingState } from "@/components/ui/States";
import { CommentSection } from "@/components/product/CommentSection";
import { ImageGallery } from "@/components/product/ImageGallery";
import { ShareButton } from "@/components/product/ShareButton";
import siteConfig from "@/data/site-config.json";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { isAuthenticated, profile, isFavorite, toggleFavorite, isLiked, toggleLike, contactSeller, removeMyListing, upsertMyListing } =
    useAppData();
  const { requestSoftGate } = useAuthGate();
  const { showToast, showError } = useToast();

  // Detay her zaman kendi isteğini yapar — derin bağlantı ve sayfa yenileme
  // güvenli çalışsın diye (eski sürüm global listeden okuyordu ve kırılıyordu).
  const fetcher = useCallback((signal: AbortSignal) => listingService.get(id, signal), [id]);
  const { data: product, loading, error, reload, setData } = useAsyncData<Product>(fetcher);

  const [likeCount, setLikeCount] = useState<number | null>(null);
  const [commentCount, setCommentCount] = useState<number | null>(null);
  const [contacting, setContacting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmSell, setConfirmSell] = useState(false);
  const [selling, setSelling] = useState(false);
  const [museumPromptOpen, setMuseumPromptOpen] = useState(false);
  const [submittingMuseum, setSubmittingMuseum] = useState(false);
  const [togglingPublish, setTogglingPublish] = useState(false);
  const [pulse, setPulse] = useState<"like" | "save" | null>(null);

  if (loading) return <LoadingState message="İlan yükleniyor..." />;

  if (error || !product) {
    const notFound = !error;
    return (
      <div className="mx-auto max-w-[600px] px-[5%] py-20">
        <ErrorState
          title={notFound ? "İlan bulunamadı" : "İlan yüklenemedi"}
          message={error ?? "Bu ilan kaldırılmış veya adres hatalı olabilir."}
          onRetry={error ? reload : undefined}
        />
        <div className="mt-5 text-center">
          <ButtonLink href="/" variant="secondary" leftIcon={<ArrowLeft size={15} />}>
            Anasayfaya dön
          </ButtonLink>
        </div>
      </div>
    );
  }

  const actions = getProductActions(product, profile);
  const favorite = isFavorite(product.id);
  const liked = isLiked(product.id);
  const displayLikes = likeCount ?? product.likes;
  const displayComments = commentCount ?? product.commentsCount;

  async function handleLike() {
    if (!product) return;
    if (!isAuthenticated) return requestSoftGate("like");
    setPulse("like");
    const result = await toggleLike(product.id);
    if (result) setLikeCount(result.likesCount);
  }

  async function handleSave() {
    if (!product) return;
    if (!isAuthenticated) return requestSoftGate("save");
    setPulse("save");
    const nowFavorited = await toggleFavorite(product.id);
    if (nowFavorited === null) return;
    showToast(
      nowFavorited ? "Sandığına eklendi" : "Sandıktan çıkarıldı",
      nowFavorited ? "success" : "neutral",
    );
  }

  async function handleContact() {
    if (!product) return;
    if (!isAuthenticated) return requestSoftGate("contact");
    if (contacting) return;

    setContacting(true);
    const chatId = await contactSeller(product.id);
    setContacting(false);

    if (chatId) router.push(`/sohbet/${chatId}`);
    else showError("Sohbet açılamadı. Lütfen tekrar dene.");
  }

  async function handleDelete() {
    if (!product) return;
    setDeleting(true);
    try {
      await listingService.remove(product.id);
      removeMyListing(product.id);
      showToast("İlanın silindi.", "neutral");
      router.replace("/profil");
    } catch (err) {
      showError(toUserMessage(err, "İlan silinemedi."));
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  async function handleMarkSold() {
    if (!product) return;
    setSelling(true);
    try {
      const updated = await listingService.markAsSold(product.id);
      setData(updated);
      upsertMyListing(updated);
      setConfirmSell(false);
      showToast("İlanın satıldı olarak işaretlendi.");
      setMuseumPromptOpen(true);
    } catch (err) {
      showError(toUserMessage(err, "İlan güncellenemedi."));
    } finally {
      setSelling(false);
    }
  }

  async function handleSubmitToMuseum() {
    if (!product) return;
    setSubmittingMuseum(true);
    try {
      const updated = await listingService.submitToMuseum(product.id);
      setData(updated);
      upsertMyListing(updated);
      showToast("Müzeye gönderim talebin alındı, onay bekleniyor.", "neutral");
    } catch (err) {
      showError(toUserMessage(err, "Müzeye gönderilemedi."));
    } finally {
      setSubmittingMuseum(false);
      setMuseumPromptOpen(false);
    }
  }

  async function handleTogglePublish() {
    if (!product) return;
    setTogglingPublish(true);
    try {
      const updated = product.isPublished
        ? await listingService.unpublish(product.id)
        : await listingService.republish(product.id);
      setData(updated);
      upsertMyListing(updated);
      showToast(updated.isPublished ? "İlanın tekrar yayında." : "İlanın yayından kaldırıldı.", "neutral");
    } catch (err) {
      showError(toUserMessage(err, "İşlem gerçekleştirilemedi."));
    } finally {
      setTogglingPublish(false);
    }
  }

  return (
    <Container className="animate-rise-in pt-6 pb-24">
      <Link
        href="/"
        className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-bg-card px-[18px] py-2 font-heading text-[13.5px] font-bold text-text-secondary shadow-card transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
      >
        <ArrowLeft size={15} aria-hidden /> Anasayfaya Geri Dön
      </Link>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10">
        <ImageGallery images={product.images} title={product.title} />

        <div className="flex flex-col gap-5">
          {/* Sahiplik şeridi — kullanıcı kendi ilanına baktığını hemen anlar. */}
          {actions.canEdit && (
            <div className="flex flex-col gap-3 rounded-2xl border border-primary/25 bg-primary-light p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[13px] font-semibold text-primary">
                Bu senin ilanın. Dilediğin zaman düzenleyebilirsin.
              </p>
              <div className="flex shrink-0 flex-wrap gap-2">
                <ButtonLink
                  href={`/ilan/${product.id}/duzenle`}
                  size="sm"
                  leftIcon={<Pencil size={14} />}
                >
                  Düzenle
                </ButtonLink>
                {actions.canTogglePublish && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleTogglePublish}
                    loading={togglingPublish}
                    leftIcon={product.isPublished ? <EyeOff size={14} /> : <Eye size={14} />}
                  >
                    {product.isPublished ? "Yayından Kaldır" : "Tekrar Yayınla"}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setConfirmDelete(true)}
                  leftIcon={<Trash2 size={14} />}
                  className="hover:border-red-500 hover:text-red-600"
                >
                  Sil
                </Button>
              </div>
            </div>
          )}

          {actions.canEdit && !product.isPublished && (
            <div className="flex items-center gap-2.5 rounded-2xl border border-border bg-bg-body p-4">
              <EyeOff size={17} className="shrink-0 text-text-muted" aria-hidden />
              <p className="text-[13px] font-semibold text-text-secondary">
                Bu ilan yayından kaldırıldı — yalnızca sen görebilirsin.
              </p>
            </div>
          )}

          {product.sold && (
            <div className="flex items-center gap-2.5 rounded-2xl border border-border bg-bg-body p-4">
              <CheckCircle2 size={17} className="shrink-0 text-emerald-600" aria-hidden />
              <p className="text-[13px] font-semibold text-text-secondary">
                {product.museumStatus === "approved"
                  ? "Bu anı satıldı ve Exift Müzesi'nde arşivlendi."
                  : product.museumStatus === "pending"
                    ? "Bu anı satıldı. Müze başvurun onay bekliyor."
                    : "Bu anı satıldı."}
                {product.soldDate && ` (${formatRelativeDate(product.soldDate)})`}
              </p>
            </div>
          )}

          <div className="border-b border-border pb-5">
            <Badge tone="primary" className="mb-3 tracking-wide uppercase">
              {getCategoryLabel(product.category)}
            </Badge>
            <h1 className="mb-2.5 font-heading text-[26px] leading-tight font-extrabold tracking-[-0.5px] text-text-main md:text-[32px]">
              {product.title}
            </h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12.5px] font-medium text-text-secondary">
              <span className="flex items-center gap-1.5">
                <MapPin size={13} aria-hidden /> {product.district}
              </span>
              <span>{formatRelativeDate(product.createdAt)}</span>
              <span className="flex items-center gap-1.5">
                <MessageSquare size={13} aria-hidden /> {displayComments} yorum
              </span>
              <span className="flex items-center gap-1.5">
                <Heart size={13} className={cn(liked && "fill-red-500 text-red-500")} aria-hidden />{" "}
                {displayLikes} beğeni
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-bg-card p-5 shadow-card sm:p-6">
            <p className="font-heading text-[26px] font-extrabold text-primary sm:text-3xl">
              {formatPrice(product.price)}
            </p>
            <div className="flex items-center gap-2">
              {actions.canLike && (
                <IconButton label={liked ? "Beğeniyi geri al" : "Beğen"} onClick={handleLike} aria-pressed={liked}>
                  <Heart
                    size={19}
                    onAnimationEnd={() => setPulse(null)}
                    className={cn(
                      liked ? "fill-red-500 text-red-500" : "text-text-secondary",
                      pulse === "like" && "animate-pop",
                    )}
                  />
                </IconButton>
              )}
              {actions.canFavorite && (
                <IconButton
                  label={favorite ? "Sandıktan çıkar" : "Sandığa ekle"}
                  onClick={handleSave}
                  aria-pressed={favorite}
                >
                  <Bookmark
                    size={19}
                    onAnimationEnd={() => setPulse(null)}
                    className={cn(
                      favorite ? "fill-primary text-primary" : "text-text-secondary",
                      pulse === "save" && "animate-pop",
                    )}
                  />
                </IconButton>
              )}
              <ShareButton
                title={product.title}
                text={`"${product.title}" - ${formatPrice(product.price)}`}
                path={`/ilan/${product.id}`}
              >
                {({ onClick }) => (
                  <IconButton label="Paylaş" onClick={onClick}>
                    <Share2 size={18} className="text-text-secondary" />
                  </IconButton>
                )}
              </ShareButton>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-border bg-bg-card p-4 shadow-card sm:p-5">
            <Avatar nickname={product.seller.nickname} avatarUrl={product.seller.avatarUrl} size={48} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-text-main">
                {product.seller.nickname}
                {actions.canEdit && (
                  <span className="ml-2 rounded-full bg-primary-light px-2 py-0.5 text-[10px] font-bold text-primary">
                    Sen
                  </span>
                )}
              </p>
              {product.seller.bio && (
                <p className="truncate text-xs text-text-secondary italic">{product.seller.bio}</p>
              )}
            </div>
          </div>

          {product.story && (
            <blockquote className="rounded-r-2xl border-l-4 border-primary bg-primary-light p-5 font-serif text-[14.5px] leading-relaxed whitespace-pre-wrap text-text-main italic">
              {product.story}
            </blockquote>
          )}

          {/* Sahip: yönetim aksiyonu. Ziyaretçi: iletişim aksiyonu. */}
          {actions.canMarkSold ? (
            <Button
              size="lg"
              fullWidth
              variant="dark"
              onClick={() => setConfirmSell(true)}
              leftIcon={<CheckCircle2 size={17} />}
            >
              Satıldı Olarak İşaretle
            </Button>
          ) : actions.canContact ? (
            <Button
              size="lg"
              fullWidth
              variant="dark"
              onClick={handleContact}
              loading={contacting}
              leftIcon={<MessageSquare size={16} />}
            >
              {contacting ? "Sohbet açılıyor..." : "Satıcıyla İletişime Geç"}
            </Button>
          ) : null}

          {/*
            Şikayet akışı için backend'de bir servis yok (bkz.
            docs/missing-services/MODERATION.md). Hiçbir şey yapmayan bir buton
            koymak yerine gerçekten çalışan bir yol sunuluyor: ilan bağlantısı
            önceden doldurulmuş destek e-postası.
          */}
          {!actions.canEdit && (
            <a
              href={`mailto:${siteConfig.contact.email}?subject=${encodeURIComponent(
                `İlan şikayeti: ${product.title}`,
              )}&body=${encodeURIComponent(
                `Şikayet edilen ilan: ${product.title}\nİlan bağlantısı: ${
                  typeof window !== "undefined" ? window.location.href : `/ilan/${product.id}`
                }\n\nŞikayet nedeni:\n`,
              )}`}
              className="inline-flex items-center justify-center gap-1.5 self-center rounded-full px-3 py-2 text-[12.5px] font-semibold text-text-muted transition-colors hover:text-red-600 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              <Flag size={13} aria-hidden />
              Bu ilanı şikayet et
            </a>
          )}
        </div>
      </div>

      <div className="mt-12 max-w-3xl">
        <CommentSection productId={product.id} onCountChange={setCommentCount} />
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="İlanı silmek istediğine emin misin?"
        description="Bu işlem geri alınamaz. İlana ait yorumlar ve sohbetler de kaldırılır."
        confirmLabel="İlanı Sil"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />

      <ConfirmDialog
        open={confirmSell}
        title="Bu ürünü satıldı olarak işaretlemek istediğine emin misin?"
        description="Bu işlem sonrasında ilan satışa kapanacaktır."
        confirmLabel="Evet, Satıldı"
        loading={selling}
        onConfirm={handleMarkSold}
        onCancel={() => setConfirmSell(false)}
      />

      <Modal
        open={museumPromptOpen}
        onClose={() => setMuseumPromptOpen(false)}
        title="🎉 Tebrikler! Geçmişinden bir parçayı geride bıraktın."
        description="Bu ürünü Exift Müzesi'nde sergilemek ister misin?"
        size="sm"
        dismissOnBackdrop={!submittingMuseum}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setMuseumPromptOpen(false)}
              disabled={submittingMuseum}
              className="sm:min-w-[120px]"
            >
              Daha Sonra
            </Button>
            <Button onClick={handleSubmitToMuseum} loading={submittingMuseum} className="sm:min-w-[170px]">
              🏛️ Müzeye Gönder
            </Button>
          </>
        }
      />
    </Container>
  );
}
