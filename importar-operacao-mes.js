import fs from 'fs'
import XLSX from 'xlsx'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
)

const arquivoArg = process.argv[2]

if (!arquivoArg) {
  console.log('Uso: node importar-operacao-mes.js 2026-05')
  process.exit(1)
}

const arquivo = `./uploads/operacao/${arquivoArg}.xlsx`

if (!fs.existsSync(arquivo)) {
  console.log(`Arquivo não encontrado: ${arquivo}`)
  process.exit(1)
}

const [ano, mes] = arquivoArg.split('-')
const PERIODO = `${mes}/${ano}`

console.log(`Arquivo: ${arquivo}`)
console.log(`Período: ${PERIODO}`)

const workbook = XLSX.readFile(arquivo, {
  cellDates: true
})

console.log('Abas:', workbook.SheetNames)

function numero(v) {
  if (v === null || v === undefined || v === '') return 0
  if (typeof v === 'number') return v

  return Number(
    String(v)
      .replace(/\./g, '')
      .replace(',', '.')
      .replace(/[^\d.-]/g, '')
  ) || 0
}

function normalizar(texto) {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase()
}

function linhas(nomeAba) {
  const sheet = workbook.Sheets[nomeAba]

  if (!sheet) return []

  return XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: '',
    raw: true
  })
}

function dataISO(valor) {
  if (!valor) return null

  if (valor instanceof Date) {
    return valor.toISOString().slice(0, 10)
  }

  if (typeof valor === 'number') {
    const parsed = XLSX.SSF.parse_date_code(valor)
    if (!parsed) return null

    return `${parsed.y}-${String(parsed.m).padStart(2, '0')}-${String(parsed.d).padStart(2, '0')}`
  }

  const texto = String(valor).trim()

  if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) return texto

  const partes = texto.split('/')

  if (partes.length === 3) {
    const [dia, mesTxt, anoTxt] = partes
    return `${anoTxt}-${String(mesTxt).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
  }

  return null
}

function dentroDoMes(data) {
  return data && data.startsWith(`${ano}-${mes}`)
}

function tamanhoProduto(nome) {
  const n = normalizar(nome)

  if (n.includes(' GR')) return 'GR'
  if (n.includes(' PQ')) return 'PQ'
  if (n.includes(' FM')) return 'FM'

  return null
}

function normalizarGrupoProduto(grupo) {
  const g = normalizar(grupo)

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

function processarDiario() {
  const rows = linhas('FaturamentoDiarioPorLoja')
  const dados = []

  for (const l of rows) {
    // Layout confirmado:
    // 0 = período
    // 1 = data
    // 2 = fat.total
    // 3 = serv/tx
    // 4 = fat.real
    // 5 = pessoas
    // 6 = ticket
    const data = dataISO(l[1])

    if (!dentroDoMes(data)) continue

    const item = {
      data,
      periodo: PERIODO,
      fat_total: numero(l[2]),
      serv_tx: numero(l[3]),
      fat_real: numero(l[4]),
      pessoas: numero(l[5]),
      ticket: numero(l[6])
    }

    if (!item.fat_total && !item.fat_real && !item.pessoas) continue

    dados.push(item)
  }

  return dados
}

function processarCanais() {
  const rows = linhas('ticketMedioPorModoDeVenda')
  const dados = []

  const linha = rows.find(l =>
    normalizar(l[0]) === 'LOPPIANO' &&
    normalizar(l[1]) === '1-LOPPIANO'
  )

  if (!linha) return dados

  dados.push(
    {
      periodo: PERIODO,
      canal: 'DELIVERY',
      fat_total: numero(linha[3]),
      serv_tx: numero(linha[5]),
      fat_real: numero(linha[6]),
      pessoas: numero(linha[7]),
      ticket_medio: numero(linha[8]),
      atendimentos: numero(linha[9])
    },
    {
      periodo: PERIODO,
      canal: 'SALAO',
      fat_total: numero(linha[11]),
      serv_tx: numero(linha[13]),
      fat_real: numero(linha[14]),
      pessoas: numero(linha[15]),
      ticket_medio: numero(linha[16]),
      atendimentos: numero(linha[17])
    },
    {
      periodo: PERIODO,
      canal: 'TOTAL',
      fat_total: numero(linha[19]),
      serv_tx: numero(linha[20]),
      fat_real: numero(linha[21]),
      pessoas: numero(linha[22]),
      ticket_medio: numero(linha[23]),
      atendimentos: numero(linha[24])
    }
  )

  return dados.filter(x => x.fat_real || x.pessoas || x.atendimentos)
}

function processarHorario() {
  const rows = linhas('faturamentoPorHoraLoja')
  const dados = []

  for (const l of rows) {
    // Layout confirmado:
    // 0 = hora
    // 6 = ticket
    // 7 = pessoas
    // 8 = valor total
    // 9 = serv/tx
    // 10 = total real
    const hora = numero(l[0])

    if (!(hora >= 0 && hora <= 23)) continue

    const item = {
      periodo: PERIODO,
      hora: String(hora).padStart(2, '0'),
      ticket: numero(l[6]),
      pessoas: numero(l[7]),
      fat_total: numero(l[8]),
      serv_tx: numero(l[9]),
      fat_real: numero(l[10])
    }

    if (!item.fat_total && !item.fat_real && !item.pessoas) continue

    dados.push(item)
  }

  return dados
}

function processarProdutos() {
  const rows = linhas('RelatorioMateriasiMultiLojaPorP')
  const dados = []
  let grupoAtual = null

  for (const l of rows) {
    const grupo = l[0]
    const codigo = l[1]
    const produto = l[2]

    if (normalizar(grupo).includes('TOTAL GERAL')) break
    if (normalizar(codigo).includes('SUB.TOTAL')) continue
    if (normalizar(codigo) === 'CODIGO') continue

    if (typeof grupo === 'string' && grupo.trim()) {
      grupoAtual = normalizarGrupoProduto(grupo)
    }

    if (!codigo || !produto || typeof produto !== 'string') continue

    const item = {
      periodo: PERIODO,
      grupo: grupoAtual,
      produto: produto.trim(),
      tamanho: tamanhoProduto(produto),
      quantidade: numero(l[4]),
      valor_total: numero(l[5])
    }

    if (!item.quantidade && !item.valor_total) continue

    dados.push(item)
  }

  return dados
}

function processarAtendentes() {
  const rows = linhas('VolumeDeVendasPorAtendente')
  const dados = []

  for (const l of rows) {
    // Layout confirmado:
    // 0 = loja
    // 1 = atendente
    // 2 = quantidade
    // 3 = percentual
    // 4 = valor médio
    // 5 = valor
    const loja = String(l[0] || '').trim()
    const atendente = String(l[1] || '').trim()

    if (loja !== 'Loppiano') continue
    if (!atendente || normalizar(atendente) === 'ATENDENTE') continue

    const item = {
      periodo: PERIODO,
      atendente,
      quantidade: numero(l[2]),
      percentual: numero(l[3]),
      ticket_medio: numero(l[4]),
      fat_real: numero(l[5])
    }

    if (!item.quantidade && !item.fat_real) continue

    dados.push(item)
  }

  return dados
}

async function apagarPeriodo(periodo) {
  console.log(`Apagando apenas: ${periodo}`)

  const tabelas = [
    'vendas_diarias',
    'vendas_canais',
    'vendas_horario',
    'produtos_vendidos',
    'vendas_atendentes'
  ]

  for (const tabela of tabelas) {
    const { error } = await supabase
      .from(tabela)
      .delete()
      .eq('periodo', periodo)

    if (error) {
      console.error(`Erro ao apagar ${tabela}:`, error)
      process.exit(1)
    }
  }
}

async function inserirTabela(nome, dados) {
  if (!dados.length) {
    console.log(`${nome}: nenhum dado`)
    return
  }

  const tamanhoLote = 500

  for (let i = 0; i < dados.length; i += tamanhoLote) {
    const lote = dados.slice(i, i + tamanhoLote)

    const { error } = await supabase
      .from(nome)
      .insert(lote)

    if (error) {
      console.error(`Erro ao inserir ${nome}:`, error)
      process.exit(1)
    }
  }

  console.log(`${nome}: ${dados.length} linhas`)
}

async function importar() {
  const vendasDiarias = processarDiario()
  const vendasCanais = processarCanais()
  const vendasHorario = processarHorario()
  const produtosVendidos = processarProdutos()
  const vendasAtendentes = processarAtendentes()

  console.log('\nResumo lido:')

  console.table({
    vendas_diarias: vendasDiarias.length,
    vendas_canais: vendasCanais.length,
    vendas_horario: vendasHorario.length,
    produtos_vendidos: produtosVendidos.length,
    vendas_atendentes: vendasAtendentes.length
  })

  console.log('\nAmostras:')
  console.log('diario:', vendasDiarias.slice(0, 2))
  console.log('canais:', vendasCanais.slice(0, 3))
  console.log('horario:', vendasHorario.slice(0, 2))
  console.log('produtos:', produtosVendidos.slice(0, 2))
  console.log('atendentes:', vendasAtendentes.slice(0, 2))

  if (
    !vendasDiarias.length ||
    !vendasHorario.length ||
    !produtosVendidos.length ||
    !vendasAtendentes.length
  ) {
    console.log('\nERRO: algum bloco essencial veio vazio.')
    console.log('Nada foi apagado/importado.')
    process.exit(1)
  }

  await apagarPeriodo(PERIODO)

  console.log('\nInserindo...')

  await inserirTabela('vendas_diarias', vendasDiarias)
  await inserirTabela('vendas_canais', vendasCanais)
  await inserirTabela('vendas_horario', vendasHorario)
  await inserirTabela('produtos_vendidos', produtosVendidos)
  await inserirTabela('vendas_atendentes', vendasAtendentes)

  console.log('\nImportação mensal concluída com sucesso.')
}

try {
  await importar()
} catch (error) {
  console.error(error)
  process.exit(1)
}
