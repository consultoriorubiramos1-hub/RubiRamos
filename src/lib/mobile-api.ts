import { NextResponse } from 'next/server';

const noStore = { 'Cache-Control': 'no-store' };

export function mobileSuccess(data: unknown, status = 200) {
  return NextResponse.json({ ok: true, data }, { status, headers: noStore });
}

export function mobileError(status: number, message: string) {
  return NextResponse.json({ ok: false, message }, { status, headers: noStore });
}

export function positiveId(value: string): number | null {
  if (!/^[1-9]\d*$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) ? id : null;
}

export function calendarDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const checked = new Date(Date.UTC(year, month - 1, day));
  if (
    checked.getUTCFullYear() !== year ||
    checked.getUTCMonth() + 1 !== month ||
    checked.getUTCDate() !== day
  ) return null;
  // Las funciones existentes extraen año, mes y día en la zona local del servidor.
  return new Date(year, month - 1, day, 12);
}

export function appointmentTime(value: string): string | null {
  const match = /^(\d{2}):(\d{2})(?::00)?$/.exec(value);
  if (!match || Number(match[1]) > 23 || Number(match[2]) > 59) return null;
  return `${match[1]}:${match[2]}:00`;
}

export function isPastClinicDate(value: string): boolean {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Mexico_City',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const part = (type: string) => parts.find(item => item.type === type)?.value ?? '';
  return value < `${part('year')}-${part('month')}-${part('day')}`;
}
