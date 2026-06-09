package com.hcerp.erp.common;

public final class Enums {
    private Enums() {
    }

    public enum GenderType { MALE, FEMALE }
    public enum EmployeeStatus { ACTIVE, TERMINATED }
    public enum MarriedStatus { SINGLE, MARRIED, DIVORCED, WIDOWED }
    public enum AccountStatus { ACTIVE, LOCKED, TERMINATED }
    public enum AccountType { USER, SYSTEM }
    public enum RoleCode { SYSTEM_ADMIN, HR_MANAGER, HR_OFFICE }
    public enum RoleStatus { ACTIVE, INACTIVE }
    public enum DepartmentCode { ADMIN, HR }
    public enum DepartmentStatus { ACTIVE, INACTIVE }
    public enum PermissionCode { EMPLOYEE_VIEW, EMPLOYEE_CREATE, EMPLOYEE_EDIT, EMPLOYEE_DELETE }
    public enum ModuleCode { EMPLOYEE }
}
