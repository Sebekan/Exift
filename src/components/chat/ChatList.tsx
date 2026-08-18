"use client";

import Image from "next/image";
import Link from "next/link";
import { ImageOff, MessageCircle } from "lucide-react";
import type { ChatSummary } from "@/types";
import { formatChatTimestamp, formatPrice } from "@/lib/format";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/States";

/**
 * Sohbet listesi. Her satır KİMİNLE konuşulduğunu (karşı taraf) ve HANGİ ilan
 * üzerinden konuşulduğunu birlikte gösterir — eski sürümde satıcı adı, alıcıya
 * kendi adını gösterecek şekilde yanlış kullanılıyordu.
 */
export function ChatList({ chats }: { chats: ChatSummary[] }) {
  if (chats.length === 0) {
    return (
      <EmptyState
        icon={MessageCircle}
        title="Henüz sohbetin yok"
        description="Bir ilanla iletişime geçtiğinde konuşmaların burada listelenir."
        actionLabel="İlanlara Göz At"
        actionHref="/"
      />
    );
  }

  return (
    <ul className="flex flex-col gap-2.5">
      {chats.map((chat) => (
        <li key={chat.id}>
          <Link
            href={`/sohbet/${chat.id}`}
            className="flex items-center gap-3.5 rounded-2xl border border-border bg-bg-card p-3 shadow-card transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-px hover:border-primary hover:shadow-hover focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none motion-reduce:hover:translate-y-0"
          >
            <Avatar
              nickname={chat.otherPartyNickname}
              avatarUrl={chat.otherPartyAvatarUrl}
              size={46}
            />

            <div className="min-w-0 flex-1">
              <div className="mb-0.5 flex items-baseline justify-between gap-2">
                <span className="truncate text-[13.5px] font-bold text-text-main">
                  {chat.otherPartyNickname}
                </span>
                <span className="shrink-0 text-[11px] text-text-muted">
                  {formatChatTimestamp(chat.lastMessageAt)}
                </span>
              </div>
              <p className="truncate text-[12.5px] text-text-secondary">{chat.lastMessage}</p>
              <p className="mt-1 flex items-center gap-1.5 truncate text-[11px] text-text-muted">
                <span className="truncate">{chat.productTitle}</span>
                <span aria-hidden>&middot;</span>
                <span className="shrink-0 font-semibold">{formatPrice(chat.productPrice)}</span>
                {chat.isSeller && (
                  <Badge tone="primary" className="ml-0.5 shrink-0 px-1.5 py-0 text-[9.5px]">
                    İlanın
                  </Badge>
                )}
              </p>
            </div>

            <div className="relative h-[52px] w-[52px] shrink-0 overflow-hidden rounded-xl bg-border">
              {chat.productImage ? (
                <Image
                  src={chat.productImage}
                  alt=""
                  fill
                  sizes="52px"
                  className="object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center">
                  <ImageOff size={16} className="text-text-muted" aria-hidden />
                </span>
              )}
              {chat.productSold && (
                <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-[9px] font-bold text-white">
                  Satıldı
                </span>
              )}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
