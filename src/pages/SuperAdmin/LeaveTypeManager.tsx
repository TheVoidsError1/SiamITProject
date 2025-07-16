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

const LeaveTypeManager: React.FC = () => {
  const [leaveTypes, setLeaveTypes] = useState(mockLeaveTypes);
  const [form, setForm] = useState({ name: '' });
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      setLeaveTypes(leaveTypes.map(lt => lt.id === editingId ? { ...lt, ...form } : lt));
      setEditingId(null);
    } else {
      setLeaveTypes([...leaveTypes, { id: Date.now().toString(), ...form }]);
    }
    setForm({ name: '' });
  };

  const handleEdit = (id: string) => {
    const lt = leaveTypes.find(lt => lt.id === id);
    if (lt) {
      setForm({ name: lt.name });
      setEditingId(id);
    }
  };

  const handleDelete = (id: string) => {
    setLeaveTypes(leaveTypes.filter(lt => lt.id !== id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="border-b bg-white/80 backdrop-blur-sm">
        <div className="flex h-16 items-center px-4 gap-4">
          <SidebarTrigger />
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">Manage Leave Types</h1>
          </div>
          <LanguageSwitcher />
        </div>
      </div>
      <div className="p-6 animate-fade-in">
        <Card className="max-w-3xl mx-auto border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Leave Types</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="mb-6 flex gap-2 items-end">
              <Input name="name" value={form.name} onChange={handleChange} placeholder="Leave Type Name" required />
              <Button type="submit" className="btn-primary">{editingId ? 'Update' : 'Add'}</Button>
            </form>
            <div className="overflow-x-auto">
              <table className="w-full table-auto border">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2">Leave Type</th>
                    <th className="p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leaveTypes.map(lt => (
                    <tr key={lt.id}>
                      <td className="p-2">{lt.name}</td>
                      <td className="p-2 flex gap-2">
                        <Button variant="outline" onClick={() => handleEdit(lt.id)}>Edit</Button>
                        <Button variant="destructive" onClick={() => handleDelete(lt.id)}>Delete</Button>
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

export default LeaveTypeManager; 