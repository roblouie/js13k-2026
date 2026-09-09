import { controls } from '@/core/controls';
import { initTextures } from '@/textures';
import { GameState } from '@/game-states/game.state';

let previousTime = 0;
const interval = 1000 / 60;
(async () => {
  document.onclick = () => tmpl.requestPointerLock();

  await initTextures();


  const gameState = new GameState();
  await gameState.onEnter();

  draw(0);

  function draw(currentTime: number) {
    const delta = currentTime - previousTime;

    if (delta >= interval) {
      previousTime = currentTime - (delta % interval);

      controls.queryController();
      gameState.onUpdate();
    }
    requestAnimationFrame(draw);
  }
})();

