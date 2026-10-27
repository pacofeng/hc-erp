package com.hcerp.erp.productcategory;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProductCategoryRepository extends JpaRepository<ProductCategory, UUID> {
    @Query("""
            SELECT category FROM ProductCategory category
            ORDER BY CASE category.name
                WHEN '无梭机' THEN 1
                WHEN '单针机' THEN 2
                WHEN '有梭机' THEN 3
                WHEN '裁剪机' THEN 4
                WHEN '堆叠机' THEN 5
                WHEN '小机器' THEN 6
                WHEN '材料' THEN 7
                ELSE 999
            END, category.name
            """)
    List<ProductCategory> findAllInBusinessOrder();

    @Query("""
            SELECT category FROM ProductCategory category
            WHERE category.status = :status
            ORDER BY CASE category.name
                WHEN '无梭机' THEN 1
                WHEN '单针机' THEN 2
                WHEN '有梭机' THEN 3
                WHEN '裁剪机' THEN 4
                WHEN '堆叠机' THEN 5
                WHEN '小机器' THEN 6
                WHEN '材料' THEN 7
                ELSE 999
            END, category.name
            """)
    List<ProductCategory> findByStatusInBusinessOrder(@Param("status") String status);
}
