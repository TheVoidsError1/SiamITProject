<<<<<<< HEAD
=======

>>>>>>> origin/db_yod
import React, { createContext, useContext, useEffect, useState } from 'react';

interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  role?: 'employee' | 'admin';
  department?: string;
  position?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, userData: Partial<User>) => Promise<void>;
  logout: () => Promise<void>;
<<<<<<< HEAD
  updateUser: (userData: Partial<User>) => void;
  loading: boolean;
}


=======
  loading: boolean;
}

// Mock users data
const MOCK_USERS = [
  {
    id: '1',
    email: 'admin@siamit.com',
    password: 'admin123',
    full_name: 'ผู้ดูแลระบบ',
    role: 'admin' as const,
    department: 'IT Department',
    position: 'System Administrator'
  },
  {
    id: '2',
    email: 'user@siamit.com',
    password: 'user123',
    full_name: 'พนักงานทั่วไป',
    role: 'employee' as const,
    department: 'Marketing',
    position: 'Marketing Executive'
  },
  {
    id: '3',
    email: 'john@siamit.com',
    password: 'john123',
    full_name: 'John Smith',
    role: 'employee' as const,
    department: 'Sales',
    position: 'Sales Manager'
  }
];
>>>>>>> origin/db_yod

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in from localStorage
    const checkUser = () => {
      const savedUser = localStorage.getItem('currentUser');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
      setLoading(false);
    };

    checkUser();
  }, []);

  const login = async (email: string, password: string) => {
<<<<<<< HEAD
    const response = await fetch('http://localhost:3001/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }), // เปลี่ยนจาก Email, Password เป็น email, password
    });
    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    }

    // บันทึก user info ที่ได้จาก backend (ถ้ามี)
    const userInfo = {
      id: data.data?.repid || data.data?.userId || '',
      email: email,
      role: data.data?.role, // เพิ่มบรรทัดนี้
    };
    setUser(userInfo);
    localStorage.setItem('currentUser', JSON.stringify(userInfo));
    localStorage.setItem('token', data.data?.token || '');
  };

  const signup = async (email: string, password: string, userData: Partial<User>) => {
    // เรียก API backend
    const response = await fetch('http://localhost:3001/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        User_name: userData.full_name,
        position: userData.position,
        department: userData.department,
        email: email,         // <-- แก้ตรงนี้
        password: password,   // <-- แก้ตรงนี้
        Role: userData.role || 'employee',
      }),
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'สมัครสมาชิกไม่สำเร็จ');
    }
    // สมัครสมาชิกสำเร็จ ไม่ต้อง login อัตโนมัติ ให้ user ไป login เอง
=======
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const foundUser = MOCK_USERS.find(u => u.email === email && u.password === password);
    
    if (!foundUser) {
      throw new Error('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    }

    const { password: _, ...userWithoutPassword } = foundUser;
    setUser(userWithoutPassword);
    localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
  };

  const signup = async (email: string, password: string, userData: Partial<User>) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check if user already exists
    const existingUser = MOCK_USERS.find(u => u.email === email);
    if (existingUser) {
      throw new Error('อีเมลนี้ถูกใช้งานแล้ว');
    }

    const newUser = {
      id: Date.now().toString(),
      email,
      role: 'employee' as const,
      full_name: userData.full_name || '',
      department: userData.department || '',
      position: userData.position || '',
      ...userData
    };

    // In a real app, this would be saved to database
    // For now, we'll just add to our mock data temporarily
    MOCK_USERS.push({ ...newUser, password });
    
    const { ...userWithoutPassword } = newUser;
    setUser(userWithoutPassword);
    localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
>>>>>>> origin/db_yod
  };

  const logout = async () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

<<<<<<< HEAD
  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    }
  };

=======
>>>>>>> origin/db_yod
  const value = {
    user,
    login,
    signup,
    logout,
<<<<<<< HEAD
    updateUser,
=======
>>>>>>> origin/db_yod
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
