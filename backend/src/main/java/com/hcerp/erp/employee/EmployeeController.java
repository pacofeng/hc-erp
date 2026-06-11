package com.hcerp.erp.employee;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.transaction.annotation.Transactional;

import com.hcerp.erp.common.Enums.EmployeeStatus;
import com.hcerp.erp.common.Enums.GenderType;
import com.hcerp.erp.common.Enums.MarriedStatus;
import com.hcerp.erp.common.NotFoundException;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

@RestController
@RequestMapping("/api/employees")
public class EmployeeController {
    private final EmployeeRepository employees;
    private final EmergencyContactRepository emergencyContacts;

    public EmployeeController(EmployeeRepository employees, EmergencyContactRepository emergencyContacts) {
        this.employees = employees;
        this.emergencyContacts = emergencyContacts;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('EMPLOYEE_VIEW') or hasRole('SYSTEM_ADMIN')")
    public List<EmployeeResponse> list() {
        List<Employee> employeeRows = employees.findAllByOrderByEmployeeNoAsc();
        Map<UUID, EmergencyContact> contactByEmployeeId = emergencyContacts
                .findByEmployeeIdIn(employeeRows.stream().map(employee -> employee.id).toList())
                .stream()
                .collect(Collectors.toMap(contact -> contact.employeeId, Function.identity()));
        return employeeRows.stream()
                .map(employee -> toResponse(employee, contactByEmployeeId.get(employee.id)))
                .toList();
    }

    @PostMapping
    @PreAuthorize("hasAuthority('EMPLOYEE_CREATE') or hasRole('SYSTEM_ADMIN')")
    @Transactional
    public EmployeeResponse create(@Valid @RequestBody EmployeeRequest request) {
        Employee employee = new Employee();
        apply(employee, request);
        Employee saved = employees.save(employee);
        EmergencyContact contact = saveEmergencyContact(saved.id, request.emergencyContact());
        return toResponse(saved, contact);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('EMPLOYEE_EDIT') or hasRole('SYSTEM_ADMIN')")
    @Transactional
    public EmployeeResponse update(@PathVariable UUID id, @Valid @RequestBody EmployeeRequest request) {
        Employee employee = employees.findById(id).orElseThrow(() -> new NotFoundException("Employee not found"));
        apply(employee, request);
        Employee saved = employees.save(employee);
        EmergencyContact contact = saveEmergencyContact(saved.id, request.emergencyContact());
        return toResponse(saved, contact);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('EMPLOYEE_DELETE') or hasRole('SYSTEM_ADMIN')")
    @Transactional
    public void delete(@PathVariable UUID id) {
        if (!employees.existsById(id)) {
            throw new NotFoundException("Employee not found");
        }
        employees.clearAccountRoleCreatedByReferences(id);
        employees.clearRolePermissionCreatedByReferences(id);
        employees.deleteAccountsByEmployeeId(id);
        employees.clearDepartmentManagerReferences(id);
        employees.clearEmployeeManagerReferences(id);
        emergencyContacts.deleteByEmployeeId(id);
        employees.deleteById(id);
    }

    private void apply(Employee employee, EmployeeRequest request) {
        employee.employeeNo = request.employeeNo();
        employee.fullName = request.fullName();
        employee.gender = request.gender();
        employee.dateOfBirth = request.dateOfBirth();
        employee.marriedStatus = request.marriedStatus();
        employee.addressProvince = request.addressProvince();
        employee.addressCity = request.addressCity();
        employee.addressDistrict = request.addressDistrict();
        employee.address = request.address();
        employee.phone = request.phone();
        employee.photo = request.photo();
        employee.departmentId = request.departmentId();
        employee.managerId = request.managerId();
        employee.jobTitle = request.jobTitle();
        employee.hireDate = request.hireDate();
        employee.terminationDate = request.terminationDate();
        employee.status = request.status();
    }

    private EmergencyContact saveEmergencyContact(UUID employeeId, EmergencyContactRequest request) {
        EmergencyContact contact = emergencyContacts.findByEmployeeId(employeeId).orElseGet(EmergencyContact::new);
        contact.employeeId = employeeId;
        contact.fullName = request.fullName();
        contact.phone = request.phone();
        contact.relation = request.relation();
        return emergencyContacts.save(contact);
    }

    private EmployeeResponse toResponse(Employee employee, EmergencyContact contact) {
        return new EmployeeResponse(
                employee.id,
                employee.employeeNo,
                employee.fullName,
                employee.gender,
                employee.dateOfBirth,
                employee.marriedStatus,
                employee.addressProvince,
                employee.addressCity,
                employee.addressDistrict,
                employee.address,
                employee.phone,
                employee.photo,
                employee.departmentId,
                employee.managerId,
                employee.jobTitle,
                employee.hireDate,
                employee.terminationDate,
                employee.status,
                employee.createdAt,
                employee.updatedAt,
                contact == null ? null : new EmergencyContactResponse(
                        contact.id,
                        contact.fullName,
                        contact.phone,
                        contact.relation));
    }

    public record EmployeeRequest(
            @NotBlank String employeeNo,
            @NotBlank String fullName,
            @NotNull GenderType gender,
            @NotNull LocalDate dateOfBirth,
            MarriedStatus marriedStatus,
            String addressProvince,
            String addressCity,
            String addressDistrict,
            String address,
            @NotBlank @Pattern(regexp = "\\d{11}", message = "Phone must be 11 digits") String phone,
            @Size(max = 30000000, message = "Photo must be 20MB or smaller")
            @Pattern(regexp = "^data:image/(png|jpeg|gif|webp|bmp);base64,[A-Za-z0-9+/=]+$", message = "Photo must be an uploaded image file")
            String photo,
            UUID departmentId,
            UUID managerId,
            String jobTitle,
            LocalDate hireDate,
            LocalDate terminationDate,
            @NotNull EmployeeStatus status,
            @NotNull @Valid EmergencyContactRequest emergencyContact) {
    }

    public record EmergencyContactRequest(
            @NotBlank String fullName,
            @NotBlank @Pattern(regexp = "\\d{11}", message = "Phone must be 11 digits") String phone,
            @NotBlank String relation) {
    }

    public record EmployeeResponse(
            UUID id,
            String employeeNo,
            String fullName,
            GenderType gender,
            LocalDate dateOfBirth,
            MarriedStatus marriedStatus,
            String addressProvince,
            String addressCity,
            String addressDistrict,
            String address,
            String phone,
            String photo,
            UUID departmentId,
            UUID managerId,
            String jobTitle,
            LocalDate hireDate,
            LocalDate terminationDate,
            EmployeeStatus status,
            java.time.OffsetDateTime createdAt,
            java.time.OffsetDateTime updatedAt,
            EmergencyContactResponse emergencyContact) {
    }

    public record EmergencyContactResponse(
            UUID id,
            String fullName,
            String phone,
            String relation) {
    }
}
