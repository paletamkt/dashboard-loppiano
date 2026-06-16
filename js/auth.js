const SUPABASE_URL =
'https://zuwnaejrihlhdmbwoirw.supabase.co'

const SUPABASE_ANON_KEY =
'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1d25hZWpyaWhsaGRtYndvaXJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1NDcxMzQsImV4cCI6MjA5MjEyMzEzNH0.Jr2YWcIxYr8naMdhwziEIWgGVWKTeLwqFnFglB8s5LA'

const supabase =
window.supabase.createClient(
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
