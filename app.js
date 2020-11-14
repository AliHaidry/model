const express = require("express");
const User = require("./user.js");
const Task = require("./task.js");
var fs = require("fs");
bodyParser = require("body-parser");

/* Verification value */
const AUTH_VALUE = "123";

/* Port running on */
const port = 3000;

/* Init app */
const app = express();
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.listen(port, function () {
  console.log(" server is active and running on " + port);
});




/* NEW USERS FOR TESTING PURPOSE */

function createJsonString() {
  var jsonStoreOjbect = {
    Users: [],
    Tasks: [],
  };

  jsonStoreOjbect.Users.push({
    username: "test123@abc.com",
    password: "password1",
  });
  jsonStoreOjbect.Users.push({
    username: "test2@abc.com",
    password: "password2",
  });

  jsonStoreOjbect.Tasks.push({
    id: 10,
    name: "claimed by testuser1 and unfinished",
    owner: "test123@abc.com",
    creator: "testuser1",
    done: false,
    cleared: false,
  });
  jsonStoreOjbect.Tasks.push({
    id: 20,
    name: "claimed by testuser2 and unfinished",
    owner: "test2@abc.com",
    creator: "test123@abc.com",
    done: false,
    cleared: false,
  });
  jsonStoreOjbect.Tasks.push({
    id: 30,
    name: "claimed by testuser1 and finished",
    owner: "test123@abc.com",
    creator: "test2@abc.com",
    done: true,
    cleared: false,
  });
  jsonStoreOjbect.Tasks.push({
    id: 40,
    name: "claimed by testuser2 and finished",
    owner: "test2@abc.com",
    creator: "test2@abc.com",
    done: true,
    cleared: false,
  });
  jsonStoreOjbect.Tasks.push({
    id: 50,
    name: "unclaimed",
    creator: "test2@abc.com",
    done: false,
    cleared: false,
  });

  var jsonString = JSON.stringify(jsonStoreOjbect);
  return jsonString;
}

createFileWX("./todo.json");
var jsonDatabase = JSON.parse(fs.readFileSync("./todo.json", "utf8"));

/* Login route */
app.get("/", function (req, res) {
  res.render("login", { errorLogin: false, errorSignup: false });
});

/*Sign up and verification route */
app.post("/register", function (req, res) {
  let auth = req.body.authentication;
  let email = req.body.email;
  let password = req.body.password;

  for (var user of jsonDatabase["Users"]) {
    if (email == user.username) {
      res.render("login", { errorLogin: false, errorSignup: true });
      return;
    }
  }
  if (auth != AUTH_VALUE) {
    res.render("login", { errorLogin: false, errorSignup: true });
  } else {
    userAdded = new User(email, password);
    jsonDatabase["Users"].push(userAdded);
    fs.writeFileSync("./todo.json", JSON.stringify(jsonDatabase));
    res.render("todo", { email: email, taskDatabase: jsonDatabase["Tasks"] });
  }
});

/* Sign In and navigate's  to todo list page */
app.post("/login", function (req, res) {
  var email = req.body.email;
  var password = req.body.password;
  for (var user of jsonDatabase["Users"]) {
    if (email == user.username) {
      if (password == user.password) {
        res.redirect(307, "/todo");
        return;
      } else {
        signInError = true;
      }
    }
  }
  res.render("login", { errorLogin: true, errorSignup: false });
});

/* todo list route */
app.post("/todo", function (req, res) {
  var email = req.body.email;
  res.render("todo", { email: email, taskDatabase: jsonDatabase["Tasks"] });
});



/*Function to create files */ 
function createFileWX(filename) {
  json = createJsonString();
  try {
    fs.writeFileSync(filename, json, { flag: "wx" });
  } catch (errs) {}
}

/* ID matching function */
function findJsonIndex(json, id) {
  for (var i = 0; i < json.length; i++) {
    if (json[i].id == id) {
      return i;
    }
  }

  return -1;
}


/*Unfinish tasks */
app.post("/unfinish", function (req, res) {
  var id = req.body.postID;
  var email = req.body.email;
  for (var i = 0; i < jsonDatabase["Tasks"].length; i++) {
    if (jsonDatabase["Tasks"][i].id == id) {
      jsonDatabase["Tasks"][i].done = false;
    }
  }
  fs.writeFileSync("./todo.json", JSON.stringify(jsonDatabase));
  res.redirect(307, "/todo");
});

app.post("/abandonorcomplete", function (req, res) {
  var id = req.body.postID;
  var abandon = req.body.abandon;
  var email = req.body.email;
 

  for (var i = 0; i < jsonDatabase["Tasks"].length; i++) {
    if (jsonDatabase["Tasks"][i].id == id) {
      var index = i;
    }
  }

  /*logic for abandon */
  if (abandon) {
    delete jsonDatabase["Tasks"][index].owner;
  } else {
    jsonDatabase["Tasks"][index].done = true;
  }

  fs.writeFileSync("./todo.json", JSON.stringify(jsonDatabase));
  res.redirect(307, "/todo");
});

/*task claims for */ 
app.post("/claim", function (req, res) {
  var id = req.body.postID;
  var email = req.body.currentUser;
  var index = findJsonIndex(jsonDatabase["Tasks"], id);
  jsonDatabase["Tasks"][index].owner = email;
  fs.writeFileSync("./todo.json", JSON.stringify(jsonDatabase));
  res.render("todo", { email: email, taskDatabase: jsonDatabase["Tasks"] }); 
});

/*Adds task thus claims */
app.post("/addtask", function (req, res) {
  let entry = req.body.newTodo;
  let user = req.body.currentUser;

  let jsonSize = jsonDatabase["Tasks"].length;

  let nextIndex = jsonDatabase["Tasks"][jsonSize - 1]["id"] + 1;

  taskAdded = new Task(nextIndex, entry, user, user, false, false);
  jsonDatabase["Tasks"].push(taskAdded);
  fs.writeFileSync("./todo.json", JSON.stringify(jsonDatabase));
  res.render("todo", { email: user, taskDatabase: jsonDatabase["Tasks"] }); //would be better with sessions vars
});

/*Remove all the selected tasks */
app.post("/purge", function (req, res) {
  let user = req.body.currentUser;

  for (var i = 0; i < jsonDatabase["Tasks"].length; i++) {
    if (
      jsonDatabase["Tasks"][i].owner == user &&
      jsonDatabase["Tasks"][i].done == true
    ) {
      jsonDatabase["Tasks"][i].cleared = true;
    }
  }

  fs.writeFileSync("./todo.json", JSON.stringify(jsonDatabase));
  res.render("todo", { email: user, taskDatabase: jsonDatabase["Tasks"] });
});

/* logout redirect */
app.get("/logout", function (req, res) {
  res.redirect(307, "/");
});




