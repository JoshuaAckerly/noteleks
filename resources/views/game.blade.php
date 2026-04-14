<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="mobile-web-app-capable" content="yes">
    <title>Noteleks Heroes Beyond Light - {{ config('app.name') }}</title>
    
    <!-- Preconnect to CDN for faster Phaser loading on mobile -->
    <link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
    <link rel="dns-prefetch" href="https://cdn.jsdelivr.net">
    
    <script>
        // Silence console output when app.debug is false (production).
        // This prevents console logging from appearing during normal play.
        (function(){
            var debug = {{ config('app.debug') ? 'true' : 'false' }};
            if (!debug && typeof console !== 'undefined') {
                ['log','info','warn','error','debug'].forEach(function(m){
                    try { console[m] = function(){}; } catch(e) { /* ignore */ }
                });
            }
        })();
    </script>
    <!-- Google Analytics -->
    @if(config('services.google_analytics.tracking_id'))
    <script async src="https://www.googletagmanager.com/gtag/js?id={{ config('services.google_analytics.tracking_id') }}"></script>
    <script>
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        
        var trackingId = '{{ config('services.google_analytics.tracking_id') }}';
        gtag('config', trackingId, {
            cookie_domain: '.graveyardjokes.com',
            cookie_flags: 'SameSite=None;Secure'
        });
        
        // Track game access
        gtag('event', 'game_access', {
            'event_category': 'games',
            'event_label': 'noteleks',
            'custom_parameter_subdomain': window.location.hostname
                
        });

        // Track visitor for email notifications
        async function trackGameVisit() {
            try {
                const visitData = {
                    referrer: window.location.href,
                    subdomain: window.location.hostname,
                    page_title: document.title,
                    user_agent: navigator.userAgent,
                    timestamp: new Date().toISOString()
                };

                console.log('🎮 Tracking game visit:', visitData);

                const host = window.location.hostname;
                const isMainLocal = host === 'localhost' || host === '127.0.0.1' || host === 'graveyardjokes.local';
                const isMainTest = host === 'graveyardjokes.test';
                const isMainProd = host === 'graveyardjokes.com' || host === 'www.graveyardjokes.com';
                const isLocalSubdomain = host.endsWith('.graveyardjokes.local');
                const isTestSubdomain = host.endsWith('.graveyardjokes.test');

                let trackingUrl = '/api/track-visit';
                if (isLocalSubdomain) {
                    trackingUrl = 'http://graveyardjokes.local/api/track-visit';
                } else if (isTestSubdomain) {
                    trackingUrl = 'http://graveyardjokes.test/api/track-visit';
                } else if (!isMainLocal && !isMainTest && !isMainProd) {
                    trackingUrl = 'https://graveyardjokes.com/api/track-visit';
                }

                visitData.page_path = window.location.pathname;
                visitData.page_url = window.location.href;

                const response = await fetch(trackingUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(visitData)
                });

                const result = await response.json();
                console.log('✅ Game visit tracked:', result.status);
            } catch (error) {
                console.error('❌ Game tracking failed:', error);
            }
        }

        // Track the visit when page loads
        trackGameVisit();
    </script>
    @endif
    
    <script src="https://cdn.jsdelivr.net/npm/phaser@3.90.0/dist/phaser.min.js" defer></script>

    <!-- Enable Noteleks in-page debug hooks when present so we can see
         the on-page logger and diagnostic overlays during troubleshooting. -->
    <script>
        // Very-early error capture: install handlers before the app bundles
        // are loaded so crashes that occur during or before script execution
        // are captured to localStorage and optionally posted with sendBeacon.
        (function(){
            try {
                // Expose a small device snapshot for later debugging
                window.__noteleks_initial_device_info = {
                    userAgent: navigator.userAgent || null,
                    deviceMemory: navigator.deviceMemory || null,
                    cores: navigator.hardwareConcurrency || null,
                    platform: navigator.platform || null,
                    ts: Date.now()
                };

                function writePayload(payload){
                    try { localStorage.setItem('noteleks_last_error', JSON.stringify(payload)); } catch(e){}
                    // Try to send to an optional server endpoint for remote capture
                    try {
                        if (navigator && typeof navigator.sendBeacon === 'function') {
                            var blob = new Blob([JSON.stringify(payload)], {type: 'application/json'});
                            // Best-effort; endpoint is optional on server
                            navigator.sendBeacon('/__noteleks_error', blob);
                        }
                    } catch(e){}
                }

                var originalOnError = window.onerror;
                window.onerror = function(message, source, lineno, colno, error){
                    try {
                        var payload = {
                            type: 'error',
                            message: (error && error.message) || message || String(message),
                            stack: (error && error.stack) || null,
                            source: source || null,
                            lineno: lineno || null,
                            colno: colno || null,
                            device: window.__noteleks_initial_device_info || null,
                            ts: Date.now()
                        };
                        writePayload(payload);
                    } catch(e){}
                    if (typeof originalOnError === 'function') {
                        try { originalOnError.apply(this, arguments); } catch(e){}
                    }
                    return false;
                };

                window.addEventListener('unhandledrejection', function(ev){
                    try {
                        var reason = ev && ev.reason;
                        var payload = {
                            type: 'unhandledrejection',
                            message: (reason && (reason.message || String(reason))) || 'unhandledrejection',
                            stack: (reason && reason.stack) || null,
                            device: window.__noteleks_initial_device_info || null,
                            ts: Date.now()
                        };
                        writePayload(payload);
                    } catch(e){}
                }, {passive:true});
            } catch(e) {
                // best-effort only
            }
        })();

    </script>

    @vite('resources/js/main-modular.js')
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        html, body {
            width: 100%;
            height: 100%;
            overflow: hidden;
            background: linear-gradient(135deg, #1a1a2e, #16213e, #0f3460);
            font-family: Arial, sans-serif;
            color: #fff;
            /* Mobile optimizations */
            -webkit-touch-callout: none;
            -webkit-user-select: none;
            -khtml-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
            -webkit-tap-highlight-color: transparent;
        }
        
        #game-container {
            position: relative;
            width: 100vw;
            height: 100vh;
            display: flex;
            flex-direction: column;
        }
        
        /* Minimal game UI container used by TouchInputComponent
           Made transparent to avoid a decorative rounded black bar when
           the in-canvas UI is used. Keep container for positioning of any
           injected controls, but remove background/padding so it is invisible. */
        #game-ui {
            position: absolute;
            top: 10px;
            left: 10px;
            right: 10px;
            z-index: 100;
            display: flex;
            justify-content: space-between;
            padding: 0;
            background: transparent;
            border-radius: 0;
        }
        

        
        #phaser-game {
            width: 100vw;
            height: 100vh;
            display: block;
        }

        /* Hide mobile controls on desktop by default */
        #mobile-controls-area {
            display: none;
        }

        /* ── Tablet (769 – 1199 px) ──────────────────────────────────────────
           Show touch controls in a side-by-side landscape layout.
           The game canvas takes 60 % of the width; controls take 40 %.
           ──────────────────────────────────────────────────────────────────── */
        @media (min-width: 769px) and (max-width: 1199px) {
            body {
                height: 100vh;
                overflow: hidden;
                position: fixed;
                width: 100%;
                background: #2a2a2a;
            }

            #game-container {
                flex-direction: row;
                padding: 8px;
                background: #2a2a2a;
                height: 100vh;
                gap: 8px;
            }

            #phaser-game {
                width: 62%;
                height: 100vh;
                border: 2px solid #1a1a1a;
                border-radius: 10px;
                background: #000;
                margin: 0;
                flex-shrink: 0;
                box-shadow: inset 0 0 10px rgba(0,0,0,0.5), 0 6px 18px rgba(0,0,0,0.35);
            }

            #phaser-game canvas {
                border-radius: 8px;
            }

            /* Controls panel on the right */
            #mobile-controls-area {
                display: flex !important;
                flex-direction: column;
                width: 38%;
                height: 100%;
                justify-content: space-around;
                align-items: center;
                padding: 16px 12px;
                background: #1e1e1e;
                border-radius: 10px;
                border: 2px solid #333;
                gap: 12px;
                box-sizing: border-box;
            }

            #mobile-controls-area .left-column,
            #mobile-controls-area .right-column {
                flex: 1 1 0;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            #mobile-controls-area .center-column {
                flex: 0 0 auto;
                display: flex;
                align-items: center;
                justify-content: center;
                max-width: 90px;
            }

            #mobile-controls-area #game-controls {
                display: flex !important;
                align-items: center;
                flex-direction: column;
                gap: 8px;
                position: static !important;
                top: auto !important;
                left: auto !important;
                transform: none !important;
            }

            #game-controls button {
                padding: 10px 16px;
                font-size: 13px;
                min-width: 80px;
                min-height: 40px;
            }
        }

        /* Tablet portrait (769 – 1199 px, portrait) */
        @media (min-width: 769px) and (max-width: 1199px) and (orientation: portrait) {
            #game-container {
                flex-direction: column;
            }

            #phaser-game {
                width: 100%;
                height: 55vh;
                flex-shrink: 0;
            }

            #mobile-controls-area {
                width: 100%;
                height: auto;
                flex-direction: row;
                min-height: 30vh;
                border-radius: 10px 10px 0 0;
                padding: 12px 20px 20px;
            }
        }

        /* Mobile Game Boy Style Layout */
        @media (max-width: 768px) and (orientation: portrait) {
            body {
                height: 100vh; /* Keep within viewport */
                overflow: hidden; /* Prevent scrolling */
                position: fixed;
                width: 100%;
            }

            /* Stack like a Game Boy: screen on top, controls below */
            #game-container {
                padding: 8px;
                background: #2a2a2a;
                height: 100vh; /* Fit exactly in viewport */
                display: flex;
                flex-direction: column;
                justify-content: flex-start;
                overflow: hidden;
                gap: 8px;
            }

            /* Make the game area smaller so controls have room underneath */
            #phaser-game {
                width: 100%;
                height: 48vh; /* Reserve roughly half the screen for the game */
                max-height: 420px;
                border: 3px solid #1a1a1a;
                border-radius: 12px;
                background: #000;
                margin: 0;
                flex-shrink: 0; /* prevent shrinking when controls expand */
                box-shadow: inset 0 0 10px rgba(0,0,0,0.5), 0 6px 18px rgba(0,0,0,0.35);
            }

            #phaser-game canvas {
                border-radius: 8px;
            }






        }

        @media (max-width: 768px) and (orientation: landscape) {
            body {
                height: 100vh;
                overflow: hidden;
                position: fixed;
                width: 100%;
                background: #2a2a2a;
            }

            #game-container {
                /* Landscape layout - side by side */
                flex-direction: row;
                padding: 5px;
                background: #2a2a2a;
                height: 100vh;
                gap: 5px;
            }

            #phaser-game {
                width: 65%;
                height: 100vh;
                border: 2px solid #1a1a1a;
                border-radius: 8px;
                background: #000;
                margin: 0;
            }

            #mobile-controls-area {
                display: flex !important;
                flex-direction: column;
                width: 35%;
                height: 100%;
                justify-content: space-around;
                align-items: center;
                padding: 10px;
                gap: 10px;
            }

            #mobile-controls-area .left-column,
            #mobile-controls-area .right-column,
            #mobile-controls-area .center-column {
                flex: 1;
                display: flex;
                align-items: center;
                justify-content: center;
            }
        }
        
        #phaser-game canvas {
            display: block;
            width: 100% !important;
            height: 100% !important;
            /* Prevent mobile scrolling and selection */
            touch-action: none;
            -webkit-touch-callout: none;
            -webkit-user-select: none;
            user-select: none;
        }
        
        #game-controls {
            position: absolute;
            top: 60px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 100;
            display: flex;
            gap: 15px;
        }
        
        #game-controls button {
            padding: 12px 24px;
            background: rgba(74, 222, 128, 0.9);
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-radius: 8px;
            color: white;
            font-weight: bold;
            font-size: 14px;
            cursor: pointer;
            backdrop-filter: blur(5px);
            transition: all 0.2s;
            touch-action: manipulation;
            -webkit-tap-highlight-color: transparent;
        }
        
        #game-controls button:hover {
            background: rgba(74, 222, 128, 1);
        }

        /* Mobile button styling */
        @media (max-width: 768px) {
            #game-controls {
                flex-direction: column;
                gap: 4px;
                width: auto;
            }

            #game-controls button {
                padding: 6px 10px;
                font-size: 11px;
                min-width: 65px;
                min-height: 32px; /* Smaller but still touch-friendly */
                white-space: nowrap;
            }
        }
        
        #game-info {
            display: none; /* Hide info panel in fullscreen mode */
        }
        
        /* Mobile Game Boy Styling */
        @media (max-width: 768px) {
            body {
                background: #2a2a2a;
            }

            #mobile-controls-area {
                display: flex !important; /* Always show on mobile */
                width: 100%;
                gap: 12px;
                align-items: flex-end; /* push controls down inside the area */
                justify-content: space-between;
                padding: 12px 14px 20px 14px;
                box-sizing: border-box;
                min-height: 28vh; /* reserve space under the screen for controls */
            }

            /* Columns inside mobile controls area */
            #mobile-controls-area .left-column,
            #mobile-controls-area .right-column {
                flex: 1 1 0;
                display: flex;
                align-items: flex-end; /* align controls to bottom */
                justify-content: center;
                padding-bottom: 8px;
            }

            #mobile-controls-area .center-column {
                flex: 0 0 auto;
                display: flex;
                align-items: center;
                justify-content: center;
                padding-bottom: 0;
                max-width: 75px; /* Smaller center column */
            }

            #mobile-controls-area #game-controls {
                display: flex !important;
                align-items: center;
                flex-direction: column;
                gap: 4px;
                /* Ensure the injected controls flow inside the mobile area (not absolutely positioned) */
                position: static !important;
                top: auto !important;
                left: auto !important;
                transform: none !important;
            }

            #game-controls button:active {
                transform: translateY(1px);
                box-shadow: 0 1px 2px rgba(0,0,0,0.3);
            }

            /* Game Boy Screen Effect */
            #phaser-game::after {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: 
                    repeating-linear-gradient(
                        0deg,
                        transparent,
                        transparent 2px,
                        rgba(0,0,0,0.03) 2px,
                        rgba(0,0,0,0.03) 4px
                    );
                pointer-events: none;
                border-radius: 8px;
            }
        }
    </style>
</head>
<body>
        <div id="game-container">

            <div id="game-ui">
                <!-- Score moved into in-canvas game UI (GameUI.js).
                     Removed static DOM score element to avoid duplicate score bars. -->
            </div>

            <div id="phaser-game"></div>

            <div id="mobile-controls-area">
                <!-- Game-Boy style columns: left = joystick, center = small control bar, right = action buttons -->
                <div class="left-column" id="mobile-left"></div>
                <div class="center-column" id="mobile-center">
                    <div id="game-controls" style="display: none;">
                        <button id="pause-btn">Pause</button>
                        <button id="restart-btn">Restart</button>
                        <button id="back-btn">Back to Studio</button>
                    </div>
                </div>
                <div class="right-column" id="mobile-right"></div>
            </div>

        </div>

    <div id="game-info">
        <h2 style="font-size: 1.5rem; font-weight: bold; margin-bottom: 1rem;">About Noteleks Heroes Beyond Light</h2>
        <p style="margin-bottom: 1rem;">
            A recreation of my original mobile game, now playable in your browser with advanced Spine 2D animations.
            Control Noteleks as you battle through graveyard enemies with an arsenal of weapons.
        </p>
        <p><strong>Controls:</strong> WASD/Arrows to move, Space/Click to attack, Up/W to jump (press twice for double jump!), P to pause, R to restart</p>
        <p><strong>New Features:</strong> Double jump ability! Modular codebase with separate classes for Player, Enemies, Weapons, and UI management!</p>
    </div>

    <script>
        // Import tracking functions (if needed)
        function trackGameEvent(action, label) {
            if (typeof gtag !== 'undefined') {
                gtag('event', action, {
                    'event_category': 'game_interaction',
                    'event_label': label,
                    'custom_parameter_game': 'noteleks',
                    'custom_parameter_subdomain': window.location.hostname
                });
                console.log('🎮 Game event:', action, label);
            }
        }

        // Handle button clicks (only if buttons exist)
        const backBtn = document.getElementById('back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', function() {
                trackGameEvent('game_exit', 'back_to_studio');
                window.location.href = '{{ '/' }}';
            });
        }

        const pauseBtn = document.getElementById('pause-btn');
        if (pauseBtn) {
            pauseBtn.addEventListener('click', function() {
                if (window.noteleksGame) {
                    const scene = window.noteleksGame.getScene('GameScene');
                    if (scene) {
                        if (scene.gameState === 'playing') {
                            scene.pauseGame();
                            this.textContent = 'Resume';
                            trackGameEvent('game_pause', 'pause');
                        } else if (scene.gameState === 'paused') {
                            scene.resumeGame();
                            this.textContent = 'Pause';
                            trackGameEvent('game_resume', 'resume');
                        }
                    }
                }
            });
        }

        const restartBtn = document.getElementById('restart-btn');
        if (restartBtn) {
            restartBtn.addEventListener('click', function() {
                if (window.noteleksGame) {
                    const scene = window.noteleksGame.getScene('GameScene');
                    if (scene) {
                        scene.restartGame();
                        // Reset pause button text
                        const pauseBtn = document.getElementById('pause-btn');
                        if (pauseBtn) pauseBtn.textContent = 'Pause';
                        trackGameEvent('game_restart', 'restart');
                    }
                }
            });
        }
    </script>
</body>
</html>