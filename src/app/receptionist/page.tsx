"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/Sidebar";
import api from "@/lib/api";
import { toast } from "@/components/Toast";


interface QueueEntry {
  id: string;
  status: "queued" | "in-progress" | "done" | "skipped";
  queueNumber?: number;
  appointment?: {
    timeSlot: string;
    patient?: { name: string };
    doctor?: { name: string };
  };
}

const STATUS_LABELS: Record<string, string> = {
  queued: "Pending",
  "in-progress": "In Progress",
  done: "Done",
  skipped: "Skipped",
};

export default function ReceptionistPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  useEffect(() => {
    if (!user) return;
    if (user.role !== "receptionist") { router.push(`/${user.role}`); return; }
    fetchQueue();
    const interval = setInterval(fetchQueue, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const fetchQueue = useCallback(async () => {
    try {
      const dateParam = new Date().toISOString().split("T")[0];
      const { data } = await api.get(`/queue?date=${dateParam}`);
      setQueue(Array.isArray(data) ? data : data.queue || []);
    } catch (err: any) { 
      if (err?.response?.status === 404) {
        setQueue([]);
      } else {
        toast("Failed to refresh queue", "error"); 
      }
    }
    finally { setLoading(false); }
  }, []);

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    try {
      await api.patch(`/queue/${id}`, { status });
      toast("Status updated", "success");
      setQueue((prev) => prev.map((q) => q.id === id ? { ...q, status: status as QueueEntry["status"] } : q));
    } catch { toast("Failed to update status", "error"); }
    finally { setUpdating(null); }
  };

  const counts = queue.reduce((acc: Record<string, number>, q) => {
    acc[q.status] = (acc[q.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="page-content">
        <div className="section-header">
          <div>
            <h1 className="page-title">Today&apos;s Queue</h1>
            <p className="page-subtitle">{today}</p>
          </div>
          <button className="btn btn-secondary" onClick={fetchQueue}>
            REFRESH
          </button>
        </div>

        {}
        <div className="grid-4" style={{ marginBottom: 24 }}>
          {[
            { label: "Total", value: queue.length },
            { label: "Pending", value: counts.queued || 0 },
            { label: "In Progress", value: counts["in-progress"] || 0 },
            { label: "Done", value: counts.done || 0 },
          ].map((s) => (
            <div className="card" key={s.label}>
              <div className="card-title">{s.label}</div>
              <div className="card-value">{s.value}</div>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : (
          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: "10px", borderBottom: "1px solid #000" }}>
              <span style={{ fontSize: 15, fontWeight: "bold" }}>LIST OF PATIENTS</span>
            </div>
            <div className="table-wrap" style={{ border: "none", borderRadius: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Patient</th>
                    <th>Doctor</th>
                    <th>Time Slot</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {queue.map((q, i) => (
                    <tr key={q.id}>
                      <td style={{ fontWeight: 600 }}>{q.queueNumber || i + 1}</td>
                      <td style={{ fontWeight: 700 }}>{q.appointment?.patient?.name || "Patient"}</td>
                      <td style={{ color: "var(--text-secondary)" }}>{q.appointment?.doctor?.name || "—"}</td>
                      <td>
                        <div style={{ fontSize: 13 }}>{q.appointment?.timeSlot || "—"}</div>
                      </td>
                      <td><span className={`badge badge-${q.status}`}>{STATUS_LABELS[q.status]}</span></td>
                      <td>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {q.status !== "in-progress" && q.status !== "done" && (
                            <button
                              className="btn btn-sm btn-secondary"
                              disabled={updating === q.id}
                              onClick={() => updateStatus(q.id, "in-progress")}
                            >
                              {updating === q.id ? <span className="spinner" style={{ width: 12, height: 12 }} /> : "Start"}
                            </button>
                          )}
                          {q.status !== "done" && (
                            <button
                              className="btn btn-sm btn-success"
                              disabled={updating === q.id}
                              onClick={() => updateStatus(q.id, "done")}
                            >Finish</button>
                          )}
                          {q.status === "queued" && (
                            <button
                              className="btn btn-sm btn-danger"
                              disabled={updating === q.id}
                              onClick={() => updateStatus(q.id, "skipped")}
                            >Skip Patient</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {queue.length === 0 && (
                    <tr>
                      <td colSpan={6}>
                          <p>No patients today</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
