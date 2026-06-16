import { createClient } from '@supabase/supabase-js'

export async function onRequest(context) {

  const supabase = createClient(
    context.env.SUPABASE_URL,
    context.env.SUPABASE_SERVICE_ROLE
  )

  try {

    const tabelas = [
      'vw_dashboard_resumo_mensal',
      'vendas_horario',
      'vendas_atendentes',
      'produtos_vendidos',
      'vendas_diarias',
      'metas_diarias'
    ]

    const resultado = []

    for (const tabela of tabelas) {

      const { data, error } = await supabase
        .from(tabela)
        .select('*')
        .limit(1)

      resultado.push({
        tabela,
        linhas: data?.length || 0,
        erro: error?.message || null
      })
    }

    return Response.json(resultado)

  } catch (e) {

    return Response.json(
      {
        message: e.message,
        stack: e.stack
      },
      {
        status: 500
      }
    )

  }

}
