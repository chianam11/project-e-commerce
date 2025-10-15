import express from "express";
import useProfile from "./user.profile.js";

const router = express.Router();

// định nghĩa routes
router.get("/", (req, res) => {
    res.json({ message: "Get all users" });
});
router.get("/:id", (req, res) => {
    res.json({ message: "Get user id =" });
});
router.post("/", (req, res) => {
    res.json({ message: "Create user" });
});

router.patch("/", (req, res) => {
    res.json({ message: "Get patch users" });
});

router.delete("/", (req, res) => {
    res.json({ message: "delete user" });
});
router.use("/profile", useProfile);
export default router;
