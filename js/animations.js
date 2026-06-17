function animarNumero(elemento, valorFinal, duracao = 1200) {

  const inicio = 0
  const inicioTempo = performance.now()

  function atualizar(tempoAtual) {

    const progresso =
      Math.min((tempoAtual - inicioTempo) / duracao, 1)

    const valor =
      inicio + ((valorFinal - inicio) * progresso)

    elemento.textContent =
      Math.round(valor).toLocaleString('pt-BR')

    if (progresso < 1) {
      requestAnimationFrame(atualizar)
    }

  }

  requestAnimationFrame(atualizar)

}
