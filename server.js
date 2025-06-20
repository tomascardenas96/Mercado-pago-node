import { config } from "dotenv";
import app from "./src/app.js";
config();

app.get("/", (req, res) => {
  res.send("Hello World!!!");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port http://localhost:${PORT} 🚀`);
});
