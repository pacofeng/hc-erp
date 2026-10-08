package com.hcerp.erp.order;

import java.util.List;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.*;
import org.mockito.ArgumentCaptor;
import org.springframework.context.annotation.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import com.hcerp.erp.account.AccountRepository;
import com.hcerp.erp.common.ApiExceptionHandler;
import com.hcerp.erp.employee.EmployeeRepository;
import com.hcerp.erp.notification.AppNotification;
import com.hcerp.erp.notification.NotificationPushPublisher;
import com.hcerp.erp.notification.NotificationRepository;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class OrderControllerTest {
    private AnnotationConfigApplicationContext context;
    private OrderController controller;
    private OrderRepository repository;
    private EmployeeRepository employees;
    private AccountRepository accounts;
    private NotificationRepository notifications;
    private NotificationPushPublisher notificationPushes;
    private MockMvc mvc;
    private final UUID id = UUID.randomUUID();
    private static final String VALID = """
            {"customerName":"测试客户","contractNumber":"HC-TEST","machineModels":"HC3300H (1台)",
             "preparedBy":"制单员","reviewedBy":"审核员","expectedDate":"2026-10-11","orderDate":"2026-09-11","xyMotor":"汇川","zMotor":"安川",
             "packaging":"木箱","systemLanguage":"英文","beamStyle":"2500款","status":"草稿"}
            """;

    @Configuration
    @EnableMethodSecurity
    static class Config {
        @Bean OrderRepository repository() {
            return mock(OrderRepository.class, withSettings().mockMaker("mock-maker-proxy"));
        }
        @Bean EmployeeRepository employees() {
            return mock(EmployeeRepository.class, withSettings().mockMaker("mock-maker-proxy"));
        }
        @Bean AccountRepository accounts() {
            return mock(AccountRepository.class, withSettings().mockMaker("mock-maker-proxy"));
        }
        @Bean NotificationRepository notifications() {
            return mock(NotificationRepository.class, withSettings().mockMaker("mock-maker-proxy"));
        }
        @Bean NotificationPushPublisher notificationPushes() {
            return mock(NotificationPushPublisher.class, withSettings().mockMaker("mock-maker-proxy"));
        }
        @Bean OrderController controller(
                OrderRepository repository,
                EmployeeRepository employees,
                AccountRepository accounts,
                NotificationRepository notifications,
                NotificationPushPublisher notificationPushes) {
            return new OrderController(repository, employees, accounts, notifications, notificationPushes);
        }
    }

    @BeforeEach void setup() {
        context = new AnnotationConfigApplicationContext(Config.class);
        controller = context.getBean(OrderController.class);
        repository = context.getBean(OrderRepository.class);
        employees = context.getBean(EmployeeRepository.class);
        accounts = context.getBean(AccountRepository.class);
        notifications = context.getBean(NotificationRepository.class);
        notificationPushes = context.getBean(NotificationPushPublisher.class);
        mvc = MockMvcBuilders.standaloneSetup(controller).setControllerAdvice(new ApiExceptionHandler()).build();
        when(repository.save(any())).thenAnswer(invocation -> {
            Order order = invocation.getArgument(0);
            order.id = id;
            return order;
        });
        when(notifications.save(any(AppNotification.class))).thenAnswer(invocation -> invocation.getArgument(0));
        authorize("ROLE_SYSTEM_ADMIN");
    }

    @AfterEach void cleanup() { SecurityContextHolder.clearContext(); context.close(); }

    private void authorize(String... permissions) {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                "tester", "", java.util.Arrays.stream(permissions).map(SimpleGrantedAuthority::new).toList()));
    }

    private static EmployeeRepository.OrderAssigneeProjection assignee(String fullName) {
        EmployeeRepository.OrderAssigneeProjection assignee = mock(EmployeeRepository.OrderAssigneeProjection.class);
        when(assignee.getId()).thenReturn(UUID.randomUUID());
        when(assignee.getFullName()).thenReturn(fullName);
        return assignee;
    }

    @Test void createsTemplateOrderAndPreservesOptions() throws Exception {
        authorize("ORDER_CREATE", "ORDER_VIEW");
        mvc.perform(post("/api/orders").principal(() -> "tester").contentType("application/json").content(VALID))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.contractNumber").value("HC-TEST"))
                .andExpect(jsonPath("$.zMotor").value("安川"))
                .andExpect(jsonPath("$.beamStyle").value("2500款"))
                .andExpect(jsonPath("$.status").value("草稿"))
                .andExpect(jsonPath("$.createdBy").value("tester"));
    }

    @Test void submitsNewOrderForReviewOnlyWithReviewPermission() throws Exception {
        authorize("ORDER_CREATE");
        mvc.perform(post("/api/orders").principal(() -> "tester").contentType("application/json")
                .content(VALID.replace("\"status\":\"草稿\"", "\"submitForReview\":true")))
                .andExpect(status().isForbidden());

        authorize("ROLE_SYSTEM_ADMIN");
        mvc.perform(post("/api/orders").principal(() -> "tester").contentType("application/json")
                .content(VALID.replace("\"status\":\"草稿\"", "\"submitForReview\":true")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("待审核"));
    }

    @Test void updatesOwnDraftAndCanSubmitItForReview() throws Exception {
        Order draft = new Order(); draft.id = id; draft.status = "草稿"; draft.createdBy = "tester";
        when(repository.findById(id)).thenReturn(Optional.of(draft));
        authorize("ORDER_CREATE");
        mvc.perform(put("/api/orders/" + id).contentType("application/json").content(VALID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("草稿"));

        authorize("ROLE_SYSTEM_ADMIN");
        mvc.perform(put("/api/orders/" + id).contentType("application/json")
                .content(VALID.replace("\"status\":\"草稿\"", "\"submitForReview\":true")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("待审核"));
    }

    @Test void notifiesTheAssignedReviewerWhenSubmittingForReview() throws Exception {
        UUID reviewerAccountId = UUID.randomUUID();
        when(accounts.findIdByEmployeeFullName("审核员")).thenReturn(Optional.of(reviewerAccountId));
        authorize("ROLE_SYSTEM_ADMIN");

        mvc.perform(post("/api/orders").principal(() -> "tester").contentType("application/json")
                .content(VALID.replace("\"status\":\"草稿\"", "\"submitForReview\":true")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("待审核"));

        ArgumentCaptor<AppNotification> notification = ArgumentCaptor.forClass(AppNotification.class);
        verify(notifications).save(notification.capture());
        verify(notificationPushes).publishAfterCommit(any(AppNotification.class));
        assertEquals(reviewerAccountId, notification.getValue().accountId);
        assertEquals("订单待审核", notification.getValue().title);
        assertEquals("ORDER_REVIEW", notification.getValue().type);
    }

    @Test void rejectsMissingFieldsAndUnsupportedOptions() throws Exception {
        mvc.perform(post("/api/orders").principal(() -> "tester").contentType("application/json").content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.customerName").value("客户或代理不能为空"))
                .andExpect(jsonPath("$.fieldErrors.contractNumber").value("合同号不能为空"));
        mvc.perform(post("/api/orders").principal(() -> "tester").contentType("application/json")
                .content(VALID.replace("木箱", "invalid"))).andExpect(status().isBadRequest());
        verify(repository, never()).save(any());
    }

    @Test void validatesCustomizationAndBeamApplicability() throws Exception {
        mvc.perform(post("/api/orders").principal(() -> "tester").contentType("application/json")
                .content(VALID.replace("\"packaging\"", "\"customized\":true,\"packaging\"")))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.message").value("请填写订制要求"));
        mvc.perform(post("/api/orders").principal(() -> "tester").contentType("application/json")
                .content(VALID.replace("HC3300H", "HC-QG-C")))
                .andExpect(status().isBadRequest());
        verify(repository, never()).save(any());
    }

    @Test void readsUpdatesAndDeletesExistingOrder() throws Exception {
        Order order = new Order(); order.id = id; order.createdBy = "original"; order.status = "待审核";
        when(repository.findById(id)).thenReturn(Optional.of(order));
        when(repository.findByStatusNotOrderByOrderDateDescCreatedAtDesc("草稿")).thenReturn(List.of(order));
        authorize("ORDER_VIEW");
        mvc.perform(get("/api/orders")).andExpect(status().isOk()).andExpect(jsonPath("$[0].id").value(id.toString()));
        mvc.perform(get("/api/orders/" + id)).andExpect(status().isOk());
        authorize("ORDER_PRODUCTION");
        mvc.perform(patch("/api/orders/" + id + "/status").contentType("application/json")
                .content("{\"status\":\"生产中\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.createdBy").value("original"));
        authorize("ORDER_DELETE");
        mvc.perform(delete("/api/orders/" + id)).andExpect(status().isNoContent());
        verify(repository).delete(order);
    }

    @Test void exposesRoleOrPermissionBasedOrderAssignees() throws Exception {
        EmployeeRepository.OrderAssigneeProjection preparedBy = assignee("陈晨");
        EmployeeRepository.OrderAssigneeProjection reviewedBy = assignee("王宁");
        when(employees.findOrderAssignees("ORDER_MANAGER", "ORDER_CREATE")).thenReturn(List.of(preparedBy));
        when(employees.findOrderAssignees("ORDER_PROCESSOR", "ORDER_REVIEW")).thenReturn(List.of(reviewedBy));
        when(employees.findFullNameByAccountUsername("tester")).thenReturn(Optional.of("陈晨"));
        authorize("ORDER_VIEW");
        mvc.perform(get("/api/orders/assignees").principal(() -> "tester"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.preparedBy[0].fullName").value("陈晨"))
                .andExpect(jsonPath("$.reviewedBy[0].fullName").value("王宁"))
                .andExpect(jsonPath("$.currentPreparedBy").value("陈晨"));
    }

    @Test void summarizesOrdersByStatus() throws Exception {
        Order draft = new Order(); draft.status = "草稿"; draft.createdBy = "tester"; draft.orderDate = LocalDate.now();
        Order pendingReview = new Order(); pendingReview.status = "待审核"; pendingReview.orderDate = LocalDate.now();
        Order inProduction = new Order(); inProduction.status = "生产中"; inProduction.orderDate = LocalDate.now();
        Order delayed = new Order(); delayed.status = "生产中（延误）"; delayed.orderDate = LocalDate.now();
        Order readyToShip = new Order(); readyToShip.status = "待出货"; readyToShip.orderDate = LocalDate.now();
        Order settled = new Order(); settled.status = "已结清"; settled.orderDate = LocalDate.now();
        Order shipped = new Order(); shipped.status = "已发货"; shipped.orderDate = LocalDate.now();
        Order completed = new Order(); completed.status = "完成"; completed.orderDate = LocalDate.now();
        Order previousMonth = new Order(); previousMonth.status = "完成"; previousMonth.orderDate = LocalDate.now().minusMonths(1);
        when(repository.findAll()).thenReturn(List.of(draft, pendingReview, inProduction, delayed, readyToShip, settled, shipped, completed, previousMonth));
        authorize("ORDER_VIEW");
        mvc.perform(get("/api/orders/summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.pendingReview").value(1))
                .andExpect(jsonPath("$.inProduction").value(1))
                .andExpect(jsonPath("$.productionDelayed").value(1))
                .andExpect(jsonPath("$.readyToShip").value(1))
                .andExpect(jsonPath("$.settled").value(1))
                .andExpect(jsonPath("$.shipped").value(1))
                .andExpect(jsonPath("$.completed").value(1));
        mvc.perform(get("/api/orders/summary").param("period", "ALL"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.completed").value(2));
    }

    @Test void onlyShowsDraftOrdersToTheirCreator() throws Exception {
        Order ownDraft = new Order(); ownDraft.id = UUID.randomUUID(); ownDraft.status = "草稿"; ownDraft.createdBy = "tester";
        Order anotherDraft = new Order(); anotherDraft.id = UUID.randomUUID(); anotherDraft.status = "草稿"; anotherDraft.createdBy = "other";
        Order published = new Order(); published.id = UUID.randomUUID(); published.status = "待审核"; published.createdBy = "other";
        when(repository.findByStatusNotOrderByOrderDateDescCreatedAtDesc("草稿")).thenReturn(List.of(published));
        when(repository.findByStatusAndCreatedByOrderByOrderDateDescCreatedAtDesc("草稿", "tester")).thenReturn(List.of(ownDraft));
        when(repository.findById(anotherDraft.id)).thenReturn(Optional.of(anotherDraft));
        when(repository.findAll()).thenReturn(List.of(ownDraft, anotherDraft, published));
        authorize("ORDER_VIEW");

        mvc.perform(get("/api/orders"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].status").value("待审核"));
        authorize("ROLE_SYSTEM_ADMIN");
        mvc.perform(get("/api/orders").param("scope", "drafts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].createdBy").value("tester"));
        mvc.perform(get("/api/orders/" + anotherDraft.id)).andExpect(status().isNotFound());
        mvc.perform(get("/api/orders/summary").param("period", "ALL"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.pendingReview").value(1));
    }

    @Test void listsOnlyCurrentUsersPendingOrders() throws Exception {
        Order creatorPending = new Order(); creatorPending.id = UUID.randomUUID(); creatorPending.status = "待出货"; creatorPending.createdBy = "tester";
        when(repository.findMyPendingOrders("tester", "", true, false)).thenReturn(List.of(creatorPending));
        authorize("ORDER_CREATE", "ORDER_VIEW");

        mvc.perform(get("/api/orders").param("filter", "my-pending"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].status").value("待出货"));

        Order processorPending = new Order(); processorPending.id = UUID.randomUUID(); processorPending.status = "已结清"; processorPending.reviewedBy = "审核员";
        when(employees.findFullNameByAccountUsername("tester")).thenReturn(Optional.of("审核员"));
        when(repository.findMyPendingOrders("tester", "审核员", false, true)).thenReturn(List.of(processorPending));
        authorize("ROLE_ORDER_PROCESSOR", "ORDER_VIEW");

        mvc.perform(get("/api/orders").param("filter", "my-pending"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].status").value("已结清"));
    }

    @Test void missingOrderReturns404() throws Exception {
        when(repository.findById(id)).thenReturn(Optional.empty());
        mvc.perform(get("/api/orders/" + id)).andExpect(status().isNotFound());
        mvc.perform(delete("/api/orders/" + id)).andExpect(status().isNotFound());
    }

    @Test void crudPermissionsAreIndependent() {
        authorize("ORDER_VIEW");
        assertThrows(AccessDeniedException.class, () -> controller.create(null, () -> "tester"));
        assertThrows(AccessDeniedException.class, () -> controller.delete(id));
        for (String permission : List.of("ORDER_CREATE", "ORDER_REVIEW", "ORDER_PRODUCTION", "ORDER_SHIPPING", "ORDER_SETTLE", "ORDER_COMPLETE", "ORDER_DELETE", "EMPLOYEE_VIEW")) {
            authorize(permission);
            assertThrows(AccessDeniedException.class, () -> controller.list("published", "all"));
            assertThrows(AccessDeniedException.class, () -> controller.get(id));
        }
        verifyNoInteractions(repository);
    }

    @Test void requiresThePermissionForTheTargetStatus() throws Exception {
        Order order = new Order(); order.id = id; order.status = "生产中";
        when(repository.findById(id)).thenReturn(Optional.of(order));

        authorize("ORDER_REVIEW");
        mvc.perform(patch("/api/orders/" + id + "/status").contentType("application/json")
                .content("{\"status\":\"待出货\"}"))
                .andExpect(status().isForbidden());

        authorize("ORDER_PRODUCTION");
        mvc.perform(patch("/api/orders/" + id + "/status").contentType("application/json")
                .content("{\"status\":\"生产中（延误）\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("生产中（延误）"));
    }

    @Test void processorCanOnlyProcessOrdersAssignedToThem() throws Exception {
        Order order = new Order(); order.id = id; order.status = "待审核"; order.reviewedBy = "审核员";
        when(repository.findById(id)).thenReturn(Optional.of(order));
        when(employees.findFullNameByAccountUsername("tester")).thenReturn(Optional.of("另一位处理员"));
        authorize("ROLE_ORDER_PROCESSOR", "ORDER_PRODUCTION");

        mvc.perform(patch("/api/orders/" + id + "/status").contentType("application/json")
                .content("{\"status\":\"生产中\"}"))
                .andExpect(status().isForbidden());

        when(employees.findFullNameByAccountUsername("tester")).thenReturn(Optional.of("审核员"));
        mvc.perform(patch("/api/orders/" + id + "/status").contentType("application/json")
                .content("{\"status\":\"生产中\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("生产中"));
    }

    @Test void requiresCompletedDateWhenMovingToReadyToShip() throws Exception {
        Order order = new Order(); order.id = id; order.status = "生产中";
        when(repository.findById(id)).thenReturn(Optional.of(order));
        authorize("ORDER_SHIPPING");

        mvc.perform(patch("/api/orders/" + id + "/status").contentType("application/json")
                .content("{\"status\":\"待出货\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("流转至待出货时必须填写实际生产完成日期"));

        mvc.perform(patch("/api/orders/" + id + "/status").contentType("application/json")
                .content("{\"status\":\"待出货\",\"completedDate\":\"2026-10-12\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.completedDate").value("2026-10-12"));
    }

    @Test void notifiesCreatorToSettleThenReviewerToShip() throws Exception {
        UUID creatorAccountId = UUID.randomUUID();
        UUID reviewerAccountId = UUID.randomUUID();
        Order order = new Order();
        order.id = id;
        order.status = "生产中";
        order.createdBy = "creator";
        order.reviewedBy = "审核员";
        order.contractNumber = "HC-TEST";
        when(repository.findById(id)).thenReturn(Optional.of(order));
        com.hcerp.erp.account.Account creator = new com.hcerp.erp.account.Account();
        creator.id = creatorAccountId;
        when(accounts.findByUsername("creator")).thenReturn(Optional.of(creator));
        when(accounts.findIdByEmployeeFullName("审核员")).thenReturn(Optional.of(reviewerAccountId));

        authorize("ORDER_SHIPPING");
        mvc.perform(patch("/api/orders/" + id + "/status").contentType("application/json")
                .content("{\"status\":\"待出货\",\"completedDate\":\"2026-10-12\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("待出货"));

        ArgumentCaptor<AppNotification> settleNotification = ArgumentCaptor.forClass(AppNotification.class);
        verify(notifications).save(settleNotification.capture());
        assertEquals(creatorAccountId, settleNotification.getValue().accountId);
        assertEquals("ORDER_SETTLE", settleNotification.getValue().type);

        clearInvocations(notifications, notificationPushes);
        authorize("ORDER_SETTLE");
        mvc.perform(patch("/api/orders/" + id + "/status").contentType("application/json")
                .content("{\"status\":\"已结清\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("已结清"));

        ArgumentCaptor<AppNotification> shippingNotification = ArgumentCaptor.forClass(AppNotification.class);
        verify(notifications).save(shippingNotification.capture());
        assertEquals(reviewerAccountId, shippingNotification.getValue().accountId);
        assertEquals("ORDER_SHIPPING", shippingNotification.getValue().type);
    }
}
