class APIFeatures {
  constructor(query, queryString) {
    //query here is Tour.find() and queryString is req.query
    this.query = query;
    this.queryString = queryString;
  }
  filter() {
    const queryObj = { ...this.queryString };
    const excludeFields = ['sort', 'fields', 'page', 'limit'];
    excludeFields.forEach((el) => delete queryObj[el]);

    let queryString = JSON.stringify(queryObj);
    queryString = queryString.replace(
      /\b(gte|gt|lte|lt)\b/g,
      (match) => `$${match}`
    );
    this.query.find(JSON.parse(queryString));
    //let query = Tour.find(JSON.parse(queryString))
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      //console.log(this.queryString)
      const sortBy = this.queryString.sort.split(',').join(' '); //this methos is to sort by multiple parameters 
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

//without app.use(hbb()), when we use multiple sort in the params i.e {{URL}}/api/v1/tours?sort=price&sort=ratingsAverage, 
//we will get this.queryString as a array and we cannot implement .split() in an array. it is applicable to string. hence we will get an error

//{ sort: [ 'price', 'ratingsAverage' ] } -- without app.use(hbb)
//{ sort: 'ratingsAverage' } - with hbb



  limitfields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields); //i=_id will always be there bydefault
    } else {
      this.query = this.query.select('-__v'); //excludes the other fields
    }
    return this;
  }

  paginate() {
    const page = this.queryString.page || 1;
    const limit = this.queryString.limit || 100;
    const skip = (page - 1) * limit;
    //query = query.skip((page - 1) * limit)

    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}

module.exports = APIFeatures;
