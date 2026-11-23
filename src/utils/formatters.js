export function generateTicketId() {
  const random = Math.floor(100 + Math.random() * 900);
  return `SF-2026-${random}`;
}

export function getStatusStyle(status) {
  switch (status) {
    case "Selesai":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "Diproses":
      return "bg-blue-100 text-blue-700 border-blue-200";
    default:
      return "bg-amber-100 text-amber-700 border-amber-200";
  }
}
