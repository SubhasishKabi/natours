const fs = require('fs')
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tour = require('../../models/tourModel');
const User = require('../../models/userModel');
const Review = require('../../models/reviewModel');


const { json } = require('body-parser');
dotenv.config({ path: './config.env' });


const connectionString = process.env.DATABASE_URI.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(connectionString, {
    useNewUrlParser: true,
    //useCreateIndex: true,
    // useFindAndModify: true,
    useUnifiedTopology: true,
    //findOneAndUpdate: true
  })
  .then(console.log('Connection Successful....'));


//Read jSON file

const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'))
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'))
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8'))


//IMPORT data into the DATABASE

const importData = async () =>{
    try {
        await Tour.create(tours)
        await User.create(users, {validateBeforeSave: false})
        await Review.create(reviews)
        console.log("Data uploaded successfully...")
    } catch (err) {
        console.log(err)
    }
    process.exit()
}


//DELETE all data from the collection

const deleteData = async () =>{
    try {
        await Tour.deleteMany()
        await User.deleteMany()
        await Review.deleteMany()
        console.log("Data deleted successfully...")
    } catch (err) {
        console.log(err)
    } 
    process.exit()
}

console.log(process.argv)
// [
//   'C:\\Program Files\\nodejs\\node.exe',
//   'C:\\Users\\91760\\Desktop\\complete-node-bootcamp-master\\4-natours\\starter\\dev-data\\data\\import-dev-data.js'
// ]

if(process.argv[2]=== '--import'){
  importData()
} else if (process.argv[2] === '--delete'){
  deleteData()
}


//The code you provided will check the second argument passed to the script