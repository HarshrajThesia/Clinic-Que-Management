"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/Sidebar";
import api from "@/lib/api";
import { toast } from "@/components/Toast";
import Modal from "@/components/Modal";

interface Appointment {
  id: string;
  appointmentDate: string;
  timeSlot: string;
  status: string;
  doctorName?: string;
}

interface Medicine { name: string; dosage: string; duration: string; }
interface Prescription {
  id: string;
  appointmentDate?: string;
  medicines: Medicine[];
  notes?: string;
  doctorName?: string;
}

interface Report {
  id: string;
  appointmentDate?: string;
  diagnosis: string;
  testRecommended?: string;
  remarks?: string;
  doctorName?: string;
}

type Tab = "appointments" | "prescriptions" | "reports";

export default function PatientPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("appointments");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBook, setShowBook] = useState(false);
  const [bookForm, setBookForm] = useState({ appointmentDate: "", timeSlot: "" });
  const [booking, setBooking] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    if (user.role !== "patient") { router.push(`/${user.role}`); return; }
    fetchAll();
  }, [user]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [apptRes, presRes, repRes] = await Promise.all([
        api.get("/appointments/my"),
        api.get("/prescriptions/my"),
        api.get("/reports/my"),
      ]);
      setAppointments(Array.isArray(apptRes.data) ? apptRes.data : apptRes.data.appointments || []);
      setPrescriptions(Array.isArray(presRes.data) ? presRes.data : presRes.data.prescriptions || []);
      setReports(Array.isArray(repRes.data) ? repRes.data : repRes.data.reports || []);
    } catch { toast("Failed to load data", "error"); }
    finally { setLoading(false); }
  };

  const bookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setBooking(true);
    try {
      await api.post("/appointments", bookForm);
      toast("Appointment booked!", "success");
      setShowBook(false);
      setBookForm({ appointmentDate: "", timeSlot: "" });
      fetchAll();
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.response?.data?.message || "Booking failed.";
      toast(msg, "error");
    } finally { setBooking(false); }
  };

  const cancelAppointment = async (id: string) => {
    if (!window.confirm("ARE YOU SURE?")) return;
    
    setCancellingId(id);
    try {
      await api.patch(`/appointments/${id}/status`, { status: "cancelled" });
      toast("Cancelled!", "success");
      fetchAll();
    } catch (err: any) {
      toast("Error", "error");
    } finally {
      setCancellingId(null);
    }
  };

  const upcoming = appointments.filter((a) => a.status !== "cancelled" && a.status !== "completed");

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="page-content">
        <div className="section-header" style={{ marginBottom: '32px' }}>
          <div>
            <h1 className="page-title">Patient Dashboard</h1>
            <p className="page-subtitle">Welcome back! Manage your health records and appointments.</p>
          </div>
        </div>

        <div className="grid-3 mb-6">
          <div className="card">
            <div className="card-title">Upcoming</div>
            <div className="card-value">{upcoming.length}</div>
          </div>
          <div className="card">
            <div className="card-title">Prescriptions</div>
            <div className="card-value">{prescriptions.length}</div>
          </div>
          <div className="card">
            <div className="card-title">Reports</div>
            <div className="card-value">{reports.length}</div>
          </div>
        </div>

        <div className="tabs">
          <button 
            onClick={() => setTab("appointments")}
            className={`tab ${tab === "appointments" ? "active" : ""}`}
          >
            My Appointments
          </button>
          <button 
            onClick={() => setTab("prescriptions")}
            className={`tab ${tab === "prescriptions" ? "active" : ""}`}
          >
            Prescriptions
          </button>
          <button 
            onClick={() => setTab("reports")}
            className={`tab ${tab === "reports" ? "active" : ""}`}
          >
            Health Reports
          </button>
        </div>

        {tab === "appointments" && (
          <button 
            className="btn btn-primary" 
            style={{ marginBottom: "20px" }}
            onClick={() => setShowBook(true)}
          >
            + BOOK NEW APPOINTMENT
          </button>
        )}

        {loading ? (
          <div className="loading-center">
            <div className="spinner" style={{ margin: '0 auto' }}></div>
            <p className="mt-4 text-muted">Fetching your records...</p>
          </div>
        ) : (
          <div className="card" style={{ padding: '0' }}>
            {tab === "appointments" && (
              <div style={{ padding: '8px' }}>
                {appointments.length === 0 ? (
                  <div className="empty-state">
                    <p>No appointments booked yet.</p>
                  </div>
                ) : appointments.map((a) => (
                  <div key={a.id} className="card" style={{ margin: '8px', padding: '16px', display: 'flex', justifyContent: 'space-between', boxShadow: 'none', background: 'var(--bg-elevated)' }}>
                    <div>
                      <div className="font-bold" style={{ fontSize: '16px' }}>{new Date(a.appointmentDate).toDateString()}</div>
                      <div className="text-muted" style={{ fontSize: '14px' }}>Time: {a.timeSlot}</div>
                      <div className="text-xs mt-1">Doctor: {a.doctorName || "Pending Assignment"}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span className={`badge badge-${a.status}`}>{a.status.toUpperCase()}</span>
                      {a.status === "scheduled" && (
                        <button 
                          className="btn btn-danger btn-sm" 
                          onClick={() => cancelAppointment(a.id)} 
                          disabled={!!cancellingId}
                        >
                          {cancellingId === a.id ? "..." : "Cancel"}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === "prescriptions" && (
              <div style={{ padding: '16px' }}>
                {prescriptions.length === 0 ? (
                  <div className="empty-state">
                    <p>No prescriptions found.</p>
                  </div>
                ) : prescriptions.map((p) => (
                  <div key={p.id} className="card" style={{ marginBottom: '16px', borderLeft: '4px solid var(--accent-primary)' }}>
                    <div className="flex justify-between items-center mb-4">
                      <div className="font-bold">Date: {new Date(p.appointmentDate || "").toDateString()}</div>
                      <div className="text-sm text-muted">Dr. {p.doctorName || "—"}</div>
                    </div>
                    <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', padding: '16px' }}>
                      <div className="text-xs font-bold text-muted mb-2 uppercase">Prescribed Medicines</div>
                      <ul style={{ listStyle: 'none', padding: '0' }}>
                        {p.medicines?.map((m, i) => (
                          <li key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
                            <span className="font-bold">{m.name}</span>
                            <span className="text-sm">{m.dosage} | {m.duration}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    {p.notes && <div className="mt-4 text-sm" style={{ padding: '12px', background: '#f8fafc', borderLeft: '2px solid var(--border)' }}><b>Notes:</b> {p.notes}</div>}
                  </div>
                ))}
              </div>
            )}

            {tab === "reports" && (
              <div style={{ padding: '16px' }}>
                {reports.length === 0 ? (
                  <div className="empty-state">
                    <p>No health reports available.</p>
                  </div>
                ) : reports.map((r) => (
                  <div key={r.id} className="card" style={{ marginBottom: '16px', background: 'linear-gradient(to right, #fff, #f8fafc)' }}>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold" style={{ color: 'var(--accent-primary)' }}>MEDICAL REPORT</h3>
                      <div className="text-sm text-muted">{new Date(r.appointmentDate || "").toDateString()}</div>
                    </div>
                    <div className="grid-2 gap-4">
                      <div>
                        <div className="text-xs font-bold text-muted uppercase">Diagnosis</div>
                        <p className="mt-1">{r.diagnosis}</p>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-muted uppercase">Tests Recommended</div>
                        <p className="mt-1">{r.testRecommended || "None specified"}</p>
                      </div>
                    </div>
                    {r.remarks && (
                      <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                        <div className="text-xs font-bold text-muted uppercase">Physician Remarks</div>
                        <p className="mt-1 italic" style={{ fontSize: '14px' }}>"{r.remarks}"</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {showBook && (
        <Modal title="BOOK APPOINTMENT" onClose={() => setShowBook(false)}>
          <form onSubmit={bookAppointment} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div>
              <label>Pick Date:</label>
              <input
                type="date"
                value={bookForm.appointmentDate}
                onChange={(e) => setBookForm({ ...bookForm, appointmentDate: e.target.value })}
                required
              />
            </div>
            <div>
              <label>Pick Time (HH:MM-HH:MM):</label>
              <input
                placeholder="10:00-10:30"
                value={bookForm.timeSlot}
                onChange={(e) => setBookForm({ ...bookForm, timeSlot: e.target.value })}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={booking}>
              {booking ? "BOOKING..." : "CONFIRM BOOKING"}
            </button>
            <button type="button" onClick={() => setShowBook(false)}>CANCEL</button>
          </form>
        </Modal>
      )}
    </div>
  );
}
