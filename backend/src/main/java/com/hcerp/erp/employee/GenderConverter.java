package com.hcerp.erp.employee;

import com.hcerp.erp.common.Enums.GenderType;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class GenderConverter implements AttributeConverter<GenderType, String> {
    @Override
    public String convertToDatabaseColumn(GenderType value) {
        if (value == null) return null;
        return switch (value) {
            case MALE -> "男";
            case FEMALE -> "女";
        };
    }

    @Override
    public GenderType convertToEntityAttribute(String value) {
        if (value == null) return null;
        return switch (value) {
            case "男" -> GenderType.MALE;
            case "女" -> GenderType.FEMALE;
            default -> throw new IllegalArgumentException("Unknown employee Gender: " + value);
        };
    }
}
