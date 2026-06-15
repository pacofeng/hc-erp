"use client";

import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

export type GridPaginationModel = {
  page: number;
  pageSize: number;
};

export type GridColDef = {
  field: string;
  headerName?: string;
  width?: number;
  minWidth?: number;
  flex?: number;
  sortable?: boolean;
  filterable?: boolean;
  disableColumnMenu?: boolean;
  align?: "right" | "left" | "center";
  headerAlign?: "right" | "left" | "center";
  renderHeader?: () => ReactNode;
  renderCell?: (params: { row: Record<string, unknown> }) => ReactNode;
};

export function DataGrid({
  rows,
  columns,
  loading,
  paginationModel,
  onPaginationModelChange,
  pageSizeOptions,
  getRowId,
}: {
  rows: Record<string, unknown>[];
  columns: GridColDef[];
  loading?: boolean;
  disableRowSelectionOnClick?: boolean;
  paginationModel: GridPaginationModel;
  onPaginationModelChange: (model: GridPaginationModel) => void;
  pageSizeOptions: number[];
  getRowId: (row: Record<string, unknown>) => string;
}) {
  const pageCount = Math.max(1, Math.ceil(rows.length / paginationModel.pageSize));
  const page = Math.min(paginationModel.page, pageCount - 1);
  const pageRows = rows.slice(
    page * paginationModel.pageSize,
    page * paginationModel.pageSize + paginationModel.pageSize,
  );

  function setPage(nextPage: number) {
    onPaginationModelChange({
      ...paginationModel,
      page: Math.min(Math.max(nextPage, 0), pageCount - 1),
    });
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full min-w-max border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-muted">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.field}
                  className={cn(
                    "border-b border-border px-3 py-2 text-left font-semibold",
                    column.headerAlign === "right" && "text-right",
                  )}
                  style={{ minWidth: column.minWidth, width: column.width }}
                >
                  {column.renderHeader ? column.renderHeader() : column.headerName}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 8 }).map((_, index) => (
                <tr key={index}>
                  <td colSpan={columns.length} className="border-b border-border px-3 py-3">
                    <div className="h-4 animate-pulse rounded bg-muted" />
                  </td>
                </tr>
              ))
            ) : pageRows.length ? (
              pageRows.map((row) => (
                <tr key={getRowId(row)} className="hover:bg-muted/50">
                  {columns.map((column) => (
                    <td
                      key={column.field}
                      className={cn(
                        "h-12 border-b border-border px-3 py-2 align-middle",
                        column.align === "right" && "text-right",
                      )}
                      style={{ minWidth: column.minWidth, width: column.width }}
                    >
                      {column.renderCell ? column.renderCell({ row }) : String(row[column.field] ?? "")}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-3 py-8 text-center text-muted-foreground">
                  No records
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border px-3 py-2 text-sm">
        <span className="text-muted-foreground">
          {rows.length ? page * paginationModel.pageSize + 1 : 0}-
          {Math.min((page + 1) * paginationModel.pageSize, rows.length)} / {rows.length}
        </span>
        <select
          className="h-8 rounded-md border border-border bg-white px-2"
          value={paginationModel.pageSize}
          onChange={(event) =>
            onPaginationModelChange({
              page: 0,
              pageSize: Number(event.target.value),
            })
          }
        >
          {pageSizeOptions.map((pageSize) => (
            <option key={pageSize} value={pageSize}>
              {pageSize}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="rounded-md border border-border px-2 py-1 disabled:opacity-50"
          disabled={page <= 0}
          onClick={() => setPage(page - 1)}
        >
          Prev
        </button>
        <span>
          {page + 1} / {pageCount}
        </span>
        <button
          type="button"
          className="rounded-md border border-border px-2 py-1 disabled:opacity-50"
          disabled={page >= pageCount - 1}
          onClick={() => setPage(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
