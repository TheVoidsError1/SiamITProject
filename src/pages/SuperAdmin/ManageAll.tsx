import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import LanguageSwitcher from '@/components/LanguageSwitcher';
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
  const handleLeaveTypeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingLeaveTypeId) {
      // TODO: Implement update logic
      setEditingLeaveTypeId(null);
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
          if (data.success && Array.isArray(data.data)) {
            setLeaveTypes(data.data);
          }
        });
    }
    setLeaveTypeForm({ name_en: '', name_th: '' });
  };
  const handleEditLeaveType = (id: string) => {
    const lt = leaveTypes.find(lt => lt.id === id);
    if (lt) {
      setLeaveTypeForm({ name_en: lt.leave_type_en, name_th: lt.leave_type_th });
      setEditingLeaveTypeId(id);
    }
  };
  const handleDeleteLeaveType = (id: string) => {
    setLeaveTypes(leaveTypes.filter(lt => lt.id !== id));
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

  // Fetch positions with quotas on mount
  useEffect(() => {
    fetch('http://localhost:3001/api/positions-with-quotas')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.data)) {
          setPositions(data.data);
          // Collect all leave types from quotas (with id and names)
          const leaveTypeMap: Record<string, { id: string, leave_type_en: string, leave_type_th: string }> = {};
          data.data.forEach((pos: any) => {
            if (Array.isArray(pos.quotas)) {
              pos.quotas.forEach((q: any) => {
                if (q.leaveTypeId && (q.leave_type_en || q.leave_type_th)) {
                  leaveTypeMap[q.leaveTypeId] = {
                    id: q.leaveTypeId,
                    leave_type_en: q.leave_type_en || q.leave_type || '',
                    leave_type_th: q.leave_type_th || q.leave_type || ''
                  };
                }
              });
            }
          });
          // Filter out 'emergency' leave type (case-insensitive, both EN/TH)
          setLeaveTypes(Object.values(leaveTypeMap).filter(lt =>
            lt.leave_type_en.toLowerCase() !== 'emergency' &&
            lt.leave_type_th.toLowerCase() !== 'emergency'
          ));
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
  // Helper to filter out emergency leave types
  const filteredLeaveTypes = leaveTypes.filter(
    lt => (lt.leave_type_en?.toLowerCase?.() !== 'emergency' && lt.leave_type_th?.toLowerCase?.() !== 'emergency' && lt.leave_type?.toLowerCase?.() !== 'emergency')
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      {/* Page header */}
      <div className="w-full flex justify-end items-center pt-6 pr-8">
        <LanguageSwitcher />
      </div>
      <div className="flex-1 flex justify-center items-start py-10 px-2">
        <div className="w-full max-w-6xl">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                {t('navigation.manageAll')}
              </h1>
              <p className="text-gray-500 text-lg">
                {t('main.manageAllDesc', 'Manage positions, departments, and leave types for your organization.')}
              </p>
            </div>
            <div className="mb-8">
              <Tabs defaultValue="positions" className="w-full">
                <TabsList className="mb-6">
                  <TabsTrigger value="positions">{t('positions.positions', 'Positions')}</TabsTrigger>
                  <TabsTrigger value="departments">{t('departments.departments', 'Departments')}</TabsTrigger>
                  <TabsTrigger value="leaveTypes">{t('leave.leaveType', 'Leave Types')}</TabsTrigger>
                </TabsList>
                <TabsContent value="positions">
                  <div className="rounded-2xl shadow overflow-hidden mb-8">
                    <div className="bg-blue-600 px-6 py-3">
                      <h2 className="text-lg font-bold text-white">{t('positions.positions', 'Positions')}</h2>
                    </div>
                    <div className="p-6">
                      <form onSubmit={handlePositionSubmit} className="mb-6 flex flex-col gap-4 bg-blue-50 rounded-xl p-6 shadow-sm">
                        <div className="flex flex-col md:flex-row md:items-end gap-4">
                          <Input name="name_en" value={positionForm.name_en} onChange={handlePositionChange} placeholder="Position Name (EN)" required className="md:w-64" />
                          <Input name="name_th" value={positionForm.name_th} onChange={handlePositionChange} placeholder="Position Name (TH)" required className="md:w-64" />
                          <div className="flex flex-wrap gap-4">
                            {filteredLeaveTypes.map(lt => (
                              <div key={lt.id} className="flex flex-col">
                                <label className="text-sm font-medium text-gray-700">{lang === 'th' ? lt.leave_type_th : lt.leave_type_en} Quota</label>
                                <Input
                                  type="number"
                                  min={0}
                                  name={`quota_${lt.id}`}
                                  value={positionForm.quotas[lt.id] || ''}
                                  onChange={e => handleQuotaChange(lt.id, e.target.value)}
                                  className="w-24"
                                  required
                                />
                              </div>
                            ))}
                          </div>
                          <Button type="submit" className="btn-primary w-fit mt-2 md:mt-0">{editingPositionId ? 'Update' : 'Add'} Position</Button>
                        </div>
                        {positionError && (
                          <div className="text-red-600 font-semibold mt-2">{positionError}</div>
                        )}
                      </form>
                      <div className="overflow-x-auto rounded-xl shadow">
                        <table className="w-full table-auto bg-white rounded-xl">
                          <thead>
                            <tr className="bg-blue-100 text-blue-900">
                              <th className="p-3">Position (EN)</th>
                              <th className="p-3">Position (TH)</th>
                              {filteredLeaveTypes.map(lt => (
                                <th key={lt.id} className="p-3">{lang === 'th' ? lt.leave_type_th : lt.leave_type_en} Quota</th>
                              ))}
                              <th className="p-3">Actions</th>
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
                                    <td className="p-3 flex gap-2">
                                      <Button variant="outline" onClick={() => startInlineEdit(pos)}>Edit</Button>
                                      <Button variant="destructive" onClick={() => handleDeletePosition(pos.id)}>Delete</Button>
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
                        <Button type="submit" className="btn-primary">{editingDepartmentId ? 'Update' : 'Add'}</Button>
                      </form>
                      <div className="overflow-x-auto rounded-xl shadow">
                        <table className="w-full table-auto bg-white rounded-xl">
                          <thead>
                            <tr className="bg-blue-100 text-blue-900">
                              <th className="p-3">Department (EN)</th>
                              <th className="p-3">Department (TH)</th>
                              <th className="p-3">Actions</th>
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
                                    <td className="p-3 flex gap-2">
                                      <Button variant="outline" onClick={saveInlineDepartmentEdit}>Save</Button>
                                      <Button variant="destructive" onClick={cancelInlineDepartmentEdit}>Cancel</Button>
                                    </td>
                                  </>
                                ) : (
                                  <>
                                    <td className="p-3 font-medium">{dep.department_name_en}</td>
                                    <td className="p-3 font-medium">{dep.department_name_th}</td>
                                    <td className="p-3 flex gap-2">
                                      <Button variant="outline" onClick={() => startInlineDepartmentEdit(dep)}>Edit</Button>
                                      <Button variant="destructive" onClick={() => handleDeleteDepartment(dep.id)}>Delete</Button>
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
                      <form onSubmit={handleLeaveTypeSubmit} className="mb-6 flex gap-2 items-end bg-blue-50 rounded-xl p-6 shadow-sm">
                        <Input name="name_en" value={leaveTypeForm.name_en} onChange={handleLeaveTypeChange} placeholder="Leave Type Name (EN)" required className="md:w-64" />
                        <Input name="name_th" value={leaveTypeForm.name_th} onChange={handleLeaveTypeChange} placeholder="Leave Type Name (TH)" required className="md:w-64" />
                        <Button type="submit" className="btn-primary">{editingLeaveTypeId ? 'Update' : 'Add'}</Button>
                      </form>
                      <div className="overflow-x-auto rounded-xl shadow">
                        <table className="w-full table-auto bg-white rounded-xl">
                          <thead>
                            <tr className="bg-blue-100 text-blue-900">
                              <th className="p-3">Leave Type (EN)</th>
                              <th className="p-3">Leave Type (TH)</th>
                              <th className="p-3">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {leaveTypes.map(lt => (
                              <tr key={lt.id} className="hover:bg-blue-50">
                                <td className="p-3 font-medium">{lt.leave_type_en}</td>
                                <td className="p-3 font-medium">{lt.leave_type_th}</td>
                                <td className="p-3 flex gap-2">
                                  <Button variant="outline" onClick={() => handleEditLeaveType(lt.id)}>Edit</Button>
                                  <Button variant="destructive" onClick={() => handleDeleteLeaveType(lt.id)}>Delete</Button>
                                </td>
                              </tr>
                            ))}
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
    </div>
  );
};

export default ManageAll; 