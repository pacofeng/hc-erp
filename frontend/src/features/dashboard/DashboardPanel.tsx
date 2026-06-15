import { Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";
import type { Translation } from "../../app/i18n";
import type { Session } from "../../app/types";
import { resources } from "../../app/resources";

export function DashboardPanel({
  session,
  t,
  visibleResources,
  onSelectResource,
}: {
  session: Session;
  t: Translation;
  visibleResources: Array<(typeof resources)[number]>;
  onSelectResource: (resource: string) => void;
}) {
  const moduleResources = visibleResources.filter(
    (resource) => resource.key !== "dashboard",
  );
  const today = new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date());

  return (
    <Stack spacing={2}>
      <Paper sx={{ p: 2.5 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          sx={{ alignItems: { sm: "center" } }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {t.dashboardTitle}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t.dashboardWelcome}, {session.username}
            </Typography>
          </Box>
          <Chip label={today} />
        </Stack>
      </Paper>

      <Paper sx={{ p: 2.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
          {t.availableModules}
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
              lg: "repeat(3, minmax(0, 1fr))",
            },
            gap: 1,
          }}
        >
          {moduleResources.map((resource) => (
            <Button
              key={resource.key}
              variant="outlined"
              startIcon={resource.icon}
              onClick={() => onSelectResource(resource.key)}
              sx={{ justifyContent: "flex-start", minHeight: 48 }}
            >
              {t.resources[resource.key]}
            </Button>
          ))}
        </Box>
      </Paper>
    </Stack>
  );
}
