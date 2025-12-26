const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");

const app = express();
app.use(cors());
app.use(express.json());

connectDB();

// ROUTES
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/host", require("./routes/hostRoutes"));
app.use("/api/charging", require("./routes/chargingRoutes"));
app.use("/api/payment", require("./routes/paymentRoutes"));

app.listen(5000, () => {
  console.log("EV Buddy backend running on port 5000");
});
