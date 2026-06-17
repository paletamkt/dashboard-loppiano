function animarNumero(
  elemento,
  valorFinal,
  formatador = null,
  duracao = 1200
) {

  if (!elemento) return

  const inicio = 0
  const inicioTempo = performance.now()

  function atualizar(tempoAtual) {

    const progresso =
      Math.min(
        (tempoAtual - inicioTempo) / duracao,
        1
      )

    const valorAtual =
      inicio +
      ((valorFinal - inicio) * progresso)

    if (formatador) {

      elemento.textContent =
        formatador(valorAtual)

    } else {

      elemento.textContent =
        Math.round(valorAtual)
          .toLocaleString('pt-BR')

    }

    if (progresso < 1) {
      requestAnimationFrame(atualizar)
    }

  }

  requestAnimationFrame(atualizar)

}
