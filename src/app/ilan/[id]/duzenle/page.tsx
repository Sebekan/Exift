"use client";

import { useCallback, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import type { Product } from "@/types";
import { toUserMessage } from "@/lib/api/errors";
import { isProductOwner } from "@/lib/ownership";
import { listingService } from "@/services";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useAppData } from "@/context/AppDataContext";
import { useToast } from "@/context/ToastContext";
import { Container } from "@/components/layout/Container";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { ButtonLink } from "@/components/ui/Button";
import { ErrorState, LoadingState } from "@/components/ui/States";
import { ListingForm, type ListingFormValues } from "@/components/product/ListingForm";

function EditListingContent() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { profile, upsertMyListing } = useAppData();
  const { showToast } = useToast();

  const fetcher = useCallback((signal: AbortSignal) => listingService.get(id, signal), [id]);
  const { data: product, loading, error, reload } = useAsyncData<Product>(fetcher);

  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  if (loading) return <LoadingState message="İlan yükleniyor..." />;

  if (error || !product) {
    return (
      <div className="mx-auto max-w-[600px] px-[5%] py-20">
        <ErrorState
          title="İlan yüklenemedi"
          message={error ?? "Bu ilan bulunamadı."}
          onRetry={error ? reload : undefined}
        />
      </div>
    );
  }

  // UI seviyesinde sahiplik kontrolü. Gerçek yetkilendirme backend'de:
  // PUT /api/products/{id} sahip olmayan isteklere 403 döner.
  if (!isProductOwner(product, profile)) {
    return (
      <div className="mx-auto flex max-w-[520px] flex-col items-center px-[5%] py-24 text-center">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600">
          <ShieldAlert size={26} aria-hidden />
        </div>
        <h1 className="mb-2 font-heading text-[19px] font-extrabold text-text-main">
          Bu ilanı düzenleyemezsin
        </h1>
        <p className="mb-6 text-[13.5px] leading-relaxed text-text-secondary">
          Yalnızca kendi ilanlarını düzenleyebilirsin.
        </p>
        <ButtonLink href={`/ilan/${product.id}`} variant="secondary" leftIcon={<ArrowLeft size={15} />}>
          İlana dön
        </ButtonLink>
      </div>
    );
  }

  if (product.sold) {
    return (
      <div className="mx-auto flex max-w-[520px] flex-col items-center px-[5%] py-24 text-center">
        <h1 className="mb-2 font-heading text-[19px] font-extrabold text-text-main">
          Satılmış ilanlar düzenlenemez
        </h1>
        <p className="mb-6 text-[13.5px] leading-relaxed text-text-secondary">
          Bu anı Exift Müzesi&apos;nde arşivlendi ve artık değiştirilemez.
        </p>
        <ButtonLink href={`/ilan/${product.id}`} variant="secondary" leftIcon={<ArrowLeft size={15} />}>
          İlana dön
        </ButtonLink>
      </div>
    );
  }

  async function handleSubmit(values: ListingFormValues) {
    if (!product) return;
    setSubmitting(true);
    setServerError(null);
    try {
      const updated = await listingService.update(product.id, {
        title: values.title,
        story: values.story,
        price: Number(values.price),
        category: values.category,
        district: values.district,
        images: values.images,
      });
      upsertMyListing(updated);
      showToast("İlanın başarıyla güncellendi.");
      router.push(`/ilan/${updated.id}`);
    } catch (err) {
      setServerError(toUserMessage(err, "İlan güncellenemedi."));
      setSubmitting(false);
    }
  }

  return (
    <Container size="narrow" className="animate-rise-in pt-8 pb-24">
      <ButtonLink
        href={`/ilan/${product.id}`}
        variant="secondary"
        size="sm"
        className="mb-5 rounded-full"
        leftIcon={<ArrowLeft size={15} />}
      >
        İlana Geri Dön
      </ButtonLink>

      <header className="mb-7">
        <h1 className="mb-2 font-heading text-[24px] font-extrabold tracking-[-0.5px] text-text-main sm:text-[28px]">
          İlanı düzenle
        </h1>
        <p className="text-[13.5px] leading-relaxed text-text-secondary">
          Değişikliklerin kaydettiğin anda yayına alınır.
        </p>
      </header>

      <ListingForm
        mode="edit"
        initial={product}
        submitting={submitting}
        serverError={serverError}
        onSubmit={handleSubmit}
        onCancel={() => router.push(`/ilan/${product.id}`)}
      />
    </Container>
  );
}

export default function EditListingPage() {
  return (
    <RequireAuth message="İlanını düzenlemek için giriş yapmalısın.">
      <EditListingContent />
    </RequireAuth>
  );
}
