const express = require("express");
const app = express();
const path = require("path");

const initRoutes = require("./routes/web");

//middlerware for forms and json
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//View engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

//server static files
app.use("/assets", express.static(path.join(__dirname, "views/assets")));

//initialize routes
initRoutes(app);

//DB connection

let port = 3000;
app.listen(port, () => {
  console.log(`Running at http://localhost:${port}`);
});
