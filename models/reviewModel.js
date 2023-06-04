const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review cannot be empty'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },

    // 1) Parent referencing. In child referencing, the field in an array but in parent refereincing it is not an array.

    tour: {
      type: mongoose.Schema.ObjectId, //id of the object
      ref: 'Tour',
      required: [true, 'Review must belong to a tour'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user'],
    },
  }, 
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);


reviewSchema.index({ tour: 1, user: 1 }, { unique: true })

reviewSchema.pre(/^find/, function (next) {
  // this.populate({
  //     path: 'tour',
  //     select : 'name'
  // })
  this.populate({
    path: 'user',
    select: 'name email photo',
  });

  next();
});

//Updating After a new revew is created

reviewSchema.statics.caclAverageRatings = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);
  //console.log(stats)

  //update the data in the Tour schema

  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    }); 
  }
};

reviewSchema.post('save', function () {
  //only after the document is saved , then we perform calculations
  this.constructor.caclAverageRatings(this.tour); //when we post a review, the json object has tour property which defines the tourId
});

//Updating after a existing review is deleted
/*we used findByIdandUpdate/delete to update and delete but we use 'findOneAnd ' is the hook because behind the scenes findByIdAndUpdate/delete 
  is nothing but first findOne and then update*/

/* reviewSchema.pre(/^findOneAnd/, async function(next){
    this.r = await this.findOne()
    console.log(this.r)
    next()
  }) */
/*The error indicates that the findOne() method has already been executed before, possibly due to multiple calls or improper handling.*/

reviewSchema.pre(/^findOneAnd/, async function (next) {
  this.r = await this.model.findOne(this.getQuery());
  //console.log(this.r);
  next();
});

reviewSchema.post(/^findOneAnd/, async function () {
  await this.r.constructor.caclAverageRatings(this.r.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;





















////============================================EXPLANATIONS BELOW==========================================///////////////////

//CONSOLE.LOG(STATS)
/*[
  {
    _id: new ObjectId("646c6b8f9d05543a8178af7c"),
    nRating: 2,
    avgRating: 4.5
  }
]*/

// reviewSchema.pre(/^findOneAnd/, async function (next) {  //chat gpt code. i din't  understand this
//   // Clone the current query
//   const originalQuery = { ...this.getQuery() };

//   // Execute the query and store the result in this.r
//   this.r = await this.model.findOne(originalQuery);

//   console.log(this.r);
//   next();

// }); //EXPLANATION BELOW

// 1)

// reviewSchema.pre(/^findOneAnd/, async function (next) {
//   // Clone the current query
//   const originalQuery = { ...this.getQuery() };

/*In this code block, we define the middleware function for any findOneAnd... query. 
We start by creating a clone of the current query using the spread operator (...). 
The this.getQuery() method retrieves the original query object, which we store in the originalQuery variable.*/

// 2)

// // Execute the query and store the result in this.r
// this.r = await this.model.findOne(originalQuery);

/*Here, we modify the line where the query is executed. 
Instead of using this.findOne(), we use this.model.findOne(). 
This change ensures that the findOne() method is called on the model itself, rather than on the current document. 
By passing originalQuery as the argument, we execute the query and store the result in this.r.*/

// 3)
