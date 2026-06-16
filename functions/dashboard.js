import { createClient } from '@supabase/supabase-js'

export async function onRequest(context) {

  const supabase = createClient(
    context.env.SUPABASE_URL,
    context.env.SUPABASE_SERVICE_ROLE
  )

  try {

    const { data: produtos, error } = await supabase
      .from('produtos_vendidos')
      .select('*')

    if (error) {
      throw error
    }

    const json = JSON.stringify(produtos)

    return Response.json({
      registros: produtos.length,
      tamanho_bytes: json.length,
      tamanho_mb: (json.length / 1024 / 1024).toFixed(2)
    })

  } catch (error) {

    return Response.json({
      error: error.message
    }, {
      status: 500
    })

  }

}
