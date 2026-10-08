# 订单管理

## 模板与范围

依据《下单.xlsx》的“下单模版”及其下拉选项表实现。Excel 原文件保持不变，示例合同与客户没有导入为正式订单。

页面路径：`/orders`。支持订单列表、搜索、单列排序、分页、详情、新增、编辑和确认删除。保存及删除显示中文结果提示。
列表默认每页 20 条，可选 5、10、20、30、40、50、100 条（MUI X Community 每页最多 100 条）。查询按客户/代理、合同号、机型、制单人匹配；当前与其他基础模块一致，列表 API 返回全部记录，前端分页和搜索。

## 字段

数据库表：`orders`。API 使用 camelCase，数据库使用 snake_case。

| 模板字段 | API 字段 | 数据库字段 | 类型 | 必填 | 选项 |
| --- | --- | --- | --- | --- | --- |
| 客户或代理 | `customerName` | `customer_name` | VARCHAR(200) | 是 |  |
| 合同号 | `contractNumber` | `contract_number` | VARCHAR(100) | 是 |  |
| 机型 | `machineModels` | `machine_models` | VARCHAR(2000) | 是 |  |
| 机器配置 | `machineConfiguration` | `machine_configuration` | VARCHAR(4000) | 否 |  |
| 电伏电压 | `voltage` | `voltage` | VARCHAR(100) | 否 |  |
| XY轴电机 | `xyMotor` | `xy_motor` | VARCHAR(50) | 否 | 汇川、松下 |
| Z轴电机 | `zMotor` | `z_motor` | VARCHAR(50) | 否 | 汇川、安川 |
| 包装方式 | `packaging` | `packaging` | VARCHAR(50) | 否 | 薄膜、木托、木箱、其他 |
| 铭牌方式 | `nameplate` | `nameplate` | VARCHAR(50) | 否 | 恒昌铭牌、客户铭牌 |
| 系统抬头 | `systemHeading` | `system_heading` | VARCHAR(50) | 否 | 恒昌、客户 |
| 语言系统 | `systemLanguage` | `system_language` | VARCHAR(50) | 否 | 中文、英文、其他 |
| 配送方式 | `deliveryMethod` | `delivery_method` | VARCHAR(100) | 否 | 客户安排货柜、我司安排货柜、我司安排车 |
| 是否订制 | `customized` | `customized` | BOOLEAN | 否 | 是/否 |
| 订制要求 | `customRequirements` | `custom_requirements` | VARCHAR(4000) | 否 |  |
| 配备 | `equipment` | `equipment` | VARCHAR(50) | 否 | 无、卷布机、稳压机、空压机、减震器、编带、其他 |
| 打包前拍照 | `photoBeforePacking` | `photo_before_packing` | BOOLEAN | 否 | 是/否 |
| 横梁款式 | `beamStyle` | `beam_style` | VARCHAR(50) | 否 | 3300款、2500款 |
| 说明书 | `manualLanguage` | `manual_language` | VARCHAR(50) | 否 | 中文、英文、中英文、其他 |
| 备注 | `remarks` | `remarks` | VARCHAR(4000) | 否 |  |
| 预计日期 | `expectedDate` | `expected_date` | DATE | 否 |  |
| 完成日期 | `completedDate` | `completed_date` | DATE | 否 |  |
| 制单人 | `preparedBy` | `prepared_by` | VARCHAR(100) | 是 |  |
| 审核 | `reviewedBy` | `reviewed_by` | VARCHAR(100) | 否 |  |
| 制单日期 | `orderDate` | `order_date` | DATE | 是 |  |

此外保存 UUID 主键、创建账号 `created_by`、创建时间和更新时间。账号标识由后端认证上下文获取，不能通过请求伪造。

模板未注明必填项，本实现将客户/代理、合同号、机型、制单人、制单日期设为必填。制单日期默认为当天、制单人默认为登录用户名，可以修改。合同号不强制唯一，允许同一合同分次下单。
机型和机器配置保留多行文本，可录入多种机型及各自数量，例如 `HC3300H (1台), HC-QG-C (1台)`。
是否订制为“是”时要求填写订制要求；横梁款式仅限机型包含 HC3300 的订单，修改为其他系列时清空横梁字段。
“配备”按 Excel 实现为单选。选择“其他”时可在备注中补充详情。
“审核”是模板中的文字记录，不代表已经执行审批；没有加入模板之外的审批流、库存、价格或付款功能。

## API 与权限

所有接口需要现有 JWT。系统管理员角色 `SYSTEM_ADMIN` 默认获得四项权限，并保留现有管理员角色访问规则。

`ORDER_MANAGER`（订单管理员）同样拥有全部四项下单权限。系统管理员可在“账号”的编辑对话框中将该角色分配给账号。此角色不授予员工、部门或账号管理权限。

`ORDER_CLERK`（订单文员）仅拥有 `ORDER_VIEW`，可查看订单列表和详情。仅分配此角色的账号不显示新增、编辑和删除按钮，后端同样拒绝这些操作。多个角色的权限会合并。

| 操作 | 方法与路径 | 权限 | 成功状态 |
| --- | --- | --- | --- |
| 列表 | GET /api/orders | ORDER_VIEW | 200 |
| 详情 | GET /api/orders/{id} | ORDER_VIEW | 200 |
| 新增 | POST /api/orders | ORDER_CREATE | 201 |
| 编辑 | PUT /api/orders/{id} | ORDER_EDIT | 200 |
| 删除 | DELETE /api/orders/{id} | ORDER_DELETE | 204 |

POST、PUT 接收字段表中的完整对象，日期为 `YYYY-MM-DD`，可选空字段为 null，开关为 JSON boolean。
列表返回对象数组，详情、新增、编辑返回订单对象（含 id 和审计字段）。
输入校验失败返回 400，订单不存在返回 404，无权访问返回 403；删除为物理删除，不影响其他订单。

菜单需要 ORDER_VIEW。新增、编辑、删除按钮分别依据对应权限显示。只有修改权限而没有查看权限的账号不会看到菜单，但接口权限仍独立校验。
管理员可在“角色”编辑对话框中分配新权限；新增权限所属模块为 ORDER。
权限调整后重新登录以刷新前端菜单权限；后端逐请求读取现有账号权限。

## 数据库迁移与验证

Flyway `V10__add_orders.sql` 创建订单表、模板选项 CHECK 约束和索引，扩展权限模块，插入四个 CRUD 权限，并关联 SYSTEM_ADMIN。
不会修改既有员工、部门、账号或合同数据。

Flyway `V12__add_order_manager_role.sql` 新增订单管理员角色，并确保系统管理员与订单管理员均关联四项下单权限；不自动分配给现有账号。

Flyway `V13__add_order_clerk_role.sql` 新增订单文员角色，并将此角色的权限限定为 `ORDER_VIEW`。

自动化测试覆盖必填项、无效下拉选项、订制要求、横梁适用范围、CRUD、404，以及权限隔离。实际 API 验收覆盖全部模板字段的保存回读，浏览器验收覆盖表单、中文提示、增删改查和响应式布局。
