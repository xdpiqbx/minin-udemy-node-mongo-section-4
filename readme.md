# Section 4: Практика: База данных MongoDB

## 44. Добавление товара в корзину

```js
// //schemas/schUser.js
```

```js
// /routes/cart.js
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
