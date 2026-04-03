// scripts/seed.ts
// Creates a Clerk user with 3 organizations for initial setup
import "dotenv/config";
import { createClerkClient } from "@clerk/express";

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });

const USER_EMAIL = "jay@dartnox.com";
const USER_PASSWORD = "Bluxo@Yolo2026!";
const USER_FIRST_NAME = "Jay";
const USER_LAST_NAME = "S";

const ORGS = [
  { name: "DartNox Pakistan", slug: "dartnox-pk" },
  { name: "DartNox UK", slug: "dartnox-uk" },
  { name: "DartNox US", slug: "dartnox-us" },
];

async function seed() {
  console.log("Seeding Clerk with user and organizations...\n");

  // 1. Check if user already exists
  let user;
  const existingUsers = await clerk.users.getUserList({
    emailAddress: [USER_EMAIL],
  });

  if (existingUsers.data.length > 0) {
    user = existingUsers.data[0];
    console.log(`User already exists: ${user.id} (${USER_EMAIL})`);
  } else {
    user = await clerk.users.createUser({
      emailAddress: [USER_EMAIL],
      password: USER_PASSWORD,
      firstName: USER_FIRST_NAME,
      lastName: USER_LAST_NAME,
    });
    console.log(`Created user: ${user.id} (${USER_EMAIL})`);
  }

  // 2. Create organizations and add user as admin
  for (const orgDef of ORGS) {
    let org;

    // Check if org already exists by slug
    try {
      const existingOrgs = await clerk.organizations.getOrganizationList({
        query: orgDef.name,
      });
      const found = existingOrgs.data.find(
        (o) => o.slug === orgDef.slug || o.name === orgDef.name
      );

      if (found) {
        org = found;
        console.log(`Org already exists: ${org.id} (${orgDef.name})`);
      }
    } catch {
      // No matching org found
    }

    if (!org) {
      org = await clerk.organizations.createOrganization({
        name: orgDef.name,
        createdBy: user.id,
      });
      console.log(`Created org: ${org.id} (${orgDef.name})`);
    }

    // 3. Ensure user is a member (admin/owner)
    try {
      const members = await clerk.organizations.getOrganizationMembershipList({
        organizationId: org.id,
      });
      const isMember = members.data.some(
        (m) => m.publicUserData?.userId === user.id
      );

      if (!isMember) {
        await clerk.organizations.createOrganizationMembership({
          organizationId: org.id,
          userId: user.id,
          role: "org:admin",
        });
        console.log(`  Added ${USER_EMAIL} as admin to ${orgDef.name}`);
      } else {
        console.log(`  ${USER_EMAIL} already a member of ${orgDef.name}`);
      }
    } catch (err: any) {
      // User might already be a member (creator is auto-added)
      console.log(`  ${USER_EMAIL} already a member of ${orgDef.name}`);
    }
  }

  console.log("\nSeed complete! You can now sign in at http://localhost:3000");
  console.log(`  Email: ${USER_EMAIL}`);
  console.log(`  Password: ${USER_PASSWORD}`);
  console.log(`  Organizations: ${ORGS.map((o) => o.name).join(", ")}`);
}

seed().catch(console.error);
