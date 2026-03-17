"use client";
import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

interface NavItem {
  label: string;
  href: string;
  roles: string[];
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/admin", roles: ["admin"] },
  { label: "Today's Queue", href: "/receptionist", roles: ["receptionist"] },
  { label: "My Patients", href: "/doctor", roles: ["doctor"] },
  { label: "Appointments", href: "/patient", roles: ["patient"] },
  { label: "Prescriptions", href: "/patient/prescriptions", roles: ["patient"] },
  { label: "Reports", href: "/patient/reports", roles: ["patient"] },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  if (!user) return null;

  const filteredNav = navItems.filter((item) => item.roles.includes(user.role));

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <div style={{ color: '#fff', fontWeight: 'bold' }}>C</div>
        </div>
        <div>
          <div className="sidebar-logo-text">CLINIC CMS</div>
          <div className="sidebar-logo-sub">Management System</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Main Menu</div>
        {filteredNav.map((item) => (
          <button
            key={item.href}
            onClick={() => router.push(item.href)}
            className={`nav-link ${pathname === item.href ? "active" : ""}`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-pill">
          <div className="user-avatar">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="user-name">{user.name}</div>
            <div className="user-role">{user.role}</div>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="btn btn-secondary w-full mt-4"
          style={{ fontSize: '12px', padding: '8px' }}
        >
          LOGOUT
        </button>
      </div>
    </aside>
  );
}
