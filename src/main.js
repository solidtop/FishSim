import  { Fish, Enemy1, Enemy2, FishCorpse } from "./Fish.js";
import Food from "./Food.js";
import { choose, randomRange, irandomRange, getMouseX, getMouseY } from "./misc.js";
import { ParticleSystem, ParticleEmitter, Particle } from "./ParticleSystem.js";

const canvas = document.querySelector("#game-screen");
const ctx = canvas.getContext("2d");
export const GAME_WIDTH = canvas.clientWidth;
export const GAME_HEIGHT = canvas.clientHeight;

const backgroundColor = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
backgroundColor.addColorStop(0, "rgb(42, 178, 171, .7)");
backgroundColor.addColorStop(1, "rgb(0, 95, 170, .8)");

canvas.oncontextmenu = e => { e.preventDefault(); e.stopPropagation(); }

export const fishes = [];
export const enemies = [];
export const corpses = [];
export const foods = [];

//Creating and Loading sprites 
const fishSprite = new Image();
fishSprite.src = "./src/assets/fish.png";
const enemy1Sprite = new Image();
enemy1Sprite.src = "./src/assets/enemyfish.png";
const enemy2Sprite = new Image();
enemy2Sprite.src = "./src/assets/enemyfish2.png";
const corpseSprite = new Image();
corpseSprite.src = "./src/assets/corpse.png";

fishSprite.onload = () => {
    spawnFish(50);
}

//Initializing particle system
const partSystem = new ParticleSystem();
const partEmitter = new ParticleEmitter(partSystem);
const partEmitter2 = new ParticleEmitter(partSystem);
const partEmitter3 = new ParticleEmitter(partSystem);

const partBubbles = new Particle();
const partBubbles2 = new Particle();
const spr = new Image();
spr.src = "./src/assets/bubble.png";
partBubbles.setSprite(spr);
partBubbles2.setScale(.5, .5);
partBubbles2.setSprite(spr);
partBubbles2.setScale(2, 2);


const partPollen = new Particle();
partPollen.setSize(2, 4, 0, 0);
partPollen.setColor("white");
partPollen.setAlpha2(0, .1, 0);
partPollen.setSpeed(.06, .1, 0, 0);
partPollen.setDirection(0, 359, 0, 0);
partPollen.setGravity(0, 270);
partPollen.setOrientation(0, 359, 0, 0, 0);
partPollen.setLife(200, 400);

partEmitter3.setRegion(0, GAME_WIDTH, 0, GAME_HEIGHT);
partEmitter3.stream(partPollen, 4);

//Gameloop 
const targetFrameRate = 60;
let lastTime = 0;
let deltaTime = 0;
let secondsPassed, fps;

function gameLoop(timestamp) {
    window.requestAnimationFrame(gameLoop);
    secondsPassed = (timestamp - lastTime) / 1000;
    deltaTime = secondsPassed * targetFrameRate;
    lastTime = timestamp;

    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    ctx.fillStyle = backgroundColor;
    //ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    corpses.forEach(corpse => {
        corpse.update(deltaTime);
        corpse.draw(ctx);
    });

    foods.forEach((food, i) => {
        food.update(deltaTime);
        food.draw(ctx);
    });

    fishes.forEach(fish => {
        fish.update(deltaTime);
        fish.draw(ctx);
    });
    
    enemies.forEach(enemy => {
        enemy.update(deltaTime);
        enemy.draw(ctx);
    });

    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    partSystem.draw(ctx);
    partSystem.update(deltaTime);

    fps = Math.round(1 / secondsPassed);
    ctx.font = "20px Sans-Serif";
    ctx.fillStyle = "black";
    ctx.fillText("FPS: " + fps, 10, 30);
}


window.requestAnimationFrame(gameLoop);


function spawnFish(amount) {
    const margin = 100;
    for (let i = 0; i < amount; i++) {
        const x = margin + (Math.random() * GAME_WIDTH - margin*2);
        const y = margin + (Math.random() * GAME_HEIGHT - margin*2);
        fishes.push(new Fish(fishSprite, x, y));     
    }
    displayFishAmount(fishes.length); 
}

export function removeFish(index) {
    fishes.splice(index, 1);
    displayFishAmount(fishes.length); 
}

function spawnFood(amount) {
    const margin = 50;
    for (let i = 0; i < amount; i++) {
        const x = margin + (Math.random() * GAME_WIDTH - margin*2);
        const y = -8;
        foods.push(new Food(x, y));
    }
}

function spawnEnemy(amount) {
    const margin = 100;
    for (let i = 0; i < amount; i++) {
        const x = margin + (Math.random() * GAME_WIDTH - margin*2);
        const y = choose(-margin, GAME_HEIGHT + margin);

        if (Math.random() < .8) {
            enemies.push(new Enemy1(enemy1Sprite, x, y));     
        } else {
            enemies.push(new Enemy2(enemy2Sprite, x, y));     
        }
    }   
}

export function spawnCorpse(x, y, speed, xScale, yScale, angle) {
    const corpse = new FishCorpse(corpseSprite, x, y, speed, xScale, yScale, angle);
    corpses.push(corpse);
}

export function removeEnemy(index) {
    enemies.splice(index, 1);
}

export function spawnBubbles(x, y, amount) {
    const area = 5;
    partEmitter.setRegion(x-area, x+(area*2), y-area, y+(area*2));
    partEmitter.burst(partBubbles, amount);
}


setTimeout(schoolFish, randomRange(3, 6) * 1000);
setTimeout(spawnFishBubbles, randomRange(1, 3) * 1000);
setTimeout(spawnBigBubbles, randomRange(5, 10) * 1000);


//Spawn bubbles from fish
function spawnFishBubbles() {
    if (fishes.length > 0) {
        const times = Math.min(irandomRange(1, 3), fishes.length);
        for (let i = 0; i < times; i++) {
            const index = Math.floor(Math.random() * (fishes.length-1));
            const amount = randomRange(1, 4);
            spawnBubbles(fishes[index].x, fishes[index].y, amount);
        }
    }   
    setTimeout(spawnFishBubbles, randomRange(1, 3) * 1000);
}

function spawnBigBubbles() {
    const x = Math.random() * GAME_WIDTH;
    const y = GAME_HEIGHT + 40;
    const amount = randomRange(4, 8);
    partEmitter2.setRegion(x, x, y, y);
    partEmitter2.burst(partBubbles2, amount);    

    setTimeout(spawnBigBubbles, randomRange(5, 10) * 1000);
}

function schoolFish() {
    const x = Math.random() * GAME_WIDTH; //Set global fish target x & y once in a while to create an illusion that they swim together
    const y = Math.random() * GAME_HEIGHT;
    fishes.forEach(fish => {
        if (fish.state === Fish.states.IDLING) {
            fish.target.x = x;
            fish.target.y = y;
            fish.timer["changePath"] = randomRange(1, 4);
        }
    });   

    setTimeout(schoolFish, randomRange(5, 8) * 1000);
}



//Handle input events
canvas.addEventListener("mousedown", e => {
    switch(e.which) {
        case 1: //Left mb
            fishes.forEach(fish => {
                fish.changeState(Fish.states.FOLLOWING);
            });
            break;

        case 3: //Right mb
            fishes.forEach(fish => {
                fish.changeState(Fish.states.AVOIDING);
                fish.target.obj = {
                    x: getMouseX(),
                    y: getMouseY(),
                };
            });
            spawnBubbles(getMouseX(), getMouseY(), 20);
            break;
    }
});

window.addEventListener("mouseup", e => {
    fishes.forEach(fish => {
        fish.changeState(Fish.states.IDLING);
    });
});

document.querySelector("#btn-spawn-fish").addEventListener("click", () => {
    spawnFish(1);
});
document.querySelector("#btn-spawn-food").addEventListener("click", () => {
    spawnFood(1);
});
document.querySelector("#btn-spawn-enemy").addEventListener("click", () => {
    spawnEnemy(1);
});

function displayFishAmount(amount) {
    document.querySelector("#fish-display").textContent = "Fish Amount: " + amount;
}

function loadSprites() {
    const obj = {

    }

    const fishSprite = new Image();
    fishSprite.src = "./src/assets/fish.png";
    const enemy1Sprite = new Image();
    enemy1Sprite.src = "./src/assets/enemyfish.png";
    const enemy2Sprite = new Image();
    enemy2Sprite.src = "./src/assets/enemyfish2.png";
    const corpseSprite = new Image();
    corpseSprite.src = "./src/assets/corpse.png";
}




