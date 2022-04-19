const { Comment, User, Post } = require("../lib/sequelize");

const router = require("express").Router();

router.get("/", async (req, res) => {
  try {
    const { _limit = 30, _page = 1, _sortBy = "", _sortDir = "" } = req.query;

    delete req.query._limit;
    delete req.query._page;
    delete req.query._sortBy;
    delete req.query._sortDir;

    const getComments = await Comment.findAndCountAll({
      where: {
        ...req.query,
      },
      limit: _limit ? parseInt(_limit) : undefined,
      offset: (_page - 1) * _limit,
      include: [
        {
          model: User,
          attributes: ["username"]
        },
        {
          model: Post,
          attributes: ["image_url"]
        }
      ],
      distinct: true,
      order: _sortBy ? [[_sortBy, _sortDir]] : undefined,
    });

     return res.status(200).json({
       message: "get all comments",
       result: getComments,
     });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: "server error",
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const { content, user_id, post_id } = req.body;

    const newComment = await Comment.create({
        content,
        user_id,
        post_id
    });

      await Post.increment(
        {
          comment_count: 1,
        },
        {
          where: {
            id: post_id,
          },
        }
      );


     return res.status(200).json({
       message: "post new comment",
       result: newComment,
     });

  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: "server error",
    });
  }
});

module.exports = router