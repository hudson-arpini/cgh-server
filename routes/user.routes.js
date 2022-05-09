const router = require("express").Router();
const bcrypt = require("bcrypt");
const UserModel = require("../models/User.model");

const generateToken = require("../config/jwt.config");
const isAuth = require("../middlewares/isAuth");
const attachCurrentUser = require("../middlewares/attachCurrentUser");
const isAdmin = require("../middlewares/isAdmin");

const saltRounds = 10;

router.post("/signup", async (req, res) => {
  try {
    // Primeira coisa: Criptografar a senha!

    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        msg: "Password is required and must have at least 8 characters, uppercase and lowercase letters, numbers and special characters.",
      });
    }

    const salt = await bcrypt.genSalt(saltRounds);
    const passwordHash = await bcrypt.hash(password, salt);
    const accountNumber = Math.floor(Math.random()*100000)

    const createdUser = await UserModel.create(
      { ...req.body, passwordHash:passwordHash, accountNumber: accountNumber},
    );

    delete createdUser._doc.passwordHash;

    return res.status(201).json(createdUser);
  } catch (error) {
    console.log(error);
    return res.status(500).json(error);
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await UserModel.findOne({ email: email });

    if (!user) {
      return res.status(400).json({ msg: "Wrong password or email." });
    }

    if (await bcrypt.compare(password, user.passwordHash)) {
      delete user._doc.passwordHash;
      const token = generateToken(user);

      return res.status(200).json({
        token: token,
        user: { ...user._doc },
      });
    } else {
      return res.status(400).json({ msg: "Wrong password or email." });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json(error);
  }
});

router.get("/profile", isAuth, attachCurrentUser, (req, res) => {
  return res.status(200).json(req.currentUser);
});

router.patch("/update-profile", isAuth, attachCurrentUser, async (req, res) => {
  try {
    const loggedInUser = req.currentUser;
    console.log(req.body, "REq.Body")
    const updatedUser = await UserModel.findOneAndUpdate(
      { _id: loggedInUser._id },
      { ...req.body },
      { runValidators:true, new:true }
    );

    delete updatedUser._doc.passwordHash;

    return res.status(200).json(updatedUser);
  } catch (error) {
    console.log(error);
    return res.status(500).json(error);
  }
});


router.delete(
  "/disable-profile",
  isAuth,
  attachCurrentUser,
  async (req, res) => {
    try {
      const loggedInUser = req.currentUser
      const disabledUser = await UserModel.findOneAndUpdate(
        { _id: loggedInUser._id },
        { isActive: false, disabledOn: Date.now() },
        { runValidators: true, new: true }
      );

      delete disabledUser._doc.passwordHash;

      return res.status(200).json(disabledUser);
    } catch (error) {
      console.log(error);
      return res.status(500).json(error);
    }
  }
);

router.patch(
  "/transfer",
  isAuth,
  attachCurrentUser,
  async (req,res) => {
    try{
      const loggedInUser = req.currentUser

      if((loggedInUser.balance - req.body.amount)<0) {return res.status(406).json({message:"Saldo Insuficiente"})}


      const sendingUser = await UserModel.findOneAndUpdate(
        { _id: loggedInUser._id },
        { balance: loggedInUser.balance - req.body.amount},
        { runValidators: true, new: true }
      )

      const receiver = await UserModel.findOne({ accountNumber: req.body.receiver })
      const receivingUser = await UserModel.findOneAndUpdate(
        { accountNumber: req.body.receiver },
        { balance: receiver.balance + req.body.amount},
        { runValidators: true, new: true }
      )

      delete sendingUser._doc.passwordHash;

      return res.status(200).json(sendingUser)
    }
    catch (error) {
      console.log(error);
      return res.status(500).json(error);
    }
  }
)

module.exports = router;
