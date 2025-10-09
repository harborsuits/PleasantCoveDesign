import { useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { getSocket } from "@/lib/ws/SocketService";

export function useWsToasts() {
  const { toast } = useToast();
  useEffect(() => {
    let socket: any = null;

    const initSocket = async () => {
      try {
        socket = await getSocket();

        function onActivity(e: any) {
          toast({ title: "Activity", description: e.detail?.type ?? "New activity" });
        }
        function onAppt(e: any) {
          toast({ title: "Appointment", description: "Calendar updated" });
        }
        function onMsg(e: any) {
          toast({ title: "New Message", description: e.detail?.text ?? "You received a message" });
        }

        window.addEventListener("activity:new", onActivity as any);
        window.addEventListener("appointment.created", onAppt as any);
        window.addEventListener("message.new", onMsg as any);
      } catch (error) {
        console.error("Failed to initialize WebSocket for toasts:", error);
      }
    };

    initSocket();

    return () => {
      if (socket) {
        window.removeEventListener("activity:new", () => {});
        window.removeEventListener("appointment.created", () => {});
        window.removeEventListener("message.new", () => {});
      }
    };
  }, [toast]);
}
