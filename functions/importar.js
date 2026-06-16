import * as XLSX from 'xlsx'

export async function onRequestPost(context) {

  try {

    const formData = await context.request.formData()

    const operacao = formData.get('operacao')

    if (!operacao) {

      return Response.json({
        sucesso: false,
        erro: 'Arquivo de operação não enviado'
      }, {
        status: 400
      })

    }

    const arrayBuffer = await operacao.arrayBuffer()

    const workbook = XLSX.read(arrayBuffer, {
      type: 'array'
    })

    return Response.json({
      sucesso: true,
      arquivo: operacao.name,
      abas: workbook.SheetNames
    })

  } catch (error) {

    return Response.json({
      sucesso: false,
      erro: error.message,
      stack: error.stack
    }, {
      status: 500
    })

  }

}
