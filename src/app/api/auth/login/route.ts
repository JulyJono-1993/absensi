import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function POST(request: Request) {
  const { identifier, password } = await request.json();

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, {
              ...options,
              sameSite: "lax",
              secure: true,
              path: "/",
            })
          );
        },
      },
    }
  );

  let email = identifier;

  if (!identifier.includes("@")) {
    const { data, error } = await supabase
      .from("profiles")
      .select("email")
      .eq("username", identifier)
      .single();

    if (error || !data?.email) {
      return NextResponse.json(
        { error: "Username tidak ditemukan" },
        { status: 400 }
      );
    }

    email = data.email;
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
