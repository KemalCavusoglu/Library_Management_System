export const SUBJECTS = [
  'Matematik',
  'Geometri',
  'Fizik',
  'Kimya',
  'Biyoloji',
  'Türkçe',
  'Edebiyat',
  'Tarih',
  'Coğrafya',
  'Felsefe',
  'İngilizce',
  'Fen Bilimleri',
  'İnkılap Tarihi',
  'Din Kültürü',
] as const;

export type Subject = (typeof SUBJECTS)[number];

export const STUDY_TYPES = [
  'Konu Çalışması',
  'Konu Video İzleme',
  'Soru Çözümü',
] as const;

export type StudyType = (typeof STUDY_TYPES)[number];

export const GRADE_CLASSES = [
  '5-A',
  '5-B',
  '5-C',
  '6-A',
  '6-B',
  '6-C',
  '7-A',
  '7-B',
  '7-C',
  '8-A',
  '8-B',
  '8-C',
  '9-A',
  '9-B',
  '9-C',
  '10-A',
  '10-B',
  '10-C',
  '11-A',
  '11-B',
  '11-C',
  '12-A',
  '12-B',
  '12-C',
] as const;

export const ADMIN_PIN = '1234';

export const AUTO_CLOSE_HOUR = '22:00:00';
