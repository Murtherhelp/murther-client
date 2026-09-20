// abi.h — JS <-> WASM boundary for Murther Auto Reverse core.
// C++17. Plain C ABI, no exceptions cross the boundary.
#pragma once
#include <cstdint>

// Event types passed from JS to WASM (reserved for future frame-direct path).
enum class EventType : uint8_t {
    WS_FRAME_IN = 1,
    MOUSE_MOVE = 2,
    HOTKEY_PRESS = 3,
    TICK = 4
};

// Auto Reverse initiator keys (what the user pressed).
// SELF-CORRECTION: AR_1X has no MULTI-SPLIT counterpart in the panels;
// Fisen report defines its return as a plain single split (see SplitKey::SPLIT).
// There is no AR_32X bind; Penta (32x) is dispatch-only, never an initiator.
// Solotrick AR_64X returns Hexa like the plain AR_64X (variant flag kept for logs).
enum class ARKey : uint8_t {
    AR_1X = 1,
    AR_4X = 2,
    AR_8X = 3,
    AR_16X = 4,
    AR_64X = 5,
    AR_SOLO_64X = 6
};

// Multi-split return keys (what gets dispatched on confirmation).
enum class SplitKey : uint8_t {
    NONE = 0,
    SPLIT = 1,   // plain single split (AR_1X return)
    DOUBLE = 4,  // 4x
    TRIPLE = 8,  // 8x
    QUAD = 16,   // 16x
    PENTA = 32,  // 32x (dispatch-only, no AR initiator)
    HEXA = 64    // 64x (AR_64X + Solotrick return)
};

// Cell state extracted from 0x02 world-state packets.
// SELF-CORRECTION: enemy pieces share an owner/player id, NOT one cell id.
// owner_id groups pieces of the same player; id is the individual piece.
struct Cell {
    uint32_t id;        // individual piece id
    uint32_t owner_id;  // player/entity id (groups multi-piece players)
    float x;
    float y;
    float radius;       // mass proxy; biggest = largest radius
    uint8_t is_me;      // 1 if own cell, 0 otherwise
};

// Action dispatched from WASM to JS.
// type: 1 = MouseMove (aim at target_x/target_y), 2 = Split burst, 3 = Eject.
struct DispatchAction {
    uint8_t type;
    float target_x;
    float target_y;
    uint8_t count;      // split presses to emit (1/4/8/16/32/64)
};
