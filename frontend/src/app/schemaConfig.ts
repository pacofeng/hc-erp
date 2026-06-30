import type { Field } from "./types";

const emergencyContactRelationOptions = [
  "SPOUSE",
  "PARENT",
  "CHILD",
  "SIBLING",
  "GRANDPARENT",
  "AUNT_UNCLE",
  "COUSIN",
  "NIECE_NEPHEW",
  "OTHER",
];

export const employeeTableColumns = [
  "employeeNo",
  "fullName",
  "jobTitle",
  "departmentId",
  "managerId",
  "hireDate",
];

export const departmentTableColumns = [
  "code",
  "name",
  "chineseName",
  "managerId",
  "employeeCount",
  "status",
];

export const accountTableColumns = [
  "employeeId",
  "username",
  "status",
  "preferredLanguage",
  "securityQuestionsConfigured",
  "lastLoginAt",
];

export const roleTableColumns = [
  "code",
  "name",
  "chineseName",
  "description",
  "status",
  "createdAt",
  "updatedAt",
];

export const employeeFormSections = [
  {
    titleKey: "personalInfo",
    fields: [
      "fullName",
      "idCardNumber",
      "gender",
      "dateOfBirth",
      "marriedStatus",
      "phone",
    ],
  },
  {
    titleKey: "addressInfo",
    fields: ["addressProvince", "addressCity", "addressDistrict", "address"],
  },
  {
    titleKey: "emergencyContact",
    fields: [
      "emergencyContact.fullName",
      "emergencyContact.phone",
      "emergencyContact.relation",
    ],
  },
  {
    titleKey: "employmentInfo",
    fields: [
      "employeeNo",
      "departmentId",
      "managerId",
      "jobTitle",
      "hireDate",
      "terminationDate",
      "status",
    ],
  },
] as const;

export const newEmployeeFormSections = employeeFormSections.map((section) =>
  section.titleKey === "employmentInfo"
    ? {
        ...section,
        fields: section.fields.filter(
          (field) => field !== "terminationDate" && field !== "status",
        ),
      }
    : section,
);

export const settingsFormSections = [
  {
    titleKey: "personalInfo",
    fields: [
      "username",
      "fullName",
      "idCardNumber",
      "gender",
      "dateOfBirth",
      "marriedStatus",
      "phone",
    ],
  },
  {
    titleKey: "addressInfo",
    fields: ["addressProvince", "addressCity", "addressDistrict", "address"],
  },
  {
    titleKey: "emergencyContact",
    fields: [
      "emergencyContact.fullName",
      "emergencyContact.phone",
      "emergencyContact.relation",
    ],
  },
  {
    titleKey: "employmentInfo",
    fields: [
      "employeeNo",
      "departmentName",
      "managerName",
      "jobTitle",
      "hireDate",
      "terminationDate",
      "status",
    ],
  },
] as const;

export const schemas: Record<string, { label: string; fields: Field[] }> = {
  employees: {
    label: "Employees",
    fields: [
      { name: "employeeNo", required: true },
      { name: "fullName", required: true },
      { name: "idCardNumber", required: true },
      { name: "gender", required: true, options: ["MALE", "FEMALE"] },
      { name: "dateOfBirth", type: "date", required: true },
      {
        name: "marriedStatus",
        required: true,
        options: ["SINGLE", "MARRIED", "DIVORCED", "WIDOWED"],
      },
      { name: "phone", required: true },
      { name: "photo" },
      { name: "addressProvince" },
      { name: "addressCity" },
      { name: "addressDistrict" },
      { name: "address" },
      { name: "departmentId" },
      { name: "managerId" },
      { name: "jobTitle", required: true },
      { name: "hireDate", type: "date", required: true },
      { name: "terminationDate", type: "date" },
      { name: "status", options: ["ACTIVE", "TERMINATED"] },
      { name: "emergencyContact.fullName", required: true },
      { name: "emergencyContact.phone", required: true },
      {
        name: "emergencyContact.relation",
        required: true,
        options: emergencyContactRelationOptions,
      },
    ],
  },
  departments: {
    label: "Departments",
    fields: [
      { name: "code", required: true },
      { name: "name", required: true },
      { name: "chineseName", required: true },
      { name: "managerId" },
      { name: "status", options: ["ACTIVE", "INACTIVE"] },
    ],
  },
  accounts: {
    label: "Accounts",
    fields: [
      { name: "employeeId", required: true },
      { name: "username", required: true },
      { name: "password", type: "password", required: true },
      { name: "confirmPassword", type: "password", required: true },
      { name: "status", options: ["ACTIVE", "LOCKED", "TERMINATED"] },
      { name: "avatar" },
      { name: "preferredLanguage", options: ["zh-CN", "en"] },
    ],
  },
  roles: {
    label: "Roles",
    fields: [
      { name: "code", required: true },
      { name: "name", required: true },
      { name: "chineseName", required: true },
      { name: "status", options: ["ACTIVE", "INACTIVE"] },
      { name: "description" },
    ],
  },
  permissions: {
    label: "Permissions",
    fields: [
      { name: "code", required: true },
      { name: "name", required: true },
      { name: "description" },
      { name: "moduleCode", options: ["EMPLOYEE", "ACCOUNT", "DEPARTMENT"] },
    ],
  },
};

export const settingsFields: Field[] = [
  { name: "username", readOnly: true },
  { name: "avatar" },
  { name: "fullName", required: true, readOnly: true },
  { name: "idCardNumber", readOnly: true },
  { name: "gender", options: ["MALE", "FEMALE"], readOnly: true },
  { name: "dateOfBirth", type: "date", required: true, readOnly: true },
  {
    name: "marriedStatus",
    options: ["SINGLE", "MARRIED", "DIVORCED", "WIDOWED"],
    readOnly: true,
  },
  { name: "phone", required: true },
  { name: "addressProvince" },
  { name: "addressCity" },
  { name: "addressDistrict" },
  { name: "address" },
  { name: "emergencyContact.fullName", required: true },
  { name: "emergencyContact.phone", required: true },
  {
    name: "emergencyContact.relation",
    required: true,
    options: emergencyContactRelationOptions,
  },
  { name: "employeeNo", readOnly: true },
  { name: "departmentName", readOnly: true },
  { name: "managerName", readOnly: true },
  { name: "jobTitle", readOnly: true },
  { name: "hireDate", type: "date", readOnly: true },
  { name: "terminationDate", type: "date", readOnly: true },
  { name: "status", readOnly: true },
];

export const settingsSaveFields = settingsFields.filter(
  (field) => !field.readOnly,
);
