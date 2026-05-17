import { useState, useEffect } from 'react';

export type UserRole = 'FIELD_WORKER' | 'SAFETY_MANAGER' | 'SAFETY_AUDITOR' | 'GATE_SECURITY' | 'MAINTENANCE';

export const useUserRole = () => {
  const [role, setRole] = useState<UserRole>('FIELD_WORKER');

  const switchRole = (newRole: UserRole) => {
    setRole(newRole);
  };

  return { role, switchRole };
};
