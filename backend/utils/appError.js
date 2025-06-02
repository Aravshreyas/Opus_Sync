const { HTTPSTATUS } = require('../config/http.config')
const { ErrorCodeEnum } = require('../enums/error-code.enum')



const createAppError = (message,statusCode,errorCode)  =>{
    const error = new Error(message)
    error.statusCode = statusCode || HTTPSTATUS.INTERNAL_SERVER_ERROR;
    error.errorCode = errorCode

    Error.captureStackTrace(error)
    return error
}

const HttpException = (message = "Http Exception Error", statusCode, errorCode) => {
    return createAppError(message, statusCode, errorCode);
  };
  
  const InternalServerException = (message = "Internal Server Error", errorCode) => {
    return createAppError(
      message,
      HTTPSTATUS.INTERNAL_SERVER_ERROR,
      errorCode || ErrorCodeEnum.INTERNAL_SERVER_ERROR
    );
  };
  
  const NotFoundException = (message = "Resource not found", errorCode) => {
    return createAppError(
      message,
      HTTPSTATUS.NOT_FOUND,
      errorCode || ErrorCodeEnum.RESOURCE_NOT_FOUND
    );
  };
  
  const BadRequestException = (message = "Bad Request", errorCode) => {
    return createAppError(
      message,
      HTTPSTATUS.BAD_REQUEST,
      errorCode || ErrorCodeEnum.VALIDATION_ERROR
    );
  };
  
  const UnauthorizedException = (message = "Unauthorized Access", errorCode) => {
    return createAppError(
      message,
      HTTPSTATUS.UNAUTHORIZED,
      errorCode || ErrorCodeEnum.ACCESS_UNAUTHORIZED
    );
  };
  
  module.exports = {
    createAppError,
    HttpException,
    InternalServerException,
    NotFoundException,
    BadRequestException,
    UnauthorizedException,
  };
  