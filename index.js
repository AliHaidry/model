/*
const express = require('express');
const path = require('path');
const cons = require('consolidate');

// Init app
const app = express();

// Load view engine 
app.engine('html', cons.swig)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');

// Routes 


// Home route
app.get('/', function (req, res) {
    res.render('index.html')
});


// todo route
app.get('/todo', function (req, res) {
    res.render('todo.html')
});


// Set public folder
app.use(express.static(path.join(__dirname, 'public')));



app.listen(3000, function() {
    console.log("server started on port 3000...")
})
*/