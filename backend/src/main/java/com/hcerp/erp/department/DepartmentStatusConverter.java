package com.hcerp.erp.department;

import com.hcerp.erp.common.Enums.DepartmentStatus;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class DepartmentStatusConverter implements AttributeConverter<DepartmentStatus, String> {
    @Override
    public String convertToDatabaseColumn(DepartmentStatus value) {
        if (value == null) return null;
        return switch (value) {
            case ACTIVE -> "启用";
            case INACTIVE -> "停用";
        };
    }

    @Override
    public DepartmentStatus convertToEntityAttribute(String value) {
        if (value == null) return null;
        return switch (value) {
            case "启用" -> DepartmentStatus.ACTIVE;
            case "停用" -> DepartmentStatus.INACTIVE;
            default -> throw new IllegalArgumentException("Unknown department status: " + value);
        };
    }
}
