# Mini Game A-Frame (FPS com pausa)

Pequeno jogo em primeira pessoa feito com A-Frame, com alvos gerados dinamicamente, placar e sobreposição de pausa.

## Estrutura

* `index.html` – carrega a cena A-Frame, o HUD, o overlay de pausa e inclui os assets.
* `style.css` – estilos globais simples (fundo, fontes, overflow).
* `main.js` – lógica do jogo: estado global, criação e remoção de alvos, projéteis, captura de mouse, pausa e reinício.

## Como rodar

1. Abra o `index.html` diretamente no navegador (nenhum build necessário).
2. Permita o *pointer lock* ao clicar para jogar.

## Controles

* Clique: solicita *pointer lock* (entra no modo FPS).
* WASD: movimenta.
* Mouse: olha.
* Botão esquerdo: atira.
* ESC: solta o mouse e pausa. Use **Retomar** para voltar ou **Reiniciar** para recarregar.

## Personalizações rápidas

* Ajuste o intervalo e a quantidade máxima de alvos no componente `game-environment` (atributos `spawnInterval` e `maxTargets` em `main.js`).
* Altere cor, tamanho ou velocidade dos projéteis no componente `projectile` em `main.js`.
* Edite o HUD e os textos diretamente em `index.html`.