import React, { useState, useEffect } from 'react';
import { ChevronLeft, Calendar, Building2, Plus, Trash2, Edit2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getThaiHolidaysByMonth } from '@/constants/getThaiHolidays';

const monthNames = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

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

interface CalendarEvent {
  id?: string;
  title: string;
  description?: string;
  date: string;
  createdAt?: string;
  createdBy?: string;
  type: 'company' | 'annual';
  isThaiHoliday?: boolean;
  isDual?: boolean;
}

const CompanyMonthDetailPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { year, month } = useParams();
  const currentYear = parseInt(year || new Date().getFullYear().toString());
  const currentMonth = parseInt(month || (new Date().getMonth() + 1).toString()) - 1;
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  
  const [companyEvents, setCompanyEvents] = useState<CompanyEvent[]>([]);
  const [thaiHolidays, setThaiHolidays] = useState<ThaiHoliday[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CompanyEvent | null>(null);
  const [showCompanyHolidays, setShowCompanyHolidays] = useState(true);
  const [showAnnualHolidays, setShowAnnualHolidays] = useState(true);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: ''
  });

  // Fetch company events and Thai holidays for the specific month
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch company events
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/api/custom-holidays/year/${currentYear}`, {
          headers: {
            'Authorization': token ? `Bearer ${token}` : undefined,
          }
        });
        if (response.ok) {
          const result = await response.json();
          const allEvents = result.data || [];
          // Filter events for the current month
          const monthEvents = allEvents.filter((event: CompanyEvent) => {
            const eventDate = new Date(event.date);
            return eventDate.getFullYear() === currentYear && eventDate.getMonth() === currentMonth;
          });
          setCompanyEvents(monthEvents);
        } else {
          console.error('Failed to fetch company events');
          setCompanyEvents([]);
        }
        
        // Get Thai holidays for the current month
        const thaiHolidaysData = getThaiHolidaysByMonth(currentYear, currentMonth, t);
        setThaiHolidays(thaiHolidaysData);
        
      } catch (error) {
        console.error('Error fetching data:', error);
        setCompanyEvents([]);
        setThaiHolidays([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentYear, currentMonth, t]);

  // Create calendar grid
  const days = getDaysInMonth(currentYear, currentMonth);
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
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

  // Combine and filter events based on switches
  const allEvents: CalendarEvent[] = [];
  
  // Add company events if enabled
  if (showCompanyHolidays) {
    allEvents.push(...companyEvents.map(event => ({
      ...event,
      type: event.type || 'company',
      isThaiHoliday: false
    })));
  }
  
  // Add Thai holidays if enabled
  if (showAnnualHolidays) {
    allEvents.push(...thaiHolidays.map(holiday => ({
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

  // Create event map for highlighting
  const eventMap: Record<string, CalendarEvent> = {};
  const eventCountMap: Record<string, number> = {};
  
  // First pass: count events per date
  allEvents.forEach(event => {
    const eventDate = new Date(event.date);
    const dateStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${eventDate.getDate().toString().padStart(2, '0')}`;
    eventCountMap[dateStr] = (eventCountMap[dateStr] || 0) + 1;
  });
  
  // Second pass: create event map with dual flag
  allEvents.forEach(event => {
    const eventDate = new Date(event.date);
    const dateStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${eventDate.getDate().toString().padStart(2, '0')}`;
    
    if (eventCountMap[dateStr] > 1) {
      // If there are multiple events on this date, mark as dual
      eventMap[dateStr] = { ...event, isDual: true };
    } else {
      eventMap[dateStr] = event;
    }
  });

  // Handlers
  const handleAdd = async () => {
    if (!newEvent.title || !newEvent.date) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/custom-holidays`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : undefined,
        },
        body: JSON.stringify({
          title: newEvent.title,
          description: newEvent.description,
          date: newEvent.date,
          type: 'company'
        })
      });

      if (response.ok) {
        const result = await response.json();
        // Handle the API response structure: { status: 'success', data: {...} }
        const createdEvent = result.data || result;
        setCompanyEvents([...companyEvents, createdEvent]);
        setShowAdd(false);
        setNewEvent({ title: '', description: '', date: '' });
      } else {
        console.error('Failed to create company event');
      }
    } catch (error) {
      console.error('Error creating company event:', error);
    }
  };

  const handleEdit = (event: CompanyEvent) => {
    setEditingEvent(event);
    setShowEdit(true);
  };

  const handleEditSave = async () => {
    if (!editingEvent) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/custom-holidays/${editingEvent.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : undefined,
        },
        body: JSON.stringify({
          title: editingEvent.title,
          description: editingEvent.description,
          date: editingEvent.date
        })
      });

      if (response.ok) {
        const result = await response.json();
        // Handle the API response structure: { status: 'success', data: {...} }
        const updatedEvent = result.data || result;
        setCompanyEvents(companyEvents.map(event => 
          event.id === editingEvent.id ? updatedEvent : event
        ));
        setShowEdit(false);
        setEditingEvent(null);
      } else {
        console.error('Failed to update company event');
      }
    } catch (error) {
      console.error('Error updating company event:', error);
    }
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/custom-holidays/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': token ? `Bearer ${token}` : undefined,
        }
      });

      if (response.ok) {
        setCompanyEvents(companyEvents.filter(event => event.id !== eventId));
      } else {
        console.error('Failed to delete company event');
      }
    } catch (error) {
      console.error('Error deleting company event:', error);
    }
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
          <button onClick={() => navigate(-1)} className="absolute left-4 top-4 md:left-10 md:top-10 p-2 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600 shadow">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <img src="/lovable-uploads/siamit.png" alt="Logo" className="w-24 h-24 rounded-full bg-white/80 shadow-2xl border-4 border-white mb-4" />
          <h1 className="text-4xl md:text-5xl font-extrabold text-indigo-900 drop-shadow mb-2 flex items-center gap-3">
            {monthNames[currentMonth]} {currentYear + 543}
          </h1>
          <p className="text-lg md:text-xl text-blue-900/70 mb-2 font-medium text-center max-w-2xl">
            จัดการกิจกรรมและวันสำคัญของบริษัท
          </p>
        </div>
      </div>
      
      <div className="flex flex-col items-center py-6">
        {/* Filter Switches */}
        <div className="flex items-center justify-center gap-6 mb-6 bg-white/60 rounded-xl p-4 shadow-lg">
          <div className="flex items-center gap-3">
            <Switch 
              checked={showAnnualHolidays}
              onCheckedChange={setShowAnnualHolidays}
              className="data-[state=checked]:bg-red-500"
            />
            <span className="text-sm font-medium text-red-700">วันหยุดประจำปี</span>
          </div>
          <div className="flex items-center gap-3">
            <Switch 
              checked={showCompanyHolidays}
              onCheckedChange={setShowCompanyHolidays}
              className="data-[state=checked]:bg-blue-500"
            />
            <span className="text-sm font-medium text-blue-700">วันหยุดบริษัท</span>
          </div>
        </div>
        
        <div className="bg-white/80 rounded-2xl shadow-xl p-4 flex flex-col items-center w-full max-w-lg mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="w-5 h-5 text-indigo-400" />
            <span className="text-lg font-bold text-blue-900">{monthNames[currentMonth]}</span>
            {user?.role === 'superadmin' && (
              <Button size="sm" className="ml-2" onClick={() => setShowAdd(true)}>
                <Plus className="w-4 h-4 mr-1" /> เพิ่มกิจกรรม
              </Button>
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
                    const dateStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
                    const event = eventMap[dateStr];
                    
                    return (
                      <td
                        key={dIdx}
                        className={`py-1 px-1 rounded-lg font-semibold transition ${
                          event 
                            ? event.isDual
                              ? 'bg-gradient-to-br from-purple-200 via-pink-200 to-indigo-100 text-purple-700 shadow-md border border-purple-200 cursor-help'
                              : event.type === 'annual'
                                ? 'bg-gradient-to-br from-red-200 via-pink-200 to-orange-100 text-red-700 shadow-md border border-red-200 cursor-help'
                                : 'bg-gradient-to-br from-blue-200 via-indigo-200 to-purple-100 text-blue-700 shadow-md border border-blue-200 cursor-help'
                            : 'text-blue-900'
                        }`}
                        title={event?.title || ''}
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
        
        {/* รายละเอียดกิจกรรมของบริษัท */}
        <div className="w-full max-w-lg bg-white/90 rounded-2xl shadow p-6">
          <h2 className="text-xl font-bold text-blue-900 mb-4">กิจกรรมของบริษัทในเดือนนี้</h2>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : companyEvents.length === 0 ? (
            <div className="text-blue-400 text-base">ไม่มีกิจกรรมของบริษัทในเดือนนี้</div>
          ) : (
            <ul className="space-y-3">
              {allEvents.map(event => {
                const d = new Date(event.date);
                const day = d.getDate();
                const monthNum = d.getMonth() + 1;
                const yearNum = d.getFullYear() + 543;
                const eventType = event.type || 'company';
                return (
                  <li key={event.id || `event-${event.date}`} className={`flex items-start gap-3 text-base rounded-lg p-3 ${
                    event.isDual
                      ? 'text-purple-700 bg-purple-50'
                      : eventType === 'annual' 
                        ? 'text-red-700 bg-red-50' 
                        : 'text-blue-700 bg-blue-50'
                  }`}>
                    <span className={`inline-block w-3 h-3 rounded-full mt-1 flex-shrink-0 ${
                      event.isDual
                        ? 'bg-purple-400'
                        : eventType === 'annual' 
                          ? 'bg-red-400' 
                          : 'bg-blue-400'
                    }`}></span>
                    <div className="flex-1">
                      <div className="font-semibold">{event.title}</div>
                      {event.description && (
                        <div className={`text-sm mt-1 ${
                          event.isDual
                            ? 'text-purple-600'
                            : eventType === 'annual' 
                              ? 'text-red-600' 
                              : 'text-blue-600'
                        }`}>{event.description}</div>
                      )}
                      <div className={`text-sm mt-1 ${
                        event.isDual
                          ? 'text-purple-500'
                          : eventType === 'annual' 
                            ? 'text-red-500' 
                            : 'text-blue-500'
                      }`}>({day}/{monthNum}/{yearNum})</div>
                    </div>
                    {user?.role === 'superadmin' && !event.isThaiHoliday && (
                      <div className="flex gap-1 flex-shrink-0">
                        <Button size="icon" variant="ghost" onClick={() => handleEdit(event as CompanyEvent)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="destructive" onClick={() => handleDelete(event.id!)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Add Event Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>เพิ่มกิจกรรมของบริษัท</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input 
              placeholder="ชื่อกิจกรรม" 
              value={newEvent.title} 
              onChange={e => setNewEvent(prev => ({ ...prev, title: e.target.value }))} 
            />
            <Textarea 
              placeholder="รายละเอียดกิจกรรม (ไม่บังคับ)" 
              value={newEvent.description} 
              onChange={e => setNewEvent(prev => ({ ...prev, description: e.target.value }))} 
            />
            <Input 
              type="date" 
              value={newEvent.date} 
              onChange={e => setNewEvent(prev => ({ ...prev, date: e.target.value }))} 
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>ยกเลิก</Button>
            <Button onClick={handleAdd}>บันทึก</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Event Dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>แก้ไขกิจกรรมของบริษัท</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input 
              placeholder="ชื่อกิจกรรม" 
              value={editingEvent?.title || ''} 
              onChange={e => setEditingEvent(prev => prev ? { ...prev, title: e.target.value } : null)} 
            />
            <Textarea 
              placeholder="รายละเอียดกิจกรรม (ไม่บังคับ)" 
              value={editingEvent?.description || ''} 
              onChange={e => setEditingEvent(prev => prev ? { ...prev, description: e.target.value } : null)} 
            />
            <Input 
              type="date" 
              value={editingEvent?.date || ''} 
              onChange={e => setEditingEvent(prev => prev ? { ...prev, date: e.target.value } : null)} 
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEdit(false)}>ยกเลิก</Button>
            <Button onClick={handleEditSave}>บันทึก</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CompanyMonthDetailPage; 