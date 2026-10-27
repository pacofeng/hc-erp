import { useEffect, useState } from "react";
import { showToast } from "../../app/toast";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { api } from "../../app/apiClient";
import {
  settingsFields,
  settingsFormSections,
} from "../../app/schemaConfig";
import type { Translation } from "../../app/i18n";
import type { AnyRow, Language, Session } from "../../app/types";
import {
  FormSections,
} from "../resources/ResourcePanel";
import { PasswordTextField } from "../../components/AppChrome";

type SettingsTab = "account" | "personal" | "employment";
type SecurityAnswer = { question: string; answer: string };

const tabSectionKeys: Record<SettingsTab, string[]> = {
  account: ["accountInfo"],
  personal: ["personalInfo", "addressInfo", "emergencyContact"],
  employment: ["employmentInfo"],
};

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
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<SettingsTab>("account");
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [avatarRemoveConfirmOpen, setAvatarRemoveConfirmOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [securityQuestionOpen, setSecurityQuestionOpen] = useState(false);
  const [securityQuestions, setSecurityQuestions] = useState<string[]>([]);
  const [securityAnswers, setSecurityAnswers] = useState<SecurityAnswer[]>([
    { question: "", answer: "" },
    { question: "", answer: "" },
    { question: "", answer: "" },
  ]);
  const [securityCurrentPassword, setSecurityCurrentPassword] = useState("");
  const [securityQuestionError, setSecurityQuestionError] = useState("");
  const [changingSecurityQuestions, setChangingSecurityQuestions] = useState(false);

  async function load() {
    setError("");
    setLoading(true);
    try {
      setForm(await api<AnyRow>("/settings/profile", session));
    } catch (err) {
      setError(err instanceof Error ? err.message : t.loadFailed);
    } finally {
      setLoading(false);
    }
  }

  async function saveAvatar(avatar: string | null) {
    setError("");
    try {
      setForm(
        await api<AnyRow>("/settings/profile", session, {
          method: "PUT",
          body: JSON.stringify({ avatar }),
        }),
      );
      showToast(t.saved, "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : t.saveFailed;
      setError(message);
      showToast(message, "error");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function closeChangePassword(force = false) {
    if (changingPassword && !force) return;
    setChangePasswordOpen(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError("");
  }

  async function openSecurityQuestionDialog() {
    setSecurityQuestionOpen(true);
    setSecurityQuestionError("");
    setSecurityCurrentPassword("");
    if (securityQuestions.length) return;
    try {
      const result = await api<{ questions: string[] }>("/auth/security-questions/options");
      setSecurityQuestions(result.questions);
      setSecurityAnswers(result.questions.slice(0, 3).map((question) => ({ question, answer: "" })));
    } catch (err) {
      setSecurityQuestionError(err instanceof Error ? err.message : t.loadFailed);
    }
  }

  function closeSecurityQuestionDialog(force = false) {
    if (changingSecurityQuestions && !force) return;
    setSecurityQuestionOpen(false);
    setSecurityCurrentPassword("");
    setSecurityQuestionError("");
    setSecurityAnswers((current) => current.map((item) => ({ ...item, answer: "" })));
  }

  async function changeSecurityQuestions() {
    setSecurityQuestionError("");
    const selectedQuestions = securityAnswers.map((item) => item.question);
    if (!securityCurrentPassword || securityAnswers.some((item) => !item.question || !item.answer.trim())) {
      setSecurityQuestionError(`${t.requiredFields}${t.currentPassword}、${t.securityQuestion}、${t.securityAnswer}`);
      return;
    }
    if (new Set(selectedQuestions).size !== 3) {
      setSecurityQuestionError(t.updateSecurityQuestionsMessage);
      return;
    }
    setChangingSecurityQuestions(true);
    try {
      await api("/auth/change-security-questions", session, {
        method: "PUT",
        body: JSON.stringify({ currentPassword: securityCurrentPassword, answers: securityAnswers }),
      });
      setForm((current) => ({ ...current, securityQuestionsConfigured: true }));
      closeSecurityQuestionDialog(true);
      showToast(t.securityQuestionsUpdated, "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : t.saveFailed;
      setSecurityQuestionError(message);
      showToast(message, "error");
    } finally {
      setChangingSecurityQuestions(false);
    }
  }

  function securityQuestionLabel(question: string) {
    return t.securityQuestionLabels[question as keyof typeof t.securityQuestionLabels] ?? question;
  }

  async function changePassword() {
    setPasswordError("");
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError(`${t.requiredFields}${t.currentPassword}、${t.newPassword}、${t.confirmPassword}`);
      return;
    }
    if (newPassword.length < 8
      || !/[A-Za-z]/.test(newPassword)
      || !/\d/.test(newPassword)
      || !/[^A-Za-z0-9]/.test(newPassword)) {
      setPasswordError(t.passwordStrengthHint);
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(t.passwordsDoNotMatch);
      return;
    }
    setChangingPassword(true);
    try {
      await api("/auth/change-password", session, {
        method: "PUT",
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      closeChangePassword(true);
      showToast(t.passwordChanged, "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : t.saveFailed;
      setPasswordError(message);
      showToast(message, "error");
    } finally {
      setChangingPassword(false);
    }
  }

  return (
    <Paper sx={{ overflow: "hidden" }}>
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {t.resources.settings}
        </Typography>
      </Box>
      <Divider />
      <Tabs
        value={activeTab}
        onChange={(_, value: SettingsTab) => setActiveTab(value)}
        aria-label="设置资料分类"
        sx={{ px: 2, borderBottom: 1, borderColor: "divider" }}
      >
        <Tab value="account" label="账号信息" />
        <Tab value="personal" label="个人信息" />
        <Tab value="employment" label="雇佣信息" />
      </Tabs>
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
              sections={settingsFormSections.filter((section) =>
                tabSectionKeys[activeTab].includes(section.titleKey),
              )}
              fields={settingsFields.filter(
                (field) =>
                  field.name !== "terminationDate" ||
                  form.status === "TERMINATED" ||
                  form.status === "离职",
              )}
              form={form}
              setForm={setForm}
              t={t}
              language={language}
              columns={3}
              onImageChange={(fieldName, value) => {
                if (fieldName === "avatar") void saveAvatar(value);
              }}
              onImageRemove={(fieldName) => {
                if (fieldName === "avatar") setAvatarRemoveConfirmOpen(true);
              }}
              splitImageColumn={activeTab === "account"}
              splitImageColumnActionAfter="passwordChangedAt"
              splitImageColumnAction={
                activeTab === "account" ? (
                  <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                    <Button variant="outlined" onClick={() => setChangePasswordOpen(true)}>
                      {t.changePassword}
                    </Button>
                    <Button variant="outlined" onClick={() => void openSecurityQuestionDialog()}>
                      {t.updateSecurityQuestions}
                    </Button>
                  </Stack>
                ) : undefined
              }
            />
            {error && (
              <Typography color="error" variant="body2">
                {error}
              </Typography>
            )}
          </Stack>
        )}
      </Box>
      <Dialog open={changePasswordOpen} onClose={() => closeChangePassword()} maxWidth="xs" fullWidth>
        <DialogTitle>{t.changePassword}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <PasswordTextField label={t.currentPassword} value={currentPassword} onChange={setCurrentPassword} autoComplete="current-password" />
            <PasswordTextField label={t.newPassword} value={newPassword} onChange={setNewPassword} autoComplete="new-password" />
            <PasswordTextField label={t.confirmPassword} value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" />
            <Typography variant="caption" color="text.secondary">{t.passwordStrengthHint}</Typography>
            {passwordError && <Typography color="error" variant="body2">{passwordError}</Typography>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => closeChangePassword()} disabled={changingPassword}>{t.cancel}</Button>
          <Button variant="contained" onClick={() => void changePassword()} disabled={changingPassword}>{t.changePassword}</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={securityQuestionOpen} onClose={() => closeSecurityQuestionDialog()} maxWidth="sm" fullWidth>
        <DialogTitle>{t.updateSecurityQuestionsTitle}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary">{t.updateSecurityQuestionsMessage}</Typography>
            <PasswordTextField
              label={t.currentPassword}
              value={securityCurrentPassword}
              onChange={setSecurityCurrentPassword}
              autoComplete="current-password"
            />
            {securityAnswers.map((answer, index) => (
              <Stack key={index} spacing={1.5}>
                <FormControl fullWidth>
                  <InputLabel>{`${t.securityQuestion} ${index + 1}`}</InputLabel>
                  <Select
                    label={`${t.securityQuestion} ${index + 1}`}
                    value={answer.question}
                    onChange={(event) => setSecurityAnswers((current) => current.map((item, itemIndex) =>
                      itemIndex === index ? { ...item, question: event.target.value } : item,
                    ))}
                  >
                    {securityQuestions.map((question) => (
                      <MenuItem
                        key={question}
                        value={question}
                        disabled={securityAnswers.some((item, itemIndex) => itemIndex !== index && item.question === question)}
                      >
                        {securityQuestionLabel(question)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <PasswordTextField
                  label={`${t.securityAnswer} ${index + 1}`}
                  value={answer.answer}
                  onChange={(value) => setSecurityAnswers((current) => current.map((item, itemIndex) =>
                    itemIndex === index ? { ...item, answer: value } : item,
                  ))}
                  autoComplete="off"
                />
              </Stack>
            ))}
            {securityQuestionError && <Typography color="error" variant="body2">{securityQuestionError}</Typography>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => closeSecurityQuestionDialog()} disabled={changingSecurityQuestions}>{t.cancel}</Button>
          <Button variant="contained" onClick={() => void changeSecurityQuestions()} disabled={changingSecurityQuestions}>
            {t.save}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={avatarRemoveConfirmOpen} onClose={() => setAvatarRemoveConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{t.confirmRemoveAvatarTitle}</DialogTitle>
        <DialogContent>
          <Typography variant="body2">{t.confirmRemoveAvatarMessage}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAvatarRemoveConfirmOpen(false)}>{t.cancel}</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => {
              setAvatarRemoveConfirmOpen(false);
              setForm((current) => ({ ...current, avatar: null }));
              void saveAvatar(null);
            }}
          >
            {t.remove}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
