import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { zhCN } from "@mui/x-data-grid/locales";
import DeleteIcon from "@mui/icons-material/Delete";
import DoneIcon from "@mui/icons-material/Done";
import RefreshIcon from "@mui/icons-material/Refresh";
import dayjs from "dayjs";
import { api } from "../../app/apiClient";
import {
  NOTIFICATIONS_CHANGED_EVENT,
  pageSizeOptions,
} from "../../app/constants";
import { showToast } from "../../app/toast";
import { useTableColumnPreferences } from "../../app/useTableColumnPreferences";
import type { Session } from "../../app/types";
import { RowActionMenu } from "../../components/RowActionMenu";
import { TableColumnMenu } from "../../components/TableColumnMenu";
import { TableColumnManager } from "../../components/TableColumnManager";

type NotificationItem = {
  id: string;
  title: string;
  content: string;
  type: string;
  read: boolean;
  readAt: string | null;
  createdAt: string;
};

type NotificationPage = {
  content: NotificationItem[];
  totalElements: number;
};

export function NotificationCenter({ session }: { session: Session }) {
  const [rows, setRows] = useState<NotificationItem[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [pagination, setPagination] = useState({ page: 0, pageSize: 20 });
  const [pendingDelete, setPendingDelete] = useState<NotificationItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [columnManagerOpen, setColumnManagerOpen] = useState(false);
  const { columnVisibilityModel, columnOrder, onColumnVisibilityModelChange, onColumnOrderChange, orderColumns } = useTableColumnPreferences("notifications", session);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    api<NotificationPage>(
      `/notifications/all?page=${pagination.page}&size=${pagination.pageSize}`,
      session,
      { signal: controller.signal },
    )
      .then((data) => {
        if (controller.signal.aborted) return;
        setRows(data.content);
        setTotalRows(data.totalElements);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        const message = err instanceof Error ? err.message : "通知加载失败";
        setError(message);
        showToast(message, "error");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [session, pagination, revision]);

  useEffect(() => {
    const refresh = () => setRevision((current) => current + 1);
    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, refresh);
  }, []);

  async function markRead(notification: NotificationItem) {
    if (notification.read) return;
    try {
      const updated = await api<NotificationItem>(
        `/notifications/${notification.id}/read`,
        session,
        { method: "PATCH" },
      );
      setRows((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT));
      showToast("通知已标记为已读", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "通知更新失败", "error");
    }
  }

  async function remove() {
    if (!pendingDelete || deleting) return;
    setDeleting(true);
    try {
      await api(`/notifications/${pendingDelete.id}`, session, { method: "DELETE" });
      setPendingDelete(null);
      setRevision((current) => current + 1);
      window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT));
      showToast("通知删除成功", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "通知删除失败", "error");
    } finally {
      setDeleting(false);
    }
  }

  const columns: GridColDef<NotificationItem>[] = [
    { field: "title", headerName: "标题", minWidth: 180, flex: 0.7 },
    { field: "content", headerName: "内容", minWidth: 260, flex: 1.6 },
    {
      field: "read",
      headerName: "状态",
      minWidth: 110,
      renderCell: (params) => (
        <Chip
          size="small"
          label={params.value ? "已读" : "未读"}
          color={params.value ? "default" : "primary"}
        />
      ),
    },
    {
      field: "createdAt",
      headerName: "通知时间",
      width: 200,
      valueFormatter: (value) =>
        value ? dayjs(String(value)).format("YYYY年MM月DD日 HH:mm") : "—",
    },
    {
      field: "actions",
      headerName: "操作",
      width: 76,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      align: "right",
      headerAlign: "right",
      renderCell: (params) => (
        <Box sx={{ alignItems: "center", display: "flex", height: "100%", justifyContent: "flex-end" }}>
          <RowActionMenu actions={[
            ...(!params.row.read ? [{ label: "标记为已读", icon: <DoneIcon fontSize="small" />, onClick: () => void markRead(params.row) }] : []),
            { label: "删除", icon: <DeleteIcon fontSize="small" />, color: "error", onClick: () => setPendingDelete(params.row) },
          ]} ariaLabel="通知操作" />
        </Box>
      ),
    },
  ];
  const orderedColumns = orderColumns(columns);

  return (
    <Paper sx={{ minWidth: 0, overflow: "hidden" }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        sx={{ p: 2, alignItems: { sm: "center" } }}
      >
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            通知中心
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {totalRows} 条通知
          </Typography>
        </Box>
        <Tooltip title="刷新">
          <span>
            <IconButton
              aria-label="刷新通知"
              disabled={loading}
              onClick={() => setRevision((current) => current + 1)}
            >
              <RefreshIcon />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>
      {error && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" onClick={() => setRevision((current) => current + 1)}>
              重试
            </Button>
          }
        >
          {error}
        </Alert>
      )}
      <Box sx={{ height: "calc(100vh - 250px)", minHeight: 420 }}>
        <DataGrid
          rows={rows}
          columns={orderedColumns}
          slots={{ columnMenu: props => <TableColumnMenu {...props} onOpenColumnManager={() => setColumnManagerOpen(true)} /> }}
          columnVisibilityModel={columnVisibilityModel}
          onColumnVisibilityModelChange={onColumnVisibilityModelChange}
          loading={loading}
          disableRowSelectionOnClick
          paginationMode="server"
          rowCount={totalRows}
          paginationModel={pagination}
          onPaginationModelChange={setPagination}
          pageSizeOptions={pageSizeOptions.filter((size) => size <= 100)}
          localeText={zhCN.components.MuiDataGrid.defaultProps.localeText}
          slotProps={{ loadingOverlay: { variant: "skeleton", noRowsVariant: "skeleton" } }}
          sx={{ border: 0, "& .MuiDataGrid-columnHeaderTitle": { fontWeight: 400 } }}
        />
      </Box>
      <TableColumnManager open={columnManagerOpen} onClose={() => setColumnManagerOpen(false)} columns={columns} columnOrder={columnOrder}
        columnVisibilityModel={columnVisibilityModel} onColumnVisibilityModelChange={onColumnVisibilityModelChange}
        onColumnOrderChange={onColumnOrderChange} />
      <Dialog
        open={Boolean(pendingDelete)}
        onClose={() => {
          if (!deleting) setPendingDelete(null);
        }}
      >
        <DialogTitle>确认删除通知</DialogTitle>
        <DialogContent>
          <DialogContentText>
            确定删除通知「{pendingDelete?.title}」吗？删除后无法恢复。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button disabled={deleting} onClick={() => setPendingDelete(null)}>
            取消
          </Button>
          <Button color="error" variant="contained" disabled={deleting} onClick={() => void remove()}>
            删除
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
