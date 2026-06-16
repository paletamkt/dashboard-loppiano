import xlsx from 'xlsx'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
)

const ARQUIVO = './uploads/metas.xlsx'

const workbook = xlsx.readFile(ARQUIVO)

function numero(valor) {
  if (valor === null || valor === undefined || valor === '') return null

  if (typeof valor === 'number') return valor

  const limpo = String(valor)
    .replace('R$', '')
    .replace(/\./g, '')
    .replace(',', '.')
    .trim()

  const n = Number(limpo)

  return Number.isFinite(n) ? n : null
}

function limparTexto(valor) {
  return String(valor || '')
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

function linhaEhTotal(linha) {
  return linha
    .map(v => limparTexto(v))
    .some(v => v.includes('TOTAL'))
}

function buscarIndiceCabecalho(linhas, nomesPossiveis) {
  for (let i = 0; i < Math.min(linhas.length, 15); i++) {
    const linha = linhas[i].map(v => limparTexto(v))

    for (let j = 0; j < linha.length; j++) {
      const celula = linha[j]

      if (nomesPossiveis.some(nome => celula.includes(nome))) {
        return j
      }
    }
  }

  return -1
}

function periodoParaOrdem(periodo) {
  const meses = {
    JAN: 1,
    FEV: 2,
    MAR: 3,
    ABR: 4,
    MAI: 5,
    JUN: 6,
    JUL: 7,
    AGO: 8,
    SET: 9,
    OUT: 10,
    NOV: 11,
    DEZ: 12
  }

  const texto = limparTexto(periodo)
  const mes = texto.slice(0, 3)
  const ano = Number(`20${texto.slice(3, 5)}`)

  return ano * 100 + (meses[mes] || 0)
}

function periodoParaAnoMes(periodo) {
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

  const texto = limparTexto(periodo)
  const mes = texto.slice(0, 3)
  const ano = `20${texto.slice(3, 5)}`

  return {
    ano,
    mes: meses[mes]
  }
}

function dataISO(periodo, dia) {
  const { ano, mes } = periodoParaAnoMes(periodo)
  const d = String(Number(dia)).padStart(2, '0')

  if (!ano || !mes || !d) return null

  return `${ano}-${mes}-${d}`
}

function podeImportarMetaDiaria(periodo) {
  return periodoParaOrdem(periodo) >= periodoParaOrdem('NOV25')
}

function normalizarPeriodo(nomeAba) {
  return limparTexto(nomeAba)
}

const metasMensais = []
const metasDiarias = []

for (const nomeAba of workbook.SheetNames) {
  const aba = workbook.Sheets[nomeAba]

  const linhas = xlsx.utils.sheet_to_json(aba, {
    header: 1,
    defval: null
  })

  const periodo = normalizarPeriodo(nomeAba)

  const idxDia = buscarIndiceCabecalho(linhas, ['DIA'])
  const idxDiaSemana = buscarIndiceCabecalho(linhas, ['SEMANA'])
  const idxSalao = buscarIndiceCabecalho(linhas, ['SALAO', 'SALÃO'])
  const idxDelivery = buscarIndiceCabecalho(linhas, ['DELIVERY'])
  const idxGeral = buscarIndiceCabecalho(linhas, ['GERAL', 'TOTAL'])

  if (idxDia === -1 || idxGeral === -1) {
    console.log(`Aba ignorada: ${periodo}`)
    continue
  }

  let metaSalao = 0
  let metaDelivery = 0
  let metaTotal = 0

  let temSalao = false
  let temDelivery = false
  let diasValidos = 0

  for (const linha of linhas) {
    if (!Array.isArray(linha)) continue
    if (linhaEhTotal(linha)) continue

    const valorDia = linha[idxDia]

    let dia = null

    if (valorDia instanceof Date) {
    dia = valorDia.getDate()
    } else {
    const n = numero(valorDia)

    if (n !== null && n >= 1 && n <= 31) {
        dia = n
    } else if (n !== null && n > 40000) {
        const dataExcel = xlsx.SSF.parse_date_code(n)
        dia = dataExcel?.d || null
    }
    }

    if (dia === null || dia < 1 || dia > 31) continue

    const valorSalao =
      idxSalao >= 0
        ? numero(linha[idxSalao])
        : null

    const valorDelivery =
      idxDelivery >= 0
        ? numero(linha[idxDelivery])
        : null

    const valorGeral =
      idxGeral >= 0
        ? numero(linha[idxGeral])
        : null

    if (valorGeral === null) continue

    if (valorSalao !== null) {
      metaSalao += valorSalao
      temSalao = true
    }

    if (valorDelivery !== null) {
      metaDelivery += valorDelivery
      temDelivery = true
    }

    metaTotal += valorGeral
    diasValidos++

    if (podeImportarMetaDiaria(periodo)) {
      metasDiarias.push({
        data: dataISO(periodo, dia),
        periodo,
        dia_semana:
          idxDiaSemana >= 0
            ? String(linha[idxDiaSemana] || '').trim()
            : null,
        meta_salao: valorSalao,
        meta_delivery: valorDelivery,
        meta_total: valorGeral
      })
    }
  }

  if (!diasValidos) continue

  metasMensais.push({
    periodo,
    meta_salao: temSalao ? metaSalao : null,
    meta_delivery: temDelivery ? metaDelivery : null,
    meta_total: metaTotal
  })
}

console.log('\nMetas mensais:')
console.table(metasMensais)

console.log('\nMetas diárias:')
console.table(metasDiarias.slice(0, 20))
console.log(`Total metas diárias: ${metasDiarias.length}`)

if (!metasMensais.length) {
  console.log('Nenhuma meta mensal encontrada. Nada foi importado.')
  process.exit(0)
}

console.log('Limpando metas...')

const { error: deleteMetasError } = await supabase
  .from('metas')
  .delete()
  .neq('id', 0)

if (deleteMetasError) {
  console.error(deleteMetasError.message)
  process.exit(1)
}

console.log('Limpando metas_diarias...')

const { error: deleteDiariasError } = await supabase
  .from('metas_diarias')
  .delete()
  .neq('id', 0)

if (deleteDiariasError) {
  console.error(deleteDiariasError.message)
  process.exit(1)
}

console.log('Importando metas mensais...')

const { error: insertMetasError } = await supabase
  .from('metas')
  .insert(metasMensais)

if (insertMetasError) {
  console.error(insertMetasError.message)
  process.exit(1)
}

if (metasDiarias.length) {
  console.log('Importando metas diárias...')

  const { error: insertDiariasError } = await supabase
    .from('metas_diarias')
    .insert(metasDiarias)

  if (insertDiariasError) {
    console.error(insertDiariasError.message)
    process.exit(1)
  }
}

console.log('Metas importadas com sucesso.')