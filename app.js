const   express     = require("express"),
        app         = express(),
        bodyParser  = require("body-parser"),
        mongoose    = require("mongoose"),
        Campground  = require("./models/campgrounds"),
        seedDB      = require("./seeds"),
        Comment     = require("./models/comment"),
        passport    = require("passport"),
        LocalStrategy = require("passport-local"),
        User        = require("./models/user")



//connect mongodb using mongoose 
mongoose.connect("mongodb://localhost:27017/yelp_camp", {useNewUrlParser: true});
// use body-parser on requests
app.use(bodyParser.urlencoded({extended: true}));
// sets app to expect .ejs files by default
app.set("view engine", "ejs")
// tells the app to serve the /public directory
app.use(express.static(__dirname + "/public"));

// function to seed the database
seedDB();


// PASSPORT CONFIG
app.use(require("express-session")({
    secret: "We dont have tater tots in england",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Route for landing page
app.get("/",function(req, res){
    res.render("landing")
})

// Route for campgrounds page
app.get("/campgrounds", function(req, res){
    // get all campgrounds from the database
    Campground.find({}, function(err, allcampgrounds){
        if(err){
            console.log("Error -" + err);
        }
        else{
            res.render("campgrounds/index", {campgrounds: allcampgrounds});
        }
    });
});

// CREATE campground Route
app.post("/campgrounds", function(req, res){
    // get data from form and add to campgrounds array
    let name = req.body.name
    let image = req.body.image
    let desc = req.body.description
    let newCampground = {name:name, image:image, description: desc}
    // create a new Campground and save to db
    Campground.create(newCampground, function(err, createdcampground){
        if(err){
            console.log("error -"+ err);
        }
        else{
            // redirect back to /campgrounds page
            res.redirect("/campgrounds");
            }
    });
});

// NEW campground route
app.get("/campgrounds/new",function(req, res){
   res.render("campgrounds/new"); 
});

// SHOW Route - shows info about one specific campground
app.get("/campgrounds/:id", function(req, res) {
    // find the campground with the provided ID
    Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground){
        if(err){
            console.log("Error ")
        }
        // show a page with info about that campground
        else{
            res.render("campgrounds/show", {campground: foundCampground});
        }
    })
})

// ====================================================
// COMMENTS ROUTES
// ===================================================

// NEW comments route

app.get("/campgrounds/:id/comments/new", function(req, res) {
    Campground.findById(req.params.id, function(err, campground){
        if(err){
            console.log(err)
        }
        else{
            res.render("comments/new", {campground: campground});
        }
    })
});

// CREATE NEW COMMENTS ROUTE

app.post("/campgrounds/:id/comments", function(req, res){
    Campground.findById(req.params.id, function(err, campground){
        if(err){
            console.log(err);
            res.redirect("/campgrounds")
        }
        else{
            Comment.create(req.body.comment, function(err, comment){
                if(err){
                    console.log(err);
                }
                else{
                    campground.comments.push(comment);
                    campground.save();
                    res.redirect("/campgrounds/"+campground._id)
                }
            })
        }
    })
})

// ===========================
// AUTH ROUTES
// ===========================

// Shows register form
app.get("/register", function(req, res) {
    res.render("register");
})

// Handles sign up logic
app.post("/register", function(req, res) {
    let newUser = new User({username: req.body.username});
    User.register(newUser, req.body.password, function(err, user){
        if(err){
            console.log(err)
            return res.render("register");
        }
            passport.authenticate("local")(req, res, function(){
                res.redirect("/campgrounds");
            })
        
    })
})

// show login form

app.get("/login", function(req, res) {
    res.render("login");
})

// login logic route

app.post("/login", passport.authenticate("local", {
    successRedirect: "/campgrounds",
    failureRedirect: "/login"
}), function(req, res) {
    
})


// sets up listener for server
app.listen(process.env.PORT, process.env.IP, function(){
    console.log("YelpCamp Server is up and running!")
})