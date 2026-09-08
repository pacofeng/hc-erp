package com.hcerp.erp.account;

import com.hcerp.erp.common.Enums.AccountStatus;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class AccountStatusConverter implements AttributeConverter<AccountStatus, String> {
    @Override
    public String convertToDatabaseColumn(AccountStatus value) {
        if (value == null) return null;
        return switch (value) {
            case ACTIVE -> "启用";
            case LOCKED -> "锁定";
            case TERMINATED -> "停用";
        };
    }

    @Override
    public AccountStatus convertToEntityAttribute(String value) {
        if (value == null) return null;
        return switch (value) {
            case "启用" -> AccountStatus.ACTIVE;
            case "锁定" -> AccountStatus.LOCKED;
            case "停用" -> AccountStatus.TERMINATED;
            default -> throw new IllegalArgumentException("Unknown account status: " + value);
        };
    }
}
