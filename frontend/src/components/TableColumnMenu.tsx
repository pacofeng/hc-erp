import type { ComponentProps, MouseEvent } from "react";
import { Divider, ListSubheader, MenuItem, ListItemIcon, ListItemText } from "@mui/material";
import ViewColumnIcon from "@mui/icons-material/ViewColumn";
import { GridColumnMenu } from "@mui/x-data-grid";

type GridColumnMenuProps = ComponentProps<typeof GridColumnMenu>;

export function TableColumnMenu({ onOpenColumnManager, ...props }: GridColumnMenuProps & { onOpenColumnManager: () => void }) {
  return <GridColumnMenu {...props}
    slots={{
      columnMenuTableSettingsItem: ({ onClick }: { onClick: (event: MouseEvent<HTMLElement>) => void }) => <>
        <ListSubheader disableSticky>列设置</ListSubheader>
        <Divider />
        <MenuItem onClick={event => {
          onClick(event);
          onOpenColumnManager();
        }}>
          <ListItemIcon><ViewColumnIcon fontSize="small" /></ListItemIcon>
          <ListItemText>显示、隐藏和排序列</ListItemText>
        </MenuItem>
      </>,
    }}
    slotProps={{ columnMenuTableSettingsItem: { displayOrder: 40 } }}
  />;
}
