"use client";

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Save, Send } from "lucide-react";
import type { CategoryId, Product } from "@/types";
import { cn } from "@/lib/cn";
import { categories } from "@/lib/categories";
import { getCategoryIcon } from "@/lib/icons";
import { LIMITS, validatePrice, validateStory, validateTitle, type FieldErrors } from "@/lib/validation";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { ConfirmDialog } from "@/components/ui/Modal";
import { InlineAlert } from "@/components/ui/States";
import { ImageUploader } from "./ImageUploader";
import { Stepper } from "./Stepper";
import districts from "@/data/districts.json";

export interface ListingFormValues {
  title: string;
  category: CategoryId;
  district: string;
  price: string;
  story: string;
  images: string[];
}

type Field = "title" | "price" | "story" | "images";

const STEPS = ["Ürün Bilgileri", "Fotoğraflar", "Hikâye"] as const;
/** Hangi alanların hangi adımda doğrulanacağı. */
const STEP_FIELDS: Field[][] = [["title", "price"], ["images"], ["story"]];

export interface ListingFormProps {
  mode: "create" | "edit";
  initial?: Product;
  submitting: boolean;
  serverError: string | null;
  onSubmit: (values: ListingFormValues) => void;
  onCancel?: () => void;
}

function toFormValues(product?: Product): ListingFormValues {
  return {
    title: product?.title ?? "",
    category: product?.category ?? categories[0].id,
    district: product?.district ?? districts[0],
    price: product ? String(product.price) : "",
    story: product?.story ?? "",
    images: product?.images ?? [],
  };
}

/**
 * Oluşturma ve düzenleme aynı alanları paylaşır — iki ekranın zamanla
 * ayrışmasını önler. Yerleşim moda göre değişir:
 *
 *  - **create**: adım adım sihirbaz. Her adım tek bir işe odaklanır ve ekrana
 *    sığar; kullanıcı uzun bir formu aşağı kaydırmak zorunda kalmaz.
 *  - **edit**: tek sayfa. Düzenlemede amaç tek bir alanı değiştirmektir;
 *    kullanıcıyı üç adım gezdirmek gereksiz sürtünme yaratır.
 */
export function ListingForm({
  mode,
  initial,
  submitting,
  serverError,
  onSubmit,
  onCancel,
}: ListingFormProps) {
  const router = useRouter();
  const isEdit = mode === "edit";

  const initialValues = useMemo(() => toFormValues(initial), [initial]);
  const [values, setValues] = useState<ListingFormValues>(initialValues);
  const [errors, setErrors] = useState<FieldErrors<Field>>({});
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [step, setStep] = useState(0);

  const isDirty = useMemo(
    () => JSON.stringify(values) !== JSON.stringify(initialValues),
    [values, initialValues],
  );

  // Kaydedilmemiş değişiklik varken sekme kapanmasın.
  useEffect(() => {
    if (!isDirty || submitting) return;
    function warn(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty, submitting]);

  function set<K extends keyof ListingFormValues>(key: K, value: ListingFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (key in errors) setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validateField(field: Field): string | null {
    switch (field) {
      case "title":
        return validateTitle(values.title);
      case "price":
        return validatePrice(values.price);
      case "story":
        return validateStory(values.story);
      case "images":
        return values.images.length === 0 ? "En az bir fotoğraf eklemelisin." : null;
    }
  }

  function handleBlur(field: Field) {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors((prev) => ({ ...prev, [field]: validateField(field) ?? undefined }));
  }

  /** Verilen alanları doğrular, hataları yazar ve geçerli olup olmadığını döner. */
  function validateFields(fields: Field[]): boolean {
    const next: FieldErrors<Field> = {};
    for (const field of fields) {
      const error = validateField(field);
      if (error) next[field] = error;
    }
    setErrors((prev) => ({ ...prev, ...next }));
    setTouched((prev) => ({ ...prev, ...Object.fromEntries(fields.map((f) => [f, true])) }));

    if (Object.keys(next).length > 0) {
      document
        .querySelector('[aria-invalid="true"]')
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return false;
    }
    return true;
  }

  function goNext() {
    if (!validateFields(STEP_FIELDS[step])) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goBack() {
    setStep((s) => Math.max(s - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;
    if (!validateFields(["title", "price", "story", "images"])) return;
    onSubmit(values);
  }

  function handleCancel() {
    if (isDirty) {
      setConfirmLeave(true);
      return;
    }
    leave();
  }

  function leave() {
    if (onCancel) onCancel();
    else router.back();
  }

  const storyLength = values.story.trim().length;

  /* ------------------------------ alan grupları ------------------------------ */

  const productFields = (
    <div className="flex flex-col gap-5">
      <Input
        label="Anının adı"
        required
        placeholder="Örn. Hiç takılmamış söz yüzüğü"
        value={values.title}
        maxLength={LIMITS.titleMax}
        counter={`${values.title.length}/${LIMITS.titleMax}`}
        error={touched.title ? errors.title : null}
        onChange={(e) => set("title", e.target.value)}
        onBlur={() => handleBlur("title")}
        disabled={submitting}
      />

      <fieldset>
        <legend className="mb-2 font-heading text-[13px] font-bold text-text-main">Kategori</legend>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => {
            const Icon = getCategoryIcon(category.icon);
            const isActive = values.category === category.id;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => set("category", category.id)}
                aria-pressed={isActive}
                disabled={submitting}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-4 py-2.5 font-heading text-[13px] font-semibold whitespace-nowrap",
                  "transition-[background-color,border-color,color] duration-200",
                  "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none",
                  "disabled:opacity-60",
                  isActive
                    ? "border-primary bg-primary text-white"
                    : "border-border bg-bg-body text-text-secondary hover:border-primary hover:text-primary",
                )}
              >
                <Icon size={14} aria-hidden /> {category.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Select
          label="Konum (İstanbul ilçesi)"
          required
          value={values.district}
          onChange={(e) => set("district", e.target.value)}
          disabled={submitting}
        >
          {districts.map((district) => (
            <option key={district} value={district}>
              {district}
            </option>
          ))}
        </Select>

        <Input
          label="Fiyat (₺)"
          required
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          placeholder="0"
          value={values.price}
          error={touched.price ? errors.price : null}
          onChange={(e) => set("price", e.target.value)}
          onBlur={() => handleBlur("price")}
          disabled={submitting}
        />
      </div>
    </div>
  );

  const photoFields = (
    <div>
      <div aria-invalid={touched.images && Boolean(errors.images) ? true : undefined}>
        <ImageUploader
          images={values.images}
          onChange={(images) => {
            set("images", images);
            setTouched((prev) => ({ ...prev, images: true }));
          }}
          disabled={submitting}
        />
      </div>
      {touched.images && errors.images && (
        <p role="alert" className="mt-2 text-[12px] font-semibold text-red-600">
          {errors.images}
        </p>
      )}
    </div>
  );

  const storyFields = (
    <Textarea
      required
      rows={6}
      placeholder="Buraya o hisli hikâyeyi yaz..."
      value={values.story}
      counter={`${storyLength}/${LIMITS.storyMin} minimum`}
      error={touched.story ? errors.story : null}
      hint={
        storyLength < LIMITS.storyMin
          ? `${LIMITS.storyMin - storyLength} karakter daha yazman gerekiyor.`
          : "Hikâyen yayına hazır."
      }
      onChange={(e) => set("story", e.target.value)}
      onBlur={() => handleBlur("story")}
      disabled={submitting}
    />
  );

  const STEP_CONTENT: { title: string; hint: string; body: ReactNode }[] = [
    {
      title: "Ürün bilgileri",
      hint: "Neyi, nerede, kaça satıyorsun?",
      body: productFields,
    },
    {
      title: "Fotoğraflar",
      hint: `İyi bir fotoğraf hikâyenin yarısıdır. En fazla ${LIMITS.maxImages} görsel ekleyebilirsin.`,
      body: photoFields,
    },
    {
      title: "Hikâye",
      hint: "Bu eşyanın senin için ne anlama geldiğini anlat. Alıcılar ürünü değil, hikâyeyi satın alır.",
      body: storyFields,
    },
  ];

  /* --------------------------------- edit --------------------------------- */

  if (isEdit) {
    return (
      <>
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
          {serverError && <InlineAlert variant="error">{serverError}</InlineAlert>}

          {STEP_CONTENT.map(({ title, hint, body }) => (
            <section
              key={title}
              className="rounded-3xl border border-border bg-bg-card p-6 shadow-card sm:p-7"
            >
              <h2 className="mb-1.5 font-heading text-[15px] font-bold text-text-main">{title}</h2>
              <p className="mb-5 text-[12.5px] text-text-secondary">{hint}</p>
              {body}
            </section>
          ))}

          <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={handleCancel}
              disabled={submitting}
              className="sm:min-w-[140px]"
            >
              Vazgeç
            </Button>
            <Button
              type="submit"
              size="lg"
              loading={submitting}
              disabled={!isDirty}
              leftIcon={<Save size={16} />}
              className="sm:min-w-[200px]"
            >
              {submitting ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
            </Button>
          </div>
        </form>

        <ConfirmDialog
          open={confirmLeave}
          title="Kaydedilmemiş değişiklikler var"
          description="Çıkarsan yaptığın değişiklikler kaybolacak. Yine de çıkmak istiyor musun?"
          confirmLabel="Çık"
          cancelLabel="Düzenlemeye Devam Et"
          destructive
          onConfirm={leave}
          onCancel={() => setConfirmLeave(false)}
        />
      </>
    );
  }

  /* -------------------------------- create -------------------------------- */

  const isLastStep = step === STEPS.length - 1;
  const active = STEP_CONTENT[step];

  return (
    <>
      <form onSubmit={handleSubmit} noValidate>
        <div className="rounded-3xl border border-border bg-bg-card p-5 shadow-card sm:p-7">
          <Stepper
            steps={[...STEPS]}
            current={step}
            // Yalnızca tamamlanmış adımlara dönülebilir; ileri atlamak
            // doğrulamayı atlatmak olurdu.
            onStepClick={(index) => setStep(index)}
          />

          <div className="mt-6 mb-5 border-t border-border pt-5">
            <h2 className="mb-1 font-heading text-[17px] font-extrabold text-text-main">
              {active.title}
            </h2>
            <p className="mb-5 text-[13px] leading-relaxed text-text-secondary">{active.hint}</p>

            {/* Adım değişince içerik yumuşak geçişle gelir. */}
            <div key={step} className="animate-fade-in">
              {active.body}
            </div>
          </div>

          {serverError && (
            <div className="mb-5">
              <InlineAlert variant="error">{serverError}</InlineAlert>
            </div>
          )}

          <div className="flex gap-2.5 border-t border-border pt-4">
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={step === 0 ? handleCancel : goBack}
              disabled={submitting}
              leftIcon={step === 0 ? undefined : <ArrowLeft size={16} />}
              className="flex-1"
            >
              {step === 0 ? "Vazgeç" : "Geri"}
            </Button>

            {isLastStep ? (
              <Button
                type="submit"
                size="lg"
                loading={submitting}
                leftIcon={<Send size={16} />}
                className="flex-[2]"
              >
                {submitting ? "Yayınlanıyor..." : "İlanı Yayınla"}
              </Button>
            ) : (
              <Button
                type="button"
                size="lg"
                onClick={goNext}
                disabled={submitting}
                rightIcon={<ArrowRight size={16} />}
                className="flex-[2]"
              >
                Devam Et
              </Button>
            )}
          </div>
        </div>
      </form>

      <ConfirmDialog
        open={confirmLeave}
        title="Kaydedilmemiş değişiklikler var"
        description="Çıkarsan girdiğin bilgiler kaybolacak. Yine de çıkmak istiyor musun?"
        confirmLabel="Çık"
        cancelLabel="Devam Et"
        destructive
        onConfirm={leave}
        onCancel={() => setConfirmLeave(false)}
      />
    </>
  );
}
