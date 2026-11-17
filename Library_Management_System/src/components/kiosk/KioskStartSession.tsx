import { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Select } from '../../components/ui/Select';
import { SUBJECTS, STUDY_TYPES } from '../../lib/constants';
import { todayStr } from '../../lib/utils';
import { BookOpen, DoorOpen, Play, Users } from 'lucide-react';
import type { Student } from '../../lib/types';

interface Props {
  student: Student;
  onStart: (data: {
    room_id: string;
    subject: string;
    study_type: string;
  }) => void;
}

export function KioskStartSession({ student, onStart }: Props) {
  const { rooms, sessions } = useApp();
  const [roomId, setRoomId] = useState('');
  const [subject, setSubject] = useState('');
  const [studyType, setStudyType] = useState('');
  const [error, setError] = useState('');

  const today = todayStr();

  const roomUsage = useMemo(() => {
    const map: Record<string, number> = {};
    sessions
      .filter(
        (s) =>
          s.date === today &&
          (s.status === 'active' || s.status === 'paused')
      )
      .forEach((s) => {
        map[s.room_id] = (map[s.room_id] || 0) + 1;
      });
    return map;
  }, [sessions, today]);

  const submit = () => {
    if (!roomId) return setError('Lütfen bir salon seç.');
    if (!subject) return setError('Lütfen bir ders seç.');
    if (!studyType) return setError('Lütfen bir çalışma tipi seç.');
    onStart({ room_id: roomId, subject, study_type: studyType });
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-ink-500">Merhaba,</p>
          <h1 className="text-xl font-bold text-ink-900">
            {student.name} {student.surname}
          </h1>
        </div>
        <span className="rounded-lg bg-ink-100 px-3 py-1.5 text-sm font-medium text-ink-600">
          {student.grade_class}
        </span>
      </div>

      {/* Room selection */}
      <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-ink-800">
        <DoorOpen size={18} className="text-brand-600" />
        Salon Seç
      </h2>
      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rooms.map((r) => {
          const used = roomUsage[r.id] || 0;
          const full = used >= r.capacity;
          return (
            <button
              key={r.id}
              disabled={full}
              onClick={() => {
                setRoomId(r.id);
                setError('');
              }}
              className={`card p-4 text-left transition-all ${
                full
                  ? 'opacity-60 cursor-not-allowed'
                  : roomId === r.id
                    ? 'ring-2 ring-brand-500 bg-brand-50/40'
                    : 'hover:border-brand-300 hover:shadow-soft'
              }`}
            >
              <div className="flex items-start justify-between">
                <p className="font-semibold text-ink-900">{r.name}</p>
                <span
                  className={`text-xs font-medium rounded-full px-2 py-0.5 ${
                    full
                      ? 'bg-red-100 text-red-700'
                      : 'bg-brand-100 text-brand-700'
                  }`}
                >
                  {full ? 'Dolu' : `${used}/${r.capacity}`}
                </span>
              </div>
              <p className="mt-2 flex items-center gap-1.5 text-sm text-ink-500">
                <Users size={14} />
                {full ? 'Dolu - Yer Yok' : `${r.capacity - used} boş yer`}
              </p>
            </button>
          );
        })}
      </div>

      {/* Subject + study type */}
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-ink-800">
            <BookOpen size={18} className="text-brand-600" />
            Ders Seç
          </h2>
          <Select
            value={subject}
            onChange={(e) => {
              setSubject(e.target.value);
              setError('');
            }}
            options={SUBJECTS.map((s) => ({ value: s, label: s }))}
            placeholder="Ders seçin..."
            className="w-full"
          />
        </div>

        <div>
          <h2 className="mb-3 text-base font-semibold text-ink-800">
            Çalışma Tipi
          </h2>
          <Select
            value={studyType}
            onChange={(e) => {
              setStudyType(e.target.value);
              setError('');
            }}
            options={STUDY_TYPES.map((t) => ({ value: t, label: t }))}
            placeholder="Çalışma tipi seçin..."
            className="w-full"
          />
        </div>
      </div>

      {error && (
        <Card className="mt-6 border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-700">{error}</p>
        </Card>
      )}

      <div className="mt-8">
        <Button size="xl" className="w-full" onClick={submit}>
          <Play size={22} />
          Oturumu Başlat
        </Button>
      </div>
    </div>
  );
}
