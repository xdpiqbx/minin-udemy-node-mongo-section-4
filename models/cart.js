const fs = require('fs');
const path = require('path');

class Cart {
  static async add(course) {
    const cart = await Cart.fetch();
    const idx = cart.courses.findIndex(current => current.id === course.id);
    const candidate = cart.courses[idx];

    if (candidate) {
      // exist
      candidate.count += 1;
      cart.courses[idx] = candidate;
    } else {
      // need to add
      course.count = 1;
      cart.courses.push(course);
    }

    cart.price += Number.parseInt(course.price);

    return new Promise((resolve, reject) => {
      fs.writeFile(
        path.join(__dirname, '..', 'data', 'cart.json'),
        JSON.stringify(cart),
        err => {
          if (err) {
            reject(err);
          } else {
            console.log('Course was added too cart');
            resolve()
          }
        },
      );
    });
  }

  static async remove(id){
    const cart = await Cart.fetch()
    const idx = cart.courses.findIndex(current => current.id === id);
    const course = cart.courses[idx]

    if (course.count === 1){
      // del
      cart.courses = cart.courses.filter(curr => curr.id !== id)
    }else{
      cart.courses[idx].count -= 1
    }

    cart.price -= course.price

    return new Promise((resolve, reject) => {
      fs.writeFile(
        path.join(__dirname, '..', 'data', 'cart.json'),
        JSON.stringify(cart),
        err => {
          if (err) {
            reject(err);
          } else {
            console.log('Cart was updated');
            resolve(cart)
          }
        },
      );
    });
  }

  static async fetch() {
    return new Promise((resolve, reject) => {
      fs.readFile(
        path.join(__dirname, '..', 'data', 'cart.json'),
        'utf-8',
        (err, content) => {
          if (err) {
            reject(err);
          } else {
            resolve(JSON.parse(content));
          }
        },
      );
    });
  }
}

module.exports = Cart;
