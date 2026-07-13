
export  function nowTo(secondsAhead = 90): string {
  const date = new Date(Date.now() + secondsAhead * 1000);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}
export function normalizeDatetimeLocal(value?: string | null) {
  if (!value) return null
  return value.includes('T') ? value.replace('T', ' ') + (value.length === 16 ? ':00' : '') : value
}
export function formatDate(date: string | Date)  {
  const d = new Date(date);
  const dia = String(d.getDate()).padStart(2, "0");
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const ano = d.getFullYear();
  const hora = String(d.getHours()).padStart(2, "0");
  const minuto = String(d.getMinutes()).padStart(2, "0");
  return `${dia}/${mes}/${ano} ${hora}:${minuto}`;
}
