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
  const cart = await Cart.remove(req.params.id);
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
