const testes = {}

for (const tabela of [
  'vw_dashboard_resumo_mensal',
  'vendas_horario',
  'vendas_atendentes',
  'produtos_vendidos',
  'vendas_diarias',
  'metas_diarias'
]) {

  const { data, error } = await supabase
    .from(tabela)
    .select('*')
    .limit(1)

  testes[tabela] = {
    ok: !error,
    erro: error?.message || null,
    linhas: data?.length || 0
  }
}

return Response.json(testes)
