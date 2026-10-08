package com.hcerp.erp.order;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OrderRepository extends JpaRepository<Order, UUID> {
    List<Order> findByStatusNotOrderByOrderDateDescCreatedAtDesc(String status);

    List<Order> findByStatusAndCreatedByOrderByOrderDateDescCreatedAtDesc(String status, String createdBy);

    @Query("""
            select o from Order o
            where (:includeCreator = true and o.createdBy = :username and o.status = '待出货')
               or (:includeProcessor = true and o.reviewedBy = :processorName
                   and o.status not in ('草稿', '待出货', '完成'))
            order by o.orderDate desc, o.createdAt desc
            """)
    List<Order> findMyPendingOrders(
            @Param("username") String username,
            @Param("processorName") String processorName,
            @Param("includeCreator") boolean includeCreator,
            @Param("includeProcessor") boolean includeProcessor);
}
