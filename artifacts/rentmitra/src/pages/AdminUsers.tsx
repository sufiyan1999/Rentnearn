import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { useAdminGetUsers, getAdminGetUsersQueryKey, useVerifyUser } from "@workspace/api-client-react";
import { Button } from "@/components/ui/ui-core";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";

export default function AdminUsers() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated || user?.userType !== 'admin') {
      setLocation("/");
    }
  }, [isAuthenticated, user, setLocation]);

  const { data: usersData, isLoading } = useAdminGetUsers({ limit: 100 }, {
    query: {
      enabled: isAuthenticated && user?.userType === 'admin',
      queryKey: getAdminGetUsersQueryKey({ limit: 100 })
    }
  });

  const verifyMutation = useVerifyUser();

  const handleVerify = (id: number) => {
    verifyMutation.mutate({ userId: id }, {
      onSuccess: () => {
        toast.success("User verified");
        queryClient.invalidateQueries({ queryKey: getAdminGetUsersQueryKey({ limit: 100 }) });
      }
    });
  };

  if (!isAuthenticated || user?.userType !== 'admin') return null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl pb-24">
      <h1 className="text-3xl font-bold mb-8">Manage Users</h1>

      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-secondary text-muted-foreground">
              <tr>
                <th className="p-4 font-semibold">ID</th>
                <th className="p-4 font-semibold">Name</th>
                <th className="p-4 font-semibold">Email</th>
                <th className="p-4 font-semibold">Type</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Loading...</td></tr>
              ) : !usersData?.data?.length ? (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No users found</td></tr>
              ) : (
                usersData.data.map(u => (
                  <tr key={u.id} className="hover:bg-muted/50 transition-colors">
                    <td className="p-4">#{u.id}</td>
                    <td className="p-4 font-medium flex items-center gap-2">
                      {u.name}
                      {u.isVerified && <ShieldCheck className="w-4 h-4 text-primary" />}
                    </td>
                    <td className="p-4">{u.email}</td>
                    <td className="p-4 capitalize">{u.userType}</td>
                    <td className="p-4 text-right">
                      {!u.isVerified && (
                        <Button size="sm" variant="outline" onClick={() => handleVerify(u.id)}>
                          Verify Identity
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
