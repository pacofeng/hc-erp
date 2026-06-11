export type AnyRow = Record<string, unknown> & { id?: string };

export type Language = "en" | "zh-CN";

export type Session = {
  token: string;
  username: string;
  authorities: string[];
  language?: Language;
};

export type ReferenceData = {
  departments: AnyRow[];
  employees: AnyRow[];
  accounts: AnyRow[];
};

export type SortState = { column: string; direction: "asc" | "desc" } | null;

export type AssignmentType = "account" | "role";

export type AssignmentState = {
  type: AssignmentType;
  originalIds: string[];
  selectedIds: string[];
};

export type Field = {
  name: string;
  required?: boolean;
  readOnly?: boolean;
  type?: "text" | "date" | "password";
  options?: string[];
};
