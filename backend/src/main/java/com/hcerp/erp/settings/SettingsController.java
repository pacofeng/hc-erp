package com.hcerp.erp.settings;

import java.time.LocalDate;
import java.util.UUID;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.hcerp.erp.account.Account;
import com.hcerp.erp.account.AccountRepository;
import com.hcerp.erp.common.Enums.GenderType;
import com.hcerp.erp.common.Enums.MarriedStatus;
import com.hcerp.erp.common.Enums.EmployeeStatus;
import com.hcerp.erp.common.NotFoundException;
import com.hcerp.erp.department.DepartmentRepository;
import com.hcerp.erp.employee.EmergencyContact;
import com.hcerp.erp.employee.EmergencyContactRepository;
import com.hcerp.erp.employee.Employee;
import com.hcerp.erp.employee.EmployeeRepository;
import com.hcerp.erp.security.ErpUserDetails;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

@RestController
@RequestMapping("/api/settings")
public class SettingsController {
    private final AccountRepository accounts;
    private final EmployeeRepository employees;
    private final EmergencyContactRepository emergencyContacts;
    private final DepartmentRepository departments;

    public SettingsController(
            AccountRepository accounts,
            EmployeeRepository employees,
            EmergencyContactRepository emergencyContacts,
            DepartmentRepository departments) {
        this.accounts = accounts;
        this.employees = employees;
        this.emergencyContacts = emergencyContacts;
        this.departments = departments;
    }

    @GetMapping("/profile")
    public ProfileResponse profile(@AuthenticationPrincipal ErpUserDetails user) {
        Account account = account(user);
        Employee employee = employee(account);
        EmergencyContact contact = emergencyContacts.findByEmployeeId(employee.id).orElse(null);
        return toResponse(account, employee, contact);
    }

    @PutMapping("/profile")
    @Transactional
    public ProfileResponse updateProfile(
            @AuthenticationPrincipal ErpUserDetails user,
            @Valid @RequestBody ProfileRequest request) {
        Account account = account(user);
        Employee employee = employee(account);
        account.avatar = request.avatar();
        employee.phone = request.phone();
        employee.addressProvince = request.addressProvince();
        employee.addressCity = request.addressCity();
        employee.addressDistrict = request.addressDistrict();
        employee.address = request.address();

        EmergencyContact contact = emergencyContacts.findByEmployeeId(employee.id).orElseGet(EmergencyContact::new);
        contact.employeeId = employee.id;
        contact.fullName = request.emergencyContact().fullName();
        contact.phone = request.emergencyContact().phone();
        contact.relation = request.emergencyContact().relation();

        Employee savedEmployee = employees.save(employee);
        EmergencyContact savedContact = emergencyContacts.save(contact);
        return toResponse(account, savedEmployee, savedContact);
    }

    private Account account(ErpUserDetails user) {
        return accounts.findById(user.accountId())
                .orElseThrow(() -> new NotFoundException("Account not found"));
    }

    private Employee employee(Account account) {
        UUID employeeId = account.employeeId;
        if (employeeId == null) {
            throw new NotFoundException("Employee profile not found");
        }
        return employees.findById(employeeId)
                .orElseThrow(() -> new NotFoundException("Employee profile not found"));
    }

    private ProfileResponse toResponse(Account account, Employee employee, EmergencyContact contact) {
        return new ProfileResponse(
                account.username,
                account.avatar,
                employee.employeeNo,
                employee.fullName,
                employee.gender,
                employee.dateOfBirth,
                employee.marriedStatus,
                employee.phone,
                employee.addressProvince,
                employee.addressCity,
                employee.addressDistrict,
                employee.address,
                departmentName(employee.departmentId),
                managerName(employee.managerId),
                employee.jobTitle,
                employee.hireDate,
                employee.terminationDate,
                employee.status,
                contact == null ? null : new EmergencyContactResponse(
                        contact.fullName,
                        contact.phone,
                        contact.relation));
    }

    private String departmentName(UUID departmentId) {
        if (departmentId == null) return null;
        return departments.findById(departmentId)
                .map(department -> department.name)
                .orElse(null);
    }

    private String managerName(UUID managerId) {
        if (managerId == null) return null;
        return employees.findById(managerId)
                .map(manager -> manager.fullName)
                .orElse(null);
    }

    public record ProfileRequest(
            @Size(max = 30000000, message = "Avatar must be 20MB or smaller")
            @Pattern(regexp = "^data:image/(png|jpeg|gif|webp|bmp);base64,[A-Za-z0-9+/=]+$", message = "Avatar must be an uploaded image file")
            String avatar,
            @NotBlank @Pattern(regexp = "\\d{11}", message = "Phone must be 11 digits") String phone,
            String addressProvince,
            String addressCity,
            String addressDistrict,
            String address,
            @NotNull @Valid EmergencyContactRequest emergencyContact) {
    }

    public record EmergencyContactRequest(
            @NotBlank String fullName,
            @NotBlank @Pattern(regexp = "\\d{11}", message = "Phone must be 11 digits") String phone,
            @NotBlank String relation) {
    }

    public record ProfileResponse(
            String username,
            String avatar,
            String employeeNo,
            String fullName,
            GenderType gender,
            LocalDate dateOfBirth,
            MarriedStatus marriedStatus,
            String phone,
            String addressProvince,
            String addressCity,
            String addressDistrict,
            String address,
            String departmentName,
            String managerName,
            String jobTitle,
            LocalDate hireDate,
            LocalDate terminationDate,
            EmployeeStatus status,
            EmergencyContactResponse emergencyContact) {
    }

    public record EmergencyContactResponse(
            String fullName,
            String phone,
            String relation) {
    }
}
