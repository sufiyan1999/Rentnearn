import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function authHeaders(): HeadersInit {
  const token = localStorage.getItem("rentnearn_token");
  return token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AdminBusinessProfile {
  user: { id: number; name: string; email: string; isVerified: boolean; createdAt: string };
  profile: {
    id: number; userId: number; businessName: string; logo: string | null;
    description: string | null; contactEmail: string | null; contactPhone: string | null;
    city: string | null; state: string | null; website: string | null; gstNumber: string | null;
    createdAt: string;
  } | null;
}

export interface AdminCategory {
  id: number; name: string; slug: string; icon: string; description: string | null;
  parentId: number | null; isActive: boolean; listingCount: number;
  subcategories: Array<{ id: number; name: string; slug: string; icon: string; isActive: boolean }>;
}

export interface AdminReports {
  totalRevenuePaise: number;
  revenueByPlan: Array<{ planName: string; planSlug: string; totalRupees: number; count: number }>;
  listingsPerDay: Array<{ day: string; count: number }>;
  topCities: Array<{ city: string; count: number }>;
  userGrowth: Array<{ day: string; count: number }>;
  membershipBreakdown: Array<{ planName: string; planSlug: string; count: number }>;
}

// ─── Business Profiles ───────────────────────────────────────────────────────

export function useAdminBusinessProfiles(verified?: "true" | "false") {
  return useQuery<AdminBusinessProfile[]>({
    queryKey: ["admin", "business-profiles", verified],
    queryFn: async () => {
      const url = verified ? `${BASE}/api/admin/business-profiles?verified=${verified}` : `${BASE}/api/admin/business-profiles`;
      const res = await fetch(url, { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to fetch business profiles");
      return res.json();
    },
    staleTime: 30 * 1000,
  });
}

export function useApproveBusinessProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: number) => {
      const res = await fetch(`${BASE}/api/admin/business-profiles/${userId}/approve`, {
        method: "PATCH", headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Failed to approve");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "business-profiles"] }),
  });
}

export function useRejectBusinessProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: number) => {
      const res = await fetch(`${BASE}/api/admin/business-profiles/${userId}/reject`, {
        method: "PATCH", headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Failed to reject");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "business-profiles"] }),
  });
}

// ─── Categories ───────────────────────────────────────────────────────────────

export function useAdminCategories() {
  return useQuery<AdminCategory[]>({
    queryKey: ["admin", "categories"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/admin/categories`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to fetch categories");
      return res.json();
    },
    staleTime: 60 * 1000,
  });
}

export function useAddCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; slug: string; icon: string; description?: string }) => {
      const res = await fetch(`${BASE}/api/admin/categories`, {
        method: "POST", headers: authHeaders(), body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).error ?? "Failed to create category");
      }
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "categories"] }),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number; isActive?: boolean; name?: string; description?: string }) => {
      const res = await fetch(`${BASE}/api/admin/categories/${id}`, {
        method: "PATCH", headers: authHeaders(), body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update category");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "categories"] }),
  });
}

// ─── Reports ─────────────────────────────────────────────────────────────────

export function useAdminReports() {
  return useQuery<AdminReports>({
    queryKey: ["admin", "reports"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/admin/reports`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to fetch reports");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}
