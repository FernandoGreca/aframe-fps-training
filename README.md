# Mini Game A-Frame (FPS com pausa)

Pequeno jogo em primeira pessoa feito com A-Frame, com alvos gerados dinamicamente, placar e sobreposicao de pausa.

## Estrutura
- `index.html` – carrega a cena A-Frame, HUD, overlay de pausa e inclui os assets.
- `style.css` – estilos globais simples (fundo, fontes, overflow).
- `main.js` – logica do jogo: estado global, spawn e remocao de alvos, projeteis, captura de mouse, pausa e reinicio.

## Como rodar
1. Abra `index.html` diretamente no navegador (nenhum build necessario).
2. Permita o pointer lock quando clicar para jogar.

## Controles
- Clique: solicita pointer lock (entra no modo FPS).
- WASD: movimenta.
- Mouse: olha.
- Botao esquerdo: atira.
- ESC: solta o mouse e pausa. Use **Retomar** para voltar ou **Reiniciar** para recarregar.

## Personalizacoes rapidas
- Ajuste intervalo e quantidade maxima de alvos no componente `game-environment` (ver atributos `spawnInterval` e `maxTargets` em `main.js`).
- Mude cor, tamanho ou velocidade dos projeteis no componente `projectile` em `main.js`.
- Edite HUD e textos diretamente em `index.html`.
