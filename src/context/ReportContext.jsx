import { createContext, useContext, useState } from "react";
import { reportService } from "../services/reportService";

const ReportContext = createContext(null);

export function ReportProvider({ children }) {
  const [reports, setReports] = useState(() => reportService.getAll());
  const [user, setUser] = useState({ name: "Rasyad Habibie", role: "warga" });

  const addReport = (data) => {
    const created = reportService.create(data);
    setReports(reportService.getAll());
    return created;
  };

  const changeStatus = (id, status) => {
    const updated = reportService.updateStatus(id, status);
    setReports(updated);
  };

  return (
    <ReportContext.Provider
      value={{ reports, addReport, changeStatus, user, setUser }}
    >
      {children}
    </ReportContext.Provider>
  );
}

export const useReports = () => useContext(ReportContext);
