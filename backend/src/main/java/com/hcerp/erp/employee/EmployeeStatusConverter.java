package com.hcerp.erp.employee;

import com.hcerp.erp.common.Enums.EmployeeStatus;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class EmployeeStatusConverter implements AttributeConverter<EmployeeStatus, String> {
    @Override
    public String convertToDatabaseColumn(EmployeeStatus value) {
        if (value == null) return null;
        return switch (value) {
            case ACTIVE -> "在职";
            case TERMINATED -> "离职";
        };
    }

    @Override
    public EmployeeStatus convertToEntityAttribute(String value) {
        if (value == null) return null;
        return switch (value) {
            case "在职" -> EmployeeStatus.ACTIVE;
            case "离职" -> EmployeeStatus.TERMINATED;
            default -> throw new IllegalArgumentException("Unknown employee EmployeeStatus: " + value);
        };
    }
}
