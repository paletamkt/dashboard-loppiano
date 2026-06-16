import { createClient } from '@supabase/supabase-js'

async function buscarTudo(supabase, tabela, options = {}) {

  const {
    select = '*',
    orderBy = null,
    ascending = true,
    pageSize = 1000
  } = options

  let todos = []
  let from = 0
  let to = pageSize - 1

  while (true) {

    let query = supabase
      .from(tabela)
      .select(select)
      .range(from, to)

    if (orderBy) {
      query = query.order(orderBy, { ascending })
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    if (!data || data.length === 0) {
      break
    }

    todos = todos.concat(data)

    if (data.length < pageSize) {
      break
    }

    from += pageSize
    to += pageSize
  }

  return todos
}

export async function onRequest(context) {

  try {

    const supabase = createClient(
      context.env.SUPABASE_URL,
      context.env.SUPABASE_SERVICE_ROLE
    )

    const resumoMensal = await buscarTudo(
      supabase,
      'vw_dashboard_resumo_mensal',
      {
        orderBy: 'periodo'
      }
    )

    return Response.json({
      etapa: 'resumoMensal',
      qtd: resumoMensal.length
    })

  } catch (error) {

    return Response.json({
      erro: error.message,
      stack: error.stack
    }, {
      status: 500
    })

  }

}
