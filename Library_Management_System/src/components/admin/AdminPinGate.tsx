import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ADMIN_PIN } from '../../lib/constants';
import { Button } from '../../components/ui/Button';
import { Delete, Lock, ShieldCheck } from 'lucide-react';

interface Props {
  onSuccess: () => void;
}

export function AdminPinGate({ onSuccess }: Props) {
  const navigate = useNavigate();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const press = (d: string) => {
    setError(false);
    if (d === 'del') {
      setPin((p) => p.slice(0, -1));
      return;
    }
    if (pin.length >= 4) return;
    const next = pin + d;
    setPin(next);
    if (next.length === 4) {
      setTimeout(() => {
        if (next === ADMIN_PIN) {
          onSuccess();
        } else {
          setError(true);
          setPin('');
        }
      }, 100);
    }
  };

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-sm">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-xl font-bold text-ink-900">Yönetici Girişi</h1>
          <p className="mt-1 text-sm text-ink-500">
            Devam etmek için PIN kodunu girin
          </p>
        </div>

        <div className="card p-6 animate-fade-in">
          <div
            className={`mb-5 flex items-center justify-center gap-2 ${
              error ? 'animate-shake' : ''
            }`}
          >
            <Lock size={18} className="text-ink-400" />
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`h-3.5 w-3.5 rounded-full transition ${
                  error
                    ? 'bg-red-500'
                    : i < pin.length
                      ? 'bg-brand-600'
                      : 'bg-ink-200'
                }`}
              />
            ))}
          </div>

          {error && (
            <p className="mb-4 text-center text-sm font-medium text-red-600">
              Hatalı PIN. Tekrar deneyin.
            </p>
          )}

          <div className="grid grid-cols-3 gap-3">
            {keys.map((k, i) =>
              k === '' ? (
                <div key={i} />
              ) : (
                <button
                  key={i}
                  onClick={() => press(k)}
                  className="flex h-16 items-center justify-center rounded-xl bg-ink-50 text-xl font-semibold text-ink-800 transition hover:bg-ink-100 active:bg-ink-200"
                >
                  {k === 'del' ? <Delete size={22} /> : k}
                </button>
              )
            )}
          </div>

          <Button
            variant="ghost"
            className="mt-5 w-full"
            onClick={() => navigate('/')}
          >
            Öğrenci Kiosk'a Dön
          </Button>
        </div>
      </div>
    </div>
  );
}
