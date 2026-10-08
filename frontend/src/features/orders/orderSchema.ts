export type OrderField = {
  name: string;
  label: string;
  required?: boolean;
  maxLength?: number;
  type?: "date" | "boolean";
  options?: string[];
  multiline?: boolean;
};
export const orderStatuses = ["草稿", "待审核", "生产中", "生产中（延误）", "待出货", "已结清", "已发货", "完成"];

export function formatOrderStatus(status: unknown) {
  return status === "待出货" ? "待结清" : String(status ?? "");
}

const orderStatusPermissions: Record<string, string> = {
  "草稿": "ORDER_CREATE",
  "待审核": "ORDER_REVIEW",
  "生产中": "ORDER_PRODUCTION",
  "生产中（延误）": "ORDER_PRODUCTION",
  "待出货": "ORDER_SHIPPING",
  "已结清": "ORDER_SETTLE",
  "已发货": "ORDER_SHIPPING",
  "完成": "ORDER_COMPLETE",
};

const nextOrderStatuses: Record<string, string[]> = {
  "草稿": ["待审核"],
  "待审核": ["生产中"],
  "生产中": ["生产中（延误）", "待出货"],
  "生产中（延误）": ["生产中", "待出货"],
  "待出货": ["已结清"],
  "已结清": ["已发货"],
  "已发货": ["完成"],
  "完成": [],
};

export function availableOrderStatuses(
  authorities: string[],
  currentStatus: unknown,
  isNew: boolean,
) {
  if (isNew) return ["草稿"];
  const current = String(currentStatus ?? "");
  const isSystemAdmin = authorities.includes("ROLE_SYSTEM_ADMIN");
  return [
    current,
    ...(nextOrderStatuses[current] ?? []).filter(
      (status) => isSystemAdmin || authorities.includes(orderStatusPermissions[status]),
    ),
  ];
}

export const orderFields: OrderField[] = [
  {"name":"customerName","label":"客户或代理","required":true,"maxLength":200},
  {"name":"contractNumber","label":"合同号","required":true,"maxLength":100},
  {"name":"machineModels","label":"机型","required":true,"maxLength":2000,"multiline":true},
  {"name":"status","label":"订单状态","required":true,"options":orderStatuses},
  {"name":"voltage","label":"电伏电压","maxLength":100},
  {"name":"xyMotor","label":"XY轴电机","maxLength":50,"options":["汇川","松下"]},
  {"name":"zMotor","label":"Z轴电机","maxLength":50,"options":["汇川","安川"]},
  {"name":"packaging","label":"包装方式","maxLength":50,"options":["薄膜","木托","木箱","其他"]},
  {"name":"nameplate","label":"铭牌方式","maxLength":50,"options":["恒昌铭牌","客户铭牌"]},
  {"name":"systemHeading","label":"系统抬头","maxLength":50,"options":["恒昌","客户"]},
  {"name":"systemLanguage","label":"语言系统","maxLength":50,"options":["中文","英文","其他"]},
  {"name":"deliveryMethod","label":"配送方式","maxLength":100,"options":["客户安排货柜","我司安排货柜","我司安排车"]},
  {"name":"customized","label":"是否订制","type":"boolean"},
  {"name":"customRequirements","label":"订制要求","maxLength":4000,"multiline":true},
  {"name":"equipment","label":"配备","maxLength":50,"options":["无","卷布机","稳压机","空压机","减震器","编带","其他"]},
  {"name":"photoBeforePacking","label":"打包前拍照","type":"boolean"},
  {"name":"beamStyle","label":"横梁款式","maxLength":50,"options":["3300款","2500款"]},
  {"name":"manualLanguage","label":"说明书","maxLength":50,"options":["中文","英文","中英文","其他"]},
  {"name":"remarks","label":"备注","maxLength":4000,"multiline":true},
  {"name":"expectedDate","label":"预计生产完成日期","required":true,"type":"date"},
  {"name":"completedDate","label":"实际生产完成日期","type":"date"},
  {"name":"preparedBy","label":"制单人","required":true,"maxLength":100},
  {"name":"reviewedBy","label":"审核人","required":true,"maxLength":100},
  {"name":"orderDate","label":"制单日期","required":true,"type":"date"},
];
export type OrderRecord = Record<string, string | boolean | null | undefined> & { id?: string };
export type EmployeeOption = { id: string; fullName: string };
export type MachineModelEntry = { model: string; quantity: number | ""; configuration: string };

export function parseMachineModels(value: unknown, configurations: unknown, legacyConfiguration: unknown): MachineModelEntry[] {
  const configurationByModel = parseMachineModelConfigurations(configurations);
  const items = String(value ?? "").split(",").map(item => item.trim()).filter(Boolean);
  const entries: MachineModelEntry[] = [];
  for (const item of items) {
    const match = item.match(/^(.+?)\s*\((\d+)\s*台\)$/);
    if (match && match[1].trim()) {
      const model = match[1].trim();
      entries.push({ model, quantity: Number(match[2]), configuration: configurationByModel.get(model) ?? String(legacyConfiguration ?? "") });
    }
  }
  return entries.length ? entries : [{ model: "", quantity: 1, configuration: "" }];
}

export function serializeMachineModels(entries: MachineModelEntry[]) {
  return entries
    .filter(entry => entry.model && Number.isInteger(entry.quantity) && Number(entry.quantity) > 0)
    .map(entry => `${entry.model} (${entry.quantity}台)`)
    .join(", ");
}

export function serializeMachineModelConfigurations(entries: MachineModelEntry[]) {
  return JSON.stringify(entries
    .filter(entry => entry.model)
    .map(entry => ({ model: entry.model, configuration: entry.configuration.trim() || null })));
}

function parseMachineModelConfigurations(value: unknown) {
  const configurations = new Map<string, string>();
  try {
    const entries: unknown = JSON.parse(String(value ?? "[]"));
    if (Array.isArray(entries)) {
      entries.forEach(entry => {
        if (entry && typeof entry === "object" && typeof entry.model === "string" && typeof entry.configuration === "string") {
          configurations.set(entry.model, entry.configuration);
        }
      });
    }
  } catch {
    // Orders created before per-model configurations intentionally show empty fields.
  }
  return configurations;
}

export function validateMachineModels(entries: MachineModelEntry[]) {
  if (!entries.length || !entries.some(entry => entry.model)) return "请至少添加一项机型";
  if (entries.some(entry => !entry.model)) return "请选择机型";
  if (entries.some(entry => !Number.isInteger(entry.quantity) || Number(entry.quantity) < 1)) return "数量必须为大于等于 1 的整数";
  return "";
}
export const orderSections = [
  { title: "客户与合同", fields: ["customerName", "contractNumber", "machineModels", "status"] },
  { title: "机器配置", fields: ["xyMotor", "zMotor", "beamStyle"] },
  { title: "电伏电压", fields: ["voltage"] },
  { title: "包装与交付", fields: ["packaging", "nameplate", "systemHeading", "systemLanguage", "deliveryMethod", "equipment", "manualLanguage", "photoBeforePacking"] },
  { title: "订制与备注", fields: ["customized", "customRequirements", "remarks"] },
  { title: "日期与签署", fields: ["orderDate", "expectedDate", "completedDate", "preparedBy", "reviewedBy"] },
];
export function validateOrder(form: OrderRecord) {
  const errors: Record<string, string> = {};
  for (const field of orderFields) {
    const value = form[field.name];
    if (field.required && !String(value ?? "").trim()) errors[field.name] = `请填写${field.label}`;
    if (typeof value === "string" && field.maxLength && value.length > field.maxLength)
      errors[field.name] = `${field.label}不能超过${field.maxLength}个字符`;
    if (field.options && value && !field.options.includes(String(value))) errors[field.name] = "请选择有效选项";
    if (field.type === "date" && value && !/^\d{4}-\d{2}-\d{2}$/.test(String(value)))
      errors[field.name] = "请输入有效日期";
  }
  if (form.customized && !String(form.customRequirements ?? "").trim()) errors.customRequirements = "请填写订制要求";
  if (form.voltage && !/^\d{1,4}V\s+\d{1,4}HZ$/.test(String(form.voltage))) {
    errors.voltage = "电伏电压格式应为380V 50HZ";
  }
  return errors;
}
