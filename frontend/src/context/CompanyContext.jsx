import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';

const CompanyContext = createContext(undefined);

// Default company ID for SUPER_ADMIN when no company is set
const DEFAULT_COMPANY_ID = '1';

export const CompanyProvider = ({ children }) => {
  const { user } = useAuth();

  const [activeCompanyId, setActiveCompanyIdState] = useState(() => {
    return localStorage.getItem('activeCompanyId') || null;
  });

  // Always sync with user's company for non-SUPER_ADMIN users
  useEffect(() => {
    if (user) {
      if (user.role === 'SUPER_ADMIN') {
        // SUPER_ADMIN can use any company, default to stored, user's company, or default
        if (!activeCompanyId) {
          const defaultId = user.company?.id ? String(user.company.id) : DEFAULT_COMPANY_ID;
          setActiveCompanyId(defaultId);
        }
      } else if (user.company?.id) {
        // Regular users MUST use their own company - always set it
        setActiveCompanyId(String(user.company.id));
      }
    }
  }, [user]);

  const setActiveCompanyId = (id) => {
    const stringId = String(id);
    localStorage.setItem('activeCompanyId', stringId);
    setActiveCompanyIdState(stringId);
  };

  // Determine the effective company ID to use
  const getEffectiveCompanyId = () => {
    // If user exists and is not SUPER_ADMIN, always use their company
    if (user && user.role !== 'SUPER_ADMIN' && user.company?.id) {
      return String(user.company.id);
    }
    // For SUPER_ADMIN, use stored value or default to company 1
    if (user && user.role === 'SUPER_ADMIN') {
      return activeCompanyId || DEFAULT_COMPANY_ID;
    }
    // For loading state, use stored value
    return activeCompanyId;
  };

  const effectiveCompanyId = getEffectiveCompanyId();

  return (
    <CompanyContext.Provider value={{ activeCompanyId: effectiveCompanyId, setActiveCompanyId }}>
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
};
