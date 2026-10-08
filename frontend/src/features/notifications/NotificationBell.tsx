import { useEffect, useState } from "react";
import { Badge, Box, Chip, CircularProgress, Divider, IconButton, ListItemText, Menu, MenuItem, Stack, Tooltip, Typography } from "@mui/material";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import { api, expireSession } from "../../app/apiClient";
import { API_BASE, NOTIFICATIONS_CHANGED_EVENT } from "../../app/constants";
import { showToast } from "../../app/toast";
import type { Session } from "../../app/types";

type NotificationItem = {
  id: string;
  title: string;
  content: string;
  type: string;
  read: boolean;
  readAt: string | null;
  createdAt: string;
};

type NotificationFeed = {
  notifications: NotificationItem[];
  unreadCount: number;
};

export function NotificationBell({
  session,
  onViewAll,
}: {
  session: Session;
  onViewAll: () => void;
}) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [feed, setFeed] = useState<NotificationFeed>({ notifications: [], unreadCount: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      setFeed(await api<NotificationFeed>("/notifications", session));
    } catch (err) {
      setError(err instanceof Error ? err.message : "无法加载通知");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    function handleNotificationsChanged() {
      void load();
    }
    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, handleNotificationsChanged);
    return () =>
      window.removeEventListener(
        NOTIFICATIONS_CHANGED_EVENT,
        handleNotificationsChanged,
      );
  }, [session]);

  useEffect(() => {
    const controller = new AbortController();
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;

    async function connect() {
      try {
        const response = await fetch(`${API_BASE}/notifications/stream`, {
          headers: { Authorization: `Bearer ${session.token}` },
          signal: controller.signal,
        });
        if (response.status === 401) {
          expireSession();
          return;
        }
        if (!response.ok || !response.body) throw new Error("通知推送连接失败");
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        while (!controller.signal.aborted) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer = (buffer + decoder.decode(value, { stream: true })).replaceAll("\r\n", "\n");
          let boundary = buffer.indexOf("\n\n");
          while (boundary >= 0) {
            const event = buffer.slice(0, boundary);
            buffer = buffer.slice(boundary + 2);
            if (event.includes("event:notification")) {
              window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT));
            }
            boundary = buffer.indexOf("\n\n");
          }
        }
      } catch {
        // The retry below handles brief network or server interruptions.
      } finally {
        if (!controller.signal.aborted) reconnectTimer = setTimeout(() => void connect(), 3_000);
      }
    }

    void connect();
    return () => {
      controller.abort();
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, [session.token]);

  async function markRead(notification: NotificationItem) {
    if (notification.read) return;
    try {
      const updated = await api<NotificationItem>(`/notifications/${notification.id}/read`, session, { method: "PATCH" });
      setFeed(current => ({
        unreadCount: Math.max(0, current.unreadCount - 1),
        notifications: current.notifications.map(item => item.id === updated.id ? updated : item),
      }));
    } catch (err) {
      showToast(err instanceof Error ? err.message : "通知更新失败", "error");
    }
  }

  function toggle(event: React.MouseEvent<HTMLElement>) {
    if (anchor) {
      setAnchor(null);
      return;
    }
    setAnchor(event.currentTarget);
    void load();
  }

  return <>
    <Tooltip title="通知">
      <IconButton aria-label={`通知，${feed.unreadCount} 条未读`} onClick={toggle}>
        <Badge badgeContent={feed.unreadCount} color="error" max={99} invisible={!feed.unreadCount}>
          <NotificationsNoneIcon />
        </Badge>
      </IconButton>
    </Tooltip>
    <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}
      slotProps={{ paper: { sx: { width: 380, maxWidth: "calc(100vw - 32px)", maxHeight: 560 } } }}>
      <Box sx={{ px: 2, py: 1.25 }}><Typography variant="subtitle1" sx={{ fontWeight: 700 }}>通知</Typography><Typography variant="caption" color="text.secondary">最近 10 条</Typography></Box>
      <Divider />
      {loading ? <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}><CircularProgress size={24} /></Box>
        : error ? <Box sx={{ p: 2 }}><Typography color="error" variant="body2">{error}</Typography></Box>
          : feed.notifications.length ? feed.notifications.map(notification => (
            <MenuItem key={notification.id} onClick={() => void markRead(notification)} sx={{ alignItems: "flex-start", whiteSpace: "normal", py: 1.25, bgcolor: notification.read ? "transparent" : "action.hover" }}>
              <ListItemText
                primary={<Stack direction="row" spacing={1} sx={{ alignItems: "center" }}><Typography variant="body2" sx={{ flex: 1, fontWeight: notification.read ? 400 : 700 }}>{notification.title}</Typography><Chip size="small" label={notification.read ? "已读" : "未读"} color={notification.read ? "default" : "primary"} /></Stack>}
                secondary={<><Typography component="span" variant="body2" color="text.secondary">{notification.content}</Typography><Typography component="span" variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>{formatNotificationTime(notification.createdAt)}</Typography></>}
              />
            </MenuItem>
          )) : <Box sx={{ p: 3, textAlign: "center" }}><Typography variant="body2" color="text.secondary">暂无通知</Typography></Box>}
      <Divider />
      <MenuItem onClick={() => { setAnchor(null); onViewAll(); }} sx={{ justifyContent: "center" }}>
        查看全部
      </MenuItem>
    </Menu>
  </>;
}

function formatNotificationTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}
