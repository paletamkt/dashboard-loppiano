export async function onRequestPost(context) {

  try {

    const formData = await context.request.formData()

    const operacao = formData.get('operacao')
    const metas = formData.get('metas')

    return Response.json({
      sucesso: true,
      operacao: operacao?.name || null,
      metas: metas?.name || null,
      tamanho_operacao: operacao?.size || 0,
      tamanho_metas: metas?.size || 0
    })

  } catch (error) {

    return Response.json({
      sucesso: false,
      erro: error.message
    }, {
      status: 500
    })

  }

}
