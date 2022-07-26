export default function mapMakerInit(state) {

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const HEIGHT = document.body.clientHeight;
const WIDTH = document.body.clientWidth;

const UNIT_WIDTH = 1;

canvas.height = HEIGHT;
canvas.width = WIDTH;
canvas.style.height = HEIGHT;
canvas.style.width = WIDTH;

const ANT_SPAWN = 0;
const WALL = 1;
const FOOD = 2;
const GROUND = 3;

const ANT_SPAWN_COLOR = 'red';
const WALL_COLOR = 'white';
const FOOD_COLOR = 'green';
const GROUND_COLOR = 'black';

let brush = {
    type: WALL,
    size: 2,
}

const FPS = 60;

class CONTROLLER {
    constructor(state) {
        this.state = state;
    }

    toggle() {
        this.state = !this.state;
        if (this.state) {
            console.log('yoo')
            init();
        }
    }
}

const controller = new CONTROLLER(state)

// FIRST STEP - make a map generating script REALLY REALLY QUICKLY

let gridMap;
fetch("map.json")
.then(response => response.json())
.then(json => {
    gridMap = json.map;
    if (controller.state) {
        init();
    }
});

const mouse = {
    x: 0,
    y: 0,
    left: false,
    right: false,
}

function init() {
    if (gridMap.length === 0) {
        for (let y = 0; y < Math.ceil(HEIGHT / UNIT_WIDTH); y++) {
            gridMap.push([]);
            for (let x = 0; x < Math.ceil(WIDTH / UNIT_WIDTH); x++) {
                gridMap[y].push(GROUND);
            }
        }
    }

    document.addEventListener('mousemove', (e) => {
        mouse.x = e.x;
        mouse.y = e.y;
    });

    document.addEventListener('mousedown', (e) => {
        mouse.left = e.button === 0;
        mouse.right = e.button === 2;
    })

    document.addEventListener('mouseup', (e) => {
        mouse.left = false;
        mouse.right = false;
    })

    document.addEventListener('keydown', (e) => {
        // THIS LOSES DOUBLE ARRAY STRUCTURE WATCH OUT
        switch(e.code) {
            case "KeyS":
                let string = '';
                for (const row of gridMap) {
                    string += `[${row.toString()}],\n`
                }

                navigator.clipboard.writeText(string);
                break;
            case "KeyG":
                brush.type = GROUND;
                break;

            case "KeyF":
                brush.type = FOOD;
                break;

            case "KeyA":
                brush.type = ANT_SPAWN;
                break;
            
            case "KeyW":
                brush.type = WALL;
                break;
            
            case "Backspace":
            case "KeyR":
                gridMap = [];

                for (let y = 0; y < Math.ceil(HEIGHT / UNIT_WIDTH); y++) {
                    gridMap.push([]);
                    for (let x = 0; x < Math.ceil(WIDTH / UNIT_WIDTH); x++) {
                        gridMap[y].push(GROUND);
                    }
                }
                break;
            
            case "ArrowUp":
                brush.size++;
                break;
            case "ArrowDown":
                brush.size = brush.size - 1 > 0 ? brush.size - 1 : brush.size;
                break;
        }
    })

    setTimeout(loop, 1000 / FPS);
}

function reset() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = GROUND_COLOR;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
}

function loop() {
    reset();

    let clampedX = Math.floor(mouse.x / UNIT_WIDTH);
    let clampedY = Math.floor(mouse.y / UNIT_WIDTH);
    
    if (mouse.left || mouse.right) {
        if (mouse.left) {
            for (let offsetX = -brush.size; offsetX <= brush.size; offsetX++) {
                for (let offsetY = -brush.size; offsetY <= brush.size; offsetY++) {
                    if (clampedX + offsetX >= 0 && clampedX + offsetX < gridMap[0].length && clampedY + offsetY >= 0 && clampedY + offsetY < gridMap.length) {
                        gridMap[clampedY + offsetY][clampedX + offsetX] = brush.type;
                    }
                }
            }
        }
        else ctx.fillStyle = GROUND_COLOR;
    }

    for (let y = 0; y < gridMap.length; y++) {
        for (let x = 0; x < gridMap[y].length; x++) {

            if (clampedX === x && clampedY === y) {
                ctx.fillStyle = 'gray';
                ctx.fillRect(x - brush.size, y - brush.size, brush.size * 2, brush.size * 2);
            }
            else {
                if (Math.abs(x - clampedX) <= brush.size && Math.abs(y - clampedY) <= brush.size) continue;

                switch (gridMap[y][x]) {
                    case WALL:
                        ctx.fillStyle = WALL_COLOR;
                        break;
                    case FOOD:
                        ctx.fillStyle = FOOD_COLOR;
                        break;
                    case ANT_SPAWN:
                        ctx.fillStyle = ANT_SPAWN_COLOR;
                        break;
                }
                if (gridMap[y][x] !== GROUND) ctx.fillRect(x * UNIT_WIDTH, y * UNIT_WIDTH, UNIT_WIDTH, UNIT_WIDTH);
            }
        }
    }

    setTimeout(loop, 1000 / 60);
}

return controller;
}
