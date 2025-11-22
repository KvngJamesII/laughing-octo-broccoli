// Enhanced animations and effects
class AnimationManager {
    constructor() {
        this.particles = [];
        this.canvas = null;
        this.ctx = null;
        this.animationFrame = null;
        this.isAnimating = false;
    }

    // Initialize canvas for particle effects
    initCanvas() {
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'particle-canvas';
        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.zIndex = '999';
        document.body.appendChild(this.canvas);

        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();

        window.addEventListener('resize', () => this.resizeCanvas());
    }

    // Resize canvas to match window
    resizeCanvas() {
        if (!this.canvas) return;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    // Create confetti particles for win celebration
    createConfetti(x, y, color) {
        const colors = color ? [color] : ['#00ffff', '#ff00ff', '#ffff00', '#00ff00', '#ff6600'];
        
        for (let i = 0; i < 50; i++) {
            this.particles.push({
                x: x || window.innerWidth / 2,
                y: y || window.innerHeight / 2,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10 - 5,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: Math.random() * 8 + 2,
                life: 1,
                decay: Math.random() * 0.02 + 0.01,
                gravity: 0.3
            });
        }
    }

    // Create sparkle effect for moves
    createSparkles(x, y, color) {
        for (let i = 0; i < 15; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                color: color,
                size: Math.random() * 4 + 1,
                life: 1,
                decay: Math.random() * 0.05 + 0.02,
                gravity: 0
            });
        }
    }

    // Update and render particles
    updateParticles() {
        if (!this.ctx) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            // Update position
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += particle.gravity;
            
            // Update life
            particle.life -= particle.decay;
            
            // Remove dead particles
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }
            
            // Render particle
            this.ctx.save();
            this.ctx.globalAlpha = particle.life;
            this.ctx.fillStyle = particle.color;
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = particle.color;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }

        // Continue animation if particles exist
        if (this.particles.length > 0) {
            this.animationFrame = requestAnimationFrame(() => this.updateParticles());
        } else {
            this.isAnimating = false;
        }
    }

    // Start particle animation
    startAnimation() {
        if (!this.isAnimating) {
            this.isAnimating = true;
            this.updateParticles();
        }
    }

    // Stop all animations
    stopAnimation() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        this.particles = [];
        this.isAnimating = false;
        if (this.ctx) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    // Animate cell placement
    animateCellPlacement(cellElement, symbol) {
        cellElement.style.transform = 'scale(0)';
        cellElement.style.opacity = '0';
        
        // Get cell position for sparkles
        const rect = cellElement.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // Create sparkles
        const color = symbol === 'X' ? '#00ffff' : '#ff00ff';
        this.createSparkles(centerX, centerY, color);
        this.startAnimation();
        
        // Animate cell appearance
        setTimeout(() => {
            cellElement.style.transition = 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
            cellElement.style.transform = 'scale(1)';
            cellElement.style.opacity = '1';
        }, 50);
    }

    // Animate win celebration
    animateWin(winningCells) {
        // Create confetti
        this.createConfetti();
        this.startAnimation();
        
        // Animate winning cells
        winningCells.forEach((cell, index) => {
            setTimeout(() => {
                cell.style.animation = 'winPulse 0.6s ease-in-out infinite';
            }, index * 100);
        });
    }

    // Animate screen transitions
    animateScreenTransition(fromScreen, toScreen) {
        return new Promise((resolve) => {
            // Fade out current screen
            fromScreen.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
            fromScreen.style.opacity = '0';
            fromScreen.style.transform = 'translateY(-20px)';
            
            setTimeout(() => {
                fromScreen.classList.remove('active');
                fromScreen.style.opacity = '';
                fromScreen.style.transform = '';
                
                // Fade in new screen
                toScreen.style.opacity = '0';
                toScreen.style.transform = 'translateY(20px)';
                toScreen.classList.add('active');
                
                setTimeout(() => {
                    toScreen.style.transition = 'opacity 0.3s ease-in, transform 0.3s ease-in';
                    toScreen.style.opacity = '1';
                    toScreen.style.transform = 'translateY(0)';
                    
                    setTimeout(() => {
                        toScreen.style.transition = '';
                        toScreen.style.opacity = '';
                        toScreen.style.transform = '';
                        resolve();
                    }, 300);
                }, 50);
            }, 300);
        });
    }

    // Animate button press
    animateButtonPress(button) {
        button.style.transform = 'scale(0.95)';
        setTimeout(() => {
            button.style.transform = '';
        }, 150);
    }

    // Animate loading spinner
    animateLoading(show) {
        const overlay = document.getElementById('loading-overlay');
        if (show) {
            overlay.style.opacity = '0';
            overlay.classList.add('active');
            setTimeout(() => {
                overlay.style.transition = 'opacity 0.3s ease-in';
                overlay.style.opacity = '1';
            }, 50);
        } else {
            overlay.style.transition = 'opacity 0.3s ease-out';
            overlay.style.opacity = '0';
            setTimeout(() => {
                overlay.classList.remove('active');
                overlay.style.transition = '';
                overlay.style.opacity = '';
            }, 300);
        }
    }

    // Cleanup
    destroy() {
        this.stopAnimation();
        if (this.canvas) {
            document.body.removeChild(this.canvas);
        }
    }
}

// Sound effects manager
class SoundManager {
    constructor() {
        this.sounds = {};
        this.enabled = true;
    }

    // Create audio context and sounds
    init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.createSounds();
        } catch (error) {
            console.log('Audio not supported');
            this.enabled = false;
        }
    }

    // Create sound effects using Web Audio API
    createSounds() {
        if (!this.enabled) return;

        // Move sound
        this.sounds.move = this.createTone(800, 0.1, 'sine');
        
        // Win sound
        this.sounds.win = this.createMelody([
            {freq: 523, duration: 0.2},
            {freq: 659, duration: 0.2},
            {freq: 784, duration: 0.4}
        ]);
        
        // Lose sound
        this.sounds.lose = this.createTone(200, 0.5, 'sawtooth');
        
        // Button click
        this.sounds.click = this.createTone(1000, 0.05, 'square');
    }

    // Create a simple tone
    createTone(frequency, duration, type = 'sine') {
        return () => {
            if (!this.enabled || !this.audioContext) return;
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.value = frequency;
            oscillator.type = type;
            
            gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
        };
    }

    // Create a melody
    createMelody(notes) {
        return () => {
            if (!this.enabled || !this.audioContext) return;
            
            let time = this.audioContext.currentTime;
            notes.forEach(note => {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                oscillator.frequency.value = note.freq;
                oscillator.type = 'sine';
                
                gainNode.gain.setValueAtTime(0.1, time);
                gainNode.gain.exponentialRampToValueAtTime(0.01, time + note.duration);
                
                oscillator.start(time);
                oscillator.stop(time + note.duration);
                
                time += note.duration;
            });
        };
    }

    // Play sound
    play(soundName) {
        if (this.sounds[soundName]) {
            this.sounds[soundName]();
        }
    }

    // Toggle sound
    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }
}

// Export managers
window.animationManager = new AnimationManager();
window.soundManager = new SoundManager();

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    window.animationManager.initCanvas();
    window.soundManager.init();
});

