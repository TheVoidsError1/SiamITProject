import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SidebarTrigger } from '@/components/ui/sidebar';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { Newspaper, Plus, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';

const mockNews = [
  {
    date: '2024-07-01',
    title: 'ปรับปรุงระบบลาออนไลน์',
    detail: 'ระบบลาออนไลน์จะปิดปรับปรุงในวันที่ 5 ก.ค. 2567 เวลา 20:00-23:00 น.',
    author: 'ฝ่าย IT',
  },
  {
    date: '2024-06-20',
    title: 'ประกาศวันหยุดบริษัท',
    detail: 'บริษัทจะหยุดทำการในวันที่ 28 ก.ค. 2567 เนื่องในวันเฉลิมพระชนมพรรษา',
    author: 'ฝ่ายบุคคล',
  },
  {
    date: '2024-06-10',
    title: 'กิจกรรม Outing ประจำปี',
    detail: 'ขอเชิญพนักงานทุกท่านเข้าร่วมกิจกรรม Outing วันที่ 15 ส.ค. 2567',
    author: 'ฝ่าย HR',
  },
];

export default function CompanyNews() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({
    date: '',
    title: '',
    detail: '',
    author: user?.full_name || '',
  });

  const handleAddNews = (e: React.FormEvent) => {
    e.preventDefault();
    alert('TODO: บันทึกข่าวสารใหม่ (mock)\n' + JSON.stringify(form, null, 2));
    setAddOpen(false);
    setForm({ date: '', title: '', detail: '', author: user?.full_name || '' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-indigo-50 to-white flex flex-col">
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
            <Newspaper className="w-8 h-8 text-blue-600" />
            ข่าวสารทางบริษัท
          </h1>
          <p className="text-lg md:text-xl text-blue-900/70 mb-2 font-medium text-center max-w-2xl">
            ประกาศสำคัญ ข่าวสาร กิจกรรม และข้อมูลที่ควรทราบสำหรับพนักงานทุกท่าน
          </p>
        </div>
      </div>
      <div className="w-full max-w-5xl mx-auto px-4 mt-0 animate-fade-in flex-1">
        <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl p-8">
          <div className="flex justify-between items-center mb-6">
            <div className="text-xl font-bold text-blue-900 flex items-center gap-2">
              <Newspaper className="w-6 h-6 text-blue-600" />
              ประกาศสำคัญของบริษัท
            </div>
            {isAdmin && (
              <Dialog open={addOpen} onOpenChange={setAddOpen}>
                <DialogTrigger asChild>
                  <button
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition-all duration-200"
                  >
                    <Plus className="w-5 h-5" /> เพิ่มข่าวสาร
                  </button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-blue-900 mb-2 flex items-center gap-2">
                      <Newspaper className="w-6 h-6 text-blue-600" />
                      เพิ่มข่าวสารบริษัท
                    </DialogTitle>
                  </DialogHeader>
                  <form className="space-y-4 mt-2" onSubmit={handleAddNews}>
                    <div>
                      <label className="block text-blue-800 font-semibold mb-1">วันที่ประกาศ</label>
                      <input
                        type="date"
                        className="w-full rounded-lg border border-blue-200 px-3 py-2 text-base focus:ring-2 focus:ring-blue-400"
                        value={form.date}
                        onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-blue-800 font-semibold mb-1">หัวข้อ</label>
                      <input
                        type="text"
                        className="w-full rounded-lg border border-blue-200 px-3 py-2 text-base focus:ring-2 focus:ring-blue-400"
                        value={form.title}
                        onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-blue-800 font-semibold mb-1">รายละเอียด</label>
                      <textarea
                        className="w-full rounded-lg border border-blue-200 px-3 py-2 text-base focus:ring-2 focus:ring-blue-400"
                        value={form.detail}
                        onChange={e => setForm(f => ({ ...f, detail: e.target.value }))}
                        rows={4}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-blue-800 font-semibold mb-1">ผู้ประกาศ</label>
                      <input
                        type="text"
                        className="w-full rounded-lg border border-blue-200 px-3 py-2 text-base focus:ring-2 focus:ring-blue-400"
                        value={form.author}
                        onChange={e => setForm(f => ({ ...f, author: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                      <button
                        type="button"
                        className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold"
                        onClick={() => setAddOpen(false)}
                      >
                        ยกเลิก
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                      >
                        บันทึก
                      </button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
          <div className="overflow-x-auto rounded-xl">
            <Table className="min-w-full bg-white rounded-xl">
              <TableHeader>
                <TableRow className="bg-blue-100 text-blue-900 text-lg">
                  <TableHead className="p-4 text-center">วันที่ประกาศ</TableHead>
                  <TableHead className="p-4 text-center">หัวข้อ</TableHead>
                  <TableHead className="p-4 text-center">รายละเอียด</TableHead>
                  <TableHead className="p-4 text-center">ผู้ประกาศ</TableHead>
                  {isAdmin && <TableHead className="p-4 text-center">ลบ</TableHead>}
                  <TableHead className="p-4 text-center">เพิ่มเติม</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockNews.map((news, idx) => (
                  <TableRow key={idx} className="hover:bg-blue-50 text-base">
                    <TableCell className="p-4 text-center font-medium">{news.date}</TableCell>
                    <TableCell className="p-4 text-center font-semibold text-blue-800">{news.title}</TableCell>
                    <TableCell className="p-4 text-center">{news.detail}</TableCell>
                    <TableCell className="p-4 text-center">{news.author}</TableCell>
                    {isAdmin && (
                      <TableCell className="p-4 text-center">
                        <button
                          className="p-2 rounded-full bg-red-100 hover:bg-red-200 text-red-600 shadow transition"
                          onClick={() => alert('TODO: ลบข่าวสารนี้')}
                          aria-label="ลบข่าว"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </TableCell>
                    )}
                    <TableCell className="p-4 text-center">
                      <Dialog open={openIdx === idx} onOpenChange={open => setOpenIdx(open ? idx : null)}>
                        <DialogTrigger asChild>
                          <button
                            className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold rounded-lg shadow transition"
                          >
                            ดูรายละเอียด
                          </button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle className="text-2xl font-bold text-blue-900 mb-2 flex items-center gap-2">
                              <Newspaper className="w-6 h-6 text-blue-600" />
                              {news.title}
                            </DialogTitle>
                            <DialogDescription>
                              <div className="space-y-2 mt-2">
                                <div><span className="font-semibold text-blue-800">วันที่ประกาศ:</span> {news.date}</div>
                                <div><span className="font-semibold text-blue-800">รายละเอียด:</span> {news.detail}</div>
                                <div><span className="font-semibold text-blue-800">ผู้ประกาศ:</span> {news.author}</div>
                              </div>
                            </DialogDescription>
                          </DialogHeader>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
      {/* Footer */}
      <footer className="w-full mt-16 py-8 bg-gradient-to-r from-blue-100 via-indigo-50 to-white text-center text-gray-400 text-base font-medium shadow-inner flex flex-col items-center gap-2">
        <img src="/lovable-uploads/siamit.png" alt="Logo" className="w-10 h-10 rounded-full mx-auto mb-1" />
        &copy; {new Date().getFullYear()} Siam IT Leave Management System
      </footer>
    </div>
  );
} 