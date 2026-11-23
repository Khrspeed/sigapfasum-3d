import { INITIAL_REPORTS } from "../data/mockReports";
import { generateTicketId } from "../utils/formatters";

const STORAGE_KEY = "sigapfasum_reports_3d";

export const reportService = {
  getAll() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_REPORTS));
      return INITIAL_REPORTS;
    }
    return JSON.parse(saved);
  },

  create(payload) {
    const current = this.getAll();
    const newReport = {
      id: generateTicketId(),
      status: "Menunggu",
      createdAt: new Date().toISOString().split("T")[0],
      image:
        payload.image ||
        "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=800&q=80",
      ...payload,
    };
    const updated = [newReport, ...current];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return newReport;
  },

  updateStatus(id, newStatus) {
    const updated = this.getAll().map((item) =>
      item.id === id ? { ...item, status: newStatus } : item,
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  },
};
