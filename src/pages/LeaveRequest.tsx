
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Send } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LeaveForm } from "@/components/leave/LeaveForm";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const LeaveRequest = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="border-b bg-white/80 backdrop-blur-sm">
        <div className="flex h-16 items-center px-4 gap-4">
          <SidebarTrigger />
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{t('leave.leaveRequest')}</h1>
            <p className="text-sm text-gray-600">
              {t('main.fillCompleteInfo')}
            </p>
          </div>
          <LanguageSwitcher />
        </div>
      </div>

      <div className="p-6 animate-fade-in">
        <Card className="max-w-2xl mx-auto border-0 shadow-lg">
          <CardHeader className="gradient-bg text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <Send className="w-5 h-5" />
              {t('leave.leaveForm')}
            </CardTitle>
            <CardDescription className="text-blue-100">
              {t('main.fillCompleteInfo')}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <LeaveForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LeaveRequest;
