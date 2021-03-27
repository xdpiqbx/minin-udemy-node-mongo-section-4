# Section 4: Практика: База данных MongoDB

## 50. Вывод заказов

```hbs
<!-- /views/order.hbs -->
<h1>Orders</h1>
{{#if orders.length}}
  {{#each orders}}
    Order <small>{{_id}}</small>
    <p class="date">Date: {{date}}</p>
    <p><em>{{user.userId.name}}</em> ({{user.userId.email}})</p>
      {{#each courses}}
        {{course.title}} x <strong>{{count}}</strong>
      {{/each}}
    <p>Total price: <span class="price">{{price}}</span> </p>
  {{/each}}
{{else}}
  <p>There is no orders</p>
{{/if}}
```

```js
// /public/app.js // настройка нормального отображения даты
const toDate = date => {
  return new Intl.DateTimeFormat('en-En', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(date));
};

document
  .querySelectorAll('.date')
  .forEach(node => (node.textContent = toDate(node.textContent)));
```

## 49. Получение данных заказов

```js
// /routes/order.js создаю путь
const { Router } = require('express');
const Order = require('../models/schemas/schOrder');
const router = Router();

router.get('/', async (req, res) => {
  res.status(200);
  res.render('order.hbs', {
    title: 'Orders',
    isOrder: true,
  });
});

router.post('/', async (req, res) => {
  try {
    const user = await req.user.populate('cart.items.courseId').execPopulate();

    const courses = user.cart.items.map(item => ({
      count: item.count,
      course: { ...item.courseId._doc },
    }));

    const order = new Order({
      courses,
      user: {
        name: req.user.name,
        userId: req.user,
      },
    });

    await order.save();
    await req.user.clearCart();

    res.redirect('/order'); // этот редирект это get запрос
  } catch (e) {
    console.log(e);
  }
});

module.exports = router;
```

```js
// /routes/order.js нормально описываю get запрос
router.get('/', async (req, res) => {
  try {
    const userOrders = await Order.find({
      'user.userId': req.user._id,
    }).populate('user.userId');

    const orders = userOrders.map(order => {
      return {
        ...order._doc,
        price: order.courses.reduce((total, { count, course }) => {
          return (total += count * course.price);
        }, 0),
      };
    });

    await res.status(200);
    res.render('order.hbs', {
      title: 'Orders',
      isOrder: true,
      orders,
    });
  } catch (e) {
    console.log(e);
  }
});
```

## 48. Подготовка страницы заказов

```hbs
<!-- /views/cart.hbs после суммы заказа добавляю форму с кнопкой заказа -->
  <p><strong>Price:</strong><span class="price">{{price}}</span></p>
  <form action="/order" method="post">
    <button type="submit" class="btn">Create order</button>
  </form>
```

```hbs
<!-- /views/partials/navbar.hbs добавляю ссылку в навигацию -->
{{#if isOrder}}
  <li class="active"><a href="/order">Cart</a></li>
{{else}}
  <li><a href="/order">Cart</a></li>
{{/if}}
```

```js
// /models/schemas/schOrder.js описываю схему заказа (кто что и когда заказал)
const { Schema, model } = require('mongoose');

const orderSchema = new Schema({
  courses: [
    {
      course: {
        type: Object,
        required: true,
      },
      count: {
        type: Number,
        required: true,
      },
    },
  ],
  user: {
    name: String,
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = model('Order', orderSchema);
```

```js
// /routes/order.js создаю путь
const { Router } = require('express');
const Order = require('../models/schemas/schOrder');
const router = Router();

router.get('/', async (req, res) => {
  res.status(200);
  res.render('order.hbs', {
    title: 'Orders',
    isOrder: true,
  });
});

router.post('/', async (req, res) => {
  res.redirect('/order');
});

module.exports = router;
```

```hbs
<!-- /views/order.hbs описываю views -->
```

```js
// index.js добавляю путь
const orderRoutes = require('./routes/order');
app.use('/order', orderRoutes);
```

Осталось создать логику контроллера и описать шаблон

---

## 47. Трансформация данных на клиенте

```js
// /schemas/schCourse.js
const { Schema, model } = require('mongoose');

const courseSchema = new Schema({ .... });
// ---------------------------------------------------
courseSchema.method('toClient', function () {
  const course = this.toObject();
  course.id = course._id; // просто перезаписываю _id в id
  delete course._id; // удаляю _id
  return course;
});
// ---------------------------------------------------
module.exports = model('Course', courseSchema);
```

```js
// /routes/cart.js
function mapCartItems(cart) {
  return cart.map(item => ({
    ...item.courseId._doc,
    id: item.courseId.id, // вытягиваю id который перезаписал выше
    count: item.count,
  }));
}
```

## 46. Удаление из корзины

```js
// /routes/cart.js
router.delete('/remove/:id', async (req, res) => {
  await req.user.removeFromCartById(req.params.id); // это будет описано тут /schemas/schUser.js

  // и после удалеия просто парсим то что в корзине
  const user = await req.user.populate('cart.items.courseId').execPopulate();
  const courses = mapCartItems(user.cart.items);
  const cart = { courses, price: sumPrice(courses) };
  res.status(200).json(cart);
});
```

```js
// /schemas/schUser.js (.removeFromCartById)
userSchema.methods.removeFromCartById = function (id) {
  let items = [...this.cart.items]; // чтоб получить копию а не ссылку
  const idx = items.findIndex(
    ({ courseId }) => courseId.toString() === id.toString(),
  );

  if (items[idx].count === 1) {
    items = items.filter(
      ({ courseId }) => courseId.toString() !== id.toString(),
    );
  } else {
    items[idx].count -= 1;
  }

  this.cart = { items };
  return this.save();
};
```

## 45. Отображение корзины

```js
// /routes/cart.js
router.get('/', async (req, res) => {
  const user = await req.user.populate('cart.items.courseId').execPopulate();
  const courses = mapCartItems(user.cart.items); // <---======
  res.render('cart.hbs', {
    title: 'Cart',
    isCart: true,
    courses,
    price: sumPrice(courses), // <---======
  });
});

function mapCartItems(cart) {
  return cart.map(item => ({
    ...item.courseId._doc, // _doc удалит лишние метаданные
    count: item.count,
  }));
}
/*
  ================================= mapCartItems из этого объекта 
  {
    count: 2,
    _id: 605ce6b829133a14885a3d4e,
    courseId: {
      _id: 605c2dacbdb99a0128551405,
      title: 'React',
      price: 10000,
      image: 'https://logos.png',
      userId: 605c298993a6da28205e86cd,
      __v: 0
  }
  ================================= mapCartItems делает этот 
  {
    _id: 605c2dacbdb99a0128551405,
    title: 'React',
    price: 10000,
    image: 'https://logos.png',
    userId: 605c298993a6da28205e86cd,
    __v: 0,
    count: 2
  }
*/

function sumPrice(courses) {
  return courses.reduce(
    (total, course) => (total += course.price * course.count),
    0,
  );
}
```

## 44. Добавление товара в корзину

```js
// //schemas/schUser.js (добавляю .methods.addToCart)
const { Schema, model } = require('mongoose');

const userSchema = new Schema({
  email: { ... },
  name: { ... },
  cart: {
    items: [
      {
        count: { type: Number ... },
        courseId: { type: Schema.Types.ObjectId, ref: 'Course' ... },
      },
    ],
  },
});

userSchema.methods.addToCart = function (course) { // тут нужен контекст поэтому function
  const items = [...this.cart.items]; // чтоб получить копию а не ссылку
  const idx = items.findIndex(item => {
    return item.courseId.toString() === course._id.toString();
  });

  if (idx >= 0) {
    items[idx].count = items[idx].count + 1;
  } else {
    items.push({
      courseId: course._id,
      count: 1,
    });
  }

  this.cart = { items };
  return this.save();
};

module.exports = model('User', userSchema);
```

```js
// /routes/cart.js
const Course = require('../models/schemas/schCourse');

router.post('/add', async (req, res) => {
  const course = await Course.findById(req.body.id);
  // помню что req.user доступен благодаря middleware написаному в index.js
  await req.user.addToCart(course); // .addToCart описан в схеме schUser.js
  res.redirect('/cart');
});
```

## 43. Добавление пользователя

- Проверить есть ли хоть один пользователь в системе (если нет то создаю)

```js
// index.js
const User = require('./models/schemas/schUser');

async function start() {
   try {
    await mongoose.connect(url, { ... });
    // -------------------------------------
    const candidate = await User.findOne();
    if (!candidate) {
      const user = new User({
        email: 'fish@mail.com',
        name: 'John Fishman',
        cart: { items: [] },
      });
      await user.save();
    }
    // -------------------------------------
    app.listen(3000, () => { ... });
  } catch (e) { console.log(e); }
}

start()
```

```js
// index.js
// просто дефолтный юзер (middleware)
app.use(async (req, res, next) => {
  try {
    const user = await User.findById('605c298993a6da28205e86cd');
    req.user = user;
    next();
  } catch (e) {
    console.log(e);
  }
});
```

```js
// /models/schemas/schCourse.js
const { Schema, model } = require('mongoose');
const course = new Schema({
  title: {...},
  price: {...},
  image: ...,
  // --------------------------------
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  // --------------------------------
});
module.exports = model('Course', course);
```

```js
// /routes/add.js
router.post('/', async (req, res) => {
  const { title, price, image } = req.body;
  // Added -> userId: req.user._id from middleware
  const course = new Course({ title, price, image, userId: req.user._id });
  try {
    await course.save();
    res.redirect('/courses');
  } catch (error) {
    console.log(error);
  }
});
```

1. Настроил связь между **`userSchema`** и **`course`**

```js
// /models/schemas/schUser.js
const userSchema = new Schema({
  cart: {
    items: [
      {
        count: { ... },
        courseId: {
          type: Schema.Types.ObjectId,
          ref: 'Course', // < ---=====
          required: true,
        },
      },
    ],
  },
});

// /models/schemas/schCourse.js
const course = new Schema({
  title: { ... },
  price: { ... },
  image: String,
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User', // < ---=====
  },
});
```

2. Благодаря тому что настроена связь между **`userSchema`** и **`course`**
   можно использовать `.populate('userId' ...)`

```js
// /routes/courses.js
router.get('/', async (req, res) => {
  const courses = await Course.find()
    .populate('userId', 'email name')
    .select('price title image'); // так можно выбрать только конкретные поля
  // .....
}
```

## 42. Модель пользователя

```js
// /models/schemas/schUser.js
const { Schema, model } = require('mongoose');

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  cart: {
    items: [
      {
        count: {
          type: Number,
          required: true,
          default: 1,
        },
        courseId: {
          type: Schema.Types.ObjectId,
          ref: 'Course',
          required: true,
        },
      },
    ],
  },
});

module.exports = model('User', userSchema);
```

## 41. Удаление курса

```hbs
  <!-- course-edit.hbs -->
  <form action="/courses/remove" method="POST">
    <input name="id" type="hidden" value={{course.id}}>
    <button type="submit" class="btn red">Delete course</button>
  </form>
```

```js
// /routes/courses.js
router.post('/remove', async (req, res) => {
  try {
    await Course.findByIdAndDelete(req.body.id);
    res.redirect('/courses');
  } catch (error) {
    console.log(error);
  }
});
```

## 40. Переписываем модель

```js
// /routes/courses.js
const Course = require('../models/schemas/schCourse');
router.get('/', async (req, res) => {
  const courses = await Course.find(); // .find() - это метоб монгуса
  res.status(200);
  res.render('courses', {
    title: 'Courses',
    isCourses: true,
    courses,
  });
});

router.get('/:id/edit', async (req, res) => {
  if (!req.query.allow) {
    return res.redirect('/');
  }
  const course = await Course.findById(req.params.id); // .findById() - это метоб монгуса
  res.render('course-edit', { course });
});

router.post('/edit', async (req, res) => {
  const { id } = req.body;
  delete req.body.id;
  await Course.findByIdAndUpdate(id, req.body); // .findByIdAndUpdate - это метоб монгуса
  res.redirect('/courses');
});

router.get('/:id', async (req, res) => {
  const course = await Course.findById(req.params.id); // .findById() - это метоб монгуса
  res.render('course', {
    layout: 'empty',
    title: `Course: ${course.title}`,
    course,
  });
});
```

## 39. Перед просмотром следующего ролика

[@handlebars/allow-prototype-access ](https://www.npmjs.com/package/@handlebars/allow-prototype-access) -
This package allows you to create a new Handlebars instance, that behaves like
version 4.5.3 and allows access to the prototype

[Example](https://www.npmjs.com/package/@handlebars/allow-prototype-access#usage--express-handlebars-and-mongoose-) -
Usage (express-handlebars and mongoose)

```text
npm install handlebars
npm i @handlebars/allow-prototype-access
```

```js
// index.js
const Handlebars = require('handlebars');
const exphbs = require('express-handlebars');
const {
  allowInsecurePrototypeAccess,
} = require('@handlebars/allow-prototype-access');

const hbs = exphbs.create({
  defaultLayout: 'main',
  extname: 'hbs',
  handlebars: allowInsecurePrototypeAccess(Handlebars),
});

app.engine('hbs', hbs.engine); // тут зарегистрировал что есть такой движ
```

## 38. Создание модели (схемы)

```js
// /models/schemas/schCourse.js
const { Schema, model } = require('mongoose');

const course = new Schema({
  title: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  img: String,
});

module.exports = model('Course', course);
```

```js
// /routes/add.js
const Course = require('../models/schemas/schCourse');

router.post('/', async (req, res) => {
  const { title, price, image } = req.body;
  const course = new Course({ title, price, image });
  try {
    await course.save();
  } catch (error) {
    console.log(error);
  }
});
```

## 37. Установка Mongoose

[mongoosejs.com](https://mongoosejs.com/) - elegant mongodb object modeling for
node.js

```text
npm install mongoose -E
```

```js
// index.js
const mongoose = require('mongoose');

async function start() {
  const user = 'collectionMainUser';
  const pwd = 'supersecurepassword';
  const clr = 'good-cluster';
  const db = 'collectionShop';
  const querys = 'retryWrites=true&w=majority';

  const url = `mongodb+srv://${user}:${pwd}@${clr}.magAa.mongodb.net/${db}?${querys}`;

  try {
    await mongoose.connect(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
    }); // это чтоб небыло ошибок в консоли
    app.listen(3000, () => {
      console.log(`Server is runing on port ${PORT}`);
    });
  } catch (error) {
    console.log(error);
  }
}

start();
```
