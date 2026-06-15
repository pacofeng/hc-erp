import React, { useEffect, useMemo, useState } from "react";
import {
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Stack,
  TableSortLabel,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  DataGrid,
  type GridColDef,
  type GridPaginationModel,
} from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import RefreshIcon from "@mui/icons-material/Refresh";
import SaveIcon from "@mui/icons-material/Save";
import {
  IMAGE_UPLOAD_ACCEPT,
  IMAGE_UPLOAD_TYPES,
  MAX_IMAGE_UPLOAD_BYTES,
  dateOnlyColumns,
  pageSizeOptions,
} from "../../app/constants";
import { api } from "../../app/apiClient";
import { canUseResourceAction } from "../../app/resources";
import {
  employeeFormSections,
  employeeTableColumns,
  newEmployeeFormSections,
  schemas,
  settingsFields,
} from "../../app/schemaConfig";
import type { Translation } from "../../app/i18n";
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
  const [pendingDelete, setPendingDelete] = useState<AnyRow | null>(null);
  const [sort, setSort] = useState<SortState>(null);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 20,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const actions = useMemo(
    () => ({
      create: canUseResourceAction(resource, "create", session),
      edit: canUseResourceAction(resource, "edit", session),
      delete: canUseResourceAction(resource, "delete", session),
    }),
    [resource, session],
  );

  async function load() {
    setError("");
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
      setError(err instanceof Error ? err.message : t.loadFailed);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [resource]);

  async function remove(row: AnyRow) {
    if (!row.id) return;
    setError("");
    try {
      await api<void>(`/${resource}/${row.id}`, session, { method: "DELETE" });
      setPendingDelete(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.deleteFailed);
    }
  }

  const columns =
    resource === "employees"
      ? employeeTableColumns
      : Array.from(new Set(rows.flatMap((row) => Object.keys(row))))
          .filter((column) => column !== "id" && column !== "passwordHash")
          .slice(0, 9);
  const sortedRows = useMemo(
    () => sortRows(rows, sort, resource, references, language),
    [rows, sort, resource, references, language],
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
        setPendingDelete,
      ),
    [columns, sort, resource, references, language, t, actions],
  );

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
    <Paper sx={{ overflow: "hidden" }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
        sx={{ p: 2, alignItems: { sm: "center" } }}
      >
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
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
              <RefreshIcon />
            </IconButton>
          </span>
        </Tooltip>
        {actions.create && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setEditing(defaultRow(schema.fields, resource))}
          >
            {t.new}
          </Button>
        )}
      </Stack>
      <Divider />
      {error && (
        <Typography color="error" sx={{ px: 2, py: 1 }}>
          {error}
        </Typography>
      )}
      <Box sx={{ height: "calc(100vh - 238px)", minHeight: 420 }}>
        <DataGrid
          rows={sortedRows}
          columns={dataGridColumns}
          loading={loading}
          disableRowSelectionOnClick
          paginationModel={paginationModel}
          onPaginationModelChange={updatePaginationModel}
          pageSizeOptions={pageSizeOptions}
          getRowId={(row: AnyRow) => String(row.id)}
          sx={{
            border: 0,
            "& .MuiDataGrid-columnHeaderTitle": { fontWeight: 700 },
            "& .MuiDataGrid-cell:focus, & .MuiDataGrid-columnHeader:focus": {
              outline: "none",
            },
          }}
        />
      </Box>
      {editing && (
        <EditDialog
          resource={resource}
          schema={schema}
          row={editing}
          session={session}
          t={t}
          references={references}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
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
            {employeeAccountForDelete(resource, pendingDelete, references) && (
              <Box sx={{ mt: 2, p: 1.5, bgcolor: "#fdecee", borderRadius: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {t.employeeAccountDeleteWarning}
                </Typography>
                <Typography variant="body2">
                  {t.associatedAccount}:{" "}
                  {accountSummary(
                    employeeAccountForDelete(
                      resource,
                      pendingDelete,
                      references,
                    ),
                  )}
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPendingDelete(null)}>{t.cancel}</Button>
            <Button
              color="error"
              variant="contained"
              startIcon={<DeleteIcon />}
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
  t,
  references,
  onClose,
  onSaved,
}: {
  resource: string;
  schema: { label: string; fields: Field[] };
  row: AnyRow;
  session: Session;
  t: Translation;
  references: ReferenceData;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<AnyRow>(row);
  const [error, setError] = useState("");
  const [assignmentState, setAssignmentState] =
    useState<AssignmentState | null>(null);
  const assignmentType =
    row.id && resource === "accounts"
      ? "account"
      : row.id && resource === "roles"
        ? "role"
        : undefined;

  async function save() {
    setError("");
    const validationError = validatePhoneFields(
      schema.fields,
      form,
      t,
      resource,
    );
    if (validationError) {
      setError(validationError);
      return;
    }
    const imageValidationError = validateImageFields(schema.fields, form, t);
    if (imageValidationError) {
      setError(imageValidationError);
      return;
    }
    const body = requestBodyFromFields(schema.fields, form);
    if (
      resource === "accounts" &&
      !row.id &&
      !String(body.password ?? "").trim()
    ) {
      setError(t.passwordRequired);
      return;
    }
    try {
      await api(`/${resource}${row.id ? `/${row.id}` : ""}`, session, {
        method: row.id ? "PUT" : "POST",
        body: JSON.stringify(body),
      });
      if (assignmentType && assignmentState && row.id) {
        await syncAssignments(row.id, assignmentState, session);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.saveFailed);
    }
  }

  return (
    <Dialog
      open
      onClose={onClose}
      maxWidth={resource === "employees" || assignmentType ? "md" : "sm"}
      fullWidth
    >
      <DialogTitle>{dialogTitle(resource, row.id, t)}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {resource === "employees" ? (
            <FormSections
              sections={row.id ? employeeFormSections : newEmployeeFormSections}
              fields={schema.fields}
              form={form}
              setForm={setForm}
              t={t}
              references={references}
              currentRowId={row.id}
              columns={3}
            />
          ) : (
            schema.fields.map((field) =>
              renderField(
                resource,
                field,
                form,
                setForm,
                t,
                references,
                row.id,
              ),
            )
          )}
          {error && (
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          )}
          {assignmentType && (
            <AssignmentSection
              type={assignmentType}
              row={row}
              session={session}
              t={t}
              onChange={setAssignmentState}
            />
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t.cancel}</Button>
        <Button onClick={save} variant="contained" startIcon={<SaveIcon />}>
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
  columns?: 2 | 3;
}) {
  const fieldByName = new Map(fields.map((field) => [field.name, field]));

  return (
    <Stack spacing={2.5}>
      {sections.map((section) => (
        <Box key={section.titleKey}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {t[section.titleKey]}
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
                lg: `repeat(${columns}, minmax(0, 1fr))`,
              },
              gap: 2,
              mt: 1,
            }}
          >
            {section.fields.map((fieldName) => {
              const field = fieldByName.get(fieldName);
              if (!field) return null;
              const shouldSpan =
                isImageUploadField(fieldName) || fieldName === "address";

              return (
                <Box
                  key={fieldName}
                  sx={{
                    gridColumn: shouldSpan
                      ? { xs: "1", sm: "1 / -1" }
                      : undefined,
                    width: "100%",
                  }}
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
  return `${rowId ? t.edit : t.create} ${t.resources[resource as keyof typeof t.resources]}`;
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
  t,
  onChange,
}: {
  type: AssignmentType;
  row: AnyRow;
  session: Session;
  t: Translation;
  onChange: (state: AssignmentState) => void;
}) {
  const target = type === "account" ? "roles" : "permissions";
  const [items, setItems] = useState<AnyRow[]>([]);
  const [originalIds, setOriginalIds] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const targetIdKey = type === "account" ? "roleId" : "permissionId";
  const selectLabel = type === "account" ? t.accountRoles : t.rolePermissions;

  async function load() {
    setError("");
    setLoading(true);
    try {
      const [all, assigned] = await Promise.all([
        api<AnyRow[]>(`/${target}`, session),
        api<AnyRow[]>(
          type === "account"
            ? `/assignments/accounts/${row.id}/roles`
            : `/assignments/roles/${row.id}/permissions`,
          session,
        ),
      ]);
      const loadedIds = assigned
        .map((link) => link[targetIdKey])
        .filter((id): id is string => typeof id === "string");
      setItems(all);
      setOriginalIds(loadedIds);
      setSelectedIds(loadedIds);
      onChange({ type, originalIds: loadedIds, selectedIds: loadedIds });
    } catch (err) {
      setError(err instanceof Error ? err.message : t.loadFailed);
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
      <Divider />
      <Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          {selectLabel}
        </Typography>
        {error && (
          <Typography color="error" variant="body2" sx={{ mt: 1 }}>
            {error}
          </Typography>
        )}
        {loading ? (
          <Skeleton variant="rounded" height={40} sx={{ mt: 1 }} />
        ) : (
          <FormControl fullWidth size="small" sx={{ mt: 1 }}>
            <InputLabel>{selectLabel}</InputLabel>
            <Select
              multiple
              label={selectLabel}
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
                    <Checkbox checked={selectedIds.includes(itemId)} />
                    <ListItemText primary={assignmentItemLabel(item)} />
                  </MenuItem>
                );
              })}
            </Select>
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
  t: Translation,
  resource: string,
) {
  const invalidField = fields.find(
    (field) =>
      isPhoneField(field.name) &&
      !isValidPhoneValue(getFieldValue(form, field.name)),
  );
  return invalidField
    ? `${formFieldLabel(resource, t, invalidField.name)}: ${t.phoneInvalid}`
    : "";
}

export function validateImageFields(
  fields: Field[],
  form: AnyRow,
  t: Translation,
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
  return invalidField
    ? `${fieldLabel(t, invalidField.name)}: ${t.imageInvalid}`
    : "";
}

function isPhoneField(fieldName: string) {
  return fieldName === "phone" || fieldName.endsWith(".phone");
}

function isValidPhoneValue(value: unknown) {
  return /^\d{11}$/.test(String(value ?? ""));
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
) {
  if (field.readOnly) {
    const value = getFieldValue(form, field.name);
    const display = isDateColumn(field.name)
      ? formatDateValue(value, field.name, language)
      : String(value ?? "");

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
    return renderImageUploadField(field, form, setForm, t);
  }

  if (isChinaAddressField(field.name)) {
    return renderChinaAddressField(field, form, setForm, t);
  }

  if (resource === "accounts" && field.name === "employeeId") {
    const selectedEmployee =
      references.employees.find(
        (employee) => employee.id === form.employeeId,
      ) ?? null;
    const employeeOptions = availableAccountEmployees(
      references,
      form.employeeId,
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
          setForm({ ...form, employeeId: employee?.id ?? null })
        }
        renderInput={(params) => (
          <TextField
            {...params}
            label={formFieldLabel(resource, t, field.name)}
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
        <InputLabel>{label}</InputLabel>
        <Select
          label={label}
          value={String(value ?? "")}
          onChange={(event) =>
            setForm((current) =>
              setFieldValue(current, field.name, event.target.value || null),
            )
          }
        >
          <MenuItem value="">-</MenuItem>
          {references.departments.map((department) => (
            <MenuItem key={String(department.id)} value={String(department.id)}>
              {departmentName(department)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    );
  }

  if (resource === "employees" && field.name === "managerId") {
    const value = getFieldValue(form, field.name);
    const label = formFieldLabel(resource, t, field.name);
    return (
      <FormControl key={field.name} fullWidth>
        <InputLabel>{label}</InputLabel>
        <Select
          label={label}
          value={String(value ?? "")}
          onChange={(event) =>
            setForm((current) =>
              setFieldValue(current, field.name, event.target.value || null),
            )
          }
        >
          <MenuItem value="">-</MenuItem>
          {references.employees
            .filter((employee) => employee.id !== currentRowId)
            .map((employee) => (
              <MenuItem key={String(employee.id)} value={String(employee.id)}>
                {employeeName(employee)}
              </MenuItem>
            ))}
        </Select>
      </FormControl>
    );
  }

  if (field.options) {
    const value = getFieldValue(form, field.name);
    const label = formFieldLabel(resource, t, field.name);
    return (
      <FormControl key={field.name} fullWidth>
        <InputLabel>{label}</InputLabel>
        <Select
          label={label}
          value={String(value ?? field.options[0] ?? "")}
          onChange={(event) =>
            setForm((current) =>
              setFieldValue(current, field.name, event.target.value),
            )
          }
        >
          {field.options.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    );
  }

  const value = String(getFieldValue(form, field.name) ?? "");
  const isPhone = isPhoneField(field.name);
  const isIdCardNumber = field.name === "idCardNumber";
  const showPhoneError = isPhone && value !== "" && !isValidPhoneValue(value);
  const slotProps = {
    ...(field.type === "date" ? { inputLabel: { shrink: true } } : {}),
    ...(isPhone
      ? {
          htmlInput: {
            inputMode: "numeric",
            maxLength: 11,
            pattern: "[0-9]{11}",
          },
        }
      : {}),
    ...(isIdCardNumber
      ? {
          htmlInput: {
            maxLength: 18,
          },
        }
      : {}),
  };

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
        onChange={(nextValue) =>
          setForm((current) => setFieldValue(current, field.name, nextValue))
        }
      />
    );
  }

  return (
    <TextField
      key={field.name}
      fullWidth
      label={formFieldLabel(resource, t, field.name)}
      type={field.type ?? "text"}
      required={
        field.required &&
        !(resource === "accounts" && field.name === "password" && currentRowId)
      }
      value={value}
      onChange={(event) => {
        const nextValue = isPhone
          ? event.target.value.replace(/\D/g, "").slice(0, 11)
          : isIdCardNumber
            ? event.target.value.slice(0, 18)
            : event.target.value;
        setForm((current) => setFieldValue(current, field.name, nextValue));
      }}
      error={showPhoneError}
      helperText={showPhoneError ? t.phoneInvalid : undefined}
      slotProps={Object.keys(slotProps).length ? slotProps : undefined}
    />
  );
}

function renderImageUploadField(
  field: Field,
  form: AnyRow,
  setForm: React.Dispatch<React.SetStateAction<AnyRow>>,
  t: Translation,
) {
  const value = String(getFieldValue(form, field.name) ?? "");
  const label = fieldLabel(t, field.name);
  const hasImage = isValidImageDataUrl(value);

  function handleImageSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
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
      <Typography variant="body2" sx={{ color: "text.secondary", mb: 0.75 }}>
        {label}
      </Typography>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
        <Box
          sx={{
            width: 72,
            height: 72,
            borderRadius: 1,
            border: "1px solid #cfd8d3",
            bgcolor: "#f5f7f4",
            display: "grid",
            placeItems: "center",
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          {hasImage ? (
            <Box
              component="img"
              src={value}
              alt={label}
              sx={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <PhotoCameraIcon color="disabled" />
          )}
        </Box>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          sx={{ alignItems: { sm: "center" }, minWidth: 0 }}
        >
          <Button
            component="label"
            variant="outlined"
            startIcon={<PhotoCameraIcon />}
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
                onClick={() =>
                  setForm((current) => setFieldValue(current, field.name, null))
                }
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      </Stack>
      <Typography variant="caption" color="text.secondary">
        JPG, PNG, GIF, WebP, BMP - 20MB
      </Typography>
    </Box>
  );
}

function renderChinaAddressField(
  field: Field,
  form: AnyRow,
  setForm: React.Dispatch<React.SetStateAction<AnyRow>>,
  t: Translation,
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
      renderInput={(params) => <TextField {...params} label={label} />}
    />
  );
}

function displayValue(
  resource: string,
  column: string,
  value: unknown,
  references: ReferenceData,
  language: Language,
) {
  if (resource === "accounts" && column === "employeeId") {
    const employee = references.employees.find((item) => item.id === value);
    return employee ? accountEmployeeName(employee) : String(value ?? "");
  }
  if (resource === "departments" && column === "managerId") {
    const manager = references.employees.find((item) => item.id === value);
    return manager ? employeeName(manager) : String(value ?? "");
  }
  if (resource === "employees" && column === "departmentId") {
    const department = references.departments.find((item) => item.id === value);
    return department ? departmentName(department) : String(value ?? "");
  }
  if (resource === "employees" && column === "managerId") {
    const manager = references.employees.find((item) => item.id === value);
    return manager ? employeeName(manager) : String(value ?? "");
  }
  if (isDateColumn(column)) {
    return formatDateValue(value, column, language);
  }
  return String(value ?? "");
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
          const value = displayValue(
            resource,
            column,
            params.row[column],
            references,
            language,
          );
          if (isImageUploadField(column)) {
            return isValidImageDataUrl(params.row[column]) ? (
              <Box
                component="img"
                src={String(params.row[column])}
                alt={headerLabel}
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 1,
                  objectFit: "cover",
                }}
              />
            ) : (
              ""
            );
          }
          return (
            <Box
              title={value}
              sx={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
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
      width: 104,
      align: "right",
      headerAlign: "right",
      renderCell: (params: { row: AnyRow }) => (
        <Stack
          direction="row"
          spacing={0.5}
          sx={{
            alignItems: "center",
            justifyContent: "flex-end",
            minHeight: "100%",
            width: "100%",
          }}
        >
          {actions.edit && (
            <Tooltip title={t.edit}>
              <IconButton size="small" onClick={() => setEditing(params.row)}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {actions.delete && (
            <Tooltip title={t.delete}>
              <IconButton
                size="small"
                onClick={() => setPendingDelete(params.row)}
              >
                <DeleteIcon fontSize="small" />
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
) {
  if (!sort) return rows;
  const direction = sort.direction === "asc" ? 1 : -1;
  return [...rows].sort(
    (left, right) =>
      compareSortValues(
        sortValue(left, sort.column, resource, references, language),
        sortValue(right, sort.column, resource, references, language),
      ) * direction,
  );
}

function sortValue(
  row: AnyRow,
  column: string,
  resource: string,
  references: ReferenceData,
  language: Language,
) {
  const value = row[column];
  if (isDateColumn(column)) {
    return parseDateValue(value, column) ?? "";
  }
  if (typeof value === "number" || typeof value === "boolean") return value;
  return displayValue(
    resource,
    column,
    value,
    references,
    language,
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

function employeeAccountForDelete(
  resource: string,
  row: AnyRow,
  references: ReferenceData,
) {
  if (resource !== "employees") return undefined;
  return references.accounts.find((account) => account.employeeId === row.id);
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
) {
  const assignedEmployeeIds = new Set(
    references.accounts
      .map((account) => account.employeeId)
      .filter((employeeId) => employeeId && employeeId !== currentEmployeeId),
  );
  return references.employees.filter(
    (employee) => !assignedEmployeeIds.has(employee.id),
  );
}

function departmentName(department: AnyRow) {
  return [department.name, department.code ? `(${department.code})` : ""]
    .filter(Boolean)
    .join(" ");
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

function formFieldLabel(resource: string, t: Translation, key: string) {
  if (resource === "employees" && key.startsWith("emergencyContact.")) {
    return fieldLabel(t, key.replace("emergencyContact.", ""));
  }
  return fieldLabel(t, key);
}
