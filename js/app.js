// Dashboard Loppiano — app.js consolidado
// Versão limpa: sem Comandas, sem duplicações, com Dia da Semana e Horário em subtabs.

verificarLogin()

let DATA = {
 resumo_mensal: [],
 horarios: [],
 garcons: [],
 produtos: [],
 vendas_diarias: [],
 metas_diarias: []
}

let filtroPeriodo = 'todos'

// Filtros pr—prios por aba.
// Quando estiver como "todos", a aba mostra todos os períodos dispon—veis daquela base.
let filtroMetas = 'todos'
let filtroDiaSemana = 'todos'
let filtroCanais = 'todos'
let filtroHorario = 'todos'
let filtroGarcons = 'todos'
let filtroCardapio = 'todos'
let filtroInsights = 'todos'

let produtoSubaba = 'categoria'
let garcomPerfilSelecionado = ''

let chartMetas = null
let chartMetaVisaoDiaria = null
let chartCanais = null
let chartCanaisLinha = null
let chartCanaisPizza = null
let chartHorarioFat = null
let chartHorarioPessoas = null
let chartHoraDetalheFat = null
let chartHoraDetalhePessoas = null
let chartGarconsRanking = null
let chartGarconsEvolucao = null
let chartProdutosRanking = null
let chartProdutosTamanho = null
let chartDiaSemanaFat = null
let chartDiaSemanaComparativo = null
let chartDiaSemanaTicket = null
let chartDiaDetalheFat = null
let chartDiaDetalhePessoas = null
let chartMetaDiariaFat = null
let chartMetaDiariaComparativo = null
let chartMetaDiariaPessoas = null
let chartMetaCanaisPizza = null
let chartMetaCanaisBar = null
let chartHistoricoFat = null
let chartHistoricoMeta = null
let chartPerfilGarcom = null
let chartPerfilGarcomPizza = null
let chartGarcomCrescimento = null
let chartGarcomParticipacao = null
let chartCompararFat = null
let chartCompararPessoas = null

const $ = id => document.getElementById(id)

const fmtBRL = valor =>
 Number(valor || 0).toLocaleString('pt-BR', {
 style: 'currency',
 currency: 'BRL'
 })

const fmtNum = valor =>
 Number(valor || 0).toLocaleString('pt-BR')

const fmtPct = valor =>
 `${(Number(valor || 0) * 100).toFixed(1)}%`

function periodoParaOrdem(periodo) {
 if (!periodo) return 0

 if (String(periodo).includes('/')) {
 const [mes, ano] = String(periodo).split('/')
 return Number(ano) * 100 + Number(mes)
 }

 const meses = {
 JAN: 1, FEV: 2, MAR: 3, ABR: 4, MAI: 5, JUN: 6,
 JUL: 7, AGO: 8, SET: 9, OUT: 10, NOV: 11, DEZ: 12
 }

 const txt = String(periodo).toUpperCase()
 const mes = txt.slice(0, 3)
 const ano = Number(`20${txt.slice(3, 5)}`)

 return ano * 100 + (meses[mes] || 0)
}

function converterPeriodoParaMMYYYY(periodo) {
 const meses = {
 JAN: '01', FEV: '02', MAR: '03', ABR: '04', MAI: '05', JUN: '06',
 JUL: '07', AGO: '08', SET: '09', OUT: '10', NOV: '11', DEZ: '12'
 }

 if (!periodo) return ''

 const txt = String(periodo).toUpperCase()
 const mes = txt.slice(0, 3)
 const ano = txt.slice(3, 5)

 return `${meses[mes] || '01'}/20${ano}`
}

function periodoEquivalente(valorA, valorB) {
 if (!valorA || !valorB) return false

 const a = String(valorA).trim().toUpperCase()
 const b = String(valorB).trim().toUpperCase()

 if (a === b) return true

 return converterPeriodoParaMMYYYY(a) === b ||
 converterPeriodoParaMMYYYY(b) === a
}

function periodoParaLabel(periodo) {
 if (!periodo) return ''

 const texto = String(periodo).trim().toUpperCase()

 if (texto.includes('/')) {
 const [mes, ano] = texto.split('/')
 return `${mes.padStart(2, '0')}/${ano}`
 }

 return texto
}

function listarPeriodosBase(lista) {
 return [...new Set((lista || [])
 .map(item => item.periodo)
 .filter(Boolean))]
 .sort((a, b) => periodoParaOrdem(a) - periodoParaOrdem(b))
}

function periodoMaisRecente(lista) {
  const periodos = listarPeriodosBase(lista)
  return periodos.length ? periodos.at(-1) : 'todos'
}

function periodoAnterior(periodo, listaReferencia) {
  const periodos = listarPeriodosBase(listaReferencia)
  const idx = periodos.findIndex(p => periodoEquivalente(p, periodo))

  if (idx > 0) return periodos[idx - 1]

  return null
}

function diasNoMesDoPeriodo(periodo) {
  const mmYYYY = String(periodo || '').includes('/')
    ? String(periodo)
    : converterPeriodoParaMMYYYY(periodo)

  const [mes, ano] = mmYYYY.split('/').map(Number)

  if (!mes || !ano) return 30

  return new Date(ano, mes, 0).getDate()
}

function getResumoMetaPorPeriodo(periodo) {
  const resumo = DATA.resumo_mensal || []

  return resumo.find(r =>
    periodoEquivalente(r.periodo, periodo)
  ) || null
}



function montarFiltroPeriodoAba(idSelect, periodos, valorAtual, onChange) {
 const select = $(idSelect)
 if (!select) return

 const normalizados = [...new Set((periodos || []).filter(Boolean))]
 .sort((a, b) => periodoParaOrdem(a) - periodoParaOrdem(b))

 const assinatura = normalizados.join('|')

 if (select.dataset.assinatura !== assinatura) {
 select.innerHTML = `
 <option value="todos">Todos os períodos</option>
 ${normalizados.map(p => `
 <option value="${p}">
 ${periodoParaLabel(p)}
 </option>
 `).join('')}
 `

 select.dataset.assinatura = assinatura
 }

 if ([...select.options].some(opt => opt.value === valorAtual)) {
 select.value = valorAtual
 } else {
 select.value = 'todos'
 }

 select.onchange = e => {
 onChange(e.target.value)
 }
}

function montarFiltrosPorAba() {
 montarFiltroPeriodoAba(
 'periodoMetas',
 listarPeriodosBase(DATA.resumo_mensal),
 filtroMetas,
 valor => {
 filtroMetas = valor
 renderTudo()
 }
 )

 montarFiltroPeriodoAba(
 'periodoDiaSemana',
 listarPeriodosBase(DATA.vendas_diarias),
 filtroDiaSemana,
 valor => {
 filtroDiaSemana = valor

 if ($('selectDiaSemana')) {
 $('selectDiaSemana').dataset.loaded = ''
 }

 renderAbaDiaSemana()
 renderDiaSemanaDetalhe()
 }
 )

 montarFiltroPeriodoAba(
 'periodoCanais',
 listarPeriodosBase(DATA.resumo_mensal),
 filtroCanais,
 valor => {
 filtroCanais = valor
 renderAbaCanais(getDadosCanaisFiltrados())
 }
 )

 montarFiltroPeriodoAba(
 'periodoHorario',
 listarPeriodosBase(DATA.horarios),
 filtroHorario,
 valor => {
 filtroHorario = valor

 if ($('selectHora')) {
 $('selectHora').dataset.loaded = ''
 }

 renderAbaHorario()
 renderHoraDetalhe()
 }
 )

 montarFiltroPeriodoAba(
 'periodoGarcons',
 listarPeriodosBase(DATA.garcons),
 filtroGarcons,
 valor => {
 filtroGarcons = valor

 if ($('selectGarcomPerfil')) {
 $('selectGarcomPerfil').dataset.loaded = ''
 }

 garcomPerfilSelecionado = ''

 renderAbaGarcons()
 renderPerfilGarcom()
 renderGarconsCrescimento()
 }
 )

 montarFiltroPeriodoAba(
 'periodoCardapio',
 listarPeriodosBase(DATA.produtos),
 filtroCardapio,
 valor => {
 filtroCardapio = valor

 if ($('selectProdutoCrescimento')) {
 $('selectProdutoCrescimento').dataset.loaded = ''
 }

 renderAbaProdutos()
 }
 )

 montarFiltroPeriodoAba(
 'periodoInsights',
 listarPeriodosBase(DATA.resumo_mensal),
 filtroInsights,
 valor => {
 filtroInsights = valor
 renderInsightsGerais()
 }
 )
}

function formatarDataBR(dataISO) {
 if (!dataISO) return '—'
 const data = new Date(`${dataISO}T12:00:00`)
 return data.toLocaleDateString('pt-BR')
}

function normalizarHora(valor) {
 const texto = String(valor ?? '')
 .toLowerCase()
 .replace('h', '')
 .split(':')[0]
 .trim()

 return Number(texto)
}

function destruir(chart) {
 if (chart) chart.destroy()
}

async function init() {
 bindTabs()
 bindSubtabsGenericas()
 await carregarDados()
}

function bindTabs() {
 document.querySelectorAll('.tab').forEach(btn => {
 btn.addEventListener('click', () => {
 const tab = btn.dataset.tab

 document.querySelectorAll('.tab')
 .forEach(b => b.classList.remove('active'))

 btn.classList.add('active')

 document.querySelectorAll('.section')
 .forEach(sec => sec.classList.remove('active'))

 const sec = $(`sec-${tab}`)
 if (sec) sec.classList.add('active')
 })
 })
}

function bindSubtabsGenericas() {
 bindSubtabGroup('dia', 'diaTab')
 bindSubtabGroup('hora', 'horaTab')
 bindSubtabGroup('metas', 'metasTab')
 bindSubtabGroup('garcons', 'garconsTab')
 bindSubtabGroup('comparar', 'compararTab')
}

function bindSubtabGroup(prefixo, datasetKey) {
 document.querySelectorAll(`[data-${prefixo}-tab]`).forEach(btn => {
 btn.onclick = () => {
 const tab = btn.dataset[datasetKey]

 document.querySelectorAll(`[data-${prefixo}-tab]`)
 .forEach(b => b.classList.remove('active'))

 btn.classList.add('active')

 const secPai =
 prefixo === 'metas'
 ? '#sec-metas'
 : prefixo === 'garcons'
 ? '#sec-garcons'
 : prefixo === 'hora'
 ? '#sec-horario'
 : prefixo === 'comparar'
 ? '#sec-comparar'
 : '#sec-dia'

 document.querySelectorAll(`${secPai} .subsection`)
 .forEach(sec => sec.classList.remove('active'))

 const alvo = $(`${prefixo}-${tab}`)
 if (alvo) alvo.classList.add('active')
 }
 })
}

async function carregarDados() {
  try {
    const status = document.getElementById('status')

    if (status) status.textContent = 'Carregando...'

    const res = await fetch('/dashboard')

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    }

    const json = await res.json()

    DATA = {
      resumo_mensal: json.resumo_mensal || [],
      horarios: json.horarios || [],
      garcons: json.garcons || [],
      produtos: json.produtos || [],
      vendas_diarias: json.vendas_diarias || [],
      metas_diarias: json.metas_diarias || []
    }

    montarFiltroPeriodo()
    renderTudo()

    if (status) {
      status.textContent = `${DATA.resumo_mensal.length} períodos`
    }

  } catch (error) {
    console.error('Erro ao carregar dados:', error)

    const status = document.getElementById('status')
    if (status) status.textContent = 'Erro'
  }
}

function montarFiltroPeriodo() {
 const select = $('periodoGlobal')
 if (!select) return

 const periodos = [...new Set(
 (DATA.resumo_mensal || [])
 .map(item => item.periodo)
 .filter(Boolean)
 )].sort((a, b) => periodoParaOrdem(a) - periodoParaOrdem(b))

 select.innerHTML = `
 <option value="todos">Todos os períodos</option>
 ${periodos.map(p => `<option value="${p}">${p}</option>`).join('')}
 `

 select.onchange = e => {
 filtroPeriodo = e.target.value
 renderTudo()
 }
}

function getDadosFiltrados() {
 const dados = DATA.resumo_mensal || []

 if (filtroMetas === 'todos') return dados

 return dados.filter(item =>
 periodoEquivalente(item.periodo, filtroMetas)
 )
}

function getDadosCanaisFiltrados() {
 const dados = DATA.resumo_mensal || []

 if (filtroCanais === 'todos') return dados

 return dados.filter(item =>
 periodoEquivalente(item.periodo, filtroCanais)
 )
}

function getItemReferencia(dados) {
 if (!dados.length) return null
 return [...dados].sort((a, b) => periodoParaOrdem(a.periodo) - periodoParaOrdem(b.periodo)).at(-1)
}

function renderTudo() {
 const dados = getDadosFiltrados()

 montarFiltrosPorAba()

 if ($('kpi-fat')) renderKPIs(dados)
 if ($('tbodyResumo')) renderTabela(dados)
 if ($('chartMetas')) renderGraficoMetas(dados)
  if ($('chartMetaVisaoDiaria')) renderChartMetaVisaoDiaria()
 if ($('chartCanais')) renderGraficoCanais(dados)

 if ($('canal-salao-fat')) renderAbaCanais(getDadosCanaisFiltrados())
 if ($('hora-melhor')) renderAbaHorario()
 if ($('selectHora')) renderHoraDetalhe()
 if ($('garcon-top')) renderAbaGarcons()
 if ($('prod-top')) renderAbaProdutos()
 if ($('dia-melhor')) renderAbaDiaSemana()
 if ($('selectDiaSemana')) renderDiaSemanaDetalhe()
 if ($('meta-dia-top')) renderMetasDiarias()
 if ($('meta-canal-delivery')) renderMetasCanais()
 if ($('hist-maior-mes')) renderMetasHistorico()
 if ($('selectGarcomPerfil')) renderPerfilGarcom()
 if ($('gar-crescimento-top')) renderGarconsCrescimento()
 if ($('compararAInicio')) renderCompararPeriodos()
 if ($('insights-gerais-resumo')) renderInsightsGerais()
 if ($('insights-crescimento')) renderInsights()
}

// ===============================
// METAS
// ===============================

function renderKPIs(dados) {

 const ref = getItemReferencia(dados)

 if (!ref) return

 animarNumero(
   $('kpi-fat'),
   Number(ref.fat_real_total || 0),
   valor => fmtBRL(valor)
 )

 animarNumero(
   $('kpi-meta'),
   Number(ref.meta_total || 0),
   valor => fmtBRL(valor)
 )

 animarNumero(
   $('kpi-pct'),
   Number(ref.pct_meta_total || 0),
   valor => fmtPct(valor)
 )

 animarNumero(
   $('kpi-pessoas'),
   Number(ref.pessoas_reais || 0),
   valor => fmtNum(Math.round(valor))
 )

}
function renderTabela(dados) {
 $('tbodyResumo').innerHTML = dados.map(item => `
 <tr>
 <td>${item.periodo}</td>
 <td>${fmtBRL(item.fat_real_total)}</td>
 <td>${fmtBRL(item.meta_total)}</td>
 <td>${fmtPct(item.pct_meta_total)}</td>
 <td>${fmtBRL(item.fat_real_salao)}</td>
 <td>${fmtBRL(item.fat_real_delivery)}</td>
 <td>${fmtNum(item.pessoas_reais)}</td>
 <td>${fmtNum(item.atendimentos_total)}</td>
 </tr>
 `).join('')
}

function renderGraficoMetas(dados) {
 const ctx = $('chartMetas')
 if (!ctx) return

 destruir(chartMetas)

 chartMetas = new Chart(ctx, {
 type: 'bar',
 data: {
 labels: dados.map(d => d.periodo),
 datasets: [
 { label: 'Faturamento Real', data: dados.map(d => Number(d.fat_real_total || 0)) },
 { label: 'Meta Total', data: dados.map(d => Number(d.meta_total || 0)) }
 ]
 },
 options: { responsive: true }
 })
}

function renderChartMetaVisaoDiaria() {
  const ctx = $('chartMetaVisaoDiaria')
  if (!ctx) return

  destruir(chartMetaVisaoDiaria)

  const periodoAtual = filtroMetas === 'todos'
    ? periodoMaisRecente(DATA.resumo_mensal || [])
    : filtroMetas

  const vendas = (DATA.vendas_diarias || [])
    .filter(v => periodoEquivalente(v.periodo, periodoAtual))
    .sort((a, b) => new Date(a.data) - new Date(b.data))

  const resumoMes = getResumoMetaPorPeriodo(periodoAtual)
  const metaTotal = Number(resumoMes?.meta_total || 0)
  const diasMes = diasNoMesDoPeriodo(periodoAtual)
  const metaDiaria = diasMes ? metaTotal / diasMes : 0

  chartMetaVisaoDiaria = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: vendas.map(v => formatarDataBR(v.data)),
      datasets: [
        {
          label: 'Faturamento diário',
          data: vendas.map(v => Number(v.fat_real || 0))
        },
        {
          label: 'Meta diária',
          data: vendas.map(() => metaDiaria),
          type: 'line'
        }
      ]
    },
    options: { responsive: true }
  })
}

function renderGraficoCanais(dados) {
 const ctx = $('chartCanais')
 if (!ctx) return

 destruir(chartCanais)

 const totalSalao = dados.reduce((acc, d) => acc + Number(d.fat_real_salao || 0), 0)
 const totalDelivery = dados.reduce((acc, d) => acc + Number(d.fat_real_delivery || 0), 0)

 chartCanais = new Chart(ctx, {
 type: 'doughnut',
 data: {
 labels: ['Salão', 'Delivery'],
 datasets: [{ data: [totalSalao, totalDelivery] }]
 },
 options: { responsive: true }
 })
}

// ===============================
// CANAIS
// ===============================

function renderAbaCanais(dados) {
 const totalSalao = dados.reduce((acc, d) => acc + Number(d.fat_real_salao || 0), 0)
 const totalDelivery = dados.reduce((acc, d) => acc + Number(d.fat_real_delivery || 0), 0)
 const total = totalSalao + totalDelivery

 $('canal-salao-fat').textContent = fmtBRL(totalSalao)
 $('canal-delivery-fat').textContent = fmtBRL(totalDelivery)
 $('canal-salao-pct').textContent = fmtPct(total ? totalSalao / total : 0)
 $('canal-delivery-pct').textContent = fmtPct(total ? totalDelivery / total : 0)

 $('tbodyCanais').innerHTML = dados.map(item => {
 const salao = Number(item.fat_real_salao || 0)
 const delivery = Number(item.fat_real_delivery || 0)
 const soma = salao + delivery

 return `
 <tr>
 <td>${item.periodo}</td>
 <td>${fmtBRL(salao)}</td>
 <td>${fmtBRL(delivery)}</td>
 <td>${fmtBRL(soma)}</td>
 <td>${fmtPct(soma ? salao / soma : 0)}</td>
 <td>${fmtPct(soma ? delivery / soma : 0)}</td>
 <td>${fmtNum(item.pessoas_reais)}</td>
 <td>${fmtNum(item.atendimentos_total)}</td>
 </tr>
 `
 }).join('')

 renderChartCanaisLinha(dados)
 renderChartCanaisPizza(totalSalao, totalDelivery)
}

function renderChartCanaisLinha(dados) {
 const ctx = $('chartCanaisLinha')
 if (!ctx) return

 destruir(chartCanaisLinha)

 chartCanaisLinha = new Chart(ctx, {
 type: 'line',
 data: {
 labels: dados.map(d => d.periodo),
 datasets: [
 { label: 'Salão', data: dados.map(d => Number(d.fat_real_salao || 0)) },
 { label: 'Delivery', data: dados.map(d => Number(d.fat_real_delivery || 0)) }
 ]
 },
 options: { responsive: true }
 })
}

function renderChartCanaisPizza(totalSalao, totalDelivery) {
 const ctx = $('chartCanaisPizza')
 if (!ctx) return

 destruir(chartCanaisPizza)

 chartCanaisPizza = new Chart(ctx, {
 type: 'doughnut',
 data: {
 labels: ['Salão', 'Delivery'],
 datasets: [{ data: [totalSalao, totalDelivery] }]
 },
 options: { responsive: true }
 })
}

// ===============================
// HOR—RIO
// ===============================

function getHorariosFiltrados() {
 const horarios = DATA.horarios || []

 if (filtroHorario === 'todos') return horarios

 return horarios.filter(h =>
 periodoEquivalente(h.periodo, filtroHorario)
 )
}

function agruparHorario(horarios) {
 const mapa = {}

 horarios.forEach(h => {
 const horaNum = normalizarHora(h.hora)
 const horaLabel = Number.isFinite(horaNum) ? horaNum : h.hora

 if (!mapa[horaLabel]) {
 mapa[horaLabel] = { hora: horaLabel, fat_real: 0, pessoas: 0 }
 }

 mapa[horaLabel].fat_real += Number(h.fat_real || 0)
 mapa[horaLabel].pessoas += Number(h.pessoas || 0)
 })

 return Object.values(mapa)
 .sort((a, b) => Number(a.hora) - Number(b.hora))
 .map(h => ({
 ...h,
 ticket: h.pessoas ? h.fat_real / h.pessoas : 0
 }))
}

function renderAbaHorario() {
 const dados = agruparHorario(getHorariosFiltrados())
 if (!dados.length) return

 const melhor = [...dados].sort((a, b) => b.fat_real - a.fat_real)[0]
 const totalFat = dados.reduce((acc, h) => acc + h.fat_real, 0)
 const totalPessoas = dados.reduce((acc, h) => acc + h.pessoas, 0)
 const ticketMedio = totalPessoas ? totalFat / totalPessoas : 0

 $('hora-melhor').textContent = `${melhor.hora}h`
 $('hora-melhor-fat').textContent = fmtBRL(melhor.fat_real)
 $('hora-pessoas').textContent = fmtNum(totalPessoas)
 $('hora-ticket').textContent = fmtBRL(ticketMedio)

 $('tbodyHorario').innerHTML = dados.map(h => `
 <tr>
 <td>${h.hora}h</td>
 <td>${fmtBRL(h.fat_real)}</td>
 <td>${fmtNum(h.pessoas)}</td>
 <td>${fmtBRL(h.ticket)}</td>
 </tr>
 `).join('')

 renderChartHorarioFat(dados)
 renderChartHorarioPessoas(dados)
}

function renderChartHorarioFat(dados) {
 const ctx = $('chartHorarioFat')
 if (!ctx) return

 destruir(chartHorarioFat)

 chartHorarioFat = new Chart(ctx, {
 type: 'bar',
 data: {
 labels: dados.map(h => `${h.hora}h`),
 datasets: [{ label: 'Faturamento', data: dados.map(h => h.fat_real) }]
 },
 options: { responsive: true }
 })
}

function renderChartHorarioPessoas(dados) {
 const ctx = $('chartHorarioPessoas')
 if (!ctx) return

 destruir(chartHorarioPessoas)

 chartHorarioPessoas = new Chart(ctx, {
 type: 'line',
 data: {
 labels: dados.map(h => `${h.hora}h`),
 datasets: [{ label: 'Pessoas', data: dados.map(h => h.pessoas) }]
 },
 options: { responsive: true }
 })
}

function popularSelectHora() {
 const select = $('selectHora')
 if (!select || select.dataset.loaded) return

 const horas = [...new Set(
 getHorariosFiltrados()
 .map(h => normalizarHora(h.hora))
 .filter(h => Number.isFinite(h))
 )].sort((a, b) => a - b)

 if (horas.length) {
 select.innerHTML = horas
 .map(h => `<option value="${h}">${h}h</option>`)
 .join('')
 }

 select.onchange = renderHoraDetalhe
 select.dataset.loaded = '1'
}

function renderHoraDetalhe() {
 const select = $('selectHora')
 if (!select) return

 popularSelectHora()

 const horaSelecionada = Number(select.value)

 const horarios = getHorariosFiltrados()
 .filter(h => normalizarHora(h.hora) === horaSelecionada)
 .sort((a, b) => periodoParaOrdem(a.periodo) - periodoParaOrdem(b.periodo))

 if (!horarios.length) {
 $('hora-det-fat').textContent = '—'
 $('hora-det-fat-medio').textContent = '—'
 $('hora-det-pessoas').textContent = '—'
 $('hora-det-ticket').textContent = '—'
 $('tbodyHoraDetalhe').innerHTML = `
 <tr>
 <td colspan="4" style="text-align:left">
 Sem dados para a hora selecionada.
 </td>
 </tr>
 `
 destruir(chartHoraDetalheFat)
 destruir(chartHoraDetalhePessoas)
 return
 }

 const fatTotal = horarios.reduce((acc, h) => acc + Number(h.fat_real || 0), 0)
 const pessoasTotal = horarios.reduce((acc, h) => acc + Number(h.pessoas || 0), 0)
 const fatMedio = fatTotal / horarios.length
 const pessoasMedia = pessoasTotal / horarios.length
 const ticket = pessoasTotal ? fatTotal / pessoasTotal : 0

 $('hora-det-fat').textContent = fmtBRL(fatTotal)
 $('hora-det-fat-medio').textContent = fmtBRL(fatMedio)
 $('hora-det-pessoas').textContent = fmtNum(Math.round(pessoasMedia))
 $('hora-det-ticket').textContent = fmtBRL(ticket)

 $('tbodyHoraDetalhe').innerHTML = horarios.map(h => {
 const ticketLinha = Number(h.pessoas || 0)
 ? Number(h.fat_real || 0) / Number(h.pessoas)
 : 0

 return `
 <tr>
 <td>${h.periodo}</td>
 <td>${fmtBRL(h.fat_real)}</td>
 <td>${fmtNum(h.pessoas)}</td>
 <td>${fmtBRL(ticketLinha)}</td>
 </tr>
 `
 }).join('')

 renderChartHoraDetalheFat(horarios)
 renderChartHoraDetalhePessoas(horarios)
}

function renderChartHoraDetalheFat(horarios) {
 const ctx = $('chartHoraDetalheFat')
 if (!ctx) return

 destruir(chartHoraDetalheFat)

 chartHoraDetalheFat = new Chart(ctx, {
 type: 'line',
 data: {
 labels: horarios.map(h => h.periodo),
 datasets: [
 {
 label: 'Faturamento',
 data: horarios.map(h => Number(h.fat_real || 0))
 }
 ]
 },
 options: { responsive: true }
 })
}

function renderChartHoraDetalhePessoas(horarios) {
 const ctx = $('chartHoraDetalhePessoas')
 if (!ctx) return

 destruir(chartHoraDetalhePessoas)

 chartHoraDetalhePessoas = new Chart(ctx, {
 type: 'bar',
 data: {
 labels: horarios.map(h => h.periodo),
 datasets: [
 {
 label: 'Pessoas',
 data: horarios.map(h => Number(h.pessoas || 0))
 }
 ]
 },
 options: { responsive: true }
 })
}

// ===============================
// GAR—ONS
// ===============================

function getGarconsFiltrados() {
 const garcons = DATA.garcons || []

 if (filtroGarcons === 'todos') return garcons

 return garcons.filter(g =>
 periodoEquivalente(g.periodo, filtroGarcons)
 )
}

function removerPlataformasGarcons(dados) {
 return dados.filter(g =>
 !String(g.atendente || '').toUpperCase().includes('IFOOD')
 )
}

function renderAbaGarcons() {
 const dados = removerPlataformasGarcons(getGarconsFiltrados())
 if (!dados.length) return

 const agrupados = {}

 dados.forEach(g => {
 const nome = g.atendente || 'Sem nome'

 if (!agrupados[nome]) {
 agrupados[nome] = { atendente: nome, quantidade: 0, fat_real: 0 }
 }

 agrupados[nome].quantidade += Number(g.quantidade || 0)
 agrupados[nome].fat_real += Number(g.fat_real || 0)
 })

 const ranking = Object.values(agrupados)
 .map(g => ({
 ...g,
 ticket: g.quantidade ? g.fat_real / g.quantidade : 0
 }))
 .sort((a, b) => b.fat_real - a.fat_real)

 const top = ranking[0]
 const totalFat = ranking.reduce((acc, g) => acc + g.fat_real, 0)
 const ticketMedio = ranking.reduce((acc, g) => acc + g.ticket, 0) / ranking.length

 $('garcon-top').textContent = top.atendente
 $('garcon-top-fat').textContent = fmtBRL(top.fat_real)
 $('garcon-qtd').textContent = fmtNum(ranking.length)
 $('garcon-ticket').textContent = fmtBRL(ticketMedio)

 $('tbodyGarcons').innerHTML = ranking.map(g => `
 <tr>
 <td>${g.atendente}</td>
 <td>${fmtNum(g.quantidade)}</td>
 <td>${fmtBRL(g.fat_real)}</td>
 <td>${fmtBRL(g.ticket)}</td>
 <td>${fmtPct(totalFat ? g.fat_real / totalFat : 0)}</td>
 </tr>
 `).join('')

 renderChartGarconsRanking(ranking)
}

function renderChartGarconsRanking(ranking) {
 const ctx = $('chartGarconsRanking')
 if (!ctx) return

 destruir(chartGarconsRanking)

 chartGarconsRanking = new Chart(ctx, {
 type: 'bar',
 data: {
 labels: ranking.slice(0, 10).map(g => g.atendente),
 datasets: [
 {
 label: 'Faturamento',
 data: ranking.slice(0, 10).map(g => g.fat_real)
 }
 ]
 },
 options: { responsive: true }
 })
}

function renderPerfilGarcom() {
 const select = $('selectGarcomPerfil')
 if (!select) return

 const humanos = removerPlataformasGarcons(getGarconsFiltrados())
 const nomes = [...new Set(humanos.map(g => g.atendente))]
 .filter(Boolean)
 .sort()

 if (!select.dataset.loaded) {
 select.innerHTML = `
 <option value="">Selecione um atendente</option>
 ${nomes.map(nome => `<option value="${nome}">${nome}</option>`).join('')}
 `

 select.dataset.loaded = '1'
 select.onchange = () => {
 garcomPerfilSelecionado = select.value
 renderPerfilGarcom()
 }
 }

 if (!garcomPerfilSelecionado && nomes.length) {
 garcomPerfilSelecionado = nomes[0]
 select.value = nomes[0]
 }

 const filtrado = humanos.filter(g => g.atendente === garcomPerfilSelecionado)
 if (!filtrado.length) return

 const fat = filtrado.reduce((acc, g) => acc + Number(g.fat_real || 0), 0)
 const qtd = filtrado.reduce((acc, g) => acc + Number(g.quantidade || 0), 0)
 const ticket = qtd ? fat / qtd : 0
 const totalGeral = humanos.reduce((acc, g) => acc + Number(g.fat_real || 0), 0)
 const pct = totalGeral ? fat / totalGeral : 0

 $('perfil-fat').textContent = fmtBRL(fat)
 $('perfil-ticket').textContent = fmtBRL(ticket)
 $('perfil-qtd').textContent = fmtNum(qtd)
 $('perfil-pct').textContent = fmtPct(pct)

 renderChartPerfilGarcom(garcomPerfilSelecionado, filtrado)
 renderChartPerfilGarcomPizza(fat, totalGeral - fat)
}

function renderChartPerfilGarcom(nome, dados) {
 const ctx = $('chartPerfilGarcom')
 if (!ctx) return

 destruir(chartPerfilGarcom)

 chartPerfilGarcom = new Chart(ctx, {
 type: 'bar',
 data: {
 labels: dados.map(g => g.periodo),
 datasets: [
 {
 label: nome,
 data: dados.map(g => Number(g.fat_real || 0))
 }
 ]
 },
 options: { responsive: true }
 })
}

function renderChartPerfilGarcomPizza(fat, restante) {
 const ctx = $('chartPerfilGarcomPizza')
 if (!ctx) return

 destruir(chartPerfilGarcomPizza)

 chartPerfilGarcomPizza = new Chart(ctx, {
 type: 'doughnut',
 data: {
 labels: [garcomPerfilSelecionado, 'Outros'],
 datasets: [{ data: [fat, restante] }]
 },
 options: { responsive: true }
 })
}

function renderGarconsCrescimento() {
 if (!$('gar-crescimento-top')) return

 const humanos = removerPlataformasGarcons(getGarconsFiltrados())
 if (!humanos.length) return

 const agrupado = {}

 humanos.forEach(g => {
 const nome = g.atendente || 'Sem nome'

 if (!agrupado[nome]) {
 agrupado[nome] = { atendente: nome, fat: 0, qtd: 0 }
 }

 agrupado[nome].fat += Number(g.fat_real || 0)
 agrupado[nome].qtd += Number(g.quantidade || 0)
 })

 const lista = Object.values(agrupado).sort((a, b) => b.fat - a.fat)
 const top = lista[0]
 const media = lista.reduce((acc, g) => acc + g.fat, 0) / lista.length

 $('gar-crescimento-top').textContent = top.atendente
 $('gar-crescimento-fat').textContent = fmtBRL(top.fat)
 $('gar-crescimento-qtd').textContent = fmtNum(lista.length)
 $('gar-crescimento-media').textContent = fmtBRL(media)

 $('tbodyGarcomCrescimento').innerHTML = humanos.map(g => {
 const ticket = Number(g.quantidade || 0)
 ? Number(g.fat_real || 0) / Number(g.quantidade)
 : 0

 return `
 <tr>
 <td>${g.atendente}</td>
 <td>${g.periodo}</td>
 <td>${fmtBRL(g.fat_real)}</td>
 <td>${fmtNum(g.quantidade)}</td>
 <td>${fmtBRL(ticket)}</td>
 </tr>
 `
 }).join('')

 renderChartGarcomCrescimento(lista)
 renderChartGarcomParticipacao(lista)
}

function renderChartGarcomCrescimento(lista) {
 const ctx = $('chartGarcomCrescimento')
 if (!ctx) return

 destruir(chartGarcomCrescimento)

 chartGarcomCrescimento = new Chart(ctx, {
 type: 'bar',
 data: {
 labels: lista.map(g => g.atendente),
 datasets: [
 {
 label: 'Faturamento',
 data: lista.map(g => g.fat)
 }
 ]
 },
 options: { responsive: true }
 })
}

function renderChartGarcomParticipacao(lista) {
 const ctx = $('chartGarcomParticipacao')
 if (!ctx) return

 destruir(chartGarcomParticipacao)

 chartGarcomParticipacao = new Chart(ctx, {
 type: 'doughnut',
 data: {
 labels: lista.map(g => g.atendente),
 datasets: [{ data: lista.map(g => g.fat) }]
 },
 options: { responsive: true }
 })
}

// ===============================
// DIA DA SEMANA
// ===============================

function getVendasDiariasFiltradas() {
 const vendas = DATA.vendas_diarias || []

 if (filtroDiaSemana === 'todos') return vendas

 return vendas.filter(v =>
 periodoEquivalente(v.periodo, filtroDiaSemana)
 )
}

function getVendasDiariasMetasFiltradas() {
  const vendas = DATA.vendas_diarias || []
  const periodo = filtroMetas === 'todos'
    ? periodoMaisRecente(vendas)
    : filtroMetas

  return vendas.filter(v =>
    periodoEquivalente(v.periodo, periodo)
  )
}


function nomeDiaSemana(dataISO) {
 const dias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
 const data = new Date(`${dataISO}T12:00:00`)
 return dias[data.getDay()]
}

function agruparPorDiaSemana(vendas) {
 const ordem = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']
 const mapa = {}

 vendas.forEach(v => {
 const dia = nomeDiaSemana(v.data)

 if (!mapa[dia]) {
 mapa[dia] = { dia, fat_real: 0, pessoas: 0, ocorrencias: 0 }
 }

 mapa[dia].fat_real += Number(v.fat_real || 0)
 mapa[dia].pessoas += Number(v.pessoas || 0)
 mapa[dia].ocorrencias += 1
 })

 return ordem
 .map(dia => mapa[dia])
 .filter(Boolean)
 .map(item => ({
 ...item,
 fat_medio: item.ocorrencias ? item.fat_real / item.ocorrencias : 0,
 pessoas_media: item.ocorrencias ? item.pessoas / item.ocorrencias : 0,
 ticket: item.pessoas ? item.fat_real / item.pessoas : 0
 }))
}

function renderAbaDiaSemana() {
  const vendasMesAtual = getVendasDiariasFiltradas()
  const dados = agruparPorDiaSemana(vendasMesAtual)

  if (!dados.length) return

  const periodoAtual = filtroDiaSemana === 'todos'
    ? periodoMaisRecente(DATA.vendas_diarias || [])
    : filtroDiaSemana

  const periodoAnt = periodoAnterior(periodoAtual, DATA.vendas_diarias || [])

  const vendasMesAnterior = periodoAnt
    ? (DATA.vendas_diarias || []).filter(v =>
        periodoEquivalente(v.periodo, periodoAnt)
      )
    : []

  const dadosAnterior = agruparPorDiaSemana(vendasMesAnterior)

  const melhor = [...dados].sort((a, b) => b.fat_medio - a.fat_medio)[0]
  const fatMedioGeral = dados.reduce((acc, d) => acc + d.fat_medio, 0) / dados.length
  const pessoasMedia = dados.reduce((acc, d) => acc + d.pessoas_media, 0) / dados.length
  const totalFat = dados.reduce((acc, d) => acc + d.fat_real, 0)
  const totalPessoas = dados.reduce((acc, d) => acc + d.pessoas, 0)
  const ticketGeral = totalPessoas ? totalFat / totalPessoas : 0

  $('dia-melhor').textContent = melhor.dia
  $('dia-fat-medio').textContent = fmtBRL(fatMedioGeral)
  $('dia-pessoas').textContent = fmtNum(Math.round(pessoasMedia))
  $('dia-ticket').textContent = fmtBRL(ticketGeral)

  $('tbodyDiaSemana').innerHTML = dados.map(d => {
    const ant = dadosAnterior.find(a => a.dia === d.dia)
    const variacao = ant && ant.fat_medio
      ? ((d.fat_medio - ant.fat_medio) / ant.fat_medio) * 100
      : null

    return `
      <tr>
        <td>${d.dia}</td>
        <td>${fmtBRL(d.fat_medio)}</td>
        <td>${fmtNum(Math.round(d.pessoas_media))}</td>
        <td>${fmtBRL(d.ticket)}</td>
        <td>${fmtNum(d.ocorrencias)}${variacao === null ? '' : ` • ${variacao.toFixed(1)}% vs ant.`}</td>
      </tr>
    `
  }).join('')

  renderChartDiaSemanaFat(dados)
  renderChartDiaSemanaTicket(dados)
  renderChartDiaSemanaComparativo(dados, dadosAnterior, periodoAtual, periodoAnt)
}

function renderChartDiaSemanaComparativo(dadosAtual, dadosAnterior, periodoAtual, periodoAnt) {
  const ctx = $('chartDiaSemanaComparativo')
  if (!ctx) return

  destruir(chartDiaSemanaComparativo)

  const ordem = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']
  const mapaAtual = {}
  const mapaAnterior = {}

  dadosAtual.forEach(d => {
    mapaAtual[d.dia] = d.fat_medio
  })

  dadosAnterior.forEach(d => {
    mapaAnterior[d.dia] = d.fat_medio
  })

  chartDiaSemanaComparativo = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ordem,
      datasets: [
        {
          label: periodoParaLabel(periodoAtual || 'Atual'),
          data: ordem.map(dia => Number(mapaAtual[dia] || 0))
        },
        {
          label: periodoAnt ? periodoParaLabel(periodoAnt) : 'Mês anterior',
          data: ordem.map(dia => Number(mapaAnterior[dia] || 0))
        }
      ]
    },
    options: { responsive: true }
  })
}

function renderChartDiaSemanaFat(dados) {
 const ctx = $('chartDiaSemanaFat')
 if (!ctx) return

 destruir(chartDiaSemanaFat)

 chartDiaSemanaFat = new Chart(ctx, {
 type: 'bar',
 data: {
 labels: dados.map(d => d.dia),
 datasets: [
 {
 label: 'Faturamento médio',
 data: dados.map(d => d.fat_medio)
 }
 ]
 },
 options: { responsive: true }
 })
}

function renderChartDiaSemanaTicket(dados) {
 const ctx = $('chartDiaSemanaTicket')
 if (!ctx) return

 destruir(chartDiaSemanaTicket)

 chartDiaSemanaTicket = new Chart(ctx, {
 type: 'line',
 data: {
 labels: dados.map(d => d.dia),
 datasets: [
 {
 label: 'Ticket médio',
 data: dados.map(d => d.ticket)
 }
 ]
 },
 options: { responsive: true }
 })
}

function renderDiaSemanaDetalhe() {
 const select = $('selectDiaSemana')
 if (!select) return

 if (!select.dataset.loaded) {
 select.onchange = renderDiaSemanaDetalhe
 select.dataset.loaded = '1'
 }

 const diaSelecionado = select.value || 'Segunda'

 const vendas = getVendasDiariasFiltradas()
 .filter(v => nomeDiaSemana(v.data) === diaSelecionado)
 .sort((a, b) => new Date(a.data) - new Date(b.data))

 if (!vendas.length) {
 $('dia-det-fat').textContent = '—'
 $('dia-det-fat-medio').textContent = '—'
 $('dia-det-pessoas').textContent = '—'
 $('dia-det-ticket').textContent = '—'
 $('tbodyDiaDetalhe').innerHTML = `
 <tr>
 <td colspan="4" style="text-align:left">
 Sem dados para o dia selecionado.
 </td>
 </tr>
 `
 destruir(chartDiaDetalheFat)
 destruir(chartDiaDetalhePessoas)
 return
 }

 const fatTotal = vendas.reduce((acc, v) => acc + Number(v.fat_real || 0), 0)
 const pessoasTotal = vendas.reduce((acc, v) => acc + Number(v.pessoas || 0), 0)
 const fatMedio = fatTotal / vendas.length
 const pessoasMedia = pessoasTotal / vendas.length
 const ticketMedio = pessoasTotal ? fatTotal / pessoasTotal : 0

 $('dia-det-fat').textContent = fmtBRL(fatTotal)
 $('dia-det-fat-medio').textContent = fmtBRL(fatMedio)
 $('dia-det-pessoas').textContent = fmtNum(Math.round(pessoasMedia))
 $('dia-det-ticket').textContent = fmtBRL(ticketMedio)

 $('tbodyDiaDetalhe').innerHTML = vendas.map(v => {
 const ticket = Number(v.pessoas || 0)
 ? Number(v.fat_real || 0) / Number(v.pessoas)
 : 0

 return `
 <tr>
 <td>${formatarDataBR(v.data)}</td>
 <td>${fmtBRL(v.fat_real)}</td>
 <td>${fmtNum(v.pessoas)}</td>
 <td>${fmtBRL(ticket)}</td>
 </tr>
 `
 }).join('')

 renderChartDiaDetalheFat(vendas)
 renderChartDiaDetalhePessoas(vendas)
}

function renderChartDiaDetalheFat(vendas) {
 const ctx = $('chartDiaDetalheFat')
 if (!ctx) return

 destruir(chartDiaDetalheFat)

 chartDiaDetalheFat = new Chart(ctx, {
 type: 'line',
 data: {
 labels: vendas.map(v => formatarDataBR(v.data)),
 datasets: [
 {
 label: 'Faturamento',
 data: vendas.map(v => Number(v.fat_real || 0))
 }
 ]
 },
 options: { responsive: true }
 })
}

function renderChartDiaDetalhePessoas(vendas) {
 const ctx = $('chartDiaDetalhePessoas')
 if (!ctx) return

 destruir(chartDiaDetalhePessoas)

 chartDiaDetalhePessoas = new Chart(ctx, {
 type: 'bar',
 data: {
 labels: vendas.map(v => formatarDataBR(v.data)),
 datasets: [
 {
 label: 'Pessoas',
 data: vendas.map(v => Number(v.pessoas || 0))
 }
 ]
 },
 options: { responsive: true }
 })
}

// ===============================
// METAS SUBABAS
// ===============================

function renderMetasDiarias() {
  const vendas = getVendasDiariasMetasFiltradas()

  if (!vendas.length) {
    if ($('meta-dia-top')) $('meta-dia-top').textContent = '—'
    if ($('meta-dia-fat')) $('meta-dia-fat').textContent = '—'
    if ($('meta-dia-media')) $('meta-dia-media').textContent = '—'
    if ($('meta-dia-qtd')) $('meta-dia-qtd').textContent = '0'
    if ($('meta-dia-fat-realizado')) $('meta-dia-fat-realizado').textContent = '—'
    if ($('meta-dia-meta-prevista')) $('meta-dia-meta-prevista').textContent = '—'
    if ($('meta-dia-pct-atingido')) $('meta-dia-pct-atingido').textContent = '—'
    if ($('meta-dia-dias-corridos')) $('meta-dia-dias-corridos').textContent = '0'
    if ($('tbodyMetaDiaria')) $('tbodyMetaDiaria').innerHTML = ''
    destruir(chartMetaDiariaFat)
    destruir(chartMetaDiariaPessoas)
    destruir(chartMetaDiariaComparativo)
    return
  }

  const periodoAtual = filtroMetas === 'todos'
    ? periodoMaisRecente(DATA.resumo_mensal || [])
    : filtroMetas

  const resumoMes = getResumoMetaPorPeriodo(periodoAtual)
  const metaTotal = Number(resumoMes?.meta_total || 0)
  const diasMes = diasNoMesDoPeriodo(periodoAtual)
  const metaDiariaPlana = diasMes ? metaTotal / diasMes : 0

  // Monta mapa de meta real por data (da tabela metas_diarias)
  const metasPorData = {}
  ;(DATA.metas_diarias || []).forEach(m => {
    if (m.data) metasPorData[m.data] = Number(m.meta_total || 0)
  })

  const temMetaDiaria = Object.keys(metasPorData).length > 0

  const ordenado = [...vendas].sort((a, b) => new Date(a.data) - new Date(b.data))
  const melhor = [...ordenado].sort((a, b) => Number(b.fat_real || 0) - Number(a.fat_real || 0))[0]
  const fatRealizado = ordenado.reduce((acc, d) => acc + Number(d.fat_real || 0), 0)
  const diasCorridos = ordenado.length

  // Meta acumulada até o último dia com dado
  const metaAcumAteHoje = temMetaDiaria
    ? ordenado.reduce((acc, d) => acc + (metasPorData[d.data] ?? metaDiariaPlana), 0)
    : metaDiariaPlana * diasCorridos

  const pctAtingido = metaAcumAteHoje ? fatRealizado / metaAcumAteHoje : 0
  const media = diasCorridos ? fatRealizado / diasCorridos : 0

  $('meta-dia-top').textContent = formatarDataBR(melhor.data)
  $('meta-dia-fat').textContent = fmtBRL(melhor.fat_real)
  $('meta-dia-media').textContent = fmtBRL(media)
  $('meta-dia-qtd').textContent = fmtNum(diasCorridos)

  if ($('meta-dia-fat-realizado')) $('meta-dia-fat-realizado').textContent = fmtBRL(fatRealizado)
  if ($('meta-dia-meta-prevista')) $('meta-dia-meta-prevista').textContent = fmtBRL(metaAcumAteHoje)
  if ($('meta-dia-pct-atingido')) $('meta-dia-pct-atingido').textContent = fmtPct(pctAtingido)
  if ($('meta-dia-dias-corridos')) $('meta-dia-dias-corridos').textContent = `${fmtNum(diasCorridos)} / ${fmtNum(diasMes)}`

  let acumuladoReal = 0
  let acumuladoMeta = 0

  $('tbodyMetaDiaria').innerHTML = ordenado.map(d => {
    const ticket = Number(d.pessoas || 0)
      ? Number(d.fat_real || 0) / Number(d.pessoas)
      : 0

    const metaDia = temMetaDiaria
      ? (metasPorData[d.data] ?? metaDiariaPlana)
      : metaDiariaPlana

    acumuladoReal += Number(d.fat_real || 0)
    acumuladoMeta += metaDia

    const pctDia = metaDia ? Number(d.fat_real || 0) / metaDia : 0
    const pctAcum = acumuladoMeta ? acumuladoReal / acumuladoMeta : 0

    return `
      <tr>
        <td>${formatarDataBR(d.data)}</td>
        <td>${fmtBRL(d.fat_real)}</td>
        <td>${fmtBRL(metaDia)}</td>
        <td style="color:${pctDia >= 1 ? 'var(--green,#16a34a)' : 'var(--red,#dc2626)'}">${fmtPct(pctDia)}</td>
        <td>${fmtBRL(acumuladoReal)}</td>
        <td>${fmtBRL(acumuladoMeta)}</td>
        <td style="color:${pctAcum >= 1 ? 'var(--green,#16a34a)' : 'var(--red,#dc2626)'}">${fmtPct(pctAcum)}</td>
        <td>${fmtNum(d.pessoas)}</td>
        <td>${fmtBRL(ticket)}</td>
      </tr>
    `
  }).join('')

  renderChartMetaDiariaFat(ordenado, metasPorData, metaDiariaPlana, temMetaDiaria)
  renderChartMetaDiariaPessoas(ordenado)
  renderChartMetaDiariaComparativo(ordenado, metasPorData, metaDiariaPlana, temMetaDiaria)
}

function renderChartMetaDiariaComparativo(dados, metasPorData, metaDiariaPlana, temMetaDiaria) {
  const ctx = $('chartMetaDiariaComparativo')
  if (!ctx) return

  destruir(chartMetaDiariaComparativo)

  let acumuladoReal = 0
  let acumuladoMeta = 0

  const realizadoAcumulado = []
  const metaAcumulada = []

  dados.forEach(d => {
    acumuladoReal += Number(d.fat_real || 0)
    acumuladoMeta += temMetaDiaria
      ? (metasPorData[d.data] ?? metaDiariaPlana)
      : metaDiariaPlana

    realizadoAcumulado.push(acumuladoReal)
    metaAcumulada.push(acumuladoMeta)
  })

  chartMetaDiariaComparativo = new Chart(ctx, {
    type: 'line',
    data: {
      labels: dados.map(d => formatarDataBR(d.data)),
      datasets: [
        {
          label: 'Realizado acumulado',
          data: realizadoAcumulado,
          borderColor: 'rgba(239,68,68,0.9)',
          backgroundColor: 'rgba(239,68,68,0.1)',
          fill: false,
          tension: 0.3,
          pointRadius: 3
        },
        {
          label: 'Meta acumulada',
          data: metaAcumulada,
          borderColor: 'rgba(107,114,128,0.8)',
          backgroundColor: 'transparent',
          borderDash: [5, 4],
          fill: false,
          tension: 0,
          pointRadius: 2
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.dataset.label}: ${fmtBRL(ctx.raw)}`
          }
        }
      },
      scales: {
        y: {
          ticks: { callback: v => fmtBRL(v) }
        }
      }
    }
  })
}

function renderChartMetaDiariaFat(dados, metasPorData, metaDiariaPlana, temMetaDiaria) {
 const ctx = $('chartMetaDiariaFat')
 if (!ctx) return

 destruir(chartMetaDiariaFat)

 const metasPorDia = dados.map(d =>
   temMetaDiaria ? (metasPorData[d.data] ?? metaDiariaPlana) : metaDiariaPlana
 )

 chartMetaDiariaFat = new Chart(ctx, {
 type: 'bar',
 data: {
 labels: dados.map(d => formatarDataBR(d.data)),
 datasets: [
 {
 label: 'Faturamento Real',
 data: dados.map(d => Number(d.fat_real || 0)),
 backgroundColor: 'rgba(239,68,68,0.75)',
 order: 2
 },
 {
 label: 'Meta do Dia',
 data: metasPorDia,
 type: 'line',
 borderColor: 'rgba(107,114,128,0.9)',
 backgroundColor: 'transparent',
 borderWidth: 2,
 borderDash: [5, 4],
 pointRadius: 3,
 tension: 0,
 order: 1
 }
 ]
 },
 options: {
 responsive: true,
 plugins: {
 tooltip: {
 callbacks: {
 label: ctx => `${ctx.dataset.label}: ${fmtBRL(ctx.raw)}`
 }
 }
 },
 scales: {
 y: {
 ticks: { callback: v => fmtBRL(v) }
 }
 }
 }
 })
}

function renderChartMetaDiariaPessoas(dados) {
 const ctx = $('chartMetaDiariaPessoas')
 if (!ctx) return

 destruir(chartMetaDiariaPessoas)

 chartMetaDiariaPessoas = new Chart(ctx, {
 type: 'line',
 data: {
 labels: dados.map(d => formatarDataBR(d.data)),
 datasets: [
 {
 label: 'Pessoas',
 data: dados.map(d => Number(d.pessoas || 0))
 }
 ]
 },
 options: { responsive: true }
 })
}

function renderMetasCanais() {
 const resumo = getDadosFiltrados()
 if (!resumo.length) return

 const totalSalao = resumo.reduce((acc, r) => acc + Number(r.fat_real_salao || 0), 0)
 const totalDelivery = resumo.reduce((acc, r) => acc + Number(r.fat_real_delivery || 0), 0)
 const total = totalSalao + totalDelivery

 $('meta-canal-delivery').textContent = fmtBRL(totalDelivery)
 $('meta-canal-salao').textContent = fmtBRL(totalSalao)
 $('meta-canal-delivery-pct').textContent = fmtPct(total ? totalDelivery / total : 0)
 $('meta-canal-salao-pct').textContent = fmtPct(total ? totalSalao / total : 0)

 renderChartMetaCanaisPizza(totalSalao, totalDelivery)
 renderChartMetaCanaisBar(totalSalao, totalDelivery)
}

function renderChartMetaCanaisPizza(salao, delivery) {
 const ctx = $('chartMetaCanaisPizza')
 if (!ctx) return

 destruir(chartMetaCanaisPizza)

 chartMetaCanaisPizza = new Chart(ctx, {
 type: 'doughnut',
 data: {
 labels: ['Salão', 'Delivery'],
 datasets: [{ data: [salao, delivery] }]
 },
 options: { responsive: true }
 })
}

function renderChartMetaCanaisBar(salao, delivery) {
 const ctx = $('chartMetaCanaisBar')
 if (!ctx) return

 destruir(chartMetaCanaisBar)

 chartMetaCanaisBar = new Chart(ctx, {
 type: 'bar',
 data: {
 labels: ['Salão', 'Delivery'],
 datasets: [
 {
 label: 'Faturamento',
 data: [salao, delivery]
 }
 ]
 },
 options: { responsive: true }
 })
}

function renderMetasHistorico() {
 const dados = DATA.resumo_mensal || []
 if (!dados.length) return

 const ordenado = [...dados].sort((a, b) => periodoParaOrdem(a.periodo) - periodoParaOrdem(b.periodo))
 const maior = [...ordenado].sort((a, b) => Number(b.fat_real_total || 0) - Number(a.fat_real_total || 0))[0]
 const media = ordenado.reduce((acc, item) => acc + Number(item.fat_real_total || 0), 0) / ordenado.length

 $('hist-maior-mes').textContent = maior.periodo
 $('hist-maior-fat').textContent = fmtBRL(maior.fat_real_total)
 $('hist-media').textContent = fmtBRL(media)
 $('hist-periodos').textContent = fmtNum(ordenado.length)

 renderChartHistoricoFat(ordenado)
 renderChartHistoricoMeta(ordenado)
}

function renderChartHistoricoFat(dados) {
 const ctx = $('chartHistoricoFat')
 if (!ctx) return

 destruir(chartHistoricoFat)

 chartHistoricoFat = new Chart(ctx, {
 type: 'line',
 data: {
 labels: dados.map(d => d.periodo),
 datasets: [
 {
 label: 'Faturamento Real',
 data: dados.map(d => Number(d.fat_real_total || 0))
 },
 {
 label: 'Meta',
 data: dados.map(d => Number(d.meta_total || 0))
 }
 ]
 },
 options: { responsive: true }
 })
}

function renderChartHistoricoMeta(dados) {
 const ctx = $('chartHistoricoMeta')
 if (!ctx) return

 destruir(chartHistoricoMeta)

 chartHistoricoMeta = new Chart(ctx, {
 type: 'bar',
 data: {
 labels: dados.map(d => d.periodo),
 datasets: [
 {
 label: '% Meta',
 data: dados.map(d => Number(d.pct_meta_total || 0) * 100)
 }
 ]
 },
 options: { responsive: true }
 })
}

// ===============================
// PRODUTOS
// ===============================

function normalizarGrupoVisual(grupo) {
 const g = String(grupo || '')
 .normalize('NFD')
 .replace(/[\u0300-\u036f]/g, '')
 .trim()
 .toUpperCase()

 if (
 g === 'E.2.2 - PIZZA GRANDE' ||
 g === 'E.2.2 - PIZZAS GRANDES'
 ) {
 return 'E.2.2 - PIZZAS GRANDES'
 }

 if (
 g === 'Z - PIZZA FAMILIA' ||
 g === 'Z - PIZZAS FAMILIA'
 ) {
 return 'Z - PIZZA FAMILIA'
 }

 if (
 g === 'Z - PIZZA PEQUENA' ||
 g === 'Z - PIZZAS PEQUENAS'
 ) {
 return 'Z - PIZZA PEQUENA'
 }

 return String(grupo || '').trim()
}

function getProdutosFiltrados() {
 const produtos = DATA.produtos || []

 const filtrados = filtroCardapio === 'todos'
 ? produtos
 : produtos.filter(p =>
 periodoEquivalente(p.periodo, filtroCardapio)
 )

 return filtrados.map(p => ({
 ...p,
 grupo: normalizarGrupoVisual(p.grupo)
 }))
}

function agruparProdutos(produtos) {
 const mapa = {}

 produtos.forEach(p => {
 const chave = `${p.produto}|||${p.grupo}|||${p.tamanho || 'OUTRO'}`

 if (!mapa[chave]) {
 mapa[chave] = {
 produto: p.produto || 'Sem produto',
 grupo: p.grupo || 'Sem grupo',
 tamanho: p.tamanho || 'OUTRO',
 quantidade: 0,
 valor_total: 0
 }
 }

 mapa[chave].quantidade += Number(p.quantidade || 0)
 mapa[chave].valor_total += Number(p.valor_total || 0)
 })

 return Object.values(mapa)
 .sort((a, b) => b.valor_total - a.valor_total)
}

function bindSubtabsProdutos() {
 document.querySelectorAll('[data-prod-tab]').forEach(btn => {
 btn.onclick = () => {
 produtoSubaba = btn.dataset.prodTab

 document.querySelectorAll('[data-prod-tab]')
 .forEach(b => b.classList.remove('active'))

 btn.classList.add('active')
 renderAbaProdutos()
 }
 })
}

function renderAbaProdutos() {
 bindSubtabsProdutos()

 const produtos = getProdutosFiltrados()
 const ranking = agruparProdutos(produtos)

 if (!ranking.length) return

 if (produtoSubaba === 'categoria') renderProdutosPorCategoria(ranking)
 if (produtoSubaba === 'tamanho') renderProdutosPorTamanho(ranking)
 if (produtoSubaba === 'destaque') renderProdutosBase(ranking, 'Produtos Destaque')
 if (produtoSubaba === 'crescimento') renderProdutosCrescimento()
 if (produtoSubaba === 'cardapio') renderCardapioManual()
}

function esconderFiltrosCrescimento() {
 const filtros = $('produtos-crescimento-filtros')
 if (filtros) filtros.style.display = 'none'
}

function mostrarFiltrosCrescimento() {
 const filtros = $('produtos-crescimento-filtros')
 if (filtros) filtros.style.display = 'flex'
}

function renderProdutosPorCategoria(ranking) {
 esconderFiltrosCrescimento()

 const grupos = {}

 ranking.forEach(p => {
 const grupo = p.grupo || 'Sem grupo'

 if (!grupos[grupo]) {
 grupos[grupo] = {
 produto: grupo,
 grupo,
 tamanho: '—',
 quantidade: 0,
 valor_total: 0
 }
 }

 grupos[grupo].quantidade += Number(p.quantidade || 0)
 grupos[grupo].valor_total += Number(p.valor_total || 0)
 })

 const dados = Object.values(grupos)
 .sort((a, b) => b.valor_total - a.valor_total)

 renderProdutosBase(dados, 'Por Categoria')
}

function renderProdutosPorTamanho(ranking) {
 esconderFiltrosCrescimento()

 const tamanhos = {}

 ranking.forEach(p => {
 const tamanho = p.tamanho || 'OUTRO'

 if (!tamanhos[tamanho]) {
 tamanhos[tamanho] = {
 produto: tamanho,
 grupo: 'Tamanho',
 tamanho,
 quantidade: 0,
 valor_total: 0
 }
 }

 tamanhos[tamanho].quantidade += Number(p.quantidade || 0)
 tamanhos[tamanho].valor_total += Number(p.valor_total || 0)
 })

 const dados = Object.values(tamanhos)
 .sort((a, b) => b.valor_total - a.valor_total)

 renderProdutosBase(dados, 'Por Tamanho')
}

function renderProdutosBase(dados, titulo) {
 esconderFiltrosCrescimento()

 const top = dados[0]
 const qtdTotal = dados.reduce((acc, p) => acc + Number(p.quantidade || 0), 0)

 $('prod-top').textContent = top.produto
 $('prod-top-fat').textContent = fmtBRL(top.valor_total)
 $('prod-qtd').textContent = fmtNum(dados.length)
 $('prod-qtd-vendida').textContent = fmtNum(qtdTotal)

 $('prod-chart-ranking-title').textContent = titulo
 $('prod-chart-tamanho-title').textContent = 'Composição'
 $('prod-table-title').textContent = titulo

 $('tbodyProdutos').innerHTML = dados.slice(0, 100).map(p => `
 <tr>
 <td>${p.produto}</td>
 <td>${p.grupo || '—'}</td>
 <td>${p.tamanho || '—'}</td>
 <td>${fmtNum(p.quantidade)}</td>
 <td>${fmtBRL(p.valor_total)}</td>
 </tr>
 `).join('')

 renderChartProdutosRanking(dados)
 renderChartProdutosTamanho(dados)
}

function renderChartProdutosRanking(dados) {
 const ctx = $('chartProdutosRanking')
 if (!ctx) return

 destruir(chartProdutosRanking)

 const top10 = dados.slice(0, 10)

 chartProdutosRanking = new Chart(ctx, {
 type: 'bar',
 data: {
 labels: top10.map(p => p.produto),
 datasets: [
 {
 label: 'Faturamento',
 data: top10.map(p => Number(p.valor_total || 0))
 }
 ]
 },
 options: {
 responsive: true,
 indexAxis: 'y'
 }
 })
}

function renderChartProdutosTamanho(dados) {
 const ctx = $('chartProdutosTamanho')
 if (!ctx) return

 destruir(chartProdutosTamanho)

 const mapa = {}

 dados.forEach(p => {
 const tamanho = p.tamanho || 'OUTRO'
 mapa[tamanho] = (mapa[tamanho] || 0) + Number(p.valor_total || 0)
 })

 chartProdutosTamanho = new Chart(ctx, {
 type: 'doughnut',
 data: {
 labels: Object.keys(mapa),
 datasets: [{ data: Object.values(mapa) }]
 },
 options: { responsive: true }
 })
}

function popularFiltrosCrescimento() {
 const selectProduto = $('selectProdutoCrescimento')
 const selectComparacao = $('selectProdutoComparacao')
 const selectTamanho = $('selectTamanhoCrescimento')
 const selectMetrica = $('selectMetricaCrescimento')

 if (!selectProduto || !selectComparacao || !selectTamanho || !selectMetrica) return
 if (selectProduto.dataset.loaded) return

 const produtos = [...new Set(getProdutosFiltrados().map(p => p.produto))]
 .filter(Boolean)
 .sort()

 const opcoesProdutos = produtos
 .map(p => `<option value="${p}">${p}</option>`)
 .join('')

 selectProduto.innerHTML = `
 <option value="todos">Todos os Produtos</option>
 ${opcoesProdutos}
 `

 selectComparacao.innerHTML = `
 <option value="">Comparar com...</option>
 ${opcoesProdutos}
 `

 selectProduto.onchange = renderProdutosCrescimento
 selectComparacao.onchange = renderProdutosCrescimento
 selectTamanho.onchange = renderProdutosCrescimento
 selectMetrica.onchange = renderProdutosCrescimento

 selectProduto.dataset.loaded = '1'
}

function renderProdutosCrescimento() {
 mostrarFiltrosCrescimento()
 popularFiltrosCrescimento()

 const produtoSelecionado = $('selectProdutoCrescimento')?.value || 'todos'
 const produtoComparacao = $('selectProdutoComparacao')?.value || ''
 const tamanhoSelecionado = $('selectTamanhoCrescimento')?.value || 'todos'
 const metrica = $('selectMetricaCrescimento')?.value || 'quantidade'

 let produtosBase = getProdutosFiltrados()

 if (tamanhoSelecionado !== 'todos') {
 produtosBase = produtosBase.filter(p => (p.tamanho || 'OUTRO') === tamanhoSelecionado)
 }

 const periodos = [...new Set(produtosBase.map(p => p.periodo))]
 .filter(Boolean)
 .sort((a, b) => periodoParaOrdem(a) - periodoParaOrdem(b))

 function serieParaProduto(nomeProduto) {
 let lista = produtosBase

 if (nomeProduto !== 'todos') {
 lista = lista.filter(p => p.produto === nomeProduto)
 }

 const mapa = {}

 lista.forEach(p => {
 mapa[p.periodo] = (mapa[p.periodo] || 0) + Number(p[metrica] || 0)
 })

 return {
 lista,
 mapa,
 valores: periodos.map(periodo => mapa[periodo] || 0)
 }
 }

 const principal = serieParaProduto(produtoSelecionado)
 const comparacao = produtoComparacao ? serieParaProduto(produtoComparacao) : null

 const produtosResumo = principal.lista
 const faturamento = produtosResumo.reduce((acc, p) => acc + Number(p.valor_total || 0), 0)
 const quantidade = produtosResumo.reduce((acc, p) => acc + Number(p.quantidade || 0), 0)
 const qtdProdutos = new Set(produtosResumo.map(p => p.produto)).size

 $('prod-top').textContent = produtoSelecionado === 'todos' ? 'Produtos' : produtoSelecionado
 $('prod-top-fat').textContent = fmtBRL(faturamento)
 $('prod-qtd').textContent = fmtNum(qtdProdutos)
 $('prod-qtd-vendida').textContent = fmtNum(quantidade)

 $('prod-chart-ranking-title').textContent =
 produtoComparacao ? 'Comparação de crescimento' : 'Crescimento mensal'

 $('prod-chart-tamanho-title').textContent = 'Composição do filtro'
 $('prod-table-title').textContent = 'Crescimento por período'

 $('tbodyProdutos').innerHTML = periodos.map(periodo => {
 const valorPrincipal = principal.mapa[periodo] || 0
 const valorComparacao = comparacao ? (comparacao.mapa[periodo] || 0) : null

 return `
 <tr>
 <td>${produtoSelecionado === 'todos' ? 'Todos' : produtoSelecionado}${produtoComparacao ? ` vs ${produtoComparacao}` : ''}</td>
 <td>${periodo}</td>
 <td>${tamanhoSelecionado}</td>
 <td>${metrica === 'quantidade' ? fmtNum(valorPrincipal) : (valorComparacao !== null ? fmtNum(valorComparacao) : '—')}</td>
 <td>${metrica === 'valor_total' ? fmtBRL(valorPrincipal) : (valorComparacao !== null ? fmtBRL(valorComparacao) : '—')}</td>
 </tr>
 `
 }).join('')

 destruir(chartProdutosRanking)

 const datasets = [
 {
 label: produtoSelecionado === 'todos' ? 'Todos os Produtos' : produtoSelecionado,
 data: principal.valores
 }
 ]

 if (comparacao) {
 datasets.push({
 label: produtoComparacao,
 data: comparacao.valores
 })
 }

 chartProdutosRanking = new Chart($('chartProdutosRanking'), {
 type: 'line',
 data: { labels: periodos, datasets },
 options: { responsive: true }
 })

 renderChartProdutosTamanho(
 produtosResumo.map(p => ({
 tamanho: p.tamanho || 'OUTRO',
 valor_total: Number(p.valor_total || 0)
 }))
 )
}

function renderCardapioManual() {
 esconderFiltrosCrescimento()

 $('prod-top').textContent = 'Cardápio'
 $('prod-top-fat').textContent = 'Manual'
 $('prod-qtd').textContent = '—'
 $('prod-qtd-vendida').textContent = '—'

 $('prod-chart-ranking-title').textContent = 'Cardápio'
 $('prod-chart-tamanho-title').textContent = 'Preços'
 $('prod-table-title').textContent = 'Cardápio Manual'

 $('tbodyProdutos').innerHTML = `
 <tr>
 <td colspan="5" style="text-align:left">
 área reservada para importar manualmente sabores e preços do cardápio físico.
 </td>
 </tr>
 `

 destruir(chartProdutosRanking)
 destruir(chartProdutosTamanho)
}

// ===============================
// COMPARAR PER—ODOS
// ===============================

function configurarDatasComparacao() {
 const inputAInicio = $('compararAInicio')
 const inputAFim = $('compararAFim')
 const inputBInicio = $('compararBInicio')
 const inputBFim = $('compararBFim')

 if (!inputAInicio || inputAInicio.dataset.loaded) return

 const datas = (DATA.vendas_diarias || [])
 .map(v => v.data)
 .filter(Boolean)
 .sort()

 if (datas.length) {
 const primeira = datas[0]
 const ultima = datas[datas.length - 1]

 inputAInicio.value = primeira
 inputAFim.value = primeira
 inputBInicio.value = ultima
 inputBFim.value = ultima
 }

 ;[inputAInicio, inputAFim, inputBInicio, inputBFim].forEach(input => {
 input.onchange = renderCompararPeriodos
 })

 inputAInicio.dataset.loaded = '1'
}

function getResumoPorIntervalo(inicio, fim) {
 const vendas = (DATA.vendas_diarias || [])
 .filter(v => v.data >= inicio && v.data <= fim)

 const faturamento = vendas.reduce((acc, v) => acc + Number(v.fat_real || 0), 0)
 const pessoas = vendas.reduce((acc, v) => acc + Number(v.pessoas || 0), 0)
 const dias = vendas.length

 return {
 faturamento,
 pessoas,
 dias,
 ticket: pessoas ? faturamento / pessoas : 0
 }
}

function renderCompararPeriodos() {
 if (!$('compararAInicio')) return

 configurarDatasComparacao()

 const aInicio = $('compararAInicio').value
 const aFim = $('compararAFim').value
 const bInicio = $('compararBInicio').value
 const bFim = $('compararBFim').value

 if (!aInicio || !aFim || !bInicio || !bFim) return

 const resumoA = getResumoPorIntervalo(aInicio, aFim)
 const resumoB = getResumoPorIntervalo(bInicio, bFim)

 const diffFat = resumoB.faturamento - resumoA.faturamento
 const diffPessoas = resumoB.pessoas - resumoA.pessoas
 const diffTicket = resumoB.ticket - resumoA.ticket
 const diffDias = resumoB.dias - resumoA.dias

 const fatDiaA = resumoA.dias ? resumoA.faturamento / resumoA.dias : 0
 const fatDiaB = resumoB.dias ? resumoB.faturamento / resumoB.dias : 0
 const pessoasDiaA = resumoA.dias ? resumoA.pessoas / resumoA.dias : 0
 const pessoasDiaB = resumoB.dias ? resumoB.pessoas / resumoB.dias : 0

 const crescimentoPct = resumoA.faturamento
 ? ((resumoB.faturamento - resumoA.faturamento) / resumoA.faturamento) * 100
 : 0

 $('comp-fat-diff').textContent = fmtBRL(diffFat)
 $('comp-pessoas-diff').textContent = fmtNum(diffPessoas)
 $('comp-ticket-diff').textContent = fmtBRL(diffTicket)
 $('comp-dias-diff').textContent = fmtNum(diffDias)

 if ($('comp-fat-dia')) $('comp-fat-dia').textContent = fmtBRL(fatDiaB)
 if ($('comp-pessoas-dia')) $('comp-pessoas-dia').textContent = fmtNum(pessoasDiaB)
 if ($('comp-ticket-dia')) $('comp-ticket-dia').textContent = fmtBRL(resumoB.ticket)
 if ($('comp-crescimento-pct')) $('comp-crescimento-pct').textContent = `${crescimentoPct.toFixed(1)}%`

 $('tbodyComparar').innerHTML = `
 <tr>
 <td>Faturamento Total</td>
 <td>${fmtBRL(resumoA.faturamento)}</td>
 <td>${fmtBRL(resumoB.faturamento)}</td>
 <td>${fmtBRL(diffFat)}</td>
 </tr>

 <tr>
 <td>Faturamento/Dia</td>
 <td>${fmtBRL(fatDiaA)}</td>
 <td>${fmtBRL(fatDiaB)}</td>
 <td>${fmtBRL(fatDiaB - fatDiaA)}</td>
 </tr>

 <tr>
 <td>Pessoas</td>
 <td>${fmtNum(resumoA.pessoas)}</td>
 <td>${fmtNum(resumoB.pessoas)}</td>
 <td>${fmtNum(diffPessoas)}</td>
 </tr>

 <tr>
 <td>Pessoas/Dia</td>
 <td>${fmtNum(pessoasDiaA)}</td>
 <td>${fmtNum(pessoasDiaB)}</td>
 <td>${fmtNum(pessoasDiaB - pessoasDiaA)}</td>
 </tr>

 <tr>
 <td>Ticket Médio</td>
 <td>${fmtBRL(resumoA.ticket)}</td>
 <td>${fmtBRL(resumoB.ticket)}</td>
 <td>${fmtBRL(diffTicket)}</td>
 </tr>

 <tr>
 <td>Crescimento %</td>
 <td>—</td>
 <td>${crescimentoPct.toFixed(1)}%</td>
 <td>${crescimentoPct.toFixed(1)}%</td>
 </tr>

 <tr>
 <td>Dias</td>
 <td>${fmtNum(resumoA.dias)}</td>
 <td>${fmtNum(resumoB.dias)}</td>
 <td>${fmtNum(diffDias)}</td>
 </tr>
 `

 renderInsightsComparacao(
 resumoA,
 resumoB,
 crescimentoPct,
 fatDiaA,
 fatDiaB,
 pessoasDiaA,
 pessoasDiaB
 )

 renderChartCompararFatPorData(resumoA, resumoB)
 renderChartCompararPessoasPorData(resumoA, resumoB)
}

function renderChartCompararFatPorData(resumoA, resumoB) {
 const ctx = $('chartCompararFat')
 if (!ctx) return

 destruir(chartCompararFat)

 chartCompararFat = new Chart(ctx, {
 type: 'bar',
 data: {
 labels: ['Período A', 'Período B'],
 datasets: [
 {
 label: 'Faturamento',
 data: [resumoA.faturamento, resumoB.faturamento]
 }
 ]
 },
 options: { responsive: true }
 })
}

function renderChartCompararPessoasPorData(resumoA, resumoB) {
 const ctx = $('chartCompararPessoas')
 if (!ctx) return

 destruir(chartCompararPessoas)

 chartCompararPessoas = new Chart(ctx, {
 type: 'bar',
 data: {
 labels: ['Período A', 'Período B'],
 datasets: [
 {
 label: 'Pessoas',
 data: [resumoA.pessoas, resumoB.pessoas]
 }
 ]
 },
 options: { responsive: true }
 })
}

// ===============================
// INSIGHTS
// ===============================

function renderInsights() {
 if (!$('insights-crescimento')) return

 renderInsightsCrescimento()
 renderInsightsAlertas()
 renderInsightsProdutos()
 renderInsightsOperacao()
}

function renderInsightsCrescimento() {
 const box = $('insights-crescimento')
 const resumo = DATA.resumo_mensal || []

 if (!box || resumo.length < 2) {
 if (box) box.innerHTML = '<p>Dados insuficientes.</p>'
 return
 }

 const ordenado = [...resumo].sort((a, b) => periodoParaOrdem(a.periodo) - periodoParaOrdem(b.periodo))
 const atual = ordenado.at(-1)
 const anterior = ordenado.at(-2)

 const fatAtual = Number(atual.fat_real_total || 0)
 const fatAnterior = Number(anterior.fat_real_total || 0)
 const crescimento = fatAnterior ? ((fatAtual - fatAnterior) / fatAnterior) * 100 : 0

 box.innerHTML = `
 <div class="insight-item">
 ${crescimento >= 0 ? '' : ''}
 Faturamento mudou
 <strong>${crescimento.toFixed(1)}%</strong>
 vs período anterior.
 </div>
 `
}

function renderInsightsAlertas() {
 const box = $('insights-alertas')
 const resumo = DATA.resumo_mensal || []

 if (!box || !resumo.length) return

 const atual = [...resumo].sort((a, b) => periodoParaOrdem(a.periodo) - periodoParaOrdem(b.periodo)).at(-1)
 const meta = Number(atual.meta_total || 0)
 const real = Number(atual.fat_real_total || 0)
 const pct = meta ? (real / meta) * 100 : 0

 let alertas = ''

 if (pct < 80) {
 alertas += `
 <div class="insight-item">
  Meta abaixo de 80%.
 </div>
 `
 }

 if (!alertas) {
 alertas = `
 <div class="insight-item">
  Operação saudável.
 </div>
 `
 }

 box.innerHTML = alertas
}

function renderInsightsProdutos() {
 const box = $('insights-produtos')
 const produtos = DATA.produtos || []

 if (!box || !produtos.length) return

 const top = [...produtos]
 .sort((a, b) => Number(b.valor_total || 0) - Number(a.valor_total || 0))[0]

 box.innerHTML = `
 <div class="insight-item">
  Produto destaque:
 <strong>${top.produto}</strong>
 com <strong>${fmtBRL(top.valor_total)}</strong>.
 </div>
 `
}

function renderInsightsOperacao() {
 const box = $('insights-operacao')
 const garcons = removerPlataformasGarcons(DATA.garcons || [])

 if (!box || !garcons.length) return

 const agrupado = {}

 garcons.forEach(g => {
 const nome = g.atendente || 'Sem nome'

 if (!agrupado[nome]) {
 agrupado[nome] = { atendente: nome, fat: 0 }
 }

 agrupado[nome].fat += Number(g.fat_real || 0)
 })

 const top = Object.values(agrupado).sort((a, b) => b.fat - a.fat)[0]

 box.innerHTML = `
 <div class="insight-item">
  Garçom destaque:
 <strong>${top.atendente}</strong>
 com <strong>${fmtBRL(top.fat)}</strong>.
 </div>
 `
}

function renderInsightsComparacao(
 resumoA,
 resumoB,
 crescimentoPct,
 fatDiaA,
 fatDiaB,
 pessoasDiaA,
 pessoasDiaB
) {
 const insightsBox = $('comparar-insights')
 const alertasBox = $('comparar-alertas')

 if (!insightsBox || !alertasBox) return

 const ticketA = resumoA.ticket || 0
 const ticketB = resumoB.ticket || 0

 const diffPessoasDiaPct = pessoasDiaA
 ? ((pessoasDiaB - pessoasDiaA) / pessoasDiaA) * 100
 : 0

 const diffTicketPct = ticketA
 ? ((ticketB - ticketA) / ticketA) * 100
 : 0

 const diffFatDiaPct = fatDiaA
 ? ((fatDiaB - fatDiaA) / fatDiaA) * 100
 : 0

 let insights = ''
 let alertas = ''

 if (crescimentoPct > 0) {
 insights += `
 <div class="insight-item">
  O período B faturou <strong>${crescimentoPct.toFixed(1)}%</strong> mais que o período A.
 </div>
 `
 } else if (crescimentoPct < 0) {
 insights += `
 <div class="insight-item">
  O período B faturou <strong>${Math.abs(crescimentoPct).toFixed(1)}%</strong> menos que o período A.
 </div>
 `
 } else {
 insights += `
 <div class="insight-item">
  O faturamento ficou praticamente estável entre os períodos.
 </div>
 `
 }

 if (diffPessoasDiaPct > 0 && diffTicketPct < 0) {
 insights += `
 <div class="insight-item">
  O crescimento veio de maior fluxo: pessoas/dia subiram
 <strong>${diffPessoasDiaPct.toFixed(1)}%</strong>, mas o ticket caiu
 <strong>${Math.abs(diffTicketPct).toFixed(1)}%</strong>.
 </div>
 `
 } else if (diffPessoasDiaPct > 0 && diffTicketPct > 0) {
 insights += `
 <div class="insight-item">
  Crescimento saudável: pessoas/dia e ticket médio subiram juntos.
 </div>
 `
 } else if (diffPessoasDiaPct < 0 && diffTicketPct > 0) {
 insights += `
 <div class="insight-item">
  O ticket médio subiu, mas com menor fluxo de pessoas/dia.
 </div>
 `
 } else if (diffPessoasDiaPct < 0 && diffTicketPct < 0) {
 insights += `
 <div class="insight-item">
  Queda dupla: pessoas/dia e ticket médio caíram no período B.
 </div>
 `
 }

 if (diffFatDiaPct > 0) {
 insights += `
 <div class="insight-item">
  A eficiência diária melhorou: faturamento/dia subiu
 <strong>${diffFatDiaPct.toFixed(1)}%</strong>.
 </div>
 `
 } else if (diffFatDiaPct < 0) {
 alertas += `
 <div class="insight-item">
  Faturamento/dia caiu
 <strong>${Math.abs(diffFatDiaPct).toFixed(1)}%</strong>.
 </div>
 `
 }

 if (crescimentoPct < -10) {
 alertas += `
 <div class="insight-item">
  Queda relevante de faturamento. Vale investigar canal, produto e horário.
 </div>
 `
 }

 if (diffTicketPct < -8) {
 alertas += `
 <div class="insight-item">
  Ticket médio caiu
 <strong>${Math.abs(diffTicketPct).toFixed(1)}%</strong>.
 Pode indicar mix mais barato ou maior peso de delivery/promoções.
 </div>
 `
 }

 if (!alertas) {
 alertas = `
 <div class="insight-item">
  Nenhum alerta crítico identificado na comparação.
 </div>
 `
 }

 insightsBox.innerHTML = insights
 alertasBox.innerHTML = alertas
}

function renderInsightsGerais() {
 if (!$('insights-gerais-resumo')) return

 renderInsightsGeraisResumo()
 renderInsightsGeraisAlertas()
 renderInsightsGeraisProdutos()
 renderInsightsGeraisOperacao()
}

function getDadosInsightsFiltrados() {
 const dados = DATA.resumo_mensal || []

 if (filtroInsights === 'todos') return dados

 return dados.filter(item =>
 periodoEquivalente(item.periodo, filtroInsights)
 )
}

function renderInsightsGeraisResumo() {
 const box = $('insights-gerais-resumo')
 const resumo = getDadosInsightsFiltrados()

 if (!box || !resumo.length) return

 const ordenado = [...resumo].sort((a, b) => periodoParaOrdem(a.periodo) - periodoParaOrdem(b.periodo))
 const ultimo = ordenado.at(-1)
 const anterior = ordenado.at(-2)

 const maiorMes = [...ordenado]
 .sort((a, b) => Number(b.fat_real_total || 0) - Number(a.fat_real_total || 0))[0]

 let crescimentoHtml = ''

 if (anterior) {
 const atualFat = Number(ultimo.fat_real_total || 0)
 const anteriorFat = Number(anterior.fat_real_total || 0)
 const crescimento = anteriorFat ? ((atualFat - anteriorFat) / anteriorFat) * 100 : 0

 crescimentoHtml = `
 <div class="insight-item">
 Último período (${ultimo.periodo}) teve variação de
 <strong>${crescimento.toFixed(1)}%</strong>
 vs ${anterior.periodo}.
 </div>
 `
 }

 box.innerHTML = `
 <div class="insight-item">
  Melhor período:
 <strong>${maiorMes.periodo}</strong>
 com <strong>${fmtBRL(maiorMes.fat_real_total)}</strong>.
 </div>

 <div class="insight-item">
  último período carregado:
 <strong>${ultimo.periodo}</strong>
 com <strong>${fmtBRL(ultimo.fat_real_total)}</strong>.
 </div>

 ${crescimentoHtml}
 `
}

function renderInsightsGeraisAlertas() {
 const box = $('insights-gerais-alertas')
 const resumo = getDadosInsightsFiltrados()

 if (!box || !resumo.length) return

 const ultimo = [...resumo]
 .sort((a, b) => periodoParaOrdem(a.periodo) - periodoParaOrdem(b.periodo))
 .at(-1)

 const meta = Number(ultimo.meta_total || 0)
 const real = Number(ultimo.fat_real_total || 0)
 const pctMeta = meta ? (real / meta) * 100 : 0

 let alertas = ''

 if (pctMeta < 80) {
 alertas += `
 <div class="insight-item">
  Meta em risco: último período está em
 <strong>${pctMeta.toFixed(1)}%</strong>
 da meta.
 </div>
 `
 } else if (pctMeta < 100) {
 alertas += `
 <div class="insight-item">
  Meta ainda não batida: último período está em
 <strong>${pctMeta.toFixed(1)}%</strong>.
 </div>
 `
 }

 if (!alertas) {
 alertas = `
 <div class="insight-item">
  Nenhum alerta geral crítico identificado.
 </div>
 `
 }

 box.innerHTML = alertas
}

function renderInsightsGeraisProdutos() {
 const box = $('insights-gerais-produtos')
 const produtos = DATA.produtos || []

 if (!box || !produtos.length) return

 const agrupado = {}

 produtos.forEach(p => {
 const nome = p.produto || 'Sem produto'

 if (!agrupado[nome]) {
 agrupado[nome] = { produto: nome, quantidade: 0, valor_total: 0 }
 }

 agrupado[nome].quantidade += Number(p.quantidade || 0)
 agrupado[nome].valor_total += Number(p.valor_total || 0)
 })

 const ranking = Object.values(agrupado)
 .sort((a, b) => b.valor_total - a.valor_total)

 const topFat = ranking[0]
 const topQtd = [...ranking].sort((a, b) => b.quantidade - a.quantidade)[0]

 box.innerHTML = `
 <div class="insight-item">
  Produto com maior faturamento:
 <strong>${topFat.produto}</strong>
 com <strong>${fmtBRL(topFat.valor_total)}</strong>.
 </div>

 <div class="insight-item">
  Produto mais vendido em quantidade:
 <strong>${topQtd.produto}</strong>
 com <strong>${fmtNum(topQtd.quantidade)}</strong> unidades.
 </div>
 `
}

function renderInsightsGeraisOperacao() {
 const box = $('insights-gerais-operacao')
 const garcons = removerPlataformasGarcons(DATA.garcons || [])
 const horarios = DATA.horarios || []

 if (!box) return

 let html = ''

 if (garcons.length) {
 const agrupado = {}

 garcons.forEach(g => {
 const nome = g.atendente || 'Sem nome'

 if (!agrupado[nome]) {
 agrupado[nome] = { atendente: nome, fat: 0, qtd: 0 }
 }

 agrupado[nome].fat += Number(g.fat_real || 0)
 agrupado[nome].qtd += Number(g.quantidade || 0)
 })

 const top = Object.values(agrupado)
 .sort((a, b) => b.fat - a.fat)[0]

 html += `
 <div class="insight-item">
  Atendente líder:
 <strong>${top.atendente}</strong>
 com <strong>${fmtBRL(top.fat)}</strong>.
 </div>
 `
 }

 if (horarios.length) {
 const agrupadoHora = {}

 horarios.forEach(h => {
 const hora = normalizarHora(h.hora)

 if (!agrupadoHora[hora]) {
 agrupadoHora[hora] = { hora, fat: 0, pessoas: 0 }
 }

 agrupadoHora[hora].fat += Number(h.fat_real || 0)
 agrupadoHora[hora].pessoas += Number(h.pessoas || 0)
 })

 const topHora = Object.values(agrupadoHora)
 .sort((a, b) => b.fat - a.fat)[0]

 html += `
 <div class="insight-item">
  Horário mais forte:
 <strong>${topHora.hora}h</strong>
 com <strong>${fmtBRL(topHora.fat)}</strong>.
 </div>
 `
 }

 if (!html) {
 html = `
 <div class="insight-item">
 Sem dados operacionais suficientes.
 </div>
 `
 }

 box.innerHTML = html
}

init()
