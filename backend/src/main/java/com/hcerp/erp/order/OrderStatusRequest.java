package com.hcerp.erp.order;

import java.time.LocalDate;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record OrderStatusRequest(
        @NotBlank(message = "订单状态不能为空")
        @Pattern(
                regexp = "草稿|待审核|生产中|生产中（延误）|待出货|已结清|已发货|完成",
                message = "订单状态选项无效")
        String status,
        LocalDate completedDate) {
}
