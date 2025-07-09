import Holidays from 'date-holidays';

export function getUpcomingThaiHolidays(count = 3) {
  const hd = new Holidays('TH');
  const all = hd.getHolidays(new Date().getFullYear());
  const today = new Date();
  // กรองเฉพาะวันหยุดที่ยังไม่ถึง
  const upcoming = all
    .filter(h => new Date(h.date) >= today)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, count);
  return upcoming;
}

export function getThaiHolidaysByMonth(year: number, month: number) {
  const hd = new Holidays('TH');
  const all = hd.getHolidays(year);
  return all.filter(h => new Date(h.date).getMonth() === month);
} 