import fs from 'fs'
import path from 'path'
import { spawnSync } from 'child_process'

// Uso:
// node importar-todos-meses.js
//
// Requisitos:
// 1. A pasta uploads/operacao deve existir.
// 2. Os arquivos devem seguir o padrão:
//    2025-01.xlsx
//    2025-02.xlsx
//    ...
//    2026-04.xlsx
// 3. O arquivo importar-operacao-mes.js deve estar na raiz do projeto.

const PASTA = './uploads/operacao'
const IMPORTADOR = './importar-operacao-mes.js'

if (!fs.existsSync(PASTA)) {
  console.error(`Pasta não encontrada: ${PASTA}`)
  process.exit(1)
}

if (!fs.existsSync(IMPORTADOR)) {
  console.error(`Importador mensal não encontrado: ${IMPORTADOR}`)
  console.error('Crie o arquivo importar-operacao-mes.js na raiz do projeto.')
  process.exit(1)
}

const arquivos = fs
  .readdirSync(PASTA)
  .filter(nome => /^\d{4}-\d{2}\.xlsx$/i.test(nome))
  .sort()

if (!arquivos.length) {
  console.error('Nenhum arquivo mensal encontrado em uploads/operacao.')
  console.error('Use nomes como 2025-01.xlsx, 2025-02.xlsx, 2026-04.xlsx.')
  process.exit(1)
}

console.log('Arquivos encontrados:')
console.table(arquivos)

for (const arquivo of arquivos) {
  const mes = path.basename(arquivo, '.xlsx')

  console.log('\n========================================')
  console.log(`Importando mês: ${mes}`)
  console.log('========================================\n')

  const resultado = spawnSync(
    'node',
    [IMPORTADOR, mes],
    {
      stdio: 'inherit',
      shell: false
    }
  )

  if (resultado.status !== 0) {
    console.error(`\nErro ao importar ${mes}. Processo interrompido.`)
    process.exit(resultado.status || 1)
  }
}

console.log('\n========================================')
console.log('Todos os meses foram importados com sucesso.')
console.log('========================================')
