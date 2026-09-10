import { useEffect, useState } from "react";
import { showToast } from "../../app/toast";
import {
  Box,
  Button,
  Divider,
  IconButton,
  Paper,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import SaveIcon from "@mui/icons-material/Save";
import { api } from "../../app/apiClient";
import {
  settingsFields,
  settingsFormSections,
  settingsSaveFields,
} from "../../app/schemaConfig";
import type { Translation } from "../../app/i18n";
import type { AnyRow, Language, Session } from "../../app/types";
import {
  FormSections,
  requestBodyFromFields,
  validateImageFields,
  validatePhoneFields,
} from "../resources/ResourcePanel";

export function SettingsPanel({
  session,
  language,
  t,
}: {
  session: Session;
  language: Language;
  t: Translation;
}) {
  const [form, setForm] = useState<AnyRow>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  async function load() {
    setError("");
    setSaved(false);
    setLoading(true);
    try {
      setForm(await api<AnyRow>("/settings/profile", session));
    } catch (err) {
      setError(err instanceof Error ? err.message : t.loadFailed);
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    setError("");
    setSaved(false);
    const validationError = validatePhoneFields(
      settingsSaveFields,
      form,
      t,
      "settings",
    );
    if (validationError) {
      setError(validationError);
      showToast(validationError, "error");
      return;
    }
    const imageValidationError = validateImageFields(
      settingsSaveFields,
      form,
      t,
    );
    if (imageValidationError) {
      setError(imageValidationError);
      showToast(imageValidationError, "error");
      return;
    }
    setSaving(true);
    try {
      const body = requestBodyFromFields(settingsSaveFields, form);
      setForm(
        await api<AnyRow>("/settings/profile", session, {
          method: "PUT",
          body: JSON.stringify(body),
        }),
      );
      setSaved(true);
      showToast(t.saved, "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : t.saveFailed;
      setError(message);
      showToast(message, "error");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <Paper sx={{ overflow: "hidden" }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
        sx={{ p: 2, alignItems: { sm: "center" } }}
      >
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {t.resources.settings}
          </Typography>
          {loading ? (
            <Skeleton width={140} />
          ) : (
            <Typography variant="body2" color="text.secondary">
              {String(form.username ?? session.username)}
            </Typography>
          )}
        </Box>
        <Tooltip title={t.refresh}>
          <span>
            <IconButton onClick={load} disabled={loading || saving}>
              <RefreshIcon />
            </IconButton>
          </span>
        </Tooltip>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={save}
          disabled={loading || saving}
        >
          {t.save}
        </Button>
      </Stack>
      <Divider />
      <Box sx={{ p: 2 }}>
        {loading ? (
          <Stack spacing={2}>
            <Skeleton variant="rounded" height={56} />
            <Skeleton variant="rounded" height={56} />
            <Skeleton variant="rounded" height={56} />
          </Stack>
        ) : (
          <Stack spacing={2}>
            <FormSections
              sections={settingsFormSections}
              fields={settingsFields}
              form={form}
              setForm={setForm}
              t={t}
              language={language}
              columns={3}
            />
            {saved && (
              <Typography color="success.main" variant="body2">
                {t.saved}
              </Typography>
            )}
            {error && (
              <Typography color="error" variant="body2">
                {error}
              </Typography>
            )}
          </Stack>
        )}
      </Box>
    </Paper>
  );
}
