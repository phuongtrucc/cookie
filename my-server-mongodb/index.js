const express = require('express');
const app = express();
const port = 3002;
const morgan = require("morgan");
const bodyParser = require("body-parser");
const cors = require("cors");
const { MongoClient, ObjectId } = require('mongodb');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');

// Middleware setup
app.use(morgan("combined"));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb' }));
app.use(cookieParser());
app.use(session({
    secret: "Shh, its a secret!",
    resave: false,
    saveUninitialized: true,
}));

// MongoDB Client setup
const client = new MongoClient("mongodb://127.0.0.1:27017");
client.connect();
const database = client.db("FashionData");
const fashionCollection = database.collection("Fashion");
const userCollection = database.collection("User");

// Mongoose setup for additional collection if needed
mongoose.connect('mongodb://localhost:27017/my-server-mongodb', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// User Schema for mongoose
const UserSchema = new mongoose.Schema({
  username: String,
  password: String, // Recommend encrypting passwords
});
const User = mongoose.model('User', UserSchema);

// Cookie-session setup
app.use(
  cookieSession({
    name: 'session',
    keys: ['secretKey'],
    maxAge: 24 * 60 * 60 * 1000,
  })
);

// Routes
app.get("/", (req, res) => {
    res.send("This Web server is processed for MongoDB");
});

app.get("/fashions", cors(), async (req, res) => {
    const result = await fashionCollection.find({}).toArray();
    res.send(result);
});

app.post("/register", async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await userCollection.findOne({ username, password });
        if (user) {
            res.status(200).send({ message: "User found", user });
        } else {
            res.status(404).send({ message: "User not found" });
        }
    } catch (error) {
        res.status(500).send(error);
    }
});

app.get("/fashions/:id", cors(), async (req, res) => {
    var o_id = new ObjectId(req.params["id"]);
    const result = await fashionCollection.find({ _id: o_id }).toArray();
    res.send(result[0]);
});

app.post("/fashions", cors(), async (req, res) => {
    try {
        const fashion = req.body;
        await fashionCollection.insertOne(fashion);
        res.status(201).send(fashion);
    } catch (error) {
        res.status(500).send(error);
    }
});

app.get("/create-cookie", cors(), (req, res) => {
    res.cookie("username", "tranduythanh");
    res.cookie("password", "123456");
    const account = { username: "tranduythanh", password: "123456" };
    res.cookie("account", account);
    res.send("cookies are created");
});

app.get("/read-cookie", cors(), (req, res) => {
    const { username, password, account } = req.cookies;
    let infor = `username = ${username}<br/>password = ${password}<br/>`;
    if (account != null) {
        infor += `account.username = ${account.username}<br/>account.password = ${account.password}<br/>`;
    }
    res.send(infor);
});

app.get("/clear-cookie", cors(), (req, res) => {
    res.clearCookie("account");
    res.send("[account] Cookie is removed");
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username, password });
    if (user) {
        req.session.user = { id: user._id, username: user.username };
        res.json({ message: 'Login successful' });
    } else {
        res.status(401).json({ message: 'Invalid username or password' });
    }
});

app.get('/check-login', (req, res) => {
    if (req.session.user) {
        res.json({ loggedIn: true, username: req.session.user.username });
    } else {
        res.json({ loggedIn: false });
    }
});

app.post('/logout', (req, res) => {
    req.session = null;
    res.json({ message: 'Logged out successfully' });
});

// Start server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
