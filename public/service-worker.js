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
    var coords = data.coords 
    console.log(coords);
    // var icon = "images/new-notification.png";

    const promiseChain = self.registration.showNotification(title, {
        body: message,
        tag: 'covid-19-ppe-tracker',
        requireInteraction: true,
        data: coords
        //   icon: icon
    });

    event.waitUntil(promiseChain);
});



self.addEventListener('notificationclick', function (event) {
    const clickedNotification = event.notification;
    clickedNotification.close();

    // Do something as the result of the notification click
    if (clients.openWindow) {
        clients.openWindow('/ppe/map?zoom=13&lat='+event.notification.data.lat+'&lng='+event.notification.data.lng);
    }
    // const promiseChain = doSomething();
    // event.waitUntil(promiseChain);
});