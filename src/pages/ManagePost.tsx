import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/contexts/AuthContext';
import { getImageUrl, handleImageError } from '@/lib/utils';
import { ArrowLeft, Calendar, Clock, Download, Eye, FileText, Image, Newspaper, Plus, Trash2, User, Edit, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';


const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function ManagePost() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const [newsList, setNewsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<any>(null);
  const [form, setForm] = useState({
    subject: '',
    detail: '',
    // createdBy, createdAt จะใส่ตอน submit
    Image: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);


  // State สำหรับ Image Preview แบบ LeaveHistory
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showImagePreview, setShowImagePreview] = useState(false);


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
      console.log('=== Fetch News Response ===');
      console.log('API Response:', data);
      if (data.data && data.data.length > 0) {
        console.log('First news item:', data.data[0]);
        console.log('Image field:', data.data[0].Image);
      }
      console.log('==========================');
      
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
    console.log('=== ManagePost Component Loaded ===');
    console.log('API_BASE_URL:', API_BASE_URL);
    console.log('Current user:', user);
    console.log('===============================');
    fetchNews();
    // eslint-disable-next-line
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // เพิ่มข่าวสารใหม่
  const handleAddNews = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('subject', form.subject);
      formData.append('detail', form.detail);
      formData.append('createdBy', user?.full_name || '');
      formData.append('createdAt', new Date().toISOString());
      
      if (selectedFile) {
        formData.append('Image', selectedFile);
      }

      const res = await fetch(`${API_BASE_URL}/api/announcements`, {
        method: 'POST',
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
        },
        body: formData,
      });
      const data = await res.json();
      if (data.status === 'success') {
        setAddOpen(false);
        setForm({ subject: '', detail: '', Image: '' });
        setSelectedFile(null);
        setImagePreview(null);
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

  // เปิดฟอร์มแก้ไขข่าวสาร
  const handleEditNews = (news: any) => {
    setEditingNews(news);
    setForm({
      subject: news.subject,
      detail: news.detail,
      Image: news.Image || '',
    });
    setSelectedFile(null);
    setImagePreview(news.Image ? getImageUrl(news.Image, API_BASE_URL) : null);
    setEditOpen(true);
  };

  // แก้ไขข่าวสาร
  const handleUpdateNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNews) return;
    
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('subject', form.subject);
      formData.append('detail', form.detail);
      formData.append('createdBy', user?.full_name || '');
      
      if (selectedFile) {
        formData.append('Image', selectedFile);
      }

      const res = await fetch(`${API_BASE_URL}/api/announcements/${editingNews.id}`, {
        method: 'PUT',
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
        },
        body: formData,
      });
      const data = await res.json();
      if (data.status === 'success') {
        setEditOpen(false);
        setEditingNews(null);
        setForm({ subject: '', detail: '', Image: '' });
        setSelectedFile(null);
        setImagePreview(null);
        fetchNews();
      } else {
        setError(data.message || 'แก้ไขข่าวสารไม่สำเร็จ');
      }
    } catch (err) {
      setError('แก้ไขข่าวสารไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };



  // ฟังก์ชันสำหรับเปิด Image Preview Dialog
  const openImagePreview = (imageName: string) => {
    const imageUrl = getImageUrl(imageName, API_BASE_URL);
    setSelectedImage(imageUrl);
    setShowImagePreview(true);
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
        
        {/* Navigation Controls */}
        <div className="relative z-20 flex justify-start items-center px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 px-4 py-2 bg-white/90 hover:bg-white text-blue-700 font-semibold rounded-xl shadow-lg transition-all duration-200 backdrop-blur-sm border border-blue-200 hover:border-blue-300"
            >
              <ArrowLeft className="w-5 h-5" />
              ย้อนกลับ
            </button>
          </div>
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center py-10 md:py-16">
          <img src="/lovable-uploads/siamit.png" alt="Logo" className="w-24 h-24 rounded-full bg-white/80 shadow-2xl border-4 border-white mb-4" />
          <h1 className="text-4xl md:text-5xl font-extrabold text-indigo-900 drop-shadow mb-2 flex items-center gap-3">
            <Newspaper className="w-8 h-8 text-blue-600" />
            {t('companyNews.managePosts')}
          </h1>
          <p className="text-lg md:text-xl text-blue-900/70 mb-2 font-medium text-center max-w-2xl">
            {t('companyNews.managePostsDesc')}
          </p>
        </div>
      </div>
      <div className="w-full max-w-5xl mx-auto px-4 mt-0 animate-fade-in flex-1">
        <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl p-8">
          <div className="flex justify-between items-center mb-6">
            <div className="text-xl font-bold text-blue-900 flex items-center gap-2">
              <Newspaper className="w-6 h-6 text-blue-600" />
              {t('companyNews.managePosts')}
            </div>
            {isAdmin && (
              <Dialog open={addOpen} onOpenChange={setAddOpen}>
                <DialogTrigger asChild>
                  <button
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition-all duration-200"
                  >
                    <Plus className="w-5 h-5" /> {t('companyNews.addNews')}
                  </button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-blue-900 mb-2 flex items-center gap-2">
                      <Newspaper className="w-6 h-6 text-blue-600" />
                      {t('companyNews.addNews')}
                    </DialogTitle>
                  </DialogHeader>
                  <form className="space-y-4 mt-2" onSubmit={handleAddNews}>
                    <div>
                      <label className="block text-blue-800 font-semibold mb-1">{t('companyNews.subject')}</label>
                      <Input
                        type="text"
                        value={form.subject}
                        onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                        placeholder={t('companyNews.subject')}
                        required
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-blue-800 font-semibold mb-1">
                        {t('companyNews.detail')} 
                        <span className="text-sm text-gray-500 ml-2">
                          ({form.detail.length}/500)
                        </span>
                      </label>
                      <textarea
                        className="w-full rounded-lg border border-blue-200 px-3 py-2 text-base focus:ring-2 focus:ring-blue-400 resize-none"
                        value={form.detail}
                        onChange={e => setForm(f => ({ ...f, detail: e.target.value }))}
                        rows={6}
                        maxLength={500}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-blue-800 font-semibold mb-1">
                        {t('announcementsFeed.attachedImage')}
                      </label>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <label className="flex items-center justify-center w-10 h-10 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg cursor-pointer transition-colors border border-blue-200 hover:border-blue-300">
                            <Image className="w-5 h-5" />
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleFileSelect}
                              className="hidden"
                            />
                          </label>
                          {selectedFile && (
                            <span className="text-sm text-green-600 font-medium">
                              ✓ {selectedFile.name}
                            </span>
                          )}
                        </div>
                        {imagePreview && (
                          <div className="relative">
                            <img
                              src={imagePreview}
                              alt="Preview"
                              className="w-full max-h-48 object-cover rounded-lg border border-gray-200"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedFile(null);
                                setImagePreview(null);
                              }}
                              className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
                            >
                              ×
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                      <button
                        type="button"
                        className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold"
                        onClick={() => setAddOpen(false)}
                      >
                        {t('common.cancel')}
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                        disabled={loading}
                      >
                        {loading ? t('companyNews.saving') : t('companyNews.save')}
                      </button>
                    </div>
                    {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
                  </form>
                </DialogContent>
              </Dialog>
            )}

            {/* Edit News Dialog */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-blue-900 mb-2 flex items-center gap-2">
                    <Edit className="w-6 h-6 text-blue-600" />
                    แก้ไขข่าวสาร
                  </DialogTitle>
                </DialogHeader>
                <form className="space-y-4 mt-2" onSubmit={handleUpdateNews}>
                  <div>
                    <label className="block text-blue-800 font-semibold mb-1">{t('companyNews.subject')}</label>
                    <Input
                      type="text"
                      value={form.subject}
                      onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                      placeholder={t('companyNews.subject')}
                      required
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-blue-800 font-semibold mb-1">
                      {t('companyNews.detail')} 
                      <span className="text-sm text-gray-500 ml-2">
                        ({form.detail.length}/500)
                      </span>
                    </label>
                    <textarea
                      className="w-full rounded-lg border border-blue-200 px-3 py-2 text-base focus:ring-2 focus:ring-blue-400 resize-none"
                      value={form.detail}
                      onChange={e => setForm(f => ({ ...f, detail: e.target.value }))}
                      rows={6}
                      maxLength={500}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-blue-800 font-semibold mb-1">
                      {t('announcementsFeed.attachedImage')}
                    </label>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <label className="flex items-center justify-center w-10 h-10 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg cursor-pointer transition-colors border border-blue-200 hover:border-blue-300">
                          <Image className="w-5 h-5" />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="hidden"
                          />
                        </label>
                        {selectedFile && (
                          <span className="text-sm text-green-600 font-medium">
                            ✓ {selectedFile.name}
                          </span>
                        )}
                      </div>
                      {imagePreview && (
                        <div className="relative">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-full max-h-48 object-cover rounded-lg border border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedFile(null);
                              setImagePreview(null);
                            }}
                            className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
                          >
                            ×
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <button
                      type="button"
                      className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold"
                      onClick={() => setEditOpen(false)}
                    >
                      {t('common.cancel')}
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                      disabled={loading}
                    >
                      {loading ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
                    </button>
                  </div>
                  {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
                </form>
              </DialogContent>
            </Dialog>
          </div>
          <div className="overflow-x-auto rounded-xl">
            <Table className="min-w-full bg-white rounded-xl">
              <TableHeader>
                <TableRow className="bg-blue-100 text-blue-900 text-lg">
                  <TableHead className="p-4 text-center">{t('companyNews.subject')}</TableHead>
                  <TableHead className="p-4 text-center">{t('companyNews.detail')}</TableHead>
                  <TableHead className="p-4 text-center">{t('companyNews.createdBy')}</TableHead>
                  {isAdmin && <TableHead className="p-4 text-center">{t('companyNews.edit')}</TableHead>}
                  {isAdmin && <TableHead className="p-4 text-center">{t('companyNews.delete')}</TableHead>}
                  <TableHead className="p-4 text-center">{t('companyNews.addMore')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={isAdmin ? 6 : 4} className="text-center">{t('common.loading')}</TableCell></TableRow>
                ) : newsList.length === 0 ? (
                  <TableRow><TableCell colSpan={isAdmin ? 6 : 4} className="text-center">{t('companyNews.noNews')}</TableCell></TableRow>
                ) : newsList.map((news, idx) => (
                  <TableRow key={news.id} className="hover:bg-blue-50 text-base">
                    <TableCell className="p-4 text-center font-semibold text-blue-800">{news.subject}</TableCell>
                    <TableCell className="p-4 text-center">
                      {news.detail.length > 25 
                        ? `${news.detail.substring(0, 25)}...` 
                        : news.detail
                      }
                    </TableCell>
                    <TableCell className="p-4 text-center">{news.createdBy}</TableCell>
                    {isAdmin && (
                      <TableCell className="p-4 text-center">
                        <button
                          className="p-2 rounded-full bg-yellow-100 hover:bg-yellow-200 text-yellow-600 shadow transition"
                          onClick={() => handleEditNews(news)}
                          aria-label={t('companyNews.edit')}
                          disabled={loading}
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                      </TableCell>
                    )}
                    {isAdmin && (
                      <TableCell className="p-4 text-center">
                        <button
                          className="p-2 rounded-full bg-red-100 hover:bg-red-200 text-red-600 shadow transition"
                          onClick={() => handleDeleteNews(news.id)}
                          aria-label={t('companyNews.delete')}
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
                            {t('companyNews.viewDetail')}
                          </button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto animate-scale-in">
                          <DialogHeader>
                            <DialogTitle className="flex items-center">
                              <div className="flex items-center gap-3">
                                <span className="text-2xl font-bold text-blue-600">
                                  {t('common.viewDetails')}
                                </span>
                                <div className="flex flex-wrap gap-2">
                                  <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                                    <Newspaper className="w-3 h-3 mr-1" />
                                    {t('companyNews.news')}
                                  </Badge>
                                </div>
                              </div>
                            </DialogTitle>
                          </DialogHeader>
                          
                          {news && (
                            <div className="space-y-6">
                              {/* Header Section */}
                              <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50">
                                <CardContent className="p-6">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                      <div className="text-3xl font-bold text-blue-900">
                                        {news.subject}
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-sm text-gray-500">{t('companyNews.publishedOn')}</div>
                                      <div className="text-lg font-semibold text-blue-600">
                                        {new Date(news.createdAt).toLocaleDateString('th-TH', {
                                          year: 'numeric',
                                          month: 'short',
                                          day: 'numeric'
                                        })}
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>

                              {/* Main Information Grid */}
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Left Column - News Details */}
                                <Card className="border-0 shadow-md">
                                  <CardHeader className="pb-3">
                                    <div className="flex items-center gap-2">
                                      <FileText className="w-5 h-5 text-orange-600" />
                                      <h3 className="text-lg font-semibold">{t('companyNews.detail')}</h3>
                                    </div>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="p-4 bg-orange-50 rounded-lg">
                                      <p className="text-orange-900 leading-relaxed">
                                        {news.detail || t('companyNews.noDetailProvided', 'ไม่มีรายละเอียด')}
                                      </p>
                                    </div>
                                  </CardContent>
                                </Card>

                                {/* Right Column - Publisher Info */}
                                <Card className="border-0 shadow-md">
                                  <CardHeader className="pb-3">
                                    <div className="flex items-center gap-2">
                                      <User className="w-5 h-5 text-indigo-600" />
                                      <h3 className="text-lg font-semibold">{t('companyNews.publisher')}</h3>
                                    </div>
                                  </CardHeader>
                                  <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                      <Label className="text-sm font-medium text-gray-600">{t('companyNews.publishedBy')}</Label>
                                      <div className="flex items-center gap-2 p-3 bg-indigo-50 rounded-lg">
                                        <User className="w-4 h-4 text-indigo-500" />
                                        <span className="font-medium text-indigo-900">{news.createdBy}</span>
                                      </div>
                                    </div>
                                    <div className="space-y-2">
                                      <Label className="text-sm font-medium text-gray-600">{t('companyNews.publishedDate')}</Label>
                                      <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                                        <Calendar className="w-4 h-4 text-green-500" />
                                        <span className="font-medium text-green-900">
                                          {new Date(news.createdAt).toLocaleDateString('th-TH', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                          })}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="space-y-2">
                                      <Label className="text-sm font-medium text-gray-600">{t('companyNews.publishedTime')}</Label>
                                      <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                                        <Clock className="w-4 h-4 text-blue-500" />
                                        <span className="font-medium text-blue-900">
                                          {new Date(news.createdAt).toLocaleTimeString('th-TH', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                          })}
                                        </span>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>

                              {/* Contact Information */}
                              {news.contact && (
                                <Card className="border-0 shadow-md">
                                  <CardHeader className="pb-3">
                                    <div className="flex items-center gap-2">
                                      <User className="w-5 h-5 text-teal-600" />
                                      <h3 className="text-lg font-semibold">{t('leave.contactInformation', 'Contact Information')}</h3>
                                    </div>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="p-4 bg-teal-50 rounded-lg">
                                      <p className="text-teal-900 font-medium">{news.contact}</p>
                                    </div>
                                  </CardContent>
                                </Card>
                              )}

                              {/* Attachments Section */}
                              {(news.Image || news.attachments) && (
                                <Card className="border-0 shadow-md">
                                  <CardHeader className="pb-3">
                                    <div className="flex items-center gap-2">
                                      <Image className="w-5 h-5 text-purple-600" />
                                      <h3 className="text-lg font-semibold">ไฟล์แนบ</h3>
                                      <Badge variant="secondary" className="ml-2">
                                        {((news.Image ? 1 : 0) + (news.attachments ? news.attachments.length : 0))} ไฟล์
                                      </Badge>
                                    </div>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                      {/* Image Display */}
                                      {news.Image && (
                                        <div className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-all duration-300 hover:shadow-md">
                                          <div className="space-y-3">
                                            <div className="relative group cursor-pointer" onClick={() => openImagePreview(news.Image)}>
                                              <img
                                                src={getImageUrl(news.Image, API_BASE_URL)}
                                                alt="News Image"
                                                className="w-full h-32 object-cover rounded-lg border transition-all duration-300 group-hover:scale-105"
                                                onError={(e) => handleImageError(e, news.Image, API_BASE_URL)}
                                              />
                                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 rounded-lg flex items-center justify-center">
                                                <div className="opacity-0 group-hover:opacity-100 transition-all duration-300">
                                                  <Eye className="w-8 h-8 text-white" />
                                                </div>
                                              </div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                              <span className="text-sm text-gray-600 truncate flex-1 mr-2">
                                                {(() => {
                                                  const fullName = news.Image.split('/').pop() || news.Image;
                                                  if (fullName.startsWith('announcement-')) {
                                                    const parts = fullName.split('-');
                                                    if (parts.length >= 3) {
                                                      return parts.slice(2).join('-');
                                                    }
                                                  }
                                                  return fullName;
                                                })()}
                                              </span>
                                              <div className="flex gap-1">
                                                <Button 
                                                  size="sm" 
                                                  variant="outline"
                                                  onClick={() => openImagePreview(news.Image)}
                                                  className="text-xs px-2 py-1"
                                                >
                                                  {t('common.view')}
                                                </Button>
                                                <Button 
                                                  size="sm" 
                                                  variant="outline"
                                                  onClick={() => {
                                                    const imageUrl = getImageUrl(news.Image, API_BASE_URL);
                                                    const link = document.createElement('a');
                                                    link.href = imageUrl;
                                                    link.download = news.Image.split('/').pop() || news.Image;
                                                    link.click();
                                                  }}
                                                  className="text-xs px-2 py-1"
                                                >
                                                  {t('common.download')}
                                                </Button>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      )}

                                      {/* File Attachments */}
                                      {news.attachments && news.attachments.length > 0 && (
                                        <>
                                          {news.attachments.map((attachment: any, index: number) => {
                                            const fileName = attachment.filename || attachment.name || `file-${index + 1}`;
                                            const fileExtension = fileName.split('.').pop()?.toLowerCase();
                                            const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension || '');
                                            
                                            return (
                                              <div key={index} className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-all duration-300 hover:shadow-md">
                                                {isImage ? (
                                                  <div className="space-y-3">
                                                    <div className="relative group cursor-pointer" onClick={() => openImagePreview(fileName)}>
                                                      <img 
                                                        src={getImageUrl(fileName, API_BASE_URL)} 
                                                        alt={fileName}
                                                        className="w-full h-32 object-cover rounded-lg border transition-all duration-300 group-hover:scale-105"
                                                        onError={(e) => handleImageError(e, fileName, API_BASE_URL)}
                                                      />
                                                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 rounded-lg flex items-center justify-center">
                                                        <div className="opacity-0 group-hover:opacity-100 transition-all duration-300">
                                                          <Eye className="w-8 h-8 text-white" />
                                                        </div>
                                                      </div>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                      <span className="text-sm text-gray-600 truncate flex-1 mr-2">{fileName}</span>
                                                      <div className="flex gap-1">
                                                        <Button 
                                                          size="sm" 
                                                          variant="outline"
                                                          onClick={() => openImagePreview(fileName)}
                                                          className="text-xs px-2 py-1"
                                                        >
                                                          {t('common.view')}
                                                        </Button>
                                                        <Button 
                                                          size="sm" 
                                                          variant="outline"
                                                          onClick={() => {
                                                            const fileUrl = getImageUrl(fileName, API_BASE_URL);
                                                            const link = document.createElement('a');
                                                            link.href = fileUrl;
                                                            link.download = fileName;
                                                            link.click();
                                                          }}
                                                          className="text-xs px-2 py-1"
                                                        >
                                                          {t('common.download')}
                                                        </Button>
                                                      </div>
                                                    </div>
                                                  </div>
                                                ) : (
                                                  <div className="space-y-3">
                                                    <div className="w-full h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                                                      <FileText className="w-8 h-8 text-gray-400" />
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                      <span className="text-sm text-gray-600 truncate flex-1 mr-2">{fileName}</span>
                                                      <div className="flex gap-1">
                                                        <Button 
                                                          size="sm" 
                                                          variant="outline"
                                                          onClick={() => {
                                                            const fileUrl = getImageUrl(fileName, API_BASE_URL);
                                                            window.open(fileUrl, '_blank');
                                                          }}
                                                          className="text-xs px-2 py-1"
                                                        >
                                                          {t('common.view')}
                                                        </Button>
                                                        <Button 
                                                          size="sm" 
                                                          variant="outline"
                                                          onClick={() => {
                                                            const fileUrl = getImageUrl(fileName, API_BASE_URL);
                                                            const link = document.createElement('a');
                                                            link.href = fileUrl;
                                                            link.download = fileName;
                                                            link.click();
                                                          }}
                                                          className="text-xs px-2 py-1"
                                                        >
                                                          {t('common.download')}
                                                        </Button>
                                                      </div>
                                                    </div>
                                                  </div>
                                                )}
                                              </div>
                                            );
                                          })}
                                        </>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>
                              )}

                            </div>
                          )}
                          <DialogFooter className="pt-6 border-t">
                            <Button variant="outline" onClick={() => setOpenIdx(null)} className="btn-press hover-glow">
                              {t('common.close')}
                            </Button>
                          </DialogFooter>
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
        &copy; {new Date().getFullYear()} {t('common.companyName')}
      </footer>

      {/* Image Preview Dialog */}
      <Dialog open={showImagePreview} onOpenChange={setShowImagePreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0 bg-black/95">
          <DialogHeader className="absolute top-4 right-4 z-10">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowImagePreview(false)}
              className="bg-white/20 text-white border-white/30 hover:bg-white/30"
            >
              <X className="w-4 h-4" />
            </Button>
          </DialogHeader>
          
          {selectedImage && (
            <div className="flex items-center justify-center h-full p-4">
              <img 
                src={selectedImage} 
                alt="Preview"
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 