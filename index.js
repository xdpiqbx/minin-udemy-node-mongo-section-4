const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const Handlebars = require('handlebars');
const exphbs = require('express-handlebars');
const {
  allowInsecurePrototypeAccess,
} = require('@handlebars/allow-prototype-access');
const homeRoutes = require('./routes/home');
const coursesRoutes = require('./routes/courses');
const addRoutes = require('./routes/add');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/order');

const User = require('./models/schemas/schUser');

const app = express();

const hbs = exphbs.create({
  defaultLayout: 'main',
  extname: 'hbs',
  handlebars: allowInsecurePrototypeAccess(Handlebars),
});

app.engine('hbs', hbs.engine); // тут зарегистрировал что есть такой движ
app.set('view engine', 'hbs'); // тут прямо указываю какой движ использую
app.set('views', 'views'); // Тут указываю название папки где лежат шаблоны ('views' это по умолчанию)

app.use(async (req, res, next) => {
  try {
    const user = await User.findById('605c298993a6da28205e86cd');
    req.user = user;
    next();
  } catch (e) {
    console.log(e);
  }
});

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use('/', homeRoutes);
app.use('/courses', coursesRoutes);
app.use('/add', addRoutes);
app.use('/cart', cartRoutes);
app.use('/order', orderRoutes);

const PORT = process.env.PORT || 3000;

async function start() {
  const pwd = 'Qq5uZAazaPottk2p';
  const clr = 'minin-cluster';
  const db = 'coursesShop';
  const url = `mongodb+srv://werdex:${pwd}@${clr}.lag7a.mongodb.net/${db}?retryWrites=true&w=majority`;

  try {
    await mongoose.connect(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
    });
    const candidate = await User.findOne();
    if (!candidate) {
      const user = new User({
        email: 'fish@mail.com',
        name: 'John Fishman',
        cart: { items: [] },
      });
      await user.save();
    }
    app.listen(3000, () => {
      console.log(`Server is runing on port ${PORT}`);
    });
  } catch (error) {
    console.log(error);
  }
}

start();
