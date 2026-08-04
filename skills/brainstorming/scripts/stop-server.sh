#!/usr/bin/env bash
# Stop the brainstorm server and clean up
# Usage: stop-server.sh <session_dir>
#
# Kills the server process. Only deletes session directory if it's
# under /tmp (ephemeral). Persistent directories (.superpowers/) are
# kept so mockups can be reviewed later.

SESSION_DIR="$1"

if [[ -z "$SESSION_DIR" ]]; then
  echo '{"error": "Usage: stop-server.sh <session_dir>"}'
  exit 1
fi

STATE_DIR="${SESSION_DIR}/state"
PID_FILE="${STATE_DIR}/server.pid"
SERVER_ID_FILE="${STATE_DIR}/server-instance-id"

mark_stopped() {
  local reason="$1"
  rm -f "${STATE_DIR}/server-info"
  printf '{"reason":"%s","timestamp":%s}\n' "$reason" "$(date +%s)" > "${STATE_DIR}/server-stopped"
}

read_expected_server_id() {
  [[ -f "$SERVER_ID_FILE" ]] || return 1
  local id
  id="$(tr -d '\r\n' < "$SERVER_ID_FILE" 2>/dev/null || true)"
  [[ "$id" =~ ^[A-Za-z0-9_-]{32,64}$ ]] || return 1
  printf '%s\n' "$id"
}

command_line_for_pid() {
  local pid="$1"
  if [[ -r "/proc/$pid/cmdline" ]]; then
    tr '\0' '\n' < "/proc/$pid/cmdline" 2>/dev/null || true
    return 0
  fi
  ps -ww -p "$pid" -o command= 2>/dev/null || ps -f -p "$pid" 2>/dev/null | sed '1d' || true
}

command_has_server_id() {
  local pid="$1"
  local expected="$2"
  local expected_arg="--brainstorm-server-id=$expected"
  if [[ -r "/proc/$pid/cmdline" ]]; then
    local arg
    while IFS= read -r -d '' arg || [[ -n "$arg" ]]; do
      [[ "$arg" == "$expected_arg" ]] && return 0
    done < "/proc/$pid/cmdline"
    return 1
  fi
  local command_line
  command_line="$(command_line_for_pid "$pid")"
  [[ -n "$command_line" ]] || return 1
  case " $command_line " in
    *" $expected_arg "*) return 0 ;;
    *) return 1 ;;
  esac
}

# Confirm a PID has this session's per-start instance id, not just a familiar
# process name. Ambiguous or legacy metadata fails closed as stale_pid.
is_brainstorm_server() {
  kill -0 "$1" 2>/dev/null || return 1
  local expected_id
  expected_id="$(read_expected_server_id)" || return 1
  command_has_server_id "$1" "$expected_id" || return 1
  return 0
}

process_start_token() {
  local pid="$1"
  if [[ -r "/proc/$pid/stat" ]]; then
    local stat_line
    stat_line="$(cat "/proc/$pid/stat" 2>/dev/null || true)"
    [[ -n "$stat_line" ]] || return 1
    printf '%s\n' "${stat_line##*) }" | awk '{print $20}'
    return 0
  fi
  ps -ww -p "$pid" -o lstart= 2>/dev/null | sed 's/^ *//' || true
}

if [[ -f "$PID_FILE" ]]; then
  pid=$(cat "$PID_FILE")

  # Refuse to signal a PID we can't prove is our server. A stale pid file may
  # point at an unrelated process after a reboot/PID wraparound.
  start_token=""
  if is_brainstorm_server "$pid"; then
    start_token="$(process_start_token "$pid")"
  fi
  if [[ -z "$start_token" ]] || ! is_brainstorm_server "$pid" ||
     [[ "$(process_start_token "$pid")" != "$start_token" ]]; then
    rm -f "$PID_FILE" "$SERVER_ID_FILE"
    mark_stopped "stale_pid"
    echo '{"status": "stale_pid"}'
    exit 0
  fi

  # Re-check identity immediately before signalling to narrow the PID-reuse
  # window as much as shell-level process management permits.
  if ! is_brainstorm_server "$pid" || [[ "$(process_start_token "$pid")" != "$start_token" ]]; then
    rm -f "$PID_FILE" "$SERVER_ID_FILE"
    mark_stopped "stale_pid"
    echo '{"status": "stale_pid"}'
    exit 0
  fi

  # Try to stop gracefully, fallback to force if still alive
  kill "$pid" 2>/dev/null || true

  # Wait for graceful shutdown (up to ~2s)
  for _ in {1..20}; do
    if ! kill -0 "$pid" 2>/dev/null; then
      break
    fi
    sleep 0.1
  done

  # If still running, escalate to SIGKILL
  if kill -0 "$pid" 2>/dev/null; then
    kill -9 "$pid" 2>/dev/null || true

    # Give SIGKILL a moment to take effect
    sleep 0.1
  fi

  if kill -0 "$pid" 2>/dev/null; then
    echo '{"status": "failed", "error": "process still running"}'
    exit 1
  fi

  rm -f "$PID_FILE" "$SERVER_ID_FILE" "${STATE_DIR}/server.log"
  mark_stopped "stop-server.sh"

  # Only delete ephemeral /tmp directories. Resolve both paths canonically
  # (cd + pwd -P, like stop-server.ps1) so a session dir such as
  # "/tmp/../home/user/project" can't trick the prefix check into deleting
  # a directory outside the temp root. (Plain variables: this code runs at
  # top level, where `local` is a syntax error on bash 3.2 / macOS.)
  tmp_root="$(cd /tmp 2>/dev/null && pwd -P || true)"
  resolved="$(cd "$SESSION_DIR" 2>/dev/null && pwd -P || true)"
  if [[ -n "$tmp_root" && -n "$resolved" && "$resolved" == "$tmp_root/"* ]]; then
    rm -rf "$resolved"
  fi

  echo '{"status": "stopped"}'
else
  echo '{"status": "not_running"}'
fi
