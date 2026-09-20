#!/usr/bin/env bash
# build_core.sh — native tests + Emscripten single-file WASM build for the Auto Reverse core.
# Usage:
#   ./build_core.sh test    # native unit tests only (needs g++)
#   ./build_core.sh wasm    # Emscripten single-file build only (needs emcc)
#   ./build_core.sh all     # both (default)
set -euo pipefail
cd "$(dirname "$0")"

MODE="${1:-all}"

if [ "$MODE" = "test" ] || [ "$MODE" = "all" ]; then
  echo "[BUILD] native unit tests: g++ -std=c++17 core.cpp test_core.cpp"
  g++ -std=c++17 -Wall -Wextra -I. core.cpp test_core.cpp -o test_core
  ./test_core
fi

if [ "$MODE" = "wasm" ] || [ "$MODE" = "all" ]; then
  echo "[BUILD] emcc -O3 single-file, no pthreads, no exceptions crossing boundary"
  # NOTE: no -s PTHREADS flag: emcc >= 3.1.59 rejects it as internal (off by default).
  emcc core.cpp -O3 \
    -std=c++17 \
    -s WASM=1 \
    -s SINGLE_FILE=1 \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s NO_EXIT_RUNTIME=1 \
    -s ENVIRONMENT=web \
    -s MODULARIZE=1 \
    -s EXPORT_NAME=AutoReverseCore \
    -s DISABLE_EXCEPTION_CATCHING=1 \
    -s SUPPORT_LONGJMP=0 \
    -s EXPORTED_FUNCTIONS="['_init_engine','_arm','_disarm','_is_armed','_push_cells','_pop_action','_malloc','_free']" \
    -s EXPORTED_RUNTIME_METHODS="['cwrap']" \
    -o fisen_core.js
  echo "[BUILD] artifacts: fisen_core.js (single-file, base64 wasm embedded)"
  ls -la fisen_core.js
fi
