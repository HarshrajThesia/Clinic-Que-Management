"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/Sidebar";
import api from "@/lib/api";
import { toast } from "@/components/Toast";


interface Patient {
  id: string;
  status: string;
  appointmentId: string;
  patient?: { name: string };
  appointment?: { timeSlot: string };
}

interface MedItem { name: string; dosage: string; duration: string; }

export default function DoctorPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Patient | null>(null);
  const [activeTab, setActiveTab] = useState<"prescription" | "report">("prescription");

 
  const [medicines, setMedicines] = useState<MedItem[]>([{ name: "", dosage: "", duration: "" }]);
  const [notes, setNotes] = useState("");

 
  const [diagnosis, setDiagnosis] = useState("");
  const [testRecommended, setTestRecommended] = useState("");
  const [remarks, setRemarks] = useState("");

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (user.role !== "doctor") { router.push(`/${user.role}`); return; }
    fetchPatients();
  }, [user]);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const dateParam = new Date().toISOString().split("T")[0];
      const { data } = await api.get(`/doctor/queue?date=${dateParam}`);
      setPatients(Array.isArray(data) ? data : data.patients || data.queue || []);
    } catch { toast("Failed to load queue", "error"); }
    finally { setLoading(false); }
  };

  const resetForms = () => {
    setMedicines([{ name: "", dosage: "", duration: "" }]);
    setNotes(""); setDiagnosis(""); setTestRecommended(""); setRemarks("");
  };

  const handleSelectPatient = (p: Patient) => {
    setSelected(p);
    resetForms();
    setActiveTab("prescription");
  };

  const addMed = () => setMedicines((m) => [...m, { name: "", dosage: "", duration: "" }]);
  const updateMed = (i: number, field: keyof MedItem, val: string) =>
    setMedicines((m) => m.map((med, idx) => idx === i ? { ...med, [field]: val } : med));
  const removeMed = (i: number) => setMedicines((m) => m.filter((_, idx) => idx !== i));

  const submitPrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setSubmitting(true);
    try {
      await api.post(`/prescriptions/${selected.appointmentId}`, { medicines, notes });
      toast("Medical card saved!", "success");
      setSelected(null);
    } catch (err: unknown) {
      toast((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to add prescription", "error");
    } finally { setSubmitting(false); }
  };

  const submitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setSubmitting(true);
    try {
      await api.post(`/reports/${selected.appointmentId}`, { diagnosis, testRecommended, remarks });
      toast("Case report saved!", "success");
      setSelected(null);
    } catch (err: unknown) {
      toast((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to add report", "error");
    } finally { setSubmitting(false); }
  };

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="page-content">
        <div className="section-header">
          <div>
            <h1 className="page-title">My Patients</h1>
            <p className="page-subtitle">Today&apos;s assigned patient queue</p>
          </div>
        </div>

        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : (
          <div className="card" style={{ padding: 0 }}>
            <div className="table-wrap" style={{ border: "none", borderRadius: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Time Slot</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontWeight: 700 }}>{p.patient?.name || "Patient"}</span>
                        </div>
                      </td>
                        <div style={{ fontSize: 13 }}>{p.appointment?.timeSlot || "—"}</div>
                      <td><span className={`badge badge-${p.status}`}>{p.status}</span></td>
                      <td>
                        <button className="btn btn-sm btn-primary" onClick={() => handleSelectPatient(p)}>
                          Patient File
                        </button>
                      </td>
                    </tr>
                  ))}
                  {patients.length === 0 && (
                    <tr><td colSpan={4}>
                        <p>No patients today</p>
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {}
      {selected && (
        <>
          <div className="slide-panel-backdrop" onClick={() => setSelected(null)} />
          <div className="slide-panel">
            <div className="slide-panel-header">
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{selected.patient?.name}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{selected.appointment?.timeSlot}</div>
              </div>
              <button className="btn btn-icon btn-ghost" onClick={() => setSelected(null)}>[X]</button>
            </div>
            <div className="slide-panel-body">
              <div className="tabs">
                <button className={`tab${activeTab === "prescription" ? " active" : ""}`} onClick={() => setActiveTab("prescription")}>
                  PRESCRIPTION
                </button>
                <button className={`tab${activeTab === "report" ? " active" : ""}`} onClick={() => setActiveTab("report")}>
                  REPORT
                </button>
              </div>

              {activeTab === "prescription" ? (
                <form onSubmit={submitPrescription} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <label style={{ fontWeight: 600, fontSize: 13 }}>Medicines</label>
                  {medicines.map((m, i) => (
                    <div key={i} style={{ background: "var(--bg-elevated)", borderRadius: 8, padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Medicine {i + 1}</span>
                        {medicines.length > 1 && (
                          <button type="button" onClick={() => removeMed(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--danger)" }}>
                            REMOVE
                          </button>
                        )}
                      </div>
                      <input placeholder="Medicine name" value={m.name} onChange={(e) => updateMed(i, "name", e.target.value)} required />
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                        <input placeholder="Dosage (e.g. 500mg)" value={m.dosage} onChange={(e) => updateMed(i, "dosage", e.target.value)} required />
                        <input placeholder="Duration (e.g. 5 days)" value={m.duration} onChange={(e) => updateMed(i, "duration", e.target.value)} required />
                      </div>
                    </div>
                  ))}
                  <button type="button" className="btn btn-ghost btn-sm" onClick={addMed} style={{ borderStyle: "dashed" }}>+ Add Medicine</button>
                  <div className="input-group">
                    <label>Notes</label>
                    <textarea rows={3} placeholder="Additional instructions..." value={notes} onChange={(e) => setNotes(e.target.value)} />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ justifyContent: "center" }} disabled={submitting}>
                    {submitting ? <span className="spinner" style={{ width: 16, height: 16 }} /> : "Save Prescription"}
                  </button>
                </form>
              ) : (
                <form onSubmit={submitReport} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div className="input-group">
                    <label>Diagnosis</label>
                    <textarea rows={3} placeholder="Patient diagnosis..." value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} required />
                  </div>
                  <div className="input-group">
                    <label>Tests Recommended</label>
                    <input placeholder="e.g. CBC, X-ray" value={testRecommended} onChange={(e) => setTestRecommended(e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label>Remarks</label>
                    <textarea rows={3} placeholder="Additional remarks..." value={remarks} onChange={(e) => setRemarks(e.target.value)} />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ justifyContent: "center" }} disabled={submitting}>
                    {submitting ? <span className="spinner" style={{ width: 16, height: 16 }} /> : "Save Report"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
