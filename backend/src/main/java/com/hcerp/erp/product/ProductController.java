package com.hcerp.erp.product;

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
@RequestMapping("/api/products")
public class ProductController {
    private final ProductRepository products;

    public ProductController(ProductRepository products) {
        this.products = products;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('PRODUCT_VIEW') or hasRole('SYSTEM_ADMIN')")
    public List<Product> list() {
        return products.findAllByOrderByNameAsc();
    }

    @GetMapping("/active")
    @PreAuthorize("hasAuthority('PRODUCT_VIEW') or hasAuthority('ORDER_VIEW') or hasAuthority('ORDER_CREATE') or hasAuthority('ORDER_EDIT') or hasRole('SYSTEM_ADMIN')")
    public List<Product> listActive() {
        return products.findByStatusOrderByNameAsc("启用");
    }

    @PostMapping
    @PreAuthorize("hasAuthority('PRODUCT_CREATE') or hasRole('SYSTEM_ADMIN')")
    public Product create(@Valid @RequestBody ProductRequest request) {
        Product product = new Product();
        apply(product, request);
        return products.save(product);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('PRODUCT_EDIT') or hasRole('SYSTEM_ADMIN')")
    public Product update(@PathVariable UUID id, @Valid @RequestBody ProductRequest request) {
        Product product = products.findById(id).orElseThrow(() -> new NotFoundException("产品不存在"));
        apply(product, request);
        return products.save(product);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('PRODUCT_DELETE') or hasRole('SYSTEM_ADMIN')")
    public void delete(@PathVariable UUID id) {
        if (!products.existsById(id)) throw new NotFoundException("产品不存在");
        products.deleteById(id);
    }

    private static void apply(Product product, ProductRequest request) {
        product.name = request.name().trim();
        product.description = request.description() == null || request.description().isBlank() ? null : request.description().trim();
        product.status = request.status();
    }

    public record ProductRequest(
            @NotBlank(message = "产品名称不能为空") @Size(max = 200, message = "产品名称不能超过200个字符") String name,
            @Size(max = 4000, message = "产品描述不能超过4000个字符") String description,
            @NotBlank @Pattern(regexp = "启用|停用", message = "产品状态只能为启用或停用") String status) {
    }
}
