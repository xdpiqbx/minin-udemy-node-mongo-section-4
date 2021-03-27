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

userSchema.methods.addToCart = function (course) {
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

userSchema.methods.clearCart = function () {
  this.cart = { items: [] };
  return this.save();
};

module.exports = model('User', userSchema);
