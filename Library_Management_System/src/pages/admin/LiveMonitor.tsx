import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
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
import { Activity, BookOpen, Coffee, DoorOpen, Flag, Timer, Users } from 'lucide-react';

export function LiveMonitor() {
  const { students, rooms, sessions, breaks, forceEndSession } = useApp();
  const [, setTick] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const today = todayStr();

  const liveSessions = useMemo(
    () =>
      sessions.filter(
        (s) =>
          s.date === today && (s.status === 'active' || s.status === 'paused')
      ),
    [sessions, today]
  );

  const studentById = (id: string): Student | undefined =>
    students.find((s) => s.id === id);
  const roomName = (id: string): string =>
    rooms.find((r) => r.id === id)?.name || '—';

  const selected = liveSessions.find((s) => s.id === selectedId) || null;
  const selectedStudent = selected ? studentById(selected.student_id) : null;

  const selectedTodaySessions = useMemo(() => {
    if (!selected) return [];
    return sessions.filter(
      (s) => s.student_id === selected.student_id && s.date === today
    );
  }, [selected, sessions, today]);

  const selectedStudySec = selectedTodaySessions.reduce(
    (acc, s) =>
      acc + sessionElapsedSec(s.start_time, s.end_time, s.status),
    0
  );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-ink-900">
            <Activity size={22} className="text-brand-600" />
            Canlı Takip
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Kütüphanede şu anda bulunan öğrenciler
          </p>
        </div>
        <Badge tone="brand">
          <Users size={14} />
          {liveSessions.length} aktif
        </Badge>
      </div>

      {liveSessions.length === 0 ? (
        <Card className="p-12 text-center">
          <Activity size={40} className="mx-auto mb-3 text-ink-300" />
          <p className="text-sm text-ink-500">
            Şu anda kütüphanede aktif öğrenci yok.
          </p>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {liveSessions.map((s) => {
            const st = studentById(s.student_id);
            if (!st) return null;
            const sBreaks = breaks.filter(
              (b) => b.student_id === s.student_id && b.date === today
            );
            const elapsed =
              sessionElapsedSec(s.start_time, s.end_time, s.status);
            return (
              <Card
                key={s.id}
                className="p-4 transition hover:shadow-soft"
                onClick={() => setSelectedId(s.id)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-ink-900">
                      {st.name} {st.surname}
                    </p>
                    <p className="text-xs text-ink-500">
                      {st.grade_class} · {st.student_number}
                    </p>
                  </div>
                  <Badge
                    tone={s.status === 'active' ? 'success' : 'warning'}
                  >
                    {s.status === 'active' ? 'Çalışıyor' : 'Molada'}
                  </Badge>
                </div>
                <div className="mt-3 space-y-1.5 text-sm text-ink-600">
                  <p className="flex items-center gap-2">
                    <BookOpen size={14} className="text-ink-400" />
                    {s.subject} · {s.study_type}
                  </p>
                  <p className="flex items-center gap-2">
                    <DoorOpen size={14} className="text-ink-400" />
                    {roomName(s.room_id)}
                  </p>
                </div>
                <p className="mt-3 font-mono text-lg font-bold text-brand-700">
                  {formatClock(Math.max(0, elapsed))}
                </p>
              </Card>
            );
          })}
        </div>
      )}

      {/* Detail modal */}
      <Modal
        open={!!selected}
        onClose={() => setSelectedId(null)}
        title={selectedStudent ? `${selectedStudent.name} ${selectedStudent.surname}` : 'Öğrenci'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setSelectedId(null)}>
              Kapat
            </Button>
            <Button
              variant="danger"
              onClick={async () => {
                if (selected) await forceEndSession(selected.id);
                setSelectedId(null);
              }}
            >
              <Flag size={16} />
              Oturumu Sonlandır
            </Button>
          </>
        }
      >
        {selected && selectedStudent && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-ink-50 p-3">
                <p className="text-xs text-ink-500">Sınıf</p>
                <p className="font-medium text-ink-900">
                  {selectedStudent.grade_class}
                </p>
              </div>
              <div className="rounded-xl bg-ink-50 p-3">
                <p className="text-xs text-ink-500">Numara</p>
                <p className="font-medium text-ink-900">
                  {selectedStudent.student_number}
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-brand-50 p-4">
              <p className="flex items-center gap-2 text-xs font-medium text-brand-700">
                <Timer size={14} />
                Mevcut Oturum
              </p>
              <p className="mt-1 text-xl font-bold text-brand-800">
                {selected.subject} · {selected.study_type}
              </p>
              <p className="mt-1 text-sm text-brand-700">
                {formatTimeShort(selected.start_time)} – devam ediyor ·{' '}
                {roomName(selected.room_id)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-ink-100 p-3">
                <p className="text-xs text-ink-500">Bugünkü Çalışma</p>
                <p className="mt-0.5 text-lg font-bold text-ink-900">
                  {formatDurationLabel(secToDuration(selectedStudySec))}
                </p>
              </div>
              <div className="rounded-xl border border-ink-100 p-3">
                <p className="text-xs text-ink-500">Bugünkü Oturum</p>
                <p className="mt-0.5 text-lg font-bold text-ink-900">
                  {selectedTodaySessions.length}
                </p>
              </div>
            </div>

            <div>
              <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink-800">
                <Coffee size={16} className="text-ink-400" />
                Bugünkü Tüm Oturumlar
              </p>
              <div className="space-y-1.5">
                {selectedTodaySessions.map((s) => {
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
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
