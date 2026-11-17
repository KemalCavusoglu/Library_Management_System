import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Card } from '../../components/ui/Card';
import {
  breaksTotalSec,
  currentMonthKey,
  formatDurationLabel,
  formatHM,
  formatTimeShort,
  monthKey,
  secToDuration,
  sessionElapsedSec,
  timeToSec,
  todayStr,
} from '../../lib/utils';
import { CalendarDays, CheckCircle2, Clock, Coffee, BookOpen } from 'lucide-react';
import type { Break, Session, Student } from '../../lib/types';

interface Props {
  student: Student;
  onDone: () => void;
}

type TimelineEntry =
  | { kind: 'session'; idx: number; session: Session; duration: number }
  | { kind: 'break'; idx: number; brk: Break; duration: number };

export function KioskSummary({ student, onDone }: Props) {
  const { sessions, breaks } = useApp();
  const [countdown, setCountdown] = useState(5);
  const doneRef = useRef(false);

  const today = todayStr();
  const month = currentMonthKey();

  const todaySessions = useMemo(
    () =>
      sessions
        .filter((s) => s.student_id === student.id && s.date === today)
        .slice()
        .sort((a, b) => a.start_time.localeCompare(b.start_time)),
    [sessions, student.id, today]
  );

  const todayBreaks = useMemo(
    () =>
      breaks
        .filter((b) => b.student_id === student.id && b.date === today)
        .slice()
        .sort((a, b) => a.start_time.localeCompare(b.start_time)),
    [breaks, student.id, today]
  );

  // build chronological timeline by interleaving sessions and breaks by start_time
  const timeline = useMemo(() => {
    const entries: TimelineEntry[] = [];
    let sessionCounter = 0;
    let breakCounter = 0;

    const allItems: {
      time: number;
      type: 'session' | 'break';
      ref: Session | Break;
    }[] = [
      ...todaySessions.map((s) => ({
        time: timeToSec(s.start_time),
        type: 'session' as const,
        ref: s as Break | Session,
      })),
      ...todayBreaks.map((b) => ({
        time: timeToSec(b.start_time),
        type: 'break' as const,
        ref: b as Break | Session,
      })),
    ].sort((a, b) => a.time - b.time);

    for (const item of allItems) {
      if (item.type === 'session') {
        const s = item.ref as Session;
        sessionCounter++;
        entries.push({
          kind: 'session',
          idx: sessionCounter,
          session: s,
          duration: sessionElapsedSec(s.start_time, s.end_time, s.status),
        });
      } else {
        const b = item.ref as Break;
        breakCounter++;
        entries.push({
          kind: 'break',
          idx: breakCounter,
          brk: b,
          duration: breaksTotalSec([b]),
        });
      }
    }

    return entries;
  }, [todaySessions, todayBreaks]);

  const todayStudySec = todaySessions.reduce(
    (acc, s) => acc + sessionElapsedSec(s.start_time, s.end_time, s.status),
    0
  );

  const todayBreaksSec = breaksTotalSec(todayBreaks);

  const monthStudySec = useMemo(
    () =>
      sessions
        .filter(
          (s) => s.student_id === student.id && monthKey(s.date) === month
        )
        .reduce(
          (acc, s) => acc + sessionElapsedSec(s.start_time, s.end_time, s.status),
          0
        ),
    [sessions, student.id, month]
  );

  useEffect(() => {
    const id = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(id);
          if (!doneRef.current) {
            doneRef.current = true;
            onDone();
          }
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [onDone]);

  const monthParts = secToDuration(monthStudySec);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-10 sm:py-16">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-100 text-brand-600 animate-scale-in">
        <CheckCircle2 size={44} />
      </div>
      <h1 className="text-center text-2xl font-bold text-ink-900">
        Gün tamamlandı!
      </h1>
      <p className="mb-6 mt-2 text-center text-sm text-ink-500">
        {student.name} {student.surname}, bugünkü çalışman:
      </p>

      {/* Chronological timeline */}
      <Card className="mb-4 w-full p-5 animate-fade-in">
        <p className="mb-3 text-sm font-semibold text-ink-800">
          Bugünkü Zaman Çizelgesi
        </p>
        {timeline.length === 0 ? (
          <p className="py-4 text-center text-sm text-ink-400">
            Bugün için kayıt yok.
          </p>
        ) : (
          <div className="space-y-2">
            {timeline.map((entry, i) => (
              <div key={i}>
                {entry.kind === 'session' ? (
                  <div className="flex items-center gap-3 rounded-lg bg-brand-50 px-3 py-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
                      <BookOpen size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink-900">
                        {entry.idx}. Oturum
                      </p>
                      <p className="truncate text-xs text-ink-500">
                        {entry.session.subject} ·{' '}
                        {formatTimeShort(entry.session.start_time)}
                        {entry.session.end_time
                          ? ` – ${formatTimeShort(entry.session.end_time)}`
                          : ''}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-brand-700">
                      {formatHM(entry.duration)}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 rounded-lg bg-accent-50 px-3 py-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-100 text-accent-700">
                      <Coffee size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink-900">
                        {entry.idx}. Mola
                      </p>
                      <p className="truncate text-xs text-ink-500">
                        {formatTimeShort(entry.brk.start_time)}
                        {entry.brk.end_time
                          ? ` – ${formatTimeShort(entry.brk.end_time)}`
                          : ''}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-accent-700">
                      {formatHM(entry.duration)}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Totals */}
      <Card className="w-full space-y-4 p-6 animate-fade-in">
        <div className="rounded-xl bg-brand-50 p-4">
          <p className="flex items-center gap-2 text-xs font-medium text-brand-700">
            <Clock size={14} />
            Bugünkü Toplam Çalışma
          </p>
          <p className="mt-1 text-2xl font-bold text-brand-800">
            {formatDurationLabel(secToDuration(todayStudySec))}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-accent-50 p-4">
            <p className="flex items-center gap-1.5 text-xs font-medium text-accent-700">
              <Coffee size={14} />
              Toplam Mola
            </p>
            <p className="mt-1 text-lg font-bold text-accent-800">
              {formatDurationLabel(secToDuration(todayBreaksSec))}
            </p>
          </div>
          <div className="rounded-xl bg-ink-50 p-4">
            <p className="text-xs font-medium text-ink-500">Oturum Sayısı</p>
            <p className="mt-1 text-lg font-bold text-ink-900">
              {todaySessions.length}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-brand-100 bg-white p-4">
          <p className="flex items-center gap-2 text-xs font-medium text-ink-500">
            <CalendarDays size={14} />
            Bu Ayki Toplam Çalışma
          </p>
          <p className="mt-1 text-xl font-bold text-ink-900">
            {formatDurationLabel(monthParts)}
          </p>
          <p className="mt-1 text-xs text-ink-400">
            {monthParts.gun} gün · {monthParts.saat} saat ·{' '}
            {monthParts.dakika} dakika
          </p>
        </div>

        <p className="text-center text-xs text-ink-400">
          {countdown} saniye sonra ana ekrana yönlendirileceksin...
        </p>
      </Card>
    </div>
  );
}
