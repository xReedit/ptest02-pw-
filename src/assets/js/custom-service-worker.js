importScripts('../../ngsw-worker.js');

(function () {
	'use strict';

	self.addEventListener('notificationclick', (event) => {
		console.log("This is custom service worker notificationclick method.");
	});
}());