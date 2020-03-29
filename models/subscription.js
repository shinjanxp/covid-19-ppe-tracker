'use strict';
module.exports = (sequelize, DataTypes) => {
  const Subscription = sequelize.define('Subscription', {
    forId: DataTypes.STRING,
    forType: DataTypes.STRING,
    pushSubscription: DataTypes.TEXT,
  }, {});
  Subscription.associate = function(models) {
    // associations can be defined here
  };
  return Subscription;
};