const mongoose = require('mongoose')
const { config } = require('./app.config')

const connectDatabase = async ()=>{
    try{
        await mongoose.connect(config.MONGO_URL)
        console.log('Connected to MongoDB Database')
    }catch(error){
        console.log('Error connecting to MongoDB Database',error)
        process.exit(1)
    }
}

module.exports = connectDatabase;