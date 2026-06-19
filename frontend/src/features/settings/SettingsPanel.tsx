import { useEffect, useState } from "react";
import { Button, IconButton } from "@/components/ui/button";
import { Box, Divider, Paper, Stack } from "@/components/ui/layout";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip } from "@/components/ui/tooltip";
import { Typography } from "@/components/ui/typography";
import { RefreshCw, Save } from "lucide-react";
import { api } from "../../app/apiClient";
import { useToast } from "../../app/toast";
import {
  settingsFields,
  settingsFormSections,
  settingsSaveFields,
} from "../../app/schemaConfig";
import {
  apiError,
  type Translation,
} from "../../app/i18n";
import type { AnyRow, Language, Session } from "../../app/types";
import {
  FormSections,
  type FieldErrorMap,
  type PanelErrorState,
  requestBodyFromFields,
  renderPanelError,
  validateFormFields,
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
  const [error, setError] = useState<PanelErrorState | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrorMap>({});
  const [saved, setSaved] = useState(false);
  const { showToast } = useToast();

  async function load() {
    setError(null);
    setFieldErrors({});
    setSaved(false);
    setLoading(true);
    try {
      setForm(await api<AnyRow>("/settings/profile", session));
    } catch (err) {
      const nextError = apiError(err, "loadFailed");
      setError(nextError);
      showToast({
        message: renderPanelError(nextError, t, language),
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    setError(null);
    setFieldErrors({});
    setSaved(false);
    const nextFieldErrors = validateFormFields(
      settingsSaveFields,
      form,
      "settings",
    );
    setFieldErrors(nextFieldErrors);
    if (Object.keys(nextFieldErrors).length) return;
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
      showToast({ message: t.saved, variant: "success" });
    } catch (err) {
      const nextError = apiError(err, "saveFailed");
      setError(nextError);
      showToast({
        message: renderPanelError(nextError, t, language),
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <Paper className="overflow-hidden">
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
        className="p-4 sm:items-center"
      >
        <Box className="flex-1">
          <Typography variant="h6">
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
              <RefreshCw size={16} />
            </IconButton>
          </span>
        </Tooltip>
        <Button
          variant="contained"
          startIcon={<Save size={16} />}
          onClick={save}
          disabled={loading || saving}
        >
          {t.save}
        </Button>
      </Stack>
      <Divider />
      <Box className="p-4">
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
              fieldErrors={fieldErrors}
              onFieldChange={(fieldName) =>
                setFieldErrors((current) => {
                  const next = { ...current };
                  delete next[fieldName];
                  return next;
                })
              }
              columns={3}
            />
            {saved && (
              <Typography color="success.main" variant="body2">
                {t.saved}
              </Typography>
            )}
            {error && (
              <Typography color="error" variant="body2">
                {renderPanelError(error, t, language)}
              </Typography>
            )}
          </Stack>
        )}
      </Box>
    </Paper>
  );
}
