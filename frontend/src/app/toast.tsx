import { useEffect, useState } from "react";
import { Alert, Snackbar } from "@mui/material";

type Toast = { message: string; severity: "success" | "error"; id: number };
const eventName = "hcerp-toast";
let sequence = 0;

export function showToast(message: string, severity: Toast["severity"]) {
  window.dispatchEvent(new CustomEvent<Toast>(eventName, {
    detail: { message, severity, id: ++sequence },
  }));
}

export function ToastHost() {
  const [toast, setToast] = useState<Toast | null>(null);
  useEffect(() => {
    const receive = (event: Event) => setToast((event as CustomEvent<Toast>).detail);
    window.addEventListener(eventName, receive);
    return () => window.removeEventListener(eventName, receive);
  }, []);
  return (
    <Snackbar
      key={toast?.id}
      open={Boolean(toast)}
      anchorOrigin={{ vertical: "top", horizontal: "right" }}
      autoHideDuration={6000}
      onClose={(_, reason) => { if (reason !== "clickaway") setToast(null); }}
    >
      <Alert severity={toast?.severity ?? "success"} variant="filled"
        onClose={() => setToast(null)} sx={{ alignItems: "center", maxWidth: 480 }}>
        {toast?.message}
      </Alert>
    </Snackbar>
  );
}
