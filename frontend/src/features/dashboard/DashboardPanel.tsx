import { useEffect, useRef, useState } from "react";
import { Alert, Box, Button, Chip, Collapse, IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Paper, Skeleton, Stack, TextField, Tooltip, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlineOutlined";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import GroupsIcon from "@mui/icons-material/Groups";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import PersonRemoveIcon from "@mui/icons-material/PersonRemove";
import DescriptionIcon from "@mui/icons-material/Description";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import CancelIcon from "@mui/icons-material/Cancel";
import { api } from "../../app/apiClient";
import { showToast } from "../../app/toast";
import type { Translation } from "../../app/i18n";
import type { Session } from "../../app/types";
import { resources } from "../../app/resources";

export function DashboardPanel({
  session,
  t,
  visibleResources,
  onNavigate,
}: {
  session: Session;
  t: Translation;
  visibleResources: Array<(typeof resources)[number]>;
  onNavigate: (resource: string, search?: string) => void;
}) {
  const [employeeSummary, setEmployeeSummary] = useState<EmployeeSummary | null>(null);
  const [employeeSummaryLoading, setEmployeeSummaryLoading] = useState(false);
  const [employeeSummaryError, setEmployeeSummaryError] = useState("");
  const [orderSummary, setOrderSummary] = useState<OrderSummary | null>(null);
  const [orderSummaryLoading, setOrderSummaryLoading] = useState(false);
  const [orderSummaryError, setOrderSummaryError] = useState("");
  const [orderSummaryPeriod, setOrderSummaryPeriod] = useState<OrderSummaryPeriod>("MONTH");
  const [dashboardPanels, setDashboardPanels] = useState<DashboardPanelPreferences>({ panels: [], collapsedPanels: [] });
  const [dashboardPreferencesReady, setDashboardPreferencesReady] = useState(false);
  const savedDashboardPreferences = useRef("");
  const [addPanelAnchor, setAddPanelAnchor] = useState<HTMLElement | null>(null);
  const [draggedPanel, setDraggedPanel] = useState<DashboardPanelKey | null>(null);
  const [dropTargetPanel, setDropTargetPanel] = useState<DashboardPanelKey | null>(null);
  const canViewEmployees = visibleResources.some(resource => resource.key === "employees");
  const canViewOrders = visibleResources.some(resource => resource.key === "orders");
  const permittedPanelKeys = ([
    ...(canViewEmployees ? ["employees"] : []),
    ...(canViewOrders ? ["orders"] : []),
  ] as DashboardPanelKey[]);
  const showEmployeePanel = dashboardPanels.panels.includes("employees") && canViewEmployees;
  const showOrderPanel = dashboardPanels.panels.includes("orders") && canViewOrders;
  const collapsedPanels = dashboardPanels.collapsedPanels;
  const addablePanels = dashboardPanelOptions.filter(panel => permittedPanelKeys.includes(panel.key) && !dashboardPanels.panels.includes(panel.key));
  const today = new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());

  useEffect(() => {
    const controller = new AbortController();
    setDashboardPreferencesReady(false);
    savedDashboardPreferences.current = "";
    api<DashboardPanelPreferences>("/dashboard/preferences", session, { signal: controller.signal })
      .then(preferences => {
        if (controller.signal.aborted) return;
        setDashboardPanels(preferences);
        savedDashboardPreferences.current = JSON.stringify(preferences);
        setDashboardPreferencesReady(true);
      })
      .catch(error => {
        if (!controller.signal.aborted) {
          showToast(error instanceof Error ? error.message : "无法加载仪表盘配置", "error");
        }
      });
    return () => controller.abort();
  }, [session.accountId]);

  useEffect(() => {
    if (!dashboardPreferencesReady) return;
    const serialized = JSON.stringify(dashboardPanels);
    if (serialized === savedDashboardPreferences.current) return;
    const timer = window.setTimeout(() => {
      void api("/dashboard/preferences", session, {
        method: "PUT",
        body: serialized,
      }).then(() => {
        savedDashboardPreferences.current = serialized;
      }).catch(error => {
        showToast(error instanceof Error ? error.message : "无法保存仪表盘配置", "error");
      });
    }, 250);
    return () => window.clearTimeout(timer);
  }, [dashboardPanels, dashboardPreferencesReady, session]);

  useEffect(() => {
    if (!showEmployeePanel || collapsedPanels.includes("employees")) return;
    const controller = new AbortController();
    setEmployeeSummaryLoading(true);
    setEmployeeSummaryError("");
    api<EmployeeSummary>("/employees/summary", session, { signal: controller.signal })
      .then(summary => { if (!controller.signal.aborted) setEmployeeSummary(summary); })
      .catch(error => {
        if (!controller.signal.aborted) setEmployeeSummaryError(error instanceof Error ? error.message : "无法加载员工概览");
      })
      .finally(() => { if (!controller.signal.aborted) setEmployeeSummaryLoading(false); });
    return () => controller.abort();
  }, [collapsedPanels, session, showEmployeePanel]);

  useEffect(() => {
    if (!showOrderPanel || collapsedPanels.includes("orders")) return;
    const controller = new AbortController();
    setOrderSummaryLoading(true);
    setOrderSummaryError("");
    api<OrderSummary>(`/orders/summary?period=${orderSummaryPeriod}`, session, { signal: controller.signal })
      .then(summary => { if (!controller.signal.aborted) setOrderSummary(summary); })
      .catch(error => {
        if (!controller.signal.aborted) setOrderSummaryError(error instanceof Error ? error.message : "无法加载订单状态概览");
      })
      .finally(() => { if (!controller.signal.aborted) setOrderSummaryLoading(false); });
    return () => controller.abort();
  }, [collapsedPanels, orderSummaryPeriod, session, showOrderPanel]);

  function addPanel(panel: DashboardPanelKey) {
    setDashboardPanels(current => ({ ...current, panels: [...current.panels, panel] }));
    setAddPanelAnchor(null);
  }

  function removePanel(panel: DashboardPanelKey) {
    setDashboardPanels(current => ({
      panels: current.panels.filter(item => item !== panel),
      collapsedPanels: current.collapsedPanels.filter(item => item !== panel),
    }));
  }

  function togglePanel(panel: DashboardPanelKey) {
    setDashboardPanels(current => ({
      ...current,
      collapsedPanels: current.collapsedPanels.includes(panel)
        ? current.collapsedPanels.filter(item => item !== panel)
        : [...current.collapsedPanels, panel],
    }));
  }

  function movePanel(target: DashboardPanelKey) {
    if (!draggedPanel || draggedPanel === target) return;
    setDashboardPanels(current => {
      const sourceIndex = current.panels.indexOf(draggedPanel);
      const targetIndex = current.panels.indexOf(target);
      const withoutDragged = current.panels.filter(panel => panel !== draggedPanel);
      const insertionIndex = withoutDragged.indexOf(target) + (sourceIndex < targetIndex ? 1 : 0);
      return {
        ...current,
        panels: [
          ...withoutDragged.slice(0, insertionIndex),
          draggedPanel,
          ...withoutDragged.slice(insertionIndex),
        ],
      };
    });
  }

  function finishDrag() {
    setDraggedPanel(null);
    setDropTargetPanel(null);
  }

  function navigateToEmployees(filters: Record<string, string>) {
    onNavigate("employees", `?${new URLSearchParams(filters).toString()}`);
  }

  function navigateToOrders(status: string) {
    const filters = new URLSearchParams({ status });
    const range = orderSummaryDateRange(orderSummaryPeriod);
    if (range) {
      filters.set("orderDateFrom", range.from);
      filters.set("orderDateTo", range.to);
    }
    onNavigate("orders", `?${filters.toString()}`);
  }

  return (
    <Stack spacing={2}>
      <Paper sx={{ p: 2.5 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          sx={{ alignItems: { sm: "center" } }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {t.dashboardTitle}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t.dashboardWelcome}, {session.username}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <Chip label={today} />
            <Button variant="outlined" size="small" startIcon={<AddIcon />} disabled={!dashboardPreferencesReady || !addablePanels.length}
              onClick={event => setAddPanelAnchor(event.currentTarget)}>添加面板</Button>
          </Stack>
        </Stack>
      </Paper>

      <Menu anchorEl={addPanelAnchor} open={Boolean(addPanelAnchor)} onClose={() => setAddPanelAnchor(null)}>
        {addablePanels.map(panel => <MenuItem key={panel.key} onClick={() => addPanel(panel.key)}>
          <ListItemIcon>{panel.icon}</ListItemIcon><ListItemText>{panel.label}</ListItemText>
        </MenuItem>)}
      </Menu>

      {showEmployeePanel && <DashboardWidget title="员工概览" collapsed={collapsedPanels.includes("employees")}
        order={dashboardPanels.panels.indexOf("employees")} dragging={draggedPanel === "employees"} dropTarget={dropTargetPanel === "employees"}
        onDragStart={() => setDraggedPanel("employees")} onDragOver={() => setDropTargetPanel("employees")}
        onDrop={() => movePanel("employees")} onDragEnd={finishDrag}
        onToggle={() => togglePanel("employees")} onRemove={() => removePanel("employees")}>
        {employeeSummaryLoading ? (
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" }, gap: 1.5 }}>
            {[1, 2, 3].map(item => <Skeleton key={item} variant="rounded" height={92} />)}
          </Box>
        ) : employeeSummaryError ? (
          <Alert severity="error">{employeeSummaryError}</Alert>
        ) : employeeSummary && <>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" }, gap: 1.5 }}>
            <SummaryMetric icon={<GroupsIcon color="primary" />} label="在职员工" value={employeeSummary.activeEmployees} onClick={() => navigateToEmployees({ status: "ACTIVE" })} />
            <SummaryMetric icon={<PersonAddIcon color="success" />} label="当月入职" value={employeeSummary.hiresThisMonth} onClick={() => navigateToEmployees(currentMonthDateRange("hireDate"))} />
            <SummaryMetric icon={<PersonRemoveIcon color="error" />} label="当月离职" value={employeeSummary.terminationsThisMonth} onClick={() => navigateToEmployees(currentMonthDateRange("terminationDate"))} />
          </Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 2.5, mb: 1 }}>各部门在职员工数</Typography>
          {employeeSummary.departmentCounts.length ? (
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", md: "repeat(3, minmax(0, 1fr))", lg: "repeat(6, minmax(0, 1fr))" }, gap: 1 }}>
              {employeeSummary.departmentCounts.map(item => (
                <Paper key={item.departmentName} variant="outlined" onClick={() => navigateToEmployees({ department: item.departmentName, status: "ACTIVE" })} sx={{ px: 1.5, py: 1, display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", "&:hover": { borderColor: "primary.main", bgcolor: "action.hover" } }}>
                  <Typography variant="body2">{item.departmentName}</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{item.employeeCount} 人</Typography>
                </Paper>
              ))}
            </Box>
          ) : <Typography variant="body2" color="text.secondary">暂无在职员工数据</Typography>}
        </>}
      </DashboardWidget>}

      {showOrderPanel && <DashboardWidget title="订单状态概览" collapsed={collapsedPanels.includes("orders")}
        order={dashboardPanels.panels.indexOf("orders")} dragging={draggedPanel === "orders"} dropTarget={dropTargetPanel === "orders"}
        onDragStart={() => setDraggedPanel("orders")} onDragOver={() => setDropTargetPanel("orders")}
        onDrop={() => movePanel("orders")} onDragEnd={finishDrag}
        onToggle={() => togglePanel("orders")} onRemove={() => removePanel("orders")}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: { sm: "center" }, mb: 1.5 }}>
          <Box sx={{ flex: 1 }} />
          <TextField select size="small" label="统计周期" value={orderSummaryPeriod}
            onChange={event => setOrderSummaryPeriod(event.target.value as OrderSummaryPeriod)} sx={{ minWidth: 130 }}>
            <MenuItem value="MONTH">本月</MenuItem>
            <MenuItem value="QUARTER">本季度</MenuItem>
            <MenuItem value="YEAR">本年</MenuItem>
            <MenuItem value="ALL">全部</MenuItem>
          </TextField>
        </Stack>
        {orderSummaryLoading ? (
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(4, minmax(0, 1fr))" }, gap: 1.5 }}>
            {[1, 2, 3, 4, 5, 6, 7].map(item => <Skeleton key={item} variant="rounded" height={92} />)}
          </Box>
        ) : orderSummaryError ? (
          <Alert severity="error">{orderSummaryError}</Alert>
        ) : orderSummary && <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(4, minmax(0, 1fr))" }, gap: 1.5 }}>
          <SummaryMetric icon={<AutorenewIcon color="warning" />} label="待审核" value={orderSummary.pendingReview} onClick={() => navigateToOrders("待审核")} />
          <SummaryMetric icon={<AutorenewIcon color="warning" />} label="生产中" value={orderSummary.inProduction} onClick={() => navigateToOrders("生产中")} />
          <SummaryMetric icon={<CancelIcon color="error" />} label="生产中（延误）" value={orderSummary.productionDelayed} onClick={() => navigateToOrders("生产中（延误）")} />
          <SummaryMetric icon={<TaskAltIcon color="success" />} label="待结清" value={orderSummary.readyToShip} onClick={() => navigateToOrders("待出货")} />
          <SummaryMetric icon={<DescriptionIcon color="primary" />} label="待出货" value={orderSummary.settled} onClick={() => navigateToOrders("已结清")} />
          <SummaryMetric icon={<DescriptionIcon color="primary" />} label="已发货" value={orderSummary.shipped} onClick={() => navigateToOrders("已发货")} />
          <SummaryMetric icon={<TaskAltIcon color="success" />} label="完成" value={orderSummary.completed} onClick={() => navigateToOrders("完成")} />
        </Box>}
      </DashboardWidget>}

    </Stack>
  );
}

type EmployeeSummary = {
  activeEmployees: number;
  hiresThisMonth: number;
  terminationsThisMonth: number;
  departmentCounts: Array<{ departmentName: string; employeeCount: number }>;
};

type OrderSummary = {
  pendingReview: number;
  inProduction: number;
  productionDelayed: number;
  readyToShip: number;
  settled: number;
  shipped: number;
  completed: number;
};

type OrderSummaryPeriod = "MONTH" | "QUARTER" | "YEAR" | "ALL";
type DashboardPanelKey = "employees" | "orders";
type DashboardPanelPreferences = {
  panels: DashboardPanelKey[];
  collapsedPanels: DashboardPanelKey[];
};

const dashboardPanelOptions: Array<{ key: DashboardPanelKey; label: string; icon: React.ReactNode }> = [
  { key: "employees", label: "员工概览", icon: <GroupsIcon fontSize="small" /> },
  { key: "orders", label: "订单状态概览", icon: <DescriptionIcon fontSize="small" /> },
];

function DashboardWidget({ title, collapsed, order, dragging, dropTarget, onDragStart, onDragOver, onDrop, onDragEnd, onToggle, onRemove, children }: {
  title: string; collapsed: boolean; order: number; dragging: boolean; dropTarget: boolean;
  onDragStart: () => void; onDragOver: () => void; onDrop: () => void; onDragEnd: () => void; onToggle: () => void; onRemove: () => void; children: React.ReactNode;
}) {
  function handleDragOver(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    onDragOver();
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    onDrop();
    onDragEnd();
  }

  return <Paper onDragOver={handleDragOver} onDrop={handleDrop} sx={{ p: 2.5, order: order + 1, opacity: dragging ? 0.55 : 1, outline: dropTarget && !dragging ? "2px dashed" : "none", outlineColor: "primary.main" }}>
    <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", mb: collapsed ? 0 : 1.5 }}>
      <Tooltip title="拖动排序">
        <Box component="span" draggable aria-label={`拖动${title}排序`} onDragStart={event => { event.dataTransfer.effectAllowed = "move"; onDragStart(); }} onDragEnd={onDragEnd}
          sx={{ display: "inline-flex", color: "text.secondary", cursor: "grab", "&:active": { cursor: "grabbing" } }}>
          <DragIndicatorIcon fontSize="small" />
        </Box>
      </Tooltip>
      <Typography variant="subtitle1" sx={{ flex: 1, fontWeight: 700 }}>{title}</Typography>
      <Tooltip title={collapsed ? "展开面板" : "收起面板"}>
        <IconButton aria-label={collapsed ? "展开面板" : "收起面板"} size="small" onClick={onToggle}>
          {collapsed ? <ExpandMoreIcon /> : <ExpandLessIcon />}
        </IconButton>
      </Tooltip>
      <Tooltip title="从仪表盘移除">
        <IconButton aria-label="从仪表盘移除" size="small" color="error" onClick={onRemove}><DeleteOutlineIcon /></IconButton>
      </Tooltip>
    </Stack>
    <Collapse in={!collapsed}>{children}</Collapse>
  </Paper>;
}

function SummaryMetric({ icon, label, value, onClick }: { icon: React.ReactNode; label: string; value: number; onClick: () => void }) {
  return <Paper variant="outlined" onClick={onClick} sx={{ p: 1.5, cursor: "pointer", "&:hover": { borderColor: "primary.main", bgcolor: "action.hover" } }}>
    <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
      {icon}
      <Box><Typography variant="body2" color="text.secondary">{label}</Typography><Typography variant="h5" sx={{ fontWeight: 700 }}>{value}</Typography></Box>
    </Stack>
  </Paper>;
}

function currentMonthDateRange(field: "hireDate" | "terminationDate") {
  const today = new Date();
  const from = new Date(today.getFullYear(), today.getMonth(), 1);
  const to = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return { [`${field}From`]: toDateInputValue(from), [`${field}To`]: toDateInputValue(to) };
}

function orderSummaryDateRange(period: OrderSummaryPeriod) {
  if (period === "ALL") return null;
  const today = new Date();
  const from = period === "MONTH"
    ? new Date(today.getFullYear(), today.getMonth(), 1)
    : period === "QUARTER"
      ? new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1)
      : new Date(today.getFullYear(), 0, 1);
  return { from: toDateInputValue(from), to: toDateInputValue(today) };
}

function toDateInputValue(date: Date) {
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return offsetDate.toISOString().slice(0, 10);
}
