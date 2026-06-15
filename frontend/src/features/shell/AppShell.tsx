import { useEffect, useMemo, useState } from "react";
import {
  AppBar,
  Box,
  Button,
  Chip,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Toolbar,
  Tooltip,
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
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

export function Shell({
  session,
  language,
  t,
  onLanguageChange,
  onLogout,
}: {
  session: Session;
  language: Language;
  t: Translation;
  onLanguageChange: (language: Language) => Promise<void>;
  onLogout: () => void;
}) {
  const [resource, setResource] = useState(() => getInitialResource());
  const visibleResources = useMemo(
    () => resources.filter((item) => canViewResource(item.key, session)),
    [session],
  );
  const activeResource = allowedResource(resource, session);

  function selectResource(nextResource: string) {
    if (!canViewResource(nextResource, session)) return;
    setResource(nextResource);
    localStorage.setItem(RESOURCE_STORAGE_KEY, nextResource);
    if (window.location.pathname !== resourcePath(nextResource)) {
      window.history.pushState(null, "", resourcePath(nextResource));
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
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>{t.language}</InputLabel>
              <Select
                label={t.language}
                value={language}
                onChange={(event) =>
                  void onLanguageChange(event.target.value as Language)
                }
              >
                <MenuItem value="zh-CN">简体中文</MenuItem>
                <MenuItem value="en">English</MenuItem>
              </Select>
            </FormControl>
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
          {visibleResources.map((item) => (
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
        </Paper>
        {activeResource === "dashboard" ? (
          <DashboardPanel
            session={session}
            t={t}
            visibleResources={visibleResources}
            onSelectResource={selectResource}
          />
        ) : activeResource === "settings" ? (
          <SettingsPanel session={session} language={language} t={t} />
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
