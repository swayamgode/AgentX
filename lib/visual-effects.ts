
/**
 * Visual Effects Utility
 * High-end canvas effects for video generation
 */

// Simple Particle System
export class ParticleSystem {
    particles: Array<{
        x: number;
        y: number;
        vx: number;
        vy: number;
        size: number;
        alpha: number;
        life: number;
        maxLife: number;
    }> = [];

    constructor(private width: number, private height: number, count: number = 30) {
        for (let i = 0; i < count; i++) {
            this.particles.push(this.createParticle());
        }
    }

    createParticle() {
        return {
            x: Math.random() * this.width,
            y: Math.random() * this.height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            size: Math.random() * 4 + 1,
            alpha: Math.random() * 0.5 + 0.1,
            life: Math.random() * 100,
            maxLife: 100 + Math.random() * 200
        };
    }

    update() {
        this.particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life++;

            if (p.x < 0 || p.x > this.width) p.vx *= -1;
            if (p.y < 0 || p.y > this.height) p.vy *= -1;

            if (p.life > p.maxLife) {
                Object.assign(p, this.createParticle());
                p.life = 0;
            }
        });
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        this.particles.forEach(p => {
            const opacity = Math.sin((p.life / p.maxLife) * Math.PI) * p.alpha;
            ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.restore();
    }
}

// Mesh Gradient / Animated Blobs
export class MeshGradient {
    blobs: Array<{
        x: number;
        y: number;
        radius: number;
        color: string;
        targetX: number;
        targetY: number;
        vx: number;
        vy: number;
    }> = [];

    constructor(private width: number, private height: number) {
        const colors = [
            'rgba(139, 92, 246, 0.4)', // Purple
            'rgba(236, 72, 153, 0.4)', // Pink
            'rgba(59, 130, 246, 0.4)', // Blue
            'rgba(16, 185, 129, 0.4)', // Emerald
        ];

        for (let i = 0; i < 6; i++) {
            this.blobs.push({
                x: Math.random() * width,
                y: Math.random() * height,
                radius: width * (0.4 + Math.random() * 0.4),
                color: colors[i % colors.length],
                targetX: Math.random() * width,
                targetY: Math.random() * height,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2
            });
        }
    }

    update() {
        this.blobs.forEach(b => {
            b.x += b.vx;
            b.y += b.vy;

            if (b.x < -b.radius || b.x > this.width + b.radius) b.vx *= -1;
            if (b.y < -b.radius || b.y > this.height + b.radius) b.vy *= -1;
        });
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.filter = 'blur(100px)';

        this.blobs.forEach(b => {
            const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.radius);
            grad.addColorStop(0, b.color);
            grad.addColorStop(1, 'rgba(0,0,0,0)');

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.restore();
    }
}
