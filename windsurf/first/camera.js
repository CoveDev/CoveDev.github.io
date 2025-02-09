class Camera {
    constructor(target) {
        this.target = target;
        this.x = Math.round(target.x);
        this.y = Math.round(target.y);
        this.smoothing = 0.1;
    }

    update() {
        // Smoothly move camera to target
        this.x += (this.target.x - this.x) * this.smoothing;
        this.y += (this.target.y - this.y) * this.smoothing;
        
        // Round camera position to prevent subpixel rendering
        this.x = Math.round(this.x);
        this.y = Math.round(this.y);
    }
}
