import { supabase } from "./supabase";

export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export async function login(
  identifier: string,
  password: string
): Promise<{ error?: string }> {
  let email = identifier;

  if (!identifier.includes("@")) {
    const { data, error } = await supabase
      .from("profiles")
      .select("email")
      .eq("username", identifier)
      .single();

    if (error || !data?.email) {
      return { error: "Username tidak ditemukan" };
    }

    email = data.email;
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) return { error: error.message };

  return {};
}

export async function logout() {
  await supabase.auth.signOut();
}
