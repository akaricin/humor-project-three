import { createClient } from "./utils/supabase/server";
import { redirect } from "next/navigation";
import MatrixDashboardClient from "./MatrixDashboardClient";
import { ShieldAlert } from "lucide-react";

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  // Admin Guard: Fetch profile and check roles
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_superadmin, is_matrix_admin")
    .eq("id", user.id)
    .single();

  const isAuthorized = profile?.is_superadmin || profile?.is_matrix_admin;

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-black text-white font-mono flex items-center justify-center p-8">
        <div className="max-w-xl border-4 border-red-600 p-12 space-y-6 relative shadow-[16px_16px_0px_0px_rgba(220,38,38,0.2)]">
          <div className="flex items-center gap-4 text-red-600 animate-pulse">
            <ShieldAlert size={48} />
            <h1 className="text-4xl font-black italic tracking-widest uppercase">Access_Denied</h1>
          </div>
          
          <div className="space-y-4">
            <p className="text-xl font-bold border-b-2 border-red-600/30 pb-4">
              CRITICAL_AUTH_FAILURE: USER_LEVEL_INSUFFICIENT
            </p>
            <div className="bg-red-600/10 p-6 space-y-2 border-2 border-red-600/20">
              <p className="text-sm opacity-80">&gt; UID: {user.id}</p>
              <p className="text-sm opacity-80">&gt; EMAIL: {user.email}</p>
              <p className="text-sm opacity-80">&gt; STATUS: UNAUTHORIZED_FOR_MATRIX_ACCESS</p>
            </div>
            <p className="text-xs opacity-50 italic">
              * Contact a High-Level Architect to escalate your privileges.
            </p>
          </div>

          <form action="/auth/signout" method="post">
            <button
              className="mt-8 border-2 border-white px-8 py-3 font-bold hover:bg-white hover:text-black transition-colors"
            >
              TERMINATE_SESSION
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <MatrixDashboardClient />;
}
