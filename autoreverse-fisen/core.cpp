// core.cpp — Auto Reverse state machine (armed -> watching -> confirmed -> reset).
// C++17. Deterministic, no UB, no exceptions cross the C boundary.
// Depends only on abi.h. UI-independent: pure step() + event queue.
#include "abi.h"
#include <vector>
#include <cstddef>

// Maps initiator key (1-6) to required piece count + return split.
static bool ar_mapping(uint8_t ar_key, uint8_t& out_required, uint8_t& out_count) {
    switch (static_cast<ARKey>(ar_key)) {
        case ARKey::AR_1X:      out_required = 1;  out_count = 1;  return true; // plain split
        case ARKey::AR_4X:      out_required = 4;  out_count = 4;  return true; // Double
        case ARKey::AR_8X:      out_required = 8;  out_count = 8;  return true; // Triple
        case ARKey::AR_16X:     out_required = 16; out_count = 16; return true; // Quad
        case ARKey::AR_64X:     out_required = 64; out_count = 64; return true; // Hexa
        case ARKey::AR_SOLO_64X:out_required = 64; out_count = 64; return true; // Hexa (solo variant)
        default: return false;
    }
}

class AutoReverseEngine {
public:
    AutoReverseEngine()
        : armed_(false), target_owner_(0), required_(0),
          baseline_(0), seen_max_(0), return_count_(0), has_action_(false) {
        pending_ = DispatchAction{0, 0.0f, 0.0f, 0};
    }

    // Arm against hovered enemy owner id + pressed AR key (1-6).
    // Returns false if the key is unknown.
    bool arm_target(uint32_t owner_id, uint8_t ar_key) {
        uint8_t required = 0, count = 0;
        if (!ar_mapping(ar_key, required, count)) return false;
        target_owner_ = owner_id;
        required_ = required;
        return_count_ = count;
        baseline_ = 0;      // learned on first world update after arming
        seen_max_ = 0;
        armed_ = true;
        has_action_ = false;
        return true;
    }

    void disarm() {
        armed_ = false;
        has_action_ = false;
        pending_ = DispatchAction{0, 0.0f, 0.0f, 0};
    }

    bool is_armed() const { return armed_; }

    // Step on every decoded 0x02 world-state cell list.
    // Ignores 2-piece single splits unless AR_1X is armed (required_ == 1).
    void update_world(const Cell* cells, std::size_t count) {
        if (!armed_) return;
        std::size_t n = 0;
        float best_r = -1.0f;
        float bx = 0.0f, by = 0.0f;
        for (std::size_t i = 0; i < count; ++i) {
            const Cell& c = cells[i];
            if (c.is_me) continue;
            if (c.owner_id != target_owner_) continue;
            ++n;
            if (c.radius > best_r) {
                best_r = c.radius;
                bx = c.x;
                by = c.y;
            }
        }
        if (n == 0) return; // stale target (left view/died): stay armed, no false fire
        if (baseline_ == 0) {
            baseline_ = static_cast<uint8_t>(n > 255 ? 255 : n);
            seen_max_ = baseline_;
            // AR_1X armed on a solo cell confirms immediately on next tick.
            if (required_ <= baseline_) {
                fire(bx, by);
            }
            return;
        }
        if (n > seen_max_) {
            seen_max_ = static_cast<uint8_t>(n > 255 ? 255 : n);
            if (seen_max_ >= required_) {
                // Single-split guard: a lone 1->2 transition only fires AR_1X.
                if (required_ > 1 && seen_max_ < 4) return;
                fire(bx, by);
            }
        }
    }

    bool poll_action(DispatchAction& out) {
        if (!has_action_) return false;
        out = pending_;
        has_action_ = false;
        pending_ = DispatchAction{0, 0.0f, 0.0f, 0};
        return true;
    }

private:
    void fire(float tx, float ty) {
        pending_.type = 2;
        pending_.target_x = tx;
        pending_.target_y = ty;
        pending_.count = return_count_;
        has_action_ = true;
        armed_ = false; // reset after firing (panel reset contract)
    }

    bool armed_;
    uint32_t target_owner_;
    uint8_t required_;      // piece count that confirms (1/4/8/16/64)
    uint8_t baseline_;      // piece count at arm time
    uint8_t seen_max_;      // high-water mark while watching
    uint8_t return_count_;  // split presses to dispatch
    bool has_action_;
    DispatchAction pending_;
};

// ---- C API (WASM boundary: single instance, no alloc across calls) ----
extern "C" {

static AutoReverseEngine g_engine;

void init_engine() {
    g_engine.disarm();
}

// ar_key: 1..6 (ARKey). owner_id: enemy entity id from hover acquisition.
int arm(uint32_t owner_id, uint8_t ar_key) {
    return g_engine.arm_target(owner_id, ar_key) ? 1 : 0;
}

void disarm() {
    g_engine.disarm();
}

int is_armed() {
    return g_engine.is_armed() ? 1 : 0;
}

// cells: pointer to Cell array decoded in JS from 0x02 frames. count: length.
void push_cells(const Cell* cells, int count) {
    if (!cells || count <= 0) return;
    g_engine.update_world(cells, static_cast<std::size_t>(count));
}

// Returns 1 + fills out_* when a dispatch is pending, else 0.
// JS moves aim to (out_x, out_y) then emits out_count split presses.
int pop_action(float* out_x, float* out_y, uint8_t* out_count) {
    DispatchAction a{0, 0.0f, 0.0f, 0};
    if (!g_engine.poll_action(a)) return 0;
    if (out_x) *out_x = a.target_x;
    if (out_y) *out_y = a.target_y;
    if (out_count) *out_count = a.count;
    return 1;
}

} // extern "C"
