package com.hcerp.erp.order;

import java.time.LocalDate;
import jakarta.validation.constraints.*;

public record OrderRequest(
        @NotBlank(message = "客户或代理不能为空") @Size(max = 200, message = "客户或代理不能超过200个字符")
        String customerName,
        @NotBlank(message = "合同号不能为空") @Size(max = 100, message = "合同号不能超过100个字符")
        String contractNumber,
        @NotBlank(message = "机型不能为空") @Size(max = 2000, message = "机型不能超过2000个字符")
        String machineModels,
        @Size(max = 20000, message = "机型配置不能超过20000个字符")
        String machineModelConfigurations,
        @Size(max = 4000, message = "机器配置不能超过4000个字符")
        String machineConfiguration,
        @Pattern(regexp = "\\d{1,4}V\\s+\\d{1,4}HZ", message = "电伏电压格式应为380V 50HZ")
        String voltage,
        @Size(max = 50, message = "XY轴电机不能超过50个字符") @Pattern(regexp = "汇川|松下", message = "XY轴电机选项无效")
        String xyMotor,
        @Size(max = 50, message = "Z轴电机不能超过50个字符") @Pattern(regexp = "汇川|安川", message = "Z轴电机选项无效")
        String zMotor,
        @Size(max = 50, message = "包装方式不能超过50个字符") @Pattern(regexp = "薄膜|木托|木箱|其他", message = "包装方式选项无效")
        String packaging,
        @Size(max = 50, message = "铭牌方式不能超过50个字符") @Pattern(regexp = "恒昌铭牌|客户铭牌", message = "铭牌方式选项无效")
        String nameplate,
        @Size(max = 50, message = "系统抬头不能超过50个字符") @Pattern(regexp = "恒昌|客户", message = "系统抬头选项无效")
        String systemHeading,
        @Size(max = 50, message = "语言系统不能超过50个字符") @Pattern(regexp = "中文|英文|其他", message = "语言系统选项无效")
        String systemLanguage,
        @Size(max = 100, message = "配送方式不能超过100个字符") @Pattern(regexp = "客户安排货柜|我司安排货柜|我司安排车", message = "配送方式选项无效")
        String deliveryMethod,
        
        Boolean customized,
        @Size(max = 4000, message = "订制要求不能超过4000个字符")
        String customRequirements,
        @Size(max = 50, message = "配备不能超过50个字符") @Pattern(regexp = "无|卷布机|稳压机|空压机|减震器|编带|其他", message = "配备选项无效")
        String equipment,
        
        Boolean photoBeforePacking,
        @Size(max = 50, message = "横梁款式不能超过50个字符") @Pattern(regexp = "3300款|2500款", message = "横梁款式选项无效")
        String beamStyle,
        @Size(max = 50, message = "说明书不能超过50个字符") @Pattern(regexp = "中文|英文|中英文|其他", message = "说明书选项无效")
        String manualLanguage,
        @Size(max = 4000, message = "备注不能超过4000个字符")
        String remarks,
        
        @NotNull(message = "预计生产完成日期不能为空")
        LocalDate expectedDate,
        
        LocalDate completedDate,
        @NotBlank(message = "制单人不能为空") @Size(max = 100, message = "制单人不能超过100个字符")
        String preparedBy,
        @NotBlank(message = "审核不能为空") @Size(max = 100, message = "审核不能超过100个字符")
        String reviewedBy,
        @NotNull(message = "制单日期不能为空")
        LocalDate orderDate,
        @Pattern(regexp = "草稿|待审核|生产中|生产中（延误）|待出货|已结清|已发货|完成", message = "订单状态选项无效")
        String status,
        Boolean submitForReview
) { }
