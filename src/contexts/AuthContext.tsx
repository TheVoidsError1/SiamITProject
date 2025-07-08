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
  updateUser: (userData: Partial<User>) => void;
  loading: boolean;
}

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
    const response = await fetch('http://localhost:3001/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    }

    // Initial user info from login
    const userInfo = {
      id: data.data?.repid || data.data?.userId || '',
      email: email,
      role: data.data?.role,
    };
    setUser(userInfo);
    localStorage.setItem('currentUser', JSON.stringify(userInfo));
    localStorage.setItem('token', data.data?.token || '');

    // Fetch profile info after login
    try {
      const profileRes = await fetch('http://localhost:3001/api/profile', {
        headers: { 'Authorization': `Bearer ${data.data?.token || ''}` }
      });
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        if (profileData.success) {
          const d = profileData.data;
          const updatedUser = {
            ...userInfo,
            full_name: d.name,
            position: d.position,
            department: d.department,
            email: d.email,
          };
          setUser(updatedUser);
          localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        }
      }
    } catch (err) {
      // Profile fetch failed, but login is still successful
      console.log('Failed to fetch profile:', err);
    }

    // Fetch avatar URL after login
    try {
      const avatarResponse = await fetch('http://localhost:3001/api/avatar', {
        headers: { 'Authorization': `Bearer ${data.data?.token || ''}` }
      });
      if (avatarResponse.ok) {
        const avatarData = await avatarResponse.json();
        if (avatarData.success && avatarData.avatar_url) {
          setUser(prev => {
            if (!prev) return prev;
            const updatedUserInfo = { ...prev, avatar_url: avatarData.avatar_url };
            localStorage.setItem('currentUser', JSON.stringify(updatedUserInfo));
            return updatedUserInfo;
          });
        }
      }
    } catch (err) {
      // Avatar fetch failed, but login is still successful
      console.log('Failed to fetch avatar:', err);
    }
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
  };

  const logout = async () => {
    setUser(null);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    }
  };

  const value = {
    user,
    login,
    signup,
    logout,
    updateUser,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
