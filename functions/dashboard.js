const resumoMensal = await buscarTudo(
  'vw_dashboard_resumo_mensal'
)

return Response.json({
  etapa: 'resumoMensal',
  qtd: resumoMensal.length
})
