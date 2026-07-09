import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
  },
});

const demoUsers = [
  { email: "admin@edulearn.com", password: "admin123", fullName: "Admin EduAttend", role: "admin" },
  { email: "guru@edulearn.com", password: "guru123", fullName: "Guru Matematika", role: "teacher" },
  { email: "siswa@edulearn.com", password: "siswa123", fullName: "Siswa Contoh", role: "student" },
];

const usernames = [
  "admin",
  "guru",
  "siswa",
];

async function createUsers() {
  for (let i = 0; i < demoUsers.length; i++) {
    const user = demoUsers[i];
    const { data, error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: {
        full_name: user.fullName,
        role: user.role,
        username: usernames[i],
      },
    });

    if (error) {
      if (error.message.includes("already registered")) {
        console.log(`User ${user.email} already exists, skipping...`);
      } else {
        console.error(`Error creating ${user.email}:`, error.message);
      }
    } else {
      console.log(`Created user: ${user.email} (${user.role}) - username: ${usernames[i]}`);
    }
  }

  console.log("\nDone! Demo users ready:");
  console.log("  admin@edulearn.com / admin123 (username: admin)");
  console.log("  guru@edulearn.com / guru123 (username: guru)");
  console.log("  siswa@edulearn.com / siswa123 (username: siswa)");
}

createUsers();
