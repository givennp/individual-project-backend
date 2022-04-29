const router = require("express").Router();
const { Post, User, Like, Comment } = require("../lib/sequelize");
const { Op } = require("sequelize");
const fileUploader = require("../lib/uploader");
const { authorizedLoggedInUser } = require("../middlewares/authMiddleware");
const moment = require("moment");

router.get("/", authorizedLoggedInUser, async (req, res) => {
  try {
    const {
      user_id,
      _limit = 30,
      _page = 1,
      _sortBy = "",
      _sortDir = "",
    } = req.query;

    delete req.query._limit;
    delete req.query._page;
    delete req.query._sortBy;
    delete req.query._sortDir;

    const findPosts = await Post.findAndCountAll({
      where: {
        ...req.query,
      },
      limit: _limit ? parseInt(_limit) : undefined,
      offset: (_page - 1) * _limit,
      include: [
        {
          model: User,
          attributes: {
            exclude: ["password"],
          },
          as: "post_user",
        },
        {
          model: User,
          attributes: {
            exclude: ["password"],
          },
          as: "post_like",
          where: {
            id: req.token.id,
          },
          required: false,
        },
        {
          model: Comment,
          include: User,
          attributes: ["content"],
        },
      ],
      distinct: true,
      order: _sortBy ? [[_sortBy, _sortDir]] : undefined,
    });

    return res.status(200).json({
      message: "Find posts",
      result: findPosts,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: "Server error",
    });
  }
});

// router.get("/comments")

router.get("/get-one-post", async (req, res) => {
  try {
    const findPost = await Post.findOne({
      where: {
        ...req.query
      },
      include: [
        {
          model: User,
          attributes: {
            exclude: ["password"],
          },
          as: "post_user",
        },
        {
          model: Comment,
          include: {
            model: User,
            attributes: {
              exclude: ["password"],
            },
          },
          attributes: ["content"],
        },
      ],
    });

    return res.status(200).json({
      message: "find one post",
      result: findPost,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: "server error",
    });
  }
});

router.post(
  "/",
  authorizedLoggedInUser,
  fileUploader({
    destinationFolder: "posts",
    fileType: "image",
    prefix: "POST",
  }).single("post_image_file"),
  async (req, res) => {
    try {
      const { caption, location, user_id, date_created } = req.body;

      const uploadFileDomain = process.env.UPLOAD_FILE_DOMAIN;
      const filePath = "post_images";
      const { filename } = req.file;

      const newPost = await Post.create({
        image_url: `${uploadFileDomain}/${filePath}/${filename}`,
        caption,
        location,
        user_id,
        date_created,
      });

      return res.status(201).json({
        message: "Post created",
        result: newPost,
      });
    } catch (err) {
      console.log(err);
      return res.status(500).json({
        message: "Server error",
      });
    }
  }
);

router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const updatedPost = await Post.update(
      {
        ...req.body,
      },
      {
        where: {
          id,
        },
      }
    );

    return res.status(201).json({
      message: "Updated post",
      result: updatedPost,
    });
  } catch (error) {
    console.log(err);
    return res.status(500).json({
      message: "Server error",
    });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const deletedPost = await Post.destroy({
      where: {
        id,
      },
    });

    return res.status(201).json({
      message: "Deleted post",
      result: deletedPost,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: "Server error",
    });
  }
});

router.get("/:id/likes", async (req, res) => {
  try {
    const { id } = req.params;
    const postLikes = await Like.findAll({
      where: {
        PostId: id,
      },
      include: User,
    });

    return res.status(200).json({
      message: "Fetch likes",
      result: postLikes,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: "Server error",
    });
  }
});

// like
router.post("/:postId/likes/:userId", authorizedLoggedInUser, async (req, res) => {
  try {
    const { postId, userId } = req.params;

    const isLiked = await Like.findOne({
      where: {
        post_id: postId,
        user_id: userId,
      },
    });

    if (isLiked) {
      return res.status(400).json({
        message: "user has liked this post before",
      });
    }

    await Post.increment(
      {
        like_count: 1,
      },
      {
        where: {
          id: postId,
        },
      }
    );

    await Like.create({
      user_id: userId,
      post_id: postId,
    });

    res.status(201).json({
      message: "post liked",
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: "Server error",
    });
  }
});

// remove like
router.delete("/:postId/likes/:userId", authorizedLoggedInUser, async (req, res) => {
  try {
    const { postId, userId } = req.params;

    const isLiked = await Like.findOne({
      where: {
        post_id: postId,
        user_id: userId,
      },
    });

    if (!isLiked) {
      return res.status(400).json({
        message: "blom di like",
      });
    }

    await Post.increment(
      {
        like_count: -1,
      },
      {
        where: {
          id: postId,
        },
      }
    );

    await Like.destroy({
      where: {
        user_id: userId,
        post_id: postId,
      },
    });

    res.status(201).json({
      message: "unliked",
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: "Server error",
    });
  }
});

module.exports = router;
