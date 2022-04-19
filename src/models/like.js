const { DataTypes } = require("sequelize");

const Like = (sequelize) => {
  return sequelize.define("Like", {
    type: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  });
};

module.exports = Like;
