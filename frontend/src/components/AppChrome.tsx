import { useState, type ReactNode } from "react";
import { IconButton } from "@/components/ui/button";
import { FormControl } from "@/components/ui/form";
import { InputAdornment, TextField } from "@/components/ui/input";
import { AppBar, Box, Toolbar } from "@/components/ui/layout";
import { MenuItem, Select } from "@/components/ui/select";
import { Typography } from "@/components/ui/typography";
import { Eye, EyeOff } from "lucide-react";
import { ERP_VERSION, LOGO_SRC } from "../app/constants";
import type { Language } from "../app/types";
import type { Translation } from "../app/i18n";
import { cn } from "../lib/utils";

export function PublicPageShell({
  language,
  t,
  onLanguageChange,
  maxWidthClassName = "max-w-[420px]",
  children,
}: {
  language: Language;
  t: Translation;
  onLanguageChange: (language: Language) => Promise<void>;
  maxWidthClassName?: string;
  children: ReactNode;
}) {
  return (
    <Box className="min-h-screen bg-background">
      <PublicTopBar
        language={language}
        t={t}
        onLanguageChange={onLanguageChange}
      />
      <Box className="grid min-h-[calc(100vh-121px)] place-items-center px-4 py-8">
        <Box className={cn("w-full", maxWidthClassName)}>{children}</Box>
      </Box>
      <AppFooter />
    </Box>
  );
}

export function PublicTopBar({
  language,
  t,
  onLanguageChange,
}: {
  language: Language;
  t: Translation;
  onLanguageChange: (language: Language) => Promise<void>;
}) {
  return (
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
      </Toolbar>
    </AppBar>
  );
}

export function AppFooter() {
  return (
    <Box
      component="footer"
      className="sticky bottom-0 z-10 border-t border-border bg-background px-4 py-3 text-left text-muted-foreground"
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
  error,
  helperText,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  autoComplete?: string;
  fullWidth?: boolean;
  error?: boolean;
  helperText?: ReactNode;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <TextField
      fullWidth={fullWidth}
      label={label}
      type={visible ? "text" : "password"}
      value={value}
      required={required}
      error={error}
      helperText={helperText}
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
                {visible ? <EyeOff size={16} /> : <Eye size={16} />}
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
    />
  );
}
