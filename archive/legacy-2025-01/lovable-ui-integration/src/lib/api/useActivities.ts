import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api/client";
import { ActivityList } from "./schemas/activity";

export function useUnifiedActivities(projectId?: string, companyId?: string, limit = 50) {
  return useQuery({
    queryKey: ["activities", "unified", projectId, companyId, limit],
    queryFn: async () => {
      const { data } = await api.get("/api/activities/unified", {
        params: { projectId, companyId, limit }
      });
      return ActivityList.parse(data);
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });
}
