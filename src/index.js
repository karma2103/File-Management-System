const express = require("express");
const app = express();
const path = require("path");
const cookieParser = require('cookie-parser');
const helmet = require("helmet")
const rateLimit = require('express-rate-limit');
const compression = require("compression")
const morgan = require("morgan")
app.use(cookieParser());
const initRoutes = require("./routes/web");

//middlerware for forms and json
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//middleware for rate-limiting
app.use(rateLimit({ windowMs: 12 * 60 * 1000, max: 100 }));

app.use(compression());
app.use(morgan("dev"));
app.use("/assets", express.static(path.join(__dirname, "public/assets")));

//View engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use('/pdfjs', express.static(path.join(__dirname, 'node_modules/pdfjs-dist/build')));

//initialize routes
initRoutes(app);
//DB connection

let port = 3000;
app.listen(port, () => {
  console.log(`Running at http://dms.local.bil:${port}`);
});
