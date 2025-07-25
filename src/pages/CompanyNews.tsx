import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SidebarTrigger } from '@/components/ui/sidebar';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { Newspaper, Plus, Trash2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function CompanyNews() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const [newsList, setNewsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({
    subject: '',
    detail: '',
    // createdBy, createdAt จะใส่ตอน submit
    Image: '',
  });

  // โหลดข่าวสารจาก backend
  const fetchNews = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/announcements`, {
        headers: { Authorization: token ? `Bearer ${token}` : undefined },
      });
      const data = await res.json();
      if (data.status === 'success') {
        setNewsList(data.data.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      } else {
        setNewsList([]);
        setError(data.message || 'เกิดข้อผิดพลาด');
      }
    } catch (err) {
      setNewsList([]);
      setError('โหลดข่าวสารไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
    // eslint-disable-next-line
  }, []);

  // เพิ่มข่าวสารใหม่
  const handleAddNews = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const body = {
        subject: form.subject,
        detail: form.detail,
        Image: form.Image,
        createdBy: user?.full_name || '',
        createdAt: new Date().toISOString(),
      };
      const res = await fetch(`${API_BASE_URL}/api/announcements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : undefined,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.status === 'success') {
        setAddOpen(false);
        setForm({ subject: '', detail: '', Image: '' });
        fetchNews();
      } else {
        setError(data.message || 'บันทึกข่าวสารไม่สำเร็จ');
      }
    } catch (err) {
      setError('บันทึกข่าวสารไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  // ลบข่าวสาร
  const handleDeleteNews = async (id: string) => {
    if (!window.confirm('ยืนยันการลบข่าวสารนี้?')) return;
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/announcements/${id}`, {
        method: 'DELETE',
        headers: { Authorization: token ? `Bearer ${token}` : undefined },
      });
      const data = await res.json();
      if (data.status === 'success') {
        fetchNews();
      } else {
        setError(data.message || 'ลบข่าวสารไม่สำเร็จ');
      }
    } catch (err) {
      setError('ลบข่าวสารไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
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
                      <label className="block text-blue-800 font-semibold mb-1">หัวข้อ</label>
                      <input
                        type="text"
                        className="w-full rounded-lg border border-blue-200 px-3 py-2 text-base focus:ring-2 focus:ring-blue-400"
                        value={form.subject}
                        onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
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
                    {/* <div>
                      <label className="block text-blue-800 font-semibold mb-1">รูปภาพ (URL)</label>
                      <input
                        type="text"
                        className="w-full rounded-lg border border-blue-200 px-3 py-2 text-base focus:ring-2 focus:ring-blue-400"
                        value={form.Image}
                        onChange={e => setForm(f => ({ ...f, Image: e.target.value }))}
                      />
                    </div> */}
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
                        disabled={loading}
                      >
                        {loading ? 'กำลังบันทึก...' : 'บันทึก'}
                      </button>
                    </div>
                    {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
          <div className="overflow-x-auto rounded-xl">
            <Table className="min-w-full bg-white rounded-xl">
              <TableHeader>
                <TableRow className="bg-blue-100 text-blue-900 text-lg">
                  <TableHead className="p-4 text-center">หัวข้อ</TableHead>
                  <TableHead className="p-4 text-center">รายละเอียด</TableHead>
                  <TableHead className="p-4 text-center">ผู้ประกาศ</TableHead>
                  {isAdmin && <TableHead className="p-4 text-center">ลบ</TableHead>}
                  <TableHead className="p-4 text-center">เพิ่มเติม</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="text-center">กำลังโหลด...</TableCell></TableRow>
                ) : newsList.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center">ไม่มีข่าวสาร</TableCell></TableRow>
                ) : newsList.map((news, idx) => (
                  <TableRow key={news.id} className="hover:bg-blue-50 text-base">
                    <TableCell className="p-4 text-center font-semibold text-blue-800">{news.subject}</TableCell>
                    <TableCell className="p-4 text-center">{news.detail}</TableCell>
                    <TableCell className="p-4 text-center">{news.createdBy}</TableCell>
                    {isAdmin && (
                      <TableCell className="p-4 text-center">
                        <button
                          className="p-2 rounded-full bg-red-100 hover:bg-red-200 text-red-600 shadow transition"
                          onClick={() => handleDeleteNews(news.id)}
                          aria-label="ลบข่าว"
                          disabled={loading}
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
                              {news.subject}
                            </DialogTitle>
                            <DialogDescription>
                              <div className="space-y-2 mt-2">
                                <div><span className="font-semibold text-blue-800">รายละเอียด:</span> {news.detail}</div>
                                <div><span className="font-semibold text-blue-800">ผู้ประกาศ:</span> {news.createdBy}</div>
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
            {error && <div className="text-red-500 text-center mt-2">{error}</div>}
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