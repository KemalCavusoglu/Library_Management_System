import type { Break, Room, Session, Student } from '../lib/types';
import { uid, todayStr, nowTimeStr } from '../lib/utils';

/**
 * Mock Supabase-like service.
 * All functions return Promises and persist to localStorage so the app
 * behaves like an async backend. Signatures mirror Supabase query patterns
 * so this can be swapped for the real client later.
 */

const KEYS = {
  students: 'kut_students',
  rooms: 'kut_rooms',
  sessions: 'kut_sessions',
  breaks: 'kut_breaks',
  seeded: 'kut_seeded_v1',
};

function read<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function write<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

const delay = <T>(value: T, ms = 120): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

/* ------------------------------------------------------------------ */
/* Seeding                                                             */
/* ------------------------------------------------------------------ */

function seedIfNeeded(): void {
  if (localStorage.getItem(KEYS.seeded)) return;

  const students: Student[] = [
    { id: uid(), name: 'Ahmet', surname: 'Yılmaz', student_number: '1001', grade_class: '11-A', parent_phone: '0532 111 2233', student_phone: '0533 111 2244' },
    { id: uid(), name: 'Elif', surname: 'Kaya', student_number: '1002', grade_class: '11-B', parent_phone: '0532 222 3344', student_phone: '0533 222 3355' },
    { id: uid(), name: 'Mehmet', surname: 'Demir', student_number: '1003', grade_class: '12-A', parent_phone: '0532 333 4455', student_phone: '0533 333 4466' },
    { id: uid(), name: 'Zeynep', surname: 'Şahin', student_number: '1004', grade_class: '10-C', parent_phone: '0532 444 5566', student_phone: '0533 444 5577' },
    { id: uid(), name: 'Can', surname: 'Çelik', student_number: '1005', grade_class: '9-A', parent_phone: '0532 555 6677', student_phone: '0533 555 6688' },
    { id: uid(), name: 'Ayşe', surname: 'Yıldız', student_number: '1006', grade_class: '12-B', parent_phone: '0532 666 7788', student_phone: '0533 666 7799' },
    { id: uid(), name: 'Emir', surname: 'Arslan', student_number: '1007', grade_class: '11-C', parent_phone: '0532 777 8899', student_phone: '0533 777 8800' },
    { id: uid(), name: 'Defne', surname: 'Koç', student_number: '1008', grade_class: '10-A', parent_phone: '0532 888 9900', student_phone: '0533 888 9911' },
  ];

  const rooms: Room[] = [
    { id: uid(), name: 'Sessiz Salon', capacity: 30 },
    { id: uid(), name: 'Grup Çalışma Salonu', capacity: 20 },
    { id: uid(), name: 'Sınav Hazırlık Salonu', capacity: 15 },
  ];

  // generate some past sessions over the last ~20 days for analytics
  const sessions: Session[] = [];
  const breaks: Break[] = [];
  const subjects = ['Matematik', 'Fizik', 'Türkçe', 'Kimya', 'Edebiyat', 'Tarih', 'Biyoloji', 'İngilizce'];
  const studyTypes = ['Konu Çalışması', 'Soru Çözümü', 'Konu Video İzleme'];

  for (let dayOffset = 20; dayOffset >= 0; dayOffset--) {
    const d = new Date();
    d.setDate(d.getDate() - dayOffset);
    const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate()
    ).padStart(2, '0')}`;

    const count = 3 + Math.floor(Math.random() * 6);
    for (let i = 0; i < count; i++) {
      const st = students[Math.floor(Math.random() * students.length)];
      const room = rooms[Math.floor(Math.random() * rooms.length)];
      const startH = 8 + Math.floor(Math.random() * 10);
      const startM = Math.floor(Math.random() * 12) * 5;
      const start = `${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}:00`;
      const durMin = 40 + Math.floor(Math.random() * 120);
      const endH = startH + Math.floor((startM + durMin) / 60);
      const endM = (startM + durMin) % 60;
      const end = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}:00`;
      const sId = uid();
      sessions.push({
        id: sId,
        student_id: st.id,
        room_id: room.id,
        subject: subjects[Math.floor(Math.random() * subjects.length)],
        study_type: studyTypes[Math.floor(Math.random() * studyTypes.length)],
        start_time: start,
        end_time: dayOffset === 0 && Math.random() > 0.6 ? null : end,
        status: dayOffset === 0 && Math.random() > 0.6 ? 'active' : 'completed',
        date: dStr,
      });
      if (Math.random() > 0.55) {
        breaks.push({
          id: uid(),
          student_id: st.id,
          date: dStr,
          start_time: `${String(startH + Math.floor(durMin / 2 / 60)).padStart(2, '0')}:${String(
            (startM + Math.floor(durMin / 2)) % 60
          ).padStart(2, '0')}:00`,
          end_time: `${String(startH + Math.floor((durMin / 2 + 10) / 60)).padStart(2, '0')}:${String(
            (startM + Math.floor(durMin / 2) + 10) % 60
          ).padStart(2, '0')}:00`,
        });
      }
    }
  }

  write(KEYS.students, students);
  write(KEYS.rooms, rooms);
  write(KEYS.sessions, sessions);
  write(KEYS.breaks, breaks);
  localStorage.setItem(KEYS.seeded, '1');
}

seedIfNeeded();

/* ------------------------------------------------------------------ */
/* Students                                                            */
/* ------------------------------------------------------------------ */

export const getStudents = (): Promise<Student[]> =>
  delay(read<Student>(KEYS.students));

export const addStudent = async (
  data: Omit<Student, 'id'>
): Promise<Student> => {
  const list = read<Student>(KEYS.students);
  if (list.some((s) => s.student_number === data.student_number)) {
    throw new Error('Bu öğrenci numarası zaten kayıtlı.');
  }
  const student: Student = { ...data, id: uid() };
  list.push(student);
  write(KEYS.students, list);
  return delay(student, 0);
};

export const updateStudent = async (
  id: string,
  data: Partial<Omit<Student, 'id'>>
): Promise<Student> => {
  const list = read<Student>(KEYS.students);
  const idx = list.findIndex((s) => s.id === id);
  if (idx === -1) throw new Error('Öğrenci bulunamadı.');
  if (
    data.student_number &&
    list.some((s) => s.student_number === data.student_number && s.id !== id)
  ) {
    throw new Error('Bu öğrenci numarası zaten kayıtlı.');
  }
  list[idx] = { ...list[idx], ...data };
  write(KEYS.students, list);
  return delay(list[idx], 0);
};

export const deleteStudent = async (id: string): Promise<void> => {
  const list = read<Student>(KEYS.students).filter((s) => s.id !== id);
  write(KEYS.students, list);
  const sessions = read<Session>(KEYS.sessions);
  const removedSessionIds = sessions
    .filter((s) => s.student_id === id)
    .map((s) => s.id);
  write(
    KEYS.sessions,
    sessions.filter((s) => s.student_id !== id)
  );
  write(
    KEYS.breaks,
    read<Break>(KEYS.breaks).filter((b) => b.student_id !== id)
  );
  return delay(undefined, 0);
};

/* ------------------------------------------------------------------ */
/* Rooms                                                               */
/* ------------------------------------------------------------------ */

export const getRooms = (): Promise<Room[]> => delay(read<Room>(KEYS.rooms));

export const addRoom = async (data: Omit<Room, 'id'>): Promise<Room> => {
  const list = read<Room>(KEYS.rooms);
  const room: Room = { ...data, id: uid() };
  list.push(room);
  write(KEYS.rooms, list);
  return delay(room, 0);
};

export const updateRoom = async (
  id: string,
  data: Partial<Omit<Room, 'id'>>
): Promise<Room> => {
  const list = read<Room>(KEYS.rooms);
  const idx = list.findIndex((r) => r.id === id);
  if (idx === -1) throw new Error('Salon bulunamadı.');
  list[idx] = { ...list[idx], ...data };
  write(KEYS.rooms, list);
  return delay(list[idx], 0);
};

export const deleteRoom = async (id: string): Promise<void> => {
  write(
    KEYS.rooms,
    read<Room>(KEYS.rooms).filter((r) => r.id !== id)
  );
  return delay(undefined, 0);
};

/* ------------------------------------------------------------------ */
/* Sessions                                                            */
/* ------------------------------------------------------------------ */

export const getSessions = (): Promise<Session[]> =>
  delay(read<Session>(KEYS.sessions));

export const getSessionsByStudent = async (
  studentId: string
): Promise<Session[]> =>
  delay(read<Session>(KEYS.sessions).filter((s) => s.student_id === studentId));

export const getSessionsByDate = async (date: string): Promise<Session[]> =>
  delay(read<Session>(KEYS.sessions).filter((s) => s.date === date));

export const getActiveSessions = async (): Promise<Session[]> =>
  delay(
    read<Session>(KEYS.sessions).filter(
      (s) => s.status === 'active' || s.status === 'paused'
    )
  );

export const getActiveSessionForStudent = async (
  studentId: string
): Promise<Session | null> => {
  const found = read<Session>(KEYS.sessions).find(
    (s) =>
      s.student_id === studentId &&
      (s.status === 'active' || s.status === 'paused')
  );
  return delay(found || null, 0);
};

export const createSession = async (
  data: Omit<Session, 'id' | 'end_time' | 'status'> & {
    status?: Session['status'];
    end_time?: string | null;
  }
): Promise<Session> => {
  const list = read<Session>(KEYS.sessions);
  const session: Session = {
    id: uid(),
    end_time: null,
    status: 'active',
    ...data,
  };
  list.push(session);
  write(KEYS.sessions, list);
  return delay(session, 0);
};

export const updateSession = async (
  id: string,
  data: Partial<Session>
): Promise<Session> => {
  const list = read<Session>(KEYS.sessions);
  const idx = list.findIndex((s) => s.id === id);
  if (idx === -1) throw new Error('Oturum bulunamadı.');
  list[idx] = { ...list[idx], ...data };
  write(KEYS.sessions, list);
  return delay(list[idx], 0);
};

/* ------------------------------------------------------------------ */
/* Breaks                                                              */
/* ------------------------------------------------------------------ */

export const getBreaks = (): Promise<Break[]> =>
  delay(read<Break>(KEYS.breaks));

export const getBreaksForStudent = async (
  studentId: string
): Promise<Break[]> =>
  delay(read<Break>(KEYS.breaks).filter((b) => b.student_id === studentId));

export const getBreaksForStudentOnDate = async (
  studentId: string,
  date: string
): Promise<Break[]> =>
  delay(
    read<Break>(KEYS.breaks).filter(
      (b) => b.student_id === studentId && b.date === date
    )
  );

export const getActiveBreakForStudent = async (
  studentId: string
): Promise<Break | null> => {
  const found = read<Break>(KEYS.breaks).find(
    (b) => b.student_id === studentId && !b.end_time
  );
  return delay(found || null, 0);
};

export const createBreak = async (
  data: Omit<Break, 'id' | 'end_time'> & { end_time?: string | null }
): Promise<Break> => {
  const list = read<Break>(KEYS.breaks);
  const br: Break = { id: uid(), end_time: null, ...data };
  list.push(br);
  write(KEYS.breaks, list);
  return delay(br, 0);
};

export const updateBreak = async (
  id: string,
  data: Partial<Break>
): Promise<Break> => {
  const list = read<Break>(KEYS.breaks);
  const idx = list.findIndex((b) => b.id === id);
  if (idx === -1) throw new Error('Mola bulunamadı.');
  list[idx] = { ...list[idx], ...data };
  write(KEYS.breaks, list);
  return delay(list[idx], 0);
};

/* ------------------------------------------------------------------ */
/* Lazy-cron auto close                                                */
/* ------------------------------------------------------------------ */

export const autoCloseStaleSessions = async (): Promise<number> => {
  const list = read<Session>(KEYS.sessions);
  let changed = 0;
  const today = todayStr();
  const updated = list.map((s) => {
    if ((s.status === 'active' || s.status === 'paused') && s.date < today) {
      changed++;
      return { ...s, status: 'completed' as const, end_time: '22:00:00' };
    }
    return s;
  });
  if (changed > 0) write(KEYS.sessions, updated);
  return delay(changed, 0);
};

export const getNowTimeStr = nowTimeStr;
