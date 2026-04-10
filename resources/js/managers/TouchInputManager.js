/**
 * TouchInputManager - Manages touch controls for mobile devices
 * Creates virtual joystick and action buttons as DOM elements
 */
class TouchInputManager {
    constructor(scene) {
        this.scene = scene;
        this.isMobile = this.detectMobile();

        // Touch input states
        this.touchState = {
            left: false,
            right: false,
            up: false,
            down: false,
            jump: false,
            attack: false,
        };

        // DOM control elements
        this.joystickElement = null;
        this.joystickThumb = null;
        this.jumpButton = null;
        this.attackButton = null;

        // Joystick tracking
        this.joystickActive = false;
        this.joystickOrigin = { x: 0, y: 0 };
        this.joystickTouchId = null;

        // Control visibility
        this.controlsVisible = false;

        if (this.isMobile) {
            this.createTouchControls();
        }
    }

    /**
     * Detect if device needs touch controls.
     * Primary check: actual touch capability (maxTouchPoints > 1) on a
     * non-desktop viewport. Falls back to UA string detection so that
     * older browsers without maxTouchPoints are still supported.
     */
    detectMobile() {
        // Touch capability check — covers iPads, Android tablets, and phones
        // regardless of UA string quirks. We require > 1 to avoid triggering
        // on Windows laptops that report a single touch point even with a mouse.
        const hasTouchCap = navigator.maxTouchPoints > 1 || navigator.msMaxTouchPoints > 1;

        // Tablets and phones tend to have narrower viewports than desktop monitors.
        // 1366px is the widest common tablet (iPad Pro 12.9" landscape is 1366px).
        const isMobileViewport = window.innerWidth <= 1366;

        if (hasTouchCap && isMobileViewport) return true;

        // UA string fallback for older browsers
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        const isMobileUA =
            /android|avantgo|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(
                userAgent,
            );
        const isTabletUA = /ipad|android(?!.*mobile)|tablet/i.test(userAgent);

        return isMobileUA || isTabletUA;
    }

    /**
     * Create touch control UI elements as DOM elements
     */
    createTouchControls() {
        const leftColumn = document.getElementById('mobile-left');
        const rightColumn = document.getElementById('mobile-right');

        if (!leftColumn || !rightColumn) {
            console.warn('[TouchInputManager] Mobile control containers not found');
            return;
        }

        // Create virtual joystick on the left
        this.createJoystick(leftColumn);

        // Create action buttons on the right
        this.createActionButtons(rightColumn);

        this.showTouchControls(true);
    }

    /**
     * Create virtual joystick as DOM element
     */
    createJoystick(container) {
        // Create joystick container
        this.joystickElement = document.createElement('div');
        this.joystickElement.style.cssText = `
            position: relative;
            width: 120px;
            height: 120px;
            background: rgba(51, 51, 51, 0.5);
            border: 3px solid rgba(102, 102, 102, 0.8);
            border-radius: 50%;
            touch-action: none;
            user-select: none;
        `;

        // Create joystick thumb
        this.joystickThumb = document.createElement('div');
        this.joystickThumb.style.cssText = `
            position: absolute;
            width: 60px;
            height: 60px;
            background: rgba(74, 222, 128, 0.8);
            border: 2px solid rgba(255, 255, 255, 1);
            border-radius: 50%;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            pointer-events: none;
        `;

        this.joystickElement.appendChild(this.joystickThumb);
        container.appendChild(this.joystickElement);

        // Handle touch events
        this.joystickElement.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.joystickActive = true;
            this.joystickTouchId = e.touches[0].identifier;
            this.updateJoystickFromTouch(e.touches[0]);
        });

        this.joystickElement.addEventListener('touchmove', (e) => {
            e.preventDefault();
            for (let touch of e.touches) {
                if (touch.identifier === this.joystickTouchId) {
                    this.updateJoystickFromTouch(touch);
                    break;
                }
            }
        });

        this.joystickElement.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.resetJoystick();
        });

        this.joystickElement.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            this.resetJoystick();
        });
    }

    /**
     * Update joystick from touch event
     */
    updateJoystickFromTouch(touch) {
        const rect = this.joystickElement.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const dx = touch.clientX - centerX;
        const dy = touch.clientY - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = 30; // Half of joystick radius

        // Clamp thumb position
        let offsetX = 0;
        let offsetY = 0;

        if (distance > 0) {
            const angle = Math.atan2(dy, dx);
            const clampedDistance = Math.min(distance, maxDistance);
            offsetX = Math.cos(angle) * clampedDistance;
            offsetY = Math.sin(angle) * clampedDistance;
        }

        // Move thumb
        this.joystickThumb.style.transform = `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`;

        // Update touch state based on direction (with deadzone)
        const deadzone = 10;
        this.touchState.left = dx < -deadzone;
        this.touchState.right = dx > deadzone;
        this.touchState.up = dy < -deadzone;
        this.touchState.down = dy > deadzone;
    }

    /**
     * Reset joystick to center
     */
    resetJoystick() {
        if (this.joystickThumb) {
            this.joystickThumb.style.transform = 'translate(-50%, -50%)';
        }
        this.joystickActive = false;
        this.joystickTouchId = null;
        this.touchState.left = false;
        this.touchState.right = false;
        this.touchState.up = false;
        this.touchState.down = false;
    }

    /**
     * Create action buttons (jump and attack) as DOM elements
     */
    createActionButtons(container) {
        // Create buttons container
        const buttonsContainer = document.createElement('div');
        buttonsContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 15px;
            align-items: center;
        `;

        // Jump button
        this.jumpButton = document.createElement('div');
        this.jumpButton.style.cssText = `
            width: 80px;
            height: 80px;
            background: rgba(59, 130, 246, 0.8);
            border: 3px solid rgba(255, 255, 255, 1);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            color: white;
            font-weight: bold;
            touch-action: none;
            user-select: none;
            transition: background 0.1s;
        `;
        this.jumpButton.textContent = '↑';

        // Jump button events
        this.jumpButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.touchState.jump = true;
            this.jumpButton.style.background = 'rgba(37, 99, 235, 1)';
        });

        this.jumpButton.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.touchState.jump = false;
            this.jumpButton.style.background = 'rgba(59, 130, 246, 0.8)';
        });

        this.jumpButton.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            this.touchState.jump = false;
            this.jumpButton.style.background = 'rgba(59, 130, 246, 0.8)';
        });

        buttonsContainer.appendChild(this.jumpButton);

        // Attack button
        this.attackButton = document.createElement('div');
        this.attackButton.style.cssText = `
            width: 80px;
            height: 80px;
            background: rgba(239, 68, 68, 0.8);
            border: 3px solid rgba(255, 255, 255, 1);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 28px;
            color: white;
            font-weight: bold;
            touch-action: none;
            user-select: none;
            transition: background 0.1s;
        `;
        this.attackButton.textContent = '⚔';

        // Attack button events
        this.attackButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.touchState.attack = true;
            this.attackButton.style.background = 'rgba(220, 38, 38, 1)';
        });

        this.attackButton.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.touchState.attack = false;
            this.attackButton.style.background = 'rgba(239, 68, 68, 0.8)';
        });

        this.attackButton.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            this.touchState.attack = false;
            this.attackButton.style.background = 'rgba(239, 68, 68, 0.8)';
        });

        buttonsContainer.appendChild(this.attackButton);
        container.appendChild(buttonsContainer);
    }

    /**
     * Get current touch input state
     */
    getTouchState() {
        return { ...this.touchState };
    }

    /**
     * Check if device is mobile
     */
    isMobileDevice() {
        return this.isMobile;
    }

    /**
     * Show or hide touch controls
     */
    showTouchControls(visible) {
        if (!this.isMobile) return;

        this.controlsVisible = visible;
        // CSS now handles visibility on mobile, no need to override
        // The mobile-controls-area is automatically shown via @media queries
    }

    /**
     * Update touch controls (called each frame)
     */
    update() {
        // Handle continuous jump button press
        // The jump state will be read by InputHandler
    }

    /**
     * Clean up resources
     */
    destroy() {
        if (this.joystickElement) {
            this.joystickElement.remove();
        }
        if (this.jumpButton) {
            this.jumpButton.remove();
        }
        if (this.attackButton) {
            this.attackButton.remove();
        }
    }
}

export default TouchInputManager;
