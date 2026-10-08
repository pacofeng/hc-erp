import { useEffect, useRef, useState } from "react";
import type { GridColDef, GridColumnVisibilityModel } from "@mui/x-data-grid";
import { api } from "./apiClient";
import { showToast } from "./toast";
import type { Session } from "./types";

type TablePreferences = {
  columnVisibility: Record<string, GridColumnVisibilityModel>;
  columnOrder: Record<string, string[]>;
};

function hiddenColumns(model: GridColumnVisibilityModel): GridColumnVisibilityModel {
  return Object.fromEntries(Object.entries(model).filter(([, visible]) => visible === false));
}

export function useTableColumnPreferences(table: string, session: Session) {
  const [preferences, setPreferences] = useState<TablePreferences>({ columnVisibility: {}, columnOrder: {} });
  const [ready, setReady] = useState(false);
  const lastSaved = useRef("");

  useEffect(() => {
    const controller = new AbortController();
    setReady(false);
    api<TablePreferences>("/table-preferences", session, { signal: controller.signal })
      .then((value) => {
        if (controller.signal.aborted) return;
        const next = { columnVisibility: value.columnVisibility ?? {}, columnOrder: value.columnOrder ?? {} };
        setPreferences(next);
        lastSaved.current = JSON.stringify(next);
        setReady(true);
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setPreferences({ columnVisibility: {}, columnOrder: {} });
          lastSaved.current = JSON.stringify({ columnVisibility: {}, columnOrder: {} });
          setReady(true);
        }
      });
    return () => controller.abort();
  }, [session.token]);

  useEffect(() => {
    if (!ready) return;
    const serialized = JSON.stringify(preferences);
    if (serialized === lastSaved.current) return;
    const timer = window.setTimeout(() => {
      void api<TablePreferences>("/table-preferences", session, {
        method: "PUT",
        body: serialized,
      })
        .then((value) => {
          lastSaved.current = JSON.stringify(value);
          setPreferences({ columnVisibility: value.columnVisibility ?? {}, columnOrder: value.columnOrder ?? {} });
        })
        .catch((error) => {
          showToast(error instanceof Error ? error.message : "保存表格列配置失败", "error");
        });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [preferences, ready, session]);

  return {
    columnVisibilityModel: preferences.columnVisibility[table] ?? {},
    columnOrder: preferences.columnOrder[table] ?? [],
    orderColumns: <Column extends GridColDef>(columns: Column[]) => orderColumns(columns, preferences.columnOrder[table] ?? []),
    onColumnVisibilityModelChange: (model: GridColumnVisibilityModel) => {
      setPreferences((current) => ({
        ...current,
        columnVisibility: {
          ...current.columnVisibility,
          [table]: hiddenColumns(model),
        },
      }));
    },
    onColumnOrderChange: (order: string[]) => {
      setPreferences((current) => ({
        ...current,
        columnOrder: {
          ...current.columnOrder,
          [table]: [...new Set(order)],
        },
      }));
    },
  };
}

function orderColumns<Column extends GridColDef>(columns: Column[], order: string[]) {
  const positions = new Map(order.map((field, index) => [field, index]));
  return columns
    .map((column, index) => ({ column, index }))
    .sort((left, right) => (positions.get(left.column.field) ?? Number.MAX_SAFE_INTEGER) - (positions.get(right.column.field) ?? Number.MAX_SAFE_INTEGER) || left.index - right.index)
    .map(({ column }) => column);
}
