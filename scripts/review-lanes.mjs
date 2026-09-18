// Smoke-test for the independent reviewer lanes, so "the lane is unavailable"
// is an observation carrying evidence instead of a memory. A round declared the
// independent lane unavailable after testing only the in-session subagent
// providers, while both canonical reviewer CLIs were installed and merely
// broken; each break took one command to see.
//
// Bound of this tool: it establishes that a lane is REACHABLE from this repo --
// the CLI starts, accepts a piped prompt, and can read a file here -- not that
// it reviewed anything, not its model identity, and not the quality of its
// output. A lane reported `ok` is a lane worth dispatching a review to, and
// nothing more. An `ok` is one observation: the answer contained the field this
// script read out of package.json before the probe started. This tool is itself
// a gate and none of its probes prove anything about a review that has not run.
//
// What each probe does: pipe a trivial prompt over stdin that forces one file
// read in this repo and a one-line answer, then read the answer back. A lane
// that starts but cannot read the tree answers without reading, and is reported
// as blocked rather than healthy.
//
// Why stdin: both CLIs block on stdin when nothing is piped (the runbook warns
// about it) and codex echoes the whole prompt into stdout. So every lane gets
// its prompt on stdin, and every lane has a wall-clock timeout that kills the
// child's whole process tree, because a probe that can hang is worse than no
// probe.
//
// Usage: node scripts/review-lanes.mjs
// env: REVIEW_LANES_TIMEOUT_MS  per-lane wall clock, default 120000. It is the
//      only tuning knob: the lanes and their command lines are fixed here on
//      purpose, because a probe that can be pointed elsewhere measures nothing
//      about the routes a review will actually take.
//      REVIEW_LANES_KEEP_RAW=1 prints the first 2000 characters of each lane's
//      captured output, for debugging a lane whose reason looks wrong.
//
// Output: one line per lane -- `review-lanes: <lane> <status> <ms>ms -- <reason>`
// then a summary line, then raw output when asked. Statuses: `ok` (answered,
// with no decisive error line), `blocked` (the CLI answered with an error, or
// answered without reading the file), `timeout` (killed at the deadline),
// `missing` (the shell could not find the command).
//
// Exit code: 0 when at least one lane is ok, 1 when none is, 2 on a usage error.
//
// Writes nothing: an OS temp dir is handed to each lane as TMP/TEMP, so no
// probe can leave scratch files inside the repository.
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_TIMEOUT_MS = 120000;
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const RAW_CAP = 256 * 1024;

// One distinctive field of package.json, read here at run time rather than
// hardcoded, so the probe cannot be satisfied by a model that guesses a
// plausible value: a lane that cannot read the tree cannot know this string.
// The prompt asks for this field and only this field.
const WANTED_FIELD = 'version';
const WANTED_VALUE = readWantedValue();

function readWantedValue() {
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(resolve(REPO_ROOT, 'package.json'), 'utf8'));
  } catch (error) {
    console.error(`review-lanes: cannot read package.json to build the probe: ${error.message ?? error}`);
    process.exit(2);
  }
  const value = parsed?.[WANTED_FIELD];
  if (typeof value !== 'string' || value === '') {
    console.error(`review-lanes: package.json has no string "${WANTED_FIELD}" to compare an answer against`);
    process.exit(2);
  }
  return value;
}

// The exact strings both CLIs produced when broken on this machine, plus the
// generic error shapes. Ordered so the whole-line codex JSON error is matched
// before the bare `ERROR:` prefix inside it.
const ERROR_LINE = /requires a newer version|Failed to authenticate|OAuth session expired|not supported when using|invalid_request_error|authentication_error|unauthorized|is not recognized as an internal or external command|\b(?:ERROR|Error|error|FATAL|fatal)\b/;
// The shell's own "no such command", which is how a lane absent from PATH
// reaches this script when it runs the lane through a shell.
const MISSING_LINE = /is not recognized as an internal or external command|command not found/;
// Startup noise that is not the verdict: codex logs an unrelated `robinhood`
// MCP OAuth refresh failure on every run, its version banner names the model,
// and PowerShell wraps stderr in a source header.
const NOISE = /robinhood|oauth::refresh_transaction|^\s*At line:|^\s*\+|CategoryInfo|FullyQualifiedErrorId|^\s*\[stderr\]|Reading prompt from stdin|^\s*$|^\s*tokens used|^OpenAI Codex v/;

const LOG_TIMEOUT = Number(process.env['REVIEW_LANES_TIMEOUT_MS'] ?? DEFAULT_TIMEOUT_MS);
if (!Number.isFinite(LOG_TIMEOUT) || LOG_TIMEOUT <= 0) {
  console.error('review-lanes: REVIEW_LANES_TIMEOUT_MS must be a positive number of milliseconds');
  process.exit(2);
}
const KEEP_RAW = process.env['REVIEW_LANES_KEEP_RAW'] === '1';

// The prompt is the same shape for both lanes: one file read, one line back.
// `--permission-mode manual` denies anything that would prompt, so the probe
// stays read-only and cannot sit waiting on an approval dialog.
const PROBE_PROMPT =
  `Read package.json in the current directory and reply with the value of its "${WANTED_FIELD}" field, alone on one line, nothing else.`;

const LANES = [
  {
    name: 'codex',
    command: 'codex',
    args: ['exec', '--sandbox', 'read-only', '-C', REPO_ROOT],
    prompt: PROBE_PROMPT,
  },
  {
    name: 'claude',
    command: 'claude',
    args: ['-p', '--permission-mode', 'manual'],
    prompt: PROBE_PROMPT,
  },
];

// Quote one argument for the shell the lane runs under. Every argument here is
// a fixed flag or a path this file computed, so the quoting only has to survive
// spaces and backslashes -- the repo path is under a user profile.
function quoteArg(argument) {
  if (process.platform !== 'win32') return `'${argument.replace(/'/g, `'\\''`)}'`;
  return /[\s"]/.test(argument) ? `"${argument.replace(/"/g, '""')}"` : argument;
}

// Kill the whole lane process tree, not just the shell that launched it. A
// surviving codex node process would keep working on the probe after the
// verdict, which is not a state a smoke test should leave behind. The kill is
// cleanup: it is released and not awaited, because the verdict does not depend
// on it.
function killTree(child) {
  if (child.pid === undefined) return;
  try {
    if (process.platform === 'win32') {
      spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true }).on(
        'error',
        () => {},
      );
      return;
    }
    child.kill('SIGKILL');
    process.kill(-child.pid, 'SIGKILL');
  } catch {
    // already gone
  }
}

function runLane(lane, timeoutMs) {
  return new Promise((settle) => {
    let child;
    try {
      // A reviewer CLI installed by a package manager is often only on PATH as
      // a .cmd shim -- codex here. Node's spawn does not consult PATHEXT when
      // it resolves a command itself, so resolving it naively reports a
      // perfectly usable CLI as `missing`. cmd does resolve it, and running the
      // lane through cmd is exactly how it is run by hand. The command line is
      // assembled here rather than handed to a shell as an argument list, so no
      // argument is reinterpreted: they are fixed strings and a repo path.
      const commandLine = [lane.command, ...lane.args.map(quoteArg)].join(' ');
      child = spawn(commandLine, {
        cwd: REPO_ROOT,
        shell: true,
        // Its own process group, so the POSIX timeout path can kill whatever the
        // shell started without signalling this script's own group.
        detached: process.platform !== 'win32',
        stdio: ['pipe', 'pipe', 'pipe'],
        windowsHide: true,
        env: { ...process.env, TMP: tmpdir(), TEMP: tmpdir(), TMPDIR: tmpdir() },
      });
    } catch (error) {
      settle({ status: 'missing', ms: 0, output: '', reason: String(error.message ?? error) });
      return;
    }

    const started = Date.now();
    const chunks = [];
    let size = 0;
    let settled = false;
    // Declared before the settle helpers, which clear it: spawn can report an
    // error before the deadline below is armed.
    let timer = null;

    const keep = (data) => {
      if (size >= RAW_CAP) return;
      const text = String(data);
      size += text.length;
      chunks.push(text);
    };
    child.stdout?.on('data', keep);
    child.stderr?.on('data', keep);

    const finish = (status) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      const ms = Date.now() - started;
      const output = chunks.join('');
      settle({ status, ms, output, reason: reasonFor(status, output) });
    };

    // A lane the shell cannot find is `missing`, not `blocked`: the distinction
    // is what tells "this machine has no codex" apart from "codex is here and
    // says no", and only the second is worth chasing.
    const finishBlocked = () => {
      const output = chunks.join('');
      finish(MISSING_LINE.test(output) ? 'missing' : 'blocked');
    };

    timer = setTimeout(() => {
      killTree(child);
      // The verdict is decided here, not when the pipes finally close. A lane
      // started through a shell is a process tree -- the shell's child survives
      // the direct kill and holds the pipe open -- and waiting for that would
      // report a timeout later than the deadline, or not at all. So the deadline
      // is the measurement and the kill is cleanup.
      finish('timeout');
    }, timeoutMs);

    child.on('error', (error) => {
      if (error.code === 'ENOENT') {
        settled = true;
        clearTimeout(timer);
        settle({ status: 'missing', ms: Date.now() - started, output: '', reason: `no '${lane.command}' on PATH` });
        return;
      }
      settled = true;
      clearTimeout(timer);
      settle({ status: 'blocked', ms: Date.now() - started, output: '', reason: String(error.message ?? error) });
    });
    child.on('close', () => {
      const output = chunks.join('');
      if (firstErrorLine(output) !== null || MISSING_LINE.test(output)) {
        finishBlocked();
        return;
      }
      finish(answered(output) ? 'ok' : 'blocked');
    });

    // Both CLIs treat an empty stdin as something to wait on; end it, and
    // swallow the EPIPE when the child has already exited.
    child.stdin?.on('error', () => {});
    child.stdin?.end(lane.prompt + '\n');
  });
}

// A lane answered when it printed the value it was asked for and no decisive
// error line reached the output. Both halves matter. Codex echoes the whole
// prompt into stdout, and the prompt names the field but not its value, so a
// lane that only echoed the prompt is not an answer -- hence the answer is
// searched for the value with the echoed prompt cut out. A lane that prints the
// value while also reporting an auth failure has not reached the model either.
function answered(output) {
  const withoutEcho = output.split(PROBE_PROMPT).join('');
  return withoutEcho.includes(WANTED_VALUE) && firstErrorLine(output) === null;
}

// The first line that reads like a verdict, cleaned of the timestamp, ANSI
// escapes and PowerShell header noise both CLIs emit, and unwrapped from a
// codex JSON error envelope so the reason is the sentence a human would quote.
function firstErrorLine(output) {
  for (const rawLine of output.split(/\r?\n/)) {
    const line = rawLine
      .replace(/\u001b\[[0-9;]*m/g, '')
      .replace(/^\d{4}-\d{2}-\d{2}T[\d:.]+Z\s*/, '')
      .trim();
    if (line === '' || NOISE.test(line) || !ERROR_LINE.test(line)) continue;
    const envelope = /\{"type":"error".*?\}$/.exec(line);
    if (envelope) {
      try {
        const parsed = JSON.parse(envelope[0]);
        const message = parsed?.error?.message;
        if (typeof message === 'string' && message !== '') return message;
      } catch {
        // keep the cleaned line as the reason
      }
    }
    return line;
  }
  return null;
}

function reasonFor(status, output) {
  if (status === 'ok') return 'answered a one-line file read';
  if (status === 'timeout') return 'no answer within the per-lane timeout (child killed)';
  if (status === 'missing') return MISSING_LINE.test(output) ? 'not on PATH' : 'no such command';
  const error = firstErrorLine(output);
  if (error !== null) return error;
  return output.trim() === '' ? 'no output' : `answered without reading package.json ("${WANTED_FIELD}" absent)`;
}

const label = (lane) => lane.name.padEnd(6);

console.log(
  `review-lanes: probing ${LANES.map((lane) => lane.name).join(' and ')} from ${REPO_ROOT} (timeout ${LOG_TIMEOUT}ms per lane)`,
);

const results = [];
for (const lane of LANES) {
  const result = await runLane(lane, LOG_TIMEOUT);
  results.push({ lane, ...result });
  console.log(
    `review-lanes: ${label(lane)} ${result.status.padEnd(7)} ${String(result.ms).padStart(6)}ms -- ${result.reason}`,
  );
  if (KEEP_RAW) {
    console.log(`review-lanes: ${label(lane)} raw output begins`);
    console.log(result.output.slice(0, 2000));
    console.log(`review-lanes: ${label(lane)} raw output ends`);
  }
}

const usable = results.filter((result) => result.status === 'ok').map((result) => result.lane.name);
const verdict = results.map((result) => `${result.lane.name}=${result.status}`).join(' ');
if (usable.length > 0) {
  console.log(`review-lanes: ${verdict} -- usable: ${usable.join(', ')}`);
  console.log(
    `review-lanes: reachable means the CLI started and read a file here; it reviewed nothing yet`,
  );
} else {
  console.log(`review-lanes: ${verdict} -- no independent lane available`);
}
process.exit(usable.length > 0 ? 0 : 1);
