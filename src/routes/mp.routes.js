import { Router } from "express";
import { createPayment, handleWebhook } from "../controllers/mp.controller.js";

const router = Router();

router.post("/create-preference", createPayment);
router.post("/webhook", handleWebhook);

export default router;
