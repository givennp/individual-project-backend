const { User, Post } = require("../lib/sequelize");
const fileUploader = require("../lib/uploader");
const { authorizedLoggedInUser } = require("../middlewares/authMiddleware");
const router = require("express").Router();

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const findUser = await User.findOne({
      where: {
        id,
      },
      include: [
        {
          model: Post,
        },
      ],
    });

    return res.status(200).json({
      message: "get user",
      result: findUser,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "server error",
    });
  }
});

router.patch(
  "/:id",
  authorizedLoggedInUser,
  fileUploader({
    destinationFolder: "profilePicture",
    fileType: "image",
    prefix: "PATCH",
  }).single("avatar"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { username } = req.body;

      if (username) {
        const findUser = await User.findOne({
          where: {
            username,
          },
        });

        if (findUser) {
          return res.status(400).json({
            message: "username already taken",
          });
        }
      }

      if (req.file) {
        const uploadFileDomain = process.env.UPLOAD_FILE_DOMAIN;
        const filePath = "profile_picture";
        const { filename } = req.file;
        req.body.avatar= `${uploadFileDomain}/${filePath}/${filename}`
      }

      await User.update(
        {
          ...req.body,
        },
        {
          where: {
            id,
          },
        }
      );

      return res.status(200).json({
        message: "profile updated success",
      });
    } catch (err) {
      console.log(err);
      res.status(500).json({
        message: "server error",
      });
    }
  }
);
module.exports = router;
