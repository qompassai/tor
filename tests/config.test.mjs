// Validation gate for the tor repo's configuration files:
// the extension manifest, the tor-browser settings, and the
// example torrc. Validation cases check the shipped files;
// adversarial cases prove the checks reject corrupted copies.
//
// Run: node --test tests/

import assert from 'node:assert/strict';
import {existsSync, readFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {test} from 'node:test';
import {fileURLToPath} from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

function checkManifest(manifest, fileExists) {
  const problems = [];
  if (manifest.manifest_version !== 3) {
    problems.push('manifest_version is not 3');
  }
  if (!manifest.name || !manifest.version) {
    problems.push('name or version missing');
  }
  const worker = manifest.background?.service_worker;
  if (!worker) {
    problems.push('background.service_worker missing');
  } else if (!fileExists(join('tor-bundle', worker))) {
    problems.push(`service worker ${worker} does not exist`);
  }
  for (const [size, path] of Object.entries(manifest.icons ?? {})) {
    if (!fileExists(join('tor-bundle', path))) {
      problems.push(`icon ${size} (${path}) does not exist`);
    }
  }
  const popup = manifest.action?.default_popup;
  if (!popup || !fileExists(join('tor-bundle', popup))) {
    problems.push('action.default_popup missing or does not exist');
  }
  const options = manifest.options_ui?.page;
  if (!options || !fileExists(join('tor-bundle', options))) {
    problems.push('options_ui.page missing or does not exist');
  }
  return problems;
}

function checkTorrc(text) {
  const problems = [];
  const portDirectives = new Set(['SocksPort', 'ControlPort', 'DNSPort']);
  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    if (line === '' || line.startsWith('#')) {
      continue;
    }
    const match = /^([A-Za-z]+)\s+(.+)$/.exec(line);
    if (!match) {
      problems.push(`unparsable line: ${line}`);
      continue;
    }
    const [, key, value] = match;
    if (portDirectives.has(key)) {
      const port = Number(value.split(':').pop());
      if (!Number.isInteger(port) || port < 1 || port > 65535) {
        problems.push(`${key} value ${value} is not a valid port`);
      }
    }
    if (key === 'HiddenServicePort') {
      if (!/^\d+\s+\S+:\d+$/.test(value)) {
        problems.push(`HiddenServicePort value ${value} is not '<port> <host>:<port>'`);
      }
    }
    if (key === 'HiddenServiceVersion' && value !== '3') {
      problems.push(`HiddenServiceVersion is ${value}, want 3`);
    }
  }
  return problems;
}

const manifestText = readFileSync(join(ROOT, 'tor-bundle', 'manifest.json'), 'utf8');
const torrcText = readFileSync(join(ROOT, 'torrc', 'example.torrc'), 'utf8');
const fileExists = (rel) => existsSync(join(ROOT, rel));

// --- Validation ---

test('extension manifest is valid and every referenced file exists', () => {
  const manifest = JSON.parse(manifestText);
  assert.deepEqual(checkManifest(manifest, fileExists), []);
});

test('tor-browser settings parse and carry a host:port socks address', () => {
  const settings = JSON.parse(readFileSync(join(ROOT, 'torbrowser', 'settings.json'), 'utf8'));
  assert.match(settings.tor_socks_address, /^[^\s:]+:\d+$/);
  assert.equal(settings.download_over_tor, true);
});

test('example torrc directives are well-formed', () => {
  assert.deepEqual(checkTorrc(torrcText), []);
});

// --- Adversarial ---

test('manifest with a missing service worker is rejected', () => {
  const manifest = JSON.parse(manifestText);
  manifest.background.service_worker = 'no-such-worker.js';
  assert.notDeepEqual(checkManifest(manifest, fileExists), []);
});

test('manifest with a missing icon file is rejected', () => {
  const manifest = JSON.parse(manifestText);
  manifest.icons['16'] = 'data/icons/gone.png';
  assert.notDeepEqual(checkManifest(manifest, fileExists), []);
});

test('manifest v2 is rejected', () => {
  const manifest = JSON.parse(manifestText);
  manifest.manifest_version = 2;
  assert.notDeepEqual(checkManifest(manifest, fileExists), []);
});

test('torrc with an out-of-range port is rejected', () => {
  assert.notDeepEqual(checkTorrc(torrcText.replace('SocksPort 9002', 'SocksPort 99999')), []);
});

test('torrc with a malformed hidden-service port is rejected', () => {
  assert.notDeepEqual(checkTorrc('HiddenServicePort http localhost\n'), []);
});

test('torrc with a garbage line is rejected', () => {
  assert.notDeepEqual(checkTorrc('!!! not a directive\n'), []);
});
