function calcularAmostra() {
  const N = parseFloat(document.getElementById("populacao").value);
  const E = parseFloat(document.getElementById("erro").value) / 100;
  const confianca = parseInt(document.getElementById("confianca").value);
  const resultadoDiv = document.getElementById("resultado");

  if (!N || !E || N <= 0 || E <= 0) {
    resultadoDiv.innerHTML = "⚠️ Preencha todos os campos corretamente.";
    return;
  }

  let Z;
  switch (confianca) {
    case 90: Z = 1.645; break;
    case 95: Z = 1.96; break;
    case 99: Z = 2.575; break;
    default: Z = 1.96;
  }

  const p = 0.5;
  const n = (N * Math.pow(Z, 2) * p * (1 - p)) /
            ((Math.pow(E, 2) * (N - 1)) + (Math.pow(Z, 2) * p * (1 - p)));

  resultadoDiv.innerHTML = `📊 Tamanho da amostra necessário: <strong>${Math.round(n)}</strong>`;
}
