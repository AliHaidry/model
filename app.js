// Init variables
const Task = require("./task.js");
const session = require("express-session");
const passport = require("passport");
const express = require("express");
const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");
bodyParser = require("body-parser");
mongoose.set('useFindAndModify', false);

// Init dotenv
require("dotenv").config();

// Init App with set / use functions
const app = express();
app.set("view engine", "ejs");
app.use(express.static("public"));
const port = 3000;
app.listen(port, function () {
  console.log(" Server is active and running " + port);
});

// Init App

app.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use(passport.session());

// setting up mongoose database

mongoose.connect("mongodb://localhost:27017/todoAppDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Setting up mongoose validation

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
});
userSchema.plugin(passportLocalMongoose);
const User = new mongoose.model("User", userSchema);

const taskSchema = new mongoose.Schema({
  name: String,
  owner: userSchema,
  creator: userSchema,
  done: Boolean,
  cleared: Boolean,
});

const assignTasks = new mongoose.model("TaskManager", taskSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

/* Verification value code required for signup */
const AUTH_VALUE = "123";

/* Managing routes */

app.get("/", function (req, res) {
  if (req.user) {
    res.redirect(307, "/todoApp");
  } else {
    res.render("login", { errorLogin: false, errorSignup: false });
  }
});

/* Register new user functionality */
app.post("/register", function (req, res) {
  let auth = req.body.authentication;
  if (auth == AUTH_VALUE) {
    User.register({ username: req.body.username }, req.body.password, function (
      err
    ) {
      if (err) {
        console.log(err + " THIS");
        res.render("login", { errorLogin: false, errorSignup: true });
      } else {
        passport.authenticate("local")(req, res, function () {
          res.redirect(307, "/todoApp");
        });
      }
    });
  } else {
    res.render("login", { errorLogin: false, errorSignup: true });
  }
});


/* navigate to todoApp page functionality with authentication */
app.post("/todoApp", function (req, res) {
  var email = req.user.username;
  assignTasks.find({}, function (err, results) {
    if (err) {
      console.log(err);
      console.log(results);
    } else {
      tasks = results;
      if (req.isAuthenticated()) {
        res.render("todoApp", { email: email, dbTasks: tasks });
      } else {
        res.redirect("/login");
      }
    }
  });
});

/* Assign task to the user */

app.get("/todoApp", function (req, res) {
  if (req.user) {
    var email = req.user.username;
    assignTasks.find({}, function (err, results) {
      if (err) {
        console.log(err);
        console.log(results);
      } else {
        tasks = results;
        if (req.isAuthenticated()) {
          res.render("todoApp", { email: email, dbTasks: tasks });
        } else {
          res.redirect("/");
        }
      }
    });
  } else {
    res.redirect("/");
  }
});

/* search unfinish task by id */

app.post("/unfinish", function (req, res) {
  var id = req.body.postID;
  assignTasks.findByIdAndUpdate(id, { $set: { done: false } }, function (err, docs) {
    if (err) {
      console.log(err);
    } else {
      res.redirect(307, "/todoApp");
    }
  });
});

/* Completed or abandon task functionailty */

app.post("/abandonorcomplete", function (req, res) {
  var id = req.body.postID;
  var abandon = req.body.abandon;
  //if abandon is set then we abandon, else we know we are changing the done condition
  if (abandon) {
    var id = req.body.postID;
    assignTasks.findByIdAndUpdate(id, { $unset: { owner: 1 } }, function (err, docs) {
      if (err) {
        console.log(err);
      } else {
        res.redirect(307, "/todoApp");
      }
    });
  } else {
    assignTasks.findByIdAndUpdate(id, { $set: { done: true } }, function (err, docs) {
      if (err) {
        console.log(err);
      } else {
        res.redirect(307, "/todoApp");
      }
    });
  }
});


/* Task to claim functionality */
app.post("/claim", function (req, res) {
  var id = req.body.postID;

  assignTasks.findByIdAndUpdate(id, { $set: { owner: req.user } }, function (
    err
  ) {
    if (err) {
      console.log(err);
    } else {
      res.redirect(307, "/todoApp");
    }
  });
});

/* Task claim functionality */
app.post("/addtask", function (req, res) {
  let entry = req.body.newTodo;
  let user = req.user;
  console.log(user);
  const task = new assignTasks({
    name: entry,
    owner: user,
    creator: user,
    done: false,
    cleared: false,
  });

  task.save(function (err) {
    if (err) console.log(err);
  });
  res.redirect(307, "/todoApp");
});


/* Removes all the tasks for user that are checked */
app.post("/purge", function (req, res) {
  assignTasks.updateMany(
    { owner: req.user, done: true },
    { $set: { cleared: true } },
    function (err, docs) {
      if (err) {
        console.log(err);
      } else {
        res.redirect(307, "/todoApp");
      }
    }
  );
});


/* Login functionality */
app.post("/login", function (req, res, next) {
  passport.authenticate("local", function (err, user, info) {
    if (err) {
      return next(err);
    }
    if (!user) {
      console.log(info);
      return res.render("login", { errorLogin: true, errorSignup: false });
    }
    req.logIn(user, function (err) {
      if (err) {
        return next(err);
      }
      return res.redirect(307, "/todoApp");
    });
  })(req, res, next);
});


/* Logout functionality */
app.get("/logout", function (req, res) {
  req.logout();
  res.redirect("/");
});
