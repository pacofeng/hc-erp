import { useEffect, useMemo, useState } from "react";
import {
  AppBar,
  Box,
  Button,
  Chip,
  Collapse,
  IconButton,
  Paper,
  Stack,
  Toolbar,
  Tooltip,
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { LOGO_SRC, RESOURCE_STORAGE_KEY } from "../../app/constants";
import type { Translation } from "../../app/i18n";
import {
  allowedResource,
  canViewResource,
  getInitialResource,
  getResourceFromPath,
  getStoredResource,
  resourcePath,
  resources,
} from "../../app/resources";
import type { Language, Session } from "../../app/types";
import { AppFooter } from "../../components/AppChrome";
import { DashboardPanel } from "../dashboard/DashboardPanel";
import { ResourcePanel } from "../resources/ResourcePanel";
import { SettingsPanel } from "../settings/SettingsPanel";
import { OrdersPanel } from "../orders/OrdersPanel";
import { NotificationBell } from "../notifications/NotificationBell";
import { NotificationCenter } from "../notifications/NotificationCenter";

export function Shell({
  session,
  language,
  t,
  onLogout,
}: {
  session: Session;
  language: Language;
  t: Translation;
  onLogout: () => void;
}) {
  const [resource, setResource] = useState(() => getInitialResource());
  const [accessControlOpen, setAccessControlOpen] = useState(() => ["accounts", "roles", "permissions"].includes(getInitialResource()));
  const visibleResources = useMemo(
    () => resources.filter((item) => canViewResource(item.key, session)),
    [session],
  );
  const activeResource = allowedResource(resource, session);
  const accessControlResources = visibleResources.filter(item => ["accounts", "roles", "permissions"].includes(item.key));
  const primaryResources = visibleResources.filter(item => !["accounts", "roles", "permissions", "notifications", "settings"].includes(item.key));
  const settingsResource = visibleResources.find(item => item.key === "settings");

  function selectResource(nextResource: string, search = "") {
    if (!canViewResource(nextResource, session)) return;
    setResource(nextResource);
    localStorage.setItem(RESOURCE_STORAGE_KEY, nextResource);
    const targetPath = `${resourcePath(nextResource)}${search}`;
    if (`${window.location.pathname}${window.location.search}` !== targetPath) {
      window.history.pushState(null, "", targetPath);
    }
  }

  useEffect(() => {
    const nextResource = allowedResource(
      getResourceFromPath() ?? resource,
      session,
    );
    if (nextResource !== resource) {
      setResource(nextResource);
    }
    localStorage.setItem(RESOURCE_STORAGE_KEY, nextResource);
    if (window.location.pathname !== resourcePath(nextResource)) {
      window.history.replaceState(null, "", resourcePath(nextResource));
      return;
    }
  }, [session]);

  useEffect(() => {
    if (["accounts", "roles", "permissions"].includes(activeResource)) setAccessControlOpen(true);
  }, [activeResource]);

  useEffect(() => {
    function handlePopState() {
      const routedResource = allowedResource(
        getResourceFromPath() ?? getStoredResource(),
        session,
      );
      setResource(routedResource);
      localStorage.setItem(RESOURCE_STORAGE_KEY, routedResource);
      if (window.location.pathname !== resourcePath(routedResource)) {
        window.history.replaceState(null, "", resourcePath(routedResource));
      }
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [session]);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar
        position="sticky"
        color="inherit"
        elevation={0}
        sx={{ borderBottom: "1px solid #dde3dc" }}
      >
        <Toolbar>
          <Box sx={{ flex: 1 }}>
            <Box
              component="img"
              src={LOGO_SRC}
              alt="Hengchang Machinery"
              sx={{
                display: "block",
                width: { xs: 190, sm: 260 },
                maxWidth: "100%",
                height: "auto",
              }}
            />
          </Box>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <NotificationBell session={session} onViewAll={() => selectResource("notifications")} />
            <Chip label={session.username} size="small" />
            <Tooltip title={t.signOut}>
              <IconButton onClick={onLogout}>
                <LogoutIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Toolbar>
      </AppBar>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "220px 1fr" },
          gap: 2,
          p: 2,
          flex: 1,
        }}
      >
        <Paper sx={{ p: 1, alignSelf: "start" }}>
          {primaryResources.map((item) => (
            <Button
              key={item.key}
              fullWidth
              startIcon={item.icon}
              variant={activeResource === item.key ? "contained" : "text"}
              onClick={() => selectResource(item.key)}
              sx={{ justifyContent: "flex-start", mb: 0.5 }}
            >
              {t.resources[item.key]}
            </Button>
          ))}
          {accessControlResources.length > 0 && <>
            <Button
              fullWidth
              startIcon={<AdminPanelSettingsIcon fontSize="small" />}
              endIcon={accessControlOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              color={accessControlResources.some(item => item.key === activeResource) ? "primary" : "inherit"}
              onClick={() => setAccessControlOpen(open => !open)}
              sx={{ justifyContent: "flex-start", mb: 0.5 }}
            >
              账号与权限
            </Button>
            <Collapse in={accessControlOpen} timeout="auto" unmountOnExit>
              <Stack spacing={0.5} sx={{ pl: 1 }}>
                {accessControlResources.map((item) => (
                  <Button
                    key={item.key}
                    fullWidth
                    startIcon={item.icon}
                    variant={activeResource === item.key ? "contained" : "text"}
                    onClick={() => selectResource(item.key)}
                    sx={{ justifyContent: "flex-start" }}
                  >
                    {t.resources[item.key]}
                  </Button>
                ))}
              </Stack>
            </Collapse>
          </>}
          {settingsResource && (
            <Button
              fullWidth
              startIcon={settingsResource.icon}
              variant={activeResource === settingsResource.key ? "contained" : "text"}
              onClick={() => selectResource(settingsResource.key)}
              sx={{ justifyContent: "flex-start", mt: accessControlResources.length ? 0.5 : 0, mb: 0.5 }}
            >
              {t.resources.settings}
            </Button>
          )}
        </Paper>
        {activeResource === "dashboard" ? (
          <DashboardPanel
            session={session}
            t={t}
            visibleResources={visibleResources}
            onNavigate={selectResource}
          />
        ) : activeResource === "orders" ? (
          <OrdersPanel session={session} />
        ) : activeResource === "settings" ? (
          <SettingsPanel session={session} language={language} t={t} />
        ) : activeResource === "notifications" ? (
          <NotificationCenter session={session} />
        ) : (
          <ResourcePanel
            key={activeResource}
            resource={activeResource}
            session={session}
            language={language}
            t={t}
          />
        )}
      </Box>
      <AppFooter />
    </Box>
  );
}
