var mongoose=require('mongoose')
var blogSchema=new mongoose.Schema({
    title:String,
    author:String,
    content:String,
    createtime:String
},{ collection: 'article' })

blogSchema.statics={
    fetch:function(page,cb){//返回所有
        return this.find({}).sort({createtime:-1}).skip((parseInt(page)-1)*10).limit(10).exec(cb);
    },
    blogcount:function(cb){
        return this.find({}).count().exec(cb);
    },
    findBytitle:function(title,cb){//通过标题返回文章详情
        return this.findOne({title:title}).exec(cb);
    },
    findonlytitle:function(cb){//只返回标题
        return this.find({},{title:1,_id:0}).sort({createtime:-1}).exec(cb);
    },
}

module.exports=blogSchema


