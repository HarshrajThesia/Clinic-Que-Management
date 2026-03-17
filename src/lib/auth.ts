export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "receptionist" | "doctor" | "patient";
  clinicId: string;
  clinicName: string;
  clinicCode: string;
}

export function getRoleRedirect(role: string): string {
  switch (role) {
    case "admin": return "/admin";
    case "receptionist": return "/receptionist";
    case "doctor": return "/doctor";
    case "patient": return "/patient";
    default: return "/login";
  }
}
