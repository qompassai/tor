// Hermetic tests for the tor-bundle WebExtension and the repo's
// Tor configuration files. The bundle scripts are plain browser
// scripts (no modules), so they are loaded into a vm context with
// a stubbed `chrome` API — the tests exercise the real shipped
// code, not a copy of it.
//
// Run: node --test tests/
// No dependencies beyond Node itself (>= 20).

import assert from 'node:assert/strict';
import {existsSync, readFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {test} from 'node:test';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BUNDLE = join(ROOT, 'tor-bundle');

function loadBundle() {
  const sent = {messages: [], native: [], proxySettings: []};
  const responders = [];
  const chrome = {
    runtime: {
      sendMessage: (msg) => sent.messages.push(msg),
      sendNativeMessage: (host, payload, callback) => {
        sent.native.push({host, payload});
        const responder = responders.shift();
        if (responder && callback) {
          callback(responder(payload));
        }
      },
      connectNative: () => {
        throw new Error('connectNative must not be called by these tests');
      },
    },
    proxy: {
      settings: {
        set: (details, callback) => {
          sent.proxySettings.push(details);
          if (callback) {
            callback();
          }
        },
      },
    },
  };
  const alerts = [];
  const context = vm.createContext({
    chrome,
    window: {alert: (text) => alerts.push(text)},
    navigator: {userAgent: 'Mozilla/5.0 Chrome/120.0'},
    console,
  });
  for (const file of ['EventEmitter.js', 'tor.js', 'proxy.js']) {
    vm.runInContext(readFileSync(join(BUNDLE, file), 'utf8'), context, {filename: file});
  }
  // const declarations do not attach to the vm global object, so
  // export them explicitly; worker.js creates the global `tor`
  // instance that proxy.js reads, so the harness does the same.
  vm.runInContext(
    'globalThis.Tor = Tor; globalThis.EventEmitter = EventEmitter;' +
      'globalThis.proxy = proxy; globalThis.tor = new Tor({directory: "/opt/tor"});',
    context,
  );
  return {context, sent, alerts, responders};
}

// --- EventEmitter (validation) ---

test('EventEmitter delivers emitted data to registered listeners', () => {
  const {context, sent} = loadBundle();
  const emitter = new context.EventEmitter();
  const seen = [];
  emitter.on('stdout', (d) => seen.push(['a', d]));
  emitter.on('stdout', (d) => seen.push(['b', d]));
  emitter.emit('stdout', 'hello');
  assert.deepEqual(seen, [['a', 'hello'], ['b', 'hello']]);
  // emit also forwards the event to the extension runtime
  // (field-wise: the message object is created in the vm realm, so
  // deepStrictEqual would reject it on prototype identity alone)
  assert.equal(sent.messages.length, 1);
  assert.equal(sent.messages[0].cmd, 'event');
  assert.equal(sent.messages[0].id, 'stdout');
  assert.equal(sent.messages[0].data, 'hello');
});

// --- EventEmitter (adversarial) ---

test('EventEmitter tolerates emitting with no listeners', () => {
  const {context} = loadBundle();
  const emitter = new context.EventEmitter();
  emitter.emit('nothing-registered', {x: 1});
  emitter.emit('nothing-registered');
});

// --- Tor construction (validation) ---

test('Tor starts disconnected with documented default endpoints', () => {
  const {context} = loadBundle();
  const tor = new context.Tor({directory: '/opt/tor'});
  assert.equal(tor.directory, '/opt/tor');
  assert.equal(tor.info.status, 'disconnected');
  assert.equal(tor.info['socks-host'], 'localhost');
  assert.equal(tor.info['socks-port'], 22050);
  assert.equal(tor.info['control-port'], 22051);
  assert.equal(tor.info.password, 'tor-browser');
  assert.equal(tor.info.ip, '0.0.0.0');
});

test('Tor honours an explicit password', () => {
  const {context} = loadBundle();
  const tor = new context.Tor({directory: '/opt/tor', password: 's3cret'});
  assert.equal(tor.info.password, 's3cret');
});

// --- Tor construction (adversarial) ---

test('Tor falls back to the default password on an empty one', () => {
  const {context} = loadBundle();
  const tor = new context.Tor({directory: '/opt/tor', password: ''});
  assert.equal(tor.info.password, 'tor-browser');
});

// --- Bootstrap progress parsing (validation) ---

test('response() turns Bootstrapped lines into progress events', () => {
  const {context} = loadBundle();
  const tor = new context.Tor({directory: '/opt/tor'});
  const progress = [];
  tor.on('progress', (p) => progress.push(p));
  tor.response({stdout: {data: 'Bootstrapped 50% (loading): Loading\n'}});
  assert.equal(progress.length, 1);
  assert.equal(progress[0].value, 50);
  assert.equal(progress[0].msg, 'loading');
  assert.equal(tor.info.progress, 50);
  assert.equal(tor.info.status, 'disconnected');
});

test('response() marks the tor connected at bootstrap 100%', () => {
  const {context} = loadBundle();
  const tor = new context.Tor({directory: '/opt/tor'});
  tor.response({stdout: {data: 'Bootstrapped 100% (done): Done\n'}});
  assert.equal(tor.info.progress, 100);
  assert.equal(tor.info.status, 'connected');
});

test('response() accumulates stdout into info.stdout', () => {
  const {context} = loadBundle();
  const tor = new context.Tor({directory: '/opt/tor'});
  const before = tor.info.stdout;
  tor.response({stdout: {data: 'line one\n'}});
  assert.equal(tor.info.stdout, before + 'line one\n');
});

// --- Bootstrap / response handling (adversarial) ---

test('response() ignores malformed bootstrap lines', () => {
  const {context} = loadBundle();
  const tor = new context.Tor({directory: '/opt/tor'});
  const progress = [];
  tor.on('progress', (p) => progress.push(p));
  tor.response({stdout: {data: 'Bootstrapped abc% (nope): Nope\n'}});
  tor.response({stdout: {data: 'Bootstrapped % (): Empty\n'}});
  assert.deepEqual(progress, []);
  assert.equal(tor.info.progress, 0);
});

test('response() with an empty result does not throw', () => {
  const {context} = loadBundle();
  const tor = new context.Tor({directory: '/opt/tor'});
  tor.response({});
});

test('response() reports failure status and alerts on error output', () => {
  const {context, alerts} = loadBundle();
  const tor = new context.Tor({directory: '/opt/tor'});
  tor.response({code: 2, stdout: '', stderr: 'boom'});
  assert.equal(tor.info.status, 'disconnected');
  assert.equal(alerts.length, 1);
  assert.match(alerts[0], /Code: 2/);
});

test('response() stays silent for exit code 1 with no error output', () => {
  const {context, alerts} = loadBundle();
  const tor = new context.Tor({directory: '/opt/tor'});
  tor.response({code: 1, stdout: '', stderr: ''});
  assert.equal(alerts.length, 0);
});

// --- Control-port commands (validation) ---

test('command() frames AUTHENTICATE, the command, and QUIT', () => {
  const {context, sent, responders} = loadBundle();
  const tor = new context.Tor({directory: '/opt/tor', password: 'pw'});
  responders.push(() => '250 OK\r\n');
  let callbackValue;
  tor.command('GETINFO version', (res) => {
    callbackValue = res;
  });
  assert.equal(sent.native.length, 1);
  const {host, payload} = sent.native[0];
  assert.equal(host, 'com.add0n.node');
  assert.equal(payload.cmd, 'net');
  // Array.from normalizes the vm-realm array into this realm
  assert.deepEqual(Array.from(payload.commands), [
    'AUTHENTICATE "pw"\r\n',
    'GETINFO version\r\n',
    'QUIT\r\n',
  ]);
  assert.equal(payload.port, 22051);
  // Known quirk, pinned deliberately: payload.host is read from
  // info['control-host'], which Tor never sets (info carries
  // 'socks-host' instead), so host is currently undefined.
  assert.equal(payload.host, undefined);
  assert.equal(callbackValue, '250 OK\r\n');
});

// --- getIP (validation + adversarial) ---

test('getIP extracts the exit node IP via circuit-status and ns/id', () => {
  const {context, responders} = loadBundle();
  const tor = new context.Tor({directory: '/opt/tor'});
  responders.push(
    () => '123 BUILT $ABCDEF0123456789~guard,node1,node2\n',
    () => 'r ABCDEF0123456789 2024-01-01 203.0.113.7 9001\n',
  );
  let ip;
  tor.getIP((value) => {
    ip = value;
  });
  assert.equal(ip, '203.0.113.7');
  assert.equal(tor.info.ip, '203.0.113.7');
});

test('getIP calls back empty when no circuit is BUILT', () => {
  const {context, responders, sent} = loadBundle();
  const tor = new context.Tor({directory: '/opt/tor'});
  responders.push(() => '123 EXTENDED $ABCDEF0123456789~guard\n');
  let calls = 0;
  tor.getIP(() => {
    calls += 1;
  });
  assert.equal(calls, 1);
  // no second (ns/id) command may be issued without a circuit id
  assert.equal(sent.native.length, 1);
});

// --- Proxy PAC (validation) ---

test('proxy.set builds a PAC script from the tor endpoints', () => {
  const {context, sent} = loadBundle();
  const changes = [];
  context.proxy.addListener('change', (v) => changes.push(v));
  context.proxy.set({ignored: true});
  assert.equal(sent.proxySettings.length, 1);
  const {value} = sent.proxySettings[0];
  assert.equal(value.mode, 'pac_script');
  assert.match(value.pacScript.data, /SOCKS5 localhost:22050/);
  assert.deepEqual(changes, [true]);
});

test('proxy.reset returns the browser to the system proxy', () => {
  const {context, sent} = loadBundle();
  const changes = [];
  context.proxy.addListener('change', (v) => changes.push(v));
  context.proxy.reset();
  assert.equal(sent.proxySettings[0].value.mode, 'system');
  assert.deepEqual(changes, [false]);
});
