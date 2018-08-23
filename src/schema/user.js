var mongoose=require('mongoose')
var userSchema=new mongoose.Schema({
    user:String,
    password:String,
    token:String,
    nickname:String,
    sign:String,
    authority:String,
    sex:String,
    lastlogin:String,
    imgurl:String
},{ collection: 'user' })

userSchema.statics={
    check:function(user,cb){
        return this.findOne({user:user}).exec(cb);
    },
    checklogin:function(token,cb){
        return this.findOne({token:token}).exec(cb);
    },
    // findonlytitle:function(cb){
    //     return this.find({}).exec(cb);
    // },
}

module.exports=userSchema
