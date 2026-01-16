const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const stationRoutes = require("./routes/stationRoutes");
const app = express();

// app.use(cors({
//   origin:"http://192.168.1.46:5173",
//   credentials: true,
// }));


app.use(cors({
  origin:"http://localhost:5173",
  credentials: true,
}));

app.use(express.json());
app.use("/uploads", express.static("uploads"));


connectDB();

app.get('/', (req, res) => {
  res.send('EV Buddy Backend is running');
});

// ROUTES
app.use("/api/stations", stationRoutes);
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/host", require("./routes/hostRoutes"));
app.use("/api/charging", require("./routes/chargingRoutes"));
app.use("/api/payment", require("./routes/paymentRoutes"));
app.use("/api/stations", require("./routes/stationRoutes"));
app.use(
  "/api/chargingrequest",
  require("./routes/chargingRequestRoutes")
);

app.listen(5000, () => {
  console.log("EV Buddy backend running on port 5000");
});
