export function formatCurrency(amount: number | null | undefined) {
  if (amount === null || amount === undefined) return 'MAD 0.00';
  return `MAD ${amount.toFixed(2)}`;
}
