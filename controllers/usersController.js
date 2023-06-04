const asyncWrapper = require('../utils/asyncWrapper');
const AppError = require('../utils/appError');
const handlerFactory = require('./handlerFactory');

const User = require('../models/userModel');
const APIFeatures = require('../utils/apiFeatures.js');

const sharp = require('sharp'); //image resizing
const multer = require('multer'); //image upload

// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     // cb is not a express property like req and res. It is a call back function. We can give any name to it
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split('/')[1]; //see last line for req.file

//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`); //req. user because, the user must be logged on
//   },
// });

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

const uploadUserPhoto = upload.single('photo');

///------------------------------------------------------resizing photos-------------------------------------------------/////

const resizeUserPhoto = asyncWrapper(async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;


  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) {
      newObj[el] = obj[el];
    }
  });
  return newObj;
};

const getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

const getAllUsers = handlerFactory.getAll(User);
const updateUser = handlerFactory.updateOne(User);
const deleteUser = handlerFactory.deleteOne(User);
const getUser = handlerFactory.getOne(User);

/////--------------------------UPDATE MY DATA EXCEPT PASSWORD---------------------------------------------/////////////////

const updateMyData = asyncWrapper(async (req, res, next) => {
  //console.log(req.file);
  //console.log(req.body);
  // 1) Create error if user posts password data

  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for Password updates. Please try /updateMyPassword',
        400
      )
    );
  }

  // 2) Filtered out unwanted field names thaat are not allowed to be updated

  const filteredOut = filterObj(req.body, 'name', 'email');

  if (req.file) {
    filteredOut.photo = req.file.filename;
  }

  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredOut, {
    //this functions runs after protect middleware and in it
    new: true, // we have saved req.used = currentUser
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      User: updatedUser,
    },
  });
});

/////-----------------------DISABLE/DELETE/DEACTIVATE account----------------------------------------////////////////

//This will just make the account status inactive. It will not permanently delete from the database. It is like deactivating your account

const deleteAccount = asyncWrapper(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

const createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'this route is yet not defined. Sign up Instead',
  });
};

module.exports = {
  getAllUsers,
  getUser,
  createUser,
  deleteUser,
  updateUser,
  updateMyData,
  deleteAccount,
  getMe,
  uploadUserPhoto,
  resizeUserPhoto,
};

////--------------------------------------------------EXTRAS----------------------------------------------------///////////////////

/*   //req.file

{
  fieldname: 'photo',
  originalname: 'leo.jpg',
  encoding: '7bit',
  mimetype: 'image/jpeg',
  destination: 'public/img/users',
  filename: '602ef5642a28a7f5e047a03ea2f84a3f',
  path: 'public\\img\\users\\602ef5642a28a7f5e047a03ea2f84a3f',
  size: 207078
}

*/
