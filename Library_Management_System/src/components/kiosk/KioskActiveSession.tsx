import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import {
  breaksTotalSec,
  formatClock,
  formatDurationLabel,
  formatHM,
  formatTimeShort,
  secToDuration,
  sessionElapsedSec,
  todayStr,
} from '../../lib/utils';
import {
  BookOpen,
  Coffee,
  Flag,
  Timer,
} from 'lucide-react';
import type { Session, Student } from '../../lib/types';

interface Props {
  student: Student;
  session: Session;
  onEnded: () => void;
  onBreak: () => void;
}

export function KioskActiveSession({ student, session, onEnded, onBreak }: Props) {
  const { breaks, sessions, updateSession, startBreak } = useApp();
  const [, setTick] = useState(0);

  // live clock
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const today = todayStr();

  const todayBreaks = useMemo(
    () => breaks.filter((b) => b.student_id === student.id && b.date === today),
    [breaks, student.id, today]
  );

  const todaySessions = useMemo(
    () =>
      sessions.filter(
        (s) => s.student_id === student.id && s.date === today
      ),
    [sessions, student.id, today]
  );

  const todayStudySec = todaySessions.reduce(
    (acc, s) => acc + sessionElapsedSec(s.start_time, s.end_time, s.status),
    0
  );

  const todayBreaksSec = breaksTotalSec(todayBreaks);

  const prevSessions = todaySessions.filter((s) => s.id !== session.id);

  const currentElapsed = sessionElapsedSec(
    session.start_time,
    session.end_time,
    session.status
  );

  const handlePause = async () => {
    await startBreak(student.id, session.id);
    onBreak();
  };

  const handleEnd = async () => {
    await updateSession(session.id, {
      status: 'completed',
      end_time: new Date().toTimeString().slice(0, 8),
    });
    onEnded();
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:py-8">
      <div className="mb-6 text-center">
        <p className="text-sm text-ink-500">{student.name} {student.surname}</p>
        <Badge tone="success" className="mt-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-500 animate-pulse-soft" />
          Çalışıyor
        </Badge>
      </div>

      {/* Big timer */}
      <Card className="mb-6 bg-gradient-to-br from-brand-600 to-brand-700 text-white shadow-soft">
        <div className="flex flex-col items-center py-8">
          <p className="mb-2 flex items-center gap-2 text-sm font-medium text-brand-100">
            <Timer size={16} />
            {session.subject} · {session.study_type}
          </p>
          <p className="font-mono text-5xl font-bold tracking-tight sm:text-6xl">
            {formatClock(Math.max(0, currentElapsed))}
          </p>
          <p className="mt-3 text-sm text-brand-100">
            Başlangıç: {formatTimeShort(session.start_time)}
          </p>
        </div>
      </Card>

      {/* Today summary tiles */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        <Card className="p-4">
          <p className="text-xs font-medium text-ink-500">Bugünkü Çalışma</p>
          <p className="mt-1 text-lg font-bold text-ink-900">
            {formatDurationLabel(secToDuration(todayStudySec))}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-ink-500">Bugünkü Mola</p>
          <p className="mt-1 text-lg font-bold text-ink-900">
            {formatDurationLabel(secToDuration(todayBreaksSec))}
          </p>
        </Card>
      </div>

      {/* Previous sessions today */}
      {prevSessions.length > 0 && (
        <Card className="mb-6 p-4">
          <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-800">
            <BookOpen size={16} className="text-ink-400" />
            Bugünkü Önceki Oturumlar
          </p>
          <div className="space-y-2">
            {prevSessions.map((s) => {
              const dur =
                sessionElapsedSec(s.start_time, s.end_time, s.status);
              return (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-lg bg-ink-50 px-3 py-2 text-sm"
                >
                  <span className="text-ink-700">
                    {formatTimeShort(s.start_time)} –{' '}
                    {s.end_time ? formatTimeShort(s.end_time) : '...'} ·{' '}
                    {s.subject}
                  </span>
                  <span className="font-medium text-ink-900">
                    {formatHM(dur)}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Action buttons */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          variant="secondary"
          size="xl"
          className="flex-1"
          onClick={handlePause}
        >
          <Coffee size={22} />
          Molaya Çık
        </Button>
        <Button variant="danger" size="xl" className="flex-1" onClick={handleEnd}>
          <Flag size={22} />
          Günü Sonlandır
        </Button>
      </div>
    </div>
  );
}
