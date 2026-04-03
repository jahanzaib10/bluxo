import { useOrganization, useOrganizationList } from "@clerk/clerk-react";

export function useActiveOrg() {
  const { organization, isLoaded } = useOrganization();
  const { userMemberships } = useOrganizationList({
    userMemberships: { infinite: true },
  });

  const orgCount = userMemberships.data?.length || 0;
  const isHQMode = !organization && orgCount > 1;
  const hasMultipleOrgs = orgCount > 1;

  return {
    activeOrg: organization,
    isLoaded,
    isHQMode,
    hasMultipleOrgs,
    orgCount,
    memberships: userMemberships.data || [],
  };
}
