import { useState, type MouseEvent, type ReactNode } from "react";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import { IconButton, ListItemIcon, Menu, MenuItem, Tooltip } from "@mui/material";

export type RowAction = {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  color?: "error";
};

export function RowActionMenu({ actions, ariaLabel = "更多操作" }: { actions: RowAction[]; ariaLabel?: string }) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  function open(event: MouseEvent<HTMLElement>) {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  }

  function close() {
    setAnchorEl(null);
  }

  return (
    <>
      <Tooltip title={ariaLabel}>
        <IconButton size="small" aria-label={ariaLabel} onClick={open}>
          <MoreHorizIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={close} onClick={event => event.stopPropagation()}>
        {actions.map(action => (
          <MenuItem key={action.label} onClick={() => { close(); action.onClick(); }} sx={action.color === "error" ? { color: "error.main" } : undefined}>
            <ListItemIcon sx={action.color === "error" ? { color: "error.main" } : undefined}>{action.icon}</ListItemIcon>
            {action.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
