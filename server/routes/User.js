import express from "express";
import { UserLogin, UserRegister } from "../controllers/User.js";
import { verifyToken } from "../middleware/verifyToken.js";
const router = express.Router();

router.post("/signup", UserRegister);
router.post("/login", UserLogin);
router.get("/dashboard", verifyToken, UserLogin);

export default router;