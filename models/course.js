const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class Course {
  constructor(title, price, image) {
    this.title = title;
    this.price = price;
    this.image = image;
    this.id = uuidv4();
  }

  toJSON() {
    return {
      id: this.id,
      title: this.title,
      price: this.price,
      image: this.image,
    };
  }

  async save() {
    // чтоб не писать цепочку .then()
    // пользуюсь async await
    const courses = await Course.getAll();
    courses.push(this.toJSON());
    return new Promise((resolve, reject) => {
      fs.writeFile(
        path.join(__dirname, '..', 'data', 'courses.json'),
        JSON.stringify(courses),
        err => {
          if (err) {
            reject(err);
          } else {
            resolve('Data added to courses.json');
          }
        },
      );
    });
  }

  static async update(updCourse) {
    const courses = await Course.getAll()
    const idx = courses.findIndex(course => course.id === updCourse.id);
    courses[idx] = updCourse;
    return new Promise((resolve, reject) => {
      fs.writeFile(
        path.join(__dirname, '..', 'data', 'courses.json'),
        JSON.stringify(courses),
        err => {
          if (err) {
            reject(err);
          } else {
            resolve('Data added to courses.json');
          }
        },
      );
    });
  }

  static getAll() {
    return new Promise((resolve, reject) => {
      fs.readFile(
        path.join(__dirname, '..', 'data', 'courses.json'),
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

  static async getById(id) {
    const courses = await Course.getAll();
    return courses.find(course => course.id === id);
  }
}

module.exports = Course;
