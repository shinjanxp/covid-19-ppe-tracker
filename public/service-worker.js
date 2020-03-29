self.addEventListener('push', function (event) {
    if (!(self.Notification && self.Notification.permission === 'granted')) {
        return;
    }

    var data = {};
    if (event.data) {
        data = event.data.json();
    }
    var title = data.title || "Something Has Happened";
    var message = data.message || "Here's something you might want to check out.";
    // var icon = "images/new-notification.png";

    const promiseChain = self.registration.showNotification(title, {
        body: message,
        tag: 'covid-19-ppe-tracker',
        requireInteraction: true
        //   icon: icon
    });

    event.waitUntil(promiseChain);
});



self.addEventListener('notificationclick', function (event) {
    const clickedNotification = event.notification;
    clickedNotification.close();

    // Do something as the result of the notification click
    if (clients.openWindow) {
        clients.openWindow('https://shinjanxp.ddns.net:3000/ppe/map');
    }
    // const promiseChain = doSomething();
    // event.waitUntil(promiseChain);
});