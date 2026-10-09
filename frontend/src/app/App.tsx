import { useEffect, useMemo, useRef, useState } from "react";
import { ToastHost } from "./toast";
import { api, clearCsrfToken } from "./apiClient";
import {
  Button,
  CssBaseline,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  createTheme,
  ThemeProvider,
} from "@mui/material";
import {
  AUTH_EXPIRED_EVENT,
  INACTIVITY_TIMEOUT_MS,
  INACTIVITY_WARNING_MS,
  INACTIVITY_WARNING_SECONDS,
  LOGIN_PATH,
  POST_LOGIN_RESOURCE_KEY,
  RESOURCE_STORAGE_KEY,
  SECURITY_QUESTIONS_PATH,
  USER_ACTIVITY_EVENT,
} from "./constants";
import { Login, SecurityQuestionSetup } from "../features/auth/AuthPages";
import { Shell } from "../features/shell/AppShell";
import { getPreferredLanguage, messages } from "./i18n";
import {
  getResourceFromPath,
  getStoredResource,
  navigate,
  resourcePath,
} from "./resources";
import type { Session } from "./types";

export function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [routeVersion, setRouteVersion] = useState(0);
  const [showInactivityWarning, setShowInactivityWarning] = useState(false);
  const [inactivityCountdown, setInactivityCountdown] = useState(
    INACTIVITY_WARNING_SECONDS,
  );
  const inactivityWarningVisibleRef = useRef(false);
  const language = getPreferredLanguage();
  const t = messages;

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: "light",
          primary: { main: "#285c52" },
          secondary: { main: "#7c3f58" },
          background: { default: "#f7f8f5" },
        },
        shape: { borderRadius: 6 },
        typography: { fontFamily: "Inter, Arial, sans-serif" },
        components: {
          MuiButton: {
            styleOverrides: {
              root: { textTransform: "none", fontWeight: 600 },
            },
          },
          MuiTableCell: {
            styleOverrides: {
              head: { fontWeight: 700, backgroundColor: "#eef2ed" },
            },
          },
          MuiTextField: {
            defaultProps: {
              size: "small",
            },
          },
          MuiFormControl: {
            defaultProps: {
              size: "small",
            },
          },
          MuiSelect: {
            defaultProps: {
              size: "small",
            },
          },
        },
      }),
    [],
  );

  function saveSession(next: Session | null) {
    setSession(next);
    if (next) {
      sessionStorage.removeItem(POST_LOGIN_RESOURCE_KEY);
      localStorage.setItem(RESOURCE_STORAGE_KEY, "dashboard");
      navigate(
        next.securityQuestionsConfigured
          ? resourcePath("dashboard")
          : SECURITY_QUESTIONS_PATH,
        true,
      );
    } else {
      navigate(LOGIN_PATH, true);
    }
  }

  function updateSession(next: Session) {
    setSession(next);
    if (next.securityQuestionsConfigured) {
      navigate(resourcePath("dashboard"), true);
    }
  }

  async function logout() {
    const currentSession = session;
    saveSession(null);
    try {
      if (currentSession) {
        await api("/auth/logout", currentSession, { method: "POST" });
      }
    } catch {
      // Client logout must still complete if a session has already expired.
    } finally {
      clearCsrfToken();
    }
  }

  useEffect(() => {
    let active = true;
    api<Session | undefined>("/auth/session")
      .then(next => { if (active && next) setSession(next); })
      .catch(() => undefined)
      .finally(() => { if (active) setAuthChecked(true); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    function handlePopState() {
      setRouteVersion((version) => version + 1);
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    inactivityWarningVisibleRef.current = showInactivityWarning;
  }, [showInactivityWarning]);

  useEffect(() => {
    function handleAuthExpired() {
      setShowInactivityWarning(false);
      setInactivityCountdown(INACTIVITY_WARNING_SECONDS);
      setSession(null);
      setRouteVersion((version) => version + 1);
    }

    window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    return () =>
      window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
  }, []);

  useEffect(() => {
    if (!session) {
      setShowInactivityWarning(false);
      setInactivityCountdown(INACTIVITY_WARNING_SECONDS);
      return;
    }

    let warningTimer: number | undefined;
    let logoutTimer: number | undefined;
    let countdownTimer: number | undefined;
    const activityEvents = [
      "mousemove",
      "mousedown",
      "keydown",
      "touchstart",
      "scroll",
      "wheel",
      USER_ACTIVITY_EVENT,
    ];

    function clearInactivityTimers() {
      if (warningTimer) window.clearTimeout(warningTimer);
      if (logoutTimer) window.clearTimeout(logoutTimer);
      if (countdownTimer) window.clearInterval(countdownTimer);
      warningTimer = undefined;
      logoutTimer = undefined;
      countdownTimer = undefined;
    }

    function logoutDueToInactivity() {
      clearInactivityTimers();
      setShowInactivityWarning(false);
      setInactivityCountdown(INACTIVITY_WARNING_SECONDS);
      void logout();
    }

    function showInactivityModal() {
      setInactivityCountdown(INACTIVITY_WARNING_SECONDS);
      setShowInactivityWarning(true);
      countdownTimer = window.setInterval(() => {
        setInactivityCountdown((current) => Math.max(current - 1, 0));
      }, 1000);
    }

    function resetInactivityTimers(event?: Event) {
      if (
        inactivityWarningVisibleRef.current &&
        event?.type !== USER_ACTIVITY_EVENT
      ) {
        return;
      }
      clearInactivityTimers();
      setShowInactivityWarning(false);
      setInactivityCountdown(INACTIVITY_WARNING_SECONDS);
      warningTimer = window.setTimeout(
        showInactivityModal,
        INACTIVITY_WARNING_MS,
      );
      logoutTimer = window.setTimeout(
        logoutDueToInactivity,
        INACTIVITY_TIMEOUT_MS,
      );
    }

    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, resetInactivityTimers, {
        passive: true,
      });
    });
    resetInactivityTimers();

    return () => {
      clearInactivityTimers();
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, resetInactivityTimers);
      });
    };
  }, [session]);

  useEffect(() => {
    if (!authChecked) return;
    if (!session) {
      const requestedResource = getResourceFromPath();
      if (requestedResource)
        sessionStorage.setItem(POST_LOGIN_RESOURCE_KEY, requestedResource);
      if (window.location.pathname !== LOGIN_PATH) navigate(LOGIN_PATH, true);
      return;
    }

    if (!session.securityQuestionsConfigured) {
      if (window.location.pathname !== SECURITY_QUESTIONS_PATH) {
        navigate(SECURITY_QUESTIONS_PATH, true);
      }
      return;
    }

    if (window.location.pathname === SECURITY_QUESTIONS_PATH) {
      navigate(resourcePath("dashboard"), true);
      return;
    }

    if (window.location.pathname === LOGIN_PATH || !getResourceFromPath()) {
      navigate(resourcePath(getStoredResource()), true);
    }
  }, [authChecked, session, routeVersion]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ToastHost />
      {!authChecked ? null : session ? (
        !session.securityQuestionsConfigured ? (
          <SecurityQuestionSetup
            session={session}
            t={t}
            onSaved={() =>
              updateSession({ ...session, securityQuestionsConfigured: true })
            }
            onLogout={() => void logout()}
          />
        ) : (
          <>
            <Shell
              session={session}
              language={language}
              t={t}
              onLogout={() => void logout()}
            />
            <Dialog open={showInactivityWarning} maxWidth="xs" fullWidth>
              <DialogTitle>{t.inactivityWarningTitle}</DialogTitle>
              <DialogContent>
                <Typography variant="body2">
                  {t.inactivityWarningMessage}
                </Typography>
                <Typography variant="h4" sx={{ mt: 2, fontWeight: 700 }}>
                  {inactivityCountdown}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t.inactivityCountdown}
                </Typography>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => void logout()}>{t.signOut}</Button>
                <Button
                  variant="contained"
                  onClick={() =>
                    window.dispatchEvent(new Event(USER_ACTIVITY_EVENT))
                  }
                >
                  {t.staySignedIn}
                </Button>
              </DialogActions>
            </Dialog>
          </>
        )
      ) : (
        <Login
          t={t}
          onLogin={saveSession}
        />
      )}
    </ThemeProvider>
  );
}
