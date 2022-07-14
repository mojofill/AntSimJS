export default function whatever() {

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const HEIGHT = document.body.clientHeight;
const WIDTH = document.body.clientWidth;

const UNIT_WIDTH = 2;

const ANT_SPAWN = 0;
const WALL = 1;
const FOOD = 2;
const GROUND = 3;

const ANT_SPAWN_COLOR = 'red';
const WALL_COLOR = 'white';
const FOOD_COLOR = 'green';
const GROUND_COLOR = 'black';

let gridMap; // this is the pixel map
let antSpawnCoords;

fetch("./map.json")
.then((resp) => resp.json())
.then((json) => {
    gridMap = json.map;

    init();
})

function findAntSpawner() {
    // make this the most fast algorithm

    let firstFoundX;
    let firstFoundY;

    for (let distanceY = 0; distanceY < gridMap.length / 2; distanceY++) {
        let top = gridMap.length / 2 + distanceY;
        let bottom = gridMap.length / 2 - distanceY;

        let _break = false;

        for (let x = 0; x < gridMap[0].length; x++) {
            let topData = ctx.getImageData(x * UNIT_WIDTH, top * UNIT_WIDTH, UNIT_WIDTH, UNIT_WIDTH).data;
            let bottomData = ctx.getImageData(x * UNIT_WIDTH, bottom * UNIT_WIDTH, UNIT_WIDTH, UNIT_WIDTH).data;

            if (
                (topData[0] === 255 && topData[1] === 0 && topData[2] === 0) ||
                (bottomData[0] === 255 && bottomData[1] === 0 && bottomData[2] === 0)
            ) {
                firstFoundY = (topData[0] + topData[1] + topData[2] === 0) ? top : bottom;
                firstFoundX = x;
                _break = true;
                console.log("top: data");
                console.log(topData);
                console.log("bottom: data");
                console.log(bottomData);
                break; // break from inner loop
            }
        }

        if (_break) break; // break from outer loop
    }

    antSpawnCoords = [firstFoundX, gridMap.length - firstFoundY];
}

function init() {
    canvas.height = HEIGHT;
    canvas.width = WIDTH;
    canvas.style.height = HEIGHT;
    canvas.style.width = WIDTH;
    canvas.style.position = 'fixed';
    canvas.style.top = '0px';
    canvas.style.left = '0px';
    canvas.style.margin = 0;

    render();
    spawnAnts();
}

function spawnAnts() {
    findAntSpawner(); // this shouldve found one of ant spawn coords
    
}

function render() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    for (let y = 0; y < gridMap.length; y++) {
        for (let x = 0; x < gridMap[y].length; x++) {
            switch(gridMap[y][x]) {
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

function loop() {

}

}