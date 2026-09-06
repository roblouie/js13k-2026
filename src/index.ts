import { controls } from '@/core/controls';
import {initTextures, materials} from '@/textures';
import { GameState } from '@/game-states/game.state';
import {MoldableCubeGeometry} from "@/engine/moldable-cube-geometry";
import {makeGrassMountainRegion} from "@/engine/svg-maker/svg-string-converters";

let previousTime = 0;
const interval = 1000 / 60;
// msg.innerHTML = '';
startGame();
async function startGame() {
  document.onclick = () => tmpl.requestPointerLock();
    // tmpl.requestPointerLock();

  await initTextures();


    const gameState = new GameState();
    await gameState.onEnter();

    let bgColor = 0.0;
    tmpl.style.backgroundColor = 'none';

  // function fadeIn() {
  //     bgColor -= 0.008;
  //     tmpl.style.backgroundColor = `rgba(0.0, 0.0, 0.0, ${bgColor}`;
  //     if (bgColor > 0) {
  //       setTimeout(fadeIn, 10);
  //     } else {
  //       tmpl.style.backgroundColor = 'none';
  //     }
  //   }
  //
  //   fadeIn();
  controls.enableControls();

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
}

