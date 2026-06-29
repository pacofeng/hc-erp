import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormControl, FormHelperText } from "@/components/ui/form";
import { TextField } from "@/components/ui/input";
import { Box, Paper, Stack } from "@/components/ui/layout";
import { MenuItem, Select } from "@/components/ui/select";
import { Typography } from "@/components/ui/typography";
import { Save, Shield } from "lucide-react";
import { api } from "../../app/apiClient";
import { useToast } from "../../app/toast";
import {
  apiError,
  messages,
  messageError,
  renderLocalizedError,
  type LocalizedErrorState,
  type Translation,
} from "../../app/i18n";
import type { Language, Session } from "../../app/types";
import { PasswordTextField, PublicPageShell } from "../../components/AppChrome";

type FieldErrorMap = Partial<Record<string, LocalizedErrorState>>;

function requiredError() {
  return messageError("fieldRequired");
}

function fieldErrorText(
  fieldErrors: FieldErrorMap,
  fieldName: string,
  t: Translation,
  language: Language,
) {
  const error = fieldErrors[fieldName];
  return error ? renderLocalizedError(error, t, language) : undefined;
}

function clearFieldError(fieldErrors: FieldErrorMap, fieldName: string) {
  const nextFieldErrors = { ...fieldErrors };
  delete nextFieldErrors[fieldName];
  return nextFieldErrors;
}

export function Login({
  language,
  t,
  onLanguageChange,
  onLogin,
}: {
  language: Language;
  t: Translation;
  onLanguageChange: (language: Language) => Promise<void>;
  onLogin: (session: Session) => void;
}) {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState<LocalizedErrorState | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrorMap>({});
  const [forgotOpen, setForgotOpen] = useState(false);
  const [pendingPasswordResetSession, setPendingPasswordResetSession] =
    useState<Session | null>(null);
  const { showToast } = useToast();

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const nextFieldErrors: FieldErrorMap = {};
    if (!username.trim()) nextFieldErrors.username = requiredError();
    if (!password.trim()) nextFieldErrors.password = requiredError();
    setFieldErrors(nextFieldErrors);
    if (Object.keys(nextFieldErrors).length) return;
    try {
      const result = await api<Session>("/auth/login", undefined, {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      const accountLanguage =
        result.language === "en" || result.language === "zh-CN"
          ? result.language
          : language;
      const sessionWithAccountLanguage = { ...result, language: accountLanguage };
      if (accountLanguage !== language) {
        void onLanguageChange(accountLanguage);
      }
      if (result.mustChangePassword) {
        setPendingPasswordResetSession(sessionWithAccountLanguage);
        return;
      }
      onLogin(sessionWithAccountLanguage);
    } catch (err) {
      const nextError = apiError(err, "loginFailed");
      setFieldErrors({ password: nextError });
      showToast({
        message: renderLocalizedError(nextError, t, language),
        variant: "error",
      });
    }
  }

  return (
    <PublicPageShell
      language={language}
      t={t}
      onLanguageChange={onLanguageChange}
    >
      <Paper component="form" onSubmit={submit} noValidate className="w-full p-6">
        <Stack spacing={2.5}>
          <TextField
            label={t.username}
            value={username}
            onChange={(event) => {
              setUsername(event.target.value);
              setFieldErrors((current) => clearFieldError(current, "username"));
            }}
            required
            error={Boolean(fieldErrors.username)}
            helperText={fieldErrorText(fieldErrors, "username", t, language)}
          />
          <PasswordTextField
            label={t.password}
            value={password}
            onChange={(value) => {
              setPassword(value);
              setFieldErrors((current) => clearFieldError(current, "password"));
            }}
            autoComplete="current-password"
            required
            error={Boolean(fieldErrors.password)}
            helperText={fieldErrorText(fieldErrors, "password", t, language)}
          />
          <Box className="-mt-2">
            <Button
              type="button"
              variant="text"
              size="small"
              onClick={() => setForgotOpen(true)}
              className="px-0"
            >
              {t.forgotPassword}
            </Button>
          </Box>
          {error && (
            <Typography color="error" variant="body2">
              {renderLocalizedError(error, t, language)}
            </Typography>
          )}
          <Button
            type="submit"
            variant="contained"
            startIcon={<Shield size={16} />}
          >
            {t.signIn}
          </Button>
        </Stack>
        <ForgotPasswordDialog
          open={forgotOpen}
          initialUsername={username}
          language={language}
          t={t}
          onClose={() => setForgotOpen(false)}
        />
        {pendingPasswordResetSession && (
          <MustChangePasswordDialog
            session={pendingPasswordResetSession}
            language={pendingPasswordResetSession.language ?? language}
            t={messages[pendingPasswordResetSession.language ?? language]}
            onSaved={(nextSession) =>
              onLogin({
                ...nextSession,
                language: nextSession.language ?? pendingPasswordResetSession.language,
              })
            }
            onCancel={() => setPendingPasswordResetSession(null)}
          />
        )}
      </Paper>
    </PublicPageShell>
  );
}

function MustChangePasswordDialog({
  session,
  language,
  t,
  onSaved,
  onCancel,
}: {
  session: Session;
  language: Language;
  t: Translation;
  onSaved: (session: Session) => void;
  onCancel: () => void;
}) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrorMap>({});
  const [error, setError] = useState<LocalizedErrorState | null>(null);
  const { showToast } = useToast();

  async function save() {
    setError(null);
    const nextFieldErrors: FieldErrorMap = {};
    if (!newPassword.trim()) nextFieldErrors.newPassword = requiredError();
    if (!confirmPassword.trim()) nextFieldErrors.confirmPassword = requiredError();
    if (!isStrongPassword(newPassword)) {
      nextFieldErrors.newPassword = messageError("passwordStrengthHint");
    }
    if (newPassword !== confirmPassword) {
      nextFieldErrors.confirmPassword = messageError("passwordsDoNotMatch");
    }
    setFieldErrors(nextFieldErrors);
    if (Object.keys(nextFieldErrors).length) return;

    try {
      const nextSession = await api<Session>("/auth/change-password", session, {
        method: "PUT",
        body: JSON.stringify({ newPassword, confirmPassword }),
      });
      showToast({ message: t.passwordResetSuccess, variant: "success" });
      onSaved({ ...nextSession, mustChangePassword: false });
    } catch (err) {
      const nextError = apiError(err, "saveFailed");
      setError(nextError);
      showToast({
        message: renderLocalizedError(nextError, t, language),
        variant: "error",
      });
    }
  }

  return (
    <Dialog open maxWidth="sm" fullWidth>
      <DialogTitle>{t.mustChangePasswordTitle}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} className="pt-2">
          <Typography variant="body2">{t.mustChangePasswordMessage}</Typography>
          <PasswordTextField
            label={t.newPassword}
            value={newPassword}
            onChange={(value) => {
              setNewPassword(value);
              setFieldErrors((current) => clearFieldError(current, "newPassword"));
            }}
            autoComplete="new-password"
            required
            error={Boolean(fieldErrors.newPassword)}
            helperText={fieldErrorText(
              fieldErrors,
              "newPassword",
              t,
              language,
            )}
          />
          <PasswordTextField
            label={t.confirmPassword}
            value={confirmPassword}
            onChange={(value) => {
              setConfirmPassword(value);
              setFieldErrors((current) =>
                clearFieldError(current, "confirmPassword"),
              );
            }}
            autoComplete="new-password"
            required
            error={Boolean(fieldErrors.confirmPassword)}
            helperText={fieldErrorText(
              fieldErrors,
              "confirmPassword",
              t,
              language,
            )}
          />
          <Typography variant="caption" color="text.secondary">
            {t.passwordStrengthHint}
          </Typography>
          {error && (
            <Typography color="error" variant="body2">
              {renderLocalizedError(error, t, language)}
            </Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>{t.cancel}</Button>
        <Button variant="contained" onClick={save}>
          {t.resetPassword}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function SecurityQuestionSetup({
  session,
  language,
  t,
  onLanguageChange,
  onSaved,
  onLogout,
}: {
  session: Session;
  language: Language;
  t: Translation;
  onLanguageChange: (language: Language) => Promise<void>;
  onSaved: () => void;
  onLogout: () => void;
}) {
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState([
    { question: "", answer: "" },
    { question: "", answer: "" },
    { question: "", answer: "" },
  ]);
  const [error, setError] = useState<LocalizedErrorState | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrorMap>({});
  const { showToast } = useToast();

  useEffect(() => {
    void api<{ questions: string[] }>("/auth/security-questions/options")
      .then((result) => {
        setQuestions(result.questions);
        setAnswers((current) =>
          current.map((item, index) => ({
            ...item,
            question: result.questions[index] ?? item.question,
          })),
        );
      })
      .catch((err) => {
        const nextError = apiError(err, "loadFailed");
        setError(nextError);
        showToast({
          message: renderLocalizedError(nextError, t, language),
          variant: "error",
        });
      });
  }, [t.loadFailed]);

  async function save() {
    setError(null);
    const nextFieldErrors: FieldErrorMap = {};
    answers.forEach((answer, index) => {
      if (!answer.question) nextFieldErrors[`question-${index}`] = requiredError();
      if (!answer.answer.trim()) nextFieldErrors[`answer-${index}`] = requiredError();
    });
    const selectedQuestions = answers.map((answer) => answer.question);
    if (
      selectedQuestions.filter(Boolean).length >= 3 &&
      new Set(selectedQuestions).size < 3
    ) {
      answers.forEach((answer, index) => {
        if (answer.question) {
          nextFieldErrors[`question-${index}`] = messageError(
            "securityQuestionSetupMessage",
          );
        }
      });
    }
    setFieldErrors(nextFieldErrors);
    if (Object.keys(nextFieldErrors).length) {
      return;
    }
    try {
      await api("/auth/security-questions", session, {
        method: "PUT",
        body: JSON.stringify({ answers }),
      });
      showToast({ message: t.securityQuestionsSaved, variant: "success" });
      onSaved();
    } catch (err) {
      const nextError = apiError(err, "saveFailed");
      setError(nextError);
      showToast({
        message: renderLocalizedError(nextError, t, language),
        variant: "error",
      });
    }
  }

  return (
    <PublicPageShell
      language={language}
      t={t}
      onLanguageChange={onLanguageChange}
      maxWidthClassName="max-w-[720px]"
    >
      <Paper className="w-full p-6">
        <Stack spacing={2.5}>
          <Box>
            <Typography variant="h5">
              {t.securityQuestionSetupTitle}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t.securityQuestionSetupMessage}
            </Typography>
          </Box>
          {answers.map((answer, index) => (
            <Stack key={index} spacing={1.5}>
              <FormControl fullWidth>
                <Select
                  label={t.securityQuestion}
                  required
                  value={answer.question}
                  onChange={(event) =>
                    (setFieldErrors((current) =>
                      clearFieldError(current, `question-${index}`),
                    ),
                    setAnswers((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index
                          ? { ...item, question: String(event.target.value) }
                          : item,
                      ),
                    ))
                  }
                >
                  {questions.map((question) => (
                    <MenuItem
                      key={question}
                      value={question}
                      disabled={answers.some(
                        (item, itemIndex) =>
                          itemIndex !== index && item.question === question,
                      )}
                    >
                      {securityQuestionLabel(t, question)}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText error>
                  {fieldErrorText(fieldErrors, `question-${index}`, t, language)}
                </FormHelperText>
              </FormControl>
              <TextField
                fullWidth
                label={t.securityAnswer}
                value={answer.answer}
                onChange={(event) => {
                  setFieldErrors((current) =>
                    clearFieldError(current, `answer-${index}`),
                  );
                  setAnswers((current) =>
                    current.map((item, itemIndex) =>
                      itemIndex === index
                        ? { ...item, answer: event.target.value }
                        : item,
                    ),
                  );
                }}
                error={Boolean(fieldErrors[`answer-${index}`])}
                helperText={fieldErrorText(
                  fieldErrors,
                  `answer-${index}`,
                  t,
                  language,
                )}
              />
            </Stack>
          ))}
          {error && (
            <Typography color="error" variant="body2">
              {renderLocalizedError(error, t, language)}
            </Typography>
          )}
          <Stack direction="row" spacing={1} className="justify-end">
            <Button onClick={onLogout}>{t.signOut}</Button>
            <Button variant="contained" onClick={save} startIcon={<Save size={16} />}>
              {t.save}
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </PublicPageShell>
  );
}

function ForgotPasswordDialog({
  open,
  initialUsername,
  language,
  t,
  onClose,
}: {
  open: boolean;
  initialUsername: string;
  language: Language;
  t: Translation;
  onClose: () => void;
}) {
  const [username, setUsername] = useState(initialUsername);
  const [question, setQuestion] = useState("");
  const [questionIndex, setQuestionIndex] = useState<number | null>(null);
  const [answer, setAnswer] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState<LocalizedErrorState | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrorMap>({});
  const { showToast } = useToast();

  useEffect(() => {
    if (!open) return;
    setUsername(initialUsername);
    setQuestion("");
    setQuestionIndex(null);
    setAnswer("");
    setResetToken("");
    setNewPassword("");
    setConfirmPassword("");
    setSuccess("");
    setError(null);
    setFieldErrors({});
  }, [open, initialUsername]);

  async function loadQuestions() {
    setError(null);
    const nextFieldErrors: FieldErrorMap = {};
    if (!username.trim()) nextFieldErrors.username = requiredError();
    setFieldErrors(nextFieldErrors);
    if (Object.keys(nextFieldErrors).length) return;
    setSuccess("");
    try {
      const result = await api<{ questionIndex: number; question: string }>(
        "/auth/forgot-password/questions",
        undefined,
        {
          method: "POST",
          body: JSON.stringify({ username }),
        },
      );
      setQuestion(result.question);
      setQuestionIndex(result.questionIndex);
      setAnswer("");
    } catch (err) {
      const nextError = apiError(err, "loadFailed");
      setFieldErrors({ username: nextError });
      showToast({
        message: renderLocalizedError(nextError, t, language),
        variant: "error",
      });
    }
  }

  async function verifyAnswers() {
    setError(null);
    if (questionIndex === null) return;
    const nextFieldErrors: FieldErrorMap = {};
    if (!answer.trim()) nextFieldErrors.answer = requiredError();
    setFieldErrors(nextFieldErrors);
    if (Object.keys(nextFieldErrors).length) return;
    try {
      const result = await api<{ resetToken: string }>(
        "/auth/forgot-password/verify",
        undefined,
        {
          method: "POST",
          body: JSON.stringify({ username, questionIndex, answer }),
        },
      );
      setResetToken(result.resetToken);
    } catch (err) {
      const nextError = apiError(err, "saveFailed");
      setFieldErrors({ answer: nextError });
      showToast({
        message: renderLocalizedError(nextError, t, language),
        variant: "error",
      });
    }
  }

  async function resetPassword() {
    setError(null);
    const nextFieldErrors: FieldErrorMap = {};
    if (!newPassword.trim()) nextFieldErrors.newPassword = requiredError();
    if (!confirmPassword.trim()) nextFieldErrors.confirmPassword = requiredError();
    if (!isStrongPassword(newPassword)) {
      nextFieldErrors.newPassword = messageError("passwordStrengthHint");
    }
    if (newPassword !== confirmPassword) {
      nextFieldErrors.confirmPassword = messageError("passwordsDoNotMatch");
    }
    setFieldErrors(nextFieldErrors);
    if (Object.keys(nextFieldErrors).length) return;
    try {
      await api("/auth/forgot-password/reset", undefined, {
        method: "POST",
        body: JSON.stringify({
          username,
          resetToken,
          newPassword,
          confirmPassword,
        }),
      });
      setSuccess(t.passwordResetSuccess);
      showToast({ message: t.passwordResetSuccess, variant: "success" });
      setResetToken("");
      setQuestion("");
      setQuestionIndex(null);
      setAnswer("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      const nextError = apiError(err, "saveFailed");
      setFieldErrors({ confirmPassword: nextError });
      showToast({
        message: renderLocalizedError(nextError, t, language),
        variant: "error",
      });
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t.forgotPasswordTitle}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} className="pt-2">
          <TextField
            label={t.username}
            value={username}
            onChange={(event) => {
              setUsername(event.target.value);
              setFieldErrors((current) => clearFieldError(current, "username"));
            }}
            disabled={Boolean(resetToken)}
            required
            error={Boolean(fieldErrors.username)}
            helperText={fieldErrorText(fieldErrors, "username", t, language)}
          />
          {question && !resetToken && (
            <TextField
              label={securityQuestionLabel(t, question)}
              value={answer}
              onChange={(event) => {
                setAnswer(event.target.value);
                setFieldErrors((current) => clearFieldError(current, "answer"));
              }}
              required
              error={Boolean(fieldErrors.answer)}
              helperText={fieldErrorText(fieldErrors, "answer", t, language)}
            />
          )}
          {resetToken && (
            <>
              <PasswordTextField
                label={t.newPassword}
                value={newPassword}
                onChange={(value) => {
                  setNewPassword(value);
                  setFieldErrors((current) =>
                    clearFieldError(current, "newPassword"),
                  );
                }}
                autoComplete="new-password"
                required
                error={Boolean(fieldErrors.newPassword)}
                helperText={fieldErrorText(
                  fieldErrors,
                  "newPassword",
                  t,
                  language,
                )}
              />
              <PasswordTextField
                label={t.confirmPassword}
                value={confirmPassword}
                onChange={(value) => {
                  setConfirmPassword(value);
                  setFieldErrors((current) =>
                    clearFieldError(current, "confirmPassword"),
                  );
                }}
                autoComplete="new-password"
                required
                error={Boolean(fieldErrors.confirmPassword)}
                helperText={fieldErrorText(
                  fieldErrors,
                  "confirmPassword",
                  t,
                  language,
                )}
              />
              <Typography variant="caption" color="text.secondary">
                {t.passwordStrengthHint}
              </Typography>
            </>
          )}
          {error && (
            <Typography color="error" variant="body2">
              {renderLocalizedError(error, t, language)}
            </Typography>
          )}
          {success && (
            <Typography color="success.main" variant="body2">
              {success}
            </Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t.close}</Button>
        {!question && !success && (
          <Button variant="contained" onClick={loadQuestions}>
            {t.getSecurityQuestions}
          </Button>
        )}
        {question && !resetToken && (
          <Button variant="contained" onClick={verifyAnswers}>
            {t.verifyAnswers}
          </Button>
        )}
        {resetToken && (
          <Button variant="contained" onClick={resetPassword}>
            {t.resetPassword}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

function isStrongPassword(value: string) {
  return (
    value.length >= 8 &&
    /[A-Za-z]/.test(value) &&
    /\d/.test(value) &&
    /[^A-Za-z0-9]/.test(value)
  );
}

function securityQuestionLabel(t: Translation, question: string) {
  return (
    t.securityQuestionLabels[
      question as keyof typeof t.securityQuestionLabels
    ] ?? question
  );
}
