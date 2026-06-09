import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  AppBar,
  Autocomplete,
  Box,
  Button,
  Checkbox,
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
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Stack,
  TableSortLabel,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
  createTheme,
  ThemeProvider
} from '@mui/material';
import { DataGrid, type GridColDef, type GridPaginationModel } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import BadgeIcon from '@mui/icons-material/Badge';
import BusinessIcon from '@mui/icons-material/Business';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import LogoutIcon from '@mui/icons-material/Logout';
import RefreshIcon from '@mui/icons-material/Refresh';
import SaveIcon from '@mui/icons-material/Save';
import SecurityIcon from '@mui/icons-material/Security';
import SettingsIcon from '@mui/icons-material/Settings';
import VpnKeyIcon from '@mui/icons-material/VpnKey';

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8080/api';
const LOGO_SRC = '/images/logo.png';

type AnyRow = Record<string, unknown> & { id?: string };
type Language = 'en' | 'zh-CN';
type Session = { token: string; username: string; authorities: string[]; language?: Language };
type ReferenceData = {
  departments: AnyRow[];
  employees: AnyRow[];
  accounts: AnyRow[];
};
type SortState = { column: string; direction: 'asc' | 'desc' } | null;
type AssignmentType = 'account' | 'role';
type AssignmentState = { type: AssignmentType; originalIds: string[]; selectedIds: string[] };

const messages = {
  en: {
    signInSubtitle: 'Sign in to manage employees, access, and HR master data.',
    username: 'Username',
    password: 'Password',
    signIn: 'Sign in',
    signOut: 'Sign out',
    language: 'Language',
    english: 'English',
    simplifiedChinese: 'Simplified Chinese',
    records: 'records',
    refresh: 'Refresh',
    new: 'New',
    actions: 'Actions',
    edit: 'Edit',
    create: 'Create',
    cancel: 'Cancel',
    save: 'Save',
    close: 'Close',
    add: 'Add',
    remove: 'Remove',
    delete: 'Delete',
    confirmDeleteTitle: 'Confirm delete',
    confirmDeleteMessage: 'Are you sure you want to delete this record?',
    associatedAccount: 'Associated account',
    employeeAccountDeleteWarning: 'The associated account will also be deleted.',
    assignRoles: 'Assign roles',
    assignPermissions: 'Assign permissions',
    accountRoles: 'Account Roles',
    rolePermissions: 'Role Permissions',
    assigned: 'Assigned',
    available: 'Available',
    loginFailed: 'Login failed',
    loadFailed: 'Unable to load data',
    saveFailed: 'Save failed',
    deleteFailed: 'Delete failed',
    passwordRequired: 'Password is required for new accounts',
    saved: 'Saved',
    page: 'Page',
    of: 'of',
    newEmployee: 'New Employee',
    updateEmployee: 'Update Employee',
    personalInfo: 'Personal Info',
    emergencyContact: 'Emergency Contact',
    employmentInfo: 'Employment Info',
    resources: {
      employees: 'Employees',
      departments: 'Departments',
      accounts: 'Accounts',
      roles: 'Roles',
      permissions: 'Permissions',
      settings: 'Settings'
    },
    fields: {
      employeeNo: 'Employee No',
      fullName: 'Full Name',
      gender: 'Gender',
      dateOfBirth: 'Date of Birth',
      marriedStatus: 'Marital Status',
      address: 'Address',
      phone: 'Phone',
      departmentName: 'Department',
      managerName: 'Manager',
      departmentId: 'Department',
      managerId: 'Manager',
      jobTitle: 'Job Title',
      hireDate: 'Hire Date',
      terminationDate: 'Termination Date',
      status: 'Status',
      code: 'Code',
      name: 'Name',
      relation: 'Relation',
      employeeId: 'Employee',
      accountType: 'Type',
      mustChangePassword: 'Must Change Password',
      preferredLanguage: 'Preferred Language',
      description: 'Description',
      moduleCode: 'Module',
      createdAt: 'Created At',
      updatedAt: 'Updated At',
      passwordChangedAt: 'Password Changed At',
      lastLoginAt: 'Last Login At',
      'emergencyContact.fullName': 'Emergency Contact Full Name',
      'emergencyContact.phone': 'Emergency Contact Phone',
      'emergencyContact.relation': 'Emergency Contact Relation'
    }
  },
  'zh-CN': {
    signInSubtitle: '登录以管理员工、账号权限和人力资源基础资料。',
    username: '用户名',
    password: '密码',
    signIn: '登录',
    signOut: '退出登录',
    language: '语言',
    english: '英文',
    simplifiedChinese: '简体中文',
    records: '条记录',
    refresh: '刷新',
    new: '新增',
    actions: '操作',
    edit: '编辑',
    create: '创建',
    cancel: '取消',
    save: '保存',
    close: '关闭',
    add: '添加',
    remove: '移除',
    delete: '删除',
    confirmDeleteTitle: '确认删除',
    confirmDeleteMessage: '确定要删除这条记录吗？',
    associatedAccount: '关联账号',
    employeeAccountDeleteWarning: '关联账号也会被删除。',
    assignRoles: '分配角色',
    assignPermissions: '分配权限',
    accountRoles: '账号角色',
    rolePermissions: '角色权限',
    assigned: '已分配',
    available: '可分配',
    loginFailed: '登录失败',
    loadFailed: '无法加载数据',
    saveFailed: '保存失败',
    deleteFailed: '删除失败',
    passwordRequired: '新账号必须设置密码',
    saved: '已保存',
    page: '页码',
    of: '共',
    newEmployee: '新增员工',
    updateEmployee: '更新员工',
    personalInfo: '个人信息',
    emergencyContact: '紧急联系人',
    employmentInfo: '雇佣信息',
    resources: {
      employees: '员工',
      departments: '部门',
      accounts: '账号',
      roles: '角色',
      permissions: '权限',
      settings: '设置'
    },
    fields: {
      employeeNo: '员工编号',
      fullName: '姓名',
      gender: '性别',
      dateOfBirth: '出生日期',
      marriedStatus: '婚姻状态',
      address: '地址',
      phone: '电话',
      departmentName: '部门',
      managerName: '经理',
      departmentId: '部门',
      managerId: '经理',
      jobTitle: '职位',
      hireDate: '入职日期',
      terminationDate: '离职日期',
      status: '状态',
      code: '编码',
      name: '名称',
      relation: '关系',
      employeeId: '员工',
      accountType: '类型',
      mustChangePassword: '必须修改密码',
      preferredLanguage: '首选语言',
      description: '描述',
      moduleCode: '模块',
      createdAt: '创建时间',
      updatedAt: '更新时间',
      passwordChangedAt: '密码修改时间',
      lastLoginAt: '最后登录时间',
      'emergencyContact.fullName': '紧急联系人姓名',
      'emergencyContact.phone': '紧急联系人电话',
      'emergencyContact.relation': '紧急联系人关系'
    }
  }
} as const;

type Translation = (typeof messages)[Language];

function getPreferredLanguage(session?: Session | null): Language {
  const stored = localStorage.getItem('hcerp-language');
  if (session?.language === 'zh-CN' || session?.language === 'en') return session.language;
  if (stored === 'zh-CN' || stored === 'en') return stored;
  return 'en';
}

const resources = [
  { key: 'employees', icon: <BadgeIcon fontSize="small" /> },
  { key: 'departments', icon: <BusinessIcon fontSize="small" /> },
  { key: 'accounts', icon: <AccountCircleIcon fontSize="small" /> },
  { key: 'roles', icon: <AdminPanelSettingsIcon fontSize="small" /> },
  { key: 'permissions', icon: <VpnKeyIcon fontSize="small" /> },
  { key: 'settings', icon: <SettingsIcon fontSize="small" /> }
] as const;

const RESOURCE_STORAGE_KEY = 'hcerp-resource';
const POST_LOGIN_RESOURCE_KEY = 'hcerp-post-login-resource';
const LOGIN_PATH = '/login';
const resourceKeys = resources.map((resource) => resource.key);
const dateOnlyColumns = new Set(['dateOfBirth', 'hireDate', 'terminationDate']);
const pageSizeOptions = [5, 10, 20, 30, 40, 50, 100, 200];
const employeeTableColumns = [
  'employeeNo',
  'fullName',
  'gender',
  'dateOfBirth',
  'marriedStatus',
  'jobTitle',
  'departmentId',
  'hireDate'
];
const employeeFormSections = [
  {
    titleKey: 'personalInfo',
    fields: ['fullName', 'gender', 'dateOfBirth', 'marriedStatus', 'phone', 'address']
  },
  {
    titleKey: 'emergencyContact',
    fields: ['emergencyContact.fullName', 'emergencyContact.phone', 'emergencyContact.relation']
  },
  {
    titleKey: 'employmentInfo',
    fields: ['employeeNo', 'departmentId', 'managerId', 'jobTitle', 'hireDate', 'terminationDate', 'status']
  }
] as const;
const settingsFormSections = [
  {
    titleKey: 'personalInfo',
    fields: ['fullName', 'gender', 'dateOfBirth', 'marriedStatus', 'phone', 'address']
  },
  {
    titleKey: 'emergencyContact',
    fields: ['emergencyContact.fullName', 'emergencyContact.phone', 'emergencyContact.relation']
  },
  {
    titleKey: 'employmentInfo',
    fields: ['employeeNo', 'departmentName', 'managerName', 'jobTitle', 'hireDate', 'terminationDate', 'status']
  }
] as const;

function getStoredResource() {
  const stored = localStorage.getItem(RESOURCE_STORAGE_KEY);
  return resourceKeys.includes(stored as typeof resourceKeys[number]) ? stored! : 'employees';
}

function getResourceFromPath() {
  const pathResource = window.location.pathname.split('/').filter(Boolean)[0];
  return resourceKeys.includes(pathResource as typeof resourceKeys[number]) ? pathResource! : undefined;
}

function getInitialResource() {
  return getResourceFromPath() ?? getStoredResource();
}

function resourcePath(resource: string) {
  return `/${resource}`;
}

function navigate(path: string, replace = false) {
  if (window.location.pathname === path) return;
  if (replace) window.history.replaceState(null, '', path);
  else window.history.pushState(null, '', path);
}

const schemas: Record<string, { label: string; fields: Field[] }> = {
  employees: {
    label: 'Employees',
    fields: [
      { name: 'employeeNo', required: true },
      { name: 'fullName', required: true },
      { name: 'gender', options: ['MALE', 'FEMALE'] },
      { name: 'dateOfBirth', type: 'date', required: true },
      { name: 'marriedStatus', options: ['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED'] },
      { name: 'phone', required: true },
      { name: 'address' },
      { name: 'departmentId' },
      { name: 'managerId' },
      { name: 'jobTitle' },
      { name: 'hireDate', type: 'date' },
      { name: 'terminationDate', type: 'date' },
      { name: 'status', options: ['ACTIVE', 'TERMINATED'] },
      { name: 'emergencyContact.fullName', required: true },
      { name: 'emergencyContact.phone', required: true },
      { name: 'emergencyContact.relation', required: true }
    ]
  },
  departments: {
    label: 'Departments',
    fields: [
      { name: 'code', options: ['ADMIN', 'HR'] },
      { name: 'name', required: true },
      { name: 'managerId' },
      { name: 'status', options: ['ACTIVE', 'INACTIVE'] }
    ]
  },
  accounts: {
    label: 'Accounts',
    fields: [
      { name: 'employeeId' },
      { name: 'username', required: true },
      { name: 'password', type: 'password', required: true },
      { name: 'status', options: ['ACTIVE', 'LOCKED', 'TERMINATED'] },
      { name: 'accountType', options: ['USER', 'SYSTEM'] },
      { name: 'mustChangePassword', options: ['false', 'true'] },
      { name: 'preferredLanguage', options: ['zh-CN', 'en'] }
    ]
  },
  roles: {
    label: 'Roles',
    fields: [
      { name: 'name', required: true },
      { name: 'code', options: ['SYSTEM_ADMIN', 'HR_MANAGER', 'HR_OFFICE'] },
      { name: 'status', options: ['ACTIVE', 'INACTIVE'] },
      { name: 'description' }
    ]
  },
  permissions: {
    label: 'Permissions',
    fields: [
      { name: 'code', options: ['EMPLOYEE_VIEW', 'EMPLOYEE_CREATE', 'EMPLOYEE_EDIT', 'EMPLOYEE_DELETE'] },
      { name: 'name', required: true },
      { name: 'description' },
      { name: 'moduleCode', options: ['EMPLOYEE'] }
    ]
  }
};
const settingsFields: Field[] = [
  { name: 'fullName', required: true, readOnly: true },
  { name: 'gender', options: ['MALE', 'FEMALE'], readOnly: true },
  { name: 'dateOfBirth', type: 'date', required: true, readOnly: true },
  { name: 'marriedStatus', options: ['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED'], readOnly: true },
  { name: 'phone', required: true },
  { name: 'address' },
  { name: 'emergencyContact.fullName', required: true },
  { name: 'emergencyContact.phone', required: true },
  { name: 'emergencyContact.relation', required: true },
  { name: 'employeeNo', readOnly: true },
  { name: 'departmentName', readOnly: true },
  { name: 'managerName', readOnly: true },
  { name: 'jobTitle', readOnly: true },
  { name: 'hireDate', type: 'date', readOnly: true },
  { name: 'terminationDate', type: 'date', readOnly: true },
  { name: 'status', readOnly: true }
];
const settingsSaveFields = settingsFields.filter((field) => !field.readOnly);

type Field = {
  name: string;
  required?: boolean;
  readOnly?: boolean;
  type?: 'text' | 'date' | 'password';
  options?: string[];
};

function authHeaders(session: Session) {
  return { Authorization: `Bearer ${session.token}`, 'Content-Type': 'application/json' };
}

async function api<T>(path: string, session?: Session, init: RequestInit = {}): Promise<T> {
  const headers = session ? authHeaders(session) : { 'Content-Type': 'application/json' };
  const response = await fetch(`${API_BASE}${path}`, { ...init, headers: { ...headers, ...init.headers } });
  const text = await response.text();
  if (!response.ok) {
    const body = text ? tryParseJson(text) : {};
    throw new Error(body.message ?? `Request failed: ${response.status}`);
  }
  if (!text) return undefined as T;
  return JSON.parse(text);
}

function tryParseJson(text: string): Record<string, string> {
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

function App() {
  const [session, setSession] = useState<Session | null>(() => {
    const raw = localStorage.getItem('hcerp-session');
    return raw ? JSON.parse(raw) : null;
  });
  const [routeVersion, setRouteVersion] = useState(0);
  const [language, setLanguage] = useState<Language>(() => getPreferredLanguage(session));
  const t = messages[language];

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
    const nextLanguage = getPreferredLanguage(next);
    setLanguage(nextLanguage);
    localStorage.setItem('hcerp-language', nextLanguage);
    if (next) {
      localStorage.setItem('hcerp-session', JSON.stringify(next));
      const targetResource = sessionStorage.getItem(POST_LOGIN_RESOURCE_KEY) ?? getStoredResource();
      sessionStorage.removeItem(POST_LOGIN_RESOURCE_KEY);
      navigate(resourcePath(targetResource), true);
    } else {
      localStorage.removeItem('hcerp-session');
      navigate(LOGIN_PATH, true);
    }
  }

  async function saveLanguage(nextLanguage: Language) {
    setLanguage(nextLanguage);
    localStorage.setItem('hcerp-language', nextLanguage);
    if (!session) return;
    const updatedSession = { ...session, language: nextLanguage };
    setSession(updatedSession);
    localStorage.setItem('hcerp-session', JSON.stringify(updatedSession));
    await api('/auth/language', updatedSession, {
      method: 'PUT',
      body: JSON.stringify({ language: nextLanguage })
    });
  }

  useEffect(() => {
    function handlePopState() {
      setRouteVersion((version) => version + 1);
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (!session) {
      const requestedResource = getResourceFromPath();
      if (requestedResource) sessionStorage.setItem(POST_LOGIN_RESOURCE_KEY, requestedResource);
      if (window.location.pathname !== LOGIN_PATH) navigate(LOGIN_PATH, true);
      return;
    }

    if (window.location.pathname === LOGIN_PATH || !getResourceFromPath()) {
      navigate(resourcePath(getStoredResource()), true);
    }
  }, [session, routeVersion]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {session
        ? <Shell session={session} language={language} t={t} onLanguageChange={saveLanguage} onLogout={() => saveSession(null)} />
        : <Login language={language} t={t} onLogin={saveSession} />}
    </ThemeProvider>
  );
}

function Login({ t, onLogin }: { language: Language; t: Translation; onLogin: (session: Session) => void }) {
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
      setError(err instanceof Error ? err.message : t.loginFailed);
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', px: 2 }}>
      <Paper component="form" onSubmit={submit} sx={{ width: '100%', maxWidth: 420, p: 3 }}>
        <Stack spacing={2.5}>
          <Box>
            <Box
              component="img"
              src={LOGO_SRC}
              alt="Hengchang Machinery"
              sx={{ display: 'block', width: '100%', maxWidth: 330, height: 'auto', mb: 1 }}
            />
            <Typography variant="body2" color="text.secondary">{t.signInSubtitle}</Typography>
          </Box>
          <TextField label={t.username} value={username} onChange={(event) => setUsername(event.target.value)} required />
          <TextField label={t.password} type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          {error && <Typography color="error" variant="body2">{error}</Typography>}
          <Button type="submit" variant="contained" startIcon={<SecurityIcon />}>{t.signIn}</Button>
        </Stack>
      </Paper>
    </Box>
  );
}

function Shell({ session, language, t, onLanguageChange, onLogout }: {
  session: Session;
  language: Language;
  t: Translation;
  onLanguageChange: (language: Language) => Promise<void>;
  onLogout: () => void;
}) {
  const [resource, setResource] = useState(() => getInitialResource());

  function selectResource(nextResource: string) {
    setResource(nextResource);
    localStorage.setItem(RESOURCE_STORAGE_KEY, nextResource);
    if (window.location.pathname !== resourcePath(nextResource)) {
      window.history.pushState(null, '', resourcePath(nextResource));
    }
  }

  useEffect(() => {
    const routedResource = getResourceFromPath();
    if (!routedResource) {
      window.history.replaceState(null, '', resourcePath(resource));
      return;
    }
    setResource(routedResource);
    localStorage.setItem(RESOURCE_STORAGE_KEY, routedResource);
  }, []);

  useEffect(() => {
    function handlePopState() {
      const routedResource = getResourceFromPath() ?? getStoredResource();
      setResource(routedResource);
      localStorage.setItem(RESOURCE_STORAGE_KEY, routedResource);
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: '1px solid #dde3dc' }}>
        <Toolbar>
          <Box sx={{ flex: 1 }}>
            <Box
              component="img"
              src={LOGO_SRC}
              alt="Hengchang Machinery"
              sx={{ display: 'block', width: { xs: 190, sm: 260 }, maxWidth: '100%', height: 'auto' }}
            />
          </Box>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>{t.language}</InputLabel>
              <Select
                label={t.language}
                value={language}
                onChange={(event) => void onLanguageChange(event.target.value as Language)}
              >
                <MenuItem value="en">{t.english}</MenuItem>
                <MenuItem value="zh-CN">{t.simplifiedChinese}</MenuItem>
              </Select>
            </FormControl>
            <Chip label={session.username} size="small" />
            <Tooltip title={t.signOut}>
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
              onClick={() => selectResource(item.key)}
              sx={{ justifyContent: 'flex-start', mb: 0.5 }}
            >
              {t.resources[item.key]}
            </Button>
          ))}
        </Paper>
        {resource === 'settings'
          ? <SettingsPanel session={session} language={language} t={t} />
          : <ResourcePanel key={resource} resource={resource} session={session} language={language} t={t} />}
      </Box>
    </Box>
  );
}

function SettingsPanel({ session, language, t }: {
  session: Session;
  language: Language;
  t: Translation;
}) {
  const [form, setForm] = useState<AnyRow>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  async function load() {
    setError('');
    setSaved(false);
    setLoading(true);
    try {
      setForm(await api<AnyRow>('/settings/profile', session));
    } catch (err) {
      setError(err instanceof Error ? err.message : t.loadFailed);
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    setError('');
    setSaved(false);
    setSaving(true);
    try {
      const body = requestBodyFromFields(settingsSaveFields, form);
      setForm(await api<AnyRow>('/settings/profile', session, {
        method: 'PUT',
        body: JSON.stringify(body)
      }));
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.saveFailed);
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => { void load(); }, []);

  return (
    <Paper sx={{ overflow: 'hidden' }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ p: 2, alignItems: { sm: 'center' } }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>{t.resources.settings}</Typography>
          {loading
            ? <Skeleton width={140} />
            : <Typography variant="body2" color="text.secondary">{String(form.username ?? session.username)}</Typography>}
        </Box>
        <Tooltip title={t.refresh}>
          <span>
            <IconButton onClick={load} disabled={loading || saving}><RefreshIcon /></IconButton>
          </span>
        </Tooltip>
        <Button variant="contained" startIcon={<SaveIcon />} onClick={save} disabled={loading || saving}>
          {t.save}
        </Button>
      </Stack>
      <Divider />
      <Box sx={{ p: 2 }}>
        {loading ? (
          <Stack spacing={2}>
            <Skeleton variant="rounded" height={56} />
            <Skeleton variant="rounded" height={56} />
            <Skeleton variant="rounded" height={56} />
          </Stack>
        ) : (
          <Stack spacing={2}>
            <FormSections
              sections={settingsFormSections}
              fields={settingsFields}
              form={form}
              setForm={setForm}
              t={t}
              language={language}
            />
            {saved && <Typography color="success.main" variant="body2">{t.saved}</Typography>}
            {error && <Typography color="error" variant="body2">{error}</Typography>}
          </Stack>
        )}
      </Box>
    </Paper>
  );
}

function ResourcePanel({ resource, session, language, t }: {
  resource: string;
  session: Session;
  language: Language;
  t: Translation;
}) {
  const schema = schemas[resource];
  const [rows, setRows] = useState<AnyRow[]>([]);
  const [references, setReferences] = useState<ReferenceData>({ departments: [], employees: [], accounts: [] });
  const [editing, setEditing] = useState<AnyRow | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AnyRow | null>(null);
  const [sort, setSort] = useState<SortState>(null);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 20 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setError('');
    setLoading(true);
    try {
      const nextRows = await api<AnyRow[]>(`/${resource}`, session);
      setRows(nextRows);
      if (resource === 'employees') {
        const [departments, employees, accounts] = await Promise.all([
          api<AnyRow[]>('/departments', session),
          api<AnyRow[]>('/employees', session),
          api<AnyRow[]>('/accounts', session).catch(() => [] as AnyRow[])
        ]);
        setReferences({ departments, employees, accounts });
      }
      if (resource === 'accounts') {
        const employees = await api<AnyRow[]>('/employees', session);
        setReferences({ departments: [], employees, accounts: nextRows });
      }
      if (resource === 'departments') {
        const employees = await api<AnyRow[]>('/employees', session);
        setReferences({ departments: nextRows, employees, accounts: [] });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.loadFailed);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [resource]);

  async function remove(row: AnyRow) {
    if (!row.id) return;
    setError('');
    try {
      await api<void>(`/${resource}/${row.id}`, session, { method: 'DELETE' });
      setPendingDelete(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.deleteFailed);
    }
  }

  const columns = resource === 'employees'
    ? employeeTableColumns
    : Array.from(new Set(rows.flatMap((row) => Object.keys(row))))
      .filter((column) => column !== 'id' && column !== 'passwordHash')
      .slice(0, 9);
  const sortedRows = useMemo(
    () => sortRows(rows, sort, resource, references, language),
    [rows, sort, resource, references, language]
  );
  const dataGridColumns = useMemo(
    () => buildGridColumns(columns, sort, setSortAndResetPage, resource, references, language, t, setEditing, setPendingDelete),
    [columns, sort, resource, references, language, t]
  );
  const pageCount = Math.max(1, Math.ceil(sortedRows.length / paginationModel.pageSize));

  useEffect(() => {
    setSort(null);
    setPaginationModel((current: GridPaginationModel) => ({ ...current, page: 0 }));
  }, [resource]);

  function setSortAndResetPage(nextSort: SortState) {
    setSort(nextSort);
    setPaginationModel((current: GridPaginationModel) => ({ ...current, page: 0 }));
  }

  function updatePaginationModel(nextModel: GridPaginationModel) {
    setPaginationModel(nextModel);
  }

  function jumpToPage(value: string) {
    const nextPage = Number(value);
    if (!Number.isFinite(nextPage)) return;
    setPaginationModel((current: GridPaginationModel) => ({
      ...current,
      page: Math.min(Math.max(nextPage, 1), pageCount) - 1
    }));
  }

  return (
    <Paper sx={{ overflow: 'hidden' }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ p: 2, alignItems: { sm: 'center' } }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>{t.resources[resource as keyof typeof t.resources]}</Typography>
          {loading
            ? <Skeleton width={90} />
            : <Typography variant="body2" color="text.secondary">{rows.length} {t.records}</Typography>}
        </Box>
        <Tooltip title={t.refresh}>
          <span>
            <IconButton onClick={load} disabled={loading}><RefreshIcon /></IconButton>
          </span>
        </Tooltip>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setEditing(defaultRow(schema.fields, resource))}>{t.new}</Button>
      </Stack>
      <Divider />
      {error && <Typography color="error" sx={{ px: 2, py: 1 }}>{error}</Typography>}
      <Box sx={{ height: 'calc(100vh - 238px)', minHeight: 420 }}>
        <DataGrid
          rows={sortedRows}
          columns={dataGridColumns}
          loading={loading}
          disableRowSelectionOnClick
          paginationModel={paginationModel}
          onPaginationModelChange={updatePaginationModel}
          pageSizeOptions={pageSizeOptions}
          getRowId={(row: AnyRow) => String(row.id)}
          sx={{
            border: 0,
            '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 700 },
            '& .MuiDataGrid-cell:focus, & .MuiDataGrid-columnHeader:focus': { outline: 'none' }
          }}
        />
      </Box>
      <Stack direction="row" spacing={1} sx={{ px: 2, py: 1.5, alignItems: 'center', justifyContent: 'flex-end' }}>
        <TextField
          size="small"
          type="number"
          label={t.page}
          value={paginationModel.page + 1}
          onChange={(event) => jumpToPage(event.target.value)}
          slotProps={{ htmlInput: { min: 1, max: pageCount } }}
          sx={{ width: 100 }}
        />
        <Typography variant="body2" color="text.secondary">
          {t.of} {pageCount}
        </Typography>
      </Stack>
      {editing && (
        <EditDialog
          resource={resource}
          schema={schema}
          row={editing}
          session={session}
          t={t}
          references={references}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); void load(); }}
        />
      )}
      {pendingDelete && (
        <Dialog open onClose={() => setPendingDelete(null)} maxWidth="xs" fullWidth>
          <DialogTitle>{t.confirmDeleteTitle}</DialogTitle>
          <DialogContent>
            <Typography variant="body2">{t.confirmDeleteMessage}</Typography>
            {employeeAccountForDelete(resource, pendingDelete, references) && (
              <Box sx={{ mt: 2, p: 1.5, bgcolor: '#fdecee', borderRadius: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{t.employeeAccountDeleteWarning}</Typography>
                <Typography variant="body2">
                  {t.associatedAccount}: {accountSummary(employeeAccountForDelete(resource, pendingDelete, references))}
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPendingDelete(null)}>{t.cancel}</Button>
            <Button color="error" variant="contained" startIcon={<DeleteIcon />} onClick={() => remove(pendingDelete)}>
              {t.delete}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Paper>
  );
}

function EditDialog({ resource, schema, row, session, t, references, onClose, onSaved }: {
  resource: string;
  schema: { label: string; fields: Field[] };
  row: AnyRow;
  session: Session;
  t: Translation;
  references: ReferenceData;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<AnyRow>(row);
  const [error, setError] = useState('');
  const [assignmentState, setAssignmentState] = useState<AssignmentState | null>(null);
  const assignmentType = row.id && resource === 'accounts'
    ? 'account'
    : row.id && resource === 'roles'
      ? 'role'
      : undefined;

  async function save() {
    setError('');
    const body = requestBodyFromFields(schema.fields, form);
    if (resource === 'accounts' && !row.id && !String(body.password ?? '').trim()) {
      setError(t.passwordRequired);
      return;
    }
    try {
      await api(`/${resource}${row.id ? `/${row.id}` : ''}`, session, {
        method: row.id ? 'PUT' : 'POST',
        body: JSON.stringify(body)
      });
      if (assignmentType && assignmentState && row.id) {
        await syncAssignments(row.id, assignmentState, session);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.saveFailed);
    }
  }

  return (
    <Dialog open onClose={onClose} maxWidth={resource === 'employees' || assignmentType ? 'md' : 'sm'} fullWidth>
      <DialogTitle>{dialogTitle(resource, row.id, t)}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {resource === 'employees'
            ? (
              <FormSections
                sections={employeeFormSections}
                fields={schema.fields}
                form={form}
                setForm={setForm}
                t={t}
                references={references}
                currentRowId={row.id}
              />
            )
            : schema.fields.map((field) => renderField(resource, field, form, setForm, t, references, row.id))}
          {error && <Typography color="error" variant="body2">{error}</Typography>}
          {assignmentType && (
            <AssignmentSection
              type={assignmentType}
              row={row}
              session={session}
              t={t}
              onChange={setAssignmentState}
            />
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t.cancel}</Button>
        <Button onClick={save} variant="contained" startIcon={<SaveIcon />}>{t.save}</Button>
      </DialogActions>
    </Dialog>
  );
}

type FormSection = {
  titleKey: 'personalInfo' | 'emergencyContact' | 'employmentInfo';
  fields: readonly string[];
};

function FormSections({ sections, fields, form, setForm, t, references = { departments: [], employees: [], accounts: [] }, currentRowId, language = 'en' }: {
  sections: readonly FormSection[];
  fields: Field[];
  form: AnyRow;
  setForm: React.Dispatch<React.SetStateAction<AnyRow>>;
  t: Translation;
  references?: ReferenceData;
  currentRowId?: string;
  language?: Language;
}) {
  const fieldByName = new Map(fields.map((field) => [field.name, field]));

  return (
    <Stack spacing={2.5}>
      {sections.map((section) => (
        <Box key={section.titleKey}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {t[section.titleKey]}
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
              gap: 2,
              mt: 1
            }}
          >
            {section.fields.map((fieldName) => {
              const field = fieldByName.get(fieldName);
              if (!field) return null;
              const shouldSpan = fieldName === 'address';

              return (
                <Box
                  key={fieldName}
                  sx={{
                    gridColumn: shouldSpan ? { xs: '1', sm: '1 / -1' } : undefined,
                    width: '100%'
                  }}
                >
                  {renderField('employees', field, form, setForm, t, references, currentRowId, language)}
                </Box>
              );
            })}
          </Box>
        </Box>
      ))}
    </Stack>
  );
}

function dialogTitle(resource: string, rowId: unknown, t: Translation) {
  if (resource === 'employees') return rowId ? t.updateEmployee : t.newEmployee;
  return `${rowId ? t.edit : t.create} ${t.resources[resource as keyof typeof t.resources]}`;
}

async function syncAssignments(parentId: string, state: AssignmentState, session: Session) {
  const addedIds = state.selectedIds.filter((itemId) => !state.originalIds.includes(itemId));
  const removedIds = state.originalIds.filter((itemId) => !state.selectedIds.includes(itemId));

  await Promise.all([
    ...addedIds.map((itemId) => api(assignmentPath(state.type, parentId, itemId), session, { method: 'POST' })),
    ...removedIds.map((itemId) => api(assignmentPath(state.type, parentId, itemId), session, { method: 'DELETE' }))
  ]);
}

function assignmentPath(type: AssignmentType, parentId: string, itemId: string) {
  return type === 'account'
    ? `/assignments/accounts/${parentId}/roles/${itemId}`
    : `/assignments/roles/${parentId}/permissions/${itemId}`;
}

function AssignmentSection({ type, row, session, t, onChange }: {
  type: AssignmentType;
  row: AnyRow;
  session: Session;
  t: Translation;
  onChange: (state: AssignmentState) => void;
}) {
  const target = type === 'account' ? 'roles' : 'permissions';
  const [items, setItems] = useState<AnyRow[]>([]);
  const [originalIds, setOriginalIds] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const targetIdKey = type === 'account' ? 'roleId' : 'permissionId';
  const selectLabel = type === 'account' ? t.accountRoles : t.rolePermissions;

  async function load() {
    setError('');
    setLoading(true);
    try {
      const [all, assigned] = await Promise.all([
        api<AnyRow[]>(`/${target}`, session),
        api<AnyRow[]>(type === 'account' ? `/assignments/accounts/${row.id}/roles` : `/assignments/roles/${row.id}/permissions`, session)
      ]);
      const loadedIds = assigned
        .map((link) => link[targetIdKey])
        .filter((id): id is string => typeof id === 'string');
      setItems(all);
      setOriginalIds(loadedIds);
      setSelectedIds(loadedIds);
      onChange({ type, originalIds: loadedIds, selectedIds: loadedIds });
    } catch (err) {
      setError(err instanceof Error ? err.message : t.loadFailed);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [row.id, type]);

  function handleSelectionChange(value: unknown) {
    const nextIds = (Array.isArray(value) ? value : String(value).split(',')).map(String);
    setSelectedIds(nextIds);
    onChange({ type, originalIds, selectedIds: nextIds });
  }

  function renderSelectedValues(selectedIds: string[]) {
    return selectedIds
      .map((itemId) => items.find((item) => item.id === itemId))
      .filter((item): item is AnyRow => Boolean(item))
      .map(assignmentItemLabel)
      .join(', ');
  }

  return (
    <>
      <Divider />
      <Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          {selectLabel}
        </Typography>
        {error && <Typography color="error" variant="body2" sx={{ mt: 1 }}>{error}</Typography>}
        {loading ? (
          <Skeleton variant="rounded" height={40} sx={{ mt: 1 }} />
        ) : (
        <FormControl fullWidth size="small" sx={{ mt: 1 }}>
          <InputLabel>{selectLabel}</InputLabel>
          <Select
            multiple
            label={selectLabel}
            value={selectedIds}
            onChange={(event) => handleSelectionChange(event.target.value)}
            renderValue={(selected) => renderSelectedValues(selected as string[])}
          >
            {items.map((item) => {
              const itemId = String(item.id ?? '');
              return (
                <MenuItem key={itemId} value={itemId}>
                  <Checkbox checked={selectedIds.includes(itemId)} />
                  <ListItemText primary={assignmentItemLabel(item)} />
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
        )}
      </Box>
    </>
  );
}

function defaultRow(fields: Field[], resource?: string): AnyRow {
  let row: AnyRow = {};
  if (resource === 'accounts') {
    fields.forEach((field) => {
      row = setFieldValue(row, field.name, field.name === 'preferredLanguage' ? 'zh-CN' : field.options?.[0] ?? '');
    });
    return row;
  }
  fields.forEach((field) => {
    row = setFieldValue(row, field.name, field.options?.[0] ?? '');
  });
  return row;
}

function requestBodyFromFields(fields: Field[], form: AnyRow) {
  return fields.reduce((body, field) => {
    const value = getFieldValue(form, field.name);
    const normalizedValue = field.name === 'mustChangePassword'
      ? value === true || value === 'true'
      : value === ''
        ? null
        : value;
    return setFieldValue(body, field.name, normalizedValue);
  }, {} as AnyRow);
}

function getFieldValue(row: AnyRow, path: string) {
  return path.split('.').reduce<unknown>((value, part) => (
    value && typeof value === 'object' ? (value as AnyRow)[part] : undefined
  ), row);
}

function setFieldValue(row: AnyRow, path: string, value: unknown): AnyRow {
  const parts = path.split('.');
  if (parts.length === 1) return { ...row, [path]: value };
  const [head, ...rest] = parts;
  const current = row[head];
  return {
    ...row,
    [head]: setFieldValue(
      current && typeof current === 'object' ? current as AnyRow : {},
      rest.join('.'),
      value
    )
  };
}

function renderField(
  resource: string,
  field: Field,
  form: AnyRow,
  setForm: React.Dispatch<React.SetStateAction<AnyRow>>,
  t: Translation,
  references: ReferenceData,
  currentRowId?: string,
  language: Language = 'en'
) {
  if (field.readOnly) {
    const value = getFieldValue(form, field.name);
    const display = isDateColumn(field.name)
      ? formatDateValue(value, field.name, language)
      : String(value ?? '');

    return (
      <TextField
        key={field.name}
        fullWidth
        label={formFieldLabel(resource, t, field.name)}
        value={display}
        disabled
      />
    );
  }

  if (resource === 'accounts' && field.name === 'employeeId') {
    const selectedEmployee = references.employees.find((employee) => employee.id === form.employeeId) ?? null;
    const employeeOptions = availableAccountEmployees(references, form.employeeId);
    return (
      <Autocomplete<AnyRow>
        key={field.name}
        fullWidth
        options={employeeOptions}
        value={selectedEmployee}
        getOptionLabel={accountEmployeeName}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        onChange={(_, employee) => setForm({ ...form, employeeId: employee?.id ?? null })}
        renderInput={(params) => (
          <TextField {...params} label={formFieldLabel(resource, t, field.name)} />
        )}
      />
    );
  }

  if (resource === 'employees' && field.name === 'departmentId') {
    const value = getFieldValue(form, field.name);
    const label = formFieldLabel(resource, t, field.name);
    return (
      <FormControl key={field.name} fullWidth>
        <InputLabel>{label}</InputLabel>
        <Select
          label={label}
          value={String(value ?? '')}
          onChange={(event) => setForm((current) => setFieldValue(current, field.name, event.target.value || null))}
        >
          <MenuItem value="">-</MenuItem>
          {references.departments.map((department) => (
            <MenuItem key={String(department.id)} value={String(department.id)}>
              {departmentName(department)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    );
  }

  if (resource === 'employees' && field.name === 'managerId') {
    const value = getFieldValue(form, field.name);
    const label = formFieldLabel(resource, t, field.name);
    return (
      <FormControl key={field.name} fullWidth>
        <InputLabel>{label}</InputLabel>
        <Select
          label={label}
          value={String(value ?? '')}
          onChange={(event) => setForm((current) => setFieldValue(current, field.name, event.target.value || null))}
        >
          <MenuItem value="">-</MenuItem>
          {references.employees
            .filter((employee) => employee.id !== currentRowId)
            .map((employee) => (
              <MenuItem key={String(employee.id)} value={String(employee.id)}>
                {employeeName(employee)}
              </MenuItem>
            ))}
        </Select>
      </FormControl>
    );
  }

  if (field.options) {
    const value = getFieldValue(form, field.name);
    const label = formFieldLabel(resource, t, field.name);
    return (
      <FormControl key={field.name} fullWidth>
        <InputLabel>{label}</InputLabel>
        <Select
          label={label}
          value={String(value ?? field.options[0] ?? '')}
          onChange={(event) => setForm((current) => setFieldValue(current, field.name, event.target.value))}
        >
          {field.options.map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}
        </Select>
      </FormControl>
    );
  }

  return (
    <TextField
      key={field.name}
      fullWidth
      label={formFieldLabel(resource, t, field.name)}
      type={field.type ?? 'text'}
      required={field.required && !(resource === 'accounts' && field.name === 'password' && currentRowId)}
      value={String(getFieldValue(form, field.name) ?? '')}
      onChange={(event) => setForm((current) => setFieldValue(current, field.name, event.target.value))}
      slotProps={field.type === 'date' ? { inputLabel: { shrink: true } } : undefined}
    />
  );
}

function displayValue(resource: string, column: string, value: unknown, references: ReferenceData, language: Language) {
  if (resource === 'accounts' && column === 'employeeId') {
    const employee = references.employees.find((item) => item.id === value);
    return employee ? accountEmployeeName(employee) : String(value ?? '');
  }
  if (resource === 'departments' && column === 'managerId') {
    const manager = references.employees.find((item) => item.id === value);
    return manager ? employeeName(manager) : String(value ?? '');
  }
  if (resource === 'employees' && column === 'departmentId') {
    const department = references.departments.find((item) => item.id === value);
    return department ? departmentName(department) : String(value ?? '');
  }
  if (resource === 'employees' && column === 'managerId') {
    const manager = references.employees.find((item) => item.id === value);
    return manager ? employeeName(manager) : String(value ?? '');
  }
  if (isDateColumn(column)) {
    return formatDateValue(value, column, language);
  }
  return String(value ?? '');
}

function buildGridColumns(
  columns: string[],
  sort: SortState,
  setSort: (nextSort: SortState) => void,
  resource: string,
  references: ReferenceData,
  language: Language,
  t: Translation,
  setEditing: React.Dispatch<React.SetStateAction<AnyRow | null>>,
  setPendingDelete: React.Dispatch<React.SetStateAction<AnyRow | null>>
): GridColDef[] {
  return [
    ...columns.map((column): GridColDef => {
      const sortRule = sort?.column === column ? sort : undefined;
      const headerLabel = fieldLabel(t, column);

      return {
        field: column,
        headerName: headerLabel,
        sortable: false,
        flex: 1,
        minWidth: 150,
        renderHeader: () => (
          <TableSortLabel
            active={Boolean(sortRule)}
            direction={sortRule?.direction ?? 'asc'}
            onClick={() => setSort(toggleSortRule(sort, column))}
          >
            {headerLabel}
          </TableSortLabel>
        ),
        renderCell: (params: { row: AnyRow }) => {
          const value = displayValue(resource, column, params.row[column], references, language);
          return (
            <Box title={value} sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {value}
            </Box>
          );
        }
      };
    }),
    {
      field: '__actions',
      headerName: t.actions,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      width: 104,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params: { row: AnyRow }) => (
        <Stack
          direction="row"
          spacing={0.5}
          sx={{
            alignItems: 'center',
            justifyContent: 'flex-end',
            minHeight: '100%',
            width: '100%'
          }}
        >
          <Tooltip title={t.edit}>
            <IconButton size="small" onClick={() => setEditing(params.row)}><EditIcon fontSize="small" /></IconButton>
          </Tooltip>
          <Tooltip title={t.delete}>
            <IconButton size="small" onClick={() => setPendingDelete(params.row)}><DeleteIcon fontSize="small" /></IconButton>
          </Tooltip>
        </Stack>
      )
    }
  ];
}

function toggleSortRule(sort: SortState, column: string): SortState {
  if (sort?.column !== column) return { column, direction: 'asc' };
  if (sort.direction === 'asc') return { column, direction: 'desc' };
  return null;
}

function sortRows(rows: AnyRow[], sort: SortState, resource: string, references: ReferenceData, language: Language) {
  if (!sort) return rows;
  const direction = sort.direction === 'asc' ? 1 : -1;
  return [...rows].sort((left, right) => (
    compareSortValues(
      sortValue(left, sort.column, resource, references, language),
      sortValue(right, sort.column, resource, references, language)
    ) * direction
  ));
}

function sortValue(row: AnyRow, column: string, resource: string, references: ReferenceData, language: Language) {
  const value = row[column];
  if (isDateColumn(column)) {
    return parseDateValue(value, column) ?? '';
  }
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  return displayValue(resource, column, value, references, language).toLocaleLowerCase();
}

function compareSortValues(left: string | number | boolean, right: string | number | boolean) {
  if (typeof left === 'number' && typeof right === 'number') return left - right;
  if (typeof left === 'boolean' && typeof right === 'boolean') return Number(left) - Number(right);
  return String(left).localeCompare(String(right), undefined, { numeric: true, sensitivity: 'base' });
}

function isDateColumn(column: string) {
  return dateOnlyColumns.has(column) || column.endsWith('At') || column.toLowerCase().includes('date');
}

function formatDateValue(value: unknown, column: string, language: Language) {
  if (value === null || value === undefined || value === '') return '';
  const raw = String(value);
  const isDateOnly = dateOnlyColumns.has(column) || /^\d{4}-\d{2}-\d{2}$/.test(raw);
  const timestamp = parseDateValue(value, column);
  if (timestamp === null) return raw;
  const date = new Date(timestamp);

  return new Intl.DateTimeFormat(language, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...(isDateOnly ? {} : { hour: '2-digit', minute: '2-digit' })
  }).format(date);
}

function parseDateValue(value: unknown, column: string) {
  if (value === null || value === undefined || value === '') return null;
  const raw = String(value);
  const isDateOnly = dateOnlyColumns.has(column) || /^\d{4}-\d{2}-\d{2}$/.test(raw);
  const timestamp = new Date(isDateOnly ? `${raw}T00:00:00` : raw).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

function employeeAccountForDelete(resource: string, row: AnyRow, references: ReferenceData) {
  if (resource !== 'employees') return undefined;
  return references.accounts.find((account) => account.employeeId === row.id);
}

function accountSummary(account?: AnyRow) {
  if (!account) return '';
  return [account.username, account.status ? `(${account.status})` : ''].filter(Boolean).join(' ');
}

function assignmentItemLabel(item: AnyRow) {
  return [item.name, item.code ? `(${item.code})` : ''].filter(Boolean).join(' ') || String(item.id ?? '');
}

function availableAccountEmployees(references: ReferenceData, currentEmployeeId: unknown) {
  const assignedEmployeeIds = new Set(
    references.accounts
      .map((account) => account.employeeId)
      .filter((employeeId) => employeeId && employeeId !== currentEmployeeId)
  );
  return references.employees.filter((employee) => !assignedEmployeeIds.has(employee.id));
}

function departmentName(department: AnyRow) {
  return [department.name, department.code ? `(${department.code})` : ''].filter(Boolean).join(' ');
}

function accountEmployeeName(employee: AnyRow) {
  const fullName = String(employee.fullName ?? '').trim();
  if (fullName) return fullName;
  const lastName = String(employee.lastName ?? '').trim();
  const firstName = String(employee.firstName ?? '').trim();
  const name = [lastName, firstName].filter(Boolean).join(' ');
  return name || String(employee.displayName ?? employee.employeeNo ?? employee.id ?? '');
}

function employeeName(employee: AnyRow) {
  const fullName = String(employee.fullName ?? '').trim();
  if (fullName) return fullName;
  const displayName = String(employee.displayName ?? '').trim();
  if (displayName) return displayName;
  return [employee.firstName, employee.lastName].filter(Boolean).join(' ') || String(employee.employeeNo ?? employee.id ?? '');
}

function fieldLabel(t: Translation, key: string) {
  return t.fields[key as keyof typeof t.fields] ?? key.replace(/([A-Z])/g, ' $1').replace(/^./, (match) => match.toUpperCase());
}

function formFieldLabel(resource: string, t: Translation, key: string) {
  if (resource === 'employees' && key.startsWith('emergencyContact.')) {
    return fieldLabel(t, key.replace('emergencyContact.', ''));
  }
  return fieldLabel(t, key);
}

createRoot(document.getElementById('root')!).render(<App />);
