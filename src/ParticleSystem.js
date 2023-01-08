import { randomRange, degToRad, animationWave } from "./misc.js";

export class ParticleSystem {

    constructor() {
        this.emitters = [];
        this.particles = [];
    }

    draw(ctx) {
        this.particles.forEach(particle => {
            const type = particle.type;

            //Wiggles
            let angle = particle.angle;
            if (type.anglWiggle > 0) {
                angle = particle.angle + animationWave(type.anglWiggle, 1 + particle.wiggleOffset);
            } 

            let size = particle.size;
            if (type.sizeWiggle > 0) {
                size = particle.size + animationWave(type.sizeWiggle, 1 + particle.wiggleOffset);    
            }

            ctx.save();
            ctx.translate(particle.x, particle.y);       
            ctx.rotate(angle);
            ctx.scale(type.xScale, type.yScale);
            ctx.globalAlpha = particle.alpha;
            ctx.fillStyle = type.color;
            if (type.sprite !== null) {
                ctx.drawImage(type.sprite, 0, 0, particle.size, particle.size);
            } else {
                ctx.fillRect(0, 0, size, size);
            }
            ctx.restore(); 
        });
    }

    update(deltaTime) {
        this.particles.forEach(particle => {
            const type = particle.type;

            if (particle.life > 0) {
                particle.life -= 1 * deltaTime;

            } else if (particle.alpha > 0) { 
                particle.alpha -= particle.fadeSpd * deltaTime;
                particle.alpha = Math.max(particle.alpha, 0);
            } else {
               this.removeParticle(this.particles.indexOf(particle));
            }

             //Increments
            particle.angle += type.angIncr * deltaTime;
            particle.dir += type.dirIncr * deltaTime;
            particle.size += type.sizeIncr * deltaTime;

            //Wiggles
            let dir = particle.dir;
            if (type.dirWiggle > 0) {
                dir = particle.dir + animationWave(type.dirWiggle, 1 + particle.wiggleOffset);
            }
            dir = degToRad(dir);
            particle.x += particle.speed * deltaTime * Math.cos(dir);
            particle.y += particle.speed * deltaTime * Math.sin(dir);
            
            const gravDir = degToRad(type.gravDir);
            particle.x += type.gravAmount * deltaTime * Math.cos(gravDir);
            particle.y += type.gravAmount * deltaTime * Math.sin(gravDir);

           
        });
    }

    addParticle(type, x, y) {
        const life = randomRange(type.lifeMin, type.lifeMax);
        this.particles.push({
            type: type,
            x: x,
            y: y,
            size: randomRange(type.sizeMin, type.sizeMax),
            alpha: type.alpha1,
            speed: randomRange(type.speedMin, type.speedMax),
            dir: randomRange(type.dirMin, type.dirMax),
            angle: randomRange(type.angMin, type.angMax),
            life: life,
            fadeSpd: type.alpha1 / life,
            wiggleOffset: randomRange(-.1, .1),
        });
    }

    removeParticle(index) {
        this.particles.splice(index, 1);
    }
}

export class ParticleEmitter {

    constructor(ps) {
        this.ps = ps;
        this.setRegion(0, 0, 0, 0);
    }

    setRegion(x1, x2, y1, y2) {
        this.x1 = x1;
        this.x2 = x2;
        this.y2 = y2;
        this.y1 = y1;
    }

    stream(amount) {

    }

    burst(particle, amount) {
        for (let i = 0; i < amount; i++) {
            const x = randomRange(this.x1, this.x2);
            const y = randomRange(this.y1, this.y2);
            this.ps.addParticle(particle, x, y);
        }
    }

}

export class Particle {
    constructor() {
        this.setSprite(null);
        this.setSize(6, 8, 0, 0);
        this.setScale(1, 1);
        this.setColor("black");
        this.setAlpha(.2, 0);
        this.setSpeed(0.8, 1.2, 0, 0);
        this.setDirection(-80, -100, 0, 30);
        this.setGravity(0.001, 90);
        this.setOrientation(0, 359, 0, 0, 1);
        this.setLife(100, 200);
    }

    setSprite(sprite) {
        this.sprite = sprite;
    }

    setSize(sizeMin, sizeMax, sizeIncr, sizeWiggle) {
        this.sizeMin = sizeMin;
        this.sizeMax = sizeMax;
        this.sizeIncr = sizeIncr;
        this.sizeWiggle = sizeWiggle;
    } 

    setScale(xScale, yScale) {
        this.xScale = xScale;
        this.yScale = yScale;
    }

    setAlpha(alpha1, alpha2) {
        this.alpha1 = alpha1;
        this.alpha2 = alpha2;
    }

    setSpeed(speedMin, speedMax, speedIncr, speedWiggle) {
        this.speedMin = speedMin;
        this.speedMax = speedMax;
        this.speedIncr = speedIncr;
        this.speedWiggle = speedWiggle;
    }

    setDirection(dirMin, dirMax, dirIncr, dirWiggle) {
        this.dirMin = dirMin;
        this.dirMax = dirMax;
        this.dirIncr = dirIncr;
        this.dirWiggle = dirWiggle;
    }

    setOrientation(angMin, angMax, angIncr, anglWiggle, angRelative) {
        this.angMin = angMin;
        this.angMax = angMax;
        this.angIncr = angIncr,
        this.anglWiggle = anglWiggle;
        this.angRelative = angRelative;
    }

    setGravity(gravAmount, gravDir) {
        this.gravAmount = gravAmount;
        this.gravDir = gravDir;
    }

    setColor(color) {
        this.color = color;
    }

    setLife(lifeMin, lifeMax) {
        this.lifeMin = lifeMin;
        this.lifeMax = lifeMax;
    }

} 


function convertRange(min, max, value) {
    const oldRange = (max - min);
    const newRange = (1 - 0);
    return (((value - min) * newRange) / oldRange);
}

