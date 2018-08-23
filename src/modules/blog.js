var mongoose=require('mongoose')
var blogSchema=require('../schema/blog')
var article=mongoose.model('article',blogSchema)
module.exports = article