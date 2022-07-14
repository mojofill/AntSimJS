const canvas1 = document.getElementById('canvas1');
const canvas2 = document.getElementById('canvas2');

const ctx1 = canvas1.getContext('2d');
const ctx2 = canvas2.getContext('2d');

const HEIGHT = document.body.clientHeight;
const WIDTH = document.body.clientWidth;

const UNIT_WIDTH = 5;

class Rect {
    constructor(x=0, y=0) {
        this.x = x;
        this.y = y;
        this.width = 50;
        this.height = 150;
        this.heading = 0;
    }
}

const FPS = 60;

let gridMap = []; // this is for canvas2

canvas1.height = HEIGHT;
canvas1.width = WIDTH / 2;
canvas1.style.height = HEIGHT;
canvas1.style.width = WIDTH / 2;
canvas1.style.top = '0px';
canvas1.style.left = '0px';
canvas1.style.position = 'fixed';

canvas2.height = HEIGHT;
canvas2.width = WIDTH / 2;
canvas2.style.height = HEIGHT;
canvas2.style.width = WIDTH;
canvas2.style.top = `0px`;
canvas2.style.left = `${WIDTH / 2}px`;
canvas2.style.position = 'fixed';

let rect = new Rect(50, 50);

function init() {
    setTimeout(loop, 1000 / FPS);
}

function loop() {
    ctx1.clearRect(0, 0, WIDTH / 2, HEIGHT);
    ctx2.clearRect(0, 0, WIDTH / 2, HEIGHT);
    ctx1.fillStyle = 'black';
    ctx2.fillStyle = 'black';
    ctx1.fillRect(0, 0, WIDTH / 2, HEIGHT);
    ctx2.fillRect(0, 0, WIDTH / 2, HEIGHT);

    ctx1.fillStyle = 'red';
    ctx2.fillStyle = 'red';

    ctx1.fillRect(rect.x * UNIT_WIDTH, rect.y * UNIT_WIDTH, rect.width, rect.height);
    ctx2.fillRect(rect.x * UNIT_WIDTH, rect.y * UNIT_WIDTH, rect.width, rect.height);

    setTimeout(loop, 1000 / FPS);
}

init();
