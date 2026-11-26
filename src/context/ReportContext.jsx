import { createContext, useContext, useState } from 'react';
import { reportService } from '../services/reportService';

const ReportContext = createContext(null);
const USER_STORAGE_KEY = 'sigapfasum_citizen_user';

export function ReportProvider({ children }) {
  const [reports, setReports] = useState(() => reportService.getAll());
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem(USER_STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  });

  const loginUser = (userData) => {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
    setUser(userData);
  };

  const logoutUser = () => {
    localStorage.removeItem(USER_STORAGE_KEY);
    setUser(null);
  };

  const addReport = (data) => {
    const created = reportService.create({
      ...data,
      reporter: user ? user.name : data.reporter || 'Warga Kudus',
    });
    setReports(reportService.getAll());
    return created;
  };

  const changeStatus = (id, status) => {
    const updated = reportService.updateStatus(id, status);
    setReports(updated);
  };

  return (
    <ReportContext.Provider
      value={{ reports, addReport, changeStatus, user, loginUser, logoutUser }}
    >
      {children}
    </ReportContext.Provider>
  );
}

export const useReports = () => useContext(ReportContext);