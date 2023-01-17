import { GAME_WIDTH, GAME_HEIGHT, removeFish, removeEnemy, foods, fishes, enemies, corpses, spawnBubbles, spawnCorpse } from "./main.js";
import { getMouseX, getMouseY, degToRad, radToDeg, lerp, choose, chance, randomRange, animationWave } from "./misc.js";

class FishParent {
    static ID = 0;
    static states = {
        IDLING: 0,
        FOLLOWING: 1,
        RESTING: 2,
        EATING: 3,
        MOVING_TO_TARGET: 4,
        AVOIDING: 5,
        FIGHTING: 6,
        FLEEING: 7,
        KILLING: 8,
        DYING: 9,
    }

    static rotationSpeed1 = .05;
    static rotationSpeed2 = .08;
    static rotationSpeed3 = .1;
    static rotationSpeed4 = .2;
    static avoidDistance = 200;
    static eatingDistance = 15;

    static actionCooldown = 1;
    static chanceToFight = 10;

    constructor() {
        this.ID = Fish.ID++;
        this.speed = 1;
        this.targetSpeed = 1;    
        this.direction = 0;
        this.directionDeviation = randomRange(-10, 10);
        this.wiggleSpeed = 0;
        this.wiggleAngle = 0;
        this.angle = degToRad(Math.random() * 360);
        this.targetAngle = this.angle;
        this.facing = 1;
        this.targetFacing =  this.facing;
        this.isTargeted = false;
        
        this.state = Fish.states.IDLING;
        this.target = {
            x: 0,
            y: 0,
            obj: null,
            arrivalState: Fish.states.IDLING,
        };
        this.performingAction = false;
        this.canPerformAction = true;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle + this.wiggleAngle);
        ctx.scale(1, 1 * this.facing);
        ctx.drawImage(this.sprite, -this.width/2, -this.height/2, this.width, this.height);
        ctx.restore(); 
    }

    update(deltaTime) {

        this.wiggleAngle = lerp(this.wiggleAngle, this.wiggle(), .3 * deltaTime); //Wiggle smoothing

        if (this.speed < this.targetSpeed) {
            this.speed += this.acceleration * deltaTime;
        } else if (this.speed > 0) {
            this.speed -= this.deceleration * deltaTime;
        }

        if (this.isOutsideRoom() && !this.state === Fish.states.FLEEING) {
            this.targetAngle = this.pointTowards(GAME_WIDTH/2, GAME_HEIGHT/2);
            this.angle = smoothRotation(this.angle, this.targetAngle, .2 * deltaTime);
        } else {
            this.handleStates(deltaTime);
        }

        this.direction = this.angle; 

        this.x += this.speed * deltaTime * Math.cos(this.direction);
        this.y += this.speed * deltaTime * Math.sin(this.direction);
    }

    changeState(state) {
        this.state = state;
        this.setStateSpeed(state);
        //console.log(`fish ${this.ID} is ${this.getStateName(state)}`);
        this.performingAction = false; //Reset actions on state change
    }

    getStateName(state) {
        switch(state) {
            case Fish.states.IDLING: return "Idling";
            case Fish.states.FOLLOWING: return "Following";
            case Fish.states.AVOIDING: return "Avoiding";
            case Fish.states.RESTING: return "Resting";
            case Fish.states.MOVING_TO_TARGET: return "Moving to target";
            case Fish.states.EATING: return "Eating";
            case Fish.states.FIGHTING: return "Fighting";
            case Fish.states.FLEEING: return "Fleeing";
            case Fish.states.KILLING: return "Killing";
            case Fish.states.DYING: return "Dying";
        }
    }

    pointTowards(x, y) {
        return Math.atan2(y - this.y, x - this.x);  
    }

    distanceToPoint(x, y) {
        const a = this.x - x;
        const b = this.y - y;
        return Math.sqrt(a*a + b*b);
    }

    wiggle() {
        if (this.targetSpeed < 0.5) return 0;
        const duration = this.wiggleSpeed;
        return animationWave(.2, duration);
    }

    rock(deltaTime) { 
        const duration = 3;
        const rockValue = animationWave(.1, duration);
        this.targetAngle = this.angle + rockValue;
        this.angle = smoothRotation(this.angle, this.targetAngle, Fish.rotationSpeed1 * deltaTime);
        this.y += rockValue * deltaTime;
    }

    rattle() {
        this.wiggleAngle = animationWave(.2, .1);
    }

    isOutsideRoom() {
        return this.x < -this.width || this.x > GAME_WIDTH + this.width ||
        this.y < -this.height || this.y > GAME_HEIGHT + this.height; 
    }

    timerCountdown(timer, deltaTime) { 
        if (this.timer[timer] > 0) {
            this.timer[timer] -= 1/60 * deltaTime;
            return false;
        } else if (this.timer[timer] != null) {
            this.timer[timer] = null;
            return true;
        }
        return null;
    }

    nearestInstance(arr) { 
        arr.forEach(obj => {
            obj.distance = this.distanceToPoint(obj.x, obj.y);
        });

        arr.sort((a, b) => {
            if (a.distance > b.distance) {
                return true;
            }
        });
        delete arr[0].distance;
        
        return arr[0];
    }
}


export class Fish extends FishParent {
    constructor(sprite, x, y) {
        super();
        this.sprite = sprite;
        this.x = x;
        this.y = y;
        this.acceleration = .05;
        this.deceleration = .03; 
        this.xScale = randomRange(.15, .2);
        this.yScale = this.xScale;
        this.width = sprite.naturalWidth * this.xScale;
        this.height = sprite.naturalHeight * this.yScale;
       
        this.timer = {
            changePath: randomRange(1, 3),
            resting: randomRange(5, 35),
            checkForFood: randomRange(.5, 2.5),
            checkForEnemies: 1,
            checkForFight: randomRange(1, 50),
            canPerformAction: -1,
        };        

        this.changeState(Fish.states.IDLING);
    }    

    handleStates(deltaTime) {
        let timerIsFinished;
        let target = null;
        timerIsFinished = this.timerCountdown("checkForFood", deltaTime);
        if (timerIsFinished) {
            this.checkForFood();
            this.timer["checkForFood"] = 2;
        }
        timerIsFinished = this.timerCountdown("checkForEnemies", deltaTime);
        if (timerIsFinished) {
            this.checkForEnemies();
            this.timer["checkForEnemies"] = 1;
        }
        timerIsFinished = this.timerCountdown("canPerformAction", deltaTime);
        if (timerIsFinished) {
            this.canPerformAction = true;
        }
        switch(this.state) {
            case Fish.states.IDLING:
                this.targetAngle = this.pointTowards(this.target.x, this.target.y); 
                this.angle = smoothRotation(this.angle, this.targetAngle, Fish.rotationSpeed1 * deltaTime);

                timerIsFinished = this.timerCountdown("changePath", deltaTime);
                if (timerIsFinished) {
                    this.setStateSpeed(Fish.states.IDLING);
                    this.target.x = Math.random() * GAME_WIDTH;
                    this.target.y = Math.random() * GAME_HEIGHT;
                    this.timer["changePath"] = randomRange(1, 4);
                }
                timerIsFinished = this.timerCountdown("resting", deltaTime);
                if (timerIsFinished) {
                    this.changeState(Fish.states.RESTING);
                    this.timer["resting"] = randomRange(2, 4);
                }
                timerIsFinished = this.timerCountdown("checkForFight", deltaTime);
                if (timerIsFinished) {
                    this.checkForFight();
                    this.timer["checkForFight"] = randomRange(10, 50);
                }
                break;

            case Fish.states.FOLLOWING:
                if (this.isOutsideRadius()) {
                    this.target.x = getMouseX();
                    this.target.y = getMouseY();
                    this.targetAngle = this.pointTowards(this.target.x, this.target.y) + degToRad(this.directionDeviation);  
                    this.angle = smoothRotation(this.angle, this.targetAngle, Fish.rotationSpeed2 * deltaTime);
                } 
                break;

            case Fish.states.AVOIDING:
                target = this.target.obj;
                if (this.distanceToPoint(target.x, target.y) < Fish.avoidDistance) {
                    timerIsFinished = this.timerCountdown("changePath", deltaTime);
                    if (timerIsFinished) {
                        this.directionDeviation = randomRange(-10, 10);
                        this.timer["changePath"] = 2;
                    } 
                    this.targetAngle = this.pointTowards(target.x, target.y) - 180 + this.directionDeviation;  
                    this.angle = smoothRotation(this.angle, this.targetAngle, Fish.rotationSpeed1 * deltaTime);

                } else {
                    this.changeState(Fish.states.IDLING);
                }
                break;

            case Fish.states.RESTING:
                this.rock(deltaTime);

                timerIsFinished = this.timerCountdown("resting", deltaTime);
                if (timerIsFinished) {
                    this.changeState(Fish.states.IDLING);
                    this.timer["resting"] = randomRange(20, 30);
                }
                break;

            case Fish.states.MOVING_TO_TARGET:
                target = this.target.obj;
                this.target.x = target.x;
                this.target.y = target.y;
                this.targetAngle = this.pointTowards(this.target.x, this.target.y);

                if (this.target.arrivalState === Fish.states.EATING) {
                    if (foods.indexOf(target) === -1) {
                        this.changeState(Fish.states.IDLING);
                    }
                } 
                
                this.angle = smoothRotation(this.angle, this.targetAngle, Fish.rotationSpeed3 * deltaTime);

                const distanceToTarget = this.distanceToPoint(target.x, target.y);
                if (distanceToTarget < Fish.eatingDistance + 10) {
                    this.rattle();

                    if (distanceToTarget <= Fish.eatingDistance) {
                        this.changeState(this.target.arrivalState);
                    } 
                }
                break;

            case Fish.states.EATING:
                if (this.canPerformAction) {
                    const index = foods.indexOf(this.target.obj);
                    foods.splice(index, 1);
                    this.changeState(Fish.states.IDLING);
                    spawnBubbles(this.x, this.y, 2);

                    this.canPerformAction = false;
                    this.timer["canPerformAction"] = Fish.actionCooldown;
                }
                break;

            case Fish.states.DYING:
                spawnCorpse(this.x, this.y, this.speed, this.xScale, this.yScale, this.angle);

                const index = fishes.indexOf(this);
                removeFish(index);
                break;

            case Fish.states.FIGHTING:
                if (this.canPerformAction) {
                    spawnBubbles(this.x, this.y, 2);
                    this.canPerformAction = false;
                    this.timer["canPerformAction"] = Fish.actionCooldown;

                    if (chance(50)) {
                        this.changeState(Fish.states.MOVING_TO_TARGET);
                    } else {
                        this.changeState(Fish.states.IDLING);
                    }
                }
                break;
        } 
    }

    setStateSpeed(state) {
        switch(state) {
            case Fish.states.IDLING: this.targetSpeed = randomRange(.3, 1.3); break;  
            case Fish.states.FOLLOWING: this.targetSpeed = randomRange(2, 3);  break; 
            case Fish.states.AVOIDING: this.targetSpeed = randomRange(2, 3); break;
            case Fish.states.RESTING: this.targetSpeed = .2; break;  
            case Fish.states.MOVING_TO_TARGET: this.targetSpeed = 2; break;
            case Fish.states.EATING: this.targetSpeed = .2; break; 
            case Fish.states.FIGHTING: this.targetSpeed = 2; break; 
        }   
        const deviation = randomRange(-.05, .1); 
        this.wiggleSpeed = this.targetSpeed >= 2 ? .4 + deviation: .7 + deviation;
    }

    checkForFood() {
        if (foods.length <= 0 || !this.canPerformAction) return;
        const nearest = this.nearestInstance(foods); 

        if (this.distanceToPoint(nearest.x, nearest.y) <= 600) {
            this.target.obj = nearest;
            this.target.arrivalState = Fish.states.EATING;
            this.changeState(Fish.states.MOVING_TO_TARGET);
            this.performingAction = true;
        }
    }

    checkForEnemies() {
        if (enemies.length <= 0) return;
        const nearest = this.nearestInstance(enemies); 
        if (this.distanceToPoint(nearest.x, nearest.y) <= Fish.avoidDistance) {
            this.target.obj = nearest;
            this.changeState(Fish.states.AVOIDING);
            this.performingAction = true;
        }
    }

    checkForFight() {
        if (fishes.length < 2 || !chance(Fish.chanceToFight)) return;

        const index = Math.floor(Math.random() * (fishes.length-1));
        const fishToFight = fishes[index];
        if (fishToFight === this) return;			

        this.changeState(Fish.states.MOVING_TO_TARGET);
        this.target.obj = fishToFight;
        this.target.arrivalState = Fish.states.FIGHTING;
    }

    isOutsideRadius() {
        return this.distanceToPoint(getMouseX(), getMouseY()) > 50;
    }
}

class EnemyParent extends FishParent {
    constructor() {
        super();
   
        this.timer = {
            changePath: randomRange(1, 3),
            checkForFish: 1,
            canPerformAction: -1,
        };        
      
        const time = randomRange(10, 15);
        setTimeout(() => {
            this.changeState(Fish.states.FLEEING);
            this.target.x = choose(-100, GAME_WIDTH + 100);
            this.target.y = Math.random() * GAME_HEIGHT;
            this.performingAction = true;
            if (this.target.obj !== null) {
                this.target.obj.isTargeted = false;
            }
        }, time * 1000);
    }    

    handleStates(deltaTime) {
        const ang = radToDeg(this.angle);
        if (ang > 130 && ang < 310) {
			this.targetFacing = -1;
		} else {
			this.targetFacing = 1;	
		}
        this.facing = lerp(this.facing, this.targetFacing, .25 * deltaTime);

        let timerIsFinished;

        timerIsFinished = this.timerCountdown("checkForFish", deltaTime);
        if (timerIsFinished) {
            this.checkForFish();
            this.timer["checkForFish"] = 1;
        }
        timerIsFinished = this.timerCountdown("canPerformAction", deltaTime);
        if (timerIsFinished) {
            this.canPerformAction = true;
        }

        switch(this.state) {
            case Fish.states.IDLING:
                this.targetAngle = this.pointTowards(this.target.x, this.target.y);  
                this.angle = smoothRotation(this.angle, this.targetAngle, Fish.rotationSpeed1 * deltaTime);

                timerIsFinished = this.timerCountdown("changePath", deltaTime);
                if (timerIsFinished) {
                    this.setStateSpeed(Fish.states.IDLING);
                    this.target.x = Math.random() * GAME_WIDTH;
                    this.target.y = Math.random() * GAME_HEIGHT;
                    this.timer["changePath"] = 1 + Math.random() * 3;
                }
                break;

            case Fish.states.MOVING_TO_TARGET:
                const target = this.target.obj;
                if (fishes.indexOf(target) === -1) {
                    this.changeState(Fish.states.IDLING);
                }  
                this.target.x = target.x;
                this.target.y = target.y;
                this.targetAngle = this.pointTowards(this.target.x, this.target.y);  
                this.angle = smoothRotation(this.angle, this.targetAngle, Fish.rotationSpeed2 * deltaTime);
                
                
                const distanceToTarget = this.distanceToPoint(target.x, target.y);
                if (distanceToTarget < Fish.eatingDistance + 5) {
                    this.rattle();
                    if (distanceToTarget <= Fish.eatingDistance) {
                        this.changeState(this.target.arrivalState);
                    } 
                } else if (distanceToTarget > 500) {
                    target.isTargeted = false;
                    this.changeState(Fish.states.IDLING);
                }
                break;

            case Fish.states.EATING: 
                if (this.canPerformAction) {
                    const index = fishes.indexOf(this.target.obj);
                    removeFish(index);
                    this.changeState(Fish.states.IDLING);
                    spawnBubbles(this.x, this.y, randomRange(8, 16));
                  
                    this.canPerformAction = false;
                    this.timer["canPerformAction"] = Fish.actionCooldown;
                }
                break;

            case Fish.states.KILLING: 
                if (this.canPerformAction) {
                    const target = this.target.obj;
                    target.changeState(Fish.states.DYING);

                    this.changeState(Fish.states.IDLING);
                    spawnBubbles(target.x, target.y, randomRange(8, 16));

                    this.canPerformAction = false;
                    this.timer["canPerformAction"] = Fish.actionCooldown;
                }
                break;

            case Fish.states.FLEEING: 
                this.targetAngle = this.pointTowards(this.target.x, this.target.y);  
                this.angle = smoothRotation(this.angle, this.targetAngle, Fish.rotationSpeed1 * deltaTime);

                if (this.isOutsideRoom()) {
                    const index = enemies.indexOf(this);
                    removeEnemy(index);
                }
                break;
        } 
    }

    setStateSpeed(state) {
        switch(state) {
            case Fish.states.IDLING: this.targetSpeed = .3 + Math.random(); break;  
            case Fish.states.RESTING: this.targetSpeed = .2; break;  
            case Fish.states.MOVING_TO_TARGET: this.targetSpeed = 3; break;
            case Fish.states.EATING: this.targetSpeed = .2; break; 
            case Fish.states.KILLING: this.targetSpeed = .2; break; 
            case Fish.states.FLEEING: this.targetSpeed = 3 + Math.random(); break; 
        }
        const deviation = randomRange(-.05, .1); 
        this.wiggleSpeed = this.targetSpeed >= 2 ? .3 + deviation: .7 + deviation;
    }
}

export class Enemy1 extends EnemyParent {
    constructor(sprite, x, y) {
        super();
        this.sprite = sprite;
        this.x = x;
        this.y = y;  
        this.acceleration = .04;
        this.deceleration = .03;
        this.xScale = randomRange(.18, .2);
        this.yScale = this.xScale;
        this.width = sprite.naturalWidth * this.xScale;
        this.height = sprite.naturalHeight * this.yScale;

        this.changeState(Fish.states.IDLING);
    }    

    checkForFish() {
        if (fishes.length <= 0 || !this.canPerformAction || this.performingAction) return;
        const nearest = this.nearestInstance(fishes); 
        if (nearest.isTargeted) return;

        if (this.distanceToPoint(nearest.x, nearest.y) <= 500) {
            nearest.isTargeted = true;
            this.target.obj = nearest;
            this.target.arrivalState = Fish.states.KILLING;
            this.changeState(Fish.states.MOVING_TO_TARGET);
            this.performingAction = true;
        }
    }
}

export class Enemy2 extends EnemyParent {
    constructor(sprite, x, y) {
        super();
        this.sprite = sprite;
        this.x = x;
        this.y = y;  
        this.acceleration = .04;
        this.deceleration = .03;
        this.xScale = randomRange(.4, .6);
        this.yScale = this.xScale;
        this.width = sprite.naturalWidth * this.xScale;
        this.height = sprite.naturalHeight * this.yScale;

        this.changeState(Fish.states.IDLING);
    }    

    checkForFish() {
        if (fishes.length <= 0 || !this.canPerformAction || this.performingAction) return;
        const nearest = this.nearestInstance(fishes); 
        if (nearest.isTargeted) return;

        if (this.distanceToPoint(nearest.x, nearest.y) <= 500) {
            this.target.obj = nearest;
            this.target.arrivalState = Fish.states.EATING;
            this.changeState(Fish.states.MOVING_TO_TARGET);
            this.performingAction = true;
        }
    }
}

export class FishCorpse {
    constructor(sprite, x, y, speed, xScale, yScale, angle) {
        this.sprite = sprite;
        this.x = x;
        this.y = y;
        this.speed = speed;
        this.xScale = xScale;
        this.yScale = yScale;
        this.width = sprite.naturalWidth * this.xScale;
        this.height = sprite.naturalHeight * this.yScale;
        this.angle = angle;
        this.targetAngle = -90;
        this.riseSpeed = 0.3;
    } 

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle + animationWave(.2, 2));
        ctx.drawImage(this.sprite, -this.width/2, -this.height/2, this.width, this.height);
        ctx.restore(); 
    }

    update(deltaTime) {
        if (this.speed > 0) {
            this.speed -= 0.02 * deltaTime;

            this.x += this.speed * deltaTime * Math.cos(this.angle);
            this.y += this.speed * deltaTime * Math.sin(this.angle);
        } 

        this.y -= this.riseSpeed * deltaTime;

        if (this.y < -this.height) {
            const index = corpses.indexOf(this);
            corpses.splice(index, 1);
        }
    }
}

function smoothRotation(angle, targetAngle, rSpeed) {
    const diff = targetAngle - angle;
    angle += Math.min(Math.abs(diff), rSpeed) * Math.sin(diff);
    if (angle > degToRad(359)) {
        angle =  0;
    } else if (angle < 0) {
        angle = degToRad(359);
    }
    return angle;	
}

