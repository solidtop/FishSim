let mouseX = 0; 
let mouseY = 0;
document.querySelector("#game-screen").addEventListener("mousemove", e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

export function getMouseX() {
    return mouseX;
}

export function getMouseY() {
    return mouseY;
}

export function animationWave(range, duration) {
    const a4 = range * 0.5;
    return(-range + a4 + Math.sin((((Date.now() / 1000) + duration) / duration) * (Math.PI*2)) * a4);
}

export function degToRad(degrees) {
    return degrees * (Math.PI / 180);
}

export function radToDeg(rad) {
    return rad / (Math.PI / 180);
}

export function randomRange(a, b) {
    if (a === b) return a;

    return Math.random() * (b - a) + a;
}

export function irandomRange(a, b) {
    if (a === b) return a;

    return Math.floor(Math.random() * (b - a) + a);   
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

export function choose2(a, b, c) {
    if (Math.random() >= .6666) {
        return a;
    } else if (Math.random() >= .3333) {
        return b;
    } else {
        return c;
    }
}

export function chance(perc) {
    return Math.random() <= perc/100;
}

export function angleDifference(a, b) {
    return Math.abs(b - a);
}