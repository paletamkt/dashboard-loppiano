import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
)

async function buscarTudo(tabela, options = {}) {
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

    if (!data || !data.length) {
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

export async function onRequest() {

  try {

    const [
      resumoMensal,
      horarios,
      garcons,
      produtos,
      diario,
      metasDiarias
    ] = await Promise.all([

      buscarTudo('vw_dashboard_resumo_mensal', {
        orderBy: 'periodo'
      }),

      buscarTudo('vendas_horario', {
        orderBy: 'periodo'
      }),

      buscarTudo('vendas_atendentes', {
        orderBy: 'periodo'
      }),

      buscarTudo('produtos_vendidos', {
        orderBy: 'periodo'
      }),

      buscarTudo('vendas_diarias', {
        orderBy: 'data'
      }),

      buscarTudo('metas_diarias', {
        orderBy: 'data'
      })

    ])

    return new Response(
       JSON.stringify({
         resumo_mensal: resumoMensal,
         horarios,
         garcons,
         produtos,
         vendas_diarias: diario,
         metas_diarias: metasDiarias
       }),
       {
         headers: {
           'Content-Type': 'application/json'
         }
       }
      ) 

  } catch (error) {

    console.error(error)

    return new Response(
       JSON.stringify({
         error: error.message
       }),
       {
         status: 500,
         headers: {
           'Content-Type': 'application/json'
         }
       }
)

  }

}
