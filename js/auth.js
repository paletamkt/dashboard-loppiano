const SUPABASE_URL =
  'https://zuwnaejrihlhdmbwoirw.supabase.co'

const SUPABASE_ANON_KEY =
  'SUA_ANON_KEY_AQUI'

const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
)

async function verificarLogin() {

  const {
    data: { session }
  } = await supabase.auth.getSession()

  if (!session) {

    window.location.href =
      '/login.html'

  }

}

async function logout() {

  await supabase.auth.signOut()

  window.location.href =
    '/login.html'

}
