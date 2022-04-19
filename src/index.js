const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const PORT = process.env.PORT;

const { sequelize } = require("./lib/sequelize");
sequelize.sync({ alter: true });

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("<h1>Pict perfect API</h1>");
});

const {
  postRoutes,
  authRoutes,
  commentRoutes,
  userRoutes,
} = require("./routes");


app.use("/post_images", express.static(`${__dirname}/public/posts`));
app.use("/profile_picture", express.static(`${__dirname}/public/profilePicture`));

app.use("/posts", postRoutes);
app.use("/auth", authRoutes);
app.use("/comments", commentRoutes);
app.use("/users", userRoutes);

app.listen(PORT, () => {
  console.log("Listening in port", PORT);
});
