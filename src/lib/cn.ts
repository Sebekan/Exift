type ClassValue = string | number | null | undefined | false | ClassValue[];

/**
 * Koşullu sınıf birleştirici. `clsx` bağımlılığı eklemeye değmeyecek kadar
 * küçük bir ihtiyaç — Tailwind sınıf çakışmalarını çözmez, sadece birleştirir.
 */
export function cn(...inputs: ClassValue[]): string {
  const out: string[] = [];
  for (const input of inputs) {
    if (!input) continue;
    if (Array.isArray(input)) {
      const nested = cn(...input);
      if (nested) out.push(nested);
    } else {
      out.push(String(input));
    }
  }
  return out.join(" ");
}
