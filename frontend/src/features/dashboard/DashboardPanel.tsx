import { Button } from "@/components/ui/button";
import { Box, Chip, Paper, Stack } from "@/components/ui/layout";
import { Typography } from "@/components/ui/typography";
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
      <Paper className="p-5">
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          className="sm:items-center"
        >
          <Box className="flex-1">
            <Typography variant="h5">
              {t.dashboardTitle}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t.dashboardWelcome}, {session.username}
            </Typography>
          </Box>
          <Chip label={today} />
        </Stack>
      </Paper>

      <Paper className="p-5">
        <Typography variant="subtitle1" className="mb-3">
          {t.availableModules}
        </Typography>
        <Box className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {moduleResources.map((resource) => (
            <Button
              key={resource.key}
              variant="outlined"
              startIcon={resource.icon}
              onClick={() => onSelectResource(resource.key)}
              className="min-h-12 justify-start"
            >
              {t.resources[resource.key]}
            </Button>
          ))}
        </Box>
      </Paper>
    </Stack>
  );
}
