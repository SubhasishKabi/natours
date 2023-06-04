const fs = require('fs');
const asyncWrapper = require('../utils/asyncWrapper');

const Tour = require('../models/tourModel');
// const APIFeatures = require('../utils/apiFeatures.js');
const AppError = require('../utils/appError');
const handlerFactory = require('./handlerFactory');

const sharp = require('sharp'); //image resizing
const multer = require('multer'); //image upload

const multerStorage = multer.memoryStorage(); // it will store the image as a memory buffer

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an Image! Please upload only images.', 404), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

//multiple fields
const uploadTourPhotos = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 }
]);


const resizeTourPhotos = asyncWrapper( async (req, res, next) => {
  //console.log(req.files) //for single image it is REQ.FILE

  if(!req.files.imageCover || !req.files.images){
    return next()
  }

  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`
  //we created a proptery in the req.body

  await sharp(req.files.imageCover[0].buffer) //see last for req.files
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);



   // 2) Images

   req.body.images = []

   await Promise.all(
    req.files.images.map(async (file, i) => {
      const fileName = `tour-${req.params.id}-${Date.now()}- ${i+1}.jpeg`

      await sharp(file.buffer) //see last for req.files
      .resize(2000, 1333)
      .toFormat('jpeg')
      .jpeg({ quality: 90 })
      .toFile(`public/img/tours/${fileName}`);
  
      req.body.images.push(fileName)
    })
   )

  next()
})



/*

upload.single('image')
//single image 
upload.array('images', 5)
//multiple images of the same field

*/

const aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsaAverage,summary,difficulty';
  next();
};

const getAllTours = handlerFactory.getAll(Tour);

const createTour = handlerFactory.createOne(Tour);

const getTour = handlerFactory.getOne(Tour, { path: 'reviews' });

const updateTour = handlerFactory.updateOne(Tour);

const deleteTour = handlerFactory.deleteOne(Tour);

const getTourStats = asyncWrapper(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: {
        ratingsAverage: { $gte: 4.5 },
      },
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' }, //if it is null, then there will be only one group. else it depends upon the id and its parameters
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: {
        avgPrice: 1,
      },
    },
    // {
    //   $match : {
    //     _id : {$ne : 'EASY'} //will not show the easy group
    //   }
    // }
  ]);

  res.status(200).json({
    status: ' success',
    data: {
      stats,
    },
  });
});

const getMonthlyPlans = asyncWrapper(async (req, res, next) => {
  const year = req.params.year * 1; //t convert it into a number/interger 

  const plan = await Tour.aggregate([
    { $unwind: '$startDates' }, //destructures the array
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' }, //The _id field will contain the month number.
        numTourStarts: { $sum: 1 }, //Calculates the total number of tour starts per month by summing 1 for each document in the group.
        tours: { $push: '$name' }, //Creates an array of tour names for each group by pushing the name field value into the tours array.
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: {
        _id: 0, //the fields which have 0 will not be shown
      },
    },
    {
      $sort: {
        numTourStarts: -1,
      },
    },
    // {
    //   $limit : 12
    // }
  ]);

  res.status(200).json({
    status: ' success',
    data: {
      plan,
    },
  });
});

// /tours-within/:distance/center/:latlng/unit/:unit

const getToursWithin = asyncWrapper(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(','); // cordinates are an array of numbers in Tour Model

  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1; //converted into radians

  console.log(radius);

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide LATITUDE and LONGITUDE in format lat,lng',
        404
      )
    );
  }

  //console.log(distance, latlng, lat, lng, unit);
  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      tours,
    },
  });
});

const getDistances = asyncWrapper(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(','); // cordinates are an array of numbers in Tour Model

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide LATITUDE and LONGITUDE in format lat,lng',
        404
      )
    );
  }

  const multipler = unit === 'mi' ? 0.000621371 : 0.001;

  //for geospatial aggregation there's only one single stage and that's called geoNear and this one always needs to be first in the pipeline
  //its also needs one of our fields contains a geospatial index
  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: 'distance', //in meters
        distanceMultiplier: multipler, //to convert it into miles/kms we multiply by multiplier.
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      distances,
    },
  });
});

module.exports = {
  getAllTours,
  createTour,
  getTour,
  updateTour,
  deleteTour,
  aliasTopTours,
  getTourStats,
  getMonthlyPlans,
  getToursWithin,
  getDistances,
  uploadTourPhotos,
  resizeTourPhotos
};

///////----------------------------------------------EXTRAS-------------------------------------------------------///////////////

// const tours = JSON.parse(
//   fs.readFileSync('./dev-data/data/tours-simple.json') //{"tours": []}
// );

// exports.checkID = (req, res, next, val) =>{
//     //const id = req.params._id ;
//     console.log(`Tour id is: ${val}`)

//     if (req.params._id  > tours.length) {
//       return res.status(404).json({
//         status: 'fail',
//         message: 'Invalid ID',
//       });

//     }
//     next();

// }

//cannot export htis due to
//invalid param() call for _id, got undefined

// exports.checkBody = (req, res, next) => {
//   if(!req.body.name || !req.body.price){
//     return res.status(400).json({
//       status: "fail",
//       Message: "Missing name or price"
//     })
//   }
//   next()
// }

//cannot export this due to
//Route.post() requires a callback function but got a [object Undefined]

///---------------------------GET TOURS---------------------------//
//1) FILTERING the data

// //console.log(req.query)
// //{ duration: '5', difficulty: 'easy' } filtering
// //{ duration: { gte: '5' }, price: { lt: '1500' } } //advance filtering
// //we have to convert it into { duration: { $gte: '5' }, price: { $lt: '1500' } }

// const queryObj = { ...req.query };
// const excludeFields = ['sort', 'fields', 'page', 'limit'];
// excludeFields.forEach((el) => delete queryObj[el]);

// //2) ADVANCE FILTERING i.e greater than, less than etc
// //localhost:3000/api/v1/tours?duration[gte]=5&price[lt]=1500

// let queryString = JSON.stringify(queryObj);
// //console.log(queryString)
// queryString = queryString.replace(
//   /\b(gte|gt|lte|lt)\b/g,
//   (match) => `$${match}`
// );
// //console.log(queryString)
// //console.log(JSON.parse(queryString))
// let query = Tour.find(JSON.parse(queryString));

// // const tours = Tour.find()
// //   .where('duration')
// //   .equals(5)
// //   .where('difficulty')
// //   .equals('easy');

// //3) SORTING
// if (req.query.sort) {
//   const sortBy = req.query.sort.split(',').join(' '); //this methos is to sort by multiple parameters
//   console.log(sortBy);
//   query = query.sort(sortBy);
// } else {
//   query = query.sort('-createdAt');
// }

// //4) LIMITING THE FIELDS

// if (req.query.fields) {
//   const fields = req.query.fields.split(',').join(' ');
//   query = query.select(fields); //i=_id will always be there bydefault
// } else {
//   query = query.select('-__v'); //excludes the other fields
// }

// //5) PAGINATION

// const page = req.query.page || 1;
// const limit = req.query.limit || 100;
// const skip = (page - 1) * limit;
// //query = query.skip((page - 1) * limit)

// query = query.skip(skip).limit(limit);

// if (req.query.page) {
//   const numTours = await Tour.countDocuments();
//   if (skip >= numTours) throw new Error('This page dooes not exist');
// }

///--------------------------Update tour-----------------------------////////////////

// const updateTour = asyncWrapper(async (req, res, next) => {
//   /*const tour = await Tour.findById(req.params.id);
//   //console.log(tour);

//   if(!tour){
//     return next(new AppError('No tour was found with that ID', 404))
//   }

//   //findOneAndUpdate() updates the data but it doesn't return the updated data. it returns the previous data. however the data will
//   //be updated in the database
//   const updatedTour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//     new: true,
//     runValidators: true, //if this is set to false, incorrect data will also be taken
//   });*/

// const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//   new: true,
//   runValidators: true,
// })

// console.log(tour)

// if(!tour)  return next(new AppError('No tour was found with that id', 404 ))

//   res.status(200).json({
//     status: 'success',
//     data: {
//       tour,
//     },
//   });

// })

////==================================GET ONE TOUR =========================================/////////////

// const getTour = asyncWrapper( async (req, res, next) => {
//   const tour = await Tour.findById(req.params.id).populate('reviews')

//   /*.populate({
//     path : 'guides',
//     select : '-__v -passwordChangedAt'
//   });*/

//   //we can't do this method for all the queries. hence it is better to use a middleware ie. pre find middleware

//   //populate is used when we have child referencing and we obtain the data for a particular parent. for eg
//   //here the guides are child referenced in the tours. when we get one single tour, the guides are populated

//   if(!tour){
//     return next(new AppError('No tour was found with that ID', 404))
//   }

//   res.status(200).json({
//     status: 'success',
//     data: {
//       tour,
//     },
//   });

// })




///////////////----------------------------req.files------------------------------------------------------------//////
/*

{
  imageCover: [
    {
      fieldname: 'imageCover',
      originalname: 'new-tour-1.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      buffer: <Buffer ff d8 ff e0 00 10 4a 46 49 46 00 01 01 00 00 48 00 48 00 00 ff e1 00 8c 45 78 69 66 00 00 4d 4d 00 2a 00 00 00 08 00 05 01 12 00 03 00 00 00 01 00 01 ... 1857218 more bytes>,
      size: 1857268
    }
  ],
  images: [
    {
      fieldname: 'images',
      originalname: 'new-tour-2.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      buffer: <Buffer ff d8 ff e0 00 10 4a 46 49 46 00 01 01 00 00 48 00 48 00 00 ff e1 00 8c 45 78 69 66 00 00 4d 4d 00 2a 00 00 00 08 00 05 01 12 00 03 00 00 00 01 00 01 ... 2321585 more bytes>,
      size: 2321635
    },
    {
      fieldname: 'images',
      originalname: 'new-tour-3.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      buffer: <Buffer ff d8 ff e0 00 10 4a 46 49 46 00 01 01 00 00 48 00 48 00 00 ff e1 00 8c 45 78 69 66 00 00 4d 4d 00 2a 00 00 00 08 00 05 01 12 00 03 00 00 00 01 00 01 ... 884177 more bytes>,
      size: 884227
    },
    {
      fieldname: 'images',
      originalname: 'new-tour-4.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      buffer: <Buffer ff d8 ff e0 00 10 4a 46 49 46 00 01 01 00 00 48 00 48 00 00 ff e1 00 8c 45 78 69 66 00 00 4d 4d 00 2a 00 00 00 08 00 05 01 12 00 03 00 00 00 01 00 01 ... 2927337 more bytes>,
      size: 2927387
    }
  ]
}

*/