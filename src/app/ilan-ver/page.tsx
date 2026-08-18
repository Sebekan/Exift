"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppData } from "@/context/AppDataContext";
import { toUserMessage } from "@/lib/api/errors";
import { listingService } from "@/services";
import type { Product } from "@/types";
import { Container } from "@/components/layout/Container";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { ListingForm, type ListingFormValues } from "@/components/product/ListingForm";
import { PublishSuccessModal } from "@/components/product/PublishSuccessModal";

function CreateListingContent() {
  const router = useRouter();
  const { upsertMyListing } = useAppData();

  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [published, setPublished] = useState<Product | null>(null);
  // Modal "yeni ilan ekle" derse formu sıfırlamak için anahtarı değiştiriyoruz.
  const [formKey, setFormKey] = useState(0);

  async function handleSubmit(values: ListingFormValues) {
    setSubmitting(true);
    setServerError(null);
    try {
      const product = await listingService.create({
        title: values.title,
        story: values.story,
        price: Number(values.price),
        category: values.category,
        district: values.district,
        images: values.images,
      });
      upsertMyListing(product);
      setPublished(product);
    } catch (error) {
      // Form değerleri korunur — kullanıcı yazdıklarını kaybetmez.
      setServerError(toUserMessage(error, "İlan yayınlanamadı."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Container size="narrow" className="animate-rise-in pt-6 pb-16">
      <header className="mb-5">
        <h1 className="mb-1.5 font-heading text-[21px] font-extrabold tracking-[-0.5px] text-text-main sm:text-[24px]">
          Eski bir anıyı geride bırak
        </h1>
        <p className="text-[13.5px] leading-relaxed text-text-secondary">
          Fotoğrafını yükle, hikâyesini anlat ve bu anıyı yeni bir sahibine gönder.
        </p>
      </header>

      <ListingForm
        key={formKey}
        mode="create"
        submitting={submitting}
        serverError={serverError}
        onSubmit={handleSubmit}
        onCancel={() => router.push("/")}
      />

      <PublishSuccessModal
        isOpen={published !== null}
        onViewListing={() => published && router.push(`/ilan/${published.id}`)}
        onNewListing={() => {
          setPublished(null);
          setServerError(null);
          setFormKey((k) => k + 1);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />
    </Container>
  );
}

export default function CreateListingPage() {
  return (
    <RequireAuth message="İlan verebilmek için önce giriş yapmalısın.">
      <CreateListingContent />
    </RequireAuth>
  );
}
