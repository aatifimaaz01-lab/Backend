let express = require("express");
const {
  login,
  profile,
  changePassword,
  forgotPassword,
  resetPassword,
  setPassword,
} = require("../controller/authcontroller");
const verifyUser = require("../middleware/verifyuser");
const { generateOfferLetter } = require("../controller/offerController");

let router = express.Router();

router.post("/login", login);

router.get("/profile", verifyUser, profile);

router.put("/change-password", verifyUser, changePassword);

router.post("/forgot-password", forgotPassword);
router.put("/reset-password/:token", resetPassword);

router.post("/set-password/:token", setPassword);

router.get("/offer-letter/:id", verifyUser, generateOfferLetter);

module.exports = router;
