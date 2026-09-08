package com.hcerp.erp.account;

import java.util.List;

import com.hcerp.erp.common.Enums.AccountStatus;
import com.hcerp.erp.security.ErpUserDetails;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class AccountStatusConverterTest {
    private final AccountStatusConverter converter = new AccountStatusConverter();

    @Test
    void mapsAllStatusesToChineseAndBack() {
        assertEquals("启用", converter.convertToDatabaseColumn(AccountStatus.ACTIVE));
        assertEquals("锁定", converter.convertToDatabaseColumn(AccountStatus.LOCKED));
        assertEquals("停用", converter.convertToDatabaseColumn(AccountStatus.TERMINATED));
        assertEquals(AccountStatus.ACTIVE, converter.convertToEntityAttribute("启用"));
        assertEquals(AccountStatus.LOCKED, converter.convertToEntityAttribute("锁定"));
        assertEquals(AccountStatus.TERMINATED, converter.convertToEntityAttribute("停用"));
        assertNull(converter.convertToDatabaseColumn(null));
        assertNull(converter.convertToEntityAttribute(null));
        assertThrows(IllegalArgumentException.class, () -> converter.convertToEntityAttribute("invalid"));
    }

    @Test
    void chineseStatusesPreserveLoginRestrictions() {
        var account = new Account();
        var user = new ErpUserDetails(account, List.of());
        account.status = converter.convertToEntityAttribute("启用");
        assertTrue(user.isEnabled());
        assertTrue(user.isAccountNonLocked());
        account.status = converter.convertToEntityAttribute("锁定");
        assertFalse(user.isEnabled());
        assertFalse(user.isAccountNonLocked());
        account.status = converter.convertToEntityAttribute("停用");
        assertFalse(user.isEnabled());
    }
}
