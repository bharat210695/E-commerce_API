const express = require("express");
const bodyParser = require("body-parser");
const { default: mongoose } = require("mongoose");
const createError = require("http-errors");
const cookieParser = require("cookie-parser");
const app = express();
var morgan = require("morgan");
var cors = require("cors");
const serverless = require("serverless-http");

require("dotenv").config();
app.use(cors());
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.set("view engine", "ejs");

// router...............
const testRoute = require("./src/routes/test");
const adminRoute = require("./src/routes/adminRoute");
const vendorRoute = require("./src/routes/vendorRoute");
const deliveryPartnerRoute = require("./src/routes/deliveryPartnerRoute");
const reviewRoute = require("./src/routes/reviewsRoute");
const userRoute = require("./src/routes/userRoute");

//temp route
const scrapeRoute = require("./src/routes/scrapeRoute");

mongoose
    .connect(process.env.MONGODB_URL, {
        useNewUrlParser: true,
    })
    .then(() => console.log("MongoDb is connected"))
    .catch((err) => console.log(err));

app.use(morgan("dev"));
const baseApi = "api/v1";

app.get("/", (req, res) => {
    res.render("index");
});
app.use(`/${baseApi}/admin`, adminRoute);
app.use(`/${baseApi}/vendor`, vendorRoute);
app.use(`/${baseApi}/delivery-partner`, deliveryPartnerRoute);
app.use(`/${baseApi}/review`, reviewRoute);
app.use(`/${baseApi}/user`, userRoute);

//temp route
app.use(`/${baseApi}/scrape`, scrapeRoute);

app.use((res, req, next) => {
    return next(createError(404, "Route Not Found!"));
});

app.use((error, req, res, next) => {
    return res.status(error.status || 500).json({
        status: false,
        message: error.message,
    });
});

app.listen(process.env.PORT || 3000, function() {
    console.log("Express app running on port " + (process.env.PORT || 3000));
});

module.exports.handler = serverless(app);