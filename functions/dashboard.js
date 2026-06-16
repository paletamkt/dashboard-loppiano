import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
)

export async function onRequest() {

  const { data, error } = await supabase
    .from('vendas_horario')
    .select('*')
    .limit(1)

  return Response.json({
    tabela: 'vendas_horario',
    data,
    error
  })

}

