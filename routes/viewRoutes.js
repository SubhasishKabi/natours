const express = require('express')
const router = express.Router()
const viewController = require('../controllers/viewController')
const authController = require('../controllers/authController')
const bookingController = require('../controllers/bookingController')


//router.use(authController.isloggedIn)


router.get('/',bookingController.createBookingCheckout, authController.isloggedIn, viewController.getOverview)
router.get('/tour/:slug',authController.isloggedIn, viewController.getTour)
router.get('/login',authController.isloggedIn, viewController.getLoginForm)
router.get('/me', authController.protect, viewController.getAccount)
router.get('/my-tours', authController.protect, viewController.getMyTours)
router.post('/submit-user-data',authController.protect, viewController.updateUserData)


module.exports = router  