import xlsx from 'xlsx'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
)

const ARQUIVO = './uploads/operacao.xlsx'
const workbook = xlsx.readFile(ARQUIVO)

const meses = {
  JAN: '01',
  FEV: '02',
  MAR: '03',
  ABR: '04',
  MAI: '05',
  JUN: '06',
  JUL: '07',
  AGO: '08',
  SET: '09',
  OUT: '10',
  NOV: '11',
  DEZ: '12'
}

const anosValidos = [2025, 2026]

function limparTexto(valor) {
  return String(valor || '')
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

function numero(valor) {
  if (valor === null || valor === undefined || valor === '') return 0

  if (typeof valor === 'number') return valor

  const limpo = String(valor)
    .replace('R$', '')
    .replace(/\./g, '')
    .replace(',', '.')
    .trim()

  const n = Number(limpo)

  return Number.isFinite(n) ? n : 0
}

function parseDataBR(valor) {
  if (!valor) return null

  if (valor instanceof Date) {
    return valor.toISOString().slice(0, 10)
  }

  if (typeof valor === 'number' && valor > 40000) {
    const d = xlsx.SSF.parse_date_code(valor)
    if (!d) return null

    return `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`
  }

  if (typeof valor !== 'string') return null

  const partes = valor.split('/')

  if (partes.length !== 3) return null

  const [dia, mes, ano] = partes

  return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`
}

function periodoDaData(dataISO) {
  if (!dataISO) return null

  const [ano, mes] = dataISO.split('-')

  return `${mes}/${ano}`
}

function periodoDeMesAno(mesValor, anoValor) {
  const mesTxt = limparTexto(mesValor).slice(0, 3)
  const mes = meses[mesTxt]

  if (!mes) return null

  let ano = Number(anoValor)

  if (!Number.isFinite(ano)) return null
  if (ano < 100) ano = 2000 + ano
  if (!anosValidos.includes(ano)) return null

  return `${mes}/${ano}`
}

function detectarLinhaMes(linha) {
  if (!Array.isArray(linha)) return null

  for (let i = 0; i < linha.length - 1; i++) {
    const periodo = periodoDeMesAno(linha[i], linha[i + 1])

    if (periodo) return periodo
  }

  return null
}

function linhaEhFimBloco(linha) {
  const texto = linha
    .map(v => limparTexto(v))
    .join(' ')

  return (
    texto.includes('TOTAL GERAL') ||
    texto === 'TOTAL' ||
    texto.includes(' TOTAL ')
  )
}

function linhaEhSubtotal(linha) {
  return linha
    .map(v => limparTexto(v))
    .some(v =>
      v.includes('SUB.TOTAL') ||
      v.includes('SUBTOTAL') ||
      v.includes('SUB TOTAL')
    )
}

function detectarTamanho(produto) {
  if (!produto) return null

  const nome = String(produto).toUpperCase()

  if (nome.includes(' GR') || nome.endsWith('GR')) return 'GR'
  if (nome.includes(' FM') || nome.endsWith('FM')) return 'FM'
  if (nome.includes(' PQ') || nome.endsWith('PQ')) return 'PQ'
  if (nome.includes(' MD') || nome.endsWith('MD')) return 'MD'

  return null
}

async function limparTabela(nome) {
  const { error } = await supabase
    .from(nome)
    .delete()
    .neq('id', 0)

  if (error) {
    throw new Error(`Erro ao limpar ${nome}: ${error.message}`)
  }
}

async function inserirTabela(nome, dados) {
  if (!dados.length) {
    console.log(`${nome}: nenhum dado.`)
    return
  }

  const tamanhoLote = 1000

  for (let i = 0; i < dados.length; i += tamanhoLote) {
    const lote = dados.slice(i, i + tamanhoLote)

    const { error } = await supabase
      .from(nome)
      .insert(lote)

    if (error) {
      throw new Error(`Erro ao importar ${nome}: ${error.message}`)
    }
  }

  console.log(`${nome}: ${dados.length} linhas importadas.`)
}

function processarVendasDiarias() {
  const aba = workbook.Sheets['Diário Real']

  if (!aba) {
    console.log('Aba Diário Real não encontrada.')
    return []
  }

  const linhas = xlsx.utils.sheet_to_json(aba, {
    defval: null
  })

  return linhas
    .map(l => {
      const data = parseDataBR(l.__EMPTY)

      if (!data) return null

      return {
        data,
        periodo: periodoDaData(data),
        fat_total: numero(l.Totais),
        serv_tx: numero(l.__EMPTY_1),
        fat_real: numero(l.__EMPTY_2),
        pessoas: numero(l.__EMPTY_3),
        ticket: numero(l.__EMPTY_4)
      }
    })
    .filter(Boolean)
    .filter(l =>
      l.fat_total ||
      l.fat_real ||
      l.pessoas
    )
}

function processarVendasCanais() {
  const aba = workbook.Sheets['Modo de Venda - Qtde de Pessoas']

  if (!aba) {
    console.log('Aba Modo de Venda - Qtde de Pessoas não encontrada.')
    return []
  }

  const linhas = xlsx.utils.sheet_to_json(aba, {
    header: 1,
    defval: null
  })

  const dados = []

  for (let i = 0; i < linhas.length; i++) {
    const periodo = detectarLinhaMes(linhas[i])

    if (!periodo) continue

    const linhaValores = linhas[i + 3]

    if (!linhaValores) continue

    const delivery = {
      periodo,
      canal: 'DELIVERY',
      fat_total: numero(linhaValores[3]),
      serv_tx: numero(linhaValores[5]),
      fat_real: numero(linhaValores[6]),
      pessoas: numero(linhaValores[7]),
      ticket_medio: numero(linhaValores[8]),
      atendimentos: numero(linhaValores[9])
    }

    const salao = {
      periodo,
      canal: 'SALAO',
      fat_total: numero(linhaValores[11]),
      serv_tx: numero(linhaValores[13]),
      fat_real: numero(linhaValores[14]),
      pessoas: numero(linhaValores[15]),
      ticket_medio: numero(linhaValores[16]),
      atendimentos: numero(linhaValores[17])
    }

    const total = {
      periodo,
      canal: 'TOTAL',
      fat_total: numero(linhaValores[19]),
      serv_tx: numero(linhaValores[20]),
      fat_real: numero(linhaValores[21]),
      pessoas: numero(linhaValores[22]),
      ticket_medio: numero(linhaValores[23]),
      atendimentos: numero(linhaValores[24])
    }

    if (delivery.fat_real || delivery.pessoas || delivery.atendimentos) dados.push(delivery)
    if (salao.fat_real || salao.pessoas || salao.atendimentos) dados.push(salao)
    if (total.fat_real || total.pessoas || total.atendimentos) dados.push(total)
  }

  return dados
}

function processarVendasHorario() {
  const aba =
    workbook.Sheets['Horário'] ||
    workbook.Sheets['Horário'] ||
    workbook.Sheets['Horario']

  if (!aba) {
    console.log('Aba Horário não encontrada.')
    return []
  }

  const linhas = xlsx.utils.sheet_to_json(aba, {
    header: 1,
    defval: null
  })

  let periodoAtual = null
  const dados = []

  for (const linha of linhas) {
    const periodo = detectarLinhaMes(linha)

    if (periodo) {
      periodoAtual = periodo
      continue
    }

    if (!periodoAtual) continue

    if (linhaEhFimBloco(linha)) {
      periodoAtual = null
      continue
    }

    if (linhaEhSubtotal(linha)) continue

    for (let i = 0; i < linha.length; i++) {
      const hora = numero(linha[i])

      if (!(hora >= 0 && hora <= 23)) continue

      const ticket = numero(linha[i + 6])
      const pessoas = numero(linha[i + 7])
      const fatTotal = numero(linha[i + 8])
      const servTx = numero(linha[i + 9])
      const fatReal = numero(linha[i + 10])

      if (!fatTotal && !fatReal && !pessoas) continue

      dados.push({
        periodo: periodoAtual,
        hora: String(hora).padStart(2, '0'),
        ticket,
        pessoas,
        fat_total: fatTotal,
        serv_tx: servTx,
        fat_real: fatReal
      })

      break
    }
  }

  return dados
}

function processarProdutosVendidos() {
  const aba = workbook.Sheets['Resumo de Produtos']

  if (!aba) {
    console.log('Aba Resumo de Produtos não encontrada.')
    return []
  }

  const linhas = xlsx.utils.sheet_to_json(aba, {
    header: 1,
    defval: null
  })

  let periodoAtual = null
  let grupoAtual = null
  const dados = []

  for (const linha of linhas) {
    const periodo = detectarLinhaMes(linha)

    if (periodo) {
      periodoAtual = periodo
      grupoAtual = null
      continue
    }

    if (!periodoAtual) continue

    if (linhaEhFimBloco(linha)) {
      periodoAtual = null
      grupoAtual = null
      continue
    }

    if (linhaEhSubtotal(linha)) continue

    for (let i = 0; i < linha.length; i++) {
      const grupo = linha[i]
      const codigo = linha[i + 1]
      const produto = linha[i + 2]

      if (
        typeof grupo === 'string' &&
        limparTexto(grupo) !== 'GRUPO' &&
        limparTexto(grupo) !== 'CODIGO' &&
        limparTexto(grupo) !== 'MATERIAL' &&
        !codigo &&
        !produto
      ) {
        grupoAtual = grupo
      }

      if (!codigo || limparTexto(codigo) === 'CODIGO') continue
      if (!produto || typeof produto !== 'string') continue

      const quantidade =
        numero(linha[i + 11]) ||
        numero(linha[i + 7]) ||
        numero(linha[i + 4])

      const valorTotal =
        numero(linha[i + 12]) ||
        numero(linha[i + 8]) ||
        numero(linha[i + 5])

      if (!quantidade && !valorTotal) continue

      dados.push({
        periodo: periodoAtual,
        grupo: grupoAtual,
        produto: produto.trim(),
        tamanho: detectarTamanho(produto),
        quantidade,
        valor_total: valorTotal
      })

      break
    }
  }

  return dados
}

function processarVendasAtendentes() {
  const aba = workbook.Sheets['Por Atendente']

  if (!aba) {
    console.log('Aba Por Atendente não encontrada.')
    return []
  }

  const linhas = xlsx.utils.sheet_to_json(aba, {
    header: 1,
    defval: null
  })

  let periodoAtual = null
  const dados = []

  for (const linha of linhas) {
    const periodo = detectarLinhaMes(linha)

    if (periodo) {
      periodoAtual = periodo
      continue
    }

    if (!periodoAtual) continue

    if (linhaEhFimBloco(linha)) {
      periodoAtual = null
      continue
    }

    if (linhaEhSubtotal(linha)) continue

    for (let i = 0; i < linha.length; i++) {
      const loja = linha[i]
      const atendente = linha[i + 1]

      if (loja !== 'Loppiano') continue
      if (!atendente || limparTexto(atendente) === 'ATENDENTE') continue

      const quantidade = numero(linha[i + 2])
      const percentual = numero(linha[i + 3])
      const ticketMedio = numero(linha[i + 4])
      const fatReal = numero(linha[i + 5])

      if (!quantidade && !fatReal) continue

      dados.push({
        periodo: periodoAtual,
        atendente: String(atendente).trim(),
        quantidade,
        percentual,
        ticket_medio: ticketMedio,
        fat_real: fatReal
      })

      break
    }
  }

  return dados
}

async function importarTudo() {
  console.log('Processando planilha...')
  console.log('Arquivo:', ARQUIVO)
  console.log('Abas encontradas:', workbook.SheetNames)

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

  console.log('Períodos horário:')
  console.log([...new Set(vendasHorario.map(x => x.periodo))])

  console.log('Períodos produtos:')
  console.log([...new Set(produtosVendidos.map(x => x.periodo))])

  console.log('Períodos atendentes:')
  console.log([...new Set(vendasAtendentes.map(x => x.periodo))])

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
