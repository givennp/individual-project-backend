const { Op } = require("sequelize");
const { User, VerificationToken, ForgotPasswordToken } = require("../lib/sequelize");
const bcrypt = require("bcrypt");
const { generateToken } = require("../lib/jwt");
const mustache = require("mustache");
const { nanoid } = require("nanoid");
const moment = require("moment");
const fs = require("fs");
const mailer = require("../lib/mailer");

const authControllers = {
  registerUser: async (req, res) => {
    try {
      const { username, email, full_name, password, avatar = "" } = req.body;

      const isUsernameEmailTaken = await User.findOne({
        where: {
          [Op.or]: [{ username }, { email }],
        },
      });

      if (isUsernameEmailTaken) {
        return res.status(400).json({
          message: "username or email has been taken",
        });
      }

      const hashedPassword = bcrypt.hashSync(password, 5);

      const newUser = await User.create({
        username,
        email,
        full_name,
        password: hashedPassword,
        avatar: "",
      });

      const verificationToken = nanoid(40);

      await VerificationToken.create({
        token: verificationToken,
        user_id: newUser.id,
        valid_until: moment().add(1, "hour"),
      });

      const verificationLink = `http://localhost:2000/auth/verify/${verificationToken}`;

      const template = fs
        .readFileSync(__dirname + "/../templates/verify.html")
        .toString();

      const renderedTemplate = mustache.render(template, {
        username,
        verify_url: verificationLink,
        full_name,
      });

      await mailer({
        to: email,
        subject: "Verify your account!",
        html: renderedTemplate,
      });

      return res.status(201).json({
        message: "registered user",
      });
    } catch (err) {
      console.log(err);

      return res.status(500).json({
        message: "server error",
      });
    }
  },

  loginUser: async (req, res) => {
    try {
      const { username, password } = req.body;

      const findUser = await User.findOne({
        where: {
          username,
        },
      });

      if (!findUser) {
        return res.status(400).json({
          message: "wrong username or password",
        });
      }

      const isPasswordCorrect = bcrypt.compareSync(password, findUser.password);

      if (!isPasswordCorrect) {
        return res.status(400).json({
          message: "Wrong username or password",
        });
      }

      delete findUser.dataValues.password;

      const token = generateToken({
        id: findUser.id,
      });

      return res.status(200).json({
        message: "logged in user",
        result: {
          user: findUser,
          token,
        },
      });
    } catch (err) {
      console.log(err);

      return res.status(500).json({
        message: "server error",
      });
    }
  },
  keepLogin: async (req, res) => {
    try {
      const { token } = req;

      const renewedToken = generateToken({ id: token.id });

      const findUser = await User.findByPk(token.id);

      delete findUser.dataValues.password;

      return res.status(200).json({
        message: "Renewed user token",
        result: {
          user: findUser,
          token: renewedToken,
        },
      });
    } catch (err) {
      console.log(err);
      return res.status(500).json({
        message: "Server error",
      });
    }
  },
  verifyUser: async (req, res) => {
    try {
      const { token } = req.params;

      const findToken = await VerificationToken.findOne({
        where: {
          token,
          is_valid: true,
          valid_until: {
            [Op.gt]: moment().utc(),
          },
        },
      });

      if (!findToken) {
        return res.status(404).json({
          message: "token not found",
        });
      }

      await User.update(
        { is_verified: true },
        {
          where: {
            id: findToken.user_id,
          },
        }
      );

      findToken.is_valid = false;
      findToken.save();

      // return res.redirect(`http://localhost:3000/verification-success?referral=${token}`)
      return res.redirect(`http://localhost:3000/`);
    } catch (err) {
      console.log(err);
      return res.status(500).json({
        message: "server error",
      });
    }
  },
  resendEmailVerification: async (req, res) => {
    try {
      const { id } = req.token; // JWT

      await VerificationToken.update(
        { is_valid: false },
        {
          where: {
            is_valid: true,
            user_id: id,
          },
        }
      );

      const verificationToken = nanoid(40);

      await VerificationToken.create({
        token: verificationToken,
        is_valid: true,
        user_id: id,
        valid_until: moment().add(1, "hour"),
      });

      const findUser = await User.findByPk(id);

      const verificationLink = `http://localhost:2000/auth/verify/${verificationToken}`;

      const template = fs
        .readFileSync(__dirname + "/../templates/verify.html")
        .toString();

      const renderedTemplate = mustache.render(template, {
        username: findUser.username,
        verify_url: verificationLink,
        full_name: findUser.full_name,
      });

      await mailer({
        to: findUser.email,
        subject: "Verify your account!",
        html: renderedTemplate,
      });

      return res.status(201).json({
        message: "Resent verification email",
      });
    } catch (err) {
      console.log(err);
      return res.status(500).json({
        message: "Server error",
      });
    }
  },
  sendForgotPasswordEmail: async (req, res) => {
    try {
      const { email } = req.body;

      const findUser = await User.findOne({
        where: {
          email,
        },
      });

      const passwordToken = nanoid(40);

      const token = await ForgotPasswordToken.update(
        { is_valid: false },
        {
          where: {
            user_id: findUser.id,
            is_valid: true,
          },
        }
      );

      await ForgotPasswordToken.create({
        token: passwordToken,
        valid_until: moment().add(1, "hour"),
        is_valid: true,
        user_id: findUser.id,
      });

      const forgotPasswordLink = `http://localhost:3000/resetPassword?fp_token=${passwordToken}`;

      const template = fs
        .readFileSync(__dirname + "/../templates/forgot.html")
        .toString();

      const renderedTemplate = mustache.render(template, {
        username: findUser.username,
        forgot_password_url: forgotPasswordLink,
        full_name: findUser.full_name,
      });

      await mailer({
        to: findUser.email,
        subject: "Forgot password!",
        html: renderedTemplate,
      });

      return res.status(201).json({
        message: "Resent verification email",
      });
    } catch (err) {
      console.log(err);
      return res.status(500).json({
        message: "Server error",
      });
    }
  },
  changeUserForgotPassword: async (req, res) => {
    try {
      const { password, forgotPasswordToken } = req.body;

      const findToken = await ForgotPasswordToken.findOne({
        where: {
          token: forgotPasswordToken,
          is_valid: true,
          valid_until: {
            [Op.gt]: moment().utc(),
          },
        },
      });

      if (!findToken) {
        return res.status(400).json({
          message: "Invalid token",
        });
      }

      const hashedPassword = bcrypt.hashSync(password, 5);

      await User.update(
        { password: hashedPassword },
        {
          where: {
            id: findToken.user_id,
          },
        }
      );

      return res.status(200).json({
        message: "Change password success",
      });
    } catch (err) {
      console.log(err);
      return res.status(500).json({
        message: "Server error",
      });
    }
  },
};

module.exports = authControllers;
