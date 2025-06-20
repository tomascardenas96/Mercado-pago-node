import cors from "cors";
import express from "express";
import { errorHandler } from "./middlewares/errorHandler.js";
import mpRoutes from "./routes/mp.routes.js";

const app = express();

//Permitir CORS (comunicacion entre distintos dominios)
app.use(cors());

//Parsear datos formato JSON
app.use(express.json());

//Middleware de las rutas
app.use("/api/payment", mpRoutes);

//Middleware de manejo de errores
app.use(errorHandler);

export default app;
