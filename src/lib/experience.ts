export type Experience = "consumer" | "partner" | "admin";

export function getExperience(role?: string): Experience {
  if (role === "admin") return "admin";
  if (role === "promoter") return "partner";
  return "consumer";
}

export function getRoleHome(role?: string): string {
  if (role === "admin") return "/admin/analytics";
  if (role === "promoter") return "/promoter";
  return "/dashboard";
}
