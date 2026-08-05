import { createClient } from '@supabase/supabase-js'

export async function onRequest(context) {

  if (!context.env.SUPABASE_URL || !context.env.SUPABASE_SERVICE_ROLE) {

    return Response.json({
      erro: 'SUPABASE_URL ou SUPABASE_SERVICE_ROLE não configurados neste ambiente (Cloudflare Pages > Settings > Environment variables).'
    }, {
      status: 500
    })

  }

  try {

    const supabase = createClient(
      context.env.SUPABASE_URL,
      context.env.SUPABASE_SERVICE_ROLE
    )


    const [
      resumoMensal,
      horarios,
      garcons,
      produtos,
      diario,
      metasDiarias
    ] = await Promise.all([

      supabase
        .from('vw_dashboard_resumo_mensal')
        .select('*'),

      supabase
        .from('vendas_horario')
        .select('*'),

      supabase
        .from('vendas_atendentes')
        .select('*'),

      supabase
        .from('produtos_vendidos')
        .select('*'),

      supabase
        .from('vendas_diarias')
        .select('*'),

      supabase
        .from('metas_diarias')
        .select('*')

    ])

    return Response.json({
      resumo_mensal: resumoMensal.data || [],
      horarios: horarios.data || [],
      garcons: garcons.data || [],
      produtos: produtos.data || [],
      vendas_diarias: diario.data || [],
      metas_diarias: metasDiarias.data || []
    })

  } catch (error) {

    return Response.json({
      erro: error.message
    }, {
      status: 500
    })

  }

}
