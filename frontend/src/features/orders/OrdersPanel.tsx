import { useEffect, useMemo, useState } from "react";
import { Alert, Autocomplete, Box, Button, Checkbox, Chip, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, FormControlLabel, IconButton, InputAdornment, Paper, Stack, Tab, Tabs, TextField, Tooltip, Typography } from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { zhCN } from "@mui/x-data-grid/locales";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import dayjs from "dayjs";
import { api } from "../../app/apiClient";
import { pageSizeOptions } from "../../app/constants";
import { canUseResourceAction } from "../../app/resources";
import { showToast } from "../../app/toast";
import { useTableColumnPreferences } from "../../app/useTableColumnPreferences";
import type { Session } from "../../app/types";
import { OrderDialog } from "./OrderDialog";
import { formatOrderStatus, type EmployeeOption, type OrderRecord } from "./orderSchema";
import { RowActionMenu } from "../../components/RowActionMenu";
import { TableColumnMenu } from "../../components/TableColumnMenu";
import { TableColumnManager } from "../../components/TableColumnManager";

type OrderAssignees = {
  preparedBy: EmployeeOption[];
  reviewedBy: EmployeeOption[];
  currentPreparedBy: string | null;
};

type ProductOption = { id: string; name: string };

export function OrdersPanel({ session }: { session: Session }) {
  const [rows, setRows] = useState<OrderRecord[]>([]);
  const [machineModelOptions, setMachineModelOptions] = useState<string[]>([]);
  const [assignees, setAssignees] = useState<OrderAssignees>({ preparedBy: [], reviewedBy: [], currentPreparedBy: null });
  const [employeesLoading, setEmployeesLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [search, setSearch] = useState("");
  const [selectedMachineModels, setSelectedMachineModels] = useState<string[]>([]);
  const [scope, setScope] = useState<"published" | "drafts">("published");
  const [myPendingOnly, setMyPendingOnly] = useState(false);
  const [dashboardFilters, setDashboardFilters] = useState(() => new URLSearchParams(window.location.search));
  const [dialog, setDialog] = useState<{ row: OrderRecord; readOnly: boolean } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<OrderRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [pagination, setPagination] = useState({ page: 0, pageSize: 20 });
  const [columnManagerOpen, setColumnManagerOpen] = useState(false);
  const { columnVisibilityModel, columnOrder, onColumnVisibilityModelChange, onColumnOrderChange, orderColumns } = useTableColumnPreferences("orders", session);
  const canCreate = canUseResourceAction("orders", "create", session);
  const canEdit = canUseResourceAction("orders", "edit", session);
  const canDelete = canUseResourceAction("orders", "delete", session);
  const isOrderProcessor = session.authorities.includes("ROLE_ORDER_PROCESSOR");
  const canProcessAllOrders = session.authorities.includes("ROLE_SYSTEM_ADMIN")
    || session.authorities.includes("ROLE_ORDER_MANAGER");
  const canViewMyPending = canCreate || isOrderProcessor;

  useEffect(() => {
    if (!canCreate && scope === "drafts") setScope("published");
  }, [canCreate, scope]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    api<OrderRecord[]>(`/orders?scope=${scope}${scope === "published" && myPendingOnly ? "&filter=my-pending" : ""}`, session, { signal: controller.signal })
      .then(data => { if (!controller.signal.aborted) setRows(data); })
      .catch(err => {
        if (controller.signal.aborted) return;
        const message = err instanceof Error ? err.message : "订单加载失败";
        setError(message);
        showToast(message, "error");
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [session, revision, scope, myPendingOnly]);

  useEffect(() => {
    const controller = new AbortController();
    setEmployeesLoading(true);
    api<OrderAssignees>("/orders/assignees", session, { signal: controller.signal })
      .then(data => { if (!controller.signal.aborted) setAssignees(data); })
      .catch(err => {
        if (!controller.signal.aborted) {
          showToast(err instanceof Error ? err.message : "员工列表加载失败", "error");
        }
      })
      .finally(() => { if (!controller.signal.aborted) setEmployeesLoading(false); });
    return () => controller.abort();
  }, [session]);

  useEffect(() => {
    const controller = new AbortController();
    api<ProductOption[]>("/products/active", session, { signal: controller.signal })
      .then(products => {
        if (!controller.signal.aborted) setMachineModelOptions(products.map(product => product.name));
      })
      .catch(error => {
        if (!controller.signal.aborted) showToast(error instanceof Error ? error.message : "产品列表加载失败", "error");
      });
    return () => controller.abort();
  }, [session]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return rows.filter(row => {
      const matchesSearch = [row.contractNumber, row.customerName, row.machineModels, row.preparedBy]
        .some(value => String(value ?? "").toLocaleLowerCase().includes(query));
      const machineModels = String(row.machineModels ?? "");
      const matchesMachineModel = !selectedMachineModels.length
        || selectedMachineModels.some(model => machineModels.includes(`${model} (`));
      const matchesStatus = !dashboardFilters.get("status") || row.status === dashboardFilters.get("status");
      const orderDate = String(row.orderDate ?? "");
      const from = dashboardFilters.get("orderDateFrom");
      const to = dashboardFilters.get("orderDateTo");
      const matchesDateRange = (!from && !to) || (Boolean(orderDate) && (!from || orderDate >= from) && (!to || orderDate <= to));
      return matchesSearch && matchesMachineModel && matchesStatus && matchesDateRange;
    });
  }, [rows, search, selectedMachineModels, dashboardFilters]);

  useEffect(() => {
    setPagination(current => ({ ...current, page: Math.min(current.page, Math.max(0, Math.ceil(filteredRows.length / current.pageSize) - 1)) }));
  }, [filteredRows.length]);

  async function remove() {
    if (!pendingDelete?.id || deleting) return;
    setDeleting(true);
    try {
      await api(`/orders/${pendingDelete.id}`, session, { method: "DELETE" });
      setPendingDelete(null);
      setRevision(value => value + 1);
      showToast("订单删除成功", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "订单删除失败", "error");
    } finally { setDeleting(false); }
  }

  function clearDashboardFilters() {
    setDashboardFilters(new URLSearchParams());
    window.history.replaceState(null, "", window.location.pathname);
    setPagination(current => ({ ...current, page: 0 }));
  }

  const dashboardFilterLabel = orderDashboardFilterLabel(dashboardFilters);

  const columns: GridColDef[] = [
    { field: "contractNumber", headerName: "合同号", minWidth: 160, flex: 1 },
    { field: "customerName", headerName: "客户或代理", minWidth: 170, flex: 1 },
    { field: "machineModels", headerName: "机型", minWidth: 220, flex: 1.4 },
    ...(scope === "published" ? [{ field: "status", headerName: "订单状态", minWidth: 110, valueFormatter: value => formatOrderStatus(value) } satisfies GridColDef] : []),
    ...[["orderDate", "制单日期"]].map(([field, headerName]): GridColDef => ({
      field, headerName, minWidth: 150,
      valueFormatter: value => value ? dayjs(String(value)).format("YYYY年MM月DD日") : "—",
    })),
    { field: "preparedBy", headerName: "制单人", minWidth: 100 },
    { field: "reviewedBy", headerName: "审核", minWidth: 100 },
    { field: "actions", headerName: "操作", sortable: false, filterable: false, disableColumnMenu: true,
      width: 76, align: "right", headerAlign: "right", renderCell: params => (
        <Box sx={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
          <RowActionMenu actions={[
            { label: "查看", icon: <VisibilityIcon fontSize="small" />, onClick: () => setDialog({ row: params.row, readOnly: true }) },
            ...(canEdit && (!isOrderProcessor || canProcessAllOrders || (params.row.reviewedBy === assignees.currentPreparedBy && params.row.status !== "完成"))
              ? [{ label: "编辑", icon: <EditIcon fontSize="small" />, onClick: () => setDialog({ row: params.row, readOnly: false }) }]
              : []),
            ...(canDelete ? [{ label: "删除", icon: <DeleteIcon fontSize="small" />, color: "error" as const, onClick: () => setPendingDelete(params.row) }] : []),
          ]} />
        </Box>
      ),
    },
  ];
  const orderedColumns = orderColumns(columns);

  return (
    <Paper sx={{ minWidth: 0, overflow: "hidden" }}>
      <Tabs value={scope} onChange={(_, value: "published" | "drafts") => {
        setScope(value);
        setMyPendingOnly(false);
        setSearch("");
        setSelectedMachineModels([]);
        setPagination(current => ({ ...current, page: 0 }));
      }} sx={{ px: 2, borderBottom: 1, borderColor: "divider" }}>
        <Tab value="published" label="已发布订单" />
        {canCreate && <Tab value="drafts" label="我的草稿" />}
      </Tabs>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ p: 2, alignItems: { sm: "center" } }}>
        <Box sx={{ flex: 1 }}><Typography variant="h6" sx={{ fontWeight: 600 }}>订单管理</Typography><Typography variant="body2" color="text.secondary">{filteredRows.length} 条订单</Typography>{dashboardFilterLabel && <Chip size="small" label={dashboardFilterLabel} onDelete={clearDashboardFilters} sx={{ mt: 0.75 }} />}</Box>
        {scope === "published" && <>
          {canViewMyPending && <FormControlLabel sx={{ mr: 0, whiteSpace: "nowrap" }} label="我的待处理订单" control={<Checkbox size="small" checked={myPendingOnly} onChange={event => {
            setMyPendingOnly(event.target.checked);
            setPagination(current => ({ ...current, page: 0 }));
          }} />} />}
          <TextField size="small" label="搜索订单" value={search} onChange={event => { setSearch(event.target.value); setPagination(current => ({ ...current, page: 0 })); }}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }} />
          <Autocomplete multiple size="small" options={[...new Set([...machineModelOptions, ...selectedMachineModels])]} value={selectedMachineModels}
            onChange={(_, models) => { setSelectedMachineModels(models); setPagination(current => ({ ...current, page: 0 })); }}
            renderValue={(models, getItemProps) => <>
              <Chip {...getItemProps({ index: 0 })} label={models[0]} size="small" />
              {models.length > 1 && <Chip {...getItemProps({ index: 1 })} label={models[1]} size="small" />}
              {models.length > 2 && <Tooltip title={`其余已选机型：${models.slice(2).join("、")}`}>
                <Typography component="span" variant="caption" color="text.secondary">+{models.length - 2}</Typography>
              </Tooltip>}
            </>}
            renderInput={params => <TextField {...params} label="筛选机型" placeholder={selectedMachineModels.length ? "" : "选择机型"} />}
            slotProps={{ paper: { sx: { maxHeight: 500 } } }} sx={{ minWidth: { sm: 280 }, maxWidth: { sm: 420 }, "& .MuiAutocomplete-inputRoot": { flexWrap: "nowrap", overflow: "hidden" } }}
          />
          <Tooltip title="刷新"><span><IconButton aria-label="刷新订单" disabled={loading} onClick={() => setRevision(value => value + 1)}><RefreshIcon /></IconButton></span></Tooltip>
        </>}
        {canCreate && <Button variant="contained" startIcon={<AddIcon />} disabled={employeesLoading}
          onClick={() => setDialog({ row: { orderDate: dayjs().format("YYYY-MM-DD"), status: "草稿", preparedBy: assignees.currentPreparedBy ?? session.username, customized: false, photoBeforePacking: false }, readOnly: false })}>创建订单</Button>}
      </Stack>
      {error && <Alert severity="error" action={<Button color="inherit" onClick={() => setRevision(value => value + 1)}>重试</Button>}>{error}</Alert>}
      <Box sx={{ height: "calc(100vh - 250px)", minHeight: 420 }}>
        <DataGrid rows={filteredRows} columns={orderedColumns} loading={loading} disableRowSelectionOnClick
          slots={{ columnMenu: props => <TableColumnMenu {...props} onOpenColumnManager={() => setColumnManagerOpen(true)} /> }}
          columnVisibilityModel={columnVisibilityModel}
          onColumnVisibilityModelChange={onColumnVisibilityModelChange}
          localeText={zhCN.components.MuiDataGrid.defaultProps.localeText}
          paginationModel={pagination} onPaginationModelChange={setPagination}
          pageSizeOptions={pageSizeOptions.filter(size => size <= 100)}
          slotProps={{ loadingOverlay: { variant: "skeleton", noRowsVariant: "skeleton" } }}
          sx={{ border: 0, "& .MuiDataGrid-columnHeaderTitle": { fontWeight: 400 } }} />
      </Box>
      <TableColumnManager open={columnManagerOpen} onClose={() => setColumnManagerOpen(false)} columns={columns} columnOrder={columnOrder}
        columnVisibilityModel={columnVisibilityModel} onColumnVisibilityModelChange={onColumnVisibilityModelChange}
        onColumnOrderChange={onColumnOrderChange} />
      {dialog && <OrderDialog row={dialog.row} readOnly={dialog.readOnly} session={session}
        preparedByEmployees={assignees.preparedBy} reviewedByEmployees={assignees.reviewedBy} machineModelOptions={machineModelOptions} employeesLoading={employeesLoading}
        onClose={() => setDialog(null)} onSaved={() => { setDialog(null); setRevision(value => value + 1); }} />}
      <Dialog open={Boolean(pendingDelete)} onClose={() => { if (!deleting) setPendingDelete(null); }}>
        <DialogTitle>确认删除订单</DialogTitle>
        <DialogContent><DialogContentText>确定删除合同号为「{pendingDelete?.contractNumber}」的订单吗？删除后无法恢复。</DialogContentText></DialogContent>
        <DialogActions><Button disabled={deleting} onClick={() => setPendingDelete(null)}>取消</Button><Button color="error" variant="contained" disabled={deleting} onClick={remove}>删除</Button></DialogActions>
      </Dialog>
    </Paper>
  );
}

function orderDashboardFilterLabel(filters: URLSearchParams) {
  const status = filters.get("status");
  if (!status) return "";
  const displayStatus = status === "待出货" ? "待结清" : status === "已结清" ? "待出货" : status;
  return `概览筛选：${displayStatus}`;
}
