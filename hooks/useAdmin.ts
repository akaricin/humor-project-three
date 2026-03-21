import { useEffect, useState } from 'react'
import { createClient } from '../lib/supabase'
import { useRouter } from 'next/navigation'

export function useAdmin() {
  const [user, setUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    async function checkAdmin() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (!user) {
        setIsAdmin(false)
        setLoading(false)
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_superadmin, is_matrix_admin')
        .eq('id', user.id)
        .single()

      const authorized = !!(profile?.is_superadmin || profile?.is_matrix_admin)
      setIsAdmin(authorized)
      setLoading(false)
      
      if (!authorized) {
        router.push('/not-authorized')
      }
    }

    checkAdmin()
  }, [supabase, router])

  return { isAdmin, loading, user }
}
