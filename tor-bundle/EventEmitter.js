// /qompassai/tor/tor-bundle/EventEmitter.js
// // Qompass AI Tor-Bundle EventEmitter JS
// Copyright (C) 2025 Qompass AI, All rights reserved
/////////////////////////////////////////////////////
"use strict";

const EventEmitter = function () {
	this.ecb = {};
};
EventEmitter.prototype.emit = function (id, data) {
	(this.ecb[id] || []).forEach((c) => c(data));
	chrome.runtime.sendMessage({
		cmd: "event",
		id,
		data,
	});
};
EventEmitter.prototype.on = function (id, callback) {
	this.ecb[id] = this.ecb[id] || [];
	this.ecb[id].push(callback);
};
