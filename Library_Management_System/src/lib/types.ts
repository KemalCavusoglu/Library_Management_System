export type SessionStatus = 'active' | 'paused' | 'completed';

export interface Student {
  id: string;
  name: string;
  surname: string;
  student_number: string;
  grade_class: string;
  parent_phone: string;
  student_phone: string;
}

export interface Room {
  id: string;
  name: string;
  capacity: number;
}

export interface Session {
  id: string;
  student_id: string;
  room_id: string;
  subject: string;
  study_type: string;
  start_time: string; // HH:mm:ss
  end_time: string | null; // HH:mm:ss
  status: SessionStatus;
  date: string; // YYYY-MM-DD
}

export interface Break {
  id: string;
  student_id: string;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:mm:ss
  end_time: string | null; // HH:mm:ss
}
