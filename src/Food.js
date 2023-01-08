import { GAME_HEIGHT, foods } from "./main.js";

export default class Food {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.speed = 3;
        this.deceleration = 0.03;
        this.angle = Math.random() * 360;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.fillStyle = "#964B00";
        ctx.fillRect(0, 0, 5, 5);
        ctx.restore(); 
    }

    update(deltaTime) {
        this.y += this.speed * deltaTime;

        if (this.speed > 0.5) {
            this.speed -= this.deceleration * deltaTime;
        }

        if (this.isOutsideRoom()) {
            const index = foods.indexOf(this);
            foods.splice(index, 1);
        }
    }

    isOutsideRoom() {
        return this.y > GAME_HEIGHT; 
    }
}