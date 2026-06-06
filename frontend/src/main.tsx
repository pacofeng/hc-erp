import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  AppBar,
  Box,
  Button,
  Chip,
  CssBaseline,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
  createTheme,
  ThemeProvider
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import LogoutIcon from '@mui/icons-material/Logout';
import RefreshIcon from '@mui/icons-material/Refresh';
import SaveIcon from '@mui/icons-material/Save';
import SecurityIcon from '@mui/icons-material/Security';
import WorkIcon from '@mui/icons-material/Work';

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8080/api';

type AnyRow = Record<string, unknown> & { id?: string };
type Session = { token: string; username: string; authorities: string[] };

const resources = [
  { key: 'employees', label: 'Employees', icon: <WorkIcon fontSize="small" /> },
  { key: 'departments', label: 'Departments', icon: <WorkIcon fontSize="small" /> },
  { key: 'accounts', label: 'Accounts', icon: <SecurityIcon fontSize="small" /> },
  { key: 'roles', label: 'Roles', icon: <SecurityIcon fontSize="small" /> },
  { key: 'permissions', label: 'Permissions', icon: <SecurityIcon fontSize="small" /> }
] as const;

const schemas: Record<string, { label: string; fields: Field[] }> = {
  employees: {
    label: 'Employees',
    fields: [
      { name: 'employeeNo', label: 'Employee No', required: true },
      { name: 'firstName', label: 'First Name', required: true },
      { name: 'lastName', label: 'Last Name', required: true },
      { name: 'gender', label: 'Gender', options: ['MALE', 'FEMALE'] },
      { name: 'displayName', label: 'Display Name' },
      { name: 'phone', label: 'Phone' },
      { name: 'departmentId', label: 'Department ID' },
      { name: 'managerId', label: 'Manager ID' },
      { name: 'jobTitle', label: 'Job Title' },
      { name: 'hireDate', label: 'Hire Date', type: 'date' },
      { name: 'terminationDate', label: 'Termination Date', type: 'date' },
      { name: 'status', label: 'Status', options: ['ACTIVE', 'TERMINATED'] }
    ]
  },
  departments: {
    label: 'Departments',
    fields: [
      { name: 'code', label: 'Code', options: ['ADMIN', 'HR'] },
      { name: 'name', label: 'Name', required: true },
      { name: 'managerId', label: 'Manager ID' },
      { name: 'status', label: 'Status', options: ['ACTIVE', 'INACTIVE'] }
    ]
  },
  accounts: {
    label: 'Accounts',
    fields: [
      { name: 'employeeId', label: 'Employee ID' },
      { name: 'username', label: 'Username', required: true },
      { name: 'password', label: 'Password', type: 'password' },
      { name: 'status', label: 'Status', options: ['ACTIVE', 'LOCKED', 'TERMINATED'] },
      { name: 'accountType', label: 'Type', options: ['USER', 'SYSTEM'] },
      { name: 'mustChangePassword', label: 'Must Change Password', options: ['false', 'true'] }
    ]
  },
  roles: {
    label: 'Roles',
    fields: [
      { name: 'name', label: 'Name', required: true },
      { name: 'code', label: 'Code', options: ['SYSTEM_ADMIN', 'HR_MANAGER', 'HR_OFFICE'] },
      { name: 'status', label: 'Status', options: ['ACTIVE', 'INACTIVE'] },
      { name: 'description', label: 'Description' }
    ]
  },
  permissions: {
    label: 'Permissions',
    fields: [
      { name: 'code', label: 'Code', options: ['EMPLOYEE_VIEW', 'EMPLOYEE_CREATE', 'EMPLOYEE_EDIT', 'EMPLOYEE_DELETE'] },
      { name: 'name', label: 'Name', required: true },
      { name: 'description', label: 'Description' },
      { name: 'moduleCode', label: 'Module', options: ['EMPLOYEE'] }
    ]
  }
};

type Field = {
  name: string;
  label: string;
  required?: boolean;
  type?: 'text' | 'date' | 'password';
  options?: string[];
};

function authHeaders(session: Session) {
  return { Authorization: `Bearer ${session.token}`, 'Content-Type': 'application/json' };
}

async function api<T>(path: string, session?: Session, init: RequestInit = {}): Promise<T> {
  const headers = session ? authHeaders(session) : { 'Content-Type': 'application/json' };
  const response = await fetch(`${API_BASE}${path}`, { ...init, headers: { ...headers, ...init.headers } });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message ?? `Request failed: ${response.status}`);
  }
  if (response.status === 204) return undefined as T;
  return response.json();
}

function App() {
  const [session, setSession] = useState<Session | null>(() => {
    const raw = localStorage.getItem('hcerp-session');
    return raw ? JSON.parse(raw) : null;
  });

  const theme = useMemo(() => createTheme({
    palette: {
      mode: 'light',
      primary: { main: '#285c52' },
      secondary: { main: '#7c3f58' },
      background: { default: '#f7f8f5' }
    },
    shape: { borderRadius: 6 },
    typography: { fontFamily: 'Inter, Arial, sans-serif' },
    components: {
      MuiButton: { styleOverrides: { root: { textTransform: 'none', fontWeight: 600 } } },
      MuiTableCell: { styleOverrides: { head: { fontWeight: 700, backgroundColor: '#eef2ed' } } }
    }
  }), []);

  function saveSession(next: Session | null) {
    setSession(next);
    if (next) localStorage.setItem('hcerp-session', JSON.stringify(next));
    else localStorage.removeItem('hcerp-session');
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {session ? <Shell session={session} onLogout={() => saveSession(null)} /> : <Login onLogin={saveSession} />}
    </ThemeProvider>
  );
}

function Login({ onLogin }: { onLogin: (session: Session) => void }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    try {
      const result = await api<Session>('/auth/login', undefined, {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });
      onLogin(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', px: 2 }}>
      <Paper component="form" onSubmit={submit} sx={{ width: '100%', maxWidth: 420, p: 3 }}>
        <Stack spacing={2.5}>
          <Box>
            <Typography variant="h5" fontWeight={700}>HC ERP</Typography>
            <Typography variant="body2" color="text.secondary">Sign in to manage employees, access, and HR master data.</Typography>
          </Box>
          <TextField label="Username" value={username} onChange={(event) => setUsername(event.target.value)} required />
          <TextField label="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          {error && <Typography color="error" variant="body2">{error}</Typography>}
          <Button type="submit" variant="contained" startIcon={<SecurityIcon />}>Sign in</Button>
        </Stack>
      </Paper>
    </Box>
  );
}

function Shell({ session, onLogout }: { session: Session; onLogout: () => void }) {
  const [resource, setResource] = useState('employees');

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: '1px solid #dde3dc' }}>
        <Toolbar>
          <Typography variant="h6" fontWeight={700} sx={{ flex: 1 }}>HC ERP</Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip label={session.username} size="small" />
            <Tooltip title="Sign out">
              <IconButton onClick={onLogout}><LogoutIcon /></IconButton>
            </Tooltip>
          </Stack>
        </Toolbar>
      </AppBar>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '220px 1fr' }, gap: 2, p: 2 }}>
        <Paper sx={{ p: 1, alignSelf: 'start' }}>
          {resources.map((item) => (
            <Button
              key={item.key}
              fullWidth
              startIcon={item.icon}
              variant={resource === item.key ? 'contained' : 'text'}
              onClick={() => setResource(item.key)}
              sx={{ justifyContent: 'flex-start', mb: 0.5 }}
            >
              {item.label}
            </Button>
          ))}
        </Paper>
        <ResourcePanel key={resource} resource={resource} session={session} />
      </Box>
    </Box>
  );
}

function ResourcePanel({ resource, session }: { resource: string; session: Session }) {
  const schema = schemas[resource];
  const [rows, setRows] = useState<AnyRow[]>([]);
  const [editing, setEditing] = useState<AnyRow | null>(null);
  const [error, setError] = useState('');

  async function load() {
    setError('');
    try {
      setRows(await api<AnyRow[]>(`/${resource}`, session));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load data');
    }
  }

  useEffect(() => { void load(); }, [resource]);

  async function remove(id?: string) {
    if (!id) return;
    await api<void>(`/${resource}/${id}`, session, { method: 'DELETE' });
    await load();
  }

  const columns = Array.from(new Set(rows.flatMap((row) => Object.keys(row))))
    .filter((column) => !['passwordHash', 'deletedAt'].includes(column))
    .slice(0, 9);

  return (
    <Paper sx={{ overflow: 'hidden' }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }} sx={{ p: 2 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" fontWeight={700}>{schema.label}</Typography>
          <Typography variant="body2" color="text.secondary">{rows.length} records</Typography>
        </Box>
        <Tooltip title="Refresh">
          <IconButton onClick={load}><RefreshIcon /></IconButton>
        </Tooltip>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setEditing(defaultRow(schema.fields))}>New</Button>
      </Stack>
      <Divider />
      {error && <Typography color="error" sx={{ px: 2, py: 1 }}>{error}</Typography>}
      <TableContainer sx={{ maxHeight: 'calc(100vh - 230px)' }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              {columns.map((column) => <TableCell key={column}>{labelize(column)}</TableCell>)}
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow hover key={row.id}>
                {columns.map((column) => (
                  <TableCell key={column} sx={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {String(row[column] ?? '')}
                  </TableCell>
                ))}
                <TableCell align="right">
                  <Tooltip title="Edit">
                    <IconButton size="small" onClick={() => setEditing(row)}><EditIcon fontSize="small" /></IconButton>
                  </Tooltip>
                  {resource === 'accounts' && <AssignmentButton type="account" row={row} session={session} />}
                  {resource === 'roles' && <AssignmentButton type="role" row={row} session={session} />}
                  <Tooltip title="Delete">
                    <IconButton size="small" onClick={() => remove(row.id)}><DeleteIcon fontSize="small" /></IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {editing && (
        <EditDialog
          resource={resource}
          schema={schema}
          row={editing}
          session={session}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); void load(); }}
        />
      )}
    </Paper>
  );
}

function EditDialog({ resource, schema, row, session, onClose, onSaved }: {
  resource: string;
  schema: { label: string; fields: Field[] };
  row: AnyRow;
  session: Session;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<AnyRow>(row);
  const [error, setError] = useState('');

  async function save() {
    setError('');
    const body = Object.fromEntries(schema.fields.map((field) => {
      const value = form[field.name];
      if (field.name === 'mustChangePassword') return [field.name, value === true || value === 'true'];
      return [field.name, value === '' ? null : value];
    }));
    try {
      await api(`/${resource}${row.id ? `/${row.id}` : ''}`, session, {
        method: row.id ? 'PUT' : 'POST',
        body: JSON.stringify(body)
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    }
  }

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{row.id ? 'Edit' : 'Create'} {schema.label.slice(0, -1)}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {schema.fields.map((field) => field.options ? (
            <FormControl key={field.name} fullWidth>
              <InputLabel>{field.label}</InputLabel>
              <Select
                label={field.label}
                value={String(form[field.name] ?? field.options[0] ?? '')}
                onChange={(event) => setForm({ ...form, [field.name]: event.target.value })}
              >
                {field.options.map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}
              </Select>
            </FormControl>
          ) : (
            <TextField
              key={field.name}
              label={field.label}
              type={field.type ?? 'text'}
              required={field.required}
              value={String(form[field.name] ?? '')}
              onChange={(event) => setForm({ ...form, [field.name]: event.target.value })}
              InputLabelProps={field.type === 'date' ? { shrink: true } : undefined}
            />
          ))}
          {error && <Typography color="error" variant="body2">{error}</Typography>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={save} variant="contained" startIcon={<SaveIcon />}>Save</Button>
      </DialogActions>
    </Dialog>
  );
}

function AssignmentButton({ type, row, session }: { type: 'account' | 'role'; row: AnyRow; session: Session }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Tooltip title={type === 'account' ? 'Assign roles' : 'Assign permissions'}>
        <IconButton size="small" onClick={() => setOpen(true)}><SecurityIcon fontSize="small" /></IconButton>
      </Tooltip>
      {open && <AssignmentDialog type={type} row={row} session={session} onClose={() => setOpen(false)} />}
    </>
  );
}

function AssignmentDialog({ type, row, session, onClose }: { type: 'account' | 'role'; row: AnyRow; session: Session; onClose: () => void }) {
  const target = type === 'account' ? 'roles' : 'permissions';
  const [items, setItems] = useState<AnyRow[]>([]);
  const [links, setLinks] = useState<AnyRow[]>([]);
  const targetIdKey = type === 'account' ? 'roleId' : 'permissionId';

  async function load() {
    const [all, assigned] = await Promise.all([
      api<AnyRow[]>(`/${target}`, session),
      api<AnyRow[]>(type === 'account' ? `/assignments/accounts/${row.id}/roles` : `/assignments/roles/${row.id}/permissions`, session)
    ]);
    setItems(all);
    setLinks(assigned);
  }

  useEffect(() => { void load(); }, []);

  async function toggle(item: AnyRow, checked: boolean) {
    const path = type === 'account'
      ? `/assignments/accounts/${row.id}/roles/${item.id}`
      : `/assignments/roles/${row.id}/permissions/${item.id}`;
    await api(path, session, { method: checked ? 'DELETE' : 'POST' });
    await load();
  }

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{type === 'account' ? 'Account Roles' : 'Role Permissions'}</DialogTitle>
      <DialogContent>
        <Stack spacing={1} sx={{ pt: 1 }}>
          {items.map((item) => {
            const checked = links.some((link) => link[targetIdKey] === item.id);
            return (
              <Button
                key={item.id}
                variant={checked ? 'contained' : 'outlined'}
                onClick={() => toggle(item, checked)}
                sx={{ justifyContent: 'space-between' }}
              >
                <span>{String(item.name ?? item.code)}</span>
                <span>{checked ? 'Assigned' : 'Available'}</span>
              </Button>
            );
          })}
        </Stack>
      </DialogContent>
      <DialogActions><Button onClick={onClose}>Close</Button></DialogActions>
    </Dialog>
  );
}

function defaultRow(fields: Field[]): AnyRow {
  return Object.fromEntries(fields.map((field) => [field.name, field.options?.[0] ?? '']));
}

function labelize(key: string) {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, (match) => match.toUpperCase());
}

createRoot(document.getElementById('root')!).render(<App />);
