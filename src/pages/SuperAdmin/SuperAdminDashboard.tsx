import React from 'react';

const SuperAdminDashboard: React.FC = () => {
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">SuperAdmin Dashboard</h1>
      <nav className="flex flex-col gap-4">
        <a href="#superadmins" className="btn">Manage SuperAdmins</a>
        <a href="#positions" className="btn">Manage Positions</a>
        <a href="#departments" className="btn">Manage Departments</a>
        <a href="#leavetypes" className="btn">Manage Leave Types</a>
      </nav>
    </div>
  );
};

export default SuperAdminDashboard; 