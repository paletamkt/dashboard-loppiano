import xlsx from 'xlsx'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
)

const workbook = xlsx.readFile('./uploads/metas.xlsx')

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

function linhaEhDiaValido(valor) {
  const n = numero(valor)

  return n !== null && n >= 1 && n <= 31
}

const dados = []

for (const nomeAba of workbook.SheetNames) {
  const aba = workbook.Sheets[nomeAba]

  const linhas = xlsx.utils.sheet_to_json(aba, {
    header: 1,
    defval: null
  })

  console.log('ABA:', nomeAba)
  console.table(linhas.slice(0, 8))
  process.exit()

  let metaSalao = 0
  let metaDelivery = 0
  let metaTotal = 0

  let temSalao = false
  let temDelivery = false
  let diasValidos = 0

  for (const linha of linhas) {
    const dia = linha[2]

    if (!linhaEhDiaValido(dia)) continue

    const valorSalao = numero(linha[4])
    const valorDelivery = numero(linha[5])
    const valorTotal = numero(linha[6])

    if (valorSalao !== null) {
      metaSalao += valorSalao
      temSalao = true
    }

    if (valorDelivery !== null) {
      metaDelivery += valorDelivery
      temDelivery = true
    }

    if (valorTotal !== null) {
      metaTotal += valorTotal
    }

    diasValidos++
  }

  if (!diasValidos) continue

  dados.push({
    periodo: nomeAba,
    meta_salao: temSalao ? metaSalao : null,
    meta_delivery: temDelivery ? metaDelivery : null,
    meta_total: metaTotal
  })
}

console.table(dados)

console.log('Limpando metas...')

const { error: deleteError } = await supabase
  .from('metas')
  .delete()
  .neq('id', 0)

if (deleteError) {
  console.error(deleteError.message)
  process.exit(1)
}

console.log('Importando metas...')

const { error } = await supabase
  .from('metas')
  .insert(dados)

if (error) {
  console.error(error.message)
  process.exit(1)
}

console.log('Metas importadas com sucesso.')