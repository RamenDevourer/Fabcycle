const express = require("express");
require('dotenv').config()
const mongoose = require("mongoose");
const cheerio = require("cheerio");
const UserSell = require("./sell_data");
const UserContact = require("./contact-us_data");
const UserLogin = require("./user_login");
const Products = require("./products");
const Reviews = require("./review");
const session = require("express-session");
const nodemailer = require("nodemailer");

const app = express();
var ejs = require('ejs');
const port = 3000;
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
mongoose.connect(process.env.MONGODB_URL);

app.use(
  session({
    secret: "session-key",
    resave: false,
    saveUninitialized: true,
  })
);

app.post("/register", async (req, res) => {
  const body = req.body;
  console.log(body);
  const userDataRegister = req.body;
  await UserLogin.create({
    _id: new mongoose.Types.ObjectId(),
    username: userDataRegister.username,
    password: userDataRegister.password,
    firstName: userDataRegister.firstName,
    lastName: userDataRegister.lastName,
    email: userDataRegister.email,
    address: userDataRegister.address,
    address2: userDataRegister.address2,
    country: userDataRegister.country,
    state: userDataRegister.state,
    pinCode: userDataRegister.pinCode,
  });
  res.redirect("/login");
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  console.log(req.body);
  UserLogin.findOne({ username: username }, (err, user) => {
    if (err) {
      console.error(err);
      res.status(500);
      return;
    }
    if (!user) {
      res.redirect("/error_user");
      res.status(401);
    } else if (user.password === password) {
      // Passwords match, user is authenticated
      req.session.user = user;
      req.session.username = username;
      console.log(req.session.user);
      res.redirect("/");
      res.status(200);
    } else {
      res.redirect("/error_user");
      res.status(401);
    }
  });
});

run();
async function run() {
  try {
    const userSell = await UserSell.where().limit(1);
    console.log(userSell[0].firstName);
  } catch (e) {
    console.log(e.message);
  }
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "fabcycle2@gmail.com",
    pass: "qzpp dkmx hjkw nezg ",
  },
});

app.get("/", (req, res) => {
  if (req.session.user) {
    const user = req.session.user;
    const username = req.session.username;
    return res.render("index.ejs", { username, user });
  } else {
    const user = 0;
    const username = 0;
    return res.render("index.ejs", { username, user });
  }
});

app.get("/index.html", (req, res) => {
  res.redirect("/");
});

app.get("/register", (req, res) => {
  res.render("register.ejs");
});

app.get("/login", (req, res) => {
  if (req.session.user) {
    // User is authenticated, proceed with rendering the dashboard
    const user = req.session.user;
    const username = req.session.username;
    res.render("logout.ejs", { username, user });
  } else {
    // User is not authenticated, redirect to the login page
    res.render("login.ejs");
  }
});

app.get("/error_user", (req, res) => {
  res.render("error_user.ejs");
});

app.get("/a2cart", (req, res) => {
  res.render("a2cart.ejs");
});

app.get("/dashboard", (req, res) => {
  if (req.session.user) {
    // User is authenticated, proceed with rendering the dashboard
    res.render("buy.ejs");
  } else {
    // User is not authenticated, redirect to the login page
    res.redirect("/login");
  }
});

app.get("/logout", (req, res) => {
  if (req.session.user) {
    const user = req.session.user;
    const username = req.session.username;
    res.render("logout.ejs", { username, user });
  } else {
    // User is not authenticated, redirect to the login page
    res.render("login.ejs");
  }
});

app.get("/logout/button", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error logging out:", err);
    }
    // Redirect the user to a login page or any other appropriate page
    res.redirect("/login");
  });
});

app.get("/about", (req, res) => {
  res.render("about.ejs");
});

async function getAllProducts() {
  try {
    const productsArray = await Products.find({}).sort({ card: 1 });
    return productsArray;
  } catch (error) {
    console.error("Error fetching products:", error);
    throw error;
  }
}

app.get("/buy.html", async (req, res) => {
  const products = await getAllProducts();
  console.log(products);
  if (req.session.user) {
    const user = req.session.user;
    const username = req.session.username;
    return res.render("buy.ejs", { username, user, products });
  } else {
    const user = 0;
    const username = 0;
    return res.render("buy.ejs", { username, user, products });
  }
});

async function fetchReviews(productCard) {
  try {
    const reviews = await Reviews.find({ card: productCard })
      .sort({ createdAt: -1 })
      .limit(12)
      .exec();
    return reviews;
  } catch (error) {
    console.error(error);
  }
}

async function getAllUserLogins() {
  try {
    const userLogins = await UserLogin.find({});
    return userLogins;
  } catch (err) {
    console.error(err);
  }
}

function roundToNearestHalf(number) {
  return Math.round(number * 2) / 2;
}

app.get("/product", async (req, res) => {
  const product = req.query.product;
  const products = await getAllProducts();
  const review_send = await fetchReviews(products[product - 1]["card"]);
  var total_Rating = 0;
  var num_Rating = 0;
  var avg_Rating = 0;
  review_send.forEach((item) => {
    total_Rating += item["rating"];
    num_Rating += 1;
  });
  avg_Rating = total_Rating / num_Rating;
  avg_Rating = roundToNearestHalf(avg_Rating);
  console.log(avg_Rating);
  const users = await getAllUserLogins();
  return res.render("product_page.ejs", {
    product: products[product - 1],
    products,
    reviews: review_send,
    users,
    avg_Rating,
  });
});

app.get("/cart", async (req, res) => {
  if (req.session.user) {
    const userId = req.session.user._id; //creating new session
    UserLogin.findOne({ _id: userId }, (err, user) => {
      req.session.user = user;
      req.session.save();
    });
    const user = req.session.user;
    const username = req.session.username;
    const cart = [
      { card: "1", quantity: user.card1 },
      { card: "2", quantity: user.card2 },
      { card: "3", quantity: user.card3 },
      { card: "4", quantity: user.card4 },
      { card: "5", quantity: user.card5 },
      { card: "6", quantity: user.card6 },
      { card: "7", quantity: user.card7 },
      { card: "8", quantity: user.card8 },
      { card: "9", quantity: user.card9 },
    ];

    const filteredCart = cart.filter((item) => item.quantity > 0);

    const selectedItems = [];

    const items = await Products.find({
      card: { $in: filteredCart.map((item) => item.card) },
    }).exec();

    items.forEach((item) => {
      const matchingCartItem = filteredCart.find(
        (cartItem) => cartItem.card === item.card
      );
      if (matchingCartItem) {
        selectedItems.push({
          ...item.toObject(),
          quantity: matchingCartItem.quantity,
        });
      }
    });

    console.log(typeof selectedItems);

    res.render("cart.ejs", {
      username,
      user,
      cart: selectedItems,
    });
  } else {
    const user = 0;
    const username = 0;
    return res.redirect("/login");
  }
});

app.post("/cart", async (req, res) => {
  const body = req.body;
  console.log(body);
  const userDataSell = req.body;
  if (req.session.user) {
    if (body.action === "decrease") {
      const userIdToUpdate = req.session.user._id;
      const incrementValue = -1;
      console.log(userIdToUpdate);
      const updateField = body.product;
      const updateQuery = {
        $inc: { [updateField]: incrementValue },
      };
      UserLogin.updateOne(
        { _id: userIdToUpdate },
        updateQuery,
        (err, result) => {
          if (err) {
            console.error(`Error updating ${updateField}:`, err);
          } else {
            console.log(`${updateField} field incremented successfully.`);
          }
        }
      );
      return res.redirect("/cart");
    } else if (body.action === "increase") {
      {
        const userIdToUpdate = req.session.user._id;
        const incrementValue = 1;
        console.log(userIdToUpdate);
        const updateField = body.product;
        const updateQuery = {
          $inc: { [updateField]: incrementValue },
        };
        UserLogin.updateOne(
          { _id: userIdToUpdate },
          updateQuery,
          (err, result) => {
            if (err) {
              console.error(`Error updating ${updateField}:`, err);
            } else {
              console.log(`${updateField} field incremented successfully.`);
            }
          }
        );
        return res.redirect("/cart");
      }
    }
    return res.redirect("/logout");
  } else {
    // User is not authenticated, redirect to the login page
    return res.redirect("/login");
  }
});

app.post("/checkout", (req, res) => {
  console.log(req.body);
  const mailOptions = {
    from: "fabcycle2@gmail.com",
    to: "ramen5898@gmail.com",
    subject: "Contact Us Form",
    text: `Thank You for shopping with Fabcycle your order will be delivered in 5-7 business days`,
  };
  transporter.sendMail(mailOptions);
  if (req.body.paymentMethod === "upi") {
    return res.redirect("/upi");
  } else {
    return res.redirect("/completed");
  }
});

app.get("/upi", (req, res) => {
  res.render("upi.ejs");
});

app.get("/completed", (req, res) => {
  res.render("completed.ejs");
});

app.get("/sell.html", (req, res) => {
  if (req.session.user) {
    const user = req.session.user;
    const username = req.session.username;
    return res.render("sell.ejs", { username, user });
  } else {
    const user = 0;
    const username = 0;
    return res.redirect("/login");
  }
});

app.get("/contact-us.html", (req, res) => {
  if (req.session.user) {
    const user = req.session.user;
    const username = req.session.username;
    return res.render("contact-us.ejs", { username, user });
  } else {
    const user = 0;
    const username = 0;
    return res.render("contact-us.ejs", { username, user });
  }
});

app.get("/checkout", (req, res) => {
  if (req.session.user) {
    const user = req.session.user;
    const username = req.session.username;
    const receivedData = req.query.data;
    return res.render("checkout.ejs", {
      username,
      user,
      product: receivedData,
    });
  } else {
    const user = 0;
    const username = 0;
    return res.render("checkout.ejs", { username, user });
  }
});

app.post("/contact-us.html", async (req, res) => {
  const body = req.body;
  console.log(body);
  const userDataContact = req.body;
  await UserContact.create({
    name: userDataContact.name,
    email: userDataContact.email,
    subject: userDataContact.subject,
    message: userDataContact.message,
  });
  const mailOptions1 = {
    from: "fabcycle2@gmail.com",
    to: `fabcycle2@gmail.com`,
    subject: "Contact Us Form",
    text: `Name: ${userDataContact.name}\n
    Email: ${userDataContact.email}\n
    Subject: ${userDataContact.subject}\n
    Message: ${userDataContact.message}`,
  };
  transporter.sendMail(mailOptions1);
  const mailOptions2 = {
    from: "fabcycle2@gmail.com",
    to: `${userDataContact.email}`,
    subject: "Thank You for Reaching Out!",
    text: `Dear ${userDataContact.name},\n\n
    I trust this email finds you well. I wanted to express my sincere gratitude for taking the time to submit the contact form on our website. Your inquiry is important to us, and we appreciate the opportunity to assist you.
    Our team has received your message and is currently reviewing the details. Please be assured that we will make every effort to respond to your inquiry as promptly as possible.
    We value the interest you've shown in Fabcycle, and we are committed to providing you with the best possible support. If there's any additional information you'd like to share or if you have further questions, please don't hesitate to reply to this email.\n\n
    Thank you once again for choosing Fabcycle. We look forward to the opportunity to serve you, and we appreciate your trust in us.\n\n
    Best regards,\n
    Team at Fabcycle`,
  };
  transporter.sendMail(mailOptions2);
  res.redirect("contact-us.html");
});

app.post("/sell.html", async (req, res) => {
  const body = req.body;
  console.log(body);
  const userDataSell = req.body;
  await UserSell.create({
    firstName: userDataSell.firstName,
    lastName: userDataSell.lastName,
    username: userDataSell.username,
    email: userDataSell.email,
    address: userDataSell.address,
    address2: userDataSell.address2,
    country: userDataSell.country,
    state: userDataSell.state,
    pinCode: userDataSell.pinCode,
    useSavedAddress: userDataSell.useSavedAddress,
    reward: userDataSell.paymentMethod,
    fabricType: userDataSell.cloth,
    condition: userDataSell.quality,
  });
  const mailOptions = {
    from: "fabcycle2@gmail.com",
    to: "ramen5898@gmail.com",
    subject: "Fabcycle",
    text: `Thank You for selling with Fabcycle your ${userDataSell.cloth} in ${userDataSell.quality} condition will be collected in 5-7 business days`,
  };
  transporter.sendMail(mailOptions);
  res.redirect("sell.html");
});

app.post("/buy.html", async (req, res) => {
  const body = req.body;
  console.log(body);
  const userDataSell = req.body;
  if (req.session.user) {
    // User is authenticated, proceed with rendering the dashboard
    if (body.action === "cart") {
      const userIdToUpdate = req.session.user._id;
      const incrementValue = 1;
      console.log(userIdToUpdate);
      const updateField = body.product;
      const updateQuery = {
        $inc: { [updateField]: incrementValue },
      };
      UserLogin.updateOne(
        { _id: userIdToUpdate },
        updateQuery,
        (err, result) => {
          if (err) {
            console.error(`Error updating ${updateField}:`, err);
          } else {
            console.log(`${updateField} field incremented successfully.`);
          }
        }
      );
      return res.redirect("/a2cart");
    } else if (body.action === "buy") {
      return res.redirect(`/checkout?data=${body.product}`);
    }
    return res.redirect("/logout");
  } else {
    // User is not authenticated, redirect to the login page
    return res.redirect("/login");
  }
});

app.post("/product", async (req, res) => {
  const body = req.body;
  console.log(body);
  const userDataSell = req.body;
  if (req.session.user) {
    // User is authenticated, proceed with rendering the dashboard
    if (body.action === "cart") {
      const userIdToUpdate = req.session.user._id;
      const incrementValue = 1;
      console.log(userIdToUpdate);
      const updateField = body.product;
      const updateQuery = {
        $inc: { [updateField]: incrementValue },
      };
      UserLogin.updateOne(
        { _id: userIdToUpdate },
        updateQuery,
        (err, result) => {
          if (err) {
            console.error(`Error updating ${updateField}:`, err);
          } else {
            console.log(`${updateField} field incremented successfully.`);
          }
        }
      );
      return res.redirect("/a2cart");
    } else if (body.action === "buy") {
      return res.redirect(`/checkout?data=${body.product}`);
    } else if (body.action === "review") {
      console.log(req.session.user["username"]);
      await Reviews.create({
        _id: new mongoose.Types.ObjectId(),
        card: req.body.card,
        rating: req.body.rating,
        headline: req.body.headline,
        review: req.body.review,
        username: req.session.user["username"],
      });
      return res.redirect(`/product?product=${req.body.card}`);
    }
    return res.redirect("/logout");
  } else {
    // User is not authenticated, redirect to the login page
    return res.redirect("/login");
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
