import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function authHeaders(): HeadersInit {
  const token = localStorage.getItem("rentnearn_token");
  return token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
}

export interface MembershipPlan {
  id: number;
  name: string;
  slug: string;
  pricePaise: number;
  billingPeriod: "trial" | "monthly" | "yearly";
  durationDays: number;
  maxListings: number;
  maxImages: number;
  features: string[];
  isActive: boolean;
  sortOrder: number;
}

export interface UserMembershipInfo {
  membership: {
    id: number;
    userId: number;
    planId: number;
    status: string;
    startedAt: string;
    expiresAt: string;
    amountPaise: number;
  } | null;
  plan: MembershipPlan | null;
  listingsUsed: number;
  listingLimit: number;
  daysRemaining: number;
}

/** Fetch all public membership plans */
export function useMembershipPlans() {
  return useQuery<MembershipPlan[]>({
    queryKey: ["memberships", "plans"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/memberships/plans`);
      if (!res.ok) throw new Error("Failed to fetch plans");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

/** Fetch current user's active membership */
export function useMyMembership() {
  const { isAuthenticated } = useAuth();
  return useQuery<UserMembershipInfo>({
    queryKey: ["memberships", "me"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/memberships/me`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to fetch membership");
      return res.json();
    },
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
  });
}

/** Admin: fetch all subscriptions */
export function useAdminSubscriptions(page = 1) {
  return useQuery({
    queryKey: ["admin", "subscriptions", page],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/memberships/admin/subscriptions?page=${page}&limit=20`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch subscriptions");
      return res.json() as Promise<{
        data: Array<{
          membership: UserMembershipInfo["membership"] & { status: string; expiresAt: string };
          plan: Pick<MembershipPlan, "id" | "name" | "slug">;
          user: { id: number; name: string; email: string };
        }>;
        total: number; page: number; totalPages: number;
      }>;
    },
    staleTime: 30 * 1000,
  });
}

/** Admin: fetch all plans including inactive */
export function useAdminPlans() {
  return useQuery<MembershipPlan[]>({
    queryKey: ["admin", "plans"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/memberships/admin/plans`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to fetch admin plans");
      return res.json();
    },
    staleTime: 30 * 1000,
  });
}

/** Admin: toggle plan active/inactive */
export function useTogglePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const res = await fetch(`${BASE}/api/memberships/admin/plans/${id}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ isActive }),
      });
      if (!res.ok) throw new Error("Failed to update plan");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "plans"] }),
  });
}

/** Admin: cancel a subscription */
export function useCancelSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${BASE}/api/memberships/admin/subscriptions/${id}/cancel`, {
        method: "PATCH",
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Failed to cancel subscription");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "subscriptions"] }),
  });
}
