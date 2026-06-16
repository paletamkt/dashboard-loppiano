export async function onRequest(context) {

  return Response.json({
    supabaseUrl: !!context.env.SUPABASE_URL,
    serviceRole: !!context.env.SUPABASE_SERVICE_ROLE
  })

}
