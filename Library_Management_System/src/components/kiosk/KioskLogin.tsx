import { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { SearchableDropdown } from '../../components/ui/SearchableDropdown';
import { GraduationCap, LogIn, KeyRound } from 'lucide-react';

interface Props {
  onLogin: (studentId: string) => void;
}

export function KioskLogin({ onLogin }: Props) {
  const { students } = useApp();
  const [number, setNumber] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [error, setError] = useState('');

  const nameOptions = useMemo(
    () =>
      students
        .slice()
        .sort((a, b) => a.surname.localeCompare(b.surname))
        .map((s) => ({
          value: s.id,
          label: `${s.name} ${s.surname} — ${s.student_number}`,
        })),
    [students]
  );

  const submit = () => {
    setError('');
    let studentId = selectedId;
    if (!studentId && number.trim()) {
      const found = students.find(
        (s) => s.student_number === number.trim()
      );
      if (found) studentId = found.id;
    }
    if (!studentId) {
      setError('Öğrenci bulunamadı. Numarayı kontrol edin veya ad-soyad seçin.');
      return;
    }
    onLogin(studentId);
  };

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-10 sm:py-16">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 shadow-sm">
        <GraduationCap size={40} />
      </div>
      <h1 className="text-center text-2xl font-bold text-ink-900">
        Hoş geldin!
      </h1>
      <p className="mb-8 mt-2 text-center text-sm text-ink-500">
        Oturum başlatmak için öğrenci numaranı gir veya ad-soyadınla giriş yap.
      </p>

      <div className="card w-full space-y-5 p-6 animate-fade-in">
        <Input
          label="Öğrenci Numarası"
          placeholder="Örn. 1001"
          value={number}
          onChange={(e) => {
            setNumber(e.target.value);
            setSelectedId('');
            setError('');
          }}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          error={error || undefined}
        />

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-ink-100" />
          <span className="text-xs font-medium text-ink-400">VEYA</span>
          <div className="h-px flex-1 bg-ink-100" />
        </div>

        <SearchableDropdown
          label="Ad Soyad"
          options={nameOptions}
          value={selectedId}
          onChange={(v) => {
            setSelectedId(v);
            setNumber('');
            setError('');
          }}
          placeholder="Ad soyad ara..."
        />

        <Button size="lg" className="w-full" onClick={submit}>
          <LogIn size={20} />
          Giriş Yap
        </Button>

        <p className="flex items-center justify-center gap-1.5 text-center text-xs text-ink-400">
          <KeyRound size={14} />
          Numaranı hatırlamıyor musun? Ad soyad ile giriş yapabilirsin.
        </p>
      </div>
    </div>
  );
}
