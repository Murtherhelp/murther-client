// test_core.cpp — deterministic unit tests for the Auto Reverse core.
// Build (native, no Emscripten):  g++ -std=c++17 -Wall -Wextra -I. core.cpp test_core.cpp -o test_core
// Run: ./test_core   (exit 0 = all pass)
#include "abi.h"
#include <cstdio>
#include <vector>

// Pull the engine TU in (single-instance g_engine lives in core.cpp).
// Declarations of the C API:
extern "C" {
void init_engine();
int arm(uint32_t owner_id, uint8_t ar_key);
void disarm();
int is_armed();
void push_cells(const Cell* cells, int count);
int pop_action(float* out_x, float* out_y, uint8_t* out_count);
}

static int failures = 0;
#define CHECK(cond, name) do { \
    if (cond) { printf("PASS %s\n", name); } \
    else { printf("FAIL %s (line %d)\n", name, __LINE__); ++failures; } \
} while (0)

static Cell mk(uint32_t id, uint32_t owner, float r, float x = 0.0f, float y = 0.0f, uint8_t me = 0) {
    Cell c; c.id = id; c.owner_id = owner; c.x = x; c.y = y; c.radius = r; c.is_me = me;
    return c;
}

int main() {
    float ox = 0, oy = 0; uint8_t oc = 0;

    // 1. AR_4X (key 2): ignores single split (1->2), fires on 1->4.
    init_engine();
    CHECK(arm(7, 2) == 1, "arm_4x_ok");
    CHECK(is_armed() == 1, "armed_after_arm");
    { std::vector<Cell> w = { mk(1, 7, 30.0f, 10.0f, 20.0f) }; push_cells(w.data(), (int)w.size()); }
    CHECK(pop_action(&ox, &oy, &oc) == 0, "4x_no_fire_on_baseline");
    { std::vector<Cell> w = { mk(1, 7, 20.0f), mk(2, 7, 18.0f) }; push_cells(w.data(), (int)w.size()); }
    CHECK(pop_action(&ox, &oy, &oc) == 0, "4x_ignores_single_split");
    CHECK(is_armed() == 1, "4x_stays_armed_after_single");
    { std::vector<Cell> w = { mk(1, 7, 12.0f), mk(2, 7, 11.0f), mk(3, 7, 10.0f), mk(4, 7, 9.0f, 99.0f, 50.0f) };
      push_cells(w.data(), (int)w.size()); }
    CHECK(pop_action(&ox, &oy, &oc) == 1, "4x_fires_on_double_split");
    CHECK(oc == 4, "4x_return_count_4");
    CHECK(is_armed() == 0, "4x_disarmed_after_fire");
    CHECK(pop_action(&ox, &oy, &oc) == 0, "4x_queue_drained");

    // 2. AR_1X (key 1): confirms on solo baseline.
    init_engine();
    CHECK(arm(9, 1) == 1, "arm_1x_ok");
    { std::vector<Cell> w = { mk(5, 9, 25.0f, 1.0f, 2.0f) }; push_cells(w.data(), (int)w.size()); }
    CHECK(pop_action(&ox, &oy, &oc) == 1, "1x_fires_on_solo");
    CHECK(oc == 1, "1x_return_count_1");

    // 3. AR_8X/16X/64X mapping to return counts.
    init_engine(); CHECK(arm(11, 3) == 1, "arm_8x_ok");
    { std::vector<Cell> w = { mk(1, 11, 30.0f) }; push_cells(w.data(), (int)w.size()); }
    { std::vector<Cell> w = { mk(1,11,10), mk(2,11,9), mk(3,11,9), mk(4,11,8), mk(5,11,8), mk(6,11,7), mk(7,11,7), mk(8,11,6) };
      push_cells(w.data(), (int)w.size()); }
    CHECK(pop_action(&ox, &oy, &oc) == 1 && oc == 8, "8x_return_count_8");
    init_engine(); CHECK(arm(12, 4) == 1, "arm_16x_ok");
    { std::vector<Cell> w = { mk(1, 12, 30.0f) }; push_cells(w.data(), (int)w.size()); }
    { std::vector<Cell> w(16, mk(0, 0, 5.0f)); for (int i = 0; i < 16; ++i) w[i] = mk(100+i, 12, 5.0f);
      push_cells(w.data(), (int)w.size()); }
    CHECK(pop_action(&ox, &oy, &oc) == 1 && oc == 16, "16x_return_count_16");

    // 4. Solotrick AR_64X (key 6) returns Hexa count 64.
    init_engine(); CHECK(arm(13, 6) == 1, "arm_solo_ok");
    { std::vector<Cell> w = { mk(1, 13, 40.0f) }; push_cells(w.data(), (int)w.size()); }
    { std::vector<Cell> w(64, mk(0,0,3.0f)); for (int i = 0; i < 64; ++i) w[i] = mk(200+i, 13, 3.0f);
      push_cells(w.data(), (int)w.size()); }
    CHECK(pop_action(&ox, &oy, &oc) == 1 && oc == 64, "solo_returns_64");

    // 5. Biggest-cell aim: fires toward largest radius piece.
    init_engine(); CHECK(arm(21, 2) == 1, "arm_aim_ok");
    { std::vector<Cell> w = { mk(1, 21, 30.0f, 0.0f, 0.0f) }; push_cells(w.data(), (int)w.size()); }
    { std::vector<Cell> w = { mk(1,21,8.0f,0,0), mk(2,21,8.0f,0,0), mk(3,21,20.0f,77.0f,88.0f), mk(4,21,7.0f,0,0) };
      push_cells(w.data(), (int)w.size()); }
    CHECK(pop_action(&ox, &oy, &oc) == 1 && ox == 77.0f && oy == 88.0f, "aim_biggest_cell");

    // 6. Stale target (owner vanishes) never fires, stays armed.
    init_engine(); CHECK(arm(31, 2) == 1, "arm_stale_ok");
    { std::vector<Cell> w = { mk(1, 31, 30.0f) }; push_cells(w.data(), (int)w.size()); }
    { std::vector<Cell> w = { mk(9, 99, 30.0f) }; push_cells(w.data(), (int)w.size()); }
    CHECK(pop_action(&ox, &oy, &oc) == 0 && is_armed() == 1, "stale_no_fire_stays_armed");

    // 7. Own cells never counted toward the enemy.
    init_engine(); CHECK(arm(41, 2) == 1, "arm_own_ok");
    { std::vector<Cell> w = { mk(1, 41, 30.0f, 0, 0, 1) }; push_cells(w.data(), (int)w.size()); }
    CHECK(pop_action(&ox, &oy, &oc) == 0, "own_cells_ignored");

    // 8. Bad key rejected.
    init_engine(); CHECK(arm(50, 9) == 0 && is_armed() == 0, "bad_key_rejected");

    // 9. C10 expiry-unwind parity (marker: expiry-unwind). The glue's
    // `window expired, disarmed` branch must run the identical release the
    // confirm path runs: engine disarmed = the send hook's wasmArmed reads
    // false = the hook is released. Forced expiry here is disarm(); assert
    // the hook condition cleared, the queue drained, and a clean re-arm.
    init_engine(); CHECK(arm(7, 5) == 1, "expiry_arm_64x_ok");
    { std::vector<Cell> w = { mk(1, 7, 30.0f) }; push_cells(w.data(), (int)w.size()); }
    disarm(); // forced expiry unwind
    CHECK(is_armed() == 0, "expiry_unwind_hook_released");
    CHECK(pop_action(&ox, &oy, &oc) == 0, "expiry_unwind_queue_drained");
    CHECK(arm(7, 5) == 1, "expiry_unwind_rearm_ok");
    CHECK(is_armed() == 1, "expiry_unwind_rearm_armed");

    if (failures == 0) { printf("ALL TESTS PASS\n"); return 0; }
    printf("%d FAILURES\n", failures);
    return 1;
}
