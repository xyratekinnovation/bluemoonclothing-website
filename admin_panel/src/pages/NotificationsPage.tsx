import { Bell, Package, AlertTriangle, CreditCard, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiPatch, apiGet } from "@/lib/api";

interface Notification { id: string; type: "order" | "stock" | "payment"; title: string; message: string; time: string; read: boolean; }

const typeIcon = (type: string) => {
  switch (type) {
    case "order": return <Package className="w-5 h-5 text-info" />;
    case "stock": return <AlertTriangle className="w-5 h-5 text-warning" />;
    case "payment": return <CreditCard className="w-5 h-5 text-destructive" />;
    default: return <Bell className="w-5 h-5" />;
  }
};

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const { data: notifs = [] } = useQuery({
    queryKey: ["admin-notifications"],
    queryFn: async () => {
      const result = await apiGet<any[]>("/notifications");
      return result.map((notification) => ({
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        time: new Date(notification.created_at).toLocaleString(),
        read: notification.is_read,
      })) as Notification[];
    },
  });
  const patchMutation = useMutation({
    mutationFn: (id: string) => apiPatch(`/notifications/${id}/read`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-notifications"] }),
  });
  const markAllMutation = useMutation({
    mutationFn: () => apiPatch("/notifications/read-all", {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-notifications"] }),
  });

  const markAllRead = () => markAllMutation.mutate();
  const unreadCount = notifs.filter(n => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold">Notifications</h2><p className="text-sm text-muted-foreground">{unreadCount} unread</p></div>
        {unreadCount > 0 && <Button variant="outline" onClick={markAllRead}><Check className="w-4 h-4 mr-2" /> Mark all read</Button>}
      </div>

      <div className="space-y-2">
        {notifs.map(n => (
          <div
            key={n.id}
            className={`bg-card rounded-xl p-4 card-shadow flex items-start gap-4 cursor-pointer hover:card-shadow-hover transition-shadow ${!n.read ? "border-l-2 border-gold" : ""}`}
            onClick={() => patchMutation.mutate(n.id)}
          >
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">{typeIcon(n.type)}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className={`text-sm ${!n.read ? "font-semibold" : "font-medium"}`}>{n.title}</p>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{n.time}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
