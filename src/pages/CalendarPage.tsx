import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Building2, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Switch } from '@/components/ui/switch';
import { getAllThaiHolidays } from '@/constants/getThaiHolidays';

const CalendarPage = () => {
  const { t, i18n } = useTranslation();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [companyEvents, setCompanyEvents] = useState<CompanyEvent[]>([]);
  const [thaiHolidays, setThaiHolidays] = useState<ThaiHoliday[]>([]);
  const [employeeLeaves, setEmployeeLeaves] = useState<EmployeeLeave[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompanyHolidays, setShowCompanyHolidays] = useState(true);
  const [showAnnualHolidays, setShowAnnualHolidays] = useState(true);
  const [showEmployeeLeaves, setShowEmployeeLeaves] = useState(true);
  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // Month names based on current language
  const monthNames = [
    t('calendar.months.january'),
    t('calendar.months.february'),
    t('calendar.months.march'),
    t('calendar.months.april'),
    t('calendar.months.may'),
    t('calendar.months.june'),
    t('calendar.months.july'),
    t('calendar.months.august'),
    t('calendar.months.september'),
    t('calendar.months.october'),
    t('calendar.months.november'),
    t('calendar.months.december')
  ];

  // Weekday names based on current language
  const weekdayNames = [
    t('calendar.weekdays.sunday'),
    t('calendar.weekdays.monday'),
    t('calendar.weekdays.tuesday'),
    t('calendar.weekdays.wednesday'),
    t('calendar.weekdays.thursday'),
    t('calendar.weekdays.friday'),
    t('calendar.weekdays.saturday')
  ];

  // Update month names and weekday names when language changes
  useEffect(() => {
    // This will trigger a re-render when the language changes
    // The monthNames and weekdayNames arrays will be recreated with new translations
  }, [i18n.language, t]);

  function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
  }

  interface CompanyEvent {
    id: string;
    title: string;
    description: string;
    date: string;
    createdAt: string;
    createdBy: string;
    type?: 'company' | 'annual';
  }

  interface ThaiHoliday {
    date: string;
    name: string;
    type: string;
  }

  interface EmployeeLeave {
    id: string;
    userId: string;
    userName: string;
    department: string;
    position: string;
    leaveType: string;
    leaveTypeEn: string;
    startDate: string;
    endDate: string;
    startTime?: string;
    endTime?: string;
    duration: string;
    durationType: string;
    reason: string;
    status: string;
    createdAt: string;
  }

  interface CalendarEvent {
    id?: string;
    title: string;
    description?: string;
    date: string;
    createdAt?: string;
    createdBy?: string;
    type: 'company' | 'annual' | 'employee';
    isThaiHoliday?: boolean;
    isDual?: boolean;
    employeeInfo?: {
      userName: string;
      leaveType: string;
      startDate: string;
      endDate: string;
      duration: string;
      durationType: string;
    };
  }

  // Fetch company events, Thai holidays, and employee leaves
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch company events
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/api/custom-holidays/year/${year}`, {
          headers: {
            'Authorization': token ? `Bearer ${token}` : undefined,
          }
        });
        if (response.ok) {
          const result = await response.json();
          setCompanyEvents(result.data || []);
        } else {
          console.error('Failed to fetch company events');
          setCompanyEvents([]);
        }
        
        // Get Thai holidays for the year
        const thaiHolidaysData = getAllThaiHolidays(year, t);
        setThaiHolidays(thaiHolidaysData);
        
        // Fetch employee leaves
        const leaveResponse = await fetch(`${API_BASE_URL}/api/leave-request/calendar/${year}`, {
          headers: {
            'Authorization': token ? `Bearer ${token}` : undefined,
          }
        });
        if (leaveResponse.ok) {
          const leaveResult = await leaveResponse.json();
          setEmployeeLeaves(leaveResult.data || []);
        } else {
          console.error('Failed to fetch employee leaves');
          setEmployeeLeaves([]);
        }
        
      } catch (error) {
        console.error('Error fetching data:', error);
        setCompanyEvents([]);
        setThaiHolidays([]);
        setEmployeeLeaves([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [year, t]);

  // Get all events (company + Thai holidays + employee leaves) for a specific month
  const getEventsByMonth = (year: number, month: number): CalendarEvent[] => {
    const allEvents: CalendarEvent[] = [];
    
    // Add company events if enabled
    if (showCompanyHolidays && Array.isArray(companyEvents)) {
      const monthCompanyEvents = companyEvents.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate.getFullYear() === year && eventDate.getMonth() === month;
      });
      allEvents.push(...monthCompanyEvents.map(event => ({
        ...event,
        type: event.type || 'company',
        isThaiHoliday: false
      })));
    }
    
    // Add Thai holidays if enabled
    if (showAnnualHolidays && Array.isArray(thaiHolidays)) {
      const monthThaiHolidays = thaiHolidays.filter(holiday => {
        const holidayDate = new Date(holiday.date);
        return holidayDate.getFullYear() === year && holidayDate.getMonth() === month;
      });
      allEvents.push(...monthThaiHolidays.map(holiday => ({
        id: `thai-${holiday.date}`,
        title: holiday.name,
        description: '',
        date: holiday.date,
        createdAt: holiday.date,
        createdBy: 'system',
        type: 'annual' as const,
        isThaiHoliday: true
      })));
    }
    
    // Add employee leaves if enabled
    if (showEmployeeLeaves && Array.isArray(employeeLeaves)) {
      const monthEmployeeLeaves = employeeLeaves.filter(leave => {
        const startDate = new Date(leave.startDate);
        const endDate = new Date(leave.endDate);
        return (startDate.getFullYear() === year && startDate.getMonth() === month) ||
               (endDate.getFullYear() === year && endDate.getMonth() === month) ||
               (startDate <= new Date(year, month + 1, 0) && endDate >= new Date(year, month, 1));
      });
      
      // Create events for each day of the leave period
      monthEmployeeLeaves.forEach(leave => {
        const startDate = new Date(leave.startDate);
        const endDate = new Date(leave.endDate);
        const currentDate = new Date(startDate);
        
        while (currentDate <= endDate) {
          if (currentDate.getFullYear() === year && currentDate.getMonth() === month) {
            allEvents.push({
              id: `leave-${leave.id}-${currentDate.toISOString().split('T')[0]}`,
              title: leave.userName,
              description: leave.reason,
              date: currentDate.toISOString().split('T')[0],
              createdAt: leave.createdAt,
              createdBy: leave.userId,
              type: 'employee' as const,
              employeeInfo: {
                userName: leave.userName,
                leaveType: i18n.language.startsWith('th') ? leave.leaveType : leave.leaveTypeEn,
                startDate: leave.startDate,
                endDate: leave.endDate,
                duration: leave.duration,
                durationType: leave.durationType
              }
            });
          }
          currentDate.setDate(currentDate.getDate() + 1);
        }
      });
    }
    
    return allEvents;
  };

  // Get color for event type
  const getEventColor = (event: CalendarEvent) => {
    if (event.isDual) return 'bg-purple-500';
    switch (event.type) {
      case 'annual': return 'bg-red-500';
      case 'company': return 'bg-blue-500';
      case 'employee': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  // Get tooltip content for event
  const getEventTooltip = (event: CalendarEvent) => {
    if (event.type === 'employee' && event.employeeInfo) {
      const { userName, leaveType, startDate, endDate, duration, durationType } = event.employeeInfo;
      const start = new Date(startDate).toLocaleDateString(i18n.language.startsWith('th') ? 'th-TH' : 'en-US');
      const end = new Date(endDate).toLocaleDateString(i18n.language.startsWith('th') ? 'th-TH' : 'en-US');
      return `${userName}\n${leaveType}\n${start} - ${end}\n${duration} ${durationType === 'day' ? 'วัน' : 'ชั่วโมง'}`;
    }
    return event.title;
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
            {t('calendar.title')}
          </h1>
          <p className="text-lg md:text-xl text-blue-900/70 mb-2 font-medium text-center max-w-2xl">
            {t('calendar.subtitle')}
          </p>
        </div>
      </div>
      <div className="flex flex-col items-center py-6">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => setYear(y => y - 1)} className="p-2 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600 shadow">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <span className="text-2xl font-bold text-blue-900">{year + (i18n.language.startsWith('th') ? 543 : 0)}</span>
          <button onClick={() => setYear(now.getFullYear())} className="px-4 py-2 rounded-lg bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-semibold shadow">
            {t('calendar.currentYear')}
          </button>
          <button onClick={() => setYear(y => y + 1)} className="p-2 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600 shadow">
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
        
        {/* Filter Switches and Legend */}
        <div className="flex items-center justify-center gap-6 mb-6 bg-white/60 rounded-xl p-4 shadow-lg">
          <div className="flex items-center gap-3">
            <Switch 
              checked={showAnnualHolidays}
              onCheckedChange={setShowAnnualHolidays}
              className="data-[state=checked]:bg-red-500"
            />
            <span className="text-sm font-medium text-red-700">{t('calendar.annualHolidays')}</span>
          </div>
          <div className="flex items-center gap-3">
            <Switch 
              checked={showCompanyHolidays}
              onCheckedChange={setShowCompanyHolidays}
              className="data-[state=checked]:bg-blue-500"
            />
            <span className="text-sm font-medium text-blue-700">{t('calendar.companyHolidays')}</span>
          </div>
          <div className="flex items-center gap-3">
            <Switch 
              checked={showEmployeeLeaves}
              onCheckedChange={setShowEmployeeLeaves}
              className="data-[state=checked]:bg-green-500"
            />
            <span className="text-sm font-medium text-green-700">{t('calendar.employeeLeaves')}</span>
          </div>
          
          {/* Legend */}
          <div className="flex items-center gap-4 ml-6 pl-6 border-l border-gray-300">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-xs text-red-700">{t('calendar.legend.annualHoliday')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-xs text-blue-700">{t('calendar.legend.companyHoliday')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-xs text-green-700">{t('calendar.legend.employeeLeave')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span className="text-xs text-purple-700">{t('calendar.legend.dualEvent')}</span>
            </div>
          </div>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-blue-600">{t('calendar.loading')}</span>
          </div>
        ) : (
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
              
              // Get all events for this month
              const events = getEventsByMonth(year, mIdx);
              const eventDates = events.map(e => e.date);
              const eventMap: Record<string, CalendarEvent> = {};
              const eventCountMap: Record<string, number> = {};
              
              // First pass: count events per date
              events.forEach(e => { 
                eventCountMap[e.date] = (eventCountMap[e.date] || 0) + 1;
              });
              
              // Second pass: create event map with dual flag
              events.forEach(e => { 
                if (eventCountMap[e.date] > 1) {
                  // If there are multiple events on this date, mark as dual
                  eventMap[e.date] = { ...e, isDual: true };
                } else {
                  eventMap[e.date] = e;
                }
              });
              
              return (
                <div key={month} className="bg-white/80 rounded-2xl shadow-xl p-4 flex flex-col items-center">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-5 h-5 text-indigo-400" />
                    <button
                      className="text-lg font-bold text-blue-900 hover:underline hover:text-indigo-600 transition cursor-pointer bg-transparent border-0 p-0"
                      onClick={() => navigate(`/calendar/${year}/${mIdx + 1}`)}
                    >
                      {month}
                    </button>
                  </div>
                  <table className="w-full text-center">
                    <thead>
                      <tr className="text-blue-500">
                        <th className="py-1">{weekdayNames[0]}</th>
                        <th className="py-1">{weekdayNames[1]}</th>
                        <th className="py-1">{weekdayNames[2]}</th>
                        <th className="py-1">{weekdayNames[3]}</th>
                        <th className="py-1">{weekdayNames[4]}</th>
                        <th className="py-1">{weekdayNames[5]}</th>
                        <th className="py-1">{weekdayNames[6]}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {weeks.map((week, wIdx) => (
                        <tr key={wIdx}>
                          {week.map((d, dIdx) => {
                            if (!d) return <td key={dIdx} className="py-1"> </td>;
                            const dateStr = `${year}-${(mIdx+1).toString().padStart(2,'0')}-${d.toString().padStart(2,'0')}`;
                            
                            // Check for events using multiple date formats
                            const event = eventMap[dateStr] || 
                                         eventMap[`${year}-${mIdx+1}-${d}`] ||
                                         eventMap[`${year}-${(mIdx+1).toString().padStart(2,'0')}-${d}`] ||
                                         eventMap[`${dateStr} 00:00:00`] ||
                                         eventMap[`${year}-${(mIdx+1).toString().padStart(2,'0')}-${d.toString().padStart(2,'0')} 00:00:00`];
                            
                            return (
                              <td
                                key={dIdx}
                                className={`py-1 px-1 rounded-lg font-semibold transition`}
                              >
                                {event ? (
                                  <div className="relative group">
                                    <span 
                                      className={`${getEventColor(event)} text-white rounded-full w-7 h-7 flex items-center justify-center mx-auto font-bold shadow cursor-pointer hover:scale-110 transition-transform`}
                                      title={getEventTooltip(event)}
                                    >
                                      {d}
                                    </span>
                                    {/* Tooltip */}
                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-pre-line z-10 max-w-xs">
                                      {getEventTooltip(event)}
                                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                                    </div>
                                  </div>
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
                  {/* แสดงรายการกิจกรรมของเดือนนี้ */}
                  <ul className="mt-2 text-xs text-left w-full max-h-32 overflow-y-auto">
                    {events.map(e => {
                      const d = new Date(e.date);
                      const day = d.getDate();
                      const monthNum = d.getMonth() + 1;
                      const eventType = e.type || 'company';
                      return (
                        <li key={e.id || `event-${e.date}`} className="flex items-center gap-2 mb-1">
                          <span className={`inline-block w-2 h-2 rounded-full ${
                            e.isDual 
                              ? 'bg-purple-500' 
                              : eventType === 'annual' 
                                ? 'bg-red-500' 
                                : eventType === 'employee'
                                  ? 'bg-green-500'
                                  : 'bg-blue-500'
                          }`}></span>
                          <span className={
                            e.isDual 
                              ? 'text-purple-600' 
                              : eventType === 'annual' 
                                ? 'text-red-600' 
                                : eventType === 'employee'
                                  ? 'text-green-600'
                                  : 'text-blue-600'
                          }>
                            {eventType === 'employee' && e.employeeInfo 
                              ? `${e.employeeInfo.userName} (${e.employeeInfo.leaveType})`
                              : e.title
                            } ({day}/{monthNum})
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
        
      </div>
    </div>
  );
};

export default CalendarPage; 