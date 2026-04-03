import { OrganizationSwitcher } from "@clerk/clerk-react";
import { dark } from "@clerk/themes";

export function OrgSwitcher() {
  return (
    <OrganizationSwitcher
      appearance={{
        baseTheme: dark,
        elements: {
          rootBox: "w-full",
          organizationSwitcherTrigger:
            "w-full justify-start px-3 py-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 text-white",
          organizationPreviewMainIdentifier: "text-white font-medium",
          organizationPreviewSecondaryIdentifier: "text-slate-400",
          organizationSwitcherPopoverCard: "bg-slate-900 border-slate-700",
          organizationSwitcherPopoverActions: "bg-slate-800",
        },
      }}
      hidePersonal={true}
      afterSelectOrganizationUrl="/"
      afterCreateOrganizationUrl="/"
    />
  );
}
