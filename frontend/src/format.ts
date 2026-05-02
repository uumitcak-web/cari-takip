export function formatTRY(amount: number, withSymbol = true): string {
  const sign = amount < 0 ? '-' : '';
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${sign}${formatted}${withSymbol ? ' ₺' : ''}`;
}

export function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export function formatShortDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });
  } catch {
    return iso;
  }
}

export function nextStatementDate(statementDay: number): Date {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const day = today.getDate();
  let next = new Date(year, month, statementDay);
  if (statementDay <= day) {
    next = new Date(year, month + 1, statementDay);
  }
  // Handle months without that day
  if (next.getDate() !== statementDay) {
    next = new Date(next.getFullYear(), next.getMonth() + 1, 0);
  }
  return next;
}

export function daysUntil(date: Date): number {
  const now = new Date();
  const ms = date.getTime() - now.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}
