const canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d');

const FPS = 60;
const UNIT_WIDTH = 2;
const ANT_COLOR = 'red';

const PHEROMONE_COLOR = 'blue';

class Vector {
    constructor(x=0, y=0) {
        this.x = x;
        this.y = y;
    }
}

class Ant {
    constructor(vel=new Vector()) {
        this.vel = vel;
        this.hasFood = false;
        this.heading = 0; // radians
    }

    toggleFood() {
        this.hasFood = !this.hasFood;
    }
}

export default function init() {
    
}

function loop() {

}
