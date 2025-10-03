import express from "express";

const router = express.Router();

// định nghĩa routes
router.get("/", (req, res) => {
    res.json({ message: "Get all users" });
});

router.post("/", (req, res) => {
    res.json({ message: "Create user" });
});

export default router;
