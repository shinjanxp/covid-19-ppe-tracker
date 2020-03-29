self.addEventListener('push', function (event) {
    const promiseChain = self.registration.showNotification('Hello, World.',{body:'boo'});

    event.waitUntil(promiseChain);
});