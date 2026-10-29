import { useEffect, useState, type FormEvent } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import SecurityIcon from "@mui/icons-material/Security";
import { api } from "../../app/apiClient";
import type { Translation } from "../../app/i18n";
import type { Session } from "../../app/types";
import { PasswordTextField, PublicPageShell } from "../../components/AppChrome";

export function Login({
  t,
  onLogin,
}: {
  t: Translation;
  onLogin: (session: Session) => void;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [forgotOpen, setForgotOpen] = useState(false);
  const [captcha, setCaptcha] = useState<{ challengeId: string; imageDataUrl: string } | null>(null);
  const [captchaAnswer, setCaptchaAnswer] = useState("");

  async function refreshCaptchaIfRequired() {
    const protection = await api<{ captchaRequired: boolean }>("/auth/login-protection");
    if (!protection.captchaRequired) {
      setCaptcha(null);
      setCaptchaAnswer("");
      return;
    }
    setCaptcha(await api<{ challengeId: string; imageDataUrl: string }>("/auth/login-captcha"));
    setCaptchaAnswer("");
  }

  useEffect(() => {
    void refreshCaptchaIfRequired().catch(() => undefined);
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (captcha && !captchaAnswer.trim()) {
      setError(t.captchaRequired);
      return;
    }
    try {
      const result = await api<Session>("/auth/login", undefined, {
        method: "POST",
        body: JSON.stringify({
          username,
          password,
          captchaChallengeId: captcha?.challengeId,
          captchaAnswer,
        }),
      });
      onLogin(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : t.loginFailed;
      setError(
        /请求失败（(?:401|403)）/.test(message)
          ? t.invalidCredentials
          : message,
      );
      void refreshCaptchaIfRequired().catch(() => undefined);
    }
  }

  return (
    <PublicPageShell>
      <Paper component="form" onSubmit={submit} sx={{ width: "100%", p: 3 }}>
        <Stack spacing={2.5}>
          <TextField
            label={t.username}
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
          />
          <PasswordTextField
            label={t.password}
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
            required
          />
          {captcha && (
            <Stack spacing={1}>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <Box
                  component="img"
                  src={captcha.imageDataUrl}
                  alt={t.captchaHint}
                  sx={{ width: 190, height: 58, border: 1, borderColor: "divider", borderRadius: 1 }}
                />
                <Button
                  size="small"
                  onClick={() => void refreshCaptchaIfRequired().catch((err) => {
                    setError(err instanceof Error ? err.message : t.loadFailed);
                  })}
                >
                  {t.refreshCaptcha}
                </Button>
              </Stack>
              <TextField
                label={t.captcha}
                value={captchaAnswer}
                onChange={(event) => setCaptchaAnswer(event.target.value.toUpperCase())}
                placeholder={t.captchaHint}
              />
            </Stack>
          )}
          <Box sx={{ mt: -1 }}>
            <Button
              variant="text"
              size="small"
              onClick={() => setForgotOpen(true)}
              sx={{ px: 0 }}
            >
              {t.forgotPassword}
            </Button>
          </Box>
          {error && (
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          )}
          <Button
            type="submit"
            variant="contained"
            startIcon={<SecurityIcon />}
          >
            {t.signIn}
          </Button>
        </Stack>
        <ForgotPasswordDialog
          open={forgotOpen}
          initialUsername={username}
          t={t}
          onClose={() => setForgotOpen(false)}
        />
      </Paper>
    </PublicPageShell>
  );
}

export function SecurityQuestionSetup({
  session,
  t,
  onSaved,
  onLogout,
}: {
  session: Session;
  t: Translation;
  onSaved: () => void;
  onLogout: () => void;
}) {
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState([
    { question: "", answer: "" },
    { question: "", answer: "" },
    { question: "", answer: "" },
  ]);
  const [error, setError] = useState("");

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
      .catch((err) =>
        setError(err instanceof Error ? err.message : t.loadFailed),
      );
  }, [t.loadFailed]);

  async function save() {
    setError("");
    const selectedQuestions = answers.map((answer) => answer.question);
    if (
      answers.some((answer) => !answer.question || !answer.answer.trim()) ||
      new Set(selectedQuestions).size < 3
    ) {
      setError(t.securityQuestionSetupMessage);
      return;
    }
    try {
      await api("/auth/security-questions", session, {
        method: "PUT",
        body: JSON.stringify({ answers }),
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.saveFailed);
    }
  }

  return (
    <PublicPageShell maxWidth={720}>
      <Paper sx={{ width: "100%", p: 3 }}>
        <Stack spacing={2.5}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {t.securityQuestionSetupTitle}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t.securityQuestionSetupMessage}
            </Typography>
          </Box>
          {answers.map((answer, index) => (
            <Stack key={index} spacing={1.5}>
              <FormControl fullWidth>
                <InputLabel>{t.securityQuestion}</InputLabel>
                <Select
                  label={t.securityQuestion}
                  value={answer.question}
                  onChange={(event) =>
                    setAnswers((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index
                          ? { ...item, question: event.target.value }
                          : item,
                      ),
                    )
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
              </FormControl>
              <TextField
                fullWidth
                label={t.securityAnswer}
                value={answer.answer}
                onChange={(event) =>
                  setAnswers((current) =>
                    current.map((item, itemIndex) =>
                      itemIndex === index
                        ? { ...item, answer: event.target.value }
                        : item,
                    ),
                  )
                }
              />
            </Stack>
          ))}
          {error && (
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          )}
          <Stack
            direction="row"
            spacing={1}
            sx={{ justifyContent: "flex-end" }}
          >
            <Button onClick={onLogout}>{t.signOut}</Button>
            <Button variant="contained" onClick={save} startIcon={<SaveIcon />}>
              {t.save}
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </PublicPageShell>
  );
}

export function AccountActivation({ t, onCompleted }: { t: Translation; onCompleted: () => void }) {
  const [token] = useState(() => new URLSearchParams(window.location.hash.slice(1)).get("token") ?? "");
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState([{ question: "", answer: "" }, { question: "", answer: "" }, { question: "", answer: "" }]);
  const [username, setUsername] = useState("");
  const [usernameEditable, setUsernameEditable] = useState(true);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [ready, setReady] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) { setError("激活链接无效或已失效"); return; }
    Promise.all([
      api<{ username: string | null; usernameEditable: boolean }>("/auth/account-activation/verify", undefined, { method: "POST", body: JSON.stringify({ token }) }),
      api<{ questions: string[] }>("/auth/security-questions/options"),
    ]).then(([activation, options]) => {
      setUsername(activation.username ?? "");
      setUsernameEditable(activation.usernameEditable);
      setQuestions(options.questions);
      setAnswers(current => current.map((answer, index) => ({ ...answer, question: options.questions[index] ?? "" })));
      setReady(true);
    }).catch(err => setError(err instanceof Error ? err.message : t.loadFailed));
  }, [token, t.loadFailed]);

  async function activate() {
    setError("");
    if (usernameEditable && !username.trim()) { setError("请输入用户名"); return; }
    if (!isStrongPassword(password)) { setError(t.passwordStrengthHint); return; }
    if (password !== confirmPassword) { setError(t.passwordsDoNotMatch); return; }
    if (answers.some(answer => !answer.question || !answer.answer.trim()) || new Set(answers.map(answer => answer.question)).size < 3) {
      setError(t.securityQuestionSetupMessage);
      return;
    }
    try {
      await api("/auth/account-activation", undefined, {
        method: "POST",
        body: JSON.stringify({ token, username, password, confirmPassword, answers }),
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.saveFailed);
    }
  }

  return <PublicPageShell maxWidth={720}>
    <Paper sx={{ width: "100%", p: 3 }}>
      <Stack spacing={2.5}>
        <Box><Typography variant="h5" sx={{ fontWeight: 700 }}>{usernameEditable ? t.accountActivationTitle : t.resetAccountTitle}</Typography><Typography variant="body2" color="text.secondary">{usernameEditable ? t.accountActivationMessage : t.accountAccessResetMessage}</Typography></Box>
        {ready && !success && <>
          <TextField label={t.username} value={username} onChange={event => setUsername(event.target.value)} disabled={!usernameEditable} />
          <PasswordTextField label={t.newPassword} value={password} onChange={setPassword} autoComplete="new-password" />
          <PasswordTextField label={t.confirmPassword} value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" />
          <Typography variant="caption" color="text.secondary">{t.passwordStrengthHint}</Typography>
          {answers.map((answer, index) => <Stack key={index} spacing={1.5}>
            <FormControl fullWidth><InputLabel>{t.securityQuestion}</InputLabel><Select label={t.securityQuestion} value={answer.question} onChange={event => setAnswers(current => current.map((item, itemIndex) => itemIndex === index ? { ...item, question: event.target.value } : item))}>
              {questions.map(question => <MenuItem key={question} value={question} disabled={answers.some((item, itemIndex) => itemIndex !== index && item.question === question)}>{securityQuestionLabel(t, question)}</MenuItem>)}
            </Select></FormControl>
            <TextField label={t.securityAnswer} value={answer.answer} onChange={event => setAnswers(current => current.map((item, itemIndex) => itemIndex === index ? { ...item, answer: event.target.value } : item))} />
          </Stack>)}
        </>}
        {error && <Typography color="error" variant="body2">{error}</Typography>}
        {success ? <><Typography color="success.main" variant="body2">{usernameEditable ? t.accountActivationSuccess : t.accountResetSuccess}</Typography><Button variant="contained" onClick={onCompleted}>{t.signIn}</Button></> : <Button variant="contained" disabled={!ready} onClick={activate}>{usernameEditable ? t.activateAccount : t.resetAccount}</Button>}
      </Stack>
    </Paper>
  </PublicPageShell>;
}

function ForgotPasswordDialog({
  open,
  initialUsername,
  t,
  onClose,
}: {
  open: boolean;
  initialUsername: string;
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
  const [error, setError] = useState("");

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
    setError("");
  }, [open, initialUsername]);

  async function loadQuestions() {
    setError("");
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
      setError(err instanceof Error ? err.message : t.loadFailed);
    }
  }

  async function verifyAnswers() {
    setError("");
    if (questionIndex === null) return;
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
      setError(err instanceof Error ? err.message : t.saveFailed);
    }
  }

  async function resetPassword() {
    setError("");
    if (!isStrongPassword(newPassword)) {
      setError(t.passwordStrengthHint);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t.passwordsDoNotMatch);
      return;
    }
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
      setResetToken("");
      setQuestion("");
      setQuestionIndex(null);
      setAnswer("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : t.saveFailed);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t.forgotPasswordTitle}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField
            label={t.username}
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            disabled={Boolean(resetToken)}
            required
          />
          {question && !resetToken && (
            <TextField
              label={securityQuestionLabel(t, question)}
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
            />
          )}
          {resetToken && (
            <>
              <PasswordTextField
                label={t.newPassword}
                value={newPassword}
                onChange={setNewPassword}
                autoComplete="new-password"
              />
              <PasswordTextField
                label={t.confirmPassword}
                value={confirmPassword}
                onChange={setConfirmPassword}
                autoComplete="new-password"
              />
              <Typography variant="caption" color="text.secondary">
                {t.passwordStrengthHint}
              </Typography>
            </>
          )}
          {error && (
            <Typography color="error" variant="body2">
              {error}
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
