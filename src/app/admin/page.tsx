"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/Sidebar";
import api from "@/lib/api";
import { toast } from "@/components/Toast";
import Modal from "@/components/Modal";

interface ClinicInfo {
  name: string;
  code: string;
  id: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
}

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [clinic, setClinic] = useState<ClinicInfo | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "receptionist", phone: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (user.role !== "admin") { router.push(`/${user.role}`); return; }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [clinicRes, usersRes] = await Promise.all([
        api.get("/admin/clinic"),
        api.get("/admin/users"),
      ]);
      setClinic(clinicRes.data);
      setUsers(usersRes.data);
    } catch {
      toast("Error loading data", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/admin/users", form);
      toast("USER CREATED!", "success");
      setShowModal(false);
      setForm({ name: "", email: "", password: "", role: "receptionist", phone: "" });
      fetchData();
    } catch (err: any) {
      toast("FAILED TO CREATE USER", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const roleCounts = users.reduce((acc: Record<string, number>, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="page-content">
        <div className="section-header" style={{ marginBottom: '32px' }}>
          <div>
            <h1 className="page-title">Admin Dashboard</h1>
            {clinic && <p className="page-subtitle">Clinic: <span className="font-bold">{clinic.name}</span> | Code: <span className="font-bold">{clinic.code}</span></p>}
          </div>
          <button 
            className="btn btn-primary" 
            onClick={() => setShowModal(true)}
          >
            + Add New User
          </button>
        </div>

        {loading ? (
          <div className="loading-center">
            <div className="spinner" style={{ margin: '0 auto' }}></div>
            <p className="mt-4 text-muted">Loading dashboard data...</p>
          </div>
        ) : (
          <>
            <div className="grid-4 mb-6">
              <div className="card">
                <div className="card-title">Total Users</div>
                <div className="card-value">{users.length}</div>
              </div>
              <div className="card">
                <div className="card-title">Doctors</div>
                <div className="card-value">{roleCounts.doctor || 0}</div>
              </div>
              <div className="card">
                <div className="card-title">Receptionists</div>
                <div className="card-value">{roleCounts.receptionist || 0}</div>
              </div>
              <div className="card">
                <div className="card-title">Patients</div>
                <div className="card-value">{roleCounts.patient || 0}</div>
              </div>
            </div>

            <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
              <div style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)', padding: '16px 24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600' }}>System Users</h3>
              </div>
              <div className="table-wrap" style={{ border: 'none' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Phone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td className="font-bold">{u.name}</td>
                        <td className="text-muted">{u.email}</td>
                        <td>
                          <span className={`badge badge-${u.role.toLowerCase()}`}>
                            {u.role.toUpperCase()}
                          </span>
                        </td>
                        <td className="text-muted">{u.phone || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>

      {showModal && (
        <Modal title="CREATE NEW USER" onClose={() => setShowModal(false)}>
          <form onSubmit={handleCreateUser} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div>
              <label>Name:</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label>Email:</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <label>Password:</label>
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            </div>
            <div>
              <label>Role:</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="receptionist">Receptionist</option>
                <option value="doctor">Doctor</option>
                <option value="patient">Patient</option>
              </select>
            </div>
            <div>
              <label>Phone:</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "SAVING..." : "SAVE USER"}
            </button>
            <button type="button" onClick={() => setShowModal(false)}>CANCEL</button>
          </form>
        </Modal>
      )}
    </div>
  );
}
