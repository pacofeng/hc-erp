package com.hcerp.erp.employee;

import com.hcerp.erp.common.Enums.EmployeeStatus;
import com.hcerp.erp.common.Enums.GenderType;
import com.hcerp.erp.common.Enums.MarriedStatus;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

class EmployeeCategoryConvertersTest {
    @Test
    void genderUsesChineseDatabaseValues() {
        var converter = new GenderConverter();
        assertEquals("男", converter.convertToDatabaseColumn(GenderType.MALE));
        assertEquals(GenderType.MALE, converter.convertToEntityAttribute("男"));
        assertEquals("女", converter.convertToDatabaseColumn(GenderType.FEMALE));
        assertEquals(GenderType.FEMALE, converter.convertToEntityAttribute("女"));
        assertNull(converter.convertToDatabaseColumn(null));
        assertNull(converter.convertToEntityAttribute(null));
        assertThrows(IllegalArgumentException.class, () -> converter.convertToEntityAttribute("invalid"));
    }

    @Test
    void marriedStatusUsesChineseDatabaseValues() {
        var converter = new MarriedStatusConverter();
        assertEquals("未婚", converter.convertToDatabaseColumn(MarriedStatus.SINGLE));
        assertEquals(MarriedStatus.SINGLE, converter.convertToEntityAttribute("未婚"));
        assertEquals("已婚", converter.convertToDatabaseColumn(MarriedStatus.MARRIED));
        assertEquals(MarriedStatus.MARRIED, converter.convertToEntityAttribute("已婚"));
        assertEquals("离异", converter.convertToDatabaseColumn(MarriedStatus.DIVORCED));
        assertEquals(MarriedStatus.DIVORCED, converter.convertToEntityAttribute("离异"));
        assertEquals("丧偶", converter.convertToDatabaseColumn(MarriedStatus.WIDOWED));
        assertEquals(MarriedStatus.WIDOWED, converter.convertToEntityAttribute("丧偶"));
        assertNull(converter.convertToDatabaseColumn(null));
        assertNull(converter.convertToEntityAttribute(null));
        assertThrows(IllegalArgumentException.class, () -> converter.convertToEntityAttribute("invalid"));
    }

    @Test
    void employeeStatusUsesChineseDatabaseValues() {
        var converter = new EmployeeStatusConverter();
        assertEquals("在职", converter.convertToDatabaseColumn(EmployeeStatus.ACTIVE));
        assertEquals(EmployeeStatus.ACTIVE, converter.convertToEntityAttribute("在职"));
        assertEquals("离职", converter.convertToDatabaseColumn(EmployeeStatus.TERMINATED));
        assertEquals(EmployeeStatus.TERMINATED, converter.convertToEntityAttribute("离职"));
        assertNull(converter.convertToDatabaseColumn(null));
        assertNull(converter.convertToEntityAttribute(null));
        assertThrows(IllegalArgumentException.class, () -> converter.convertToEntityAttribute("invalid"));
    }

}
