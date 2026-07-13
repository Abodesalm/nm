import { connectDB } from "@/lib/db/mongoose";
import SystemUser from "@/lib/db/models/SystemUser";
import Settings from "@/lib/db/models/Settings";
import bcrypt from "bcryptjs";

const SECTIONS = [
  "employees",
  "storage",
  "history",
  "points",
  "customers",
  "problems",
  "finance",
  "documents",
  "settings",
];

async function seed() {
  await connectDB();

  // Login is by username; sync indexes so the old unique-email index
  // becomes sparse and the new unique-username index is created
  await SystemUser.syncIndexes();

  // Create super admin if not exists
  const existing = await SystemUser.findOne({ isSuperAdmin: true });
  if (!existing) {
    const hashed = await bcrypt.hash("@dm1n_te1c0m", 10);
    await SystemUser.create({
      name: "Super Admin",
      username: "admin",
      email: "admin@nmsystem.com",
      password: hashed,
      isSuperAdmin: true,
      permissions: SECTIONS.map((s) => ({ section: s, permission: "full" })),
    });
    console.log("✅ Super admin created: admin / @dm1n_te1c0m");
  } else if (!existing.username) {
    existing.username = "admin";
    await existing.save();
    console.log("✅ Super admin username backfilled: admin");
  } else {
    console.log("ℹ️  Super admin already exists");
  }

  // Create default settings if not exists
  const settings = await Settings.findOne();
  if (!settings) {
    await Settings.create({
      defaultExchangeRate: 11000,
      autoSuspendDay: 3,
      systemName: "NM System",
      departments: [],
      roles: [],
      mainRegions: [],
      regions: [],
      packs: [],
    });
    console.log("✅ Default settings created");
  } else {
    console.log("ℹ️  Settings already exist");
  }

  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
