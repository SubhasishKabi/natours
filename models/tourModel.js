const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
const User = require('./userModel');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'], //built in validators
      unique: true,
      trim: true,
      maxength: [100, 'A tour must have less than or equal to 100 characters'],
      minlength: [10, 'A tour must have a minimum of 10 characters'],
      //validate: [validator.isAlpha, 'Tour name should only contain characters']
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either easy, medium or difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1'],
      max: [5, 'Ratings must be below 5'],
      set: val => Math.round(val * 10) /10
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      //custom validators
      type: Number,
      validate: {
        validator: function (val) {
          return val < this.price;
        },
        message: 'Discount ({VALUE}) must be less than the price',
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'a tour must have a description'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    images: [String], //array

    createdAt: {
      type: Date,
      default: Date.now(),
      select: false, //hides the data
    },
    startDates: [Date],

    secretTour: {
      type: Boolean,
      default: false,
    },

    //embedded data schema

    startLocation: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },

      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },

        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],

    // 1) guides : Array => embedding guides

    // 2) Child referencing
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

//INDEXING

tourSchema.index({price:1})
tourSchema.index({price:1})
tourSchema.index({price:1})
tourSchema.index({ slug: 1 });

/*{{URL}}/api/v1/tours?price[lte]=1000. Suppose this is the query. if we didn't have the concept of indexing, the query would have searched 
  all the available datas and then produced result. But now it won't have to. because price is indexed in increasing order*/

//COMPUND INDEXING

tourSchema.index({ price: 1, ratingsAverage: -1 });

tourSchema.index({startLocation : '2dsphere'})

//virtual properties

tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

//VIRTUAL POPULATE
//populates the parent reference. The review model has parent reference of tour and user

tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

//DOCUMENT MIDDLEWARE: runs before .save() and .create()

tourSchema.pre('save', function (next) {
  //console.log(this) //sulg will not be there
  this.slug = slugify(this.name, { lower: true });
  next();
});

// tourSchema.pre('save', function(next){
//   console.log("2nd middleware")
//   next()
// })

// tourSchema.post('save', function(doc, next){
//   //console.log(doc)//slug will be there
//   next()
// })

// Adding Tour guides from user(data) to tour

// 1) EMBEDDIND USERS INTO THE DATABASE

// tourSchema.pre('save', async function(next){
//   const guidesPromises = this.guides.map(async id => await User.findById(id));
//   this.guides = await Promise.all(guidesPromises)
//   next()
// })
///since this map function returns an promise the guidesPrmoises becomes an array full of promises.

//QUERY MIDDLEWARE: runs before or after a query is executed

tourSchema.pre(/^find/, function (next) {
  //will run for all functions starting with find. this is the syntax
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});

//populate middleware

//this middleware populates the child references

tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });
  next();
});

// tourSchema.post(/^find/, function (doc, next) {
//   console.log(`Query took ${Date.now() - this.start} milliseconds `);
//   //console.log(doc);
//   next();
// });

//AGGREGATE MIDDLEWARE

// tourSchema.pre('aggregate', function (next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } }); //this.pipeline() gives the aggregate data
//   //unshift() add an element to the begining of array
//   console.log(this.pipeline());
//   next();
// });

//this will work for both the aggregate methods however the result wont be affected in getMonthlyplans because secret tour doesn't have any start dates

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;

//VIRTUAL PROPERTIES

//these are fields that can be defined on the schema but it will not be persisted in the mongoDB collection.
// They are computed properties based on the existing properties of the document.
//Virtual properties are useful when you want to define derived values or
//perform calculations on existing fields without actually storing them in the database.

//Just like express, mongoose also has middlewares

//SLUGIFY: Slugify is a process of transforming a string into a URL-friendly format
// const title = "Hello World! This is an Example Title.";
// const slug = slugify(title);

// console.log(slug); // Output: "hello-world-this-is-an-example-title"

//---------------------------------------------------------------------//
//this.pipeline()

// [
//   { '$match': { secretTour: [Object] } }, //unshifted element
//   { '$unwind': '$startDates' },
//   { '$match': { startDates: [Object] } },
//   {
//     '$group': { _id: [Object], numTourStarts: [Object], tours: [Object] }
//   },
//   { '$addFields': { month: '$_id' } },
//   { '$project': { _id: 0 } },
//   { '$sort': { numTourStarts: -1 } }
// ]