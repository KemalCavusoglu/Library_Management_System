import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { Break, Room, Session, Student } from '../lib/types';
import { todayStr } from '../lib/utils';
import * as svc from '../services/supabaseService';

interface AppContextValue {
  loading: boolean;
  students: Student[];
  rooms: Room[];
  sessions: Session[];
  breaks: Break[];
  refresh: () => Promise<void>;

  addStudent: (data: Omit<Student, 'id'>) => Promise<void>;
  updateStudent: (id: string, data: Partial<Omit<Student, 'id'>>) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;

  addRoom: (data: Omit<Room, 'id'>) => Promise<void>;
  updateRoom: (id: string, data: Partial<Omit<Room, 'id'>>) => Promise<void>;
  deleteRoom: (id: string) => Promise<void>;

  createSession: (
    data: Omit<Session, 'id' | 'end_time' | 'status'> & {
      status?: Session['status'];
      end_time?: string | null;
    }
  ) => Promise<Session>;
  updateSession: (id: string, data: Partial<Session>) => Promise<void>;
  forceEndSession: (id: string) => Promise<void>;

  startBreak: (studentId: string, sessionId: string) => Promise<void>;
  endBreak: (breakId: string) => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [breaks, setBreaks] = useState<Break[]>([]);

  const refresh = useCallback(async () => {
    const [st, rm, se, br] = await Promise.all([
      svc.getStudents(),
      svc.getRooms(),
      svc.getSessions(),
      svc.getBreaks(),
    ]);
    setStudents(st);
    setRooms(rm);
    setSessions(se);
    setBreaks(br);
  }, []);

  useEffect(() => {
    (async () => {
      await svc.autoCloseStaleSessions();
      await refresh();
      setLoading(false);
    })();
  }, [refresh]);

  const wrap = async (fn: () => Promise<unknown>) => {
    await fn();
    await refresh();
  };

  const value: AppContextValue = {
    loading,
    students,
    rooms,
    sessions,
    breaks,
    refresh,

    addStudent: (data) => wrap(() => svc.addStudent(data)),
    updateStudent: (id, data) => wrap(() => svc.updateStudent(id, data)),
    deleteStudent: (id) => wrap(() => svc.deleteStudent(id)),

    addRoom: (data) => wrap(() => svc.addRoom(data)),
    updateRoom: (id, data) => wrap(() => svc.updateRoom(id, data)),
    deleteRoom: (id) => wrap(() => svc.deleteRoom(id)),

    createSession: async (data) => {
      const s = await svc.createSession(data);
      await refresh();
      return s;
    },
    updateSession: (id, data) => wrap(() => svc.updateSession(id, data)),
    forceEndSession: (id) =>
      wrap(() => svc.updateSession(id, { status: 'completed', end_time: svc.getNowTimeStr() })),

    startBreak: async (studentId, sessionId) => {
      const now = svc.getNowTimeStr();
      await svc.updateSession(sessionId, { status: 'completed', end_time: now });
      await svc.createBreak({ student_id: studentId, date: todayStr(), start_time: now });
      await refresh();
    },
    endBreak: async (breakId) => {
      await svc.updateBreak(breakId, { end_time: svc.getNowTimeStr() });
      await refresh();
    },
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
