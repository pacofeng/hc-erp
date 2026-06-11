import type { Field } from "./types";

export const employeeTableColumns = [
  "employeeNo",
  "fullName",
  "jobTitle",
  "departmentId",
  "managerId",
  "hireDate",
];

export const employeeFormSections = [
  {
    titleKey: "personalInfo",
    fields: [
      "photo",
      "fullName",
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

export const settingsFormSections = [
  {
    titleKey: "accountInfo",
    fields: ["avatar", "username"],
  },
  {
    titleKey: "personalInfo",
    fields: ["fullName", "gender", "dateOfBirth", "marriedStatus", "phone"],
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
      { name: "gender", options: ["MALE", "FEMALE"] },
      { name: "dateOfBirth", type: "date", required: true },
      {
        name: "marriedStatus",
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
      { name: "jobTitle" },
      { name: "hireDate", type: "date" },
      { name: "terminationDate", type: "date" },
      { name: "status", options: ["ACTIVE", "TERMINATED"] },
      { name: "emergencyContact.fullName", required: true },
      { name: "emergencyContact.phone", required: true },
      { name: "emergencyContact.relation", required: true },
    ],
  },
  departments: {
    label: "Departments",
    fields: [
      { name: "code", options: ["ADMIN", "HR"] },
      { name: "name", required: true },
      { name: "managerId" },
      { name: "status", options: ["ACTIVE", "INACTIVE"] },
    ],
  },
  accounts: {
    label: "Accounts",
    fields: [
      { name: "employeeId" },
      { name: "username", required: true },
      { name: "password", type: "password", required: true },
      { name: "status", options: ["ACTIVE", "LOCKED", "TERMINATED"] },
      { name: "accountType", options: ["USER", "SYSTEM"] },
      { name: "mustChangePassword", options: ["false", "true"] },
      { name: "avatar" },
      { name: "preferredLanguage", options: ["zh-CN", "en"] },
    ],
  },
  roles: {
    label: "Roles",
    fields: [
      { name: "name", required: true },
      { name: "code", options: ["SYSTEM_ADMIN", "HR_MANAGER", "HR_OFFICE"] },
      { name: "status", options: ["ACTIVE", "INACTIVE"] },
      { name: "description" },
    ],
  },
  permissions: {
    label: "Permissions",
    fields: [
      {
        name: "code",
        options: [
          "EMPLOYEE_VIEW",
          "EMPLOYEE_CREATE",
          "EMPLOYEE_EDIT",
          "EMPLOYEE_DELETE",
          "DEPARTMENT_VIEW",
          "DEPARTMENT_CREATE",
          "DEPARTMENT_EDIT",
          "DEPARTMENT_DELETE",
        ],
      },
      { name: "name", required: true },
      { name: "description" },
      { name: "moduleCode", options: ["EMPLOYEE", "DEPARTMENT"] },
    ],
  },
};

export const settingsFields: Field[] = [
  { name: "username", readOnly: true },
  { name: "avatar" },
  { name: "fullName", required: true, readOnly: true },
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
  { name: "emergencyContact.relation", required: true },
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
