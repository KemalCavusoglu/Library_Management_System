import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { useApp } from '../../context/AppContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Select } from '../../components/ui/Select';
import {
  breaksTotalSec,
  formatDurationLabel,
  formatHM,
  formatTimeShort,
  hourBucket,
  monthKey,
  secToDuration,
  sessionElapsedSec,
  weekdayName,
} from '../../lib/utils';
import { exportToExcel, exportToPDF } from '../../lib/exports';
import {
  Crown,
  FileSpreadsheet,
  FileText,
  LayoutDashboard,
  Medal,
  Trophy,
} from 'lucide-react';
import { SUBJECTS } from '../../lib/constants';

const PIE_COLORS = [
  '#10b981',
  '#f59e0b',
  '#3b82f6',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#f97316',
];

export function Reports() {
  const { students, rooms, sessions, breaks } = useApp();
  const [subjectFilter, setSubjectFilter] = useState('');
  const [studentFilter, setStudentFilter] = useState('');

  const studentName = (id: string) => {
    const s = students.find((x) => x.id === id);
    return s ? `${s.name} ${s.surname}` : 'Bilinmeyen';
  };
  const roomName = (id: string) =>
    rooms.find((r) => r.id === id)?.name || '—';

  /* ---------- analytics aggregates ---------- */

  const hourData = useMemo(() => {
    const buckets: Record<number, number> = {};
    for (let h = 7; h <= 22; h++) buckets[h] = 0;
    sessions.forEach((s) => {
      if (s.status !== 'completed') return;
      buckets[hourBucket(s.start_time)] = (buckets[hourBucket(s.start_time)] || 0) + 1;
    });
    return Object.entries(buckets).map(([h, count]) => ({
      hour: `${h}:00`,
      oturum: count,
    }));
  }, [sessions]);

  const weekdayData = useMemo(() => {
    const order = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
    const buckets: Record<string, number> = {};
    order.forEach((d) => (buckets[d] = 0));
    sessions.forEach((s) => {
      if (s.status !== 'completed') return;
      const wd = weekdayName(s.date);
      buckets[wd] = (buckets[wd] || 0) + 1;
    });
    return order.map((d) => ({ gun: d, oturum: buckets[d] }));
  }, [sessions]);

  const studyTypeData = useMemo(() => {
    const buckets: Record<string, number> = {};
    sessions.forEach((s) => {
      if (s.status !== 'completed') return;
      buckets[s.study_type] = (buckets[s.study_type] || 0) + 1;
    });
    return Object.entries(buckets).map(([name, value]) => ({ name, value }));
  }, [sessions]);

  const studySecByStudent = useMemo(() => {
    const map: Record<string, number> = {};
    sessions.forEach((s) => {
      if (s.status !== 'completed') return;
      map[s.student_id] =
        (map[s.student_id] || 0) +
        sessionElapsedSec(s.start_time, s.end_time, s.status);
    });
    return map;
  }, [sessions]);

  const leaderboard = useMemo(
    () =>
      Object.entries(studySecByStudent)
        .map(([id, sec]) => ({ id, sec, name: studentName(id) }))
        .sort((a, b) => b.sec - a.sec)
        .slice(0, 10),
    [studySecByStudent]
  );

  const mathLeaderboard = useMemo(() => {
    const map: Record<string, number> = {};
    sessions.forEach((s) => {
      if (s.status !== 'completed' || s.subject !== 'Matematik') return;
      map[s.student_id] =
        (map[s.student_id] || 0) +
        sessionElapsedSec(s.start_time, s.end_time, s.status);
    });
    return Object.entries(map)
      .map(([id, sec]) => ({ id, sec, name: studentName(id) }))
      .sort((a, b) => b.sec - a.sec)
      .slice(0, 10);
  }, [sessions]);

  /* ---------- filtered session log table ---------- */

  const filteredSessions = useMemo(() => {
    return sessions
      .filter((s) => {
        if (subjectFilter && s.subject !== subjectFilter) return false;
        if (studentFilter && s.student_id !== studentFilter) return false;
        return true;
      })
      .slice()
      .sort((a, b) => (a.date < b.date ? 1 : -1) || (a.start_time < b.start_time ? 1 : -1));
  }, [sessions, subjectFilter, studentFilter]);

  const tableRows = useMemo(
    () =>
      filteredSessions.map((s) => {
        const dur = sessionElapsedSec(s.start_time, s.end_time, s.status);
        const sessionBreaks = breaks.filter(
          (b) => b.student_id === s.student_id && b.date === s.date &&
            b.start_time >= s.start_time &&
            (!s.end_time || b.start_time <= s.end_time)
        );
        const brk = breaksTotalSec(sessionBreaks);
        return {
          id: s.id,
          student: studentName(s.student_id),
          room: roomName(s.room_id),
          subject: s.subject,
          study_type: s.study_type,
          date: s.date,
          start: formatTimeShort(s.start_time),
          end: s.end_time ? formatTimeShort(s.end_time) : '—',
          duration: formatHM(dur),
          break: formatHM(brk),
          status:
            s.status === 'active'
              ? 'Aktif'
              : s.status === 'paused'
                ? 'Molada'
                : 'Tamamlandı',
        } as Record<string, unknown>;
      }),
    [filteredSessions, breaks, students, rooms]
  );

  const exportColumns = [
    { header: 'Öğrenci', accessor: (r: Record<string, unknown>) => String(r.student) },
    { header: 'Salon', accessor: (r: Record<string, unknown>) => String(r.room) },
    { header: 'Ders', accessor: (r: Record<string, unknown>) => String(r.subject) },
    { header: 'Çalışma Tipi', accessor: (r: Record<string, unknown>) => String(r.study_type) },
    { header: 'Tarih', accessor: (r: Record<string, unknown>) => String(r.date) },
    { header: 'Başlangıç', accessor: (r: Record<string, unknown>) => String(r.start) },
    { header: 'Bitiş', accessor: (r: Record<string, unknown>) => String(r.end) },
    { header: 'Süre', accessor: (r: Record<string, unknown>) => String(r.duration) },
    { header: 'Mola', accessor: (r: Record<string, unknown>) => String(r.break) },
    { header: 'Durum', accessor: (r: Record<string, unknown>) => String(r.status) },
  ];

  const thisMonth = monthKey(new Date().toISOString().slice(0, 10));

  return (
    <div>
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-xl font-bold text-ink-900">
          <LayoutDashboard size={22} className="text-brand-600" />
          Raporlar & Analizler
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Oturum verileri, grafikler ve sıralamalar
        </p>
      </div>

      {/* Charts */}
      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-4 text-sm font-semibold text-ink-800">
            Saatlere Göre Yoğunluk
          </h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={hourData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eceef2" />
              <XAxis dataKey="hour" tick={{ fontSize: 11 }} stroke="#818ca1" />
              <YAxis tick={{ fontSize: 11 }} stroke="#818ca1" allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: '1px solid #eceef2',
                  fontSize: 12,
                }}
              />
              <Bar dataKey="oturum" fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 text-sm font-semibold text-ink-800">
            Günlere Göre Yoğunluk
          </h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={weekdayData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eceef2" />
              <XAxis dataKey="gun" tick={{ fontSize: 11 }} stroke="#818ca1" />
              <YAxis tick={{ fontSize: 11 }} stroke="#818ca1" allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: '1px solid #eceef2',
                  fontSize: 12,
                }}
              />
              <Bar dataKey="oturum" fill="#f59e0b" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card className="mb-6 p-5">
        <h2 className="mb-4 text-sm font-semibold text-ink-800">
          Çalışma Tipi Dağılımı
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={studyTypeData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              innerRadius={55}
              paddingAngle={3}
            >
              {studyTypeData.map((_, i) => (
                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: '1px solid #eceef2',
                fontSize: 12,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 13 }} />
          </PieChart>
        </ResponsiveContainer>
      </Card>

      {/* Leaderboards */}
      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-ink-800">
            <Trophy size={16} className="text-accent-500" />
            En Çok Çalışanlar
          </h2>
          <div className="space-y-2">
            {leaderboard.length === 0 && (
              <p className="py-6 text-center text-sm text-ink-400">
                Veri yok.
              </p>
            )}
            {leaderboard.map((row, i) => (
              <div
                key={row.id}
                className="flex items-center gap-3 rounded-xl bg-ink-50 px-3 py-2.5"
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                    i === 0
                      ? 'bg-accent-100 text-accent-700'
                      : i === 1
                        ? 'bg-ink-200 text-ink-700'
                        : i === 2
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-white text-ink-500'
                  }`}
                >
                  {i === 0 ? (
                    <Crown size={16} />
                  ) : (
                    i + 1
                  )}
                </span>
                <span className="flex-1 truncate text-sm font-medium text-ink-900">
                  {row.name}
                </span>
                <span className="text-sm font-semibold text-brand-700">
                  {formatDurationLabel(secToDuration(row.sec))}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-ink-800">
            <Medal size={16} className="text-brand-600" />
            En Çok Matematik Çalışanlar
          </h2>
          <div className="space-y-2">
            {mathLeaderboard.length === 0 && (
              <p className="py-6 text-center text-sm text-ink-400">
                Veri yok.
              </p>
            )}
            {mathLeaderboard.map((row, i) => (
              <div
                key={row.id}
                className="flex items-center gap-3 rounded-xl bg-ink-50 px-3 py-2.5"
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                    i === 0
                      ? 'bg-brand-100 text-brand-700'
                      : 'bg-white text-ink-500'
                  }`}
                >
                  {i + 1}
                </span>
                <span className="flex-1 truncate text-sm font-medium text-ink-900">
                  {row.name}
                </span>
                <span className="text-sm font-semibold text-brand-700">
                  {formatDurationLabel(secToDuration(row.sec))}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Session log table + exports */}
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 p-4">
          <h2 className="text-sm font-semibold text-ink-800">
            Oturum Kayıtları ({tableRows.length})
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              options={SUBJECTS.map((s) => ({ value: s, label: s }))}
              placeholder="Tüm Dersler"
              className="w-40"
            />
            <Select
              value={studentFilter}
              onChange={(e) => setStudentFilter(e.target.value)}
              options={students
                .slice()
                .sort((a, b) => a.surname.localeCompare(b.surname))
                .map((s) => ({
                  value: s.id,
                  label: `${s.name} ${s.surname}`,
                }))}
              placeholder="Tüm Öğrenciler"
              className="w-44"
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                exportToExcel(exportColumns, tableRows, `oturum_raporu_${thisMonth}.xlsx`)
              }
            >
              <FileSpreadsheet size={16} />
              Excel
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                exportToPDF(
                  exportColumns,
                  tableRows,
                  `oturum_raporu_${thisMonth}.pdf`,
                  'Oturum Kayıtları Raporu'
                )
              }
            >
              <FileText size={16} />
              PDF
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-ink-50 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">
              <tr>
                <th className="px-4 py-3">Öğrenci</th>
                <th className="px-4 py-3">Salon</th>
                <th className="px-4 py-3">Ders</th>
                <th className="px-4 py-3">Çalışma Tipi</th>
                <th className="px-4 py-3">Tarih</th>
                <th className="px-4 py-3">Başlangıç</th>
                <th className="px-4 py-3">Bitiş</th>
                <th className="px-4 py-3">Süre</th>
                <th className="px-4 py-3">Mola</th>
                <th className="px-4 py-3">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {tableRows.slice(0, 100).map((r) => (
                <tr key={String(r.id)} className="hover:bg-ink-50/50">
                  <td className="px-4 py-3 font-medium text-ink-900">
                    {String(r.student)}
                  </td>
                  <td className="px-4 py-3 text-ink-600">{String(r.room)}</td>
                  <td className="px-4 py-3 text-ink-600">{String(r.subject)}</td>
                  <td className="px-4 py-3 text-ink-600">{String(r.study_type)}</td>
                  <td className="px-4 py-3 text-ink-600">{String(r.date)}</td>
                  <td className="px-4 py-3 text-ink-600">{String(r.start)}</td>
                  <td className="px-4 py-3 text-ink-600">{String(r.end)}</td>
                  <td className="px-4 py-3 font-medium text-ink-900">
                    {String(r.duration)}
                  </td>
                  <td className="px-4 py-3 text-ink-600">{String(r.break)}</td>
                  <td className="px-4 py-3">
                    <Badge
                      tone={
                        r.status === 'Aktif'
                          ? 'success'
                          : r.status === 'Molada'
                            ? 'warning'
                            : 'neutral'
                      }
                    >
                      {String(r.status)}
                    </Badge>
                  </td>
                </tr>
              ))}
              {tableRows.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-ink-400">
                    Filtreye uygun kayıt bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {tableRows.length > 100 && (
          <p className="border-t border-ink-100 px-4 py-3 text-center text-xs text-ink-400">
            İlk 100 kayıt gösteriliyor. Tümünü görmek için Excel/PDF'e aktarın.
          </p>
        )}
      </Card>
    </div>
  );
}
