import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import { createRoot } from "react-dom/client";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { zhCN } from "@mui/x-date-pickers/locales";
import "dayjs/locale/zh-cn";
import { App } from "./app/App";

createRoot(document.getElementById("root")!).render(
  <LocalizationProvider
    dateAdapter={AdapterDayjs}
    adapterLocale="zh-cn"
    localeText={zhCN.components.MuiLocalizationProvider.defaultProps.localeText}
  >
    <App />
  </LocalizationProvider>,
);
