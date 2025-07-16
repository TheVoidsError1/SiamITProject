import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SidebarTrigger } from '@/components/ui/sidebar';
import LanguageSwitcher from '@/components/LanguageSwitcher';

const mockLeaveTypes = [
  { id: '1', name: 'Sick Leave' },
  { id: '2', name: 'Vacation' },
  { id: '3', name: 'Personal Leave' },
  { id: '4', name: 'Maternity' },
];

const mockPositions = [
  { id: '1', name: 'Manager', quotas: { '1': 10, '2': 15, '3': 7, '4': 90 } },
  { id: '2', name: 'Staff', quotas: { '1': 8, '2': 10, '3': 5, '4': 90 } },
];

const PositionManager: React.FC = () => {
  const [positions, setPositions] = useState(mockPositions);
  const [form, setForm] = useState({ name: '', quotas: {} as Record<string, number> });
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleQuotaChange = (leaveTypeId: string, value: string) => {
    setForm({ ...form, quotas: { ...form.quotas, [leaveTypeId]: Number(value) } });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      setPositions(positions.map(pos => pos.id === editingId ? { ...pos, ...form } : pos));
      setEditingId(null);
    } else {
      setPositions([...positions, { id: Date.now().toString(), ...form }]);
    }
    setForm({ name: '', quotas: {} });
  };

  const handleEdit = (id: string) => {
    const pos = positions.find(pos => pos.id === id);
    if (pos) {
      setForm({ name: pos.name, quotas: pos.quotas });
      setEditingId(id);
    }
  };

  const handleDelete = (id: string) => {
    setPositions(positions.filter(pos => pos.id !== id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="border-b bg-white/80 backdrop-blur-sm">
        <div className="flex h-16 items-center px-4 gap-4">
          <SidebarTrigger />
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">Manage Positions</h1>
          </div>
          <LanguageSwitcher />
        </div>
      </div>
      <div className="p-6 animate-fade-in">
        <Card className="max-w-4xl mx-auto border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Positions</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="mb-6 flex flex-col gap-2">
              <Input name="name" value={form.name} onChange={handleChange} placeholder="Position Name" required />
              <div className="flex flex-wrap gap-4">
                {mockLeaveTypes.map(lt => (
                  <div key={lt.id} className="flex flex-col">
                    <label className="text-sm font-medium">{lt.name} Quota</label>
                    <Input
                      type="number"
                      min={0}
                      name={`quota_${lt.id}`}
                      value={form.quotas[lt.id] || ''}
                      onChange={e => handleQuotaChange(lt.id, e.target.value)}
                      className="w-24"
                      required
                    />
                  </div>
                ))}
              </div>
              <Button type="submit" className="btn-primary w-fit mt-2">{editingId ? 'Update' : 'Add'} Position</Button>
            </form>
            <div className="overflow-x-auto">
              <table className="w-full table-auto border">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2">Position</th>
                    {mockLeaveTypes.map(lt => (
                      <th key={lt.id} className="p-2">{lt.name} Quota</th>
                    ))}
                    <th className="p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map(pos => (
                    <tr key={pos.id}>
                      <td className="p-2">{pos.name}</td>
                      {mockLeaveTypes.map(lt => (
                        <td key={lt.id} className="p-2">{pos.quotas[lt.id]}</td>
                      ))}
                      <td className="p-2 flex gap-2">
                        <Button variant="outline" onClick={() => handleEdit(pos.id)}>Edit</Button>
                        <Button variant="destructive" onClick={() => handleDelete(pos.id)}>Delete</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PositionManager; 