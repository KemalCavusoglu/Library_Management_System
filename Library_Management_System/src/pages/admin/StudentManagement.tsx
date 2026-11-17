import { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { GRADE_CLASSES } from '../../lib/constants';
import { Pencil, Plus, Search, Trash2, Users } from 'lucide-react';
import type { Student } from '../../lib/types';

interface FormState {
  name: string;
  surname: string;
  student_number: string;
  grade_class: string;
  parent_phone: string;
  student_phone: string;
}

const empty: FormState = {
  name: '',
  surname: '',
  student_number: '',
  grade_class: GRADE_CLASSES[0] as string,
  parent_phone: '',
  student_phone: '',
};

export function StudentManagement() {
  const { students, sessions, addStudent, updateStudent, deleteStudent } =
    useApp();
  const [query, setQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [form, setForm] = useState<FormState>(empty);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) =>
      `${s.name} ${s.surname} ${s.student_number} ${s.grade_class}`
        .toLowerCase()
        .includes(q)
    );
  }, [students, query]);

  const openAdd = () => {
    setEditing(null);
    setForm(empty);
    setError('');
    setModalOpen(true);
  };

  const openEdit = (s: Student) => {
    setEditing(s);
    setForm({
      name: s.name,
      surname: s.surname,
      student_number: s.student_number,
      grade_class: s.grade_class,
      parent_phone: s.parent_phone,
      student_phone: s.student_phone,
    });
    setError('');
    setModalOpen(true);
  };

  const submit = async () => {
    setError('');
    if (!form.name.trim() || !form.surname.trim())
      return setError('Ad ve soyad zorunludur.');
    if (!form.student_number.trim())
      return setError('Öğrenci numarası zorunludur.');
    try {
      if (editing) {
        await updateStudent(editing.id, form);
      } else {
        await addStudent(form);
      }
      setModalOpen(false);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const confirmDelete = async () => {
    if (deleteTarget) await deleteStudent(deleteTarget.id);
    setDeleteTarget(null);
  };

  const sessionCount = (studentId: string) =>
    sessions.filter((s) => s.student_id === studentId).length;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-ink-900">
            <Users size={22} className="text-brand-600" />
            Öğrenci Yönetimi
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Toplam {students.length} öğrenci
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus size={18} />
          Yeni Öğrenci
        </Button>
      </div>

      <div className="mb-4 relative max-w-sm">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="İsim, numara veya sınıf ara..."
          className="input pl-9"
        />
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-ink-50 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">
              <tr>
                <th className="px-4 py-3">Ad Soyad</th>
                <th className="px-4 py-3">Numara</th>
                <th className="px-4 py-3">Sınıf</th>
                <th className="px-4 py-3">Veli Tel</th>
                <th className="px-4 py-3">Öğrenci Tel</th>
                <th className="px-4 py-3">Oturum</th>
                <th className="px-4 py-3 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-ink-50/50">
                  <td className="px-4 py-3 font-medium text-ink-900">
                    {s.name} {s.surname}
                  </td>
                  <td className="px-4 py-3 text-ink-600">{s.student_number}</td>
                  <td className="px-4 py-3">
                    <Badge tone="neutral">{s.grade_class}</Badge>
                  </td>
                  <td className="px-4 py-3 text-ink-600">{s.parent_phone || '—'}</td>
                  <td className="px-4 py-3 text-ink-600">{s.student_phone || '—'}</td>
                  <td className="px-4 py-3 text-ink-600">
                    {sessionCount(s.id)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEdit(s)}
                        className="rounded-lg p-2 text-ink-500 hover:bg-ink-100 hover:text-ink-900"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(s)}
                        className="rounded-lg p-2 text-red-500 hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-ink-400">
                    Öğrenci bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add/Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Öğrenci Düzenle' : 'Yeni Öğrenci Ekle'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              İptal
            </Button>
            <Button onClick={submit}>
              {editing ? 'Güncelle' : 'Ekle'}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Ad"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Input
            label="Soyad"
            value={form.surname}
            onChange={(e) => setForm({ ...form, surname: e.target.value })}
          />
          <Input
            label="Öğrenci Numarası"
            value={form.student_number}
            onChange={(e) =>
              setForm({ ...form, student_number: e.target.value })
            }
          />
          <Select
            label="Sınıf"
            value={form.grade_class}
            onChange={(e) => setForm({ ...form, grade_class: e.target.value })}
            options={GRADE_CLASSES.map((g) => ({ value: g, label: g }))}
          />
          <Input
            label="Veli Telefon"
            value={form.parent_phone}
            onChange={(e) =>
              setForm({ ...form, parent_phone: e.target.value })
            }
            placeholder="05XX XXX XX XX"
          />
          <Input
            label="Öğrenci Telefon"
            value={form.student_phone}
            onChange={(e) =>
              setForm({ ...form, student_phone: e.target.value })
            }
            placeholder="05XX XXX XX XX"
          />
        </div>
        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
            {error}
          </p>
        )}
      </Modal>

      {/* Delete confirm */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Öğrenciyi Sil"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
              İptal
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              Sil
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-600">
          <strong>{deleteTarget?.name} {deleteTarget?.surname}</strong>{' '}
          adlı öğrenciyi ve tüm oturum kayıtlarını silmek istediğinize emin
          misiniz? Bu işlem geri alınamaz.
        </p>
      </Modal>
    </div>
  );
}
