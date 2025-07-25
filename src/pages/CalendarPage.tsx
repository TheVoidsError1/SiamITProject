import React from 'react';
import { Calendar, Building2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

const CalendarPage = () => {
  const { t } = useTranslation();
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
            ปฎิทิน
          </h1>
          <p className="text-lg md:text-xl text-blue-900/70 mb-2 font-medium text-center max-w-2xl">
            เลือกดูปฎิทินประจำปี หรือปฎิทินกิจกรรมบริษัท
          </p>
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl">
          <Card
            className="cursor-pointer hover:scale-105 transition-transform duration-200 shadow-xl bg-white/80 backdrop-blur rounded-2xl p-8 flex flex-col items-center text-center"
            onClick={() => navigate('/calendar/annual')}
          >
            <CardContent className="flex flex-col items-center">
              <Calendar className="w-16 h-16 text-blue-500 mb-4" />
              <div className="text-2xl font-bold text-blue-900 mb-2">ปฎิทินประจำปี</div>
              <div className="text-base text-blue-500">ดูวันหยุดราชการและวันสำคัญตลอดทั้งปี</div>
            </CardContent>
          </Card>
          <Card
            className="cursor-pointer hover:scale-105 transition-transform duration-200 shadow-xl bg-white/80 backdrop-blur rounded-2xl p-8 flex flex-col items-center text-center"
            onClick={() => navigate('/calendar/company')}
          >
            <CardContent className="flex flex-col items-center">
              <Building2 className="w-16 h-16 text-indigo-500 mb-4" />
              <div className="text-2xl font-bold text-blue-900 mb-2">ปฎิทินทางบริษัท</div>
              <div className="text-base text-blue-500">ดูปฎิทินกิจกรรมและวันสำคัญของบริษัท</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CalendarPage; 