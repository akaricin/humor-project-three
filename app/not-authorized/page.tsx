import { ShieldAlert, Terminal } from 'lucide-react'

export default function NotAuthorizedPage() {
  return (
    <div className="min-h-screen bg-black text-white font-mono flex items-center justify-center p-8">
      <div className="max-w-xl border-4 border-red-600 p-12 space-y-6 relative shadow-[16px_16px_0px_0px_rgba(220,38,38,0.2)]">
        {/* Decorative corner pixels */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-red-600" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-red-600" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-red-600" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-red-600" />

        <div className="flex items-center gap-4 text-red-600 animate-pulse">
          <ShieldAlert size={48} />
          <h1 className="text-4xl font-black italic tracking-widest uppercase">NOT_AUTHORIZED</h1>
        </div>
        
        <div className="space-y-4">
          <p className="text-xl font-bold border-b-2 border-red-600/30 pb-4">
            INSUFFICIENT_PRIVILEGES_DETECTED
          </p>
          <div className="bg-red-600/10 p-6 space-y-2 border-2 border-red-600/20">
            <p className="text-sm opacity-80">&gt; STATUS: UNAUTHORIZED_USER_ROLE</p>
            <p className="text-sm opacity-80">&gt; CLEARANCE_REQUIRED: MATRIX_ADMIN | SUPERADMIN</p>
            <p className="text-sm opacity-80">&gt; ACTION: REJECTED</p>
          </div>
          <p className="text-xs opacity-50 italic">
            * IF YOU BELIEVE THIS IS AN ERROR, CONTACT SYSTEM_CORE_MAINTAINER
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
  )
}
