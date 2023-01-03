import { GAME_WIDTH, GAME_HEIGHT, getMouseX, getMouseY, foods, lerp, clamp } from "./main.js";

export default class Fish {

    static ID = 0;
    static states = {
        IDLING: 0,
        FOLLOWING: 1,
        RESTING: 2,
        EATING: 3,
        MOVING_TO_TARGET: 4,
        AVOIDING: 5,
        FIGHTING: 6,
    }

    static rotationSpeed1 = .05;
    static rotationSpeed2 = .1;
    static rotationSpeed3 = .15;

    constructor(x, y) {
        this.ID = Fish.ID++;
        this.x = x;
        this.y = y;
        this.speed = 1;
        this.targetSpeed = 1;        
        this.acceleration = .05;
        this.deceleration = .05;
        this.direction = 0;
        this.directionDeviation = -10 + Math.random() * 20;
        this.wiggleSpeed = 0;
        this.wiggleAngle = 0;
        this.angle = Math.random() * 360;
        this.xScale = .15 + Math.random() * .05;
        this.yScale = this.xScale;

        this.sprite = new Image();
        this.sprite.src = "./src/assets/fish.png";
        this.sprite.onload = () => {
            this.width = this.sprite.naturalWidth * this.xScale;
            this.height = this.sprite.naturalHeight * this.yScale;
        }
      
        this.state = Fish.states.IDLING;
        this.target = {
            x: 0,
            y: 0,
            obj: null,
        };
        this.changeState(Fish.states.IDLING);

        this.timer = {
            changePath: 1 + Math.random() * 2,
            resting: 5 + Math.random() * 30,
            checkForFood: .5 + Math.random() * 2,
        };

        this.performingAction = false;
        
    }    

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle + this.wiggleAngle);
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

        if (this.isOutsideRoom()) {
            this.targetAngle = this.pointTowards(GAME_WIDTH/2, GAME_HEIGHT/2);
            this.angle = smoothRotation(this.angle, this.targetAngle, .2 * deltaTime);
        } else {
            this.handleStates(deltaTime);
        }

        this.direction = this.angle + degToRad(90);  

        this.x += this.speed * deltaTime * Math.sin(this.direction);
        this.y -= this.speed * deltaTime * Math.cos(this.direction);
    }

    handleStates(deltaTime) {
        let timerIsFinished;
        timerIsFinished = this.timerCountdown("checkForFood", deltaTime);
        if (timerIsFinished) {
            this.checkForFood();
            this.timer["checkForFood"] = 2;
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
                timerIsFinished = this.timerCountdown("resting", deltaTime);
                if (timerIsFinished) {
                    this.changeState(Fish.states.RESTING);
                    this.timer["resting"] = 2 + Math.random() * 2;
                }
                break;

            case Fish.states.FOLLOWING:
                if (this.isOutsideRadius()) {
                    this.target.x = getMouseX();
                    this.target.y = getMouseY();
                    this.targetAngle = this.pointTowards(this.target.x, this.target.y);  
                    this.angle = smoothRotation(this.angle, this.targetAngle + degToRad(this.directionDeviation), Fish.rotationSpeed2 * deltaTime);
                } 
                break;

            case Fish.states.AVOIDING:
                if (this.distanceToPoint(getMouseX(), getMouseY()) < 150) {
                    this.target.x = getMouseX();
                    this.target.y = getMouseY();
                    this.targetAngle = this.pointTowards(this.target.x, this.target.y) - 180;  
                    this.angle = smoothRotation(this.angle, this.targetAngle, Fish.rotationSpeed2 * deltaTime);
                } else {
                    this.changeState(Fish.states.IDLING);
                }
                break;

            case Fish.states.RESTING:
                this.rock(deltaTime);

                timerIsFinished = this.timerCountdown("resting", deltaTime);
                if (timerIsFinished) {
                    this.changeState(Fish.states.IDLING);
                    this.timer["resting"] = 20 + Math.random() * 10;
                }
                break;

            case Fish.states.MOVING_TO_TARGET:
                const target = this.target.obj;
                if (foods.indexOf(target) === -1) {
                    this.changeState(Fish.states.IDLING);
                }
                this.target.x = target.x;
                this.target.y = target.y;
                this.targetAngle = this.pointTowards(this.target.x, this.target.y);  
                this.angle = smoothRotation(this.angle, this.targetAngle, Fish.rotationSpeed3 * deltaTime);
                
                const distanceToTarget = this.distanceToPoint(target.x, target.y);
                if (distanceToTarget < 20) {
                    this.rattle();

                    if (distanceToTarget <= 15) {
                        this.changeState(Fish.states.EATING);
                    } 
                }
                break;

            case Fish.states.EATING:
                const index = foods.indexOf(this.target.obj);
                foods.splice(index, 1);
                this.changeState(Fish.states.IDLING);
                break;
       } 
    }

    changeState(state) {
        this.state = state;
        this.setStateSpeed(state);
        console.log(`fish ${this.ID} is ${this.getStateName(state)}`);
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
        }
    }

    setStateSpeed(state) {
        switch(state) {
            case Fish.states.IDLING: this.targetSpeed = .3 + Math.random() * 1; break;  
            case Fish.states.FOLLOWING: this.targetSpeed = 2 + Math.random() * 1;  break; 
            case Fish.states.AVOIDING: this.targetSpeed = 2 + Math.random() * 2; break;
            case Fish.states.RESTING: this.targetSpeed = .2; break;  
            case Fish.states.MOVING_TO_TARGET: this.targetSpeed = 2; break;
            case Fish.states.EATING: this.targetSpeed = .2; break; 
            case Fish.states.FIGHTING: this.targetSpeed = 2; break; 
        }
        const deviation = -.05 + Math.random() * 0.15; 
        this.wiggleSpeed = this.targetSpeed >= 2 ? .3 + deviation: .7 + deviation;
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
        return animationWave(.1, duration);
    }

    rock(deltaTime) {
        const duration = 3;
        const rockValue = animationWave(.1, duration);
        this.targetAngle = this.angle + rockValue;
        this.angle = smoothRotation(this.angle, this.targetAngle, Fish.rotationSpeed1 * deltaTime);
        this.y += rockValue * deltaTime;
    }

    rattle() {
        this.angle += animationWave(.1, .02);
    }

    isOutsideRoom() {
        return this.x < 0 || this.x > GAME_WIDTH ||
        this.y < 0 || this.y > GAME_HEIGHT; 
    }

    isOutsideRadius() {
        return this.distanceToPoint(getMouseX(), getMouseY()) > 50;
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

    checkForFood() {
        if (foods.length <= 0) return;
        const nearest = this.nearestInstance(foods); 

        if (this.distanceToPoint(nearest.x, nearest.y) <= 600) {
            this.target.obj = nearest;
            this.changeState(Fish.states.MOVING_TO_TARGET);
            this.performingAction = true;
        }
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

function degToRad(degrees) {
    return degrees * (Math.PI / 180);
}

function radToDeg(rad) {
    return rad / (Math.PI / 180);
}

function smoothRotation(angle, targetAngle, rSpeed) {
    const diff = targetAngle - angle;
    angle += Math.min(Math.abs(diff), rSpeed) * Math.sin(diff);
    return angle;	
}

function animationWave(range, duration) {
    const a4 = (range - -range) * 0.5;
    return(-range + a4 + Math.sin((((Date.now() / 1000) + duration) / duration) * (Math.PI*2)) * a4);
}
6
