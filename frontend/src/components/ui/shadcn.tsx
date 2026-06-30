"use client";

import React, {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type ReactElement,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
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

function useDropdownPosition(
  open: boolean,
  triggerRef: React.RefObject<HTMLElement | null>,
) {
  const [style, setStyle] = useState<CSSProperties>({});

  useEffect(() => {
    if (!open) return;

    function updatePosition() {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom - 8;
      const spaceAbove = rect.top - 8;
      const openAbove = spaceBelow < 200 && spaceAbove > spaceBelow;
      const availableHeight = Math.max(
        120,
        Math.min(500, openAbove ? spaceAbove : spaceBelow),
      );

      setStyle({
        position: "fixed",
        left: rect.left,
        width: rect.width,
        maxHeight: availableHeight,
        ...(openAbove
          ? { bottom: window.innerHeight - rect.top + 4 }
          : { top: rect.bottom + 4 }),
      });
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, triggerRef]);

  return style;
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
      <span className="relative block">
        <input
          id={id}
          className={cn(
            "peer h-10 w-full rounded-md border border-border bg-white px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:text-muted-foreground",
            endAdornment && "pr-11",
            error &&
              "border-destructive focus:border-destructive focus:ring-destructive",
          )}
          value={String(value ?? "")}
          type={type}
          aria-required={required || undefined}
          disabled={disabled}
          onChange={onChange}
          {...htmlInput}
          {...props}
        />
        {label && (
          <span
            className={cn(
              "pointer-events-none absolute -top-2 left-2 z-10 bg-white px-1 text-xs leading-4 text-muted-foreground transition-colors peer-focus:text-primary",
              error && "text-destructive peer-focus:text-destructive",
            )}
          >
            {label}
            {required ? " *" : ""}
          </span>
        )}
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

export type ComboboxChipOption = {
  value: string;
  label: string;
};

export function ComboboxChips({
  label,
  value,
  options,
  onChange,
  required,
  disabled,
  error,
  helperText,
  placeholder = "",
}: {
  label?: string;
  value: string[];
  options: ComboboxChipOption[];
  onChange?: (value: string[]) => void;
  required?: boolean;
  disabled?: boolean;
  error?: boolean;
  helperText?: ReactNode;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuStyle = useDropdownPosition(open, rootRef);
  const selectedOptions = options.filter((option) =>
    value.includes(option.value),
  );
  const filteredOptions = options.filter((option) =>
    option.label.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()),
  );

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      const target = event.target as Node;
      if (
        !rootRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  function toggleOption(optionValue: string) {
    const nextValue = value.includes(optionValue)
      ? value.filter((item) => item !== optionValue)
      : [...value, optionValue];
    onChange?.(nextValue);
    setQuery("");
    inputRef.current?.focus();
  }

  function removeOption(optionValue: string) {
    onChange?.(value.filter((item) => item !== optionValue));
  }

  return (
    <div className="grid gap-1.5">
      <span ref={rootRef} className="relative block">
        <div
          className={cn(
            "flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-md border border-border bg-white px-2 py-1.5 text-sm outline-none transition-colors focus-within:border-primary focus-within:ring-1 focus-within:ring-primary",
            disabled && "cursor-not-allowed text-muted-foreground",
            error &&
              "border-destructive focus-within:border-destructive focus-within:ring-destructive",
          )}
          onClick={() => {
            if (disabled) return;
            setOpen(true);
            inputRef.current?.focus();
          }}
        >
          {selectedOptions.map((option) => (
            <span
              key={option.value}
              className="inline-flex min-h-6 items-center gap-1 rounded-full border border-border bg-muted px-2 text-xs font-medium"
            >
              {option.label}
              {!disabled && (
                <button
                  type="button"
                  className="rounded-full text-muted-foreground hover:text-foreground"
                  aria-label={`Remove ${option.label}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    removeOption(option.value);
                  }}
                >
                  <X size={12} />
                </button>
              )}
            </span>
          ))}
          <input
            ref={inputRef}
            value={query}
            disabled={disabled}
            placeholder={selectedOptions.length ? "" : placeholder}
            className="h-6 min-w-28 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
          />
        </div>
        {label && (
          <span
            className={cn(
              "pointer-events-none absolute -top-2 left-2 z-10 bg-white px-1 text-xs leading-4 text-muted-foreground transition-colors",
              error && "text-destructive",
            )}
          >
            {label}
            {required ? " *" : ""}
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
      {open && !disabled && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={menuRef}
              style={menuStyle}
              className="z-[100] overflow-y-auto rounded-md border border-border bg-white p-1 shadow-lg"
              role="listbox"
              aria-multiselectable
            >
              {filteredOptions.map((option) => {
                const isSelected = value.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    className={cn(
                      "flex w-full items-center rounded px-2 py-2 text-left text-sm hover:bg-muted",
                      isSelected && "bg-muted font-medium",
                    )}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => toggleOption(option.value)}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <span
                      className={cn(
                        "mr-2 grid size-4 place-items-center rounded border border-border text-[10px]",
                        isSelected && "border-primary bg-primary text-white",
                      )}
                    >
                      {isSelected ? "✓" : ""}
                    </span>
                    {option.label || "\u00a0"}
                  </button>
                );
              })}
              {!filteredOptions.length && (
                <div className="px-2 py-2 text-sm text-muted-foreground">
                  No options
                </div>
              )}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

export function Select({
  label,
  value,
  onChange,
  multiple,
  children,
  className,
  disabled,
  renderValue,
  required,
}: {
  label?: string;
  value?: string | string[];
  onChange?: (event: { target: { value: string | string[] } }) => void;
  multiple?: boolean;
  children?: ReactNode;
  className?: string;
  disabled?: boolean;
  renderValue?: (value: unknown) => ReactNode;
  required?: boolean;
}) {
  const selected = Array.isArray(value) ? value : String(value ?? "");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuStyle = useDropdownPosition(open, triggerRef);
  const options = Children.toArray(children)
    .filter(
      (
        child,
      ): child is ReactElement<{
        value?: string;
        disabled?: boolean;
        children?: ReactNode;
      }> => isValidElement(child),
    )
    .map((child) => ({
      value: String(child.props.value ?? ""),
      disabled: Boolean(child.props.disabled),
      label: textFromNode(child.props.children),
    }));
  const selectedValues = Array.isArray(selected) ? selected : [selected];
  const selectedLabels = options
    .filter((option) => selectedValues.includes(option.value))
    .map((option) => option.label);
  const displayValue = renderValue
    ? renderValue(selected)
    : selectedLabels.join(", ");

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      const target = event.target as Node;
      if (
        !rootRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  function selectOption(optionValue: string) {
    if (multiple) {
      const current = Array.isArray(selected) ? selected : [];
      const nextValue = current.includes(optionValue)
        ? current.filter((item) => item !== optionValue)
        : [...current, optionValue];
      onChange?.({ target: { value: nextValue } });
      return;
    }
    onChange?.({ target: { value: optionValue } });
    setOpen(false);
  }

  return (
    <div ref={rootRef} className={cn("relative grid gap-1.5", className)}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        className="flex h-10 w-full items-center justify-between gap-2 rounded-md border border-border bg-white px-3 py-2 text-left text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:text-muted-foreground"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
      >
        <span className="min-w-0 flex-1 truncate">
          {displayValue || "\u00a0"}
        </span>
        <ChevronDown
          size={16}
          className={cn(
            "shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {label && (
        <span
          className="pointer-events-none absolute -top-2 left-2 z-10 bg-white px-1 text-xs leading-4 text-muted-foreground"
        >
          {label}
          {required ? " *" : ""}
        </span>
      )}
      {open && !disabled && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={menuRef}
              style={menuStyle}
              className="z-[100] overflow-y-auto rounded-md border border-border bg-white p-1 shadow-lg"
              role="listbox"
              aria-multiselectable={multiple || undefined}
            >
              {options.map((option) => {
                const isSelected = selectedValues.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    disabled={option.disabled}
                    className={cn(
                      "flex w-full items-center rounded px-2 py-2 text-left text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50",
                      isSelected && "bg-muted font-medium",
                    )}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => selectOption(option.value)}
                  >
                    {multiple && (
                      <span
                        className={cn(
                          "mr-2 grid size-4 place-items-center rounded border border-border text-[10px]",
                          isSelected && "border-primary bg-primary text-white",
                        )}
                      >
                        {isSelected ? "✓" : ""}
                      </span>
                    )}
                    {option.label || "\u00a0"}
                  </button>
                );
              })}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

export function Dialog({
  open,
  onClose,
  children,
  maxWidth = "sm",
}: {
  open?: boolean;
  onClose?: () => void;
  maxWidth?: "xs" | "sm" | "md" | "lg";
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
      <div
        className={cn(
          "relative z-10 max-h-[90vh] w-full overflow-hidden rounded-md border border-border bg-white shadow-xl",
          maxWidth === "xs" && "max-w-sm",
          maxWidth === "sm" && "max-w-xl",
          maxWidth === "md" && "max-w-3xl",
          maxWidth === "lg" && "max-w-6xl",
        )}
      >
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
  const valueText =
    value === null || value === undefined
      ? ""
      : typeof value === "string"
        ? value
        : getOptionLabel
          ? getOptionLabel(value as T)
          : String(value);
  const [text, setText] = useState(valueText);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuStyle = useDropdownPosition(open, rootRef);
  const filteredLabels = useMemo(() => {
    const query = text.trim().toLocaleLowerCase();
    if (!query) return labels;
    return labels.filter((item) =>
      item.label.toLocaleLowerCase().includes(query),
    );
  }, [labels, text]);

  useEffect(() => {
    setText(valueText);
  }, [valueText]);

  const input = renderInput({
    value: text,
    disabled,
    inputProps: {},
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
                  setText("");
                  setOpen(true);
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
      setText(nextValue);
      setOpen(true);
      onInputChange?.(event, nextValue, nextValue ? "input" : "clear");
      const match = labels.find((item) => item.label === nextValue);
      if (match) {
        onChange?.(event, match.option);
      } else if (!nextValue) {
        onChange?.(event, null);
      }
    },
    onFocus: () => setOpen(true),
    onBlur: () => window.setTimeout(() => setOpen(false), 100),
  });

  return (
    <div ref={rootRef} className="relative">
      {input}
      {open &&
        !disabled &&
        filteredLabels.length > 0 &&
        typeof document !== "undefined"
        ? createPortal(
            <div
              id={id}
              style={menuStyle}
              className="z-[100] overflow-y-auto rounded-md border border-border bg-white p-1 shadow-lg"
              role="listbox"
            >
              {filteredLabels.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  className="block w-full rounded px-2 py-2 text-left text-sm hover:bg-muted"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={(event) => {
                    setText(item.label);
                    setOpen(false);
                    onInputChange?.(event, item.label, "input");
                    onChange?.(event, item.option);
                  }}
                  role="option"
                >
                  {item.label}
                </button>
              ))}
            </div>,
            document.body,
          )
        : null}
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
