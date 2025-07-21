import LanguageSwitcher from '@/components/LanguageSwitcher';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

// Mock data for demonstration
// Remove mockDepartments

const ManageAll: React.FC = () => {
  const { t, i18n } = useTranslation();
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
  const [leaveTypeForm, setLeaveTypeForm] = useState<{ name_en: string; name_th: string }>({ name_en: '', name_th: '' });
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
  const handleDepartmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDepartmentForm({ ...departmentForm, [e.target.name]: e.target.value });
  };
  // Helper to fetch departments
  const fetchDepartments = () => {
    fetch('http://localhost:3001/api/departments')
      .then(res => res.json())
      .then(data => {
        if ((data.success || data.status === 'success') && Array.isArray(data.data)) {
          // รองรับทั้งกรณีที่ backend ส่ง array ของ string หรือ object
          setDepartments(data.data.map((d: any) =>
            typeof d === 'string'
              ? { department_name_th: d, department_name_en: d, id: d }
              : d
          ));
        }
      });
  };
  const handleDepartmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingDepartmentId) {
      // TODO: Implement update logic
      setEditingDepartmentId(null);
    } else {
      await fetch('http://localhost:3001/api/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          department_name_en: departmentForm.name_en,
          department_name_th: departmentForm.name_th
        })
      });
      fetchDepartments();
    }
    setDepartmentForm({ name_en: '', name_th: '' });
  };
  const handleEditDepartment = (id: string) => {
    const dep = departments.find(dep => dep.id === id);
    if (dep) {
      setDepartmentForm({ name_en: dep.department_name_en, name_th: dep.department_name_th });
      setEditingDepartmentId(id);
    }
  };
  const handleDeleteDepartment = async (id: string) => {
    await fetch(`http://localhost:3001/api/departments/${id}`, {
      method: 'DELETE',
    });
    fetchDepartments();
  };

  // Leave type handlers
  const handleLeaveTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLeaveTypeForm({ ...leaveTypeForm, [e.target.name]: e.target.value });
  };
  const handleEditLeaveType = (id: string) => {
    const lt = leaveTypes.find(lt => lt.id === id);
    if (lt) {
      setLeaveTypeForm({ name_en: lt.leave_type_en, name_th: lt.leave_type_th });
      setEditingLeaveTypeId(id);
    }
  };
  const handleDeleteLeaveType = async (id: string) => {
    await fetch(`http://localhost:3001/api/leave-types/${id}`, {
      method: 'DELETE',
    });
    // Refresh leave types
    fetch('http://localhost:3001/api/leave-types')
      .then(res => res.json())
      .then(data => {
        if ((data.success || data.status === 'success') && Array.isArray(data.data)) {
          setLeaveTypes(data.data);
        }
      });
  };
  const handleLeaveTypeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingLeaveTypeId) {
      // Update leave type
      await fetch(`http://localhost:3001/api/leave-types/${editingLeaveTypeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leave_type_en: leaveTypeForm.name_en,
          leave_type_th: leaveTypeForm.name_th
        })
      });
      setEditingLeaveTypeId(null);
      // Refresh leave types
      fetch('http://localhost:3001/api/leave-types')
        .then(res => res.json())
        .then(data => {
          if ((data.success || data.status === 'success') && Array.isArray(data.data)) {
            setLeaveTypes(data.data);
          }
        });
    } else {
      await fetch('http://localhost:3001/api/leave-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leave_type_en: leaveTypeForm.name_en,
          leave_type_th: leaveTypeForm.name_th
        })
      });
      // Refresh leave types
      fetch('http://localhost:3001/api/leave-types')
        .then(res => res.json())
        .then(data => {
          if ((data.success || data.status === 'success') && Array.isArray(data.data)) {
            setLeaveTypes(data.data);
          }
        });
    }
    setLeaveTypeForm({ name_en: '', name_th: '' });
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
    // Map quotas to backend format
    const quotasForBackend: Record<string, number> = {};
    filteredLeaveTypes.forEach(lt => {
      if (inlineEdit.quotas[lt.id] !== undefined) {
        quotasForBackend[lt.id] = inlineEdit.quotas[lt.id];
      }
    });
    console.log('Submitting quotasForBackend:', quotasForBackend);
    const res = await fetch(`http://localhost:3001/api/positions-with-quotas/${inlineEdit.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        position_name_en: inlineEdit.name_en,
        position_name_th: inlineEdit.name_th,
        quotas: quotasForBackend
      })
    });
    const data = await res.json();
    if (!res.ok) {
      setInlineEditError(data.message || 'Unknown error');
      return;
    }
    // Refresh positions
    fetch('http://localhost:3001/api/positions-with-quotas')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.data)) {
          setPositions(data.data);
        }
      });
    setInlineEdit(null);
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
    const res = await fetch(`http://localhost:3001/api/departments/${inlineDepartmentEdit.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        department_name_en: inlineDepartmentEdit.name_en,
        department_name_th: inlineDepartmentEdit.name_th
      })
    });
    const data = await res.json();
    if (!res.ok) {
      setInlineDepartmentError(data.message || 'Unknown error');
      return;
    }
    fetchDepartments();
    setInlineDepartmentEdit(null);
  };

  // Add state for inline editing leave type
  const [inlineLeaveTypeEdit, setInlineLeaveTypeEdit] = useState<null | { id: string; name_en: string; name_th: string }>(null);
  const [inlineLeaveTypeError, setInlineLeaveTypeError] = useState<string | null>(null);

  const startInlineLeaveTypeEdit = (lt: any) => {
    setInlineLeaveTypeEdit({ id: lt.id, name_en: lt.leave_type_en, name_th: lt.leave_type_th });
  };
  const cancelInlineLeaveTypeEdit = () => setInlineLeaveTypeEdit(null);
  const handleInlineLeaveTypeEditChange = (field: string, value: string) => {
    if (!inlineLeaveTypeEdit) return;
    setInlineLeaveTypeEdit({ ...inlineLeaveTypeEdit, [field]: value });
  };
  const saveInlineLeaveTypeEdit = async () => {
    if (!inlineLeaveTypeEdit) return;
    setInlineLeaveTypeError(null);
    const res = await fetch(`http://localhost:3001/api/leave-types/${inlineLeaveTypeEdit.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        leave_type_en: inlineLeaveTypeEdit.name_en,
        leave_type_th: inlineLeaveTypeEdit.name_th
      })
    });
    const data = await res.json();
    if (!res.ok) {
      setInlineLeaveTypeError(data.message || 'Unknown error');
      return;
    }
    // Refresh leave types
    fetch('http://localhost:3001/api/leave-types')
      .then(res => res.json())
      .then(data => {
        if ((data.success || data.status === 'success') && Array.isArray(data.data)) {
          setLeaveTypes(data.data);
        }
      });
    setInlineLeaveTypeEdit(null);
  };

  // Fetch positions with quotas on mount
  useEffect(() => {
    fetch('http://localhost:3001/api/positions-with-quotas')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.data)) {
          setPositions(data.data);
          // Remove code that sets leaveTypes here
          // LeaveTypes should only be set from /api/leave-types
        }
      });
  }, []);

  // Fetch departments and leave types with new structure
  useEffect(() => {
    fetchDepartments();
    fetch('http://localhost:3001/api/leave-types')
      .then(res => res.json())
      .then(data => {
        if ((data.success || data.status === 'success') && Array.isArray(data.data)) {
          setLeaveTypes(data.data.map((lt: any) => ({
            ...lt,
            leave_type_en: lt.leave_type_en || lt.leave_type,
            leave_type_th: lt.leave_type_th || lt.leave_type
          })));
        }
      });
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
    if (editingPositionId) {
      // TODO: Implement update logic
      setEditingPositionId(null);
    } else {
      try {
        // Map leaveTypeId to value for backend
        const quotasForBackend: Record<string, number> = {};
        filteredLeaveTypes.forEach(lt => {
          if (positionForm.quotas[lt.id] !== undefined) {
            quotasForBackend[lt.id] = positionForm.quotas[lt.id];
          }
        });
        const res = await fetch('http://localhost:3001/api/positions-with-quotas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            position_name_en: positionForm.name_en,
            position_name_th: positionForm.name_th,
            quotas: quotasForBackend
          })
        });
        const data = await res.json();
        if (!res.ok) {
          setPositionError(data.message || 'Unknown error');
          return;
        }
        // Refresh positions
        fetch('http://localhost:3001/api/positions-with-quotas')
          .then(res => res.json())
          .then(data => {
            if (data.success && Array.isArray(data.data)) {
              setPositions(data.data);
            }
          });
        setPositionForm({ name_en: '', name_th: '', quotas: {} });
      } catch (err: any) {
        setPositionError(err.message || 'Unknown error');
      }
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
    await fetch(`http://localhost:3001/api/positions-with-quotas/${id}`, {
      method: 'DELETE',
    });
    // Refresh positions
    fetch('http://localhost:3001/api/positions-with-quotas')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.data)) {
          setPositions(data.data);
        }
      });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="border-b bg-white/80 backdrop-blur-sm">
        <div className="flex h-16 items-center px-4 gap-4">
          <SidebarTrigger />
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{t('navigation.manageAll')}</h1>
            <p className="text-sm text-gray-600">{t('main.manageAllDesc')}</p>
          </div>
          <LanguageSwitcher />
        </div>
      </div>
      <div className="p-6 animate-fade-in">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <Tabs key={i18n.language} defaultValue="positions" className="w-full">
              <TabsList className="mb-6 grid w-full grid-cols-3 max-w-md">
                <TabsTrigger value="positions">{t('positions.positions')}</TabsTrigger>
                <TabsTrigger value="departments">{t('departments.departments')}</TabsTrigger>
                <TabsTrigger value="leaveTypes">{t('leave.leaveType', 'Leave Types')}</TabsTrigger>
              </TabsList>
              <TabsContent value="positions">
                <div className="rounded-2xl shadow overflow-hidden mb-8">
                  <div className="bg-blue-600 px-6 py-3">
                    <h2 className="text-lg font-bold text-white">{t('positions.positions')}</h2>
                  </div>
                  <div className="p-6">
                    <form onSubmit={handlePositionSubmit} className="mb-6 bg-blue-50 rounded-xl p-6 shadow-sm flex flex-col gap-4">
                      <div className="flex flex-col md:flex-row gap-4">
                        <Input name="name_en" value={positionForm.name_en} onChange={handlePositionChange} placeholder={t('positions.position', 'Position') + ' (EN)'} required className="md:w-64" />
                        <Input name="name_th" value={positionForm.name_th} onChange={handlePositionChange} placeholder={t('positions.position', 'Position') + ' (TH)'} required className="md:w-64" />
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mt-2">
                        {filteredLeaveTypes.map(lt => (
                          <div key={lt.id} className="flex flex-col">
                            <label className="text-sm font-medium text-gray-700 mb-1">{lang === 'th' ? lt.leave_type_th : lt.leave_type_en}</label>
                            <Input
                              type="number"
                              min={0}
                              name={`quota_${lt.id}`}
                              value={positionForm.quotas[lt.id] || ''}
                              onChange={e => handleQuotaChange(lt.id, e.target.value)}
                              className="w-full"
                              required
                            />
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-end mt-4">
                        <Button type="submit" className="btn-primary w-fit">{editingPositionId ? t('common.update', 'Update') : t('common.add', 'Add')}</Button>
                      </div>
                      {positionError && (
                        <div className="text-red-600 font-semibold mt-2">{positionError}</div>
                      )}
                    </form>
                    <div className="overflow-x-auto rounded-xl shadow">
                      <table className="w-full table-auto bg-white rounded-xl">
                        <thead>
                          <tr className="bg-blue-100 text-blue-900">
                            <th className="p-3">{t('positions.position', 'Position')} (EN)</th>
                            <th className="p-3">{t('positions.position', 'Position')} (TH)</th>
                            {filteredLeaveTypes.map(lt => (
                              <th key={lt.id} className="p-3">{lang === 'th' ? lt.leave_type_th : lt.leave_type_en}</th>
                            ))}
                            <th className="p-3">{t('common.actions', 'Actions')}</th>
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
                                  <td className="p-3 flex gap-2">
                                    <Button variant="outline" onClick={saveInlineEdit}>{t('common.save', 'Save')}</Button>
                                    <Button variant="destructive" onClick={cancelInlineEdit}>{t('common.cancel', 'Cancel')}</Button>
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
                                  <td className="p-3 flex gap-2">
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
                    <h2 className="text-lg font-bold text-white">{t('departments.departments')}</h2>
                  </div>
                  <div className="p-6">
                    <form onSubmit={handleDepartmentSubmit} className="mb-6 flex gap-2 items-end bg-blue-50 rounded-xl p-6 shadow-sm">
                      <Input name="name_en" value={departmentForm.name_en} onChange={handleDepartmentChange} placeholder={t('departments.departments', 'Department') + ' (EN)'} required className="md:w-64" />
                      <Input name="name_th" value={departmentForm.name_th} onChange={handleDepartmentChange} placeholder={t('departments.departments', 'Department') + ' (TH)'} required className="md:w-64" />
                      <Button type="submit" className="btn-primary">{editingDepartmentId ? t('common.update', 'Update') : t('common.add', 'Add')}</Button>
                    </form>
                    <div className="overflow-x-auto rounded-xl shadow">
                      <table className="w-full table-auto bg-white rounded-xl">
                        <thead>
                          <tr className="bg-blue-100 text-blue-900">
                            <th className="p-3 text-left w-1/3">{t('departments.departments', 'Department')} (EN)</th>
                            <th className="p-3 text-left w-1/3">{t('departments.departments', 'Department')} (TH)</th>
                            <th className="p-3 text-center w-1/3">{t('common.actions', 'Actions')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {departments.map(dep => (
                            <tr key={dep.id} className="hover:bg-blue-50">
                              {inlineDepartmentEdit && inlineDepartmentEdit.id === dep.id ? (
                                <>
                                  <td className="p-3 font-medium text-left align-middle">
                                    <Input value={inlineDepartmentEdit.name_en} onChange={e => handleInlineDepartmentEditChange('name_en', e.target.value)} className="w-32" />
                                  </td>
                                  <td className="p-3 font-medium text-left align-middle">
                                    <Input value={inlineDepartmentEdit.name_th} onChange={e => handleInlineDepartmentEditChange('name_th', e.target.value)} className="w-32" />
                                  </td>
                                  <td className="p-3 flex gap-2 justify-center align-middle">
                                    <Button variant="outline" onClick={saveInlineDepartmentEdit}>{t('common.save', 'Save')}</Button>
                                    <Button variant="destructive" onClick={cancelInlineDepartmentEdit}>{t('common.cancel', 'Cancel')}</Button>
                                  </td>
                                </>
                              ) : (
                                <>
                                  <td className="p-3 font-medium text-left align-middle">{dep.department_name_en}</td>
                                  <td className="p-3 font-medium text-left align-middle">{dep.department_name_th}</td>
                                  <td className="p-3 flex gap-2 justify-center align-middle">
                                    <Button variant="outline" onClick={() => startInlineDepartmentEdit(dep)}>{t('common.edit', 'Edit')}</Button>
                                    <Button variant="destructive" onClick={() => handleDeleteDepartment(dep.id)}>{t('common.delete', 'Delete')}</Button>
                                  </td>
                                </>
                              )}
                            </tr>
                          ))}
                          {inlineDepartmentEdit && inlineDepartmentError && (
                            <tr><td colSpan={3} className="text-red-600 font-semibold mt-2 text-center">{inlineDepartmentError}</td></tr>
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
                    <form onSubmit={handleLeaveTypeSubmit} className="mb-6 flex gap-2 items-end bg-blue-50 rounded-xl p-6 shadow-sm">
                      <Input name="name_en" value={leaveTypeForm.name_en} onChange={handleLeaveTypeChange} placeholder={t('leave.leaveType', 'Leave Type') + ' (EN)'} required className="md:w-64" />
                      <Input name="name_th" value={leaveTypeForm.name_th} onChange={handleLeaveTypeChange} placeholder={t('leave.leaveType', 'Leave Type') + ' (TH)'} required className="md:w-64" />
                      <Button type="submit" className="btn-primary">{editingLeaveTypeId ? t('common.update', 'Update') : t('common.add', 'Add')}</Button>
                    </form>
                    <div className="overflow-x-auto rounded-xl shadow">
                      <table className="w-full table-auto bg-white rounded-xl">
                        <thead>
                          <tr className="bg-blue-100 text-blue-900">
                            <th className="p-3 text-left w-1/3">{t('leave.leaveType', 'Leave Type')} (EN)</th>
                            <th className="p-3 text-left w-1/3">{t('leave.leaveType', 'Leave Type')} (TH)</th>
                            <th className="p-3 text-center w-1/3">{t('common.actions', 'Actions')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {leaveTypes.map(lt => (
                            <tr key={lt.id} className="hover:bg-blue-50">
                              {inlineLeaveTypeEdit && inlineLeaveTypeEdit.id === lt.id ? (
                                <>
                                  <td className="p-3 font-medium text-left align-middle">
                                    <Input value={inlineLeaveTypeEdit.name_en} onChange={e => handleInlineLeaveTypeEditChange('name_en', e.target.value)} className="w-32" />
                                  </td>
                                  <td className="p-3 font-medium text-left align-middle">
                                    <Input value={inlineLeaveTypeEdit.name_th} onChange={e => handleInlineLeaveTypeEditChange('name_th', e.target.value)} className="w-32" />
                                  </td>
                                  <td className="p-3 flex gap-2 justify-center align-middle">
                                    <Button variant="outline" onClick={saveInlineLeaveTypeEdit}>{t('common.save', 'Save')}</Button>
                                    <Button variant="destructive" onClick={cancelInlineLeaveTypeEdit}>{t('common.cancel', 'Cancel')}</Button>
                                  </td>
                                </>
                              ) : (
                                <>
                                  <td className="p-3 font-medium text-left align-middle">{lt.leave_type_en}</td>
                                  <td className="p-3 font-medium text-left align-middle">{lt.leave_type_th}</td>
                                  <td className="p-3 flex gap-2 justify-center align-middle">
                                    <Button variant="outline" onClick={() => startInlineLeaveTypeEdit(lt)}>{t('common.edit', 'Edit')}</Button>
                                    <Button variant="destructive" onClick={() => handleDeleteLeaveType(lt.id)}>{t('common.delete', 'Delete')}</Button>
                                  </td>
                                </>
                              )}
                            </tr>
                          ))}
                          {inlineLeaveTypeEdit && inlineLeaveTypeError && (
                            <tr><td colSpan={3} className="text-red-600 font-semibold mt-2 text-center">{inlineLeaveTypeError}</td></tr>
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
      </div>
    </div>
  );
};

export default ManageAll; 