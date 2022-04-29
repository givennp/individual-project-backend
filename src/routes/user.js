const { User, Post, Like } = require("../lib/sequelize");
const fileUploader = require("../lib/uploader");
const { authorizedLoggedInUser } = require("../middlewares/authMiddleware");
const router = require("express").Router();

router.get("/liked-post", authorizedLoggedInUser, async (req, res) => {
  try {
    const { user_id } = req.query

    const findPost = await Like.findAndCountAll({
      where: {
        user_id,
      },
      include: [
        {
          model: User,
          as: "user_like",
          attributes: {
            exclude: ["password"],
          },
        },
        {
          model: Post,
          as: "like_post",
        },
      ],
    });

    if(!findPost){
      return res.status(400).json({
        message: "user have not like any post"
      })
    }
    
    return res.status(200).json({
      message: "get user liked post",
      result: findPost
    })


  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: "server error"
    })

  }
})

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
          as: "post_user"
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
