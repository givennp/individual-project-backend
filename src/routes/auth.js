const { authControllers } = require("../controllers");
const { authorizedLoggedInUser } = require("../middlewares/authMiddleware");

const router = require("express").Router();

router.post("/login", authControllers.loginUser);
router.post("/register", authControllers.registerUser);
router.get("/refresh-token", authorizedLoggedInUser, authControllers.keepLogin);
router.post("/resend-verification", authorizedLoggedInUser, authControllers.resendEmailVerification);
router.get("/verify/:token", authControllers.verifyUser);

module.exports = router;
