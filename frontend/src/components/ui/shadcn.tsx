"use client";

import React, {
  cloneElement,
  isValidElement,
  useId,
  useMemo,
  type ElementType,
  type ReactElement,
  type ReactNode,
} from "react";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { cn } from "../../lib/utils";

function textFromNode(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textFromNode).join("");
  if (isValidElement<{ children?: ReactNode }>(node))
    return textFromNode(node.props.children);
  return "";
}

function stackSpacingClass(spacing: number) {
  const classes: Record<number, string> = {
    0: "gap-0",
    0.5: "gap-1",
    1: "gap-2",
    1.5: "gap-3",
    2: "gap-4",
    2.5: "gap-5",
    3: "gap-6",
    4: "gap-8",
  };
  return classes[spacing] ?? "gap-4";
}

export function Box({
  component,
  className,
  children,
  ...props
}: {
  component?: ElementType;
  className?: string;
  children?: ReactNode;
} & Record<string, unknown>) {
  const Component = component ?? "div";
  return (
    <Component className={className} {...props}>
      {children}
    </Component>
  );
}

export function Stack({
  direction = "column",
  spacing = 0,
  className,
  children,
  ...props
}: {
  direction?: "row" | "column" | Record<string, "row" | "column">;
  spacing?: number;
  className?: string;
  children?: ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) {
  const directionClass =
    typeof direction === "object"
      ? cn(
          direction.xs === "row" ? "flex-row" : "flex-col",
          direction.sm === "row" ? "sm:flex-row" : "sm:flex-col",
        )
      : direction === "row"
        ? "flex-row"
        : "flex-col";

  return (
    <div
      className={cn(
        "flex",
        directionClass,
        stackSpacingClass(spacing),
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function Paper({
  component,
  className,
  children,
  ...props
}: {
  component?: ElementType;
  className?: string;
  children?: ReactNode;
} & Record<string, unknown>) {
  const Component = component ?? "div";
  return (
    <Component
      className={cn(
        "rounded-md border border-border bg-white shadow-sm",
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

export function AppBar({
  children,
  className,
}: {
  position?: "sticky" | "static";
  color?: string;
  elevation?: number;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b border-border bg-white",
        className,
      )}
    >
      {children}
    </header>
  );
}

export function Toolbar({ children }: { children?: ReactNode }) {
  return (
    <div className="flex min-h-16 items-center gap-3 px-4">{children}</div>
  );
}

export function Chip({ label }: { label?: ReactNode; size?: "small" }) {
  return (
    <span className="inline-flex min-h-7 items-center rounded-full border border-border bg-muted px-2.5 text-xs font-medium">
      {label}
    </span>
  );
}

export function Button({
  variant = "text",
  color,
  size,
  startIcon,
  className,
  children,
  component,
  fullWidth,
  ...props
}: {
  variant?: "contained" | "outlined" | "text";
  color?: "error" | "primary";
  size?: "small" | "medium";
  startIcon?: ReactNode;
  component?: ElementType;
  fullWidth?: boolean;
  children?: ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement> &
  React.LabelHTMLAttributes<HTMLLabelElement> &
  Record<string, unknown>) {
  const Component = component ?? "button";
  const componentProps =
    Component === "button" ? { type: "button", ...props } : props;
  return (
    <Component
      className={cn(
        "inline-flex min-h-9 items-center justify-center gap-2 rounded-md px-3 py-1.5 text-sm font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50",
        variant === "contained" &&
          (color === "error"
            ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
            : "bg-primary text-primary-foreground hover:bg-primary/90"),
        variant === "outlined" &&
          "border border-border bg-white text-foreground hover:bg-muted",
        variant === "text" && "text-primary hover:bg-muted",
        size === "small" && "min-h-8 px-2 py-1 text-xs",
        fullWidth && "w-full",
        className,
      )}
      {...componentProps}
    >
      {startIcon}
      {children}
    </Component>
  );
}

export function IconButton({
  color,
  size,
  className,
  children,
  ...props
}: {
  color?: "error" | "primary" | "default";
  size?: "small" | "medium";
  edge?: "end" | "start";
  children?: ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement> &
  Record<string, unknown>) {
  return (
    <button
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-md text-foreground hover:bg-muted disabled:pointer-events-none disabled:opacity-50",
        size === "small" && "size-8",
        color === "error" && "text-destructive",
        className,
      )}
      type="button"
      {...props}
    >
      {children}
    </button>
  );
}

export function TextField({
  label,
  value,
  onChange,
  required,
  disabled,
  type = "text",
  error,
  helperText,
  fullWidth,
  className,
  slotProps,
  inputProps,
  InputProps,
  ...props
}: {
  label?: string;
  value?: unknown;
  required?: boolean;
  disabled?: boolean;
  error?: boolean;
  helperText?: ReactNode;
  fullWidth?: boolean;
  slotProps?: {
    htmlInput?: React.InputHTMLAttributes<HTMLInputElement>;
    input?: { endAdornment?: ReactNode };
  };
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
  InputProps?: { endAdornment?: ReactNode };
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value">) {
  const id = useId();
  const endAdornment =
    slotProps?.input?.endAdornment ?? InputProps?.endAdornment;
  const htmlInput = { ...inputProps, ...slotProps?.htmlInput };

  return (
    <label
      className={cn("grid gap-1.5", fullWidth !== false && "w-full", className)}
    >
      {label && (
        <span className="text-sm font-medium text-foreground">
          {label}
          {required ? " *" : ""}
        </span>
      )}
      <span className="relative block">
        <input
          id={id}
          className={cn(
            "h-9 w-full rounded-md border border-border bg-white px-3 py-1 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:bg-muted",
            endAdornment && "pr-11",
            error &&
              "border-destructive focus:border-destructive focus:ring-destructive/15",
          )}
          value={String(value ?? "")}
          type={type}
          aria-required={required || undefined}
          disabled={disabled}
          onChange={onChange}
          {...htmlInput}
          {...props}
        />
        {endAdornment && (
          <span className="absolute inset-y-0 right-2 flex w-7 items-center justify-center">
            {endAdornment}
          </span>
        )}
      </span>
      {helperText && (
        <span
          className={cn(
            "text-xs",
            error ? "text-destructive" : "text-muted-foreground",
          )}
        >
          {helperText}
        </span>
      )}
    </label>
  );
}

export function FormControl({
  fullWidth,
  className,
  children,
}: {
  fullWidth?: boolean;
  size?: "small";
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn("grid gap-1.5", fullWidth && "w-full", className)}
    >
      {children}
    </div>
  );
}

export function InputLabel({ children }: { children?: ReactNode }) {
  return <span className="text-sm font-medium">{children}</span>;
}

export function FormHelperText({
  error,
  children,
}: {
  error?: boolean;
  children?: ReactNode;
}) {
  if (!children) return null;
  return (
    <span className={cn("text-xs", error ? "text-destructive" : "text-muted-foreground")}>
      {children}
    </span>
  );
}

export function MenuItem({
  value,
  children,
  disabled,
}: {
  value?: string;
  children?: ReactNode;
  disabled?: boolean;
}) {
  return (
    <option value={value} disabled={disabled}>
      {textFromNode(children)}
    </option>
  );
}

export function ListItemText({ primary }: { primary: ReactNode }) {
  return <span>{primary}</span>;
}

export function Checkbox({ checked }: { checked?: boolean }) {
  return <input type="checkbox" checked={checked} readOnly className="mr-2" />;
}

export function Select({
  label,
  value,
  onChange,
  multiple,
  children,
  className,
  disabled,
}: {
  label?: string;
  value?: string | string[];
  onChange?: (event: { target: { value: string | string[] } }) => void;
  multiple?: boolean;
  children?: ReactNode;
  className?: string;
  disabled?: boolean;
  renderValue?: (value: unknown) => ReactNode;
}) {
  const selected = Array.isArray(value) ? value : String(value ?? "");

  return (
    <label className={cn("grid gap-1.5", className)}>
      {label && <span className="text-sm font-medium">{label}</span>}
      <span className="relative block">
        <select
          className={cn(
            "min-h-9 w-full appearance-none rounded-md border border-border bg-white px-3 py-1 pr-11 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:bg-muted",
            multiple && "min-h-28 pr-3",
          )}
          value={selected}
          multiple={multiple}
          disabled={disabled}
          onChange={(event) => {
            const nextValue = multiple
              ? Array.from(event.currentTarget.selectedOptions).map(
                  (option) => option.value,
                )
              : event.currentTarget.value;
            onChange?.({ target: { value: nextValue } });
          }}
        >
          {children}
        </select>
        {!multiple && (
          <span className="pointer-events-none absolute inset-y-0 right-2 flex w-7 items-center justify-center text-muted-foreground">
            <ChevronDown size={16} />
          </span>
        )}
      </span>
    </label>
  );
}

export function Dialog({
  open,
  onClose,
  children,
}: {
  open?: boolean;
  onClose?: () => void;
  maxWidth?: "xs" | "sm" | "md";
  fullWidth?: boolean;
  children?: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 p-4">
      <div
        className="fixed inset-0"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) onClose?.();
        }}
      />
      <div className="relative z-10 max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-md border border-border bg-white shadow-xl">
        {children}
      </div>
    </div>
  );
}

export function DialogTitle({ children }: { children?: ReactNode }) {
  return (
    <div className="border-b border-border px-5 py-4 text-lg font-semibold">
      {children}
    </div>
  );
}

export function DialogContent({ children }: { children?: ReactNode }) {
  return (
    <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>
  );
}

export function DialogActions({ children }: { children?: ReactNode }) {
  return (
    <div className="flex justify-end gap-2 border-t border-border px-5 py-3">
      {children}
    </div>
  );
}

export function Divider() {
  return <hr className="border-border" />;
}

export function Skeleton({
  width,
  height,
  className,
}: {
  width?: number;
  height?: number;
  variant?: "rounded";
  className?: string;
}) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      style={{ width, height: height ?? 16 }}
    />
  );
}

export function Tooltip({
  title,
  children,
}: {
  title?: ReactNode;
  children: ReactElement;
}) {
  return cloneElement(children, { title: textFromNode(title) } as Record<
    string,
    unknown
  >);
}

export function Typography({
  variant,
  color,
  className,
  children,
}: {
  variant?: "h4" | "h5" | "h6" | "subtitle1" | "body2" | "caption";
  color?: string;
  className?: string;
  children?: ReactNode;
}) {
  const Component =
    variant === "h4" || variant === "h5" || variant === "h6" ? variant : "p";
  return (
    <Component
      className={cn(
        variant === "h4" && "text-3xl font-bold",
        variant === "h5" && "text-xl font-bold",
        variant === "h6" && "text-lg font-bold",
        variant === "subtitle1" && "font-semibold",
        variant === "body2" && "text-sm",
        variant === "caption" && "text-xs",
        color === "error" && "text-destructive",
        color === "success.main" && "text-green-700",
        color === "text.secondary" && "text-muted-foreground",
        className,
      )}
    >
      {children}
    </Component>
  );
}

export function Autocomplete<T>({
  options,
  value,
  onChange,
  onInputChange,
  getOptionLabel,
  renderInput,
  disabled,
}: {
  options: T[];
  value?: T | string | null;
  onChange?: (event: unknown, value: T | string | null) => void;
  onInputChange?: (
    event: unknown,
    value: string,
    reason: "input" | "clear",
  ) => void;
  getOptionLabel?: (option: T) => string;
  isOptionEqualToValue?: (option: T, value: T) => boolean;
  renderInput: (params: Record<string, unknown>) => ReactNode;
  freeSolo?: boolean;
  fullWidth?: boolean;
  disabled?: boolean;
}) {
  const id = useId();
  const labels = useMemo(
    () =>
      options.map((option) => ({
        option,
        label:
          typeof option === "string"
            ? option
            : getOptionLabel
              ? getOptionLabel(option)
              : String(option),
      })),
    [options, getOptionLabel],
  );
  const text =
    value === null || value === undefined
      ? ""
      : typeof value === "string"
        ? value
        : getOptionLabel
          ? getOptionLabel(value as T)
          : String(value);

  const input = renderInput({
    value: text,
    disabled,
    inputProps: { list: id },
    InputProps:
      text && !disabled
        ? {
            endAdornment: (
              <button
                type="button"
                aria-label="Clear"
                className="inline-flex size-7 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
                onMouseDown={(event) => event.preventDefault()}
                onClick={(event) => {
                  onInputChange?.(event, "", "clear");
                  onChange?.(event, null);
                }}
              >
                <X size={14} />
              </button>
            ),
          }
        : undefined,
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
      const nextValue = event.target.value;
      onInputChange?.(event, nextValue, nextValue ? "input" : "clear");
      const match = labels.find((item) => item.label === nextValue);
      onChange?.(event, match ? match.option : nextValue);
    },
  });

  return (
    <div>
      {input}
      <datalist id={id}>
        {labels.map((item) => (
          <option key={item.label} value={item.label} />
        ))}
      </datalist>
    </div>
  );
}

export function TableSortLabel({
  active,
  direction,
  onClick,
  children,
}: {
  active?: boolean;
  direction?: "asc" | "desc";
  onClick?: () => void;
  children?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 font-semibold"
    >
      {children}
      {active &&
        (direction === "desc" ? (
          <ChevronDown size={14} />
        ) : (
          <ChevronUp size={14} />
        ))}
    </button>
  );
}

export function InputAdornment({
  children,
}: {
  position?: "end";
  children?: ReactNode;
}) {
  return <>{children}</>;
}

export function CssBaseline() {
  return null;
}

export function ThemeProvider({
  children,
}: {
  theme?: unknown;
  children?: ReactNode;
}) {
  return <>{children}</>;
}

export function createTheme<T>(theme: T) {
  return theme;
}
