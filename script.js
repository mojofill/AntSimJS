const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const HEIGHT = document.body.clientHeight;
const WIDTH = document.body.clientWidth;

const UNIT_WIDTH = 10;

canvas.height = HEIGHT;
canvas.width = WIDTH;
canvas.style.height = HEIGHT;
canvas.style.width = WIDTH;

// FIRST STEP - make a map generating script REALLY REALLY QUICKLY

let gridMap = [];

for (let y = 0; y < Math.ceil(HEIGHT / UNIT_WIDTH); y++) {
    gridMap.push([]);
    for (let x = 0; x < Math.ceil(WIDTH / UNIT_WIDTH); x++) {
        gridMap[y].push(false);
    }
}

const mouse = {
    x: 0,
    y: 0,
    left: false,
    right: false,
}

function init() {
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
        if (e.code === 'KeyS') {
            let string = '';
            for (const row of gridMap) {
                string += `[${row.toString()}],\n`
            }

            navigator.clipboard.writeText(string);
        };
    })

    setTimeout(loop, 1000 / 60);
}

function reset() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
}

function loop() {
    reset();

    let clampedX = Math.floor(mouse.x / UNIT_WIDTH);
    let clampedY = Math.floor(mouse.y / UNIT_WIDTH);
    
    if (mouse.left || mouse.right) {
        gridMap[clampedY][clampedX] = mouse.left;   
    }

    for (let y = 0; y < gridMap.length; y++) {
        for (let x = 0; x < gridMap[y].length; x++) {

            if (clampedX === x && clampedY === y) ctx.fillStyle = 'gray';
            else ctx.fillStyle = gridMap[y][x] ? 'white' : 'black';

            ctx.fillRect(x * UNIT_WIDTH, y * UNIT_WIDTH, UNIT_WIDTH, UNIT_WIDTH);
        }
    }

    setTimeout(loop, 1000 / 60);
}

init();
