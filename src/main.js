import { Fish, Enemy } from "./Fish.js";
import Food from "./Food.js";

const canvas = document.querySelector("#game-screen");
const ctx = canvas.getContext("2d");
export const GAME_WIDTH = canvas.clientWidth;
export const GAME_HEIGHT = canvas.clientHeight;

const backgroundColor = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
backgroundColor.addColorStop(0, "rgb(42, 178, 171, .7)");
backgroundColor.addColorStop(1, "rgb(0, 95, 170, .8)");

canvas.oncontextmenu = e => { e.preventDefault(); e.stopPropagation(); }

export const fishes = [];
spawnFish(20);

export const enemies = [];
export const foods = [];

let mouseX = 0; 
let mouseY = 0;
canvas.addEventListener("mousemove", e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

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

    fishes.forEach(fish => {
        fish.update(deltaTime);
        fish.draw(ctx);
    });
    
    enemies.forEach(enemy => {
        enemy.update(deltaTime);
        enemy.draw(ctx);
    });

    foods.forEach((food, i) => {
        food.update(deltaTime);
        food.draw(ctx);

        if (food.isOutsideRoom()) {
            console.log("removed")
            foods.splice(i, 1);
        }
    });

    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    fps = Math.round(1 / secondsPassed);
    ctx.font = "20px Sans-Serif";
    ctx.fillStyle = "black";
    ctx.fillText("FPS: " + fps, 10, 30);
}
window.requestAnimationFrame(gameLoop);

function spawnFish(amount) {
    const margin = 100;
    for (let i = 0; i < amount; i++) {
        const x = margin + Math.random() * GAME_WIDTH - (margin*2);
        const y = margin + Math.random() * GAME_HEIGHT - (margin*2);
        fishes.push(new Fish(x, y));     
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
        const x = margin + Math.random() * GAME_WIDTH - (margin*2);
        const y = -8;
        foods.push(new Food(x, y));
    }
}

function spawnEnemy(amount) {
    const margin = 100;
    for (let i = 0; i < amount; i++) {
        const x = margin + Math.random() * GAME_WIDTH - (margin*2);
        const y = choose(-margin, GAME_HEIGHT + margin);
        enemies.push(new Enemy(x, y));     
    }   
}

export function removeEnemy(index) {
    enemies.splice(index, 1);
}

//Set global fish target x & y once in a while to create an illusion that they swim together
setInterval(() => {
    schoolFish();
}, 5000)

function schoolFish() {
    const x = Math.random() * GAME_WIDTH;
    const y = Math.random() * GAME_HEIGHT;
    fishes.forEach(fish => {
        if (fish.state === Fish.states.IDLING) {
            fish.target.x = x;
            fish.target.y = y;
        }
    });   
}

export function getMouseX() {
    return mouseX;
}

export function getMouseY() {
    return mouseY;
}

export function lerp(n1, n2, t) {
    return (1 - t) * n1 + t * n2;
}

export function clamp(n, min, max) {
    return Math.max(min, Math.min(n, max));
}

export function choose(a, b) {
    if (Math.random() >= .5) {
        return a;
    } else {
        return b;
    }
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




