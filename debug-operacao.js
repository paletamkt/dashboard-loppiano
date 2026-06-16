import xlsx from 'xlsx'

const workbook = xlsx.readFile('./uploads/operacao.xlsx')

function mostrarAba(nomeAba, inicio = 0, fim = 80) {
  const aba = workbook.Sheets[nomeAba]

  if (!aba) {
    console.log(`Aba não encontrada: ${nomeAba}`)
    return
  }

  const linhas = xlsx.utils.sheet_to_json(aba, {
    header: 1,
    defval: null
  })

  console.log('\n==============================')
  console.log(nomeAba)
  console.log('Total de linhas:', linhas.length)
  console.log('==============================')

  linhas.slice(inicio, fim).forEach((linha, index) => {
    console.log(`Linha ${inicio + index}:`, linha)
  })
}

console.log('Abas encontradas:')
console.log(workbook.SheetNames)

mostrarAba('Horário', 0, 80)
mostrarAba('Resumo de Produtos', 0, 100)
mostrarAba('Por Atendente', 0, 100)