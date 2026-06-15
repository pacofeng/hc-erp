import { useEffect, useMemo, useState } from "react";
import { Button, IconButton } from "@/components/ui/button";
import { FormControl } from "@/components/ui/form";
import { AppBar, Box, Chip, Paper, Stack, Toolbar } from "@/components/ui/layout";
import { MenuItem, Select } from "@/components/ui/select";
import { Tooltip } from "@/components/ui/tooltip";
import { LogOut } from "lucide-react";
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
    <Box className="min-h-screen bg-background">
      <AppBar position="sticky" color="inherit" elevation={0}>
        <Toolbar>
          <Box className="flex-1">
            <Box
              component="img"
              src={LOGO_SRC}
              alt="Hengchang Machinery"
              className="block h-auto w-[190px] max-w-full sm:w-[260px]"
            />
          </Box>
          <Stack direction="row" spacing={1} className="items-center">
            <FormControl size="small" className="min-w-[150px]">
              <Select
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
                <LogOut size={16} />
              </IconButton>
            </Tooltip>
          </Stack>
        </Toolbar>
      </AppBar>
      <Box
        className="grid flex-1 grid-cols-1 gap-4 p-4 md:grid-cols-[220px_minmax(0,1fr)]"
      >
        <Paper className="self-start p-2">
          {visibleResources.map((item) => (
            <Button
              key={item.key}
              fullWidth
              startIcon={item.icon}
              variant={activeResource === item.key ? "contained" : "text"}
              onClick={() => selectResource(item.key)}
              className="mb-1 justify-start"
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
