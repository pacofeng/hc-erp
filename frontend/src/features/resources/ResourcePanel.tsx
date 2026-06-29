import React, { useEffect, useMemo, useState } from "react";
import { Autocomplete } from "@/components/ui/autocomplete";
import { Button, IconButton } from "@/components/ui/button";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormControl, FormHelperText } from "@/components/ui/form";
import { TextField } from "@/components/ui/input";
import { Box, Divider, Paper, Stack } from "@/components/ui/layout";
import { MenuItem, Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { TableSortLabel } from "@/components/ui/table-sort-label";
import { Tooltip } from "@/components/ui/tooltip";
import { Typography } from "@/components/ui/typography";
import {
  DataGrid,
  type GridColDef,
  type GridPaginationModel,
} from "@/components/ui/data-grid";
import { Camera, KeyRound, Pencil, Plus, RefreshCw, Save, Trash2 } from "lucide-react";
import {
  IMAGE_UPLOAD_ACCEPT,
  IMAGE_UPLOAD_TYPES,
  MAX_IMAGE_UPLOAD_BYTES,
  dateOnlyColumns,
  pageSizeOptions,
} from "../../app/constants";
import { api } from "../../app/apiClient";
import { useToast } from "../../app/toast";
import { canUseResourceAction } from "../../app/resources";
import {
  accountTableColumns,
  departmentTableColumns,
  employeeFormSections,
  employeeTableColumns,
  newEmployeeFormSections,
  schemas,
  settingsFields,
} from "../../app/schemaConfig";
import {
  apiError,
  renderLocalizedError,
  type LocalizedErrorState,
  type MessageKey,
  type Translation,
} from "../../app/i18n";
import type {
  AnyRow,
  AssignmentState,
  AssignmentType,
  Field,
  Language,
  ReferenceData,
  Session,
  SortState,
} from "../../app/types";
import { PasswordTextField } from "../../components/AppChrome";
import { chinaAddressDivisions } from "../../chinaAddressData";
import { cn } from "../../lib/utils";

export type FieldErrorState = {
  kind: "field";
  fieldName: string;
  messageKey: "phoneInvalid" | "imageInvalid";
  resource: string;
};

export type PanelErrorState = LocalizedErrorState | FieldErrorState;
export type FieldErrorMap = Partial<Record<string, MessageKey>>;

function fieldError(
  fieldName: string,
  messageKey: FieldErrorState["messageKey"],
  resource: string,
): FieldErrorState {
  return { kind: "field", fieldName, messageKey, resource };
}

export function renderPanelError(
  error: PanelErrorState,
  t: Translation,
  language: Language,
) {
  if (error.kind === "field") {
    return `${formFieldLabel(error.resource, t, error.fieldName)}: ${
      t[error.messageKey]
    }`;
  }
  return renderLocalizedError(error, t, language);
}

function fieldErrorText(
  fieldErrors: FieldErrorMap,
  fieldName: string,
  t: Translation,
) {
  const messageKey = fieldErrors[fieldName];
  return messageKey ? String(t[messageKey]) : undefined;
}

function clearFieldError(fieldErrors: FieldErrorMap, fieldName: string) {
  const nextFieldErrors = { ...fieldErrors };
  delete nextFieldErrors[fieldName];
  return nextFieldErrors;
}

export function validateFormFields(
  fields: Field[],
  form: AnyRow,
  resource: string,
  currentRowId?: string,
) {
  const errors: FieldErrorMap = {};
  fields.forEach((field) => {
    const value = getFieldValue(form, field.name);
    const isBlank =
      value === null || value === undefined || String(value).trim() === "";
    const isPasswordOptionalOnUpdate =
      resource === "accounts" &&
      (field.name === "password" || field.name === "confirmPassword") &&
      currentRowId;
    if (field.required && !isPasswordOptionalOnUpdate && isBlank) {
      errors[field.name] = "fieldRequired";
      return;
    }
    if (isPhoneField(field.name) && !isBlank && !isValidPhoneValue(value)) {
      errors[field.name] = "phoneInvalid";
    }
    if (field.name === "idCardNumber" && !isBlank && !isValidIdCardNumber(value)) {
      errors[field.name] = "idCardInvalid";
    }
    if (field.name === "dateOfBirth" && !isBlank && isFutureDateValue(value)) {
      errors[field.name] = "dateOfBirthFuture";
    }
    if (
      isImageUploadField(field.name) &&
      !isBlank &&
      !isValidImageDataUrl(value)
    ) {
      errors[field.name] = "imageInvalid";
    }
  });
  return errors;
}

export function ResourcePanel({
  resource,
  session,
  language,
  t,
}: {
  resource: string;
  session: Session;
  language: Language;
  t: Translation;
}) {
  const schema = schemas[resource];
  const [rows, setRows] = useState<AnyRow[]>([]);
  const [references, setReferences] = useState<ReferenceData>({
    departments: [],
    employees: [],
    accounts: [],
  });
  const [editing, setEditing] = useState<AnyRow | null>(null);
  const [passwordEditing, setPasswordEditing] = useState<AnyRow | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AnyRow | null>(null);
  const [sort, setSort] = useState<SortState>(null);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 20,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PanelErrorState | null>(null);
  const { showToast } = useToast();
  const actions = useMemo(
    () => ({
      create: canUseResourceAction(resource, "create", session),
      edit: canUseResourceAction(resource, "edit", session),
      delete: canUseResourceAction(resource, "delete", session),
    }),
    [resource, session],
  );

  async function load() {
    setError(null);
    setLoading(true);
    try {
      const nextRows = await api<AnyRow[]>(`/${resource}`, session);
      setRows(nextRows);
      if (resource === "employees") {
        const [departments, employees, accounts] = await Promise.all([
          api<AnyRow[]>("/departments", session),
          api<AnyRow[]>("/employees", session),
          api<AnyRow[]>("/accounts", session).catch(() => [] as AnyRow[]),
        ]);
        setReferences({ departments, employees, accounts });
      }
      if (resource === "accounts") {
        const employees = await api<AnyRow[]>("/employees", session);
        setReferences({ departments: [], employees, accounts: nextRows });
      }
      if (resource === "departments") {
        const employees = await api<AnyRow[]>("/employees", session);
        setReferences({ departments: nextRows, employees, accounts: [] });
      }
    } catch (err) {
      const nextError = apiError(err, "loadFailed");
      setError(nextError);
      showToast({
        message: renderPanelError(nextError, t, language),
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [resource]);

  async function remove(row: AnyRow) {
    if (!row.id) return;
    setError(null);
    try {
      await api<void>(`/${resource}/${row.id}`, session, { method: "DELETE" });
      setPendingDelete(null);
      showToast({ message: t.deleted, variant: "success" });
      await load();
    } catch (err) {
      const nextError = apiError(err, "deleteFailed");
      setError(nextError);
      showToast({
        message: renderPanelError(nextError, t, language),
        variant: "error",
      });
    }
  }

  const columns =
    resource === "employees"
      ? employeeTableColumns
      : resource === "departments"
        ? departmentTableColumns
        : resource === "accounts"
          ? accountTableColumns
      : [
          ...Array.from(new Set(rows.flatMap((row) => Object.keys(row))))
            .filter(
              (column) =>
                column !== "id" &&
                column !== "passwordHash" &&
                !(
                  resource === "accounts" &&
                  (column === "accountType" || column === "mustChangePassword")
                ),
            )
            .slice(0, 9),
        ];
  const sortedRows = useMemo(
    () => sortRows(rows, sort, resource, references, language, t),
    [rows, sort, resource, references, language, t],
  );
  const dataGridColumns = useMemo(
    () =>
      buildGridColumns(
        columns,
        sort,
        setSortAndResetPage,
        resource,
        references,
        language,
        t,
        actions,
        setEditing,
        setPasswordEditing,
        setPendingDelete,
      ),
    [columns, sort, resource, references, language, t, actions],
  );
  const pendingDeleteDepartmentEmployees = pendingDelete
    ? departmentEmployeesForDelete(resource, pendingDelete, references)
    : [];
  const departmentDeleteBlocked =
    resource === "departments" && pendingDeleteDepartmentEmployees.length > 0;

  useEffect(() => {
    setSort(null);
    setPaginationModel((current: GridPaginationModel) => ({
      ...current,
      page: 0,
    }));
  }, [resource]);

  function setSortAndResetPage(nextSort: SortState) {
    setSort(nextSort);
    setPaginationModel((current: GridPaginationModel) => ({
      ...current,
      page: 0,
    }));
  }

  function updatePaginationModel(nextModel: GridPaginationModel) {
    setPaginationModel(nextModel);
  }

  return (
    <Paper className="overflow-hidden">
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
        className="p-4 sm:items-center"
      >
        <Box className="flex-1">
          <Typography variant="h6">
            {t.resources[resource as keyof typeof t.resources]}
          </Typography>
          {loading ? (
            <Skeleton width={90} />
          ) : (
            <Typography variant="body2" color="text.secondary">
              {rows.length} {t.records}
            </Typography>
          )}
        </Box>
        <Tooltip title={t.refresh}>
          <span>
            <IconButton onClick={load} disabled={loading}>
              <RefreshCw size={16} />
            </IconButton>
          </span>
        </Tooltip>
        {actions.create && (
          <Button
            variant="contained"
            startIcon={<Plus size={16} />}
            onClick={() => setEditing(defaultRow(schema.fields, resource))}
          >
            {t.new}
          </Button>
        )}
      </Stack>
      <Divider />
      {error && (
        <Typography color="error" className="px-4 py-2">
          {renderPanelError(error, t, language)}
        </Typography>
      )}
      <Box className="h-[calc(100vh-238px)] min-h-[420px]">
        <DataGrid
          rows={sortedRows}
          columns={dataGridColumns}
          loading={loading}
          disableRowSelectionOnClick
          paginationModel={paginationModel}
          onPaginationModelChange={updatePaginationModel}
          pageSizeOptions={pageSizeOptions}
          getRowId={(row: AnyRow) => String(row.id)}
        />
      </Box>
      {editing && (
        <EditDialog
          resource={resource}
          schema={schema}
          row={editing}
          session={session}
          language={language}
          t={t}
          references={references}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            void load();
          }}
        />
      )}
      {passwordEditing && (
        <UpdateAccountPasswordDialog
          row={passwordEditing}
          session={session}
          language={language}
          t={t}
          onClose={() => setPasswordEditing(null)}
          onSaved={() => {
            setPasswordEditing(null);
            void load();
          }}
        />
      )}
      {pendingDelete && (
        <Dialog
          open
          onClose={() => setPendingDelete(null)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>{t.confirmDeleteTitle}</DialogTitle>
          <DialogContent>
            <Typography variant="body2">{t.confirmDeleteMessage}</Typography>
            {employeeAccountForAction(resource, pendingDelete, references) && (
              <Box className="mt-4 rounded-md bg-[#fdecee] p-3">
                <Typography variant="body2" className="font-bold">
                  {t.employeeAccountDeleteWarning}
                </Typography>
                <Typography variant="body2">
                  {t.associatedAccount}:{" "}
                  {accountSummary(
                    employeeAccountForAction(
                      resource,
                      pendingDelete,
                      references,
                    ),
                  )}
                </Typography>
              </Box>
            )}
            {departmentDeleteBlocked && (
              <Box className="mt-4 rounded-md bg-[#fdecee] p-3">
                <Typography variant="body2" className="font-bold">
                  {t.departmentDeleteBlocked}
                </Typography>
                <Typography variant="body2" className="mt-1">
                  {t.assignedEmployees}:{" "}
                  {pendingDeleteDepartmentEmployees
                    .slice(0, 5)
                    .map(employeeName)
                    .join(", ")}
                  {pendingDeleteDepartmentEmployees.length > 5
                    ? ` +${pendingDeleteDepartmentEmployees.length - 5}`
                    : ""}
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPendingDelete(null)}>{t.cancel}</Button>
            <Button
              color="error"
              variant="contained"
              startIcon={<Trash2 size={16} />}
              disabled={departmentDeleteBlocked}
              onClick={() => remove(pendingDelete)}
            >
              {t.delete}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Paper>
  );
}

function EditDialog({
  resource,
  schema,
  row,
  session,
  language,
  t,
  references,
  onClose,
  onSaved,
}: {
  resource: string;
  schema: { label: string; fields: Field[] };
  row: AnyRow;
  session: Session;
  language: Language;
  t: Translation;
  references: ReferenceData;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<AnyRow>(row);
  const [error, setError] = useState<PanelErrorState | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrorMap>({});
  const [assignmentState, setAssignmentState] =
    useState<AssignmentState | null>(null);
  const [pendingTerminateSave, setPendingTerminateSave] = useState(false);
  const { showToast } = useToast();
  const assignmentType =
    resource === "accounts"
      ? "account"
      : row.id && resource === "roles"
        ? "role"
        : undefined;
  const photoField = schema.fields.find((field) => field.name === "photo");
  const avatarField = schema.fields.find((field) => field.name === "avatar");
  const accountFields = schema.fields.filter(
    (field) =>
      field.name !== "avatar" &&
      !(row.id && field.name === "password") &&
      !(row.id && field.name === "confirmPassword"),
  );

  function handleFieldChange(fieldName: string) {
    setFieldErrors((current) => clearFieldError(current, fieldName));
  }

  const associatedAccount =
    resource === "employees" && row.id
      ? employeeAccountForAction(resource, row, references)
      : undefined;
  const isTerminatingEmployee =
    resource === "employees" &&
    row.id &&
    row.status !== "TERMINATED" &&
    form.status === "TERMINATED" &&
    associatedAccount;

  function save() {
    if (isTerminatingEmployee) {
      setPendingTerminateSave(true);
      return;
    }
    void executeSave();
  }

  async function executeSave() {
    setError(null);
    setPendingTerminateSave(false);
    const nextFieldErrors = validateFormFields(
      schema.fields,
      form,
      resource,
      row.id,
    );
    const body = requestBodyFromFields(schema.fields, form);
    if (
      resource === "accounts" &&
      !row.id &&
      !String(body.password ?? "").trim()
    ) {
      nextFieldErrors.password = "passwordRequired";
    }
    if (
      resource === "accounts" &&
      String(body.password ?? "").trim() &&
      !isStrongPassword(String(body.password))
    ) {
      nextFieldErrors.password = "passwordStrengthHint";
    }
    if (
      resource === "accounts" &&
      !row.id &&
      String(body.password ?? "") !== String(form.confirmPassword ?? "")
    ) {
      nextFieldErrors.confirmPassword = "passwordsDoNotMatch";
    }
    setFieldErrors(nextFieldErrors);
    if (Object.keys(nextFieldErrors).length) return;
    try {
      const saved = await api<AnyRow>(
        `/${resource}${row.id ? `/${row.id}` : ""}`,
        session,
        {
          method: row.id ? "PUT" : "POST",
          body: JSON.stringify(body),
        },
      );
      const savedId =
        typeof row.id === "string"
          ? row.id
          : typeof saved.id === "string"
            ? saved.id
            : undefined;
      if (assignmentType && assignmentState && savedId) {
        await syncAssignments(savedId, assignmentState, session);
      }
      showToast({
        message: row.id ? t.updated : t.created,
        variant: "success",
      });
      onSaved();
    } catch (err) {
      const apiFieldErrors = fieldErrorsFromApiError(resource, err);
      if (Object.keys(apiFieldErrors).length) {
        setFieldErrors(apiFieldErrors);
        return;
      }
      const nextError = apiError(err, "saveFailed");
      setError(nextError);
      showToast({
        message: renderPanelError(nextError, t, language),
        variant: "error",
      });
    }
  }

  function fieldErrorsFromApiError(resource: string, error: unknown) {
    const message = error instanceof Error ? error.message : "";
    const errors: FieldErrorMap = {};
    if (resource === "accounts" && message === "Username already exists") {
      errors.username = "usernameAlreadyExists";
    }
    if (
      resource === "departments" &&
      message === "Department code already exists"
    ) {
      errors.code = "departmentCodeAlreadyExists";
    }
    return errors;
  }

  return (
    <Dialog
      open
      onClose={onClose}
      maxWidth={
        resource === "employees" ? "lg" : resource === "accounts" ? "md" : "sm"
      }
      fullWidth
    >
      <DialogTitle>{dialogTitle(resource, row.id, t)}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} className="pt-2">
          {resource === "employees" ? (
            <>
              {associatedAccount && (
                <Box className="rounded-md bg-[#eef6ff] p-3">
                  <Typography variant="body2" className="font-bold">
                    {t.employeeAssociatedAccountNotice}
                  </Typography>
                  <Typography variant="body2">
                    {t.associatedAccount}: {accountSummary(associatedAccount)}
                  </Typography>
                </Box>
              )}
              <Box className="grid grid-cols-1 gap-6 lg:grid-cols-[180px_minmax(0,1fr)]">
                <Box className="lg:border-r lg:border-border lg:pr-6">
                  {photoField &&
                    renderImageUploadField(
                      photoField,
                      form,
                      setForm,
                      t,
                      fieldErrorText(fieldErrors, photoField.name, t),
                      handleFieldChange,
                      true,
                    )}
                </Box>
                <FormSections
                  sections={
                    row.id ? employeeFormSections : newEmployeeFormSections
                  }
                  fields={schema.fields}
                  form={form}
                  setForm={setForm}
                  t={t}
                  references={references}
                  currentRowId={row.id}
                  language={language}
                  fieldErrors={fieldErrors}
                  onFieldChange={handleFieldChange}
                  columns={3}
                />
              </Box>
            </>
          ) : resource === "accounts" ? (
            <Box className="grid grid-cols-1 gap-6 md:grid-cols-[180px_minmax(0,1fr)]">
              <Box className="md:border-r md:border-border md:pr-6">
                {avatarField &&
                  renderImageUploadField(
                    avatarField,
                    form,
                    setForm,
                    t,
                    fieldErrorText(fieldErrors, avatarField.name, t),
                    handleFieldChange,
                    true,
                  )}
              </Box>
              <Stack spacing={2}>
                {accountFields.map((field) =>
                  renderField(
                    resource,
                    field,
                    form,
                    setForm,
                    t,
                    references,
                    row.id,
                    language,
                    fieldErrors,
                    handleFieldChange,
                  ),
                )}
                <AssignmentSection
                  type="account"
                  row={row}
                  session={session}
                  language={language}
                  t={t}
                  onChange={setAssignmentState}
                  inline
                />
              </Stack>
            </Box>
          ) : (
            <>
              {resource === "departments" && !row.id && (
                <Box className="rounded-md bg-[#fff7e6] p-3">
                  <Typography variant="body2" className="font-bold">
                    {t.departmentCreateImmutableWarning}
                  </Typography>
                </Box>
              )}
              {schema.fields.map((field) =>
                renderField(
                  resource,
                  field,
                  form,
                  setForm,
                  t,
                  references,
                  row.id,
                  language,
                  fieldErrors,
                  handleFieldChange,
                ),
              )}
            </>
          )}
          {error && (
            <Typography color="error" variant="body2">
              {renderPanelError(error, t, language)}
            </Typography>
          )}
          {assignmentType && assignmentType !== "account" && (
            <AssignmentSection
              type={assignmentType}
              row={row}
              session={session}
              language={language}
              t={t}
              onChange={setAssignmentState}
            />
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t.cancel}</Button>
        <Button onClick={save} variant="contained" startIcon={<Save size={16} />}>
          {t.save}
        </Button>
      </DialogActions>
      {pendingTerminateSave && associatedAccount && (
        <Dialog
          open
          onClose={() => setPendingTerminateSave(false)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>{t.confirmTerminateTitle}</DialogTitle>
          <DialogContent>
            <Typography variant="body2">{t.confirmTerminateMessage}</Typography>
            <Box className="mt-4 rounded-md bg-[#fdecee] p-3">
              <Typography variant="body2" className="font-bold">
                {t.employeeAccountTerminateWarning}
              </Typography>
              <Typography variant="body2">
                {t.associatedAccount}: {accountSummary(associatedAccount)}
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPendingTerminateSave(false)}>
              {t.cancel}
            </Button>
            <Button
              color="error"
              variant="contained"
              onClick={() => void executeSave()}
            >
              {t.save}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Dialog>
  );
}

function UpdateAccountPasswordDialog({
  row,
  session,
  language,
  t,
  onClose,
  onSaved,
}: {
  row: AnyRow;
  session: Session;
  language: Language;
  t: Translation;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrorMap>({});
  const [error, setError] = useState<PanelErrorState | null>(null);
  const { showToast } = useToast();

  async function save() {
    setError(null);
    const nextFieldErrors: FieldErrorMap = {};
    if (!password.trim()) {
      nextFieldErrors.password = "fieldRequired";
    } else if (!isStrongPassword(password)) {
      nextFieldErrors.password = "passwordStrengthHint";
    }
    if (!confirmPassword.trim()) {
      nextFieldErrors.confirmPassword = "fieldRequired";
    } else if (password !== confirmPassword) {
      nextFieldErrors.confirmPassword = "passwordsDoNotMatch";
    }
    setFieldErrors(nextFieldErrors);
    if (Object.keys(nextFieldErrors).length) return;

    try {
      await api(`/accounts/${row.id}`, session, {
        method: "PUT",
        body: JSON.stringify({
          employeeId: row.employeeId,
          username: row.username,
          password,
          status: row.status,
          avatar: row.avatar ?? null,
          preferredLanguage: row.preferredLanguage,
        }),
      });
      showToast({ message: t.updated, variant: "success" });
      onSaved();
    } catch (err) {
      const nextError = apiError(err, "saveFailed");
      setError(nextError);
      showToast({
        message: renderPanelError(nextError, t, language),
        variant: "error",
      });
    }
  }

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{t.updatePassword}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} className="pt-2">
          <PasswordTextField
            label={formFieldLabel("accounts", t, "password")}
            value={password}
            required
            autoComplete="new-password"
            onChange={(value) => {
              setPassword(value);
              setFieldErrors((current) => clearFieldError(current, "password"));
            }}
            error={Boolean(fieldErrors.password)}
            helperText={fieldErrorText(fieldErrors, "password", t)}
          />
          <PasswordTextField
            label={formFieldLabel("accounts", t, "confirmPassword")}
            value={confirmPassword}
            required
            autoComplete="new-password"
            onChange={(value) => {
              setConfirmPassword(value);
              setFieldErrors((current) =>
                clearFieldError(current, "confirmPassword"),
              );
            }}
            error={Boolean(fieldErrors.confirmPassword)}
            helperText={fieldErrorText(fieldErrors, "confirmPassword", t)}
          />
          <Typography variant="caption" color="text.secondary">
            {t.passwordStrengthHint}
          </Typography>
          {error && (
            <Typography color="error" variant="body2">
              {renderPanelError(error, t, language)}
            </Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t.cancel}</Button>
        <Button onClick={save} variant="contained" startIcon={<Save size={16} />}>
          {t.save}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

type FormSection = {
  titleKey:
    | "accountInfo"
    | "personalInfo"
    | "addressInfo"
    | "emergencyContact"
    | "employmentInfo";
  fields: readonly string[];
};

export function FormSections({
  sections,
  fields,
  form,
  setForm,
  t,
  references = { departments: [], employees: [], accounts: [] },
  currentRowId,
  language = "en",
  fieldErrors = {},
  onFieldChange,
  columns = 2,
}: {
  sections: readonly FormSection[];
  fields: Field[];
  form: AnyRow;
  setForm: React.Dispatch<React.SetStateAction<AnyRow>>;
  t: Translation;
  references?: ReferenceData;
  currentRowId?: string;
  language?: Language;
  fieldErrors?: FieldErrorMap;
  onFieldChange?: (fieldName: string) => void;
  columns?: 2 | 3;
}) {
  const fieldByName = new Map(fields.map((field) => [field.name, field]));

  return (
    <Stack spacing={2.5}>
      {sections.map((section) => (
        <Box key={section.titleKey}>
          <Typography variant="subtitle1">
            {t[section.titleKey]}
          </Typography>
          <Box
            className={
              columns === 3
                ? "mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
                : "mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2"
            }
          >
            {section.fields.map((fieldName) => {
              const field = fieldByName.get(fieldName);
              if (!field) return null;
              const shouldSpan =
                isImageUploadField(fieldName) || fieldName === "address";

              return (
                <Box
                  key={fieldName}
                  className={shouldSpan ? "w-full sm:col-span-full" : "w-full"}
                >
                  {renderField(
                    "employees",
                    field,
                    form,
                    setForm,
                    t,
                    references,
                    currentRowId,
                    language,
                    fieldErrors,
                    onFieldChange,
                  )}
                </Box>
              );
            })}
          </Box>
        </Box>
      ))}
    </Stack>
  );
}

function dialogTitle(resource: string, rowId: unknown, t: Translation) {
  if (resource === "employees") return rowId ? t.updateEmployee : t.newEmployee;
  return `${rowId ? t.edit : t.create} ${singularResourceLabel(resource, t)}`;
}

async function syncAssignments(
  parentId: string,
  state: AssignmentState,
  session: Session,
) {
  const addedIds = state.selectedIds.filter(
    (itemId) => !state.originalIds.includes(itemId),
  );
  const removedIds = state.originalIds.filter(
    (itemId) => !state.selectedIds.includes(itemId),
  );

  await Promise.all([
    ...addedIds.map((itemId) =>
      api(assignmentPath(state.type, parentId, itemId), session, {
        method: "POST",
      }),
    ),
    ...removedIds.map((itemId) =>
      api(assignmentPath(state.type, parentId, itemId), session, {
        method: "DELETE",
      }),
    ),
  ]);
}

function assignmentPath(
  type: AssignmentType,
  parentId: string,
  itemId: string,
) {
  return type === "account"
    ? `/assignments/accounts/${parentId}/roles/${itemId}`
    : `/assignments/roles/${parentId}/permissions/${itemId}`;
}

function AssignmentSection({
  type,
  row,
  session,
  language,
  t,
  onChange,
  inline = false,
}: {
  type: AssignmentType;
  row: AnyRow;
  session: Session;
  language: Language;
  t: Translation;
  onChange: (state: AssignmentState) => void;
  inline?: boolean;
}) {
  const target = type === "account" ? "roles" : "permissions";
  const [items, setItems] = useState<AnyRow[]>([]);
  const [originalIds, setOriginalIds] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PanelErrorState | null>(null);
  const { showToast } = useToast();
  const targetIdKey = type === "account" ? "roleId" : "permissionId";
  const selectLabel = type === "account" ? t.accountRoles : t.rolePermissions;

  async function load() {
    setError(null);
    setLoading(true);
    try {
      const parentId = typeof row.id === "string" ? row.id : undefined;
      const [all, assigned] = await Promise.all([
        api<AnyRow[]>(`/${target}`, session),
        parentId
          ? api<AnyRow[]>(
              type === "account"
                ? `/assignments/accounts/${parentId}/roles`
                : `/assignments/roles/${parentId}/permissions`,
              session,
            )
          : Promise.resolve([]),
      ]);
      const loadedIds = assigned
        .map((link) => link[targetIdKey])
        .filter((id): id is string => typeof id === "string");
      setItems(all);
      setOriginalIds(loadedIds);
      setSelectedIds(loadedIds);
      onChange({ type, originalIds: loadedIds, selectedIds: loadedIds });
    } catch (err) {
      const nextError = apiError(err, "loadFailed");
      setError(nextError);
      showToast({
        message: renderPanelError(nextError, t, language),
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [row.id, type]);

  function handleSelectionChange(value: unknown) {
    const nextIds = (
      Array.isArray(value) ? value : String(value).split(",")
    ).map(String);
    setSelectedIds(nextIds);
    onChange({ type, originalIds, selectedIds: nextIds });
  }

  function renderSelectedValues(selectedIds: string[]) {
    return selectedIds
      .map((itemId) => items.find((item) => item.id === itemId))
      .filter((item): item is AnyRow => Boolean(item))
      .map(assignmentItemLabel)
      .join(", ");
  }

  return (
    <>
      {!inline && <Divider />}
      <Box>
        {!inline && (
          <Typography variant="subtitle1">
            {selectLabel}
          </Typography>
        )}
        {loading ? (
          <Skeleton variant="rounded" height={40} className="mt-2" />
        ) : (
          <FormControl fullWidth size="small" className={inline ? "" : "mt-2"}>
            <Select
              label={selectLabel}
              multiple
              value={selectedIds}
              onChange={(event) => handleSelectionChange(event.target.value)}
              renderValue={(selected) =>
                renderSelectedValues(selected as string[])
              }
            >
              {items.map((item) => {
                const itemId = String(item.id ?? "");
                return (
                  <MenuItem key={itemId} value={itemId}>
                    {assignmentItemLabel(item)}
                  </MenuItem>
                );
              })}
            </Select>
            <FormHelperText error>
              {error ? renderPanelError(error, t, language) : ""}
            </FormHelperText>
          </FormControl>
        )}
      </Box>
    </>
  );
}

function defaultRow(fields: Field[], resource?: string): AnyRow {
  let row: AnyRow = {};
  if (resource === "accounts") {
    fields.forEach((field) => {
      row = setFieldValue(
        row,
        field.name,
        field.name === "preferredLanguage"
          ? "zh-CN"
          : (field.options?.[0] ?? ""),
      );
    });
    return row;
  }
  if (resource === "employees") {
    row = setFieldValue(row, "status", "ACTIVE");
  }
  fields.forEach((field) => {
    row = setFieldValue(
      row,
      field.name,
      field.name === "status" && resource === "employees"
        ? "ACTIVE"
        : (field.options?.[0] ?? ""),
    );
  });
  return row;
}

export function requestBodyFromFields(fields: Field[], form: AnyRow) {
  return fields.reduce((body, field) => {
    if (field.name === "confirmPassword") return body;
    const value = getFieldValue(form, field.name);
    const normalizedValue =
      field.name === "mustChangePassword"
        ? value === true || value === "true"
        : value === ""
          ? null
          : value;
    return setFieldValue(body, field.name, normalizedValue);
  }, {} as AnyRow);
}

export function validatePhoneFields(
  fields: Field[],
  form: AnyRow,
  resource: string,
) {
  const invalidField = fields.find(
    (field) =>
      isPhoneField(field.name) &&
      !isValidPhoneValue(getFieldValue(form, field.name)),
  );
  return invalidField ? fieldError(invalidField.name, "phoneInvalid", resource) : null;
}

export function validateImageFields(
  fields: Field[],
  form: AnyRow,
  resource: string,
) {
  const invalidField = fields.find((field) => {
    const value = getFieldValue(form, field.name);
    return (
      isImageUploadField(field.name) &&
      value !== null &&
      value !== undefined &&
      value !== "" &&
      !isValidImageDataUrl(value)
    );
  });
  return invalidField ? fieldError(invalidField.name, "imageInvalid", resource) : null;
}

function isPhoneField(fieldName: string) {
  return fieldName === "phone" || fieldName.endsWith(".phone");
}

function isValidPhoneValue(value: unknown) {
  return /^\d{11}$/.test(String(value ?? ""));
}

function isStrongPassword(value: string) {
  return (
    value.length >= 8 &&
    /[A-Za-z]/.test(value) &&
    /\d/.test(value) &&
    /[^A-Za-z0-9]/.test(value)
  );
}

function isValidIdCardNumber(value: unknown) {
  return String(value ?? "").length === 18;
}

function isFutureDateValue(value: unknown) {
  const dateValue = String(value ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) return false;
  const today = new Date();
  const todayValue = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");
  return dateValue > todayValue;
}

function isImageUploadField(fieldName: string) {
  return fieldName === "photo" || fieldName === "avatar";
}

function isValidImageDataUrl(value: unknown) {
  return /^data:image\/(png|jpeg|gif|webp|bmp);base64,[A-Za-z0-9+/=]+$/.test(
    String(value ?? ""),
  );
}

function isChinaAddressField(fieldName: string) {
  return (
    fieldName === "addressProvince" ||
    fieldName === "addressCity" ||
    fieldName === "addressDistrict"
  );
}

function provinceOptions() {
  return chinaAddressDivisions.map((item) => item.province);
}

function cityOptions(province: unknown) {
  return (
    chinaAddressDivisions
      .find((item) => item.province === province)
      ?.cities.map((city) => city.name) ?? []
  );
}

function districtOptions(province: unknown, city: unknown) {
  return (
    chinaAddressDivisions
      .find((item) => item.province === province)
      ?.cities.find((item) => item.name === city)?.districts ?? []
  );
}

function getFieldValue(row: AnyRow, path: string) {
  return path
    .split(".")
    .reduce<unknown>(
      (value, part) =>
        value && typeof value === "object"
          ? (value as AnyRow)[part]
          : undefined,
      row,
    );
}

function setFieldValue(row: AnyRow, path: string, value: unknown): AnyRow {
  const parts = path.split(".");
  if (parts.length === 1) return { ...row, [path]: value };
  const [head, ...rest] = parts;
  const current = row[head];
  return {
    ...row,
    [head]: setFieldValue(
      current && typeof current === "object" ? (current as AnyRow) : {},
      rest.join("."),
      value,
    ),
  };
}

function renderField(
  resource: string,
  field: Field,
  form: AnyRow,
  setForm: React.Dispatch<React.SetStateAction<AnyRow>>,
  t: Translation,
  references: ReferenceData,
  currentRowId?: string,
  language: Language = "en",
  fieldErrors: FieldErrorMap = {},
  onFieldChange?: (fieldName: string) => void,
) {
  const helperText = fieldErrorText(fieldErrors, field.name, t);
  const hasFieldError = Boolean(helperText);
  if (field.readOnly) {
    const value = getFieldValue(form, field.name);
    const display = isDateColumn(field.name)
      ? formatDateValue(value, field.name, language)
      : databaseValueLabel(t, value, resource, field.name);

    return (
      <TextField
        key={field.name}
        fullWidth
        label={formFieldLabel(resource, t, field.name)}
        value={display}
        disabled
      />
    );
  }

  if (isImageUploadField(field.name)) {
    return renderImageUploadField(
      field,
      form,
      setForm,
      t,
      helperText,
      onFieldChange,
    );
  }

  if (isChinaAddressField(field.name)) {
    return renderChinaAddressField(
      field,
      form,
      setForm,
      t,
      helperText,
      onFieldChange,
    );
  }

  if (resource === "accounts" && field.name === "employeeId") {
    const selectedEmployee =
      references.employees.find(
        (employee) => employee.id === form.employeeId,
      ) ?? null;
    const employeeOptions = availableAccountEmployees(
      references,
      form.employeeId,
      !currentRowId,
    );
    return (
      <Autocomplete<AnyRow>
        key={field.name}
        fullWidth
        options={employeeOptions}
        value={selectedEmployee}
        getOptionLabel={accountEmployeeName}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        onChange={(_, employee) =>
          (onFieldChange?.(field.name),
          setForm({
            ...form,
            employeeId:
              employee && typeof employee === "object" ? employee.id : null,
          }))
        }
        renderInput={(params) => (
          <TextField
            {...params}
            label={formFieldLabel(resource, t, field.name)}
            required={field.required}
            error={hasFieldError}
            helperText={helperText}
          />
        )}
      />
    );
  }

  if (resource === "employees" && field.name === "departmentId") {
    const value = getFieldValue(form, field.name);
    const label = formFieldLabel(resource, t, field.name);
    return (
      <FormControl key={field.name} fullWidth>
        <Select
          label={label}
          value={String(value ?? "")}
          onChange={(event) =>
            (onFieldChange?.(field.name),
            setForm((current) =>
              setFieldValue(current, field.name, event.target.value || null),
            ))
          }
        >
          <MenuItem value="">-</MenuItem>
          {references.departments.map((department) => (
            <MenuItem key={String(department.id)} value={String(department.id)}>
              {departmentName(department, t)}
            </MenuItem>
          ))}
        </Select>
        <FormHelperText error>{helperText}</FormHelperText>
      </FormControl>
    );
  }

  if (
    (resource === "employees" || resource === "departments") &&
    field.name === "managerId"
  ) {
    const selectedManager =
      references.employees.find(
        (employee) => employee.id === getFieldValue(form, field.name),
      ) ?? null;
    const managerOptions = references.employees.filter(
      (employee) => employee.id !== currentRowId,
    );
    return (
      <Autocomplete<AnyRow>
        key={field.name}
        fullWidth
        options={managerOptions}
        value={selectedManager}
        getOptionLabel={employeeName}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        onChange={(_, manager) => {
          onFieldChange?.(field.name);
          setForm((current) =>
            setFieldValue(
              current,
              field.name,
              manager && typeof manager === "object" ? manager.id : null,
            ),
          );
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label={formFieldLabel(resource, t, field.name)}
            error={hasFieldError}
            helperText={helperText}
          />
        )}
      />
    );
  }

  if (field.options) {
    const value = getFieldValue(form, field.name);
    const label = formFieldLabel(resource, t, field.name);
    return (
      <FormControl key={field.name} fullWidth>
        <Select
          label={label}
          required={field.required}
          value={String(value ?? field.options[0] ?? "")}
          onChange={(event) =>
            (onFieldChange?.(field.name),
            setForm((current) =>
              setFieldValue(current, field.name, event.target.value),
            ))
          }
        >
          {field.options.map((option) => (
            <MenuItem key={option} value={option}>
              {optionLabel(t, option, resource, field.name)}
            </MenuItem>
          ))}
        </Select>
        <FormHelperText error>{helperText}</FormHelperText>
      </FormControl>
    );
  }

  const value = String(getFieldValue(form, field.name) ?? "");
  const isPhone = isPhoneField(field.name);
  const isIdCardNumber = field.name === "idCardNumber";
  const isLockedAccountUsername =
    resource === "accounts" && field.name === "username" && Boolean(currentRowId);
  const isLockedDepartmentIdentity =
    resource === "departments" &&
    (field.name === "code" || field.name === "name") &&
    Boolean(currentRowId);
  const showPhoneError = isPhone && value !== "" && !isValidPhoneValue(value);
  const htmlInputProps: React.InputHTMLAttributes<HTMLInputElement> | undefined =
    isPhone
      ? {
          inputMode: "numeric",
          maxLength: 11,
        }
      : isIdCardNumber
        ? {
            maxLength: 18,
          }
        : undefined;

  if (field.type === "password") {
    return (
      <PasswordTextField
        key={field.name}
        label={formFieldLabel(resource, t, field.name)}
        value={value}
        required={
          field.required &&
          !(
            resource === "accounts" &&
            field.name === "password" &&
            currentRowId
          )
        }
        autoComplete="new-password"
        onChange={(nextValue) => {
          onFieldChange?.(field.name);
          setForm((current) => setFieldValue(current, field.name, nextValue));
        }}
        error={hasFieldError}
        helperText={helperText}
      />
    );
  }

  return (
    <TextField
      key={field.name}
      fullWidth
      label={formFieldLabel(resource, t, field.name)}
      type={field.type ?? "text"}
      disabled={isLockedAccountUsername || isLockedDepartmentIdentity}
      required={
        field.required &&
        !(resource === "accounts" && field.name === "password" && currentRowId)
      }
      value={value}
      onChange={(event) => {
        onFieldChange?.(field.name);
        const nextValue = isPhone
          ? event.target.value.replace(/\D/g, "").slice(0, 11)
          : isIdCardNumber
            ? event.target.value.slice(0, 18)
            : resource === "departments" && field.name === "code"
              ? event.target.value.toUpperCase()
            : event.target.value;
        setForm((current) => setFieldValue(current, field.name, nextValue));
      }}
      error={hasFieldError || showPhoneError}
      helperText={helperText ?? (showPhoneError ? t.phoneInvalid : undefined)}
      slotProps={htmlInputProps ? { htmlInput: htmlInputProps } : undefined}
    />
  );
}

export function renderImageUploadField(
  field: Field,
  form: AnyRow,
  setForm: React.Dispatch<React.SetStateAction<AnyRow>>,
  t: Translation,
  helperText?: string,
  onFieldChange?: (fieldName: string) => void,
  portraitLayout = false,
) {
  const value = String(getFieldValue(form, field.name) ?? "");
  const label = fieldLabel(t, field.name);
  const hasImage = isValidImageDataUrl(value);

  function handleImageSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    onFieldChange?.(field.name);
    if (!IMAGE_UPLOAD_TYPES.has(file.type)) {
      window.alert(t.imageInvalid);
      return;
    }
    if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
      window.alert(t.imageTooLarge);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (
        typeof reader.result === "string" &&
        isValidImageDataUrl(reader.result)
      ) {
        setForm((current) => setFieldValue(current, field.name, reader.result));
      } else {
        window.alert(t.imageInvalid);
      }
    };
    reader.onerror = () => window.alert(t.imageInvalid);
    reader.readAsDataURL(file);
  }

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" className="mb-1.5">
        {label}
      </Typography>
      <Stack
        direction={portraitLayout ? "column" : "row"}
        spacing={1.5}
        className={portraitLayout ? "items-start" : "items-center"}
      >
        <Box
          className={cn(
            "grid shrink-0 place-items-center overflow-hidden rounded-md border border-[#cfd8d3] bg-[#f5f7f4]",
            portraitLayout ? "h-[180px] w-full" : "size-[72px]",
          )}
        >
          {hasImage ? (
            <Box
              component="img"
              src={value}
              alt={label}
              className="h-full w-full object-cover"
            />
          ) : (
            <Camera size={22} className="text-muted-foreground" />
          )}
        </Box>
        <Stack
          direction={portraitLayout ? "column" : { xs: "column", sm: "row" }}
          spacing={1}
          className={cn(
            "min-w-0",
            portraitLayout ? "w-full items-stretch" : "sm:items-center",
          )}
        >
          <Button
            component="label"
            variant="outlined"
            startIcon={<Camera size={16} />}
            fullWidth={portraitLayout}
          >
            {hasImage ? t.changeImage : t.uploadImage}
            <input
              hidden
              type="file"
              accept={IMAGE_UPLOAD_ACCEPT}
              onChange={handleImageSelect}
            />
          </Button>
          {hasImage && (
            <Tooltip title={t.removeImage}>
              <IconButton
                color="error"
                onClick={() => {
                  onFieldChange?.(field.name);
                  setForm((current) => setFieldValue(current, field.name, null));
                }}
              >
                <Trash2 size={16} />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      </Stack>
      <Typography variant="caption" color="text.secondary">
        JPG, PNG, GIF, WebP, BMP - 20MB
      </Typography>
      <FormHelperText error>{helperText}</FormHelperText>
    </Box>
  );
}

function renderChinaAddressField(
  field: Field,
  form: AnyRow,
  setForm: React.Dispatch<React.SetStateAction<AnyRow>>,
  t: Translation,
  helperText?: string,
  onFieldChange?: (fieldName: string) => void,
) {
  const province = getFieldValue(form, "addressProvince");
  const city = getFieldValue(form, "addressCity");
  const value = String(getFieldValue(form, field.name) ?? "");
  const options: string[] =
    field.name === "addressProvince"
      ? provinceOptions()
      : field.name === "addressCity"
        ? cityOptions(province)
        : [...districtOptions(province, city)];
  const disabled =
    field.name === "addressCity"
      ? !province
      : field.name === "addressDistrict"
        ? !province || !city
        : false;
  const label = formFieldLabel("employees", t, field.name);

  function updateAddress(value: string) {
    onFieldChange?.(field.name);
    setForm((current) => {
      if (field.name === "addressProvince") {
        return {
          ...current,
          addressProvince: value || null,
          addressCity: null,
          addressDistrict: null,
        };
      }
      if (field.name === "addressCity") {
        return {
          ...current,
          addressCity: value || null,
          addressDistrict: null,
        };
      }
      return {
        ...current,
        addressDistrict: value || null,
      };
    });
  }

  return (
    <Autocomplete
      key={field.name}
      freeSolo
      disabled={disabled}
      options={options}
      value={value || null}
      onChange={(_, nextValue) => updateAddress(String(nextValue ?? ""))}
      onInputChange={(_, nextValue, reason) => {
        if (reason === "input" || reason === "clear") {
          updateAddress(nextValue);
        }
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          error={Boolean(helperText)}
          helperText={helperText}
        />
      )}
    />
  );
}

function displayValue(
  resource: string,
  column: string,
  value: unknown,
  references: ReferenceData,
  language: Language,
  t: Translation,
) {
  if (resource === "accounts" && column === "employeeId") {
    const employee = references.employees.find((item) => item.id === value);
    return employee ? accountEmployeeName(employee) : String(value ?? "");
  }
  if (resource === "departments" && column === "managerId") {
    const manager = references.employees.find((item) => item.id === value);
    return manager ? employeeName(manager) : String(value ?? "");
  }
  if (resource === "departments" && column === "employeeCount") {
    return String(departmentEmployeeCount(value, references));
  }
  if (resource === "departments" && column === "name") {
    return departmentNameText(value, t);
  }
  if (resource === "employees" && column === "departmentId") {
    const department = references.departments.find((item) => item.id === value);
    return department ? departmentName(department, t) : String(value ?? "");
  }
  if (resource === "employees" && column === "managerId") {
    const manager = references.employees.find((item) => item.id === value);
    return manager ? employeeName(manager) : String(value ?? "");
  }
  if (isDateColumn(column)) {
    return formatDateValue(value, column, language);
  }
  return databaseValueLabel(t, value, resource, column);
}

function buildGridColumns(
  columns: string[],
  sort: SortState,
  setSort: (nextSort: SortState) => void,
  resource: string,
  references: ReferenceData,
  language: Language,
  t: Translation,
  actions: { edit: boolean; delete: boolean },
  setEditing: React.Dispatch<React.SetStateAction<AnyRow | null>>,
  setPasswordEditing: React.Dispatch<React.SetStateAction<AnyRow | null>>,
  setPendingDelete: React.Dispatch<React.SetStateAction<AnyRow | null>>,
): GridColDef[] {
  const dataColumns = [
    ...columns.map((column): GridColDef => {
      const sortRule = sort?.column === column ? sort : undefined;
      const headerLabel = fieldLabel(t, column);

      return {
        field: column,
        headerName: headerLabel,
        sortable: false,
        flex: isImageUploadField(column) ? 0 : 1,
        minWidth: isImageUploadField(column) ? 96 : 150,
        width: isImageUploadField(column) ? 96 : undefined,
        renderHeader: () => (
          <TableSortLabel
            active={Boolean(sortRule)}
            direction={sortRule?.direction ?? "asc"}
            onClick={() => setSort(toggleSortRule(sort, column))}
          >
            {headerLabel}
          </TableSortLabel>
        ),
        renderCell: (params: { row: AnyRow }) => {
          const rawValue =
            resource === "departments" && column === "employeeCount"
              ? params.row.id
              : params.row[column];
          const value = displayValue(
            resource,
            column,
            rawValue,
            references,
            language,
            t,
          );
          if (isImageUploadField(column)) {
            return isValidImageDataUrl(params.row[column]) ? (
              <Box
                component="img"
                src={String(params.row[column])}
                alt={headerLabel}
                className="size-9 rounded-md object-cover"
              />
            ) : (
              ""
            );
          }
          return (
            <Box
              title={value}
              className="overflow-hidden text-ellipsis whitespace-nowrap"
            >
              {value}
            </Box>
          );
        },
      };
    }),
  ];

  if (!actions.edit && !actions.delete) return dataColumns;

  return [
    ...dataColumns,
    {
      field: "__actions",
      headerName: t.actions,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      width: resource === "accounts" ? 136 : 104,
      align: "right",
      headerAlign: "right",
      renderCell: (params: { row: AnyRow }) => (
        <Stack
          direction="row"
          spacing={0.5}
          className="min-h-full w-full items-center justify-end"
        >
          {actions.edit && (
            <Tooltip title={t.edit}>
              <IconButton size="small" onClick={() => setEditing(params.row)}>
                <Pencil size={16} />
              </IconButton>
            </Tooltip>
          )}
          {resource === "accounts" && actions.edit && (
            <Tooltip title={t.updatePassword}>
              <IconButton
                size="small"
                onClick={() => setPasswordEditing(params.row)}
              >
                <KeyRound size={16} />
              </IconButton>
            </Tooltip>
          )}
          {actions.delete && (
            <Tooltip title={t.delete}>
              <IconButton
                size="small"
                onClick={() => setPendingDelete(params.row)}
              >
                <Trash2 size={16} />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      ),
    },
  ];
}

function toggleSortRule(sort: SortState, column: string): SortState {
  if (sort?.column !== column) return { column, direction: "asc" };
  if (sort.direction === "asc") return { column, direction: "desc" };
  return null;
}

function sortRows(
  rows: AnyRow[],
  sort: SortState,
  resource: string,
  references: ReferenceData,
  language: Language,
  t: Translation,
) {
  if (!sort) return rows;
  const direction = sort.direction === "asc" ? 1 : -1;
  return [...rows].sort(
    (left, right) =>
      compareSortValues(
        sortValue(left, sort.column, resource, references, language, t),
        sortValue(right, sort.column, resource, references, language, t),
      ) * direction,
  );
}

function sortValue(
  row: AnyRow,
  column: string,
  resource: string,
  references: ReferenceData,
  language: Language,
  t: Translation,
) {
  const value = row[column];
  if (resource === "departments" && column === "employeeCount") {
    return departmentEmployeeCount(row.id, references);
  }
  if (isDateColumn(column)) {
    return parseDateValue(value, column) ?? "";
  }
  if (typeof value === "number") return value;
  return displayValue(
    resource,
    column,
    value,
    references,
    language,
    t,
  ).toLocaleLowerCase();
}

function compareSortValues(
  left: string | number | boolean,
  right: string | number | boolean,
) {
  if (typeof left === "number" && typeof right === "number")
    return left - right;
  if (typeof left === "boolean" && typeof right === "boolean")
    return Number(left) - Number(right);
  return String(left).localeCompare(String(right), undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

function isDateColumn(column: string) {
  return (
    dateOnlyColumns.has(column) ||
    column.endsWith("At") ||
    column.toLowerCase().includes("date")
  );
}

function formatDateValue(value: unknown, column: string, language: Language) {
  if (value === null || value === undefined || value === "") return "";
  const raw = String(value);
  const isDateOnly =
    dateOnlyColumns.has(column) || /^\d{4}-\d{2}-\d{2}$/.test(raw);
  const timestamp = parseDateValue(value, column);
  if (timestamp === null) return raw;
  const date = new Date(timestamp);

  return new Intl.DateTimeFormat(language, {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...(isDateOnly ? {} : { hour: "2-digit", minute: "2-digit" }),
  }).format(date);
}

function parseDateValue(value: unknown, column: string) {
  if (value === null || value === undefined || value === "") return null;
  const raw = String(value);
  const isDateOnly =
    dateOnlyColumns.has(column) || /^\d{4}-\d{2}-\d{2}$/.test(raw);
  const timestamp = new Date(isDateOnly ? `${raw}T00:00:00` : raw).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

function employeeAccountForAction(
  resource: string,
  row: AnyRow,
  references: ReferenceData,
) {
  if (resource !== "employees") return undefined;
  return references.accounts.find((account) => account.employeeId === row.id);
}

function departmentEmployeesForDelete(
  resource: string,
  row: AnyRow,
  references: ReferenceData,
) {
  if (resource !== "departments") return [];
  return references.employees.filter((employee) => employee.departmentId === row.id);
}

function departmentEmployeeCount(departmentId: unknown, references: ReferenceData) {
  return references.employees.filter(
    (employee) => employee.departmentId === departmentId,
  )
    .length;
}

function accountSummary(account?: AnyRow) {
  if (!account) return "";
  return [account.username, account.status ? `(${account.status})` : ""]
    .filter(Boolean)
    .join(" ");
}

function assignmentItemLabel(item: AnyRow) {
  return (
    [item.name, item.code ? `(${item.code})` : ""].filter(Boolean).join(" ") ||
    String(item.id ?? "")
  );
}

function availableAccountEmployees(
  references: ReferenceData,
  currentEmployeeId: unknown,
  activeOnly = false,
) {
  const assignedEmployeeIds = new Set(
    references.accounts
      .map((account) => account.employeeId)
      .filter((employeeId) => employeeId && employeeId !== currentEmployeeId),
  );
  return references.employees.filter(
    (employee) =>
      !assignedEmployeeIds.has(employee.id) &&
      (!activeOnly ||
        employee.status === "ACTIVE" ||
        employee.id === currentEmployeeId),
  );
}

function departmentName(department: AnyRow, t: Translation) {
  return [
    departmentNameText(department.name, t),
    department.code ? `(${department.code})` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function departmentNameText(value: unknown, t: Translation) {
  const name = String(value ?? "").trim();
  if (!name) return "";
  return t.departmentNames[name as keyof typeof t.departmentNames] ?? name;
}

function accountEmployeeName(employee: AnyRow) {
  const fullName = String(employee.fullName ?? "").trim();
  if (fullName) return fullName;
  const lastName = String(employee.lastName ?? "").trim();
  const firstName = String(employee.firstName ?? "").trim();
  const name = [lastName, firstName].filter(Boolean).join(" ");
  return (
    name ||
    String(employee.displayName ?? employee.employeeNo ?? employee.id ?? "")
  );
}

function employeeName(employee: AnyRow) {
  const fullName = String(employee.fullName ?? "").trim();
  if (fullName) return fullName;
  const displayName = String(employee.displayName ?? "").trim();
  if (displayName) return displayName;
  return (
    [employee.firstName, employee.lastName].filter(Boolean).join(" ") ||
    String(employee.employeeNo ?? employee.id ?? "")
  );
}

function fieldLabel(t: Translation, key: string) {
  return (
    t.fields[key as keyof typeof t.fields] ??
    key.replace(/([A-Z])/g, " $1").replace(/^./, (match) => match.toUpperCase())
  );
}

function optionLabel(
  t: Translation,
  option: string,
  resource?: string,
  fieldName?: string,
) {
  if (resource === "employees" && fieldName === "status") {
    return (
      t.employeeStatusLabels[
        option as keyof typeof t.employeeStatusLabels
      ] ?? option
    );
  }
  return (
    t.optionLabels[option as keyof typeof t.optionLabels] ??
    option
  );
}

function databaseValueLabel(
  t: Translation,
  value: unknown,
  resource?: string,
  fieldName?: string,
) {
  if (value === null || value === undefined || value === "") return "";
  return optionLabel(t, String(value), resource, fieldName);
}

function singularResourceLabel(resource: string, t: Translation) {
  if (resource === "accounts") return fieldLabel(t, "account");
  if (resource === "roles") return fieldLabel(t, "role");
  if (resource === "permissions") return fieldLabel(t, "permission");
  if (resource === "departments") return fieldLabel(t, "department");
  const label = t.resources[resource as keyof typeof t.resources] ?? resource;
  return label.endsWith("s") ? label.slice(0, -1) : label;
}

function formFieldLabel(resource: string, t: Translation, key: string) {
  if (resource === "employees" && key.startsWith("emergencyContact.")) {
    return fieldLabel(t, key.replace("emergencyContact.", ""));
  }
  return fieldLabel(t, key);
}
