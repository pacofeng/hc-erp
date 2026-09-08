import { useState, type ReactNode } from "react";
import {
  AppBar,
  Box,
  IconButton,
  InputAdornment,
  TextField,
  Toolbar,
  Typography,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { ERP_VERSION, LOGO_SRC } from "../app/constants";

export function PublicPageShell({
  maxWidth = 420,
  children,
}: {
  maxWidth?: number;
  children: ReactNode;
}) {
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <PublicTopBar />
      <Box
        sx={{
          minHeight: "calc(100vh - 121px)",
          display: "grid",
          placeItems: "center",
          px: 2,
          py: 4,
        }}
      >
        <Box sx={{ width: "100%", maxWidth }}>{children}</Box>
      </Box>
      <AppFooter />
    </Box>
  );
}

export function PublicTopBar() {
  return (
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
      </Toolbar>
    </AppBar>
  );
}

export function AppFooter() {
  return (
    <Box
      component="footer"
      sx={{
        position: "sticky",
        bottom: 0,
        zIndex: 10,
        borderTop: "1px solid #dde3dc",
        bgcolor: "background.default",
        color: "text.secondary",
        px: 2,
        py: 1.5,
        textAlign: "left",
      }}
    >
      <Typography variant="caption">ERP {ERP_VERSION}</Typography>
    </Box>
  );
}

export function PasswordTextField({
  label,
  value,
  onChange,
  required,
  autoComplete,
  fullWidth = true,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  autoComplete?: string;
  fullWidth?: boolean;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <TextField
      fullWidth={fullWidth}
      label={label}
      type={visible ? "text" : "password"}
      value={value}
      required={required}
      autoComplete={autoComplete}
      onChange={(event) => onChange(event.target.value)}
      slotProps={{
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                edge="end"
                onClick={() => setVisible((current) => !current)}
                onMouseDown={(event) => event.preventDefault()}
                aria-label={visible ? "Hide password" : "Show password"}
              >
                {visible ? <VisibilityOffIcon /> : <VisibilityIcon />}
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
    />
  );
}
