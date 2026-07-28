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

export interface EnhancedAdminStats {
  // Users
  totalUsers: number; newUsersToday: number; newUsersWeek: number; newUsersMonth: number;
  prevUsersToday: number; prevUsersWeek: number; prevUsersMonth: number;
  totalBusiness: number; verifiedBusiness: number;
  // Listings
  totalListings: number; pendingApprovals: number; activeListings: number;
  expiredListings: number; featuredListings: number; rejectedListings: number; newListingsMonth: number;
  // Analytics
  totalFavourites: number; totalTimesRented: number; totalViews: number;
  viewsToday: number; viewsWeek: number; viewsMonth: number;
  totalWhatsappClicks: number; totalPhoneClicks: number; totalShareCount: number;
  totalQrScans: number; totalContactClicks: number;
  // Revenue
  revenueTodayPaise: number; revenueWeekPaise: number; revenueMonthPaise: number;
  revenueYearPaise: number; prevRevenueMonthPaise: number; pctRevenueChange: number | null;
  failedPayments: number; paymentSuccessRate: number; membershipsExpiringSoon: number;
  // Health & insights
  healthScore: number; healthLabel: string; insights: string[];
  // Top lists
  topCategories: Array<{ category: string; count: number }>;
  topFavourites: Array<{ id: number; title: string; category: string; city: string; isFeatured: boolean; favouriteCount: number }>;
}

export interface AuditLogRow {
  id: number; action: string; module: string; affectedId: number | null;
  affectedType: string | null; prevValue: unknown; newValue: unknown;
  ipAddress: string | null; userAgent: string | null; status: string; createdAt: string;
}

export interface AdminGoal {
  id: number; title: string; targetValue: number; metricType: string;
  deadline: string | null; createdAt: string; currentValue: number;
}

export interface TrendingListing {
  id: number; title: string; category: string; city: string; viewCount: number;
  whatsappClicks: number; phoneClicks: number; shareCount: number; timesRented: number;
  isFeatured: boolean; status: string; availabilityStatus: string; interestScore: number;
  ownerName: string | null; badge: { emoji: string; label: string } | null;
}

export interface PaymentAnalytics {
  revenueTodayPaise: number; revenueWeekPaise: number; revenueMonthPaise: number; revenueYearPaise: number;
  byPlan: Array<{ planName: string; planSlug: string; totalRupees: number; count: number }>;
  failedCount: number; successCount: number; successRate: number;
  avgPaymentRupees: number; mostPopularPlan: string | null;
}

// ─── Enhanced Stats ───────────────────────────────────────────────────────────

export function useAdminEnhancedStats() {
  return useQuery<EnhancedAdminStats>({
    queryKey: ["admin", "enhanced-stats"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/admin/stats`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
}

// ─── Business Profiles ────────────────────────────────────────────────────────

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
      const res = await fetch(`${BASE}/api/admin/business-profiles/${userId}/approve`, { method: "PATCH", headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to approve");
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "business-profiles"] }); qc.invalidateQueries({ queryKey: ["admin", "enhanced-stats"] }); },
  });
}

export function useRejectBusinessProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: number) => {
      const res = await fetch(`${BASE}/api/admin/business-profiles/${userId}/reject`, { method: "PATCH", headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to reject");
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "business-profiles"] }); qc.invalidateQueries({ queryKey: ["admin", "enhanced-stats"] }); },
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
      const res = await fetch(`${BASE}/api/admin/categories`, { method: "POST", headers: authHeaders(), body: JSON.stringify(data) });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error((err as any).error ?? "Failed to create category"); }
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "categories"] }),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number; isActive?: boolean; name?: string; description?: string }) => {
      const res = await fetch(`${BASE}/api/admin/categories/${id}`, { method: "PATCH", headers: authHeaders(), body: JSON.stringify(data) });
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

// ─── Audit Log ────────────────────────────────────────────────────────────────

export function useAdminAuditLog(page: number, module: string, search: string) {
  return useQuery<{ data: AuditLogRow[]; total: number; totalPages: number }>({
    queryKey: ["admin", "audit-log", page, module, search],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (module && module !== "all") params.set("module", module);
      if (search) params.set("search", search);
      const res = await fetch(`${BASE}/api/admin/audit-log?${params}`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to fetch audit log");
      return res.json();
    },
    staleTime: 10 * 1000,
  });
}

// ─── Payment Analytics ────────────────────────────────────────────────────────

export function useAdminPaymentAnalytics() {
  return useQuery<PaymentAnalytics>({
    queryKey: ["admin", "payment-analytics"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/admin/payment-analytics`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to fetch payment analytics");
      return res.json();
    },
    staleTime: 60 * 1000,
  });
}

// ─── Goals ───────────────────────────────────────────────────────────────────

export function useAdminGoals() {
  return useQuery<AdminGoal[]>({
    queryKey: ["admin", "goals"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/admin/goals`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to fetch goals");
      return res.json();
    },
    staleTime: 30 * 1000,
  });
}

export function useCreateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { title: string; targetValue: number; metricType: string; deadline?: string }) => {
      const res = await fetch(`${BASE}/api/admin/goals`, { method: "POST", headers: authHeaders(), body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed to create goal");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "goals"] }),
  });
}

export function useDeleteGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${BASE}/api/admin/goals/${id}`, { method: "DELETE", headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to delete goal");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "goals"] }),
  });
}

// ─── Trending ─────────────────────────────────────────────────────────────────

export function useAdminTrending(limit = 20) {
  return useQuery<TrendingListing[]>({
    queryKey: ["admin", "trending", limit],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/admin/trending?limit=${limit}`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to fetch trending");
      return res.json();
    },
    staleTime: 60 * 1000,
  });
}

// ─── User actions ─────────────────────────────────────────────────────────────

export function useSuspendUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${BASE}/api/admin/users/${id}/suspend`, { method: "PATCH", headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to suspend user");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });
}

export function useActivateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${BASE}/api/admin/users/${id}/activate`, { method: "PATCH", headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to activate user");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });
}

export function useUserDetail(id: number | null) {
  return useQuery<{
    user: { id: number; name: string; email: string; userType: string; isSuspended: boolean; createdAt: string };
    listings: Array<{ id: number; title: string; status: string; viewCount: number; createdAt: string }>;
    memberships: Array<{ membership: { status: string; expiresAt: string; amountPaise: number }; planName: string }>;
  }>({
    queryKey: ["admin", "user-detail", id],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/admin/users/${id}/detail`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to fetch user detail");
      return res.json();
    },
    enabled: id !== null,
    staleTime: 30 * 1000,
  });
}

// ─── Listing actions (for AdminListings.tsx) ──────────────────────────────────

export function useDeleteListing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${BASE}/api/admin/listings/${id}`, { method: "DELETE", headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to delete listing");
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-listings"] }); qc.invalidateQueries({ queryKey: ["admin", "enhanced-stats"] }); },
  });
}

export function useExtendExpiry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, days }: { id: number; days: 30 | 60 | 90 }) => {
      const res = await fetch(`${BASE}/api/admin/listings/${id}/extend-expiry`, {
        method: "PATCH", headers: authHeaders(), body: JSON.stringify({ days }),
      });
      if (!res.ok) throw new Error("Failed to extend expiry");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-listings"] }),
  });
}

export function useFeatureListingAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, featured }: { id: number; featured: boolean }) => {
      const url = featured ? `${BASE}/api/admin/listings/${id}/feature` : `${BASE}/api/admin/listings/${id}/unfeature`;
      const res = await fetch(url, { method: "PATCH", headers: authHeaders(), body: JSON.stringify({ featured }) });
      if (!res.ok) throw new Error("Failed to update featured status");
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-listings"] }); qc.invalidateQueries({ queryKey: ["admin", "trending"] }); },
  });
}
