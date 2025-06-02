const bcrypt = require('bcrypt')

const hashValue = async (value) =>{
    return await bcrypt.hash(value,10);
}

const compareValue = async(value,hashedValue)=>{
    return await bcrypt.compare(value,hashedValue);
}

module.exports ={hashValue,compareValue}