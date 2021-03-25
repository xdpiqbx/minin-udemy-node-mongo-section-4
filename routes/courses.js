const { Router } = require('express');
// const Course = require('../models/course')
const courseSchema = require('../models/schemas/schCourse');
const Cart = require('../models/cart');
const router = Router();

router.get('/', async (req, res) => {
  const courses = await courseSchema
    .find()
    .populate('userId', 'email name')
    .select('price title image');

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
  const course = await courseSchema.findById(req.params.id);
  res.render('course-edit', {
    title: `Edit ${course.title}`,
    course,
  });
});

router.post('/edit', async (req, res) => {
  // await Course.update(req.body);
  const { id } = req.body;
  delete req.body.id;
  await courseSchema.findByIdAndUpdate(id, req.body);
  res.redirect('/courses');
});

router.post('/remove', async (req, res) => {
  try {
    await courseSchema.findByIdAndDelete(req.body.id);
    res.redirect('/courses');
  } catch (error) {
    console.log(error);
  }
});

router.get('/:id', async (req, res) => {
  const course = await courseSchema.findById(req.params.id);
  res.render('course', {
    layout: 'empty',
    title: `Course: ${course.title}`,
    course,
  });
});

module.exports = router;
