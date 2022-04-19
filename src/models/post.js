const { DataTypes } = require("sequelize");

const Post = (sequelize) => {
  return sequelize.define(
    "Post",
    {
      image_url: {
        type: DataTypes.STRING,
        allowNull: false
      },
      caption: {
        type: DataTypes.STRING
      },
      location: {
        type: DataTypes.STRING
      },
      like_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      dislike_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      comment_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      date_created: {
        type: DataTypes.STRING,
        allowNull: false
      }
    }
  )
}

module.exports = Post;