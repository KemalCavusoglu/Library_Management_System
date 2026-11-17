import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminPage } from '../../components/admin/AdminLayout';
import { LiveMonitor } from './LiveMonitor';
import { StudentManagement } from './StudentManagement';
import { RoomManagement } from './RoomManagement';
import { Reports } from './Reports';

export function AdminRoot() {
  return (
    <AdminPage>
      <Routes>
        <Route path="live" element={<LiveMonitor />} />
        <Route path="students" element={<StudentManagement />} />
        <Route path="rooms" element={<RoomManagement />} />
        <Route path="reports" element={<Reports />} />
        <Route path="*" element={<Navigate to="/admin/live" replace />} />
      </Routes>
    </AdminPage>
  );
}
