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
  // const cart = await Cart.fetch();
  // res.render('cart', {
  //   title: 'Cart',
  //   isCart: true,
  //   courses: cart.courses,
  //   price: cart.price,
  // });
  res.json({ test: true });
});

module.exports = router;
