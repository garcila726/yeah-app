import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  // Por defecto vamos a la pantalla bonita
  const next = requestUrl.searchParams.get("next") ?? "/auth/confirm";
  const isDev = process.env.NODE_ENV !== "production";

  // Si no viene code, manda a login
  if (!code) {
    return NextResponse.redirect(new URL("/login", requestUrl.origin));
  }

  // ⚙️ Atajo de desarrollo: permitir probar la UI con `code=dummy`
  if (isDev && code === "dummy") {
    return NextResponse.redirect(new URL(next, requestUrl.origin));
  }

  try {
    const supabase = createRouteHandlerClient({ cookies });
    await supabase.auth.exchangeCodeForSession(code); // crea la sesión con code real
    return NextResponse.redirect(new URL(next, requestUrl.origin));
  } catch (err) {
    console.error("❌ Error en callback exchange:", err);

    if (isDev) {
      // En desarrollo, si el exchange falla, te dejo ver la pantalla bonita igual
      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }

    // En producción, responde error si el exchange falla
    return NextResponse.json(
      { error: "Error al procesar el callback" },
      { status: 500 }
    );
  }
}
