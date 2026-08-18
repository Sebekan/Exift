import { Check } from "lucide-react";

interface PublishSuccessModalProps {
  isOpen: boolean;
  onViewListing: () => void;
  onNewListing: () => void;
}

export function PublishSuccessModal({
  isOpen,
  onViewListing,
  onNewListing,
}: PublishSuccessModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/45 p-5">
      <div className="animate-modal-pop w-[90%] max-w-[360px] rounded-2xl border border-border bg-bg-card px-8 py-10 text-center shadow-[0_25px_60px_rgba(0,0,0,0.25)]">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
          <Check size={26} className="text-emerald-600" strokeWidth={3} />
        </div>
        <h3 className="mb-2 text-[18px] font-medium text-text-main">İlanın yayında.</h3>
        <p className="mb-7 text-sm leading-relaxed text-text-secondary">
          Bir yük daha bıraktın. Şimdi biri bu eşyada kendi hikayesini bulacak.
        </p>
        <div className="flex flex-col gap-2.5">
          <button
            onClick={onViewListing}
            className="w-full rounded-2xl bg-primary py-3.5 font-heading text-sm font-bold text-white transition-colors hover:bg-primary-hover"
          >
            İlanı gör
          </button>
          <button
            onClick={onNewListing}
            className="w-full rounded-2xl border border-border bg-transparent py-3.5 font-heading text-sm font-bold text-text-main transition-colors hover:border-primary hover:text-primary"
          >
            Yeni ilan ekle
          </button>
        </div>
      </div>
    </div>
  );
}
