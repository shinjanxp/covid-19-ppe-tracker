var express = require('express');
var router = express.Router();
var models = require('../models');
const webpush = require('web-push');

const redis = require("redis");
const client = redis.createClient();
const searchRadius = 10; //km
client.on("error", function (error) {
  console.error(error);
});

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});
// View ppe on map
router.get('/ppe/map', function (req, res, next) {
  res.render('ppe-map', {lat:req.query.lat || 22, lng: req.query.lng || 84, zoom: req.query.zoom || 4.5});
});
// View ppe as list
router.get('/ppe/list', function (req, res, next) {
  models.Availability.findAll().then(function (availabilities) {
    models.Requirement.findAll().then(function (requirements) {
      res.render('ppe-list', { availabilities: availabilities, requirements: requirements });
    }).catch(function (err) {
      console.log('Oops! something went wrong, : ', err);
    });
  }).catch(function (err) {
    console.log('Oops! something went wrong, : ', err);
  });
});

// View ppe-create form
router.get('/ppe/create', function (req, res, next) {
  res.render('ppe-create');
});
// Get list of availabilities
router.get('/availability', function (req, res, next) {
  models.Availability.findAll().then(function (items) {
    res.send(items);
  }).catch(function (err) {
    console.log('Oops! something went wrong, : ', err);
  });
});
// Get list of requirements
router.get('/requirement', function (req, res, next) {
  models.Requirement.findAll().then(function (items) {
    res.send(items);
  }).catch(function (err) {
    console.log('Oops! something went wrong, : ', err);
  });
});

function findMatches(newPost, newPostType, mode) {
  let searchType;
  if (newPostType === 'Availability') {
    searchType = 'Requirement';
  }
  else {
    searchType = 'Availability';
  }
  client.geoadd(newPostType, newPost.longitude, newPost.latitude, newPost.id + '.' + newPost.itemType, function (err, res) {
    // console.log(err,res);
    if (!err) {
      client.georadius(searchType, newPost.longitude, newPost.latitude, searchRadius, "km", 'WITHCOORD', function (err, res) {
        for (let match of res) {
          let matchId = match[0].split('.')[0];
          let itemType = match[0].split('.')[1];
          if (itemType === newPost.itemType) {
            // mode can be onSubscribe or onCreate
            if (mode === 'onSubscribe') {
              sendMessage(newPost.id, newPostType, {lat:newPost.latitude, lng: newPost.longitude});
              return;
            }
            sendMessage(matchId, searchType, {lat:match[1][1], lng: match[1][0]});
          }
        }
      })
    }
  });
}
// Create ppe
router.post('/ppe', function (req, res, next) {
  if (req.body.mode === 'availability') {
    models.Availability.create({
      name: req.body.name,
      itemType: req.body.itemType,
      quantity: req.body.quantity,
      email: req.body.email,
      contact: req.body.contact,
      latitude: req.body.latitude,
      longitude: req.body.longitude,
    }).then(function (created) {
      findMatches(created, 'Availability', 'onCreate');
      res.render('ppe-thanks', { forId: created.id, forType: 'Availability' });
    });
  }
  else if (req.body.mode === 'requirement') {
    models.Requirement.create({
      name: req.body.name,
      itemType: req.body.itemType,
      quantity: req.body.quantity,
      email: req.body.email,
      contact: req.body.contact,
      latitude: req.body.latitude,
      longitude: req.body.longitude,
    }).then(function (created) {
      findMatches(created, 'Requirement', 'onCreate');
      res.render('ppe-thanks', { forId: created.id, forType: 'Requirement' });
    });
  }

})

router.get('/ppe/thanks', function (req, res, next) {
  res.render('ppe-thanks');
});
const isValidSaveRequest = (req, res) => {
  // Check the request body has at least an endpoint.
  if (!req.body || !req.body.pushSubscription) {
    // Not a valid subscription.
    res.status(400);
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({
      error: {
        id: 'no-endpoint',
        message: 'Subscription must have an endpoint.'
      }
    }));
    return false;
  }
  return true;
};
router.post('/ppe/save-subscription/', function (req, res) {
  // if (!isValidSaveRequest(req, res)) {
  //   return;
  // }
  models.Subscription.create({
    forId: req.body.forId,
    forType: req.body.forType,
    pushSubscription: req.body.pushSubscription
  })
    .then(function (subscriptionId) {
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify({ data: { success: true } }));
      models[req.body.forType].findOne({ where: { id: req.body.forId } }).then(function (res) {
        findMatches(res, req.body.forType, 'onSubscribe');
      })
    })
    .catch(function (err) {
      res.status(500);
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify({
        error: {
          id: 'unable-to-save-subscription',
          message: 'The subscription was received but we were unable to save it to our database.'
        }
      }));
    });
});
function shouldSend(subscription) {
  return true;
}
const triggerPushMsg = function (subscription, dataToSend) {
  return webpush.sendNotification(subscription, dataToSend)
    .catch((err) => {
      if (err.statusCode === 404 || err.statusCode === 410) {
        console.log('Subscription has expired or is no longer valid: ', err);
        return deleteSubscriptionFromDatabase(subscription._id);
      } else {
        throw err;
      }
    });
};

function sendMessage(recipientId, recipientType, coords) {
  console.log("Sending message to ", recipientId, recipientType)
  models.Subscription.findOne({ where: { forId: recipientId, forType: recipientType } })
    .then(function (subscription) {
      if (!subscription) {
        return;
      }
      let promiseChain = Promise.resolve();

      promiseChain = promiseChain.then(() => {
        let payload = { title: "COVID-19 PPE TRacker", message: "We found a match", coords: coords};

        return triggerPushMsg(JSON.parse(subscription.pushSubscription), JSON.stringify(payload));
      });
      return promiseChain;
    })
}
/*
router.get('/ppe/trigger-push', function (req, res, next) {
  models.Subscription.findAll()
    .then(function (subscriptions) {
      let promiseChain = Promise.resolve();

      for (let i = 0; i < subscriptions.length; i++) {
        const subscription = subscriptions[i];
        if (shouldSend(subscription)) {
          promiseChain = promiseChain.then(() => {
            let payload = { title: "COVID-19 PPE TRacker", message: "We found a match" };

            return triggerPushMsg(JSON.parse(subscription.pushSubscription), JSON.stringify(payload));
          });
        }
      }

      return promiseChain;
    })
    .then(() => {
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify({ data: { success: true } }));
    })
    .catch(function (err) {
      res.status(500);
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify({
        error: {
          id: 'unable-to-send-messages',
          message: `We were unable to send messages to all subscriptions : ` +
            `'${err.message}'`
        }
      }));
    });
})
*/
module.exports = router;
