import simulationInit from "./simulation.js";
import mapMakeInit from "./mapmaker.js";

let gameController = simulationInit(true);
let mapMakerController = mapMakeInit(false);

const GAME = 0;
const MAPMAKE = 1;

let CURR_MODE = gameController.state ? GAME : MAPMAKE;

document.addEventListener('keydown', (e) => {
    switch(e.code) {
        case "KeyP":
            if (CURR_MODE === GAME) gameController.toggle();
            else mapMakerController.toggle();
            break;
        case "Tab":
            e.preventDefault();
            gameController.toggle();
            mapMakerController.toggle();
            break;
    }
})
