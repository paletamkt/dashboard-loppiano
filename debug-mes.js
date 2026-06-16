import xlsx from 'xlsx'

const wb = xlsx.readFile('./uploads/operacao/2026-03.xlsx', {
  cellDates: true
})

for (const nome of wb.SheetNames) {
  const ws = wb.Sheets[nome]

  const linhas = xlsx.utils.sheet_to_json(ws, {
    header: 1,
    defval: null,
    raw: true
  })

  console.log('\nABA:', nome)
  console.log('LINHAS:', linhas.length)
  console.log(linhas.slice(0, 12))
}