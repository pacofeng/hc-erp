import { useState } from "react";
import { Alert, Autocomplete, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, IconButton, MenuItem, Stack, Switch, TextField, Tooltip, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import { api } from "../../app/apiClient";
import { showToast } from "../../app/toast";
import type { Session } from "../../app/types";
import { availableOrderStatuses, orderFields, orderSections, parseMachineModels, serializeMachineModelConfigurations, serializeMachineModels, validateMachineModels, validateOrder, type EmployeeOption, type MachineModelEntry, type OrderRecord } from "./orderSchema";

export function OrderDialog({ row, readOnly, session, preparedByEmployees, reviewedByEmployees, machineModelOptions, employeesLoading, onClose, onSaved }: {
  row: OrderRecord; readOnly: boolean; session: Session; preparedByEmployees: EmployeeOption[]; reviewedByEmployees: EmployeeOption[]; machineModelOptions: string[]; employeesLoading: boolean; onClose: () => void; onSaved: () => void;
}) {
  const [form, setForm] = useState<OrderRecord>(row);
  const [machineModelEntries, setMachineModelEntries] = useState<MachineModelEntry[]>(() => parseMachineModels(row.machineModels, row.machineModelConfigurations, row.machineConfiguration));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const isDraft = Boolean(row.id) && row.status === "草稿";
  const hasBeam = String(form.machineModels ?? "").toUpperCase().includes("HC3300");
  const canSubmitForReview = session.authorities.includes("ROLE_SYSTEM_ADMIN")
    || session.authorities.includes("ORDER_REVIEW");
  const currentStatus = String(row.status ?? "");
  const workflowActions = availableOrderStatuses(session.authorities, currentStatus, false)
    .filter(status => status !== currentStatus)
    .map(status => ({ status, label: workflowActionLabel(currentStatus, status) }));
  const completedDateCanBeSet = Boolean(row.id)
    && ["生产中", "生产中（延误）"].includes(currentStatus);
  const showCompletedDate = completedDateCanBeSet
    || ["待出货", "已发货", "已结清", "完成"].includes(String(form.status ?? ""));

  function change(name: string, value: string | boolean | null) {
    setForm(current => {
      const next = { ...current, [name]: value };
      if (name === "machineModels" && !String(value).toUpperCase().includes("HC3300")) next.beamStyle = null;
      return next;
    });
    setErrors(current => ({ ...current, [name]: "" }));
    setError("");
  }

  function changeMachineModels(entries: MachineModelEntry[]) {
    setMachineModelEntries(entries);
    change("machineModels", serializeMachineModels(entries));
    change("machineModelConfigurations", serializeMachineModelConfigurations(entries));
  }

  async function save(action: "draft" | "create" = "draft") {
    if (saving) return;
    if (row.id && !isDraft) return;
    const machineModels = serializeMachineModels(machineModelEntries);
    const nextForm: OrderRecord = { ...form, machineModels, machineModelConfigurations: serializeMachineModelConfigurations(machineModelEntries) };
    const machineModelError = validateMachineModels(machineModelEntries);
    const nextErrors = { ...validateOrder(nextForm), ...(machineModelError ? { machineModels: machineModelError } : {}) };
    setForm(nextForm);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      showToast(Object.values(nextErrors).join("；"), "error");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const body = Object.fromEntries(orderFields.map(field => {
        const value = nextForm[field.name];
        return [field.name, typeof value === "string" ? value.trim() || null : value ?? null];
      }));
      body.machineModelConfigurations = nextForm.machineModelConfigurations ?? null;
      body.submitForReview = action === "create";
      await api(row.id ? `/orders/${row.id}` : "/orders", session, {
        method: row.id ? "PUT" : "POST", body: JSON.stringify(body),
      });
      showToast(action === "create" ? "订单已创建并提交审核" : row.id ? "草稿已保存" : "订单已保存为草稿", "success");
      onSaved();
    } catch (err) {
      const message = err instanceof Error ? err.message : "订单保存失败";
      setError(message);
      showToast(message, "error");
    } finally { setSaving(false); }
  }

  async function transition(status: string, label: string) {
    if (!row.id || saving) return;
    const needsCompletedDate = ["生产中", "生产中（延误）"].includes(currentStatus) && status === "待出货";
    if (needsCompletedDate && !form.completedDate) {
      const message = "请填写实际生产完成日期";
      setErrors({ completedDate: message });
      showToast(message, "error");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await api(`/orders/${row.id}/status`, session, {
        method: "PATCH",
        body: JSON.stringify({ status, completedDate: needsCompletedDate ? form.completedDate : null }),
      });
      showToast(`${label}成功`, "success");
      onSaved();
    } catch (err) {
      const message = err instanceof Error ? err.message : "订单状态更新失败";
      setError(message);
      showToast(message, "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open fullWidth maxWidth="lg" onClose={() => { if (!saving) onClose(); }}>
      <DialogTitle>{readOnly ? "订单详情" : isDraft ? "编辑草稿订单" : row.id ? "编辑订单" : "创建订单"}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3}>
            {orderSections.map(section => (
              <Box component="section" key={section.title}>
              <Typography variant="subtitle1" sx={{ mb: 1.5, fontWeight: 600 }}>{section.title}</Typography>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", md: "repeat(3, minmax(0, 1fr))" }, gap: 2 }}>
                {section.fields.filter(name => name !== "status"
                  && (name !== "completedDate" || showCompletedDate)
                  && (name !== "customRequirements" || form.customized === true)).map(name => {
                  const field = orderFields.find(item => item.name === name)!;
                  const value = form[name];
                  const disabled = saving || (name === "beamStyle" && !hasBeam);
                  const options = field.options;
                  const helperText = errors[name] || (name === "beamStyle" ? "仅限HC3300系列" : undefined);
                  const displayOnly = readOnly || (Boolean(row.id) && !isDraft && name !== "status" && !(name === "completedDate" && completedDateCanBeSet));
                  const isEmployeeField = name === "preparedBy" || name === "reviewedBy";
                  const employeeOptions = name === "preparedBy" ? preparedByEmployees : reviewedByEmployees;
                  const isSignatureField = section.title === "日期与签署" && isEmployeeField;
                  return (
                    <Box key={name} sx={{ minWidth: 0, gridColumn: field.multiline ? "1 / -1" : undefined, gridRow: isSignatureField ? 2 : undefined }}>
                      {name === "machineModels" ? (
                        <MachineModelsEditor entries={machineModelEntries} disabled={saving || displayOnly} readOnly={displayOnly}
                          error={errors[name]} options={machineModelOptions} onChange={changeMachineModels} />
                      ) : displayOnly ? (
                        <TextField fullWidth size="small" label={field.label}
                          value={field.type === "boolean" ? (value === true ? "是" : "否") : field.type === "date" && value ? dayjs(String(value)).format("YYYY年MM月DD日") : value ?? ""}
                          multiline={field.multiline} minRows={field.multiline ? 2 : undefined}
                          slotProps={{ input: { readOnly: true } }}
                        />
                      ) : field.type === "boolean" ? (
                        <FormControlLabel label={field.label} control={
                          <Switch checked={value === true} disabled={disabled} onChange={(_, checked) => change(name, checked)} />
                        } />
                      ) : field.type === "date" ? (
                        <DatePicker label={field.label} value={value ? dayjs(String(value)) : null}
                          format="YYYY年MM月DD日" disabled={disabled}
                          onChange={date => change(name, date?.format("YYYY-MM-DD") ?? null)}
                          slotProps={{ textField: { fullWidth: true, size: "small", required: field.required || (name === "completedDate" && completedDateCanBeSet), error: Boolean(errors[name]), helperText }, field: { clearable: !field.required } }}
                        />
                      ) : name === "voltage" ? (
                        <VoltageFields value={String(value ?? "")} disabled={disabled} error={errors[name]}
                          onChange={nextValue => change(name, nextValue)} />
                      ) : isEmployeeField ? (
                        <Autocomplete
                          fullWidth
                          options={employeeOptions}
                          loading={employeesLoading}
                          disabled={disabled}
                          value={employeeOptions.find(employee => employee.fullName === value) ?? (value ? { id: "", fullName: String(value) } : null)}
                          getOptionLabel={employee => employee.fullName}
                          isOptionEqualToValue={(option, selected) => option.fullName === selected.fullName}
                          onChange={(_, employee) => change(name, employee?.fullName ?? null)}
                          renderInput={params => (
                            <TextField {...params} size="small" label={field.label} required={field.required}
                              error={Boolean(errors[name])} helperText={errors[name]} />
                          )}
                        />
                      ) : (
                        <TextField fullWidth size="small" label={field.label}
                          value={value ?? ""} disabled={disabled} required={field.required || (name === "customRequirements" && form.customized === true)}
                          select={Boolean(options)} multiline={field.multiline} minRows={field.multiline ? 2 : undefined}
                          error={Boolean(errors[name])} helperText={helperText}
                          onChange={event => change(name, event.target.value)}
                          slotProps={{ htmlInput: { maxLength: field.maxLength }, select: { MenuProps: { slotProps: { paper: { sx: { maxHeight: 500 } } } } } }}
                        >
                          {options && <MenuItem value="">未选择</MenuItem>}
                          {options?.map(option => <MenuItem key={option} value={option}>{option}</MenuItem>)}
                        </TextField>
                      )}
                    </Box>
                  );
                })}
              </Box>
            </Box>
          ))}
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>{readOnly ? "关闭" : "取消"}</Button>
        {!readOnly && (row.id && !isDraft ? (
          workflowActions.map(action => <Button key={action.status} variant="contained" onClick={() => void transition(action.status, action.label)} disabled={saving}>
            {saving ? "处理中…" : action.label}
          </Button>)
        ) : <>
          <Button startIcon={<SaveIcon />} onClick={() => void save("draft")} disabled={saving}>保存为草稿</Button>
          <Button variant="contained" onClick={() => void save("create")} disabled={saving || !canSubmitForReview}>发布订单</Button>
        </>)}
      </DialogActions>
    </Dialog>
  );
}

function VoltageFields({ value, disabled, error, onChange }: { value: string; disabled: boolean; error?: string; onChange: (value: string | null) => void }) {
  const [voltage = "", frequency = ""] = value.match(/^(\d+)V\s+(\d+)HZ$/)?.slice(1) ?? [];

  function update(nextVoltage: string, nextFrequency: string) {
    onChange(nextVoltage || nextFrequency ? `${nextVoltage}V ${nextFrequency}HZ` : null);
  }

  return (
    <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 1 }}>
      <TextField fullWidth size="small" label="电压 (V)" type="number" value={voltage} disabled={disabled}
        error={Boolean(error)} helperText={error} slotProps={{ htmlInput: { min: 1, max: 9999, step: 1 } }}
        onChange={event => update(event.target.value, frequency)} />
      <TextField fullWidth size="small" label="频率 (HZ)" type="number" value={frequency} disabled={disabled}
        error={Boolean(error)} slotProps={{ htmlInput: { min: 1, max: 9999, step: 1 } }}
        onChange={event => update(voltage, event.target.value)} />
    </Box>
  );
}

function workflowActionLabel(currentStatus: string, nextStatus: string) {
  if (currentStatus === "待审核" && nextStatus === "生产中") return "审核完毕";
  if (currentStatus === "生产中" && nextStatus === "生产中（延误）") return "标记生产延误";
  if (currentStatus === "生产中（延误）" && nextStatus === "生产中") return "恢复生产";
  if (nextStatus === "待出货") return "生产完毕";
  if (nextStatus === "已发货") return "完成出货";
  if (nextStatus === "已结清") return "订单结清";
  if (nextStatus === "完成") return "完成订单";
  return "确认操作";
}

function MachineModelsEditor({ entries, disabled, readOnly = false, error, options, onChange }: {
  entries: MachineModelEntry[]; disabled: boolean; readOnly?: boolean; error?: string; options: string[]; onChange: (entries: MachineModelEntry[]) => void;
}) {
  function update(index: number, patch: Partial<MachineModelEntry>) {
    onChange(entries.map((entry, entryIndex) => entryIndex === index ? { ...entry, ...patch } : entry));
  }

  return (
    <Stack spacing={1}>
      <Typography component="span" variant="body2" sx={{ fontWeight: 500 }}>机型 *</Typography>
      {entries.map((entry, index) => (
        <Box key={index} sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" }, gap: 1, alignItems: "start", border: 1, borderColor: "divider", borderRadius: 1, p: 1.5 }}>
          <Box sx={{ display: "grid", gridTemplateColumns: "7fr 2fr 1fr", gap: 1, alignItems: "start" }}>
            <Autocomplete
              fullWidth
              options={[...new Set([...options, entry.model])].filter(model => Boolean(model) && (model === entry.model || !entries.some((other, otherIndex) => otherIndex !== index && other.model === model)))}
              disabled={disabled} value={entry.model || null}
              onChange={(_, model) => update(index, { model: model ?? "" })}
              renderInput={params => <TextField {...params} size="small" label="机型" error={Boolean(error)} />}
              slotProps={{ paper: { sx: { maxHeight: 500 } } }}
            />
            <TextField label="数量" type="number" size="small" disabled={disabled} value={entry.quantity}
              error={Boolean(error)} slotProps={{ htmlInput: { min: 1, step: 1 } }}
              onChange={event => update(index, { quantity: event.target.value === "" ? "" : Number(event.target.value) })}
            />
            <Tooltip title="删除机型">
              <span>
                <IconButton aria-label="删除机型" color="error" disabled={disabled || entries.length === 1}
                  onClick={() => onChange(entries.filter((_, entryIndex) => entryIndex !== index))}>
                  <DeleteIcon />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
          <TextField fullWidth size="small" label="机器配置" value={entry.configuration} multiline minRows={2}
            disabled={disabled} slotProps={readOnly ? { input: { readOnly: true } } : { htmlInput: { maxLength: 4000 } }}
            onChange={event => update(index, { configuration: event.target.value })} sx={{ gridColumn: "1 / -1" }} />
        </Box>
      ))}
      {error && <Typography color="error" variant="caption">{error}</Typography>}
      <Box>
        <Button size="small" startIcon={<AddIcon />} disabled={disabled}
          onClick={() => onChange([...entries, { model: "", quantity: 1, configuration: "" }])}>添加机型</Button>
      </Box>
    </Stack>
  );
}
