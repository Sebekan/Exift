"use client";

import { Suspense, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Heart, MessageCircle, Package, Settings, Tag } from "lucide-react";
import type { Product } from "@/types";
import { listingService } from "@/services";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useAppData } from "@/context/AppDataContext";
import { Container } from "@/components/layout/Container";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileSettings } from "@/components/profile/ProfileSettings";
import { ProfileSidebar, type ProfileSection } from "@/components/profile/ProfileSidebar";
import { ChatList } from "@/components/chat/ChatList";
import { ErrorState, LoadingState } from "@/components/ui/States";

/** Bölüm adları URL'de görünür: Türkçe, paylaşılabilir, geri tuşuyla uyumlu. */
const SECTIONS = ["ilanlarim", "satilanlar", "sandigim", "sohbetler", "ayarlar"] as const;
type Section = (typeof SECTIONS)[number];

const DEFAULT_SECTION: Section = "ilanlarim";

function parseSection(value: string | null): Section {
  return SECTIONS.includes(value as Section) ? (value as Section) : DEFAULT_SECTION;
}

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    profile,
    myListings,
    myListingsLoading,
    refreshMyListings,
    chats,
    refreshChats,
    logout,
  } = useAppData();

  // Aktif bölüm URL'de tutulur — header menüsünden derin bağlantı verilebilir
  // (?bolum=ayarlar) ve geri tuşu bölümler arasında doğru çalışır.
  const section = parseSection(searchParams.get("bolum"));

  function selectSection(next: Section) {
    const query = next === DEFAULT_SECTION ? "" : `?bolum=${next}`;
    router.replace(`/profil${query}`, { scroll: false });
  }

  function handleLogout() {
    logout();
    router.push("/");
  }

  useEffect(() => {
    refreshMyListings();
    refreshChats();
  }, [refreshMyListings, refreshChats]);

  const favoritesFetcher = useCallback(
    (signal: AbortSignal) => listingService.listFavorites(signal),
    [],
  );
  const {
    data: favorites,
    loading: favoritesLoading,
    error: favoritesError,
    reload: reloadFavorites,
  } = useAsyncData<Product[]>(favoritesFetcher);

  if (!profile) return null;

  const activeListings = myListings.filter((p) => !p.sold);
  const soldListings = myListings.filter((p) => p.sold);
  const totalLikes = myListings.reduce((sum, p) => sum + p.likes, 0);

  const sections: ProfileSection<Section>[] = [
    { id: "ilanlarim", label: "İlanlarım", icon: Tag, count: activeListings.length },
    { id: "satilanlar", label: "Satılanlar", icon: CheckCircle2, count: soldListings.length },
    { id: "sandigim", label: "Sandığım", icon: Package, count: favorites?.length },
    { id: "sohbetler", label: "Sohbetler", icon: MessageCircle, count: chats.length },
    { id: "ayarlar", label: "Ayarlar", icon: Settings },
  ];

  const stats = [
    { label: "Aktif ilan", value: activeListings.length, icon: Tag },
    { label: "Satılan", value: soldListings.length, icon: CheckCircle2 },
    { label: "Toplam beğeni", value: totalLikes, icon: Heart },
  ];

  const heading = sections.find((s) => s.id === section)?.label ?? "";

  return (
    <Container className="animate-rise-in pt-6 pb-24">
      <ProfileHeader
        profile={profile}
        activeListingCount={activeListings.length}
        onEdit={() => selectSection("ayarlar")}
        onLogout={handleLogout}
      />

      {/*
        Dar ekranda SÜTUN olmalı: `ProfileSidebar` mobilde yatay bir bölüm
        şeridi render ediyor. Kapsayıcı satır (row) kalırsa bu şerit içeriğin
        YANINA düşer, esnek kutu onu tam yüksekliğe gerdirir ve yatay taşma
        oluşur. Masaüstünde satıra geçiyoruz.
      */}
      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        <ProfileSidebar
          profile={profile}
          sections={sections}
          active={section}
          onSelect={selectSection}
          onLogout={handleLogout}
        />

        <div className="min-w-0 flex-1">
          {/* İstatistikler yalnızca ilan bölümlerinde anlamlı. */}
          {(section === "ilanlarim" || section === "satilanlar") && (
            <div className="mb-6 grid grid-cols-3 gap-3">
              {stats.map(({ label, value, icon: Icon }) => (
                <div
                  key={label}
                  className="rounded-2xl border border-border bg-bg-card p-4 text-center shadow-card sm:p-5"
                >
                  <Icon size={16} className="mx-auto mb-1.5 text-primary" aria-hidden />
                  <div className="font-heading text-xl font-extrabold text-text-main tabular-nums sm:text-2xl">
                    {value}
                  </div>
                  <div className="text-[11px] font-semibold text-text-secondary sm:text-[11.5px]">
                    {label}
                  </div>
                </div>
              ))}
            </div>
          )}

          <h2 className="mb-4 font-heading text-[19px] font-extrabold tracking-[-0.3px] text-text-main">
            {heading}
          </h2>

          {section === "ilanlarim" && (
            <ProductGrid
              products={activeListings}
              loading={myListingsLoading && myListings.length === 0}
              showOwnerActions
              columns="responsive"
              emptyTitle="Henüz bir ilan yayınlamadın"
              emptyMessage="İlk ilanını oluştur, bir yükten kurtul ve hemen satışa başla."
              emptyActionLabel="İlan Ver"
              emptyActionHref="/ilan-ver"
            />
          )}

          {section === "satilanlar" && (
            <ProductGrid
              products={soldListings}
              showOwnerActions
              columns="responsive"
              emptyTitle="Henüz satılan ilanın yok"
              emptyMessage="Bir ilanını satıldı olarak işaretlediğinde burada ve Exift Müzesi'nde görünür."
            />
          )}

          {section === "sandigim" &&
            (favoritesError ? (
              <ErrorState message={favoritesError} onRetry={reloadFavorites} />
            ) : (
              <ProductGrid
                products={favorites ?? []}
                loading={favoritesLoading}
                columns="responsive"
                emptyTitle="Sandığın henüz boş"
                emptyMessage="Kalbine dokunan bir anı bulduğunda kaydet ikonuna dokun; burada seni beklesin."
                emptyActionLabel="İlanlara Göz At"
                emptyActionHref="/"
              />
            ))}

          {section === "sohbetler" && <ChatList chats={chats} />}

          {section === "ayarlar" && <ProfileSettings profile={profile} />}
        </div>
      </div>
    </Container>
  );
}

export default function ProfilePage() {
  return (
    <RequireAuth message="Profilini görüntülemek için giriş yapmalısın.">
      <Suspense fallback={<LoadingState message="Profil yükleniyor..." />}>
        <ProfileContent />
      </Suspense>
    </RequireAuth>
  );
}
