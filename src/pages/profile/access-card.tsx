import { Badge } from "../../ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card";
import { Separator } from "../../ui/separator";
import { Skeleton } from "../../ui/skeleton";
import { PermissionChecklist } from "../../components/access/permission-checklist";
import { ErrorState } from "../../components/feedback/query-states";
import type { ProfileAdapter, ProfileUser } from "../../adapters/profile";
import type { ProfileLabels } from "./labels";

/**
 * Role and permissions, to read only.
 *
 * The whole catalogue is shown, not only what is held: seeing the unticked rows is how a person
 * learns what exists to ask an administrator for.
 */
export function AccessCard({
  user,
  adapter,
  labels,
}: {
  user: ProfileUser;
  adapter: ProfileAdapter;
  labels: ProfileLabels;
}) {
  const catalogueQuery = adapter.usePermissionCatalogue();
  const accessLabels = labels.access;
  const catalogue = catalogueQuery.data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{accessLabels.title}</CardTitle>
        <CardDescription>{accessLabels.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{accessLabels.roleLabel}</span>
            <Badge variant="secondary">{accessLabels.roleLabelText(user.roleName)}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{accessLabels.permissionsLabel}</span>
            <span className="text-sm font-medium text-foreground">
              {accessLabels.permissionCount(user.permissions.length, catalogue.length)}
            </span>
          </div>
        </div>

        <Separator />

        {catalogueQuery.isError ? (
          <ErrorState error={catalogueQuery.error} onRetry={catalogueQuery.refetch} />
        ) : catalogueQuery.isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : catalogue.length === 0 ? (
          <p className="text-sm text-muted-foreground">{accessLabels.empty}</p>
        ) : (
          <PermissionChecklist
            permissions={catalogue}
            held={user.permissions}
            onToggle={() => {}}
            disabled
            readOnlyNote={accessLabels.readOnlyNote}
            categoryLabel={accessLabels.categoryLabel}
          />
        )}
      </CardContent>
    </Card>
  );
}
