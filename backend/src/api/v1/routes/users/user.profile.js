import express from "express";
const router = express.Router();

// định nghĩa routes
router.get("/", (req, res) => {
    res.json({ message: "creat info" });
});

router.post("/", (req, res) => {
    res.json({ message: "post info" });
});
router.put("/", (req, res) => {
    res.json({ message: "delete info" });
});
router.patch("/", (req, res) => {
    res.json({ message: "patch info" });
});
router.delete("/", (req, res) => {
    res.json({ message: "delete info" });
});
export default router;
