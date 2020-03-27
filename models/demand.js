'use strict';
module.exports = (sequelize, DataTypes) => {
  const Demand = sequelize.define('Demand', {
    name: DataTypes.STRING,
    itemType: DataTypes.STRING,
    quantity: DataTypes.DOUBLE,
    email: DataTypes.STRING,
    contact: DataTypes.STRING,
    latitude: DataTypes.DOUBLE,
    longitude: DataTypes.DOUBLE
  }, {});
  Demand.associate = function(models) {
    // associations can be defined here
  };
  return Demand;
};