"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ImageOff, Pencil, Send } from "lucide-react";
import type { ChatMessage, ChatThread } from "@/types";
import { cn } from "@/lib/cn";
import { formatDayLabel, formatPrice, formatTime } from "@/lib/format";
import { toUserMessage } from "@/lib/api/errors";
import { LIMITS } from "@/lib/validation";
import { chatService } from "@/services";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useToast } from "@/context/ToastContext";
import { Container } from "@/components/layout/Container";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { ErrorState, LoadingState } from "@/components/ui/States";

/** Ardışık mesajları güne göre grupla — uzun sohbetlerde okunabilirlik için. */
function groupByDay(messages: ChatMessage[]): { day: string; items: ChatMessage[] }[] {
  const groups: { day: string; items: ChatMessage[] }[] = [];
  for (const message of messages) {
    const day = formatDayLabel(message.createdAt);
    const last = groups[groups.length - 1];
    if (last && last.day === day) last.items.push(message);
    else groups.push({ day, items: [message] });
  }
  return groups;
}

function ChatThreadContent() {
  const { chatId } = useParams<{ chatId: string }>();
  const { showError } = useToast();

  const fetcher = useCallback(
    (signal: AbortSignal) => chatService.get(chatId, signal),
    [chatId],
  );
  const { data: chat, loading, error, reload, setData } = useAsyncData<ChatThread>(fetcher);

  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const messageCount = chat?.messages.length ?? 0;

  // Yeni mesajda en alta kaydır.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messageCount]);

  async function handleSend(event: FormEvent) {
    event.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || sending || !chat) return;

    setSending(true);
    // İyimser gönderim: mesaj anında görünür, sunucu onayında kesinleşir.
    const tempId = `pending-${Date.now()}`;
    const optimistic: ChatMessage = {
      id: tempId,
      senderId: "",
      text: trimmed,
      createdAt: new Date().toISOString(),
      isMine: true,
      pending: true,
    };
    setData((current) =>
      current ? { ...current, messages: [...current.messages, optimistic] } : current,
    );
    setText("");

    try {
      const saved = await chatService.sendMessage(chatId, trimmed);
      setData((current) =>
        current
          ? {
              ...current,
              messages: current.messages.map((m) => (m.id === tempId ? saved : m)),
              lastMessage: saved.text,
              lastMessageAt: saved.createdAt,
            }
          : current,
      );
    } catch (err) {
      // Başarısız mesajı listeden çıkar ve taslağı geri ver.
      setData((current) =>
        current
          ? { ...current, messages: current.messages.filter((m) => m.id !== tempId) }
          : current,
      );
      setText(trimmed);
      showError(toUserMessage(err, "Mesaj gönderilemedi."));
    } finally {
      setSending(false);
    }
  }

  if (loading) return <LoadingState message="Sohbet yükleniyor..." />;

  if (error || !chat) {
    return (
      <div className="mx-auto max-w-[600px] px-[5%] py-20">
        <ErrorState
          title="Sohbet açılamadı"
          message={error ?? "Bu sohbet bulunamadı."}
          onRetry={error ? reload : undefined}
        />
        <div className="mt-5 text-center">
          <ButtonLink href="/profil" variant="secondary" leftIcon={<ArrowLeft size={15} />}>
            Sohbetlerime dön
          </ButtonLink>
        </div>
      </div>
    );
  }

  const groups = groupByDay(chat.messages);

  return (
    <Container size="content" className="animate-rise-in flex flex-col pt-6 pb-6">
      <ButtonLink
        href="/profil"
        variant="secondary"
        size="sm"
        className="mb-4 w-fit rounded-full"
        leftIcon={<ArrowLeft size={15} />}
      >
        Sohbetlerim
      </ButtonLink>

      {/* Sohbet başlığı: kiminle konuşulduğu + hangi ilan üzerinden. */}
      <div className="mb-4 rounded-2xl border border-border bg-bg-card shadow-card">
        <div className="flex items-center gap-3 border-b border-border p-3.5">
          <Avatar
            nickname={chat.otherPartyNickname}
            avatarUrl={chat.otherPartyAvatarUrl}
            size={42}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-bold text-text-main">
              {chat.otherPartyNickname}
            </p>
            <p className="text-[11.5px] text-text-secondary">
              {chat.isSeller ? "İlanınla ilgileniyor" : "İlan sahibi"}
            </p>
          </div>
          {chat.isSeller && !chat.productSold && (
            <ButtonLink
              href={`/ilan/${chat.productId}/duzenle`}
              variant="ghost"
              size="sm"
              className="shrink-0 rounded-full"
              leftIcon={<Pencil size={13} />}
            >
              Düzenle
            </ButtonLink>
          )}
        </div>

        <Link
          href={`/ilan/${chat.productId}`}
          className="flex items-center gap-3.5 p-3.5 transition-colors hover:bg-bg-body focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
        >
          <div className="relative h-[52px] w-[52px] shrink-0 overflow-hidden rounded-xl bg-border">
            {chat.productImage ? (
              <Image src={chat.productImage} alt="" fill sizes="52px" className="object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center">
                <ImageOff size={16} className="text-text-muted" aria-hidden />
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-bold text-text-main">{chat.productTitle}</p>
            <p className="mt-0.5 flex items-center gap-2 text-[12px] font-semibold text-primary">
              {formatPrice(chat.productPrice)}
              {chat.productSold && (
                <Badge tone="neutral" className="px-2 py-0 text-[9.5px]">
                  Satıldı
                </Badge>
              )}
            </p>
          </div>
          <span className="shrink-0 text-[11.5px] font-semibold text-text-muted">İlana git →</span>
        </Link>
      </div>

      <div
        className="flex min-h-[52vh] flex-col gap-3 overflow-y-auto rounded-3xl border border-border bg-bg-card p-4 shadow-card sm:p-5"
        role="log"
        aria-label="Mesajlar"
        aria-live="polite"
      >
        {chat.messages.length === 0 && (
          <p className="py-10 text-center text-sm text-text-muted italic">
            Henüz mesaj yok. İlk mesajı sen gönder.
          </p>
        )}

        {groups.map((group) => (
          <div key={group.day} className="flex flex-col gap-2">
            <div className="my-1 flex items-center gap-3">
              <span className="h-px flex-1 bg-border" />
              <span className="text-[10.5px] font-bold tracking-wide text-text-muted uppercase">
                {group.day}
              </span>
              <span className="h-px flex-1 bg-border" />
            </div>

            {group.items.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "animate-fade-in flex",
                  message.isMine ? "justify-end" : "justify-start",
                )}
              >
                <div
                  className={cn(
                    "max-w-[78%] rounded-2xl px-4 py-2.5 text-[13.5px] leading-relaxed break-words",
                    message.isMine
                      ? "rounded-br-md bg-primary text-white"
                      : "rounded-bl-md bg-bg-body text-text-main",
                    message.pending && "opacity-65",
                  )}
                >
                  <p className="whitespace-pre-wrap">{message.text}</p>
                  <p
                    className={cn(
                      "mt-1 text-[10px]",
                      message.isMine ? "text-white/70" : "text-text-muted",
                    )}
                  >
                    {message.pending ? "Gönderiliyor..." : formatTime(message.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="mt-4 flex gap-2.5">
        <input
          type="text"
          value={text}
          maxLength={LIMITS.messageMax}
          onChange={(e) => setText(e.target.value)}
          placeholder="Bir mesaj yaz..."
          aria-label="Mesajın"
          className="h-12 flex-1 rounded-2xl border border-border bg-bg-body px-[18px] text-[13.5px] text-text-main transition-[border-color,box-shadow] outline-none placeholder:text-text-muted focus:border-primary focus:bg-bg-card focus:ring-4 focus:ring-primary-light"
        />
        <Button
          type="submit"
          size="lg"
          loading={sending}
          disabled={!text.trim()}
          leftIcon={<Send size={15} />}
          className="px-5 sm:px-7"
        >
          <span className="hidden sm:inline">Gönder</span>
        </Button>
      </form>
    </Container>
  );
}

export default function ChatThreadPage() {
  return (
    <RequireAuth message="Sohbetlerini görmek için giriş yapmalısın.">
      <ChatThreadContent />
    </RequireAuth>
  );
}
