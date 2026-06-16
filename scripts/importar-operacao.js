import xlsx from 'xlsx'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
)

const workbook = xlsx.readFile('./uploads/operacao.xlsx')

const meses = {
  JAN: '01', FEV: '02', MAR: '03', ABR: '04',
  MAI: '05', JUN: '06', JUL: '07', AGO: '08',
  SET: '09', OUT: '10', NOV: '11', DEZ: '12'
}

function parseDataBR(valor) {
  if (!valor || typeof valor !== 'string') return null
  const [dia, mes, ano] = valor.split('/')
  if (!dia || !mes || !ano) return null
  return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`
}

function periodoDaData(dataISO) {
  if (!dataISO) return null
  const [ano, mes] = dataISO.split('-')
  return `${mes}/${ano}`
}

function detectarTamanho(produto) {
  if (!produto) return null
  const nome = produto.toUpperCase()
  if (nome.includes(' GR') || nome.endsWith('GR')) return 'GR'
  if (nome.includes(' FM') || nome.endsWith('FM')) return 'FM'
  if (nome.includes(' PQ') || nome.endsWith('PQ')) return 'PQ'
  if (nome.includes(' MD') || nome.endsWith('MD')) return 'MD'
  return null
}

async function limparTabela(nome) {
  const { error } = await supabase.from(nome).delete().neq('id', 0)
  if (error) throw new Error(`Erro ao limpar ${nome}: ${error.message}`)
}

async function inserirTabela(nome, dados) {
  if (!dados.length) {
    console.log(`${nome}: nenhum dado.`)
    return
  }

  const { error } = await supabase.from(nome).insert(dados)
  if (error) throw new Error(`Erro ao importar ${nome}: ${error.message}`)

  console.log(`${nome}: ${dados.length} linhas importadas.`)
}

function processarVendasDiarias() {
  const aba = workbook.Sheets['Diário Real']
  const linhas = xlsx.utils.sheet_to_json(aba, { defval: null })

  return linhas
    .filter(l => l.__EMPTY && l.Totais && l.__EMPTY_2)
    .map(l => {
      const data = parseDataBR(l.__EMPTY)

      return {
        data,
        periodo: periodoDaData(data),
        fat_total: Number(l.Totais) || 0,
        serv_tx: Number(l.__EMPTY_1) || 0,
        fat_real: Number(l.__EMPTY_2) || 0,
        pessoas: Number(l.__EMPTY_3) || 0,
        ticket: Number(l.__EMPTY_4) || 0
      }
    })
    .filter(l => l.data)
}

function processarVendasCanais() {
  const aba = workbook.Sheets['Modo de Venda - Qtde de Pessoas']
  const linhas = xlsx.utils.sheet_to_json(aba, { header: 1, defval: null })

  const dados = []

  for (let i = 0; i < linhas.length; i++) {
    const periodo = linhas[i][0]

    if (!(typeof periodo === 'string' && periodo.match(/^[A-Z]{3}\d{2}$/))) continue

    const l = linhas[i + 3]
    if (!l) continue

    dados.push({
      periodo,
      canal: 'DELIVERY',
      fat_total: Number(l[3]) || 0,
      serv_tx: Number(l[5]) || 0,
      fat_real: Number(l[6]) || 0,
      pessoas: Number(l[7]) || 0,
      ticket_medio: Number(l[8]) || 0,
      atendimentos: Number(l[9]) || 0
    })

    dados.push({
      periodo,
      canal: 'SALAO',
      fat_total: Number(l[11]) || 0,
      serv_tx: Number(l[13]) || 0,
      fat_real: Number(l[14]) || 0,
      pessoas: Number(l[15]) || 0,
      ticket_medio: Number(l[16]) || 0,
      atendimentos: Number(l[17]) || 0
    })

    dados.push({
      periodo,
      canal: 'TOTAL',
      fat_total: Number(l[19]) || 0,
      serv_tx: Number(l[20]) || 0,
      fat_real: Number(l[21]) || 0,
      pessoas: Number(l[22]) || 0,
      ticket_medio: Number(l[23]) || 0,
      atendimentos: Number(l[24]) || 0
    })
  }

  return dados
}

function processarVendasHorario() {
  const aba = workbook.Sheets['Horário']
  const linhas = xlsx.utils.sheet_to_json(aba, { header: 1, defval: null })

  let periodoAtual = null
  const dados = []

  for (const l of linhas) {
    const primeira = l[0]
    const segunda = l[1]

    if (typeof primeira === 'string' && meses[primeira] && Number(segunda)) {
      periodoAtual = `${meses[primeira]}/20${segunda}`
      continue
    }

    if (!(typeof primeira === 'number' && primeira >= 0 && primeira <= 23)) continue
    if (!periodoAtual) continue

    const fatTotal = Number(l[8]) || 0
    const fatReal = Number(l[10]) || 0
    const pessoas = Number(l[7]) || 0

    if (fatTotal === 0 && fatReal === 0 && pessoas === 0) continue

    dados.push({
      periodo: periodoAtual,
      hora: String(primeira).padStart(2, '0'),
      ticket: Number(l[6]) || 0,
      pessoas,
      fat_total: fatTotal,
      serv_tx: Number(l[9]) || 0,
      fat_real: fatReal
    })
  }

  return dados
}

function processarProdutosVendidos() {
  const aba = workbook.Sheets['Resumo de Produtos']
  const linhas = xlsx.utils.sheet_to_json(aba, { header: 1, defval: null })

  let periodoAtual = null
  let grupoAtual = null
  const dados = []

  for (const l of linhas) {
    const primeira = l[0]
    const segunda = l[1]

    if (typeof primeira === 'string' && meses[primeira] && Number(segunda)) {
      periodoAtual = `${meses[primeira]}/20${segunda}`
      grupoAtual = null
      continue
    }

    if (!periodoAtual) continue

    const grupo = l[0]
    const codigo = l[1]
    const produto = l[2]

    if (typeof grupo === 'string' && grupo !== 'Grupo') {
      grupoAtual = grupo
    }

    if (!codigo || codigo === 'Código' || codigo === 'Sub.Total') continue
    if (!produto || typeof produto !== 'string') continue

    dados.push({
      periodo: periodoAtual,
      grupo: grupoAtual,
      produto: produto.trim(),
      tamanho: detectarTamanho(produto),
      quantidade: Number(l[11]) || Number(l[7]) || Number(l[4]) || 0,
      valor_total: Number(l[12]) || Number(l[8]) || Number(l[5]) || 0
    })
  }

  return dados
}

function processarVendasAtendentes() {
  const aba = workbook.Sheets['Por Atendente']
  const linhas = xlsx.utils.sheet_to_json(aba, { header: 1, defval: null })

  let periodoAtual = null
  const dados = []

  for (const l of linhas) {
    const primeira = l[0]
    const segunda = l[1]

    if (typeof primeira === 'string' && meses[primeira] && Number(segunda)) {
      periodoAtual = `${meses[primeira]}/20${segunda}`
      continue
    }

    const loja = l[0]
    const atendente = l[1]

    if (!periodoAtual) continue
    if (loja !== 'Loppiano') continue
    if (!atendente || atendente === 'Atendente') continue

    dados.push({
      periodo: periodoAtual,
      atendente: String(atendente).trim(),
      quantidade: Number(l[2]) || 0,
      percentual: Number(l[3]) || 0,
      ticket_medio: Number(l[4]) || 0,
      fat_real: Number(l[5]) || 0
    })
  }

  return dados
}

async function importarTudo() {
  console.log('Processando planilha...')

  const vendasDiarias = processarVendasDiarias()
  const vendasCanais = processarVendasCanais()
  const vendasHorario = processarVendasHorario()
  const produtosVendidos = processarProdutosVendidos()
  const vendasAtendentes = processarVendasAtendentes()

  console.log({
    vendas_diarias: vendasDiarias.length,
    vendas_canais: vendasCanais.length,
    vendas_horario: vendasHorario.length,
    produtos_vendidos: produtosVendidos.length,
    vendas_atendentes: vendasAtendentes.length
  })

  console.log('Limpando tabelas...')

  await limparTabela('vendas_diarias')
  await limparTabela('vendas_canais')
  await limparTabela('vendas_horario')
  await limparTabela('produtos_vendidos')
  await limparTabela('vendas_atendentes')

  console.log('Importando dados...')

  await inserirTabela('vendas_diarias', vendasDiarias)
  await inserirTabela('vendas_canais', vendasCanais)
  await inserirTabela('vendas_horario', vendasHorario)
  await inserirTabela('produtos_vendidos', produtosVendidos)
  await inserirTabela('vendas_atendentes', vendasAtendentes)

  console.log('Importação da operação concluída com sucesso.')
}

try {
  await importarTudo()
} catch (error) {
  console.error(error.message)
  process.exit(1)
}