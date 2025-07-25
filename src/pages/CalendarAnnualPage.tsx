import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getThaiHolidaysByMonth } from '@/constants/getThaiHolidays';
import { useNavigate } from 'react-router-dom';

const monthNames = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

const CalendarAnnualPage = () => {
  const { t } = useTranslation();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const navigate = useNavigate();

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
            ปฎิทินประจำปี
          </h1>
          <p className="text-lg md:text-xl text-blue-900/70 mb-2 font-medium text-center max-w-2xl">
            ดูวันหยุดราชการและวันสำคัญตลอดทั้งปี
          </p>
        </div>
      </div>
      <div className="flex flex-col items-center py-6">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => setYear(y => y - 1)} className="p-2 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600 shadow"><ChevronLeft className="w-6 h-6" /></button>
          <span className="text-2xl font-bold text-blue-900">{year + 543}</span>
          <button onClick={() => setYear(now.getFullYear())} className="px-4 py-2 rounded-lg bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-semibold shadow">ปีปัจจุบัน</button>
          <button onClick={() => setYear(y => y + 1)} className="p-2 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600 shadow"><ChevronRight className="w-6 h-6" /></button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-6xl">
          {monthNames.map((month, mIdx) => {
            const days = getDaysInMonth(year, mIdx);
            const firstDay = new Date(year, mIdx, 1).getDay();
            // Sunday = 0, Monday = 1, ...
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
            // Get holidays for this month
            const holidays = getThaiHolidaysByMonth(year, mIdx);
            const holidayDates = holidays.map(h => h.date);
            const holidayMap: Record<string, string> = {};
            holidays.forEach(h => { holidayMap[h.date] = h.name; });
            return (
              <div key={month} className="bg-white/80 rounded-2xl shadow-xl p-4 flex flex-col items-center">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-5 h-5 text-blue-400" />
                  <button
                    className="text-lg font-bold text-blue-900 hover:underline hover:text-indigo-600 transition cursor-pointer bg-transparent border-0 p-0"
                    onClick={() => navigate(`/calendar/annual/${year}/${mIdx + 1}`)}
                  >
                    {month}
                  </button>
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
                          const dateStr = `${year}-${(mIdx+1).toString().padStart(2,'0')}-${d.toString().padStart(2,'0')}`;
                          const isHoliday = holidayMap[dateStr];
                          return (
                            <td
                              key={dIdx}
                              className={`py-1 px-1 rounded-lg font-semibold transition`}
                              title={isHoliday || ''}
                            >
                              {isHoliday ? (
                                <span className="bg-red-400 text-white rounded-full w-7 h-7 flex items-center justify-center mx-auto font-bold shadow">
                                  {d}
                                </span>
                              ) : (
                                <span>{d}</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {/* แสดงรายการวันหยุดของเดือนนี้ */}
                <ul className="mt-2 text-xs text-red-500 text-left w-full">
                  {holidays.map(h => (
                    <li key={h.date} className="flex items-center gap-2">
                      <span className="inline-block w-2 h-2 rounded-full bg-red-400"></span>
                      {h.name} ({h.date.split('-')[2]}/{h.date.split('-')[1]})
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CalendarAnnualPage; 