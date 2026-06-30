package com.hcerp.erp.common;

public final class Enums {
    private Enums() {
    }

    public enum GenderType { MALE, FEMALE }
    public enum EmployeeStatus { ACTIVE, TERMINATED }
    public enum MarriedStatus { SINGLE, MARRIED, DIVORCED, WIDOWED }
    public enum AccountStatus { ACTIVE, LOCKED, TERMINATED }
    public enum AccountType { USER, SYSTEM }
    public enum RoleStatus { ACTIVE, INACTIVE }
    public enum DepartmentStatus { ACTIVE, INACTIVE }
    public enum ModuleCode { EMPLOYEE, ACCOUNT, DEPARTMENT }
}
