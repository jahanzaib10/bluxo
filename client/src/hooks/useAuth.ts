import { useUser, useOrganization, useClerk } from "@clerk/clerk-react";

export function useAuth() {
  const { user, isLoaded: isUserLoaded, isSignedIn } = useUser();
  const { organization, isLoaded: isOrgLoaded } = useOrganization();
  const { signOut } = useClerk();

  return {
    user: user
      ? {
          id: user.id,
          email: user.primaryEmailAddress?.emailAddress || "",
          name: user.fullName || "",
          avatarUrl: user.imageUrl,
        }
      : null,
    organization: organization
      ? {
          id: organization.id,
          name: organization.name,
          slug: organization.slug || "",
          imageUrl: organization.imageUrl,
        }
      : null,
    isLoaded: isUserLoaded && isOrgLoaded,
    isSignedIn: !!isSignedIn,
    signOut: () => signOut(),
  };
}
