package com.hcerp.erp.customer;

import java.util.List;
import java.util.UUID;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.hcerp.erp.common.NotFoundException;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

@RestController
@RequestMapping("/api/customers")
public class CustomerController {
    private final CustomerRepository customers;

    public CustomerController(CustomerRepository customers) {
        this.customers = customers;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('CUSTOMER_VIEW') or hasRole('SYSTEM_ADMIN')")
    public List<Customer> list() {
        return customers.findAllByOrderByCompanyNameAsc();
    }

    @PostMapping
    @PreAuthorize("hasAuthority('CUSTOMER_CREATE') or hasRole('SYSTEM_ADMIN')")
    public Customer create(@Valid @RequestBody CustomerRequest request) {
        Customer customer = new Customer();
        apply(customer, request);
        return customers.save(customer);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('CUSTOMER_EDIT') or hasRole('SYSTEM_ADMIN')")
    public Customer update(@PathVariable UUID id, @Valid @RequestBody CustomerRequest request) {
        Customer customer = customers.findById(id).orElseThrow(() -> new NotFoundException("客户不存在"));
        apply(customer, request);
        return customers.save(customer);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('CUSTOMER_DELETE') or hasRole('SYSTEM_ADMIN')")
    public void delete(@PathVariable UUID id) {
        if (!customers.existsById(id)) throw new NotFoundException("客户不存在");
        customers.deleteById(id);
    }

    private static void apply(Customer customer, CustomerRequest request) {
        customer.companyName = request.companyName().trim();
        customer.country = clean(request.country());
        customer.source = clean(request.source());
        customer.contactName = clean(request.contactName());
        customer.phone = clean(request.phone());
        customer.email = clean(request.email());
        customer.website = clean(request.website());
        customer.remarks = clean(request.remarks());
    }

    private static String clean(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    public record CustomerRequest(
            @NotBlank(message = "公司名称不能为空") @Size(max = 200, message = "公司名称不能超过200个字符") String companyName,
            @Size(max = 100, message = "国家不能超过100个字符") String country,
            @Size(max = 100, message = "来源不能超过100个字符") String source,
            @Size(max = 100, message = "联系人不能超过100个字符") String contactName,
            @Pattern(regexp = "\\d{11}", message = "电话必须为11位数字") String phone,
            @Email(message = "请输入有效的邮箱地址") @Size(max = 254, message = "邮箱不能超过254个字符") String email,
            @Pattern(regexp = "https?://.+", message = "公司网址必须以http://或https://开头") @Size(max = 500, message = "公司网址不能超过500个字符") String website,
            @Size(max = 4000, message = "备注不能超过4000个字符") String remarks) {
    }
}
