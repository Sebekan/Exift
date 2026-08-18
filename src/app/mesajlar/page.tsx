"use client";

import { useEffect } from "react";
import { useAppData } from "@/context/AppDataContext";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { Container } from "@/components/layout/Container";
import { ChatList } from "@/components/chat/ChatList";

function MessagesContent() {
  const { chats, refreshChats } = useAppData();

  // Sayfa açıldığında tazele — başka sekmede/cihazda mesaj gelmiş olabilir.
  useEffect(() => {
    refreshChats();
  }, [refreshChats]);

  return (
    <Container size="content" className="animate-rise-in pt-8 pb-24">
      <header className="mb-6">
        <h1 className="mb-1.5 font-heading text-[24px] font-extrabold tracking-[-0.5px] text-text-main sm:text-[28px]">
          Mesajlar
        </h1>
        <p className="text-[13.5px] text-text-secondary">
          {chats.length > 0
            ? `${chats.length} sohbet`
            : "İlanlar üzerinden başlattığın konuşmalar burada."}
        </p>
      </header>

      <ChatList chats={chats} />
    </Container>
  );
}

export default function MessagesPage() {
  return (
    <RequireAuth message="Mesajlarını görmek için giriş yapmalısın.">
      <MessagesContent />
    </RequireAuth>
  );
}
