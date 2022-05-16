//###############################################
//app.js    サーバーサイド
//###############################################
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
//jsonをリクエストボディとして使うために必要
const bodyParser = require('body-parser');
const app = express();
const mysql = require('mysql');
const fs = require('fs');
const csv = require('csv');
var history = require('connect-history-api-fallback');

app.use(bodyParser.json())//jsonをリクエストボディとして使うために必要

//-----------------------------------------------
//    DB接続
//-----------------------------------------------
/* mysqlに接続(開発環境)*/
const con = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'express_db' 
});

/* 接続確認*/
const conConnect = () =>con.connect(function(err) {
    if (err) throw err;
    console.log('Connected');
  }
);

conConnect();

//-----------------------------------------------
//    関数定義
//-----------------------------------------------
// ハッシュ値(sha512)を取得
function getHash (pw) {
  const salt = '::EVuCM0QwfI48Krpr'
  const crypto = require('crypto')
  const hashsum = crypto.createHash('sha512')
  hashsum.update(pw + salt)
  return hashsum.digest('hex')
}

// 認証用のトークンを生成
function getAuthToken (username) {
  const time = (new Date()).getTime()
  return getHash(`${username}:${time}`)
}

// 以下APIで利用するDBの操作メソッド
// ユーザの検索
function getUser (username) {
  return new Promise((resolve,reject)=>{
    const sql = "SELECT * FROM users WHERE username = ?"
    con.query(sql, username ,function (err, user) {  
      if (err || user.length === 0){ 
        reject(new Error('存在しないユーザーです'))
      }else{
        resolve(user)
      } 
    });
  })
}

// 認証トークンの確認
async function checkToken (username, token) {
  try{
    // ユーザ情報を取得
    const user = await getUser(username)
    if(!user) throw new Error('存在しないユーザーです')
    const userresult= Object.values(JSON.parse(JSON.stringify(user)));
    if (userresult[0].token !== token) throw new Error('認証に失敗')
    return userresult[0]
  }catch(e){
    throw new Error(e.message)
  }
}

//DBの死活確認
function checkConnection () {
  const sql = "SELECT * FROM users LIMIT 1";
  return new Promise((resolve,reject)=>{
    con.query(sql,function (err) {
      if(!err){
        resolve()
      }else{
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
          conConnect(()=>{
            console.log('connected db')
            reject()
          })
        } else {
          console.log('db error')
          reject()
        }
      }
    })
  })
}

//「⑦曲データCSV読み込みapi」で使用
function AddSong(Insongname, Indifficulty, callback){
  const songname = Insongname.replace(/[\"]/g,"")
  const difficulty = Indifficulty.replace(/[\"]/g,"")
  console.log(songname.replace(/[\"]/g,""),difficulty.replace(/[\"]/g,""))
	const sql1 = "INSERT INTO songs(name,difficulty) VALUES (? ,?) ";
  const sql2 = "INSERT INTO usersongs(songId,userId,clearLamp) SELECT ? ,users.id, 7 FROM users "
  con.beginTransaction(function(err) {
    if (err) return callback(new Error('DBエラー'))
    con.query(sql1 ,[songname ,difficulty] ,function (err, result1) {
      if (err) {
        return con.rollback(function() {
          return callback(new Error('DBエラー'))
        });
      };
      const songid = result1.insertId;
      con.query(sql2 ,songid ,function(err, result2) {
        if (err){ 
          return con.rollback(function() {
            return callback(new Error('DBエラー'))
          });
        }
        con.commit(function(err) {
          if (err) {
            return con.rollback(function() {
              return callback(new Error('DBエラー'))
            });
          }
        });
      });
    });
  });
};

//-----------------------------------------------
//    API定義
//-----------------------------------------------
/* ①ログイン認証api */
app.get('/login', async (req, res, next) => {
  try{
    const username = req.query.username
    const passwd = req.query.passwd
    const hash = getHash(passwd)
    const token = getAuthToken(username)

    // ユーザ情報を取得
    const user = await getUser(username)
    if(!user) throw new Error('存在しないユーザーです')  
    const userObj= Object.values(JSON.parse(JSON.stringify(user)));
    if (userObj[0].hash !== hash) throw new Error('パスワードが誤っています。')

    // 認証トークンを更新
    userObj[0].token = token
    await ((user)=>{
      return new Promise((resolve,reject)=>{
        const sql = "UPDATE users SET token = ? WHERE username = ?";
        con.query(sql,[user.token, user.username],(err)=>{
          if (!err){
            resolve()
          }else{
            reject(new Error('存在しないユーザーです'))
          }
       })
      });
    })(userObj[0])

    // user Id取得
    const userId = userObj[0].id

    // ログイン成功したらトークンとユーザーIDを返す
    res.status(202).json({token, userId})

  }catch(e){
    next(new Error(e.message))
  }
})

// ②ユーザ追加API(曲を削除しないよう運用する必要あり)
app.get('/adduser', async (req, res, next) => {
  try{
    const username = req.query.username
    const passwd = req.query.passwd
    const hash = getHash(passwd)
    const token = getAuthToken(username)

    if (username ==='' || passwd ==='')throw new Error('パラメータが空です');

    // 既存ユーザのチェック
    const user1 = await ((username)=>{
      return new Promise((resolve,reject)=>{
        const sql = "SELECT * FROM users WHERE username = ?"
        con.query(sql, username ,function (err, user) {  
          if (err){ 
            reject(new Error('存在しないユーザーです'))
          }else{
            resolve(user)
          } 
        });
      })
    })(username)
    if (user1.length != 0) throw new Error('既に登録済みのユーザidです');
    
    // 新規追加
    const userId = await ((username)=>{
      return new Promise((resolve,reject)=>{
        const sql1 = "INSERT INTO users(username, hash, token) VALUES(?,?,?)"
        con.query(sql1, [username, hash, token] ,function (err,result) {  
          if(err){
            reject(new Error('DBエラー(ユーザ作成時エラー)'))
          }else{
            resolve(result.insertId)
          }
        })
      })
    })(username)

    //初期曲データを登録
    await ((userId)=>{
      return new Promise((resolve,reject)=>{
        const sql = "INSERT INTO usersongs(songId,userId,clearLamp) SELECT songs.id, ?, 7 FROM songs "
        con.query(sql ,userId ,(err)=>{
          if (err){
            reject(new Error('DBエラー(初期曲データ登録時エラー)'))
          }else{
            resolve()
          }
        })
      })
    })(userId)

    // ログイン成功したらトークンとユーザーIDを返す
    res.status(201).json({token, userId})

  }catch(e){
    next(new Error(e.message))
  }
})

/* ③ユーザー毎の曲情報取得api */
app.post('/getSongByUser',async (req, res, next) => {
  try{
    const username = req.body.username;

    //DB死活確認
    await checkConnection();

    //ユーザーに紐づく曲情報の取得
    const result = await ((username)=>{
      return new Promise((resolve,reject)=>{
        const sql = "SELECT songs.name AS songName, usersongs.clearLamp AS clearLamp, color.colorCode AS color, songs.id AS songId, songs.difficulty AS difficulty FROM usersongs INNER JOIN users ON usersongs.userId = users.id INNER JOIN color ON usersongs.clearLamp = color.id INNER JOIN songs ON usersongs.songId = songs.id WHERE users.username = ? ORDER BY songName";
        con.query(sql,username,function (err, result) {
          if (err){
            reject(new Error('曲情報の取得に失敗しました'))
          }else{
            resolve(result)
          }
        })
      })
    })(username);

    // ログイン成功したら曲情報を返す
    res.json(result);

  }catch(e){
    next(new Error(e.message))
  }
})

/* ④ユーザー毎のランプ保存用api */
app.post('/SaveClearlampByUser/', async (req, res, next) => {
  try{
    const clearLamp = req.body.clearLamp;
    const userId = req.body.userId;
    const songId = req.body.songId;
    const token = req.body.token;
    const username = req.body.username;

    //DB死活確認
    await checkConnection();

    //トークンの確認
    const user = await checkToken(username, token)
    if(!user) throw new Error('ログインしてください');

    //クリアランプを保存
    const result = await ((clearLamp, userId, songId)=>{
      return new Promise((resolve,reject)=>{
        const sql = "UPDATE usersongs SET clearLamp = ? WHERE userId = ? AND songId = ?";
        con.query(sql,[clearLamp, userId, songId],function (err, result) {
              if (err){
            reject(new Error('クリアランプの更新に失敗しました'))
          }else{
            resolve(result)
          }
        })
      })
    })(clearLamp, userId, songId);

    res.json(result);

  }catch(e){
    next(new Error(e.message))
  }
})

/* ⑤ユーザー削除用api */
app.post('/DeleteUser/',async (req, res, next)=>{
  try{
    const token = req.body.token;
    const username = req.body.username;
    const userId = req.body.userId

    //DB死活確認
    await checkConnection();

    //トークンの確認
    const user = await checkToken(username, token)
    if(!user) throw new Error('ログインしてください');

    //ユーザーに紐づく曲データ、及びユーザー情報を削除
    const result = await ((userId)=>{
      return new Promise((resolve,reject)=>{
        con.beginTransaction(function(err) {
          const sql1 = "DELETE FROM usersongs WHERE userId = ? ";
          const sql2 = "DELETE FROM users WHERE id = ? ";
          if (err) reject(new Error('DBエラー'));
          con.query(sql1 ,userId ,function (err) {
            if (err) {
              return con.rollback(function() {
                reject(new Error('DBエラー'));
              });
            };
            con.query(sql2 ,userId ,function (err, result) {
              if (err){ 
                return con.rollback(function() {
                  reject(new Error('DBエラー'));
                });
              }
              con.commit(function(err) {
                if (err) {
                  return con.rollback(function() {
                    reject(new Error('DBエラー'));
                  });
                }
                resolve(result)
              });
            });
          });
        });
      })
    })(userId);

    res.json(result);

  }catch(e){
    next(new Error(e.message))
  }
})

/* ⑥曲追加用api */
app.post('/AddSong/',async (req, res, next)=>{
  try{
    const songname = req.body.songname;
    const difficulty = req.body.difficulty;

    await checkConnection();

    const result2 = await ((songname,difficulty)=>{
      return new Promise((resolve,reject)=>{
        con.beginTransaction(function(err) {
          const sql1 = "INSERT INTO songs(name,difficulty) VALUES (? ,?) ";
          const sql2 = "INSERT INTO usersongs(songId,userId,clearLamp) SELECT ? ,users.id, 7 FROM users "
          if (err) reject(new Error('DBエラー'));
          con.query(sql1 ,[songname ,difficulty] ,function (err, result1) {
            if (err) {
              return con.rollback(function() {
                reject(new Error('DBエラー'));
              });
            };
            const songid = result1.insertId;
            con.query(sql2 ,songid ,function(err, result2) {
              if (err){ 
                return con.rollback(function() {
                  reject(new Error('DBエラー'));
                });
              }
              con.commit(function(err) {
                if (err) {
                  return con.rollback(function() {
                    reject(new Error('DBエラー'));
                  });
                }
                resolve(result2)
              });
            });
          });
        });
      })
    })(songname,difficulty);

    res.json(result2);
    
  }catch(e){
    next(new Error(e.message))
  }
});


/* ⑦曲データCSV読み込みapi(test) */
/*app.get('/CsvUpload', (req, res, next) => {
  checkConnection();
  fs.createReadStream(__dirname + '/public/splv12_score.csv')
  .pipe(csv.parse({columns: true}, function(err, data) {
    console.log(data.length)
    for(let i = 0; i < data.length ; i++){
      /*AddSong(JSON.stringify(data[i].name),JSON.stringify(data[i].difficulty),next,(err)=>{
        if (err) return next(new Error(err.message));
      })
    }
  }));
})*/

//-----------------------------------------------
//    ミドルウェア関数のロード
//-----------------------------------------------
app.use(logger('dev'));
app.use(history());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
// catch 404 and forward to error handler
app.use(function(req, res, next) {next(createError(404));});
// error handler
app.use(function(err, req, res, next) {
  // render the error page
  res.status(err.status || 500).json({error: err.message});
});

//-----------------------------------------------
//    WEBサーバーを起動
//-----------------------------------------------
const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`Server running on port ${port}`));

module.exports = app;
