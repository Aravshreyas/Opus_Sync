const { HTTPSTATUS } = require("../config/http.config");
const { ErrorCodeEnum } = require("../enums/error-code.enum");
const { AppError } = require("../utils/appError");
const errorHandler = (error,req,res,next)=>{
console.error(`Error Occurred on PATH: ${req.path}`,error);

if(error instanceof SyntaxError){

    return res.status(HTTPSTATUS.BAD_REQUEST).json({
        message: "Invalid JSON format. Please check your request body."
    })
}

if(error.statusCode && error.errorCode){
return res.status(error.statusCode).json({
    message: error.message,
    errorCode: error.errorCode,
})
}

    return res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
        message: "Internal Server Error",
        error:error?.message || "Unknown Error Occured"
    })
}

module.exports = errorHandler;