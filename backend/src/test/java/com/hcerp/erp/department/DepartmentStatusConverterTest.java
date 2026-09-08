package com.hcerp.erp.department;

import com.hcerp.erp.common.Enums.DepartmentStatus;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

class DepartmentStatusConverterTest {
    @Test
    void mapsBothStatusesToChineseAndBack() {
        var converter = new DepartmentStatusConverter();
        assertEquals("启用", converter.convertToDatabaseColumn(DepartmentStatus.ACTIVE));
        assertEquals("停用", converter.convertToDatabaseColumn(DepartmentStatus.INACTIVE));
        assertEquals(DepartmentStatus.ACTIVE, converter.convertToEntityAttribute("启用"));
        assertEquals(DepartmentStatus.INACTIVE, converter.convertToEntityAttribute("停用"));
        assertNull(converter.convertToDatabaseColumn(null));
        assertNull(converter.convertToEntityAttribute(null));
        assertThrows(IllegalArgumentException.class, () -> converter.convertToEntityAttribute("invalid"));
    }
}
