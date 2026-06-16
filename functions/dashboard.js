import { createClient } from '@supabase/supabase-js'

export async function onRequest(context) {

  try {

    const supabase = createClient(
      context.env.SUPABASE_URL,
      context.env.SUPABASE_SERVICE_ROLE
    )

    return Response.json({
      etapa: 'cliente criado'
    })

  } catch (e) {

    return Response.json({
      etapa: 'erro criar cliente',
      erro: e.message,
      stack: e.stack
    }, {
      status: 500
    })

  }

}

