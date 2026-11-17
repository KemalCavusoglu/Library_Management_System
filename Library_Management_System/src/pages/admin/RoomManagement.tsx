import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { todayStr } from '../../lib/utils';
import { DoorOpen, Pencil, Plus, Trash2, Users } from 'lucide-react';
import type { Room } from '../../lib/types';

interface FormState {
  name: string;
  capacity: number;
}

export function RoomManagement() {
  const { rooms, sessions, breaks, addRoom, updateRoom, deleteRoom } = useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Room | null>(null);
  const [form, setForm] = useState<FormState>({ name: '', capacity: 20 });
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Room | null>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 2000);
    return () => clearInterval(id);
  }, []);

  const today = todayStr();

  const usageByRoom = useMemo(() => {
    const map: Record<string, number> = {};
    sessions
      .filter(
        (s) =>
          s.date === today && (s.status === 'active' || s.status === 'paused')
      )
      .forEach((s) => {
        map[s.room_id] = (map[s.room_id] || 0) + 1;
      });
    return map;
  }, [sessions, today]);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', capacity: 20 });
    setError('');
    setModalOpen(true);
  };

  const openEdit = (r: Room) => {
    setEditing(r);
    setForm({ name: r.name, capacity: r.capacity });
    setError('');
    setModalOpen(true);
  };

  const submit = async () => {
    setError('');
    if (!form.name.trim()) return setError('Salon adı zorunludur.');
    if (!form.capacity || form.capacity < 1)
      return setError('Kapasite en az 1 olmalıdır.');
    try {
      if (editing) {
        await updateRoom(editing.id, form);
      } else {
        await addRoom(form);
      }
      setModalOpen(false);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const confirmDelete = async () => {
    if (deleteTarget) await deleteRoom(deleteTarget.id);
    setDeleteTarget(null);
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-ink-900">
            <DoorOpen size={22} className="text-brand-600" />
            Salon Yönetimi
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Toplam {rooms.length} salon
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus size={18} />
          Yeni Salon
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rooms.map((r) => {
          const used = usageByRoom[r.id] || 0;
          const pct = Math.min(100, (used / r.capacity) * 100);
          return (
            <Card key={r.id} className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-ink-900">{r.name}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-sm text-ink-500">
                    <Users size={14} />
                    Kapasite: {r.capacity}
                  </p>
                </div>
                <Badge tone={used >= r.capacity ? 'danger' : 'success'}>
                  {used}/{r.capacity}
                </Badge>
              </div>
              <div className="mt-4">
                <div className="h-2 w-full rounded-full bg-ink-100">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      used >= r.capacity ? 'bg-red-500' : 'bg-brand-500'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="mt-1.5 text-xs text-ink-500">
                  {used >= r.capacity ? 'Dolu' : `${r.capacity - used} boş yer`}
                </p>
              </div>
              <div className="mt-4 flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                  onClick={() => openEdit(r)}
                >
                  <Pencil size={14} />
                  Düzenle
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteTarget(r)}
                  className="text-red-600 hover:bg-red-50"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </Card>
          );
        })}
        {rooms.length === 0 && (
          <Card className="col-span-full p-12 text-center">
            <DoorOpen size={40} className="mx-auto mb-3 text-ink-300" />
            <p className="text-sm text-ink-500">Henüz salon eklenmedi.</p>
          </Card>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Salon Düzenle' : 'Yeni Salon Ekle'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              İptal
            </Button>
            <Button onClick={submit}>{editing ? 'Güncelle' : 'Ekle'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Salon Adı"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Örn. Sessiz Salon"
          />
          <Input
            label="Kapasite"
            type="number"
            min={1}
            value={form.capacity}
            onChange={(e) =>
              setForm({ ...form, capacity: parseInt(e.target.value || '0', 10) })
            }
          />
        </div>
        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
            {error}
          </p>
        )}
      </Modal>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Salonu Sil"
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
          <strong>{deleteTarget?.name}</strong> salonunu silmek istediğinize
          emin misiniz?
        </p>
      </Modal>
    </div>
  );
}
