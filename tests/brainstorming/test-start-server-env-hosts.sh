#!/usr/bin/env bash
# Host-default tests for skills/brainstorming/scripts/start-server.sh.
#
# Upstream sync (obra/superpowers PR #2262): BRAINSTORM_HOST and
# BRAINSTORM_URL_HOST supply the defaults when no --host / --url-host flag is
# passed, so containers and tunnels stop having to repeat the flags.
#
# Run: bash tests/brainstorming/test-start-server-env-hosts.sh
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
START="$ROOT/skills/brainstorming/scripts/start-server.sh"
STOP="$ROOT/skills/brainstorming/scripts/stop-server.sh"

PASS=0
FAIL=0
pass() { PASS=$((PASS + 1)); printf '  [PASS] %s\n' "$1"; }
fail() { FAIL=$((FAIL + 1)); printf '  [FAIL] %s\n' "$1"; }

TMP="$(mktemp -d)"

cleanup() {
  local session
  for session in "$TMP"/*/.superpowers/brainstorm/*; do
    if [ -d "$session" ]; then
      "$STOP" "$session" >/dev/null 2>&1 || true
    fi
  done
  rm -rf "$TMP"
}
trap cleanup EXIT

# json_field <server-started line> <key> - read one field out of the JSON line.
json_field() {
  printf '%s' "$1" | node -e '
    let raw = "";
    process.stdin.on("data", (chunk) => { raw += chunk; });
    process.stdin.on("end", () => {
      const key = process.argv[1];
      try {
        const value = JSON.parse(raw)[key];
        process.stdout.write(value === undefined ? "" : String(value));
      } catch (err) {
        process.stdout.write("");
      }
    });
  ' "$2"
}

assert_eq() { # <label> <actual> <expected>
  if [ "$2" = "$3" ]; then
    pass "$1"
  else
    fail "$1 (got '$2', want '$3')"
  fi
}

start_case() { # <project dir> [VAR=value ...] - print the server-started line
  local project="$1"
  shift
  mkdir -p "$project"
  env "$@" "$START" --project-dir "$project" 2>/dev/null | head -1
}

# 1. No env, no flags: the loopback defaults still win.
info_default="$(start_case "$TMP/default")"
assert_eq "default bind host is 127.0.0.1" "$(json_field "$info_default" host)" "127.0.0.1"
assert_eq "default url host is localhost" "$(json_field "$info_default" url_host)" "localhost"

# 2. Env supplies the bind host when the flag is absent.
info_env_host="$(start_case "$TMP/env-host" BRAINSTORM_HOST=localhost)"
assert_eq "BRAINSTORM_HOST supplies the bind host" "$(json_field "$info_env_host" host)" "localhost"

# 3. Env supplies the url host when the flag is absent.
info_env_url="$(start_case "$TMP/env-url" BRAINSTORM_URL_HOST=127.0.0.2)"
assert_eq "BRAINSTORM_URL_HOST supplies the url host" "$(json_field "$info_env_url" url_host)" "127.0.0.2"
url_env="$(json_field "$info_env_url" url)"
case "$url_env" in
  "http://127.0.0.2:"*) pass "env url host reaches the published url" ;;
  *) fail "env url host reaches the published url (got '$url_env')" ;;
esac

# 4. An explicit flag still beats the environment.
mkdir -p "$TMP/flag-override"
info_flag_override="$(env BRAINSTORM_HOST=localhost BRAINSTORM_URL_HOST=127.0.0.2 \
  "$START" --project-dir "$TMP/flag-override" --host 127.0.0.1 --url-host 127.0.0.3 2>/dev/null | head -1)"
assert_eq "--host beats BRAINSTORM_HOST" "$(json_field "$info_flag_override" host)" "127.0.0.1"
assert_eq "--url-host beats BRAINSTORM_URL_HOST" "$(json_field "$info_flag_override" url_host)" "127.0.0.3"

# 5. An empty env value means "unset": the loopback defaults still win.
info_empty="$(start_case "$TMP/env-empty" BRAINSTORM_HOST= BRAINSTORM_URL_HOST=)"
assert_eq "empty BRAINSTORM_HOST falls back to 127.0.0.1" "$(json_field "$info_empty" host)" "127.0.0.1"
assert_eq "empty BRAINSTORM_URL_HOST falls back to localhost" "$(json_field "$info_empty" url_host)" "localhost"

# 6. A non-loopback bind is refused by the server's own guard.
mkdir -p "$TMP/non-loopback"
env BRAINSTORM_HOST=0.0.0.0 "$START" --project-dir "$TMP/non-loopback" >/dev/null 2>&1
non_loopback_status=$?
if [ "$non_loopback_status" -ne 0 ]; then
  pass "non-loopback BRAINSTORM_HOST is refused (exit $non_loopback_status)"
else
  fail "non-loopback BRAINSTORM_HOST was accepted"
fi
if grep -rqs "Refusing insecure" "$TMP/non-loopback" 2>/dev/null; then
  pass "the refusal is explicit in the server log"
else
  fail "the refusal message is missing from the server log"
fi

echo
echo "start-server host defaults: $PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ]
