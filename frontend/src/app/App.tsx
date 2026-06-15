"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Typography } from "@/components/ui/typography";
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
import { api } from "./apiClient";
import { Login, SecurityQuestionSetup } from "../features/auth/AuthPages";
import { Shell } from "../features/shell/AppShell";
import { getPreferredLanguage, messages } from "./i18n";
import {
  getResourceFromPath,
  getStoredResource,
  navigate,
  resourcePath,
} from "./resources";
import type { Language, Session } from "./types";

function isBrowser() {
  return typeof window !== "undefined";
}

function readStoredSession(): Session | null {
  if (!isBrowser()) return null;
  const raw = window.localStorage.getItem("hcerp-session");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    window.localStorage.removeItem("hcerp-session");
    return null;
  }
}

export function App() {
  const [storageLoaded, setStorageLoaded] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [routeVersion, setRouteVersion] = useState(0);
  const [language, setLanguage] = useState<Language>("zh-CN");
  const [showInactivityWarning, setShowInactivityWarning] = useState(false);
  const [inactivityCountdown, setInactivityCountdown] = useState(
    INACTIVITY_WARNING_SECONDS,
  );
  const inactivityWarningVisibleRef = useRef(false);
  const t = messages[language];

  useEffect(() => {
    if (!isBrowser()) return;
    const storedSession = readStoredSession();
    setSession(storedSession);
    setLanguage(getPreferredLanguage(storedSession));
    setStorageLoaded(true);
  }, []);

  function saveSession(next: Session | null) {
    setSession(next);
    const nextLanguage = getPreferredLanguage(next);
    setLanguage(nextLanguage);
    if (!isBrowser()) return;
    window.localStorage.setItem("hcerp-language", nextLanguage);
    if (next) {
      window.localStorage.setItem("hcerp-session", JSON.stringify(next));
      window.sessionStorage.removeItem(POST_LOGIN_RESOURCE_KEY);
      window.localStorage.setItem(RESOURCE_STORAGE_KEY, "dashboard");
      navigate(
        next.securityQuestionsConfigured
          ? resourcePath("dashboard")
          : SECURITY_QUESTIONS_PATH,
        true,
      );
    } else {
      window.localStorage.removeItem("hcerp-session");
      navigate(LOGIN_PATH, true);
    }
  }

  function updateSession(next: Session) {
    setSession(next);
    if (!isBrowser()) return;
    window.localStorage.setItem("hcerp-session", JSON.stringify(next));
    if (next.securityQuestionsConfigured) {
      navigate(resourcePath("dashboard"), true);
    }
  }

  async function saveLanguage(nextLanguage: Language) {
    setLanguage(nextLanguage);
    if (isBrowser()) {
      window.localStorage.setItem("hcerp-language", nextLanguage);
    }
    if (!session) return;
    const updatedSession = { ...session, language: nextLanguage };
    setSession(updatedSession);
    if (isBrowser()) {
      window.localStorage.setItem(
        "hcerp-session",
        JSON.stringify(updatedSession),
      );
    }
    await api("/auth/language", updatedSession, {
      method: "PUT",
      body: JSON.stringify({ language: nextLanguage }),
    });
  }

  useEffect(() => {
    if (!isBrowser()) return;

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
    if (!isBrowser()) return;

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
    if (!isBrowser()) return;

    if (!storageLoaded || !session) {
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
      saveSession(null);
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
  }, [session, storageLoaded]);

  useEffect(() => {
    if (!isBrowser() || !storageLoaded) return;

    if (!session) {
      const requestedResource = getResourceFromPath();
      if (requestedResource)
        window.sessionStorage.setItem(POST_LOGIN_RESOURCE_KEY, requestedResource);
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
  }, [session, routeVersion, storageLoaded]);

  if (!storageLoaded) return null;

  return (
    <>
      {session ? (
        !session.securityQuestionsConfigured ? (
          <SecurityQuestionSetup
            session={session}
            language={language}
            t={t}
            onLanguageChange={saveLanguage}
            onSaved={() =>
              updateSession({ ...session, securityQuestionsConfigured: true })
            }
            onLogout={() => saveSession(null)}
          />
        ) : (
          <>
            <Shell
              session={session}
              language={language}
              t={t}
              onLanguageChange={saveLanguage}
              onLogout={() => saveSession(null)}
            />
            <Dialog open={showInactivityWarning} maxWidth="xs" fullWidth>
              <DialogTitle>{t.inactivityWarningTitle}</DialogTitle>
              <DialogContent>
                <Typography variant="body2">
                  {t.inactivityWarningMessage}
                </Typography>
                <Typography variant="h4" className="mt-4">
                  {inactivityCountdown}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t.inactivityCountdown}
                </Typography>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => saveSession(null)}>{t.signOut}</Button>
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
          language={language}
          t={t}
          onLanguageChange={saveLanguage}
          onLogin={saveSession}
        />
      )}
    </>
  );
}
