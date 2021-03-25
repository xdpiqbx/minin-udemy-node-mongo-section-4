const { Router } = require('express');
const courseSchema = require('../models/schemas/schCourse');
const router = Router();

router.get('/', (req, res) => {
  res.status(200);
  res.render('add', {
    title: 'Add course',
    isAdd: true,
  });
});

router.post('/', async (req, res) => {
  const { title, price, image } = req.body;
  const course = new courseSchema({
    title,
    price,
    image,
    userId: req.user._id,
  });
  try {
    await course.save();
    res.redirect('/courses');
  } catch (error) {
    console.log(error);
  }
});

module.exports = router;
