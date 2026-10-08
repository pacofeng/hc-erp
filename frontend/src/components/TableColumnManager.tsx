import { useMemo, useState } from "react";
import { Box, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, List, ListItem, ListItemIcon, ListItemText, Typography } from "@mui/material";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import type { GridColDef, GridColumnVisibilityModel } from "@mui/x-data-grid";

export function TableColumnManager({ open, onClose, columns, columnOrder, columnVisibilityModel, onColumnOrderChange, onColumnVisibilityModelChange }: {
  open: boolean;
  onClose: () => void;
  columns: GridColDef[];
  columnOrder: string[];
  columnVisibilityModel: GridColumnVisibilityModel;
  onColumnOrderChange: (order: string[]) => void;
  onColumnVisibilityModelChange: (model: GridColumnVisibilityModel) => void;
}) {
  const [draggedField, setDraggedField] = useState<string | null>(null);
  const orderedColumns = useMemo(() => order(columns, columnOrder), [columns, columnOrder]);

  function move(source: string, target: string) {
    if (source === target) return;
    const next = orderedColumns.map(column => column.field);
    const sourceIndex = next.indexOf(source);
    const targetIndex = next.indexOf(target);
    if (sourceIndex < 0 || targetIndex < 0) return;
    next.splice(sourceIndex, 1);
    next.splice(targetIndex, 0, source);
    onColumnOrderChange(next);
  }

  return <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>列设置</DialogTitle>
      <DialogContent dividers>
        <Typography variant="caption" color="text.secondary">拖拽调整顺序，勾选显示列</Typography>
        <Box sx={{ maxHeight: 450, overflowY: "auto", mt: 1 }}>
        <List disablePadding>
          {orderedColumns.map(column => {
            const visible = columnVisibilityModel[column.field] !== false;
            return <ListItem key={column.field} disableGutters draggable
              onDragStart={() => setDraggedField(column.field)}
              onDragOver={event => event.preventDefault()}
              onDrop={() => {
                if (draggedField) move(draggedField, column.field);
                setDraggedField(null);
              }}
              sx={{ cursor: "grab", borderBottom: 1, borderColor: "divider", "&:last-child": { borderBottom: 0 } }}
              secondaryAction={<Checkbox edge="end" checked={visible} onChange={event => onColumnVisibilityModelChange({ ...columnVisibilityModel, [column.field]: event.target.checked })} />}
            >
              <ListItemIcon sx={{ minWidth: 32 }}><DragIndicatorIcon color="action" /></ListItemIcon>
              <ListItemText primary={column.headerName ?? column.field} />
            </ListItem>;
          })}
        </List>
      </Box>
      </DialogContent>
      <DialogActions><Button onClick={onClose}>完成</Button></DialogActions>
    </Dialog>;
}

function order(columns: GridColDef[], savedOrder: string[]) {
  const positions = new Map(savedOrder.map((field, index) => [field, index]));
  return columns
    .map((column, index) => ({ column, index }))
    .sort((left, right) => (positions.get(left.column.field) ?? Number.MAX_SAFE_INTEGER) - (positions.get(right.column.field) ?? Number.MAX_SAFE_INTEGER) || left.index - right.index)
    .map(({ column }) => column);
}
