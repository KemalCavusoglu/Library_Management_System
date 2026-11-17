import type { Break } from './types';

export const uid = (): string =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 9);

export const todayStr = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
};

export const isBeforeToday = (dateStr: string): boolean => dateStr < todayStr();

export const nowTimeStr = (): string => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(
    d.getMinutes()
  ).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
};

/** seconds since midnight for a "HH:mm:ss" string */
export const timeToSec = (t: string | null): number => {
  if (!t) return 0;
  const [h, m, s] = t.split(':').map(Number);
  return h * 3600 + m * 60 + (s || 0);
};

/** current seconds since midnight */
export const nowSec = (): number => {
  const d = new Date();
  return d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
};

/** difference in seconds between a session start and an end (or now if active) */
export const sessionElapsedSec = (
  start: string,
  end: string | null,
  status: string
): number => {
  const startS = timeToSec(start);
  const endS = status === 'completed' && end ? timeToSec(end) : nowSec();
  return Math.max(0, endS - startS);
};

/** sum of break seconds for a list of breaks (open break = until now) */
export const breaksTotalSec = (breaks: Break[]): number =>
  breaks.reduce((acc, b) => {
    const s = timeToSec(b.start_time);
    const e = b.end_time ? timeToSec(b.end_time) : nowSec();
    return acc + Math.max(0, e - s);
  }, 0);

export interface DurationParts {
  gun: number;
  saat: number;
  dakika: number;
}

export const secToDuration = (totalSec: number): DurationParts => {
  const totalMin = Math.floor(totalSec / 60);
  const gun = Math.floor(totalMin / (60 * 24));
  const saat = Math.floor((totalMin % (60 * 24)) / 60);
  const dakika = totalMin % 60;
  return { gun, saat, dakika };
};

export const formatClock = (totalSec: number): string => {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(
    s
  ).padStart(2, '0')}`;
};

export const formatDurationLabel = (parts: DurationParts): string => {
  const bits: string[] = [];
  if (parts.gun > 0) bits.push(`${parts.gun} Gün`);
  if (parts.saat > 0) bits.push(`${parts.saat} Saat`);
  if (parts.dakika > 0 || bits.length === 0) bits.push(`${parts.dakika} Dakika`);
  return bits.join(' ');
};

export const formatHM = (totalSec: number): string => {
  const { saat, dakika } = secToDuration(totalSec);
  return `${saat}s ${dakika}d`;
};

export const monthKey = (dateStr: string): string => dateStr.slice(0, 7); // YYYY-MM

export const currentMonthKey = (): string => todayStr().slice(0, 7);

export const weekdayName = (dateStr: string): string => {
  const d = new Date(dateStr + 'T00:00:00');
  const names = [
    'Pazar',
    'Pazartesi',
    'Salı',
    'Çarşamba',
    'Perşembe',
    'Cuma',
    'Cumartesi',
  ];
  return names[d.getDay()];
};

export const hourBucket = (timeStr: string): number =>
  parseInt(timeStr.split(':')[0], 10);

export const formatTimeShort = (t: string): string => t.slice(0, 5);
