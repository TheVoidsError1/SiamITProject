import React from 'react';
import { useTranslation } from 'react-i18next';
import { Send, Shield, Users, Calendar, FileText } from 'lucide-react';
import { AdminLeaveForm } from '@/components/leave/AdminLeaveForm';

const AdminLeaveRequest = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="relative w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-black/10">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30px_30px,rgba(255,255,255,0.1)_2px,transparent_2px)] bg-[length:60px_60px]"></div>
        </div>
        
        <div className="relative z-10 flex flex-col items-center justify-center py-16 md:py-20">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-4 bg-white/20 rounded-full backdrop-blur-sm">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <img 
              src="/lovable-uploads/siamit.png" 
              alt={t('common.logo')} 
              className="w-16 h-16 rounded-full bg-white/90 shadow-2xl border-4 border-white" 
            />
          </div>
          
          <h1 className="text-4xl md:text-5xl font-extrabold text-white drop-shadow-lg mb-4 flex items-center gap-3">
            <Send className="w-10 h-10 text-blue-200" aria-hidden="true" />
            {t('leave.adminLeaveRequest')}
          </h1>
          
          <p className="text-lg md:text-xl text-blue-100 font-medium text-center max-w-3xl leading-relaxed">
            {t('leave.adminLeaveRequestDesc')}
          </p>
          
          {/* Feature Icons */}
          <div className="flex items-center gap-8 mt-8">
            <div className="flex items-center gap-2 text-blue-100">
              <Users className="w-5 h-5" />
              <span className="text-sm font-medium">{t('leave.employeeSelection')}</span>
            </div>
            <div className="flex items-center gap-2 text-blue-100">
              <Calendar className="w-5 h-5" />
              <span className="text-sm font-medium">{t('leave.dateManagement')}</span>
            </div>
            <div className="flex items-center gap-2 text-blue-100">
              <FileText className="w-5 h-5" />
              <span className="text-sm font-medium">{t('leave.approvalControl')}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="w-full max-w-6xl mx-auto px-4 py-8 md:py-12">
        <div className="relative">
          {/* Decorative Elements */}
          <div className="absolute -top-4 -left-4 w-8 h-8 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full opacity-20"></div>
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full opacity-20"></div>
          <div className="absolute -bottom-4 -left-8 w-12 h-12 bg-gradient-to-r from-indigo-400 to-blue-500 rounded-full opacity-10"></div>
          
          <AdminLeaveForm mode="create" />
        </div>
      </div>
      
      {/* Footer */}
      <footer className="w-full mt-16 py-12 bg-gradient-to-r from-gray-50 via-blue-50 to-indigo-50 border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-4 mb-4">
            <img 
              src="/lovable-uploads/siamit.png" 
              alt={t('common.logo')} 
              className="w-12 h-12 rounded-full shadow-lg" 
            />
            <div>
              <div className="font-bold text-gray-700 text-lg">{t('footer.systemName')}</div>
              <div className="text-sm text-gray-500">{t('footer.copyright')}</div>
            </div>
          </div>
          
          <div className="text-sm text-gray-400 mt-4">
            <p>{t('footer.poweredBy')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AdminLeaveRequest;
