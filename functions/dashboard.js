import { createClient } from '@supabase/supabase-js'

export async function onRequest(context) {

  const supabase = createClient(
    context.env.SUPABASE_URL,
    context.env.SUPABASE_SERVICE_ROLE
  )

  try {

    const { data, error } = await supabase
      .from('produtos_vendidos')
      .select('*')
      .limit(1)

    return Response.json({
      tabela: 'produtos_vendidos',
      data,
      error
    })

  } catch (e) {

    return Response.json({
      message: e.message,
      stack: e.stack
    }, {
      status: 500
    })

  }

}
