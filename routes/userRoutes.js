const express = require('express');
const router = express.Router();


const userController = require('../controllers/usersController');
const authController = require('../controllers/authController');


router
  .post('/signup', authController.signup) 
  .post('/login', authController.login)
  .get('/logout', authController.logout)
  .post('/forgotPassword', authController.forgotPassword)
  .patch('/resetPassword/:token', authController.resetPassword);
//ALL THE BELOW NEED TO BE AUTHENTICATED

//and instead of writing authController.protect to all the routes, we can use the middleware
router.use(authController.protect);

//these 4 are only protected but not restricted

router
  .patch('/updateMyPassword', authController.updatepassword)
  .patch('/updateMyData',userController.uploadUserPhoto, userController.resizeUserPhoto,  userController.updateMyData)
  .delete('/deleteMyAccount', userController.deleteAccount)
  .get('/getMe', userController.getMe, userController.getUser);

router.use(authController.restrictTo('admin')); //below these are restricted as well as protected


router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;



