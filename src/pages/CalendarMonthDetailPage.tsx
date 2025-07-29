import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, ChevronLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getThaiHolidaysByMonth } from '@/constants/getThaiHolidays';

const monthNames = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

const CalendarMonthDetailPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const params = useParams();
  const year = Number(params.year) || new Date().getFullYear();
  const month = Number(params.month) - 1 || new Date().getMonth();
  const holidays = getThaiHolidaysByMonth(year, month, t);
  const holidayMap: Record<string, string> = {};
  holidays.forEach(h => { holidayMap[h.date] = h.name; });
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
          <button onClick={() => navigate(-1)} className="absolute left-4 top-4 md:left-10 md:top-10 p-2 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600 shadow"><ChevronLeft className="w-6 h-6" /></button>
          <img src="/lovable-uploads/siamit.png" alt="Logo" className="w-24 h-24 rounded-full bg-white/80 shadow-2xl border-4 border-white mb-4" />
          <h1 className="text-4xl md:text-5xl font-extrabold text-indigo-900 drop-shadow mb-2 flex items-center gap-3">
            {monthNames[month]} {year + 543}
          </h1>
          <p className="text-lg md:text-xl text-blue-900/70 mb-2 font-medium text-center max-w-2xl">
            รายละเอียดวันหยุดประจำเดือนนี้
          </p>
        </div>
      </div>
      <div className="flex flex-col items-center py-6">
        <div className="bg-white/80 rounded-2xl shadow-xl p-4 flex flex-col items-center w-full max-w-lg mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-blue-400" />
            <span className="text-lg font-bold text-blue-900">{monthNames[month]}</span>
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
                    
                    // Check for holiday using multiple date formats (including with time)
                    const isHoliday = holidayMap[dateStr] || 
                                     holidayMap[`${year}-${month+1}-${d}`] ||
                                     holidayMap[`${year}-${(month+1).toString().padStart(2,'0')}-${d}`] ||
                                     holidayMap[`${dateStr} 00:00:00`] ||
                                     holidayMap[`${year}-${(month+1).toString().padStart(2,'0')}-${d.toString().padStart(2,'0')} 00:00:00`];
                    
                    // Check if this is the current day
                    const today = new Date();
                    const isCurrentDay = today.getFullYear() === year && 
                                       today.getMonth() === month && 
                                       today.getDate() === d;
                    
                    return (
                      <td
                        key={dIdx}
                        className={`py-1 px-1 rounded-lg font-semibold transition ${
                          isHoliday 
                            ? 'bg-gradient-to-br from-pink-200 via-red-200 to-yellow-100 text-red-700 shadow-md border border-red-200 cursor-help' 
                            : isCurrentDay
                            ? 'bg-blue-500 text-white shadow-md border border-blue-300'
                            : 'text-blue-900'
                        }`}
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
        {/* รายละเอียดวันหยุด */}
        <div className="w-full max-w-lg bg-white/90 rounded-2xl shadow p-6">
          <h2 className="text-xl font-bold text-blue-900 mb-4">วันหยุดในเดือนนี้</h2>
          {holidays.length === 0 ? (
            <div className="text-blue-400 text-base">ไม่มีวันหยุดในเดือนนี้</div>
          ) : (
            <ul className="space-y-2">
              {holidays.map(h => {
                const d = new Date(h.date);
                const day = d.getDate();
                const monthNum = d.getMonth() + 1;
                const yearNum = d.getFullYear() + 543;
                return (
                  <li key={h.date} className="flex items-center gap-3 text-base text-red-600">
                    <span className="inline-block w-3 h-3 rounded-full bg-red-400"></span>
                    <span className="font-semibold">{h.name}</span>
                    <span className="text-blue-500">({day}/{monthNum}/{yearNum})</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarMonthDetailPage; 