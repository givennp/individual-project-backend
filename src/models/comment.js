const { DataTypes } = require("sequelize");

const Comment = (sequelize) => {
  return sequelize.define("Comment", {
    content: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  });
};

module.exports = Comment;
