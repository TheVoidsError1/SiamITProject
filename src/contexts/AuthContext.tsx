
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
  };

  const logout = async () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  const value = {
    user,
    login,
    signup,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
