"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { getRoleRedirect, AuthUser } from "@/lib/auth";
import { toast } from "@/components/Toast";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      const fetchedUser = data.user || data;
      const user: AuthUser = {
        id: fetchedUser.id,
        name: fetchedUser.name,
        email: fetchedUser.email,
        role: fetchedUser.role,
        clinicId: fetchedUser.clinicId,
        clinicName: fetchedUser.clinicName,
        clinicCode: fetchedUser.clinicCode,
      };
      login(data.token, user);
      toast(`Welcome back, ${user.name}!`, "success");
      router.push(getRoleRedirect(user.role));
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Invalid credentials. Please try again.";
      toast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' }}>
      <div className="card" style={{ width: "100%", maxWidth: "420px" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ 
            width: '64px', 
            height: '64px', 
            background: 'var(--accent-gradient)', 
            borderRadius: '16px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            margin: '0 auto 20px',
            color: '#fff',
            fontSize: '24px',
            fontWeight: 'bold'
          }}>C</div>
          <h1 className="page-title" style={{ fontSize: '28px', marginBottom: '8px' }}>Welcome Back</h1>
          <p className="text-muted">Enter your credentials to access your account</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="input-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary w-full mt-2" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
        
        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '13px' }} className="text-muted">
          Need help? Contact system administrator
        </div>
      </div>
    </div>
  );
}
