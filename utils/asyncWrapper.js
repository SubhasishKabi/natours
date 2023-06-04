const asyncWrapper = (fn) =>{  //this takes a function as argument and returns a middlware function
    return async (req, res, next) => {
        try {
           await fn(req, res, next) 
        } catch (error) {
            next(error)
        }
    }
}

module.exports = asyncWrapper