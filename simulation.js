export default function whatever() {

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const HEIGHT = document.body.clientHeight;
const WIDTH = document.body.clientWidth;

const UNIT_WIDTH = 1;

const ANT_SPAWN = 0;
const WALL = 1;
const FOOD = 2;
const GROUND = 3;

const ANT_SPAWN_COLOR = 'red';
const WALL_COLOR = 'white';
const FOOD_COLOR = 'green';
const GROUND_COLOR = 'black';

const NUM_ANTS = 500;
const ANT_STEER_STRENGTH_RANGE = 0.15;
const TURN_FORCE = 0.15;
const ANT_SPEED = 2 * UNIT_WIDTH;

const HOME_PHEROMONE = 0;
const FOOD_PHEROMONE = 1;

const PHEROMONE_EVAPORATE_STRENGTH = 0.005;

let ANT_SPAWN_COORD = [];

let foodAtSpawnCount = 0;

const FPS = 60;

let gridMap; // this is the pixel map
let ants = [];

let homePheromoneMap = [];
let foodPheromoneMap = [];

let foodPixels = [];
let wallPixels = [];
let spawnPixels = [];

function round(x, multiple) {
    if (x / multiple - Math.floor(x / multiple) < 0.5) return Math.floor(x / multiple) * multiple;
    else return Math.ceil(x / multiple) * multiple;
}

function rotateAroundPoint(pivotObj, rotatedObj, angle) {
    let s = Math.sin(angle);
    let c = Math.cos(angle);

    let rotatedObjCopy = new Rect(rotatedObj.x, rotatedObj.y, rotatedObj.width, rotatedObj.height);
    rotatedObjCopy.heading = rotatedObj.heading;

    let offsetX = pivotObj.width / 2;
    let offsetY = pivotObj.height / 2;

    rotatedObjCopy.x -= pivotObj.x + offsetX;
    rotatedObjCopy.y -= pivotObj.y + offsetY;

    let xnew = rotatedObjCopy.x * c - rotatedObjCopy.y * s;
    let ynew = rotatedObjCopy.x * s + rotatedObjCopy.y * c;

    rotatedObjCopy.x = xnew + pivotObj.x + offsetX;
    rotatedObjCopy.y = ynew + pivotObj.y + offsetY;

    return rotatedObjCopy;
}

function pixelate(obj, override=false, center=null) {
    let pixels = []; // stored as FLOATING DIGITS
    let radiusUnit = UNIT_WIDTH;

    let rectCenterX = override ? center[0]: obj.x + obj.width / 2;
    let rectCenterY = override ? center[1]: obj.y + obj.height / 2;
    
    // now go in two directions: -90 and 90
    let leftAngle = obj.heading + Math.PI / 2;
    let rightAngle = obj.heading - Math.PI / 2;

    let flippedHeading = obj.heading + Math.PI;
    let leftAngleFlipped = flippedHeading + Math.PI / 2;
    let rightAngleFlipped = flippedHeading - Math.PI / 2;

    for (let radius = 0; radius < obj.height / 2; radius += radiusUnit) {
        let newCenter = [rectCenterX + radius * Math.cos(obj.heading), rectCenterY + radius * Math.sin(obj.heading)];
        let newCenterFlipped = [rectCenterX + radius * Math.cos(flippedHeading), rectCenterY + radius * Math.sin(flippedHeading)];

        pixels.push(newCenter);
        pixels.push(newCenterFlipped);

        for (let widthRadius = -obj.width / 2; widthRadius <= obj.width / 2; widthRadius += radiusUnit) {
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

function pixelateChild(obj) {
    return pixelate(obj, true, [obj.x, obj.y]);
}

class Pheromone {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.value = 1;
        this.type = type;
    }
}

class Rect {
    constructor(x, y, width, height, heading=0) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.heading = heading;
    }
}

class Ant extends Rect {
    constructor(x=0, y=0, width=2.5, height=7.5, heading=0, speed=UNIT_WIDTH) {
        super(x, y, width, height, heading)
        this.speed = speed;
        this.homePheromones = [];
        this.foodPheromones = [];
        this.dropPheromoneType = HOME_PHEROMONE; // default start with HOME_PHEROMONE
        this.targetPheromoneType = FOOD_PHEROMONE; // default start with FOOD_PHEROMONE
        this.changeDirection = Math.random() * 2 - 1 >= 0 ? 1 : -1;
        this.targetFood = null;
        this.hasFood = false;
        this.targetHeading = null;
        this.freedomRange = (1 - 0.5 * Math.random()) * ANT_STEER_STRENGTH_RANGE;
        this.children = [];
        this.nonRotatedChildren = [];

        this.targetSpawn = [];

        let rectCenterX = this.x + this.width / 2;
        let rectCenterY = this.y + this.height / 2;

        let unit = this.width;

        this.foodGrabber = new Rect(rectCenterX - 3 * unit, rectCenterY - 4 * unit, 8 * unit, 5 * unit);
        this.sensorRight = new Rect(rectCenterX + 3 * unit, rectCenterY - 3 * unit, 3 * unit, 3 * unit);
        this.sensorLeft = new Rect(rectCenterX - 5 * unit, rectCenterY - 3 * unit, 3 * unit, 3 * unit);
        this.sensorForward = new Rect(rectCenterX - unit, rectCenterY - 5 * unit, 3 * unit, 3 * unit); // pos: (-1, -5) width: 3 height: 3
        this.collisionDetecter = new Rect(rectCenterX - unit, rectCenterY - 3 * unit, 3 * unit, 2 * unit);
        this.spawnCollider = new Rect(rectCenterX - 3 * unit, rectCenterY - 3 * unit, 9 * unit, 9 * unit);

        this.foodGrabberNonRotate = structuredClone(this.foodGrabber);
        this.sensorRightNonRotate = structuredClone(this.sensorRight);
        this.sensorForwardNonRotate = structuredClone(this.sensorForward);
        this.sensorLeftNonRotate = structuredClone(this.sensorLeft);
        this.collisionDetecterNonRotate = structuredClone(this.collisionDetecter);
        this.spawnColliderNonRotate = structuredClone(this.spawnCollider);

        // make sure the order of both is the exact same
        this.children.push(this.foodGrabber, this.sensorRight, this.sensorLeft, this.sensorForward, this.collisionDetecter, this.spawnCollider);
        this.nonRotatedChildren.push(this.foodGrabberNonRotate, this.sensorRightNonRotate, this.sensorLeftNonRotate, this.sensorForwardNonRotate, this.collisionDetecterNonRotate, this.spawnColliderNonRotate);
    }

    sense(type) {
        let rightSum = 0;
        let leftSum = 0;
        let forwardSum = 0;

        let map = type === HOME_PHEROMONE ? homePheromoneMap : foodPheromoneMap;
        
        // ctx.fillStyle = 'white';
        try {
            for (const pixel of pixelateChild(this.sensorRight)) {
                // ctx.fillRect(pixel[0], pixel[1], UNIT_WIDTH, UNIT_WIDTH);
                rightSum += map[pixel[1]][pixel[0]];
            }
        }
        catch {}

        try {
            for (const pixel of pixelateChild(this.sensorLeft)) {
                // ctx.fillRect(pixel[0], pixel[1], UNIT_WIDTH, UNIT_WIDTH);
                leftSum += map[pixel[1]][pixel[0]];
            }
        }
        catch {}

        try {
            for (const pixel of pixelateChild(this.sensorForward)) {
                // ctx.fillRect(pixel[0], pixel[1], UNIT_WIDTH, UNIT_WIDTH);
                forwardSum += map[pixel[1]][pixel[0]];
            }
        }
        catch {}

        return {
            right: rightSum,
            left: leftSum,
            forward: forwardSum
        }
    }

    updateChildren() {
        for (let i = 0; i < this.children.length; i++) {
            let obj = this.nonRotatedChildren[i];
    
            // rotate all pixels around rect origin, theta being rect.heading
            
            // first rotate the obj coords
            // set obj heading the same as rect heading
            obj.x += obj.width / 2 - UNIT_WIDTH;
            obj.y += obj.height / 2 - UNIT_WIDTH;
    
            obj.heading = this.heading;
    
            let newObj = rotateAroundPoint(this, obj, this.heading + Math.PI / 2); // this is the rotated version of the child
            // this.children[i] = newObj;
            // this should change the child object thats rotated as well
            this.children[i].heading = newObj.heading;
            this.children[i].height = newObj.height;
            this.children[i].width = newObj.width;
            this.children[i].x = newObj.x;
            this.children[i].y = newObj.y;
            
            // ctx.fillStyle = 'white';
    
            // let pixels = pixelate(newObj, true, [newObj.x, newObj.y]);
            // for (const pixel of pixels) {
            //     ctx.fillRect(pixel[0], pixel[1], UNIT_WIDTH, UNIT_WIDTH);
            // }
    
            // ctx.fillStyle = 'blue';
            // ctx.fillRect(newObj.x, newObj.y, UNIT_WIDTH, UNIT_WIDTH);
    
            obj.x -= obj.width / 2 - UNIT_WIDTH;
            obj.y -= obj.height / 2 - UNIT_WIDTH;

            // this changes the base, non rotated versions of the children
            obj.x += this.speed * Math.cos(this.heading);
            obj.y += this.speed * Math.sin(this.heading);
        }
    }

    grabTargetFood() {
        this.hasFood = true;
        gridMap[this.targetFood[1]][this.targetFood[0]] = GROUND;
        for (let i = 0; i < foodPixels.length; i++) {
            if (foodPixels[i][0] === this.targetFood[0] && foodPixels[i][1] === this.targetFood[1]) {
                foodPixels.splice(i, 1);
            }
        }
        
        this.targetFood = null;

        this.setDropPheromoneType(FOOD_PHEROMONE);
        this.setTargetPheromoneType(HOME_PHEROMONE);

        this.heading += Math.PI;
    }

    depositFood() {
        if (!this.hasFood) return;
        foodAtSpawnCount++;
        this.setDropPheromoneType(HOME_PHEROMONE);
        this.setTargetPheromoneType(FOOD_PHEROMONE);
        this.hasFood = false;
        this.heading += Math.PI;
    }

    setDropPheromoneType(type) {
        this.dropPheromoneType = type;
    }

    setTargetPheromoneType(type) {
        this.targetPheromoneType = type;
    }

    rotateToPoint(coord) {
        let x_diff = coord[0] - this.x;
        let y_diff = coord[1] - this.y;

        let theta = Math.atan2(y_diff, x_diff);
        this.heading = theta;
    }

    render() {
        if (this.targetFood !== null) {
            // use atan2 to get theta

            this.rotateToPoint(this.targetFood);

            if (this.targetFood !== null) {
                // whatever bro if the food is super close lets just say it grabbed it
                let centerX = this.x + this.width / 2;
                let centerY = this.y + this.height / 2;

                if (Math.sqrt((this.targetFood[0] - centerX) * (this.targetFood[0] - centerX) + (this.targetFood[1] - centerY) * (this.targetFood[1] - centerY)) <= 3 * UNIT_WIDTH) {
                    this.grabTargetFood();
                }
            }
        }

        let flooredPixels = pixelate(this);

        ctx.fillStyle = 'red';

        for (const pixel of flooredPixels) {
            if (this.targetFood !== null) {
                if (pixel[0] === this.targetFood[0] && pixel[1] === this.targetFood[1]) this.grabTargetFood();
                else if (gridMap[pixel[1]][pixel[0]] === ANT_SPAWN && this.hasFood) {
                    this.depositFood();
                    break;
                }
            }

            if (this.targetSpawn !== null) {
                if (pixel[0] === this.targetSpawn[0] && pixel[1] === this.targetSpawn[1]) {
                    this.depositFood();
                    this.targetSpawn = null;
                }
            }

            ctx.fillRect(pixel[0], pixel[1], UNIT_WIDTH, UNIT_WIDTH);
        }

        if (this.targetFood !== null) {
            for (const pixel of pixelateChild(this.foodGrabber)) {
                if (this.targetFood !== null) {
                    if (pixel[0] === this.targetFood[0] && pixel[1] === this.targetFood[1]) {
                        this.grabTargetFood();
                        break;
                    }
                }
            }
            ctx.fillStyle = 'white';
            if (this.targetFood !== null) ctx.fillRect(this.targetFood[0], this.targetFood[1], UNIT_WIDTH, UNIT_WIDTH);

            // check if super close!
            let rectCenterX = this.x + this.width / 2;
            let rectCenterY = this.y + this.height / 2;
            if (this.targetFood !== null) {
                let dist = Math.sqrt((this.targetFood[0] - rectCenterX) * (this.targetFood[0] - rectCenterX) + (this.targetFood[1] - rectCenterY) * (this.targetFood[1] - rectCenterY));
                
                if (dist <= 5) this.grabTargetFood();
            }
        }
        ctx.fillStyle = 'white';
        for (const pixel of pixelateChild(this.collisionDetecter)) {
            let pixelXFloored = Math.floor(pixel[0] / UNIT_WIDTH);
            let pixelYFloored = Math.floor(pixel[1] / UNIT_WIDTH);
            
            let value;

            try {
                value = gridMap[pixelYFloored][pixelXFloored];
            }
            catch { // index error - outside to the wall
                value = WALL;
            }
            if (value !== WALL) {
                switch(value) {
                    case FOOD:
                        if (this.targetFood === null && !this.hasFood) { // set the target food
                            this.targetFood = [pixelXFloored, pixelYFloored];
                            // set target heading

                            // use atan2 to get theta

                            let x_diff = this.targetFood[0] - this.x;
                            let y_diff = this.targetFood[1] - this.y;

                            let theta = Math.atan2(y_diff, x_diff);
                            this.heading = theta;
                        }
                        break;
                    case ANT_SPAWN:
                        if (this.hasFood) this.depositFood();
                        break;
                }
            }
            else {
                if (this.changeDirection === null) this.changeDirection = Math.random() * 2 - 1 >= 0 ? 1 : -1;
                this.heading += this.changeDirection * Math.PI / 6;
                break;
            }
        }

        this.updateChildren();
    }

    move() {
        this.x += this.speed * Math.cos(this.heading);
        this.y += this.speed * Math.sin(this.heading);

        this.heading += this.randomSteerStrength; // steerStrengthBookmark

        if (this.targetHeading !== null) {
            if (this.heading < this.targetHeading) {
                this.heading += ANT_STEER_STRENGTH_RANGE;
                if (this.heading > this.targetHeading) {
                    this.heading = this.targetHeading;
                }
            }
            else {
                this.heading -= ANT_STEER_STRENGTH_RANGE;
                if (this.heading < this.targetHeading) {
                    this.heading = this.targetHeading;
                }
            }
        }
    }

    dropPheromone() {
        let pheromoneY = Math.floor((this.y + this.height) / UNIT_WIDTH);
        let pheromoneX = Math.floor((this.x + this.width / 2) / UNIT_WIDTH)
        
        pheromoneX += Math.floor(Math.cos(this.heading + Math.PI));
        pheromoneY += Math.floor(Math.sin(this.heading + Math.PI));

        let map = this.dropPheromoneType === HOME_PHEROMONE ? homePheromoneMap : foodPheromoneMap;

        let pheromoneArr = this.dropPheromoneType === HOME_PHEROMONE ? this.homePheromones : this.foodPheromones;
        
        let pheromone = new Pheromone(pheromoneX, pheromoneY, this.dropPheromoneType);

        map[pheromoneY][pheromoneX] += pheromone.value;

        pheromoneArr.push(pheromone);
    }

    get randomSteerStrength() {
        return (Math.random() * 2 - 1) * this.freedomRange;
    }
}

fetch("./map.json")
.then((resp) => resp.json())
.then((json) => {
    gridMap = json.map;
    
    for (let y = 0; y < gridMap.length; y++) {
        homePheromoneMap.push([]);
        foodPheromoneMap.push([]);
        for (let x = 0; x < gridMap[y].length; x++) {
            homePheromoneMap[y].push(0);
            foodPheromoneMap[y].push(0);
        }
    }

    init();
})

function init() {
    canvas.height = HEIGHT;
    canvas.width = WIDTH;
    canvas.style.height = HEIGHT;
    canvas.style.width = WIDTH;
    canvas.style.position = 'fixed';
    canvas.style.top = '0px';
    canvas.style.left = '0px';
    canvas.style.margin = 0;
    locateRender();
    render();
    spawnAnts();

    setTimeout(loop, 1000 / FPS);
}

function locateRender() {
    let antSpawnXSum = 0;
    let antSpawnYSum = 0;
    for (let y = 0; y < gridMap.length; y++) {
        for (let x = 0; x < gridMap[y].length; x++) {
            switch(gridMap[y][x]) {
                case FOOD:
                    foodPixels.push([x, y]);
                    break;
                case WALL:
                    wallPixels.push([x, y]);
                    break;
                case ANT_SPAWN:
                    console.log('yo')
                    // gridMap[y][x] = GROUND;
                    // x += 100 * Math.cos(-Math.PI / 6);
                    // y += 100 * Math.sin(-Math.PI / 6);
                    antSpawnXSum += x;
                    antSpawnYSum += y;
                    spawnPixels.push([x, y]);
                    break;
            }
        }
    }

    // take the average of all food pixels coords
    ANT_SPAWN_COORD = [Math.floor(antSpawnXSum / spawnPixels.length), Math.floor(antSpawnYSum / spawnPixels.length)];
}

function spawnAnts() {
    for (let i = 0; i < NUM_ANTS; i++) {
        let index = Math.floor(Math.random() * spawnPixels.length);
        let ant = new Ant(spawnPixels[index][0] * UNIT_WIDTH, spawnPixels[index][1] * UNIT_WIDTH, 2.5, 7.5, Math.random() * 2 * Math.PI, ANT_SPEED);
        ants.push(ant);
    }
}

function render() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = GROUND_COLOR;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    for (const wallPixel of wallPixels) {
        ctx.fillStyle = WALL_COLOR;
        ctx.fillRect(wallPixel[0] * UNIT_WIDTH, wallPixel[1] * UNIT_WIDTH, UNIT_WIDTH, UNIT_WIDTH);
    }

    for (const foodPixel of foodPixels) {
        ctx.fillStyle = FOOD_COLOR;
        ctx.fillRect(foodPixel[0] * UNIT_WIDTH, foodPixel[1] * UNIT_WIDTH, UNIT_WIDTH, UNIT_WIDTH);
    }

    for (const spawnPixel of spawnPixels) {
        ctx.fillStyle = ANT_SPAWN_COLOR;
        ctx.fillRect(spawnPixel[0] * UNIT_WIDTH, spawnPixel[1] * UNIT_WIDTH, UNIT_WIDTH, UNIT_WIDTH);
    }

    for (const ant of ants) {
        // home pheromones first
        for (let i = 0; i < ant.homePheromones.length; i++) {
            let pheromone = ant.homePheromones[i];
            if (pheromone.value <= 0) {
                ant.homePheromones.splice(i, 1);
            }
            else {
                let pheromoneX = Math.floor(pheromone.x * UNIT_WIDTH);
                let pheromoneY = Math.floor(pheromone.y * UNIT_WIDTH);
                if (gridMap[pheromoneY][pheromoneX] !== GROUND) continue;

                ctx.fillStyle = `rgba(0, 0, 255, ${pheromone.value})`;
                ctx.fillRect(pheromone.x * UNIT_WIDTH, pheromone.y * UNIT_WIDTH, UNIT_WIDTH, UNIT_WIDTH);

                pheromone.value -= PHEROMONE_EVAPORATE_STRENGTH;
                homePheromoneMap[pheromoneY][pheromoneX] -= PHEROMONE_EVAPORATE_STRENGTH;
                if (homePheromoneMap[pheromoneY][pheromoneX] <= 0) homePheromoneMap[pheromoneY][pheromoneX] = 0;
            }
        }

        // food pheromones second
        for (let i = 0; i < ant.foodPheromones.length; i++) {
            let pheromone = ant.foodPheromones[i];
            if (pheromone.value <= 0) {
                ant.foodPheromones.splice(i, 1);
            }
            else {
                let pheromoneX = Math.floor(pheromone.x * UNIT_WIDTH);
                let pheromoneY = Math.floor(pheromone.y * UNIT_WIDTH);
                if (gridMap[pheromoneY][pheromoneX] !== GROUND) continue;

                ctx.fillStyle = `rgba(255, 0, 0, ${pheromone.value})`;
                ctx.fillRect(pheromone.x * UNIT_WIDTH, pheromone.y * UNIT_WIDTH, UNIT_WIDTH, UNIT_WIDTH);

                pheromone.value -= PHEROMONE_EVAPORATE_STRENGTH;
                foodPheromoneMap[pheromoneY][pheromoneX] -= PHEROMONE_EVAPORATE_STRENGTH;
                if (foodPheromoneMap[pheromoneY][pheromoneX] <= 0) foodPheromoneMap[pheromoneY][pheromoneX] = 0;
            }
        }

        ant.render();
    }

    ctx.fillStyle = 'white';
    ctx.font = '24px comic-sans';
    ctx.fillText('' + foodAtSpawnCount, ANT_SPAWN_COORD[0] - 16, ANT_SPAWN_COORD[1] + 7);
}

function nextSimulationStep() {
    for (const ant of ants) {
        ant.dropPheromone();
        ant.move();

        let samples = ant.sense(ant.targetPheromoneType);
        if ((samples.forward > samples.left) && (samples.forward > samples.right)) {
            continue;
        }
        else if ((samples.forward < samples.left) && (samples.left < samples.right)) {
            // turn randomly, which is taken care by .move()
            continue;
        }
        else if (samples.left < samples.right) {
            ant.heading += TURN_FORCE;
        }
        else if (samples.right < samples.left) {
            ant.heading -= TURN_FORCE;
        }
        else {
            // face forward
            continue;
        }
        
        if (ant.hasFood) {
            if (ant.targetSpawn === null) {
                for (const pixel of pixelateChild(ant.spawnCollider)) {
                    try {
                        if (gridMap[pixel[1]][pixel[0]] === ANT_SPAWN) {
                            ant.rotateToPoint(pixel);
                            ant.targetSpawn = pixel;
                            break;
                        }
                    }
                    catch {}
                }
            }
        }
    }
}

function loop() {
    render();
    nextSimulationStep();

    setTimeout(loop, 1000 / FPS);
}

}