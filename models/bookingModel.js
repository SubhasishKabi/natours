const mongoose = require('mongoose')

const bookingSchema = new mongoose.Schema({
    tour: {
        type: mongoose.Schema.ObjectId,
        ref: 'Tour',
        required: [true, 'A Booking must belong to a Tour']
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'A booking must belong to an user']
    },
    price: {
        type: Number,
        required: [true, 'A Booking must have a price']
    },
    createdAt:  {
        type: Date,
        default: Date.now()
    },
    paid: {
        type: Boolean,
        default: true
    }
})

bookingSchema.pre(/^find/, function(next){
    this.populate('user').populate({
        path: 'tour',
        select: 'name'
    })

    next()
})

const Booking = mongoose.model('Booking', bookingSchema)

module.exports = Booking