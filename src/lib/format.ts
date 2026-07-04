// Format price with Arabic numerals and currency
export function formatPrice(price: number, currency: string = "ريال"): string {
  const formatted = new Intl.NumberFormat("en-US").format(price);
  return `${formatted} ${currency}`;
}

// Format date in Arabic
export function formatArabicDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) return "الآن";
  if (diffMinutes < 60) return `قبل ${diffMinutes} دقيقة`;
  if (diffHours < 24) return `قبل ${diffHours} ساعة`;
  if (diffDays < 7) return `قبل ${diffDays} يوم`;
  if (diffDays < 30) return `قبل ${Math.floor(diffDays / 7)} أسبوع`;
  if (diffDays < 365) return `قبل ${Math.floor(diffDays / 30)} شهر`;
  return `قبل ${Math.floor(diffDays / 365)} سنة`;
}

// Format numbers with thousands separator
export function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-US").format(num);
}

// Format kilometers
export function formatKilometers(km: number): string {
  return `${formatNumber(km)} كم`;
}
