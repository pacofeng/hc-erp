package com.hcerp.erp.productcategory;

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
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

@RestController
@RequestMapping("/api/product-categories")
public class ProductCategoryController {
    private final ProductCategoryRepository productCategories;

    public ProductCategoryController(ProductCategoryRepository productCategories) {
        this.productCategories = productCategories;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('PRODUCT_VIEW') or hasRole('SYSTEM_ADMIN')")
    public List<ProductCategory> list() {
        return productCategories.findAllInBusinessOrder();
    }

    @GetMapping("/active")
    @PreAuthorize("hasAuthority('PRODUCT_VIEW') or hasAuthority('ORDER_VIEW') or hasAuthority('ORDER_CREATE') or hasAuthority('ORDER_EDIT') or hasRole('SYSTEM_ADMIN')")
    public List<ProductCategory> listActive() {
        return productCategories.findByStatusInBusinessOrder("启用");
    }

    @PostMapping
    @PreAuthorize("hasAuthority('PRODUCT_CREATE') or hasRole('SYSTEM_ADMIN')")
    public ProductCategory create(@Valid @RequestBody ProductCategoryRequest request) {
        ProductCategory productCategory = new ProductCategory();
        apply(productCategory, request);
        return productCategories.save(productCategory);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('PRODUCT_EDIT') or hasRole('SYSTEM_ADMIN')")
    public ProductCategory update(@PathVariable UUID id, @Valid @RequestBody ProductCategoryRequest request) {
        ProductCategory productCategory = productCategories.findById(id)
                .orElseThrow(() -> new NotFoundException("设备类别不存在"));
        apply(productCategory, request);
        return productCategories.save(productCategory);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('PRODUCT_DELETE') or hasRole('SYSTEM_ADMIN')")
    public void delete(@PathVariable UUID id) {
        if (!productCategories.existsById(id)) {
            throw new NotFoundException("设备类别不存在");
        }
        productCategories.deleteById(id);
    }

    private static void apply(ProductCategory productCategory, ProductCategoryRequest request) {
        productCategory.name = request.name().trim();
        productCategory.description = clean(request.description());
        productCategory.status = request.status();
    }

    private static String clean(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    public record ProductCategoryRequest(
            @NotBlank(message = "设备类别名称不能为空") @Size(max = 100, message = "设备类别名称不能超过100个字符") String name,
            @Size(max = 4000, message = "设备类别描述不能超过4000个字符") String description,
            @NotBlank @Pattern(regexp = "启用|停用", message = "设备类别状态只能为启用或停用") String status) {
    }
}
