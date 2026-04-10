/* Small debug utilities for Noteleks
 * Provides centralized checks for debug flags and runtime overrides.
 */
import GameConfig from '../config/GameConfig.js';

const DebugUtils = {
    // Returns true when any developer override (window.noteleksDebug) is enabled
    // or when the specific `enablePlayerDebugOverlay` flag is set in GameConfig.
    // This is intentionally conservative: runtime override always wins.
    isPlayerDebugEnabled() {
        try {
            if (typeof window !== 'undefined' && window.noteleksDebug === true) return true;
        } catch {
            /* ignore */
        }

        return !!(GameConfig && GameConfig.debug && GameConfig.debug.enablePlayerDebugOverlay);
    },

    // Should we perform small DOM syncs (opt-in via GameConfig.debug.syncDOM)
    shouldSyncDOM() {
        return !!(GameConfig && GameConfig.debug && GameConfig.debug.syncDOM === true);
    },

    // Should the provided console message be suppressed based on configured prefixes?
    isLogSuppressed(message) {
        if (!message || !GameConfig || !GameConfig.debug || !Array.isArray(GameConfig.debug.suppressLogPrefixes)) return false;
        try {
            const msg = String(message);
            return GameConfig.debug.suppressLogPrefixes.some((prefix) => msg.indexOf(prefix) !== -1);
        } catch {
            return false;
        }
    },
};

export default DebugUtils;
