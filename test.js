const canvas1 = document.getElementById('canvas1');
const canvas2 = document.getElementById('canvas2');

const ctx1 = canvas1.getContext('2d');
const ctx2 = canvas2.getContext('2d');

const HEIGHT = document.body.clientHeight;
const WIDTH = document.body.clientWidth;

const UNIT_WIDTH = 10;

class Rect {
    constructor(x=0, y=0, scale=1) {
        this.x = x;
        this.y = y;
        this.width = 50 * scale;
        this.height = 150 * scale;
        this.heading = 0;

        this.scale = scale;
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
canvas2.style.left = `${WIDTH / 3}px`;
canvas2.style.position = 'fixed';

let rect = new Rect(200, 200, 1.5);

for (let y = 0; y < Math.ceil(canvas2.height / UNIT_WIDTH); y++) {
    gridMap.push([]);
    for (let x = 0; x < Math.ceil(canvas2.width / UNIT_WIDTH); x++) {
        gridMap[y].push(false);
    }
}

function init() {
    setTimeout(loop, 1000 / FPS);
}

function round(x, multiple) {
    if (x / multiple - Math.floor(x / multiple) < 0.5) return Math.floor(x / multiple) * multiple;
    else return Math.ceil(x / multiple) * multiple;
}

function pixelate(obj) {
    let pixels = []; // stored as FLOATING DIGITS
    let radiusUnit = UNIT_WIDTH;

    let rectCenterX = obj.x + obj.width / 2;
    let rectCenterY = obj.y + obj.height / 2;
    
    // now go in two directions: -90 and 90
    let leftAngle = obj.heading + Math.PI / 2;
    let rightAngle = obj.heading - Math.PI / 2;

    let flippedHeading = obj.heading + Math.PI;
    let leftAngleFlipped = flippedHeading + Math.PI / 2;
    let rightAngleFlipped = flippedHeading - Math.PI / 2;

    for (let radius = 0; radius < obj.width / 2; radius += radiusUnit) {
        let newCenter = [rectCenterX + radius * Math.cos(obj.heading), rectCenterY + radius * Math.sin(obj.heading)];
        let newCenterFlipped = [rectCenterX + radius * Math.cos(flippedHeading), rectCenterY + radius * Math.sin(flippedHeading)];

        pixels.push(newCenter)
        pixels.push(newCenterFlipped)

        for (let widthRadius = -obj.height / 2; widthRadius <= obj.height / 2; widthRadius += radiusUnit) {
            pixels.push([newCenter[0] + widthRadius * Math.cos(leftAngle), newCenter[1] + widthRadius * Math.sin(leftAngle)]);
            pixels.push([newCenter[0] + widthRadius * Math.cos(rightAngle), newCenter[1] + widthRadius * Math.sin(rightAngle)]);

            pixels.push([newCenterFlipped[0] + widthRadius * Math.cos(leftAngleFlipped), newCenterFlipped[1] + widthRadius * Math.sin(leftAngleFlipped)]);
            pixels.push([newCenterFlipped[0] + widthRadius * Math.cos(rightAngleFlipped), newCenterFlipped[1] + widthRadius * Math.sin(rightAngleFlipped)]);
        }
    }

    // now turn all the floating digits into ints

    let flooredPixels = [];
    for (const pixel of pixels) {
        flooredPixels.push([round(pixel[0], UNIT_WIDTH), round(pixel[1], UNIT_WIDTH)]);
    }

    return flooredPixels;
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

    ctx1.save();
    
    // non-pixelated version
    ctx1.translate((rect.x + rect.width / 2), (rect.y + rect.height / 2));
    ctx1.rotate(rect.heading)
    ctx1.translate(-(rect.x + rect.width / 2), -(rect.y + rect.height / 2));
    
    ctx1.fillRect(rect.x, rect.y, rect.width, rect.height);

    ctx1.restore();
    
    // pixelated version

    let flooredPixels = pixelate(rect);
    ctx2.fillStyle = 'red';
    for (const pixel of flooredPixels) {
        ctx2.fillRect(pixel[0], pixel[1], UNIT_WIDTH, UNIT_WIDTH);
    }

    let rectCenterX = rect.x + rect.width / 2;
    let rectCenterY = rect.y + rect.height / 2;

    let rightAngle = rect.heading - Math.PI / 6 - Math.PI / 2;
    let leftAngle = rect.heading + Math.PI / 6 - Math.PI / 2;

    ctx2.fillStyle = 'white';

    let leftSquare = new Rect(rectCenterX + 2.5 * rect.width * Math.cos(leftAngle), rectCenterY + rect.width * Math.sin(leftAngle));
    let rightSquare = new Rect(rectCenterX + 2.5 * rect.width * Math.cos(rightAngle), rectCenterY + rect.width * Math.sin(rightAngle));

    let scale = 10;

    leftSquare.width = scale * UNIT_WIDTH;
    leftSquare.height = scale * UNIT_WIDTH;
    rightSquare.width = scale * UNIT_WIDTH;
    rightSquare.height = scale * UNIT_WIDTH;

    leftSquare.heading = rect.heading;
    rightSquare.heading = rect.heading;

    leftSquare.x -= leftSquare.width / 2;
    leftSquare.y -= leftSquare.height / 2;

    let leftPixels = pixelate(leftSquare);
    let rightPixels = pixelate(rightSquare);

    ctx2.fillRect(leftSquare.x, leftSquare.y, leftSquare.width, leftSquare.height);
    ctx2.fillRect(rightSquare.x, rightSquare.y, rightSquare.width, rightSquare.height);

    ctx2.fillStyle = 'white';
    
    // for (const pixel of leftPixels) {
    //     ctx2.fillRect(pixel[0], pixel[1], UNIT_WIDTH, UNIT_WIDTH);
    // }

    // for (const pixel of rightPixels) {
    //     ctx2.fillRect(pixel[0], pixel[1], UNIT_WIDTH, UNIT_WIDTH);
    // }
    
    // rect.heading = 69 * Math.PI / 180;
    rect.heading += 0.01;
    if (rect.heading === 180) rect.heading = 0;

    setTimeout(loop, 1000 / FPS);
}

init();
