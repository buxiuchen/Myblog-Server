var express = require('express');
var bodyParser = require('body-parser');
var multiparty = require('multiparty');
const path=require('path');
var crypto=require('crypto');
var urlencodedParser = bodyParser.urlencoded({ extended: false })
var url = "mongodb://localhost:27017/blog?authSource=admin&authMechanism=SCRAM-SHA-1";
var app = express();
var mongoose=require('mongoose')
let blog=require('./modules/blog')
let user=require('./modules/user')
const options={
    user : "***",
    pass : "***", 
}
var methods={
    getmd5:function(value){
        const md5 = crypto.createHash('md5');
        md5.update(value);
        let token=md5.digest('hex');
        return token;
    },
    sec:function(token){
        let currenttime=new Date().getTime();
        return new Promise((resolve,reject)=>{
            user.checklogin(token,(err,checkinfo)=>{
                if (err){
                    reject('false');
                }else{
                    if(checkinfo===null){
                        reject('false');
                    }else if((currenttime-checkinfo.lastlogin)/1000>30*60){
                        reject('false');
                    }else{
                        resolve('true');
                    }
                }
            })
        })
    }
}

mongoose.connect(url,options)
app.use(express.static(path.resolve(__dirname, '../dist')));
app.all('*',function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "http://123.207.66.160");
    // res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Headers', 'Content-Type, Content-Length, Authorization, Accept, X-Requested-With , yourHeaderFeild');
    res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');
  
    if (req.method == 'OPTIONS') {
      res.send(200); /让options请求快速返回/
    }
    else {
      next();
    }
  });

//主页接口
app.get('', function (req, res) {
    var html = fs.readFileSync(path.resolve(__dirname, '../dist/index.html'), 'utf-8');
    res.sendFile()(html);
  });

app.post('/api',function(req,res){
    res.set('Access-Control-Allow-Origin','*');
    blog.fetch(function(err,blog){
        if (err){
            console.log(err)
        }
        res.json(blog);
    })

})
app.post('/api/checklogin',urlencodedParser,function(req,res){
    let currenttime=new Date().getTime();
    user.checklogin(req.body.token,function(err,checker){
        if (err){
            console.log(err)
        }
        if(checker===null){
            res.json({stutas:404})
        }else if((currenttime-checker.lastlogin)/1000>30*60){
            res.json({stutas:500})
        }else{
            res.json({
                stutas:200,
                info:{
                    user:checker.user,
                    nickname:checker.nickname,
                    sign:checker.sign,
                    authority:checker.authority,
                    sex:checker.sex,
                    imgurl:'/static/header/'+checker.imgurl
                }
            })
        }
    })
    
})
//登录接口
app.post('/api/check',urlencodedParser,function(req,res){
    console.log(req.body.username+'登录'+new Date())
    user.check(req.body.username,function(err,loginer){
        let userinfo={};
        if (err){
            console.log(err)
        }
        if(loginer===null){
            userinfo={
                stutas:-1,
                info:{}
            }
        }else{
            if(loginer.password===req.body.password){
                let condition ={user:loginer.user};
                console.log(condition)
                let update={
                        $set : {
                            token:methods.getmd5(new Date()+user._id),
                            lastlogin:new Date().getTime()
                        }
                    }

                user.update(condition, update,function(err){
                    if (err){
                        console.log(err);
                    }   
                })
            
                userinfo={
                    stutas:200,
                    info:{
                        user:loginer.user,
                        token:update.$set.token,
                        nickname:loginer.nickname,
                        sign:loginer.sign,
                        authority:loginer.authority,
                        sex:loginer.sex,
                        imgurl:loginer.imgurl
                    }
                }
            }else{
                userinfo={
                    stutas:0,
                    info:{}
                }
            }
        }
        res.json(userinfo)
   })

})
//文章详情页接口
app.post('/api/detail',urlencodedParser,function(req,res){
    res.set('Access-Control-Allow-Origin','*');
    blog.findBytitle(req.body.title,function(err,blog){
        if (err){
            console.log(err)
        }
        res.json(blog);
    })

})
//管理接口
app.post('/api/manage',function(req,res){
    res.set('Access-Control-Allow-Origin','*');
    blog.findonlytitle(function(err,blog){
        if (err){
            console.log(err)
        }
        res.json(blog);
    })
})
//修改用户信息
app.post('/api/updateuser',urlencodedParser,function(req,res){
    methods.sec(req.body.token).then(data=>{
        let conditions={user:req.body.user};
        let update=req.body
        user.update(conditions, update,function(err){
            if (err){
                console.log(err);
                res.json({status:0});
            }
            res.json({status:200});
        })  
    },err=>{
        res.json({status:0});
    })
    
})
app.post('/api/updatepassword',urlencodedParser,function(req,res){
    methods.sec(req.body.token).then(data=>{
        let condition={user:req.body.user};
        let update={
                $set : {
                    password:req.body.new_pwd
                }
            }
        user.check(req.body.user,function(err,pwduser){
            if (err){
                console.log(err);
                res.json({status:0});//连接数据库失败
            }
            if(pwduser.password===req.body.password){
                user.update(condition, update,function(err){
                    console.log(err)
                    if (err){
                        console.log(err);
                        res.json({status:0});
                    }
                    res.json({status:200});
                })

            }else{
                res.json({status:-1});//密码错误
            }
        })
    },err=>{
        res.json({status:0});
    })
})
//保存文章接口
app.post('/api/saveart',urlencodedParser,function(req,res){
    methods.sec(req.body.token).then(data=>{
        let conditions ={_id:req.body.id};
        let update={
                $set : {
                    title:req.body.title,
                    content:req.body.content,
                    author:req.body.author,
                    updatetime:new Date()
                }
            }

        blog.update(conditions, update,function(err){
            if (err){
                console.log(err)
                res.json({status:0});
            }
            res.json({status:200});
            
        })
    },err=>{
        res.json({status:0});
    })
})
//新加文章接口
app.post('/api/addart',urlencodedParser,function(req,res){
    methods.sec(req.body.token)
    .then(data=>{
        let doc = {
            title:req.body.title,
            author:req.body.author,
            content:req.body.content,
            createtime:req.body.createtime
        }
        blog.create(doc,function(err){
           if (err){
                console.log(err)
                res.json({status:0});
            }else{
                console.log(200)
                res.json({status:200});
            } 
           
        })
    },err=>{
        res.json({status:0});
    })
})
//删除文章接口
app.post('/api/deleteart',urlencodedParser,function(req,res){
    methods.sec(req.body.token).then(data=>{
        let conditions ={_id:req.body.id};
        blog.remove(conditions,function(err){
            if (err){
                console.log(err)
                res.json({status:0});
            }
            res.json({status:200});
        })
    },err=>{
        res.json({status:200});
    })

})
//上传图片接口
app.post('/api/upload',function(req,res){
    let form = new multiparty.Form();
    let msg={}
    form.encoding = 'utf-8';
    form.uploadDir = path.resolve(__dirname, '..')+"/dist/static/header";
    //设置单文件大小限制
    form.maxFilesSize = 2 * 1024 * 1024;
    //form.maxFields = 1000;  设置所以文件的大小总和
    form.parse(req, function(err, fields, files) {
        if(err){
            console.log(err)
            msg={
                status:"0"
            }
            res.send(msg);
            return ;
        }
        let pathname=files.file[0].path;
        let filename=pathname.substr(pathname.indexOf('header\\')+7)
        msg={
                status:'200',
                name:filename
            }
        user.update({user:req.query.user},{imgurl:filename},function(err){
            if(err){
                console.log(err)
            }
        })
           
        res.send(msg);
    });



})

var server = app.listen(80, function () {
 
  var host = server.address().address
  var port = server.address().port
 
  console.log("应用实例，访问地址为 http://%s:%s", host, port)
 
})