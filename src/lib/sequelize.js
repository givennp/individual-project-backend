const { Sequelize } = require("sequelize");
const mysqlConfig = require("../configs/database");


const sequelize = new Sequelize({
  username: mysqlConfig.MYSQL_USERNAME,
  password: mysqlConfig.MYSQL_PASSWORD,
  database: mysqlConfig.MYSQL_DB_NAME,
  port: 3306,
  dialect: "mysql",
  // logging: (sql) => {
  //   console.log("SQL AKUUU", sql)
  //   fs.appendFileSync(__dirname + "/sql_logs.txt", sql)
  // }, 
  logging: false
});

// Models
const Post = require("../models/post")(sequelize);
const User = require("../models/user")(sequelize);
const Like = require("../models/like")(sequelize);
const Comment = require("../models/comment")(sequelize);
const VerificationToken = require("../models/verification_token")(sequelize);

// Associations
// 1 : M
Post.belongsTo(User, { foreignKey: "user_id", as: "post_user"});
User.hasMany(Post, { foreignKey: "user_id", as: "post_user" });
Comment.belongsTo(Post, { foreignKey: "post_id", onDelete: "CASCADE" });
Post.hasMany(Comment, { foreignKey: "post_id", onDelete: "CASCADE" });
Comment.belongsTo(User, { foreignKey: "user_id" });
User.hasMany(Comment, { foreignKey: "user_id" });

// M : M
Post.belongsToMany(User, {
  through: Like,
  foreignKey: "post_id",
  onDelete: "CASCADE",
  as: "post_like",
});
User.belongsToMany(Post, {
  through: Like,
  foreignKey: "user_id",
  onDelete: "CASCADE",
  as: "post_like",
});
User.hasMany(Like, { foreignKey: "user_id" });
Like.belongsTo(User, { foreignKey: "user_id" });
Post.hasMany(Like, { foreignKey: "post_id" });
Like.belongsTo(Post, { foreignKey: "post_id" });

User.hasMany(VerificationToken, { foreignKey: "user_id", onDelete: "CASCADE" });
VerificationToken.belongsTo(User, {
  foreignKey: "user_id",
  onDelete: "CASCADE",
});

module.exports = {
  sequelize,
  Post,
  User,
  Like,
  Comment,
  VerificationToken,
};
