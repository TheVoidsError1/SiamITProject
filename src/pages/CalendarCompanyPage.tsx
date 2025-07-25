import React, { useState } from 'react';
import { Calendar, Plus, Trash2, Edit2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const monthNames = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

const CalendarCompanyPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  // Mock company holidays
  const [holidays, setHolidays] = useState([
    { date: `${year}-${(month+1).toString().padStart(2,'0')}-10`, name: 'วันหยุดบริษัท A' },
    { date: `${year}-${(month+1).toString().padStart(2,'0')}-18`, name: 'กิจกรรมบริษัท B' },
  ]);
  const [showAdd, setShowAdd] = useState(false);
  const [newHoliday, setNewHoliday] = useState({ name: '', date: '' });
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editHoliday, setEditHoliday] = useState({ name: '', date: '' });

  const days = getDaysInMonth(year, month);
  const firstDay = new Date(year, month, 1).getDay();
  const weeks: Array<Array<number | null>> = [];
  let week: Array<number | null> = Array(firstDay).fill(null);
  for (let d = 1; d <= days; d++) {
    week.push(d);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length > 0) weeks.push([...week, ...Array(7 - week.length).fill(null)]);
  const holidayMap: Record<string, string> = {};
  holidays.forEach(h => { holidayMap[h.date] = h.name; });

  // Handlers
  const handleAdd = () => {
    if (!newHoliday.name || !newHoliday.date) return;
    setHolidays([...holidays, newHoliday]);
    setShowAdd(false);
    setNewHoliday({ name: '', date: '' });
  };
  const handleDelete = (idx: number) => {
    setHolidays(holidays.filter((_, i) => i !== idx));
  };
  const handleEdit = (idx: number) => {
    setEditIdx(idx);
    setEditHoliday(holidays[idx]);
  };
  const handleEditSave = () => {
    if (editIdx === null) return;
    const newArr = [...holidays];
    newArr[editIdx] = editHoliday;
    setHolidays(newArr);
    setEditIdx(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-100 to-purple-100 flex flex-col">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <svg viewBox="0 0 1440 320" className="w-full h-32 md:h-48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill="url(#waveGradient)" fillOpacity="1" d="M0,160L60,170.7C120,181,240,203,360,197.3C480,192,600,160,720,133.3C840,107,960,85,1080,101.3C1200,117,1320,171,1380,197.3L1440,224L1440,0L1380,0C1320,0,1200,0,1080,0C960,0,840,0,720,0C600,0,480,0,360,0C240,0,120,0,60,0L0,0Z" />
            <defs>
              <linearGradient id="waveGradient" x1="0" y1="0" x2="1440" y2="0" gradientUnits="userSpaceOnUse">
                <stop stopColor="#3b82f6" />
                <stop offset="1" stopColor="#6366f1" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center py-10 md:py-16">
          <img src="/lovable-uploads/siamit.png" alt="Logo" className="w-24 h-24 rounded-full bg-white/80 shadow-2xl border-4 border-white mb-4" />
          <h1 className="text-4xl md:text-5xl font-extrabold text-indigo-900 drop-shadow mb-2 flex items-center gap-3">
            ปฎิทินทางบริษัท
          </h1>
          <p className="text-lg md:text-xl text-blue-900/70 mb-2 font-medium text-center max-w-2xl">
            ดูวันหยุดและกิจกรรมบริษัท (Admin/Superadmin เพิ่ม/แก้ไข/ลบได้)
          </p>
        </div>
      </div>
      <div className="flex flex-col items-center py-6">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => setMonth(m => (m === 0 ? 11 : m - 1))} className="p-2 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600 shadow">&lt;</button>
          <span className="text-2xl font-bold text-blue-900">{monthNames[month]} {year + 543}</span>
          <button onClick={() => setMonth(m => (m === 11 ? 0 : m + 1))} className="p-2 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600 shadow">&gt;</button>
        </div>
        <div className="bg-white/80 rounded-2xl shadow-xl p-4 flex flex-col items-center w-full max-w-lg mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-blue-400" />
            <span className="text-lg font-bold text-blue-900">{monthNames[month]}</span>
            {(user?.role === 'admin' || user?.role === 'superadmin') && (
              <Button size="sm" className="ml-2" onClick={() => setShowAdd(true)}><Plus className="w-4 h-4 mr-1" /> เพิ่มวันหยุด</Button>
            )}
          </div>
          <table className="w-full text-center">
            <thead>
              <tr className="text-blue-500">
                <th className="py-1">อา</th>
                <th className="py-1">จ</th>
                <th className="py-1">อ</th>
                <th className="py-1">พ</th>
                <th className="py-1">พฤ</th>
                <th className="py-1">ศ</th>
                <th className="py-1">ส</th>
              </tr>
            </thead>
            <tbody>
              {weeks.map((week, wIdx) => (
                <tr key={wIdx}>
                  {week.map((d, dIdx) => {
                    if (!d) return <td key={dIdx} className="py-1"> </td>;
                    const dateStr = `${year}-${(month+1).toString().padStart(2,'0')}-${d.toString().padStart(2,'0')}`;
                    const isHoliday = holidayMap[dateStr];
                    return (
                      <td
                        key={dIdx}
                        className={`py-1 px-1 rounded-lg font-semibold ${isHoliday ? 'bg-gradient-to-br from-yellow-200 via-orange-200 to-pink-100 text-orange-700 shadow-md border border-orange-200 cursor-help' : 'text-blue-900'} transition`}
                        title={isHoliday || ''}
                      >
                        {d}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* รายละเอียดวันหยุดบริษัท */}
        <div className="w-full max-w-lg bg-white/90 rounded-2xl shadow p-6">
          <h2 className="text-xl font-bold text-blue-900 mb-4">วันหยุด/กิจกรรมบริษัทในเดือนนี้</h2>
          {holidays.filter(h => h.date.startsWith(`${year}-${(month+1).toString().padStart(2,'0')}`)).length === 0 ? (
            <div className="text-blue-400 text-base">ไม่มีวันหยุดบริษัทในเดือนนี้</div>
          ) : (
            <ul className="space-y-2">
              {holidays.filter(h => h.date.startsWith(`${year}-${(month+1).toString().padStart(2,'0')}`)).map((h, idx) => {
                const d = new Date(h.date);
                const day = d.getDate();
                const monthNum = d.getMonth() + 1;
                const yearNum = d.getFullYear() + 543;
                return (
                  <li key={h.date} className="flex items-center gap-3 text-base text-orange-700">
                    <span className="inline-block w-3 h-3 rounded-full bg-orange-400"></span>
                    <span className="font-semibold">{h.name}</span>
                    <span className="text-blue-500">({day}/{monthNum}/{yearNum})</span>
                    {(user?.role === 'admin' || user?.role === 'superadmin') && (
                      <>
                        <Button size="icon" variant="ghost" onClick={() => handleEdit(idx)}><Edit2 className="w-4 h-4" /></Button>
                        <Button size="icon" variant="destructive" onClick={() => handleDelete(idx)}><Trash2 className="w-4 h-4" /></Button>
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
      {/* Add Holiday Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>เพิ่มวันหยุด/กิจกรรมบริษัท</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="ชื่อวันหยุด/กิจกรรม" value={newHoliday.name} onChange={e => setNewHoliday(h => ({ ...h, name: e.target.value }))} />
            <Input type="date" value={newHoliday.date} onChange={e => setNewHoliday(h => ({ ...h, date: e.target.value }))} />
          </div>
          <DialogFooter>
            <Button onClick={handleAdd}>บันทึก</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Edit Holiday Dialog */}
      <Dialog open={editIdx !== null} onOpenChange={open => { if (!open) setEditIdx(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>แก้ไขวันหยุด/กิจกรรมบริษัท</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="ชื่อวันหยุด/กิจกรรม" value={editHoliday.name} onChange={e => setEditHoliday(h => ({ ...h, name: e.target.value }))} />
            <Input type="date" value={editHoliday.date} onChange={e => setEditHoliday(h => ({ ...h, date: e.target.value }))} />
          </div>
          <DialogFooter>
            <Button onClick={handleEditSave}>บันทึก</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CalendarCompanyPage; 