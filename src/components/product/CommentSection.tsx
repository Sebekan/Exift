"use client";

import { useCallback, useState, type FormEvent } from "react";
import { Heart, MessageSquare, Send, Trash2 } from "lucide-react";
import type { Comment } from "@/types";
import { cn } from "@/lib/cn";
import { formatRelativeDate } from "@/lib/format";
import { toUserMessage } from "@/lib/api/errors";
import { LIMITS } from "@/lib/validation";
import { commentService } from "@/services";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useAppData } from "@/context/AppDataContext";
import { useAuthGate } from "@/context/AuthGateContext";
import { useToast } from "@/context/ToastContext";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/Modal";
import { ErrorState, InlineAlert, Skeleton } from "@/components/ui/States";

export function CommentSection({
  productId,
  onCountChange,
}: {
  productId: string;
  /** Detay sayfasındaki yorum sayacını senkron tutmak için. */
  onCountChange?: (count: number) => void;
}) {
  const { isAuthenticated, profile } = useAppData();
  const { requestSoftGate } = useAuthGate();
  const { showToast, showError } = useToast();

  const fetcher = useCallback(
    (signal: AbortSignal) => commentService.list(productId, signal),
    [productId],
  );
  const { data, loading, error, reload, setData } = useAsyncData<Comment[]>(fetcher);

  const comments = data ?? [];

  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Comment | null>(null);
  const [deleting, setDeleting] = useState(false);

  function updateComments(next: Comment[]) {
    setData(next);
    onCountChange?.(next.length);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || submitting) return;

    if (!isAuthenticated) {
      requestSoftGate("comment");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      const created = await commentService.add(productId, trimmed);
      updateComments([...comments, created]);
      setText("");
    } catch (err) {
      // Taslak korunur — kullanıcı yazdığını kaybetmez.
      setSubmitError(toUserMessage(err, "Yorum gönderilemedi."));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLike(comment: Comment) {
    if (!isAuthenticated) return requestSoftGate("like");

    // İyimser güncelleme.
    const optimistic = comments.map((c) =>
      c.id === comment.id
        ? { ...c, isLiked: !c.isLiked, likes: c.likes + (c.isLiked ? -1 : 1) }
        : c,
    );
    setData(optimistic);

    try {
      const res = await commentService.toggleLike(comment.id);
      setData((current) =>
        (current ?? []).map((c) =>
          c.id === comment.id ? { ...c, isLiked: res.liked, likes: res.likesCount } : c,
        ),
      );
    } catch (err) {
      setData(comments); // geri al
      showError(toUserMessage(err, "Beğeni kaydedilemedi."));
    }
  }

  async function handleDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await commentService.remove(pendingDelete.id);
      updateComments(comments.filter((c) => c.id !== pendingDelete.id));
      showToast("Yorumun silindi.", "neutral");
      setPendingDelete(null);
    } catch (err) {
      showError(toUserMessage(err, "Yorum silinemedi."));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <section className="border-t border-border pt-8" aria-labelledby="comments-heading">
      <h2
        id="comments-heading"
        className="mb-5 flex items-center gap-2 font-heading text-lg font-bold text-text-main"
      >
        <MessageSquare size={18} className="text-primary" aria-hidden />
        Yorumlar
        {comments.length > 0 && (
          <span className="rounded-full bg-primary-light px-2 py-0.5 text-[12px] font-bold text-primary tabular-nums">
            {comments.length}
          </span>
        )}
      </h2>

      {loading && (
        <div className="mb-5 flex flex-col gap-3">
          {[0, 1].map((i) => (
            <div key={i} className="flex gap-3 rounded-2xl border border-border bg-bg-body p-3.5">
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && error && (
        <ErrorState message={error} onRetry={reload} className="mb-5 py-10" />
      )}

      {!loading && !error && (
        <div className="mb-5 flex flex-col gap-3">
          {comments.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border py-8 text-center text-sm text-text-muted italic">
              Henüz kimse yorum yapmamış. İlk teselliyi sen ver.
            </p>
          ) : (
            comments.map((comment) => (
              <article
                key={comment.id}
                className="animate-fade-in flex items-start gap-3 rounded-2xl border border-border bg-bg-body p-3.5"
              >
                <Avatar
                  nickname={comment.author}
                  avatarUrl={comment.authorAvatarUrl}
                  size={36}
                  tone={comment.isMine ? "primary" : "muted"}
                />

                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <span className="text-[12.5px] font-bold text-text-main">
                      {comment.author}
                    </span>
                    {comment.isMine && (
                      <span className="rounded-full bg-primary-light px-1.5 py-px text-[10px] font-bold text-primary">
                        Sen
                      </span>
                    )}
                    <span className="text-[11px] text-text-muted">
                      {formatRelativeDate(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-[13.5px] leading-relaxed break-words text-text-secondary">
                    {comment.text}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => handleLike(comment)}
                    aria-label={comment.isLiked ? "Beğeniyi geri al" : "Yorumu beğen"}
                    aria-pressed={comment.isLiked}
                    className={cn(
                      "flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold transition-colors",
                      "focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
                      comment.isLiked
                        ? "text-red-500"
                        : "text-text-muted hover:bg-primary-light hover:text-red-500",
                    )}
                  >
                    <Heart size={13} className={cn(comment.isLiked && "fill-red-500")} aria-hidden />
                    <span className="tabular-nums">{comment.likes}</span>
                  </button>

                  {comment.isMine && (
                    <button
                      onClick={() => setPendingDelete(comment)}
                      aria-label="Yorumu sil"
                      className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </article>
            ))
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        {submitError && <InlineAlert variant="error">{submitError}</InlineAlert>}

        <div className="flex flex-col gap-2.5 sm:flex-row">
          <div className="relative flex-1">
            {isAuthenticated && profile && (
              <Avatar
                nickname={profile.nickname}
                avatarUrl={profile.avatarUrl}
                size={28}
                className="absolute top-1/2 left-3 -translate-y-1/2"
              />
            )}
            <input
              type="text"
              value={text}
              maxLength={LIMITS.commentMax}
              onChange={(e) => {
                setText(e.target.value);
                setSubmitError(null);
              }}
              onFocus={() => {
                if (!isAuthenticated) requestSoftGate("comment");
              }}
              placeholder={isAuthenticated ? "Siz de teselli verin..." : "Yorum yapmak için giriş yapın..."}
              aria-label="Yorumun"
              disabled={submitting}
              className={cn(
                "h-12 w-full rounded-2xl border border-border bg-bg-body pr-4 text-[13.5px] text-text-main",
                "transition-[border-color,box-shadow] outline-none placeholder:text-text-muted",
                "focus:border-primary focus:bg-bg-card focus:ring-4 focus:ring-primary-light",
                "disabled:opacity-60",
                isAuthenticated && profile ? "pl-12" : "pl-4",
              )}
            />
          </div>

          <Button
            type="submit"
            size="lg"
            variant="dark"
            loading={submitting}
            disabled={!text.trim()}
            leftIcon={<Send size={15} />}
            className="sm:w-auto"
          >
            Gönder
          </Button>
        </div>
      </form>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Yorumu sil"
        description="Bu yorumu silmek istediğine emin misin? Bu işlem geri alınamaz."
        confirmLabel="Yorumu Sil"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </section>
  );
}
