package com.hcerp.erp.order;

import java.security.Principal;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.MethodArgumentNotValidException;
import com.hcerp.erp.account.AccountRepository;
import com.hcerp.erp.common.NotFoundException;
import com.hcerp.erp.employee.EmployeeRepository;
import com.hcerp.erp.notification.AppNotification;
import com.hcerp.erp.notification.NotificationPushPublisher;
import com.hcerp.erp.notification.NotificationRepository;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/orders")
public class OrderController {
    private final OrderRepository orders;
    private final EmployeeRepository employees;
    private final AccountRepository accounts;
    private final NotificationRepository notifications;
    private final NotificationPushPublisher notificationPushes;

    public OrderController(
            OrderRepository orders,
            EmployeeRepository employees,
            AccountRepository accounts,
            NotificationRepository notifications,
            NotificationPushPublisher notificationPushes) {
        this.orders = orders;
        this.employees = employees;
        this.accounts = accounts;
        this.notifications = notifications;
        this.notificationPushes = notificationPushes;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('ORDER_VIEW') or hasRole('SYSTEM_ADMIN')")
    public List<Order> list(
            @RequestParam(defaultValue = "published") String scope,
            @RequestParam(defaultValue = "all") String filter) {
        return switch (scope.toLowerCase(Locale.ROOT)) {
            case "published" -> listPublished(filter);
            case "drafts" -> {
                requireAuthority("ORDER_CREATE", "没有查看草稿订单的权限");
                yield orders.findByStatusAndCreatedByOrderByOrderDateDescCreatedAtDesc("草稿", currentUsername());
            }
            default -> throw new IllegalArgumentException("无效的订单列表范围");
        };
    }

    private List<Order> listPublished(String filter) {
        return switch (filter.toLowerCase(Locale.ROOT)) {
            case "all" -> orders.findByStatusNotOrderByOrderDateDescCreatedAtDesc("草稿");
            case "my-pending" -> myPendingOrders();
            default -> throw new IllegalArgumentException("无效的订单筛选条件");
        };
    }

    private List<Order> myPendingOrders() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        boolean isCreator = hasAuthority(authentication, "ORDER_CREATE");
        boolean isProcessor = hasAuthority(authentication, "ROLE_ORDER_PROCESSOR");
        if (!isCreator && !isProcessor) {
            throw new AccessDeniedException("没有查看待处理订单的权限");
        }
        String processorName = isProcessor
                ? employees.findFullNameByAccountUsername(currentUsername()).orElse("")
                : "";
        return orders.findMyPendingOrders(currentUsername(), processorName, isCreator, isProcessor);
    }

    @GetMapping("/summary")
    @PreAuthorize("hasAuthority('ORDER_VIEW') or hasRole('SYSTEM_ADMIN')")
    public OrderSummary summary(@RequestParam(defaultValue = "MONTH") String period) {
        SummaryPeriod selectedPeriod;
        try {
            selectedPeriod = SummaryPeriod.valueOf(period.toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new IllegalArgumentException("无效的统计周期");
        }
        LocalDate today = LocalDate.now();
        LocalDate periodStart = periodStart(selectedPeriod, today);
        Map<String, Long> counts = orders.findAll().stream()
                .filter(order -> canView(order, currentUsername()))
                .filter(order -> periodStart == null || isWithinPeriod(order.orderDate, periodStart, today))
                .collect(Collectors.groupingBy(order -> order.status, Collectors.counting()));
        return new OrderSummary(
                counts.getOrDefault("待审核", 0L),
                counts.getOrDefault("生产中", 0L),
                counts.getOrDefault("生产中（延误）", 0L),
                counts.getOrDefault("待出货", 0L),
                counts.getOrDefault("已结清", 0L),
                counts.getOrDefault("已发货", 0L),
                counts.getOrDefault("完成", 0L));
    }

    @GetMapping("/assignees")
    @PreAuthorize("hasAuthority('ORDER_VIEW') or hasRole('SYSTEM_ADMIN')")
    public OrderAssignees assignees(Principal principal) {
        return new OrderAssignees(
                employees.findOrderAssignees("ORDER_MANAGER", "ORDER_CREATE").stream()
                        .map(employee -> new EmployeeOption(employee.getId(), employee.getFullName()))
                        .toList(),
                employees.findOrderAssignees("ORDER_PROCESSOR", "ORDER_REVIEW").stream()
                        .map(employee -> new EmployeeOption(employee.getId(), employee.getFullName()))
                        .toList(),
                employees.findFullNameByAccountUsername(principal.getName()).orElse(null));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('ORDER_VIEW') or hasRole('SYSTEM_ADMIN')")
    public Order get(@PathVariable UUID id) {
        return findVisible(id, currentUsername());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('ORDER_CREATE') or hasRole('SYSTEM_ADMIN')")
    @Transactional
    public Order create(@Valid @RequestBody OrderRequest request, Principal principal) {
        Order order = new Order();
        order.createdBy = principal.getName();
        return saveDraftOrSubmit(order, request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ORDER_CREATE') or hasRole('SYSTEM_ADMIN')")
    @Transactional
    public Order updateDraft(@PathVariable UUID id, @Valid @RequestBody OrderRequest request) {
        Order order = findVisible(id, currentUsername());
        if (!"草稿".equals(order.status)) {
            throw new IllegalArgumentException("只有草稿订单可以编辑");
        }
        return saveDraftOrSubmit(order, request);
    }

    private Order saveDraftOrSubmit(Order order, OrderRequest request) {
        boolean submitForReview = Boolean.TRUE.equals(request.submitForReview());
        if (submitForReview) {
            requireAuthority("ORDER_REVIEW", "没有创建待审核订单的权限");
        }
        apply(order, request, submitForReview ? "待审核" : "草稿");
        Order saved = orders.save(order);
        if (submitForReview) {
            notifyReviewer(saved);
        }
        return saved;
    }

    @PatchMapping("/{id}/status")
    @Transactional
    public Order updateStatus(@PathVariable UUID id, @Valid @RequestBody OrderStatusRequest request) {
        Order order = findVisible(id, currentUsername());
        String previousStatus = order.status;
        requireProcessorAssignment(order);
        requireNextStatusPermission(order.status, request.status());
        boolean requiresCompletedDate = ("生产中".equals(order.status) || "生产中（延误）".equals(order.status))
                && "待出货".equals(request.status());
        if (requiresCompletedDate && request.completedDate() == null) {
            throw new IllegalArgumentException("流转至待出货时必须填写实际生产完成日期");
        }
        if (!requiresCompletedDate && request.completedDate() != null) {
            throw new IllegalArgumentException("实际生产完成日期只能在流转至待出货时填写");
        }
        order.status = request.status();
        if (requiresCompletedDate) {
            order.completedDate = request.completedDate();
        }
        Order saved = orders.save(order);
        notifyStatusHandoff(previousStatus, saved);
        return saved;
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAuthority('ORDER_DELETE') or hasRole('SYSTEM_ADMIN')")
    @Transactional
    public void delete(@PathVariable UUID id) {
        orders.delete(findVisible(id, currentUsername()));
    }

    private Order findVisible(UUID id, String username) {
        Order order = orders.findById(id).orElseThrow(() -> new NotFoundException("订单不存在"));
        if (!canView(order, username)) {
            throw new NotFoundException("订单不存在");
        }
        return order;
    }

    private static boolean canView(Order order, String username) {
        return !"草稿".equals(order.status) || username.equals(order.createdBy);
    }

    private static String currentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            throw new AccessDeniedException("未登录");
        }
        return authentication.getName();
    }

    private void requireProcessorAssignment(Order order) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) throw new AccessDeniedException("未登录");
        boolean isProcessor = authentication.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals("ROLE_ORDER_PROCESSOR"));
        boolean canProcessAllOrders = authentication.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals("ROLE_SYSTEM_ADMIN")
                        || authority.getAuthority().equals("ROLE_ORDER_MANAGER"));
        if (!isProcessor || canProcessAllOrders) return;
        String fullName = employees.findFullNameByAccountUsername(currentUsername())
                .orElseThrow(() -> new AccessDeniedException("当前账号未关联员工资料"));
        if (!fullName.equals(order.reviewedBy)) {
            throw new AccessDeniedException("只能处理分配给自己的订单");
        }
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, Object> validation(MethodArgumentNotValidException exception) {
        Map<String, String> errors = new LinkedHashMap<>();
        exception.getBindingResult().getFieldErrors().forEach(error ->
                errors.putIfAbsent(error.getField(), error.getDefaultMessage()));
        return Map.of("message", String.join("；", errors.values()), "fieldErrors", errors);
    }

    private void apply(Order order, OrderRequest request, String status) {
        if (Boolean.TRUE.equals(request.customized()) &&
                (request.customRequirements() == null || request.customRequirements().isBlank())) {
            throw new IllegalArgumentException("请填写订制要求");
        }
        if (request.beamStyle() != null && !request.machineModels().toUpperCase(java.util.Locale.ROOT).contains("HC3300")) {
            throw new IllegalArgumentException("横梁款式仅适用于HC3300系列");
        }
        order.customerName = clean(request.customerName());
        order.contractNumber = clean(request.contractNumber());
        order.machineModels = clean(request.machineModels());
        order.machineModelConfigurations = clean(request.machineModelConfigurations());
        order.machineConfiguration = clean(request.machineConfiguration());
        order.voltage = clean(request.voltage());
        order.xyMotor = clean(request.xyMotor());
        order.zMotor = clean(request.zMotor());
        order.packaging = clean(request.packaging());
        order.nameplate = clean(request.nameplate());
        order.systemHeading = clean(request.systemHeading());
        order.systemLanguage = clean(request.systemLanguage());
        order.deliveryMethod = clean(request.deliveryMethod());
        order.customized = request.customized();
        order.customRequirements = clean(request.customRequirements());
        order.equipment = clean(request.equipment());
        order.photoBeforePacking = request.photoBeforePacking();
        order.beamStyle = clean(request.beamStyle());
        order.manualLanguage = clean(request.manualLanguage());
        order.remarks = clean(request.remarks());
        order.expectedDate = request.expectedDate();
        order.completedDate = request.completedDate();
        order.preparedBy = clean(request.preparedBy());
        order.reviewedBy = clean(request.reviewedBy());
        order.orderDate = request.orderDate();
        order.status = status;
    }

    private void requireNextStatusPermission(String currentStatus, String status) {
        if (!nextStatuses(currentStatus).contains(status)) {
            throw new IllegalArgumentException("订单状态只能流转至下一阶段");
        }
        String permission = switch (status) {
            case "草稿" -> "ORDER_CREATE";
            case "待审核" -> "ORDER_REVIEW";
            case "生产中", "生产中（延误）" -> "ORDER_PRODUCTION";
            case "待出货", "已发货" -> "ORDER_SHIPPING";
            case "已结清" -> "ORDER_SETTLE";
            case "完成" -> "ORDER_COMPLETE";
            default -> throw new IllegalArgumentException("订单状态选项无效");
        };
        requireAuthority(permission, "没有更新订单至“" + status + "”的权限");
    }

    private void requireAuthority(String permission, String message) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        boolean authorized = hasAuthority(authentication, permission);
        if (!authorized) throw new AccessDeniedException(message);
    }

    private static boolean hasAuthority(Authentication authentication, String authority) {
        return authentication != null && authentication.getAuthorities().stream()
                .anyMatch(item -> item.getAuthority().equals(authority)
                        || item.getAuthority().equals("ROLE_SYSTEM_ADMIN"));
    }

    private static List<String> nextStatuses(String status) {
        return switch (status) {
            case "草稿" -> List.of("待审核");
            case "待审核" -> List.of("生产中");
            case "生产中" -> List.of("生产中（延误）", "待出货");
            case "生产中（延误）" -> List.of("生产中", "待出货");
            case "待出货" -> List.of("已结清");
            case "已结清" -> List.of("已发货");
            case "已发货" -> List.of("完成");
            case "完成" -> List.of();
            default -> throw new IllegalArgumentException("订单状态选项无效");
        };
    }

    private static String clean(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private void notifyReviewer(Order order) {
        if (order.reviewedBy == null) return;
        accounts.findIdByEmployeeFullName(order.reviewedBy).ifPresent(accountId -> {
            sendNotification(accountId, "订单待审核", "订单「" + order.contractNumber + "」已提交待审核，请及时处理。", "ORDER_REVIEW");
        });
    }

    private void notifyStatusHandoff(String previousStatus, Order order) {
        if ("待出货".equals(order.status)
                && ("生产中".equals(previousStatus) || "生产中（延误）".equals(previousStatus))) {
            accounts.findByUsername(order.createdBy)
                    .map(account -> account.id)
                    .ifPresent(accountId -> sendNotification(
                            accountId,
                            "订单待结清",
                            "订单「" + order.contractNumber + "」已生产完毕，请及时结清。",
                            "ORDER_SETTLE"));
        }
        if ("已结清".equals(order.status) && "待出货".equals(previousStatus) && order.reviewedBy != null) {
            accounts.findIdByEmployeeFullName(order.reviewedBy).ifPresent(accountId -> sendNotification(
                    accountId,
                    "订单待出货",
                    "订单「" + order.contractNumber + "」已结清，请及时安排出货。",
                    "ORDER_SHIPPING"));
        }
    }

    private void sendNotification(UUID accountId, String title, String content, String type) {
        AppNotification notification = new AppNotification();
        notification.accountId = accountId;
        notification.title = title;
        notification.content = content;
        notification.type = type;
        notificationPushes.publishAfterCommit(notifications.save(notification));
    }

    private static LocalDate periodStart(SummaryPeriod period, LocalDate today) {
        return switch (period) {
            case MONTH -> today.withDayOfMonth(1);
            case QUARTER -> LocalDate.of(today.getYear(), ((today.getMonthValue() - 1) / 3) * 3 + 1, 1);
            case YEAR -> today.withDayOfYear(1);
            case ALL -> null;
        };
    }

    private static boolean isWithinPeriod(LocalDate orderDate, LocalDate start, LocalDate end) {
        return orderDate != null && !orderDate.isBefore(start) && !orderDate.isAfter(end);
    }

    public record EmployeeOption(UUID id, String fullName) {
    }

    public record OrderAssignees(
            List<EmployeeOption> preparedBy,
            List<EmployeeOption> reviewedBy,
            String currentPreparedBy) {
    }

    public record OrderSummary(
            long pendingReview,
            long inProduction,
            long productionDelayed,
            long readyToShip,
            long settled,
            long shipped,
            long completed) {
    }

    private enum SummaryPeriod { MONTH, QUARTER, YEAR, ALL }
}
