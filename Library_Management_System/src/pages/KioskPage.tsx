import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { KioskHeader } from '../components/KioskHeader';
import { KioskLogin } from '../components/kiosk/KioskLogin';
import { KioskStartSession } from '../components/kiosk/KioskStartSession';
import { KioskActiveSession } from '../components/kiosk/KioskActiveSession';
import { KioskSummary } from '../components/kiosk/KioskSummary';
import { CheckCircle2 } from 'lucide-react';
import { todayStr } from '../lib/utils';
import type { Session, Student } from '../lib/types';

type Phase = 'login' | 'start' | 'active' | 'success' | 'summary';

interface SuccessInfo {
  title: string;
  subtitle: string;
}

export function KioskPage() {
  const { students, sessions, breaks, createSession, endBreak, refresh } = useApp();
  const [phase, setPhase] = useState<Phase>('login');
  const [studentId, setStudentId] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [successInfo, setSuccessInfo] = useState<SuccessInfo | null>(null);

  const student: Student | undefined = students.find(
    (s) => s.id === studentId
  );

  // when a student logs in, check for existing active session or open break today
  useEffect(() => {
    if (!studentId) return;
    const today = todayStr();
    const existingSession = sessions.find(
      (s) =>
        s.student_id === studentId &&
        s.date === today &&
        s.status === 'active'
    );
    const openBreak = breaks.find(
      (b) => b.student_id === studentId && b.date === today && !b.end_time
    );
    if (existingSession) {
      setActiveSession(existingSession);
      setPhase('active');
    } else if (openBreak) {
      setActiveSession(null);
      setPhase('start');
    } else {
      setActiveSession(null);
      setPhase('start');
    }
  }, [studentId, sessions, breaks]);

  const handleLogin = (id: string) => {
    setStudentId(id);
  };

  const handleStart = async (data: {
    room_id: string;
    subject: string;
    study_type: string;
  }) => {
    if (!studentId) return;
    const today = todayStr();

    // if returning from break, close the open break first
    const openBreak = breaks.find(
      (b) => b.student_id === studentId && b.date === today && !b.end_time
    );
    if (openBreak) {
      await endBreak(openBreak.id);
    }

    await createSession({
      student_id: studentId,
      room_id: data.room_id,
      subject: data.subject,
      study_type: data.study_type,
      start_time: new Date().toTimeString().slice(0, 8),
      date: today,
    });

    // shared kiosk: show success, then back to login
    setSuccessInfo({
      title: 'Oturum Başlatıldı!',
      subtitle: `${student?.name ?? ''} çalışmaya başladı.`,
    });
    setPhase('success');
  };

  // success → login after 2 seconds
  useEffect(() => {
    if (phase !== 'success') return;
    const id = setTimeout(() => {
      setStudentId(null);
      setActiveSession(null);
      setSuccessInfo(null);
      setPhase('login');
      void refresh();
    }, 2000);
    return () => clearTimeout(id);
  }, [phase, refresh]);

  const handleEnded = () => {
    setPhase('summary');
  };

  const handleBreak = () => {
    setSuccessInfo({
      title: 'Mola Başlatıldı!',
      subtitle: `${student?.name ?? ''} molaya çıktı.`,
    });
    setPhase('success');
  };

  const handleSummaryDone = () => {
    setStudentId(null);
    setActiveSession(null);
    setPhase('login');
    void refresh();
  };

  // keep activeSession ref fresh while ticking
  useEffect(() => {
    if (activeSession && phase === 'active') {
      const updated = sessions.find((s) => s.id === activeSession.id);
      if (updated && updated !== activeSession) setActiveSession(updated);
      if (!updated || updated.status !== 'active') {
        setActiveSession(null);
      }
    }
  }, [sessions, activeSession, phase]);

  return (
    <div className="min-h-screen bg-ink-50">
      <KioskHeader />
      <main>
        {phase === 'login' && <KioskLogin onLogin={handleLogin} />}
        {phase === 'start' && student && (
          <KioskStartSession student={student} onStart={handleStart} />
        )}
        {phase === 'active' && student && activeSession && (
          <KioskActiveSession
            student={student}
            session={activeSession}
            onEnded={handleEnded}
            onBreak={handleBreak}
          />
        )}
        {phase === 'success' && successInfo && (
          <div className="mx-auto flex max-w-md flex-col items-center px-4 py-20">
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-2xl bg-brand-100 text-brand-600 animate-scale-in">
              <CheckCircle2 size={52} />
            </div>
            <h1 className="text-center text-2xl font-bold text-ink-900">
              {successInfo.title}
            </h1>
            <p className="mt-2 text-center text-sm text-ink-500">
              {successInfo.subtitle}
            </p>
            <p className="mt-6 text-xs text-ink-400">
              Sonraki öğrenci için yönlendiriliyorsunuz...
            </p>
          </div>
        )}
        {phase === 'summary' && student && (
          <KioskSummary student={student} onDone={handleSummaryDone} />
        )}
      </main>
    </div>
  );
}
