import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { apiService, apiEndpoints } from '@/lib/api';
import { showToastMessage } from '@/lib/toast';



// Mock data for demonstration
// Remove mockDepartments

const ManageAll: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

  const lang = i18n.language.startsWith('th') ? 'th' : 'en';
  // Position state
  const [positions, setPositions] = useState<any[]>([]);
  const [positionForm, setPositionForm] = useState<{ name_en: string; name_th: string; quotas: Record<string, number> }>({ name_en: '', name_th: '', quotas: {} });
  const [editingPositionId, setEditingPositionId] = useState<string | null>(null);
  const [positionError, setPositionError] = useState<string | null>(null);

  // Department state
  const [departments, setDepartments] = useState<any[]>([]);
  const [departmentForm, setDepartmentForm] = useState<{ name_en: string; name_th: string }>({ name_en: '', name_th: '' });
  const [editingDepartmentId, setEditingDepartmentId] = useState<string | null>(null);

  // Leave type state
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [leaveTypeForm, setLeaveTypeForm] = useState<{ name_en: string; name_th: string; require_attachment: boolean }>({ name_en: '', name_th: '', require_attachment: false });
  const [editingLeaveTypeId, setEditingLeaveTypeId] = useState<string | null>(null);

  // Add state for inline editing
  const [inlineEdit, setInlineEdit] = useState<null | {
    id: string;
    name_en: string;
    name_th: string;
    quotas: Record<string, number>;
  }> (null);

  // Add state for inline editing error
  const [inlineEditError, setInlineEditError] = useState<string | null>(null);

  // Department handlers
  const [inlineDepartmentEdit, setInlineDepartmentEdit] = useState<null | { id: string; name_en: string; name_th: string }>(null);
  const [inlineDepartmentError, setInlineDepartmentError] = useState<string | null>(null);
  
  // Delete confirmation states
  const [deletePositionDialog, setDeletePositionDialog] = useState<{ open: boolean; position: any | null }>({ open: false, position: null });
  const [deleteDepartmentDialog, setDeleteDepartmentDialog] = useState<{ open: boolean; department: any | null }>({ open: false, department: null });
  const [deleteLeaveTypeDialog, setDeleteLeaveTypeDialog] = useState<{ open: boolean; leaveType: any | null }>({ open: false, leaveType: null });
  const handleDepartmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDepartmentForm({ ...departmentForm, [e.target.name]: e.target.value });
  };
  // Helper to fetch departments
  const fetchDepartments = async () => {
    try {
      const data = await apiService.get(apiEndpoints.departments);
      if ((data.success || data.status === 'success') && Array.isArray(data.data)) {
        // รองรับทั้งกรณีที่ backend ส่ง array ของ string หรือ object
        setDepartments(data.data.map((d: any) =>
          typeof d === 'string'
            ? { department_name_th: d, department_name_en: d, id: d }
            : d
        ));
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
      setDepartments([]);
    }
  };
  const handleDepartmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDepartmentId) {
        // TODO: Implement update logic
        setEditingDepartmentId(null);
      } else {
        await apiService.post(apiEndpoints.departments, {
          department_name_en: departmentForm.name_en,
          department_name_th: departmentForm.name_th
        });
        await fetchDepartments();
        showToastMessage.crud.createSuccess('department');
      }
      setDepartmentForm({ name_en: '', name_th: '' });
    } catch (error) {
      showToastMessage.crud.createError('department');
    }
  };
  const handleEditDepartment = (id: string) => {
    const dep = departments.find(dep => dep.id === id);
    if (dep) {
      setDepartmentForm({ name_en: dep.department_name_en, name_th: dep.department_name_th });
      setEditingDepartmentId(id);
    }
  };
  const handleDeleteDepartment = async (id: string) => {
    const department = departments.find(dep => dep.id === id);
    if (department) {
      setDeleteDepartmentDialog({ open: true, department });
    }
  };

  const confirmDeleteDepartment = async () => {
    if (!deleteDepartmentDialog.department) return;
    
    try {
      await apiService.delete(`${apiEndpoints.departments}/${deleteDepartmentDialog.department.id}`);
      await fetchDepartments();
      setDeleteDepartmentDialog({ open: false, department: null });
      showToastMessage.crud.deleteSuccess('department');
    } catch (error) {
      showToastMessage.crud.deleteError('department');
    }
  };

  // Leave type handlers
  const handleLeaveTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setLeaveTypeForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  const handleEditLeaveType = (id: string) => {
    const lt = leaveTypes.find(lt => lt.id === id);
    if (lt) {
      setLeaveTypeForm({ name_en: lt.leave_type_en, name_th: lt.leave_type_th, require_attachment: !!lt.require_attachment });
      setEditingLeaveTypeId(id);
    }
  };
  const handleDeleteLeaveType = async (id: string) => {
    const leaveType = leaveTypes.find(lt => lt.id === id);
    if (leaveType) {
      setDeleteLeaveTypeDialog({ open: true, leaveType });
    }
  };

  const confirmDeleteLeaveType = async () => {
    if (!deleteLeaveTypeDialog.leaveType) return;
    
    try {
      await apiService.delete(`${apiEndpoints.leaveTypes}/${deleteLeaveTypeDialog.leaveType.id}`);
      // Refresh leave types
      const data = await apiService.get(apiEndpoints.leaveTypes);
      if ((data.success || data.status === 'success') && Array.isArray(data.data)) {
        setLeaveTypes(data.data);
      }
      setDeleteLeaveTypeDialog({ open: false, leaveType: null });
      showToastMessage.crud.deleteSuccess('leaveType');
    } catch (error) {
      showToastMessage.crud.deleteError('leaveType');
    }
  };
  const handleLeaveTypeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingLeaveTypeId) {
        // Update leave type
        await apiService.put(`${apiEndpoints.leaveTypes}/${editingLeaveTypeId}`, {
          leave_type_en: leaveTypeForm.name_en,
          leave_type_th: leaveTypeForm.name_th,
          require_attachment: leaveTypeForm.require_attachment
        });
        setEditingLeaveTypeId(null);
        showToastMessage.crud.updateSuccess('leaveType');
      } else {
        await apiService.post(apiEndpoints.leaveTypes, {
          leave_type_en: leaveTypeForm.name_en,
          leave_type_th: leaveTypeForm.name_th,
          require_attachment: leaveTypeForm.require_attachment
        });
        showToastMessage.crud.createSuccess('leaveType');
      }
      // Refresh leave types
      const data = await apiService.get(apiEndpoints.leaveTypes);
      if ((data.success || data.status === 'success') && Array.isArray(data.data)) {
        setLeaveTypes(data.data);
      }
      setLeaveTypeForm({ name_en: '', name_th: '', require_attachment: false });
    } catch (error) {
      if (editingLeaveTypeId) {
        showToastMessage.crud.updateError('leaveType');
      } else {
        showToastMessage.crud.createError('leaveType');
      }
    }
  };

  const startInlineEdit = (pos: any) => {
    // Map quotas to { [leaveTypeId]: value }
    const quotas: Record<string, number> = {};
    pos.quotas.forEach((q: any) => { quotas[q.leaveTypeId] = q.quota; });
    setInlineEdit({
      id: pos.id,
      name_en: pos.position_name_en,
      name_th: pos.position_name_th,
      quotas
    });
  };
  const cancelInlineEdit = () => setInlineEdit(null);
  const handleInlineEditChange = (field: string, value: string) => {
    if (!inlineEdit) return;
    setInlineEdit({ ...inlineEdit, [field]: value });
  };
  const handleInlineQuotaChange = (leaveTypeId: string, value: string) => {
    if (!inlineEdit) return;
    setInlineEdit({ ...inlineEdit, quotas: { ...inlineEdit.quotas, [leaveTypeId]: Number(value) } });
  };
  const saveInlineEdit = async () => {
    if (!inlineEdit) return;
    setInlineEditError(null);
    try {
      // Map quotas to backend format
      const quotasForBackend: Record<string, number> = {};
      filteredLeaveTypes.forEach(lt => {
        if (inlineEdit.quotas[lt.id] !== undefined) {
          quotasForBackend[lt.id] = inlineEdit.quotas[lt.id];
        }
      });
      console.log('Submitting quotasForBackend:', quotasForBackend);
      const data = await apiService.put(`/api/positions-with-quotas/${inlineEdit.id}`, {
        position_name_en: inlineEdit.name_en,
        position_name_th: inlineEdit.name_th,
        quotas: quotasForBackend
      });
      if (!data || !data.success) {
        setInlineEditError(data?.message || 'Unknown error');
        return;
      }
      // Refresh positions
      const positionsData = await apiService.get('/api/positions-with-quotas');
      if (positionsData.success && Array.isArray(positionsData.data)) {
        setPositions(positionsData.data);
      }
      setInlineEdit(null);
      showToastMessage.crud.updateSuccess('position');
    } catch (error) {
      setInlineEditError('Failed to update position');
      showToastMessage.crud.updateError('position');
    }
  };

  const startInlineDepartmentEdit = (dep: any) => {
    setInlineDepartmentEdit({ id: dep.id, name_en: dep.department_name_en, name_th: dep.department_name_th });
  };
  const cancelInlineDepartmentEdit = () => setInlineDepartmentEdit(null);
  const handleInlineDepartmentEditChange = (field: string, value: string) => {
    if (!inlineDepartmentEdit) return;
    setInlineDepartmentEdit({ ...inlineDepartmentEdit, [field]: value });
  };
  const saveInlineDepartmentEdit = async () => {
    if (!inlineDepartmentEdit) return;
    setInlineDepartmentError(null);
    try {
      const data = await apiService.put(`${apiEndpoints.departments}/${inlineDepartmentEdit.id}`, {
        department_name_en: inlineDepartmentEdit.name_en,
        department_name_th: inlineDepartmentEdit.name_th
      });
      if (!data || !data.success) {
        setInlineDepartmentError(data?.message || 'Unknown error');
        return;
      }
      await fetchDepartments();
      setInlineDepartmentEdit(null);
      showToastMessage.crud.updateSuccess('department');
    } catch (error) {
      setInlineDepartmentError('Failed to update department');
      showToastMessage.crud.updateError('department');
    }
  };

  // Add state for inline editing leave type
  const [inlineLeaveTypeEdit, setInlineLeaveTypeEdit] = useState<null | { id: string; name_en: string; name_th: string; require_attachment: boolean }>(null);
  const [inlineLeaveTypeError, setInlineLeaveTypeError] = useState<string | null>(null);

  const startInlineLeaveTypeEdit = (lt: any) => {
    setInlineLeaveTypeEdit({ id: lt.id, name_en: lt.leave_type_en, name_th: lt.leave_type_th, require_attachment: !!lt.require_attachment });
  };
  const cancelInlineLeaveTypeEdit = () => setInlineLeaveTypeEdit(null);
  const handleInlineLeaveTypeEditChange = (field: string, value: string) => {
    if (!inlineLeaveTypeEdit) return;
    setInlineLeaveTypeEdit({ ...inlineLeaveTypeEdit, [field]: value });
  };
  const saveInlineLeaveTypeEdit = async () => {
    if (!inlineLeaveTypeEdit) return;
    setInlineLeaveTypeError(null);
    try {
      const data = await apiService.put(`${apiEndpoints.leaveTypes}/${inlineLeaveTypeEdit.id}`, {
        leave_type_en: inlineLeaveTypeEdit.name_en,
        leave_type_th: inlineLeaveTypeEdit.name_th,
        require_attachment: inlineLeaveTypeEdit.require_attachment
      });
      if (!data || !data.success) {
        setInlineLeaveTypeError(data?.message || 'Unknown error');
        return;
      }
      // Refresh leave types
      const leaveTypesData = await apiService.get(apiEndpoints.leaveTypes);
      if ((leaveTypesData.success || leaveTypesData.status === 'success') && Array.isArray(leaveTypesData.data)) {
        setLeaveTypes(leaveTypesData.data);
      }
      setInlineLeaveTypeEdit(null);
      showToastMessage.crud.updateSuccess('leaveType');
    } catch (error) {
      setInlineLeaveTypeError('Failed to update leave type');
      showToastMessage.crud.updateError('leaveType');
    }
  };

  // Fetch positions with quotas on mount
  useEffect(() => {
    const fetchPositions = async () => {
      try {
        const data = await apiService.get('/api/positions-with-quotas');
        if (data.success && Array.isArray(data.data)) {
          setPositions(data.data);
        }
      } catch (error) {
        console.error('Error fetching positions:', error);
        setPositions([]);
      }
    };
    fetchPositions();
  }, []);

  // Fetch departments and leave types with new structure
  useEffect(() => {
    const fetchData = async () => {
      try {
        await fetchDepartments();
        const data = await apiService.get(apiEndpoints.leaveTypes);
        if ((data.success || data.status === 'success') && Array.isArray(data.data)) {
          setLeaveTypes(data.data.map((lt: any) => ({
            ...lt,
            leave_type_en: lt.leave_type_en || lt.leave_type,
            leave_type_th: lt.leave_type_th || lt.leave_type
          })));
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setLeaveTypes([]);
      }
    };
    fetchData();
  }, []);

  // Position handlers
  const handlePositionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPositionForm({ ...positionForm, [e.target.name]: e.target.value });
  };
  // Change how quotas are built and handled for positions
  const handleQuotaChange = (leaveTypeId: string, value: string) => {
    setPositionForm({ ...positionForm, quotas: { ...positionForm.quotas, [leaveTypeId]: Number(value) } });
  };
  // Helper to filter out emergency leave types for position form/table only
  const filteredLeaveTypes = leaveTypes.filter(
    lt => lt.leave_type_en?.toLowerCase() !== 'emergency' && lt.leave_type_th !== 'ฉุกเฉิน'
  );

  // Debug: Log leave type keys for quota mapping
  console.log('Filtered leave types for quota:', filteredLeaveTypes.map(lt => ({ id: lt.id, leave_type: lt.leave_type, leave_type_en: lt.leave_type_en, leave_type_th: lt.leave_type_th })));
  const handlePositionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPositionError(null);
    try {
      if (editingPositionId) {
        // TODO: Implement update logic
        setEditingPositionId(null);
      } else {
        // Map leaveTypeId to value for backend
        const quotasForBackend: Record<string, number> = {};
        filteredLeaveTypes.forEach(lt => {
          if (positionForm.quotas[lt.id] !== undefined) {
            quotasForBackend[lt.id] = positionForm.quotas[lt.id];
          }
        });
        const data = await apiService.post('/api/positions-with-quotas', {
          position_name_en: positionForm.name_en,
          position_name_th: positionForm.name_th,
          quotas: quotasForBackend
        });
        if (!data || !data.success) {
          setPositionError(data?.message || 'Unknown error');
          return;
        }
        // Refresh positions
        const positionsData = await apiService.get('/api/positions-with-quotas');
        if (positionsData.success && Array.isArray(positionsData.data)) {
          setPositions(positionsData.data);
        }
        setPositionForm({ name_en: '', name_th: '', quotas: {} });
        showToastMessage.crud.createSuccess('position');
      }
    } catch (err: any) {
      setPositionError(err.message || 'Unknown error');
      showToastMessage.crud.createError('position');
    }
  };
  const handleEditPosition = (id: string) => {
    const pos = positions.find(pos => pos.id === id);
    if (pos) {
      setPositionForm({
        name_en: pos.position_name_en,
        name_th: pos.position_name_th,
        quotas: pos.quotas
      });
      setEditingPositionId(id);
    }
  };
  const handleDeletePosition = async (id: string) => {
    const position = positions.find(pos => pos.id === id);
    if (position) {
      setDeletePositionDialog({ open: true, position });
    }
  };

  const confirmDeletePosition = async () => {
    if (!deletePositionDialog.position) return;
    
    try {
      await apiService.delete(`/api/positions-with-quotas/${deletePositionDialog.position.id}`);
      // Refresh positions
      const data = await apiService.get('/api/positions-with-quotas');
      if (data.success && Array.isArray(data.data)) {
        setPositions(data.data);
      }
      setDeletePositionDialog({ open: false, position: null });
      showToastMessage.crud.deleteSuccess('position');
    } catch (error) {
      showToastMessage.crud.deleteError('position');
    }
  };

  // Add a handler for toggling require_attachment
  const handleToggleRequireAttachment = async (lt: any) => {
    const newValue = !lt.require_attachment;
    try {
      const data = await apiService.put(`${apiEndpoints.leaveTypes}/${lt.id}`, {
        leave_type_en: lt.leave_type_en,
        leave_type_th: lt.leave_type_th,
        require_attachment: newValue
      });
      if (!data || !data.success) throw new Error('Failed to update');
      setLeaveTypes(prev => prev.map(l => l.id === lt.id ? { ...l, require_attachment: newValue } : l));
      showToastMessage.crud.updateSuccess('leaveType');
    } catch (err: any) {
      showToastMessage.crud.updateError('leaveType', err.message);
    }
  };

  // ฟังก์ชันช่วยเลือกชื่อ position ตามภาษา
  const getPositionDisplayName = (position: any, lang: string) => {
    if (!position) return '';
    return lang === 'th' ? position.position_name_th : position.position_name_en;
  };
  // ฟังก์ชันช่วยเลือกชื่อ department ตามภาษา
  const getDepartmentDisplayName = (department: any, lang: string) => {
    if (!department) return '';
    return lang === 'th' ? department.department_name_th : department.department_name_en;
  };
  // ฟังก์ชันช่วยเลือกชื่อ leave type ตามภาษา
  const getLeaveTypeDisplayName = (leaveType: any, lang: string) => {
    if (!leaveType) return '';
    return lang === 'th' ? leaveType.leave_type_th : leaveType.leave_type_en;
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
            {t('navigation.manageAll')}
          </h1>
          <p className="text-lg md:text-xl text-blue-900/70 mb-2 font-medium text-center max-w-2xl">
            {t('main.manageAllDesc', 'Manage positions, departments, and leave types for your organization.')}
          </p>
        </div>
      </div>
      <div className="w-full max-w-6xl mx-auto px-4 mt-0 animate-fade-in flex-1">
        <div className="bg-white/70 backdrop-blur-md rounded-3xl shadow-2xl p-8">
          <Tabs defaultValue="positions" className="w-full">
            <TabsList className="mb-10 bg-indigo-50 rounded-2xl shadow-inner flex gap-4 justify-center py-3">
              <TabsTrigger value="positions" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg text-indigo-700 font-bold text-xl py-3 px-6 rounded-2xl transition-all flex items-center gap-2">
                <span role="img" aria-label="positions">🧑‍💼</span> {t('positions.positions', 'Positions')}
              </TabsTrigger>
              <TabsTrigger value="departments" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg text-indigo-700 font-bold text-xl py-3 px-6 rounded-2xl transition-all flex items-center gap-2">
                <span role="img" aria-label="departments">🏢</span> {t('departments.departments', 'Departments')}
              </TabsTrigger>
              <TabsTrigger value="leaveTypes" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg text-indigo-700 font-bold text-xl py-3 px-6 rounded-2xl transition-all flex items-center gap-2">
                <span role="img" aria-label="leaveTypes">📝</span> {t('leave.leaveType', 'Leave Types')}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="positions">
              <div className="rounded-2xl shadow overflow-hidden mb-8">
                <div className="bg-blue-600 px-6 py-3">
                  <h2 className="text-lg font-bold text-white">{t('positions.positions', 'Positions')}</h2>
                </div>
                <div className="p-6">
                  <form onSubmit={handlePositionSubmit} className="mb-6 flex flex-col gap-4 bg-blue-50 rounded-xl p-6 shadow-sm">
                    <div className="flex flex-col md:flex-row gap-4">
                      <Input name="name_en" value={positionForm.name_en} onChange={handlePositionChange} placeholder="Position (EN)" required className="flex-1" />
                      <Input name="name_th" value={positionForm.name_th} onChange={handlePositionChange} placeholder="Position (TH)" required className="flex-1" />
                    </div>
                    <div className="flex flex-col md:flex-row gap-4">
                      {filteredLeaveTypes.map(lt => (
                        <div key={lt.id} className="flex flex-col flex-1">
                          <label className="text-sm font-medium text-gray-700 mb-1">{lang === 'th' ? lt.leave_type_th : lt.leave_type_en}</label>
                          <Input
                            type="number"
                            min={0}
                            name={`quota_${lt.id}`}
                            value={positionForm.quotas[lt.id] || ''}
                            onChange={e => handleQuotaChange(lt.id, e.target.value)}
                            required
                          />
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-end mt-2">
                      <Button type="submit" className="btn-primary w-24">{editingPositionId ? t('common.update', 'Update') : t('common.add', 'Add')}</Button>
                    </div>
                    {positionError && (
                      <div className="text-red-600 font-semibold mt-2">{positionError}</div>
                    )}
                  </form>
                  <div className="overflow-x-auto rounded-xl shadow">
                    <table className="w-full table-auto bg-white rounded-xl">
                      <thead>
                        <tr className="bg-blue-100 text-blue-900">
                          <th className="p-3">{t('positions.position', 'ตำแหน่ง')} (EN)</th>
                          <th className="p-3">{t('positions.position', 'ตำแหน่ง')} (TH)</th>
                          {filteredLeaveTypes.map(lt => (
                            <th key={lt.id} className="p-3">{lang === 'th' ? lt.leave_type_th : lt.leave_type_en}</th>
                          ))}
                          <th className="p-3 text-center">{t('common.actions', 'Actions')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {positions.map(pos => (
                          <tr key={pos.id} className="hover:bg-blue-50">
                            {inlineEdit && inlineEdit.id === pos.id ? (
                              <>
                                <td className="p-3 font-medium">
                                  <Input value={inlineEdit.name_en} onChange={e => handleInlineEditChange('name_en', e.target.value)} className="w-32" />
                                </td>
                                <td className="p-3 font-medium">
                                  <Input value={inlineEdit.name_th} onChange={e => handleInlineEditChange('name_th', e.target.value)} className="w-32" />
                                </td>
                                {filteredLeaveTypes.map(lt => (
                                  <td key={lt.id} className="p-3">
                                    <Input
                                      type="number"
                                      min={0}
                                      value={inlineEdit.quotas[lt.id] || ''}
                                      onChange={e => handleInlineQuotaChange(lt.id, e.target.value)}
                                      className="w-20"
                                    />
                                  </td>
                                ))}
                                <td className="p-3 flex gap-2 justify-center">
                                  <Button variant="outline" onClick={saveInlineEdit}>Save</Button>
                                  <Button variant="destructive" onClick={cancelInlineEdit}>Cancel</Button>
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="p-3 font-medium">{pos.position_name_en}</td>
                                <td className="p-3 font-medium">{pos.position_name_th}</td>
                                {filteredLeaveTypes.map(lt => (
                                  <td key={lt.id} className="p-3">
                                    {pos.quotas.find((q: any) => q.leaveTypeId === lt.id)?.quota ?? ''}
                                  </td>
                                ))}
                                <td className="p-3 flex gap-2 justify-center">
                                  <Button variant="outline" onClick={() => startInlineEdit(pos)}>{t('common.edit', 'Edit')}</Button>
                                  <Button variant="destructive" onClick={() => handleDeletePosition(pos.id)}>{t('common.delete', 'Delete')}</Button>
                                </td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="departments">
              <div className="rounded-2xl shadow overflow-hidden mb-8">
                <div className="bg-blue-600 px-6 py-3">
                  <h2 className="text-lg font-bold text-white">{t('departments.departments', 'Departments')}</h2>
                </div>
                <div className="p-6">
                  <form onSubmit={handleDepartmentSubmit} className="mb-6 flex gap-2 items-end bg-blue-50 rounded-xl p-6 shadow-sm">
                    <Input name="name_en" value={departmentForm.name_en} onChange={handleDepartmentChange} placeholder="Department Name (EN)" required className="md:w-64" />
                    <Input name="name_th" value={departmentForm.name_th} onChange={handleDepartmentChange} placeholder="Department Name (TH)" required className="md:w-64" />
                    <Button type="submit" className="btn-primary">{editingDepartmentId ? t('common.update', 'Update') : t('common.add', 'Add')}</Button>
                  </form>
                  <div className="overflow-x-auto rounded-xl shadow">
                    <table className="w-full table-auto bg-white rounded-xl">
                      <thead>
                        <tr className="bg-blue-100 text-blue-900">
                          <th className="p-3">{t('departments.departments', 'แผนก')} (EN)</th>
                          <th className="p-3">{t('departments.departments', 'แผนก')} (TH)</th>
                          <th className="p-3 text-center">{t('common.actions', 'Actions')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {departments.map(dep => (
                          <tr key={dep.id} className="hover:bg-blue-50">
                            {inlineDepartmentEdit && inlineDepartmentEdit.id === dep.id ? (
                              <>
                                <td className="p-3 font-medium">
                                  <Input value={inlineDepartmentEdit.name_en} onChange={e => handleInlineDepartmentEditChange('name_en', e.target.value)} className="w-32" />
                                </td>
                                <td className="p-3 font-medium">
                                  <Input value={inlineDepartmentEdit.name_th} onChange={e => handleInlineDepartmentEditChange('name_th', e.target.value)} className="w-32" />
                                </td>
                                <td className="p-3 flex gap-2 justify-center">
                                  <Button variant="outline" onClick={saveInlineDepartmentEdit}>Save</Button>
                                  <Button variant="destructive" onClick={cancelInlineDepartmentEdit}>Cancel</Button>
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="p-3 font-medium">{dep.department_name_en}</td>
                                <td className="p-3 font-medium">{dep.department_name_th}</td>
                                <td className="p-3 flex gap-2 justify-center">
                                  <Button variant="outline" onClick={() => startInlineDepartmentEdit(dep)}>{t('common.edit', 'Edit')}</Button>
                                  <Button variant="destructive" onClick={() => handleDeleteDepartment(dep.id)}>{t('common.delete', 'Delete')}</Button>
                                </td>
                              </>
                            )}
                          </tr>
                        ))}
                        {inlineDepartmentEdit && inlineDepartmentError && (
                          <tr><td colSpan={3} className="text-red-600 font-semibold mt-2">{inlineDepartmentError}</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="leaveTypes">
              <div className="rounded-2xl shadow overflow-hidden mb-8">
                <div className="bg-blue-600 px-6 py-3">
                  <h2 className="text-lg font-bold text-white">{t('leave.leaveType', 'Leave Types')}</h2>
                </div>
                <div className="p-6">
                  <form onSubmit={handleLeaveTypeSubmit} className="mb-6 flex items-end bg-blue-50 rounded-xl p-6 shadow-sm">
                    <div className="flex flex-1 gap-2 items-end">
                      <Input name="name_en" value={leaveTypeForm.name_en} onChange={handleLeaveTypeChange} placeholder="Leave Type Name (EN)" required className="md:w-64" />
                      <Input name="name_th" value={leaveTypeForm.name_th} onChange={handleLeaveTypeChange} placeholder="Leave Type Name (TH)" required className="md:w-64" />
                      <div className="flex items-center gap-3 ml-2">
                        <input
                          type="checkbox"
                          name="require_attachment"
                          checked={leaveTypeForm.require_attachment}
                          onChange={e => setLeaveTypeForm(prev => ({ ...prev, require_attachment: e.target.checked }))}
                          className="accent-blue-600 h-5 w-5 rounded border-gray-300 focus:ring-2 focus:ring-blue-400 transition-all"
                          id="require-attachment-checkbox"
                        />
                        <label htmlFor="require-attachment-checkbox" className="text-base font-medium select-none cursor-pointer whitespace-nowrap">
                          {t('leave.requiresAttachment', 'Require Attachment')}
                        </label>
                      </div>
                    </div>
                    <div className="flex-1 flex justify-end">
                      <Button type="submit" className="btn-primary">{editingLeaveTypeId ? t('common.update', 'Update') : t('common.add', 'Add')}</Button>
                    </div>
                  </form>
                  <div className="overflow-x-auto rounded-xl shadow">
                    <table className="w-full table-auto bg-white rounded-xl">
                      <thead>
                        <tr className="bg-blue-100 text-blue-900">
                          <th className="p-3">{t('leave.leaveType', 'ประเภทการลา')} (EN)</th>
                          <th className="p-3">{t('leave.leaveType', 'ประเภทการลา')} (TH)</th>
                          <th className="p-3">{t('leave.requiresAttachment', 'Require Attachment')}</th>
                          <th className="p-3 text-center">{t('common.actions', 'Actions')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leaveTypes.map(lt => (
                          <tr key={lt.id} className="hover:bg-blue-50">
                            {inlineLeaveTypeEdit && inlineLeaveTypeEdit.id === lt.id ? (
                              <>
                                <td className="p-3 font-medium">
                                  <Input value={inlineLeaveTypeEdit.name_en} onChange={e => handleInlineLeaveTypeEditChange('name_en', e.target.value)} className="w-32" />
                                </td>
                                <td className="p-3 font-medium">
                                  <Input value={inlineLeaveTypeEdit.name_th} onChange={e => handleInlineLeaveTypeEditChange('name_th', e.target.value)} className="w-32" />
                                </td>
                                <td className="p-3 font-medium text-center">
                                  <label style={{ display: 'inline-block', position: 'relative', width: 40, height: 24 }}>
                                    <input
                                      type="checkbox"
                                      checked={inlineLeaveTypeEdit?.id === lt.id ? !!inlineLeaveTypeEdit.require_attachment : !!lt.require_attachment}
                                      onChange={inlineLeaveTypeEdit?.id === lt.id ? (e => setInlineLeaveTypeEdit(edit => edit ? { ...edit, require_attachment: e.target.checked } : edit)) : undefined}
                                      style={{ opacity: 0, width: 0, height: 0 }}
                                      tabIndex={-1}
                                      readOnly={inlineLeaveTypeEdit?.id !== lt.id}
                                    />
                                    <span
                                      style={{
                                        position: 'absolute',
                                        cursor: 'pointer',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        background: (inlineLeaveTypeEdit?.id === lt.id ? !!inlineLeaveTypeEdit.require_attachment : !!lt.require_attachment) ? '#64b5f6' : '#ccc',
                                        borderRadius: 24,
                                        transition: 'background 0.2s',
                                        display: 'block',
                                      }}
                                    >
                                      <span
                                        style={{
                                          position: 'absolute',
                                          left: (inlineLeaveTypeEdit?.id === lt.id ? !!inlineLeaveTypeEdit.require_attachment : !!lt.require_attachment) ? 20 : 2,
                                          top: 2,
                                          width: 20,
                                          height: 20,
                                          background: '#fff',
                                          borderRadius: '50%',
                                          transition: 'left 0.2s',
                                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                                        }}
                                      />
                                    </span>
                                  </label>
                                </td>
                                <td className="p-3 flex gap-2 justify-center">
                                  <Button variant="outline" onClick={saveInlineLeaveTypeEdit}>Save</Button>
                                  <Button variant="destructive" onClick={cancelInlineLeaveTypeEdit}>Cancel</Button>
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="p-3 font-medium">{lt.leave_type_en}</td>
                                <td className="p-3 font-medium">{lt.leave_type_th}</td>
                                <td className="p-3 font-medium text-center">
                                  <label style={{ display: 'inline-block', position: 'relative', width: 40, height: 24 }}>
                                    <input
                                      type="checkbox"
                                      checked={!!lt.require_attachment}
                                      onChange={() => handleToggleRequireAttachment(lt)}
                                      style={{ opacity: 0, width: 0, height: 0 }}
                                      tabIndex={-1}
                                    />
                                    <span
                                      style={{
                                        position: 'absolute',
                                        cursor: 'pointer',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        background: !!lt.require_attachment ? '#64b5f6' : '#ccc',
                                        borderRadius: 24,
                                        transition: 'background 0.2s',
                                        display: 'block',
                                      }}
                                    >
                                      <span
                                        style={{
                                          position: 'absolute',
                                          left: !!lt.require_attachment ? 20 : 2,
                                          top: 2,
                                          width: 20,
                                          height: 20,
                                          background: '#fff',
                                          borderRadius: '50%',
                                          transition: 'left 0.2s',
                                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                                        }}
                                      />
                                    </span>
                                  </label>
                                </td>
                                <td className="p-3 text-center">
                                  <div className="flex gap-2 justify-center">
                                    <Button variant="outline" onClick={() => startInlineLeaveTypeEdit(lt)}>{t('common.edit', 'Edit')}</Button>
                                    <Button variant="destructive" onClick={() => handleDeleteLeaveType(lt.id)}>{t('common.delete', 'Delete')}</Button>
                                  </div>
                                </td>
                              </>
                            )}
                          </tr>
                        ))}
                        {inlineLeaveTypeEdit && inlineLeaveTypeError && (
                          <tr><td colSpan={4} className="text-red-600 font-semibold mt-2">{inlineLeaveTypeError}</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Delete Confirmation Dialogs */}
      
      {/* Position Delete Confirmation */}
      <AlertDialog open={deletePositionDialog.open} onOpenChange={(open) => setDeletePositionDialog({ open, position: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.confirmDelete', 'ยืนยันการลบ')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('common.confirmDeletePosition', 'คุณต้องการลบตำแหน่ง')} "
              {getPositionDisplayName(deletePositionDialog.position, lang)}"
              {t('common.confirmDeleteQuestion', 'หรือไม่?')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel', 'ยกเลิก')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeletePosition} className="bg-red-600 hover:bg-red-700">
              {t('common.delete', 'ลบ')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Department Delete Confirmation */}
      <AlertDialog open={deleteDepartmentDialog.open} onOpenChange={(open) => setDeleteDepartmentDialog({ open, department: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.confirmDelete', 'ยืนยันการลบ')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('common.confirmDeleteDepartment', 'คุณต้องการลบแผนก')} "
              {getDepartmentDisplayName(deleteDepartmentDialog.department, lang)}"
              {t('common.confirmDeleteQuestion', 'หรือไม่?')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel', 'ยกเลิก')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteDepartment} className="bg-red-600 hover:bg-red-700">
              {t('common.delete', 'ลบ')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Leave Type Delete Confirmation */}
      <AlertDialog open={deleteLeaveTypeDialog.open} onOpenChange={(open) => setDeleteLeaveTypeDialog({ open, leaveType: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.confirmDelete', 'ยืนยันการลบ')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('common.confirmDeleteLeaveType', 'คุณต้องการลบประเภทการลา')} "
              {getLeaveTypeDisplayName(deleteLeaveTypeDialog.leaveType, lang)}"
              {t('common.confirmDeleteQuestion', 'หรือไม่?')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel', 'ยกเลิก')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteLeaveType} className="bg-red-600 hover:bg-red-700">
              {t('common.delete', 'ลบ')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Footer */}
      <footer className="w-full mt-16 py-8 bg-gradient-to-r from-blue-100 via-indigo-50 to-white text-center text-gray-400 text-base font-medium shadow-inner flex flex-col items-center gap-2">
        <img src="/lovable-uploads/siamit.png" alt="Logo" className="w-10 h-10 rounded-full mx-auto mb-1" />
        <div className="font-bold text-gray-600">{t('footer.systemName')}</div>
        <div className="text-sm">{t('footer.copyright')}</div>
      </footer>
    </div>
  );
};

export default ManageAll; 