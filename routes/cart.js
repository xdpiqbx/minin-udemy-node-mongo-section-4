const { Router } = require('express');
const router = Router();
const Course = require('../models/schemas/schCourse');
// const Cart = require('../models/cart');

router.post('/add', async (req, res) => {
  const course = await Course.findById(req.body.id);
  await req.user.addToCart(course);
  res.redirect('/cart');
});

router.delete('/remove/:id', async (req, res) => {
  await req.user.removeFromCartById(req.params.id);
  const user = await req.user.populate('cart.items.courseId').execPopulate();
  const courses = mapCartItems(user.cart.items);
  const cart = { courses, price: sumPrice(courses) };
  res.status(200).json(cart);
});

router.get('/', async (req, res) => {
  const user = await req.user.populate('cart.items.courseId').execPopulate();
  const courses = mapCartItems(user.cart.items);
  res.render('cart.hbs', {
    title: 'Cart',
    isCart: true,
    courses,
    price: sumPrice(courses),
  });
});

function mapCartItems(cart) {
  return cart.map(item => ({
    ...item.courseId._doc,
    id: item.courseId.id,
    count: item.count,
  }));
}

function sumPrice(courses) {
  return courses.reduce(
    (total, course) => (total += course.price * course.count),
    0,
  );
}

module.exports = router;
