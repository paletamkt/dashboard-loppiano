import { createClient } from '@supabase/supabase-js'

export async function onRequest(context) {

  try {

    const supabase = createClient(
      context.env.SUPABASE_URL,
      context.env.SUPABASE_SERVICE_ROLE
    )

    const { data: resumoMensal, error: erroResumo } =
      await supabase
        .from('vw_dashboard_resumo_mensal')
        .select('*')

    if (erroResumo) {
      throw erroResumo
    }

    const { data: horarios, error: erroHorarios } =
      await supabase
        .from('vendas_horario')
        .select('*')

    if (erroHorarios) {
      throw erroHorarios
    }

    return Response.json({
      resumoMensal: resumoMensal.length,
      horarios: horarios.length
    })

  } catch (e) {

    return Response.json({
      erro: e.message,
      detalhes: e
    }, {
      status: 500
    })

  }

}
