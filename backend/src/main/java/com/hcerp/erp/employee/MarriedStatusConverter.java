package com.hcerp.erp.employee;

import com.hcerp.erp.common.Enums.MarriedStatus;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class MarriedStatusConverter implements AttributeConverter<MarriedStatus, String> {
    @Override
    public String convertToDatabaseColumn(MarriedStatus value) {
        if (value == null) return null;
        return switch (value) {
            case SINGLE -> "未婚";
            case MARRIED -> "已婚";
            case DIVORCED -> "离异";
            case WIDOWED -> "丧偶";
        };
    }

    @Override
    public MarriedStatus convertToEntityAttribute(String value) {
        if (value == null) return null;
        return switch (value) {
            case "未婚" -> MarriedStatus.SINGLE;
            case "已婚" -> MarriedStatus.MARRIED;
            case "离异" -> MarriedStatus.DIVORCED;
            case "丧偶" -> MarriedStatus.WIDOWED;
            default -> throw new IllegalArgumentException("Unknown employee MarriedStatus: " + value);
        };
    }
}
