import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SidebarTrigger } from '@/components/ui/sidebar';
import LanguageSwitcher from '@/components/LanguageSwitcher';

const mockDepartments = [
  { id: '1', name: 'IT' },
  { id: '2', name: 'HR' },
  { id: '3', name: 'Finance' },
];

const DepartmentManager: React.FC = () => {
  const [departments, setDepartments] = useState(mockDepartments);
  const [form, setForm] = useState({ name: '' });
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      setDepartments(departments.map(dep => dep.id === editingId ? { ...dep, ...form } : dep));
      setEditingId(null);
    } else {
      setDepartments([...departments, { id: Date.now().toString(), ...form }]);
    }
    setForm({ name: '' });
  };

  const handleEdit = (id: string) => {
    const dep = departments.find(dep => dep.id === id);
    if (dep) {
      setForm({ name: dep.name });
      setEditingId(id);
    }
  };

  const handleDelete = (id: string) => {
    setDepartments(departments.filter(dep => dep.id !== id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="border-b bg-white/80 backdrop-blur-sm">
        <div className="flex h-16 items-center px-4 gap-4">
          <SidebarTrigger />
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">Manage Departments</h1>
          </div>
          <LanguageSwitcher />
        </div>
      </div>
      <div className="p-6 animate-fade-in">
        <Card className="max-w-3xl mx-auto border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Departments</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="mb-6 flex gap-2 items-end">
              <Input name="name" value={form.name} onChange={handleChange} placeholder="Department Name" required />
              <Button type="submit" className="btn-primary">{editingId ? 'Update' : 'Add'}</Button>
            </form>
            <div className="overflow-x-auto">
              <table className="w-full table-auto border">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2">Department</th>
                    <th className="p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {departments.map(dep => (
                    <tr key={dep.id}>
                      <td className="p-2">{dep.name}</td>
                      <td className="p-2 flex gap-2">
                        <Button variant="outline" onClick={() => handleEdit(dep.id)}>Edit</Button>
                        <Button variant="destructive" onClick={() => handleDelete(dep.id)}>Delete</Button>
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

export default DepartmentManager; 