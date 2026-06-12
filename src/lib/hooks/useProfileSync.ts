import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAppStore } from "@/store/useAppStore";
import type { User } from "@/types";
import toast from "react-hot-toast";

/**
 * Hook to sync user profile with the backend API.
 */
export function useProfileSync() {
  const queryClient = useQueryClient();
  const { setAuth, auth } = useAppStore();

  // Fetch profile
  const { isLoading: isLoadingProfile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const response = await api.get<{ data: User }>("/api/v1/auth/me");
      const user = response.data;
      if (user) {
        setAuth(user, auth.token, auth.refreshToken);
      }
      return user;
    },
    enabled: !!auth.token,
  });

  // Update profile
  const updateProfileMutation = useMutation({
    mutationFn: (name: string) => 
      api.put(`/api/v1/auth/me?name=${encodeURIComponent(name)}`, {}),
    onSuccess: (_, name) => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      // Update local state immediately for better UX
      if (auth.user) {
        setAuth({ ...auth.user, name }, auth.token, auth.refreshToken);
      }
      toast.success("Profile updated");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return {
    isLoadingProfile,
    updateProfile: updateProfileMutation.mutate,
    isUpdating: updateProfileMutation.isPending,
  };
}
