import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SidebarTrigger } from '@/components/ui/sidebar';
import LanguageSwitcher from '@/components/LanguageSwitcher';

const mockSuperadmins = [
  { id: '1', name: 'Superadmin One', email: 'super1@example.com' },
  { id: '2', name: 'Superadmin Two', email: 'super2@example.com' },
];

const SuperAdminList: React.FC = () => {
  const [superadmins, setSuperadmins] = useState(mockSuperadmins);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      setSuperadmins(superadmins.map(sa => sa.id === editingId ? { ...sa, ...form } : sa));
      setEditingId(null);
    } else {
      setSuperadmins([...superadmins, { id: Date.now().toString(), ...form }]);
    }
    setForm({ name: '', email: '', password: '' });
  };

  const handleEdit = (id: string) => {
    const sa = superadmins.find(sa => sa.id === id);
    if (sa) {
      setForm({ name: sa.name, email: sa.email, password: '' });
      setEditingId(id);
    }
  };

  const handleDelete = (id: string) => {
    setSuperadmins(superadmins.filter(sa => sa.id !== id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="border-b bg-white/80 backdrop-blur-sm">
        <div className="flex h-16 items-center px-4 gap-4">
          <SidebarTrigger />
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">Manage SuperAdmins</h1>
          </div>
          <LanguageSwitcher />
        </div>
      </div>
      <div className="p-6 animate-fade-in">
        <Card className="max-w-3xl mx-auto border-0 shadow-lg">
          <CardHeader>
            <CardTitle>SuperAdmins</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="mb-6 flex gap-2 items-end">
              <Input name="name" value={form.name} onChange={handleChange} placeholder="Name" required />
              <Input name="email" value={form.email} onChange={handleChange} placeholder="Email" required />
              <Input name="password" value={form.password} onChange={handleChange} placeholder="Password" type="password" required />
              <Button type="submit" className="btn-primary">{editingId ? 'Update' : 'Add'}</Button>
            </form>
            <div className="overflow-x-auto">
              <table className="w-full table-auto border">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2">Name</th>
                    <th className="p-2">Email</th>
                    <th className="p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {superadmins.map(sa => (
                    <tr key={sa.id}>
                      <td className="p-2">{sa.name}</td>
                      <td className="p-2">{sa.email}</td>
                      <td className="p-2 flex gap-2">
                        <Button variant="outline" onClick={() => handleEdit(sa.id)}>Edit</Button>
                        <Button variant="destructive" onClick={() => handleDelete(sa.id)}>Delete</Button>
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

export default SuperAdminList; 