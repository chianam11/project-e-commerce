import express from "express";
import userIndexRouters from "./users/users.index.js";
const router = express.Router();

// định nghĩa routes
router.use("/users", userIndexRouters);



export default router;
