import type { Language, Session } from "./types";

export const messages = {
  en: {
    signInSubtitle: "Sign in to manage employees, access, and HR master data.",
    username: "Username",
    password: "Password",
    signIn: "Sign in",
    signOut: "Sign out",
    language: "Language",
    english: "English",
    simplifiedChinese: "Simplified Chinese",
    records: "records",
    refresh: "Refresh",
    new: "New",
    actions: "Actions",
    edit: "Edit",
    create: "Create",
    cancel: "Cancel",
    save: "Save",
    close: "Close",
    add: "Add",
    remove: "Remove",
    delete: "Delete",
    updatePassword: "Update Password",
    confirmDeleteTitle: "Confirm delete",
    confirmDeleteMessage: "Are you sure you want to delete this record?",
    confirmTerminateTitle: "Confirm termination",
    confirmTerminateMessage: "Are you sure you want to terminate this employee?",
    associatedAccount: "Associated account",
    departmentCreateImmutableWarning:
      "Department code and name cannot be updated once created.",
    departmentDeleteBlocked:
      "This department cannot be deleted because employees are assigned to it. Move those employees to another department first.",
    assignedEmployees: "Assigned employees",
    employeeAssociatedAccountNotice: "This employee has an associated account.",
    employeeAccountDeleteWarning:
      "The associated account will also be deleted.",
    employeeAccountTerminateWarning:
      "The associated account will also be terminated.",
    assignRoles: "Assign roles",
    assignPermissions: "Assign permissions",
    accountRoles: "Account Roles",
    rolePermissions: "Role Permissions",
    assigned: "Assigned",
    available: "Available",
    loginFailed: "Login failed",
    loadFailed: "Unable to load data",
    saveFailed: "Save failed",
    deleteFailed: "Delete failed",
    created: "Created successfully",
    updated: "Updated successfully",
    deleted: "Deleted successfully",
    languageSaved: "Language preference saved",
    fieldRequired: "This field is required",
    passwordRequired: "Password is required for new accounts",
    usernameAlreadyExists: "Username already exists",
    departmentCodeAlreadyExists: "Department code already exists",
    idCardInvalid: "ID Card Number must be exactly 18 characters",
    dateOfBirthFuture: "Date of Birth cannot be a future date",
    forgotPassword: "Forgot Password?",
    forgotPasswordTitle: "Forgot Password",
    securityQuestionSetupTitle: "Security Questions",
    securityQuestionSetupMessage:
      "Please answer at least 3 security questions before continuing.",
    securityQuestion: "Security Question",
    securityAnswer: "Answer",
    getSecurityQuestions: "Continue",
    verifyAnswers: "Verify Answers",
    resetPassword: "Reset Password",
    mustChangePasswordTitle: "Reset your password",
    mustChangePasswordMessage:
      "This account is using a temporary password. Please set a new password before continuing.",
    newPassword: "New Password",
    confirmPassword: "Confirm Password",
    passwordResetSuccess: "Password has been reset. Please sign in again.",
    passwordStrengthHint:
      "Use at least 8 characters with letters, numbers, and special characters.",
    passwordsDoNotMatch: "Passwords do not match",
    securityQuestionsSaved: "Security questions saved",
    inactivityWarningTitle: "Session timeout warning",
    inactivityWarningMessage:
      "You will be logged out in 1 minute due to inactivity.",
    inactivityCountdown: "Seconds remaining",
    staySignedIn: "Stay signed in",
    phoneInvalid: "Phone must be exactly 11 digits",
    uploadImage: "Upload image",
    changeImage: "Change image",
    removeImage: "Remove image",
    imageTooLarge: "Image must be 20MB or smaller",
    imageInvalid: "Please upload a JPG, PNG, GIF, WebP, or BMP image",
    saved: "Saved",
    page: "Page",
    of: "of",
    dashboardTitle: "Dashboard",
    dashboardWelcome: "Welcome back",
    availableModules: "Available Modules",
    newEmployee: "New Employee",
    updateEmployee: "Update Employee",
    accountInfo: "Account Info",
    personalInfo: "Personal Info",
    addressInfo: "Current Address",
    emergencyContact: "Emergency Contact",
    employmentInfo: "Employment Info",
    resources: {
      dashboard: "Dashboard",
      employees: "Employees",
      departments: "Departments",
      accounts: "Accounts",
      roles: "Roles",
      permissions: "Permissions",
      settings: "Settings",
    },
    departmentNames: {
      System: "System",
      Management: "Management",
      Finance: "Finance",
      Procurement: "Procurement",
      "Domestic Sales": "Domestic Sales",
      "International Sales": "International Sales",
      Administration: "Administration",
      "After-Sales": "After-Sales",
      Research: "Research",
      "Mechanical Processing": "Mechanical Processing",
      "Fitter Workshop": "Fitter Workshop",
      "Quilting Machine Assembly": "Quilting Machine Assembly",
      "Cutting Machine Assembly": "Cutting Machine Assembly",
      Painting: "Painting",
      Electrical: "Electrical",
      Warehouse: "Warehouse",
      Logistics: "Logistics",
    },
    securityQuestionLabels: {
      "What city were you born in?": "What city were you born in?",
      "What was the name of your first school?":
        "What was the name of your first school?",
      "What was your childhood nickname?": "What was your childhood nickname?",
      "What is your oldest sibling's first name?":
        "What is your oldest sibling's first name?",
      "What was your first pet's name?": "What was your first pet's name?",
      "In what city did your parents meet?":
        "In what city did your parents meet?",
      "What was your favorite food as a child?":
        "What was your favorite food as a child?",
      "What is your favorite book or movie?":
        "What is your favorite book or movie?",
      "Who is your favorite teacher?": "Who is your favorite teacher?",
      "What year did you graduate high school?":
        "What year did you graduate high school?",
      "What is the name of the hospital where you were born?":
        "What is the name of the hospital where you were born?",
    },
    optionLabels: {
      ACTIVE: "Active",
      INACTIVE: "Inactive",
      TERMINATED: "Terminated",
      LOCKED: "Locked",
      MALE: "Male",
      FEMALE: "Female",
      SINGLE: "Single",
      MARRIED: "Married",
      DIVORCED: "Divorced",
      WIDOWED: "Widowed",
      USER: "User",
      SYSTEM: "System",
      EMPLOYEE: "Employee",
      DEPARTMENT: "Department",
      true: "Yes",
      false: "No",
      "zh-CN": "简体中文",
      en: "English",
      SPOUSE: "Spouse",
      PARENT: "Parent",
      CHILD: "Child",
      SIBLING: "Sibling",
      GRANDPARENT: "Grandparent",
      AUNT_UNCLE: "Aunt / Uncle",
      COUSIN: "Cousin",
      NIECE_NEPHEW: "Niece / Nephew",
      OTHER: "Other",
    },
    employeeStatusLabels: {
      ACTIVE: "Active",
      TERMINATED: "Terminated",
    },
    fields: {
      username: "Username",
      password: "Password",
      confirmPassword: "Confirm Password",
      employeeNo: "Employee No",
      fullName: "Full Name",
      idCardNumber: "ID Card Number",
      gender: "Gender",
      dateOfBirth: "Date of Birth",
      marriedStatus: "Marital Status",
      addressProvince: "Province",
      addressCity: "City",
      addressDistrict: "District / County",
      address: "Address",
      phone: "Phone",
      photo: "Photo",
      avatar: "Avatar",
      account: "Account",
      role: "Role",
      permission: "Permission",
      department: "Department",
      departmentName: "Department",
      managerName: "Manager",
      departmentId: "Department",
      employeeCount: "Num of employees",
      managerId: "Manager",
      jobTitle: "Job Title",
      hireDate: "Hire Date",
      terminationDate: "Termination Date",
      status: "Status",
      code: "Code",
      name: "Name",
      relation: "Relation",
      employeeId: "Employee",
      accountType: "Type",
      mustChangePassword: "Must Change Password",
      preferredLanguage: "Preferred Language",
      securityQuestionsConfigured: "Security Questions Configured",
      description: "Description",
      moduleCode: "Module",
      createdAt: "Created At",
      updatedAt: "Updated At",
      passwordChangedAt: "Password Changed At",
      lastLoginAt: "Last Login At",
      "emergencyContact.fullName": "Emergency Contact Full Name",
      "emergencyContact.phone": "Emergency Contact Phone",
      "emergencyContact.relation": "Emergency Contact Relation",
    },
  },
  "zh-CN": {
    signInSubtitle: "登录以管理员工、账号权限和人力资源基础资料。",
    username: "用户名",
    password: "密码",
    signIn: "登录",
    signOut: "退出登录",
    language: "语言",
    english: "英文",
    simplifiedChinese: "简体中文",
    records: "条记录",
    refresh: "刷新",
    new: "新增",
    actions: "操作",
    edit: "编辑",
    create: "创建",
    cancel: "取消",
    save: "保存",
    close: "关闭",
    add: "添加",
    remove: "移除",
    delete: "删除",
    updatePassword: "修改密码",
    confirmDeleteTitle: "确认删除",
    confirmDeleteMessage: "确定要删除这条记录吗？",
    confirmTerminateTitle: "确认离职",
    confirmTerminateMessage: "确定要将该员工设为离职吗？",
    associatedAccount: "关联账号",
    departmentCreateImmutableWarning:
      "部门编码和名称创建后不能修改。",
    departmentDeleteBlocked:
      "该部门下仍有关联员工，不能删除。请先将这些员工移到其他部门。",
    assignedEmployees: "关联员工",
    employeeAssociatedAccountNotice: "该员工有关联账号。",
    employeeAccountDeleteWarning: "关联账号也会被删除。",
    employeeAccountTerminateWarning: "关联账号也会被设为离职。",
    assignRoles: "分配角色",
    assignPermissions: "分配权限",
    accountRoles: "账号角色",
    rolePermissions: "角色权限",
    assigned: "已分配",
    available: "可分配",
    loginFailed: "登录失败",
    loadFailed: "无法加载数据",
    saveFailed: "保存失败",
    deleteFailed: "删除失败",
    created: "创建成功",
    updated: "更新成功",
    deleted: "删除成功",
    languageSaved: "语言偏好已保存",
    fieldRequired: "必填项",
    passwordRequired: "新账号必须设置密码",
    usernameAlreadyExists: "用户名已存在",
    departmentCodeAlreadyExists: "部门编码已存在",
    idCardInvalid: "身份证号码必须为 18 位",
    dateOfBirthFuture: "出生日期不能是未来日期",
    forgotPassword: "忘记密码？",
    forgotPasswordTitle: "忘记密码",
    securityQuestionSetupTitle: "设置安全问题",
    securityQuestionSetupMessage:
      "请先回答至少 3 个安全问题，然后继续使用系统。",
    securityQuestion: "安全问题",
    securityAnswer: "答案",
    getSecurityQuestions: "继续",
    verifyAnswers: "验证答案",
    resetPassword: "重置密码",
    mustChangePasswordTitle: "请重置密码",
    mustChangePasswordMessage:
      "此账号正在使用临时密码。继续使用系统前，请先设置新密码。",
    newPassword: "新密码",
    confirmPassword: "确认密码",
    passwordResetSuccess: "密码已重置，请重新登录。",
    passwordStrengthHint: "至少 8 位，并包含字母、数字和特殊字符。",
    passwordsDoNotMatch: "两次输入的密码不一致",
    securityQuestionsSaved: "安全问题已保存",
    inactivityWarningTitle: "会话即将超时",
    inactivityWarningMessage:
      "由于长时间未操作，系统将在 1 分钟后自动退出登录。",
    inactivityCountdown: "剩余秒数",
    staySignedIn: "继续登录",
    phoneInvalid: "电话必须为 11 位数字",
    uploadImage: "上传图片",
    changeImage: "更换图片",
    removeImage: "移除图片",
    imageTooLarge: "图片大小不能超过 20MB",
    imageInvalid: "请上传 JPG、PNG、GIF、WebP 或 BMP 图片",
    saved: "已保存",
    page: "页码",
    of: "共",
    dashboardTitle: "仪表盘",
    dashboardWelcome: "欢迎回来",
    availableModules: "可用模块",
    newEmployee: "新增员工",
    updateEmployee: "更新员工",
    accountInfo: "账号信息",
    personalInfo: "个人信息",
    addressInfo: "现居地址",
    emergencyContact: "紧急联系人",
    employmentInfo: "雇佣信息",
    resources: {
      dashboard: "仪表盘",
      employees: "员工",
      departments: "部门",
      accounts: "账号",
      roles: "角色",
      permissions: "权限",
      settings: "设置",
    },
    departmentNames: {
      System: "系统管理员",
      Management: "管理层",
      Finance: "财务",
      Procurement: "采购",
      "Domestic Sales": "国内业务",
      "International Sales": "外贸业务",
      Administration: "行政",
      "After-Sales": "售后",
      Research: "研发",
      "Mechanical Processing": "机械加工",
      "Fitter Workshop": "钳工房",
      "Quilting Machine Assembly": "一楼装配",
      "Cutting Machine Assembly": "二楼装配",
      Painting: "油漆",
      Electrical: "电工",
      Warehouse: "仓库",
      Logistics: "后勤",
    },
    securityQuestionLabels: {
      "What city were you born in?": "您出生在哪个城市？",
      "What was the name of your first school?": "您的第一所学校叫什么名字？",
      "What was your childhood nickname?": "您小时候的昵称是什么？",
      "What is your oldest sibling's first name?":
        "您最大的兄弟姐妹叫什么名字？",
      "What was your first pet's name?": "您的第一只宠物叫什么名字？",
      "In what city did your parents meet?": "您的父母在哪个城市相识？",
      "What was your favorite food as a child?": "您小时候最喜欢的食物是什么？",
      "What is your favorite book or movie?": "您最喜欢的书或电影是什么？",
      "Who is your favorite teacher?": "您最喜欢的老师是谁？",
      "What year did you graduate high school?": "您是哪一年高中毕业的？",
      "What is the name of the hospital where you were born?":
        "您出生的医院叫什么名字？",
    },
    optionLabels: {
      ACTIVE: "启用",
      INACTIVE: "停用",
      TERMINATED: "离职",
      LOCKED: "已锁定",
      MALE: "男",
      FEMALE: "女",
      SINGLE: "未婚",
      MARRIED: "已婚",
      DIVORCED: "离异",
      WIDOWED: "丧偶",
      USER: "用户账号",
      SYSTEM: "系统账号",
      EMPLOYEE: "员工",
      DEPARTMENT: "部门",
      true: "是",
      false: "否",
      "zh-CN": "简体中文",
      en: "English",
      SPOUSE: "配偶",
      PARENT: "父母",
      CHILD: "子女",
      SIBLING: "兄弟姐妹",
      GRANDPARENT: "祖父母 / 外祖父母",
      AUNT_UNCLE: "姑姨 / 叔舅",
      COUSIN: "堂/表兄弟姐妹",
      NIECE_NEPHEW: "侄/ 甥",
      OTHER: "其他",
    },
    employeeStatusLabels: {
      ACTIVE: "在职",
      TERMINATED: "离职",
    },
    fields: {
      username: "用户名",
      password: "密码",
      confirmPassword: "确认密码",
      employeeNo: "员工编号",
      fullName: "姓名",
      idCardNumber: "身份证号码",
      gender: "性别",
      dateOfBirth: "出生日期",
      marriedStatus: "婚姻状态",
      addressProvince: "省/自治区/直辖市",
      addressCity: "城市",
      addressDistrict: "区/县",
      address: "地址",
      phone: "电话",
      photo: "照片",
      avatar: "头像",
      account: "账号",
      role: "角色",
      permission: "权限",
      department: "部门",
      departmentName: "部门",
      managerName: "经理",
      departmentId: "部门",
      employeeCount: "员工数量",
      managerId: "经理",
      jobTitle: "职位",
      hireDate: "入职日期",
      terminationDate: "离职日期",
      status: "状态",
      code: "编码",
      name: "名称",
      relation: "关系",
      employeeId: "员工",
      accountType: "类型",
      mustChangePassword: "必须修改密码",
      preferredLanguage: "首选语言",
      securityQuestionsConfigured: "已设置安全问题",
      description: "描述",
      moduleCode: "模块",
      createdAt: "创建时间",
      updatedAt: "更新时间",
      passwordChangedAt: "密码修改时间",
      lastLoginAt: "最后登录时间",
      "emergencyContact.fullName": "紧急联系人姓名",
      "emergencyContact.phone": "紧急联系人电话",
      "emergencyContact.relation": "紧急联系人关系",
    },
  },
} as const;

export type Translation = (typeof messages)[Language];
export type MessageKey = {
  [K in keyof Translation]: Translation[K] extends string ? K : never;
}[keyof Translation];

export type LocalizedErrorState =
  | { kind: "api"; error: unknown; fallbackKey: MessageKey }
  | { kind: "message"; key: MessageKey }
  | { kind: "text"; text: string };

const zhErrorMessages: Record<string, string> = {
  "Invalid username or password": "用户名或密码不正确",
  "Validation failed": "校验失败",
  "Permission not found": "权限不存在",
  "Role not found": "角色不存在",
  "Department not found": "部门不存在",
  "Department code must be uppercase": "部门编码必须为大写",
  "Department code already exists": "部门编码已存在",
  "Duplicate value already exists": "该值已存在",
  "Department cannot be deleted while employees are assigned to it":
    "该部门下仍有关联员工，不能删除",
  "Employee not found": "员工不存在",
  "Employee profile not found": "员工资料不存在",
  "Account not found": "账号不存在",
  "Username already exists": "用户名已存在",
  "Password is required for new accounts": "新账号必须设置密码",
  "Employee is required for new accounts": "新账号必须关联员工",
  "Account can only be created for an active employee":
    "只能为在职员工创建账号",
  "Unsupported language": "不支持的语言",
  "Unsupported security question": "不支持的安全问题",
  "At least 3 security questions are required": "至少需要设置 3 个安全问题",
  "Security questions must be unique": "安全问题不能重复",
  "Security question answers are required": "安全问题答案不能为空",
  "Security questions are not configured for this account":
    "该账号尚未设置安全问题",
  "Security answers are incorrect": "安全问题答案不正确",
  "Reset token is invalid or expired": "重置令牌无效或已过期",
  "Passwords do not match": "两次输入的密码不一致",
  "Password must be at least 8 characters and include letters, numbers, and special characters":
    "密码至少 8 位，并且必须包含字母、数字和特殊字符",
  "Token was issued before password change": "登录状态已失效，请重新登录",
  "Invalid or expired token": "登录状态无效或已过期，请重新登录",
  "Phone must be 11 digits": "电话必须为 11 位数字",
  "Photo must be 20MB or smaller": "照片大小不能超过 20MB",
  "Photo must be an uploaded image file": "照片必须是上传的图片文件",
  "Avatar must be 20MB or smaller": "头像大小不能超过 20MB",
  "Avatar must be an uploaded image file": "头像必须是上传的图片文件",
};

const zhErrorFragments: Array<[string, string]> = [
  ["must not be blank", "不能为空"],
  ["must not be null", "不能为空"],
  ["must be 11 digits", "必须为 11 位数字"],
  ["must be 20MB or smaller", "大小不能超过 20MB"],
  ["must be an uploaded image file", "必须是上传的图片文件"],
  ["size must be between", "数量或长度不符合要求"],
];

const zhFieldNames: Record<string, string> = {
  username: "用户名",
  password: "密码",
  language: "语言",
  answers: "安全问题",
  question: "安全问题",
  answer: "答案",
  resetToken: "重置令牌",
  newPassword: "新密码",
  confirmPassword: "确认密码",
  employeeId: "员工",
  status: "状态",
  accountType: "账号类型",
  avatar: "头像",
  employeeNo: "员工编号",
  fullName: "姓名",
  idCardNumber: "身份证号码",
  gender: "性别",
  dateOfBirth: "出生日期",
  jobTitle: "职位",
  hireDate: "入职日期",
  phone: "电话",
  photo: "照片",
};

function localizeValidationMessage(message: string) {
  for (const [source, translation] of Object.entries(zhErrorMessages)) {
    if (message.endsWith(` ${source}`)) return translation;
  }
  for (const [fragment, translation] of zhErrorFragments) {
    if (message.includes(fragment)) {
      const field = message
        .slice(0, message.indexOf(fragment))
        .trim()
        .split(/\s+/)[0];
      const fieldName = zhFieldNames[field] ?? field;
      return fieldName ? `${fieldName}${translation}` : translation;
    }
  }
  return undefined;
}

export function translateErrorMessage(
  message: string,
  language: Language,
): string {
  if (language !== "zh-CN") return message;
  if (zhErrorMessages[message]) return zhErrorMessages[message];
  const validationMessage = localizeValidationMessage(message);
  if (validationMessage) return validationMessage;
  const requestFailed = message.match(/^Request failed: (\d+)$/);
  if (requestFailed) return `请求失败：${requestFailed[1]}`;
  return message;
}

export function localizedErrorMessage(
  error: unknown,
  fallback: string,
  language: Language,
) {
  return error instanceof Error && error.message
    ? translateErrorMessage(error.message, language)
    : fallback;
}

export function apiError(
  error: unknown,
  fallbackKey: MessageKey,
): LocalizedErrorState {
  return { kind: "api", error, fallbackKey };
}

export function messageError(key: MessageKey): LocalizedErrorState {
  return { kind: "message", key };
}

export function textError(text: string): LocalizedErrorState {
  return { kind: "text", text };
}

export function renderLocalizedError(
  error: LocalizedErrorState,
  t: Translation,
  language: Language,
) {
  if (error.kind === "message") return String(t[error.key]);
  if (error.kind === "text") return error.text;
  return localizedErrorMessage(
    error.error,
    String(t[error.fallbackKey]),
    language,
  );
}

export function getPreferredLanguage(session?: Session | null): Language {
  if (session?.language === "zh-CN" || session?.language === "en")
    return session.language;
  if (typeof window === "undefined") return "zh-CN";
  const stored = window.localStorage.getItem("hcerp-language");
  if (stored === "zh-CN" || stored === "en") return stored;
  return "zh-CN";
}
