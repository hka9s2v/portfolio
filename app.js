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
function getUser (username, callback) {
  const sql = "SELECT * FROM users WHERE username = ?"
	con.query(sql, username ,function (err, user) {  
    if (err || user.length === 0){ 
      return callback(null)
    }else{
      return callback(user)
    } 
	});
}

// ユーザの新規追加
function addUser (username, passwd, callback) {
  const hash = getHash(passwd)
  const token = getAuthToken(username)
  const sql1 = "INSERT INTO users(username, hash, token) VALUES(?,?,?)"
	con.query(sql1, [username, hash, token] ,function (err) {  
    if (err) return callback(null)
    //user Id取得
    const sql2 = "SELECT id FROM users WHERE username = ?";
    con.query(sql2,username,function (err, result) {
      const id = result[0].id;
      return callback(token, id)
    })
	});
}

// ログインの試行
function login (username, passwd, callback) {
  const hash = getHash(passwd)
  const token = getAuthToken(username)
  // ユーザ情報を取得
  getUser(username, (user) => {
    if(!user){
      return callback(new Error('存在しないユーザーです'), null)     
    }
    const userresult= Object.values(JSON.parse(JSON.stringify(user)));
    if (userresult[0].hash !== hash) {
      return callback(new Error('パスワードが誤っています。'), null)
    }
    // 認証トークンを更新
    userresult[0].token = token
    updateUser(userresult, (err) => {
      if (err) return callback(new Error('サーバーエラー'), null)
      //user Id取得
      const sql = "SELECT id FROM users WHERE username = ?";
      con.query(sql,username,function (err, result) {
        if (err) return callback(new Error('サーバーエラー'), null)
        const id = result[0].id;
        return callback(null, token, id)
      })
    })
  })
}

// 認証トークンの確認
function checkToken (username, token, callback) {
  // ユーザ情報を取得
  getUser(username, (user) => {
    if(!user){
      return callback(new Error('存在しないユーザーです'), null)     
    }
    const userresult= Object.values(JSON.parse(JSON.stringify(user)));
    if (userresult[0].token !== token) {
      return callback(new Error('認証に失敗'), null)
    }
    return callback(null, userresult[0])
  })
}

// ユーザ情報を更新
function updateUser (userresult, callback) {
  const sql = "UPDATE users SET token = ? WHERE username = ?";
	con.query(sql,[userresult[0].token, userresult[0].username],function (err, result) {
	if (err) throw callback(err, null);
	return callback(null);
	});
}

function checkConnection () {
  const sql = "SELECT * FROM users LIMIT 1";
	con.query(sql,function (err, result) {
    if(!err)return;
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      conConnect(()=>{
        console.log('connected db')
        return;
      });
    } else {
      console.log('db error')
      return
    }
	});
}

//⑥で使用
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
app.get('/login', (req, res, next) => {
  const username = req.query.username
  const passwd = req.query.passwd
  login(username, passwd, (err, token, userId) => {
    if (err) return next(new Error(err.message));
    // ログイン成功したらトークンを返す
    res.status(202).json({token, userId})
  })
})

// ②ユーザ追加API(曲を削除しないよう運用する必要あり)
app.get('/adduser', (req, res, next) => {
  const username = req.query.username
  const passwd = req.query.passwd
  if (username ==='' || passwd ==='')return next(new Error('パラメータが空です'));
  // 既存ユーザのチェック
  getUser(username, (user) => {
    if (user) return next(new Error('既に登録済みのユーザidです'));
    // 新規追加
    addUser(username, passwd, (token, userId) => {
      if (!token) return next(new Error('DBエラー(ユーザ作成時エラー)'));
      //曲数取得
      const sql = "INSERT INTO usersongs(songId,userId,clearLamp) SELECT songs.id, ?, 7 FROM songs "
      con.query(sql ,userId ,function(err, result) {
        if (err) return next(new Error('DBエラー'));
        return res.status(201).json({token, userId})
      });   
    })
  })
})

/* ③ユーザー毎の曲情報取得api */
app.post('/getSongByUser',(req, res, next) => {
  checkConnection();
  console.log('server ok');
  const sql = "SELECT songs.name AS songName, usersongs.clearLamp AS clearLamp, color.colorCode AS color, songs.id AS songId, songs.difficulty AS difficulty FROM usersongs INNER JOIN users ON usersongs.userId = users.id INNER JOIN color ON usersongs.clearLamp = color.id INNER JOIN songs ON usersongs.songId = songs.id WHERE users.username = ? ORDER BY songName";
	con.query(sql,req.body.username,function (err, result, fields) {
	if (err) return next(new Error('曲情報の取得に失敗しました'));
  res.json(result);
	});
})

/* ④ユーザー毎のランプ保存用api */
app.post('/SaveClearlampByUser1/', (req, res, next) => {
  checkConnection();
  const clearLamp = req.body.clearLamp;
  const userId = req.body.userId;
  const songId = req.body.songId;
	const sql = "UPDATE usersongs SET clearLamp = ? WHERE userId = ? AND songId = ?";
	con.query(sql,[clearLamp, userId, songId],function (err, result, fields) {
	if (err) return next(new Error('クリアランプの更新に失敗しました'));
	res.json(result);
	});
})

/* ④ユーザー毎のランプ保存用api */
app.post('/SaveClearlampByUser/', (req, res, next) => {
  checkConnection();
  const clearLamp = req.body.clearLamp;
  const userId = req.body.userId;
  const songId = req.body.songId;
  const token = req.body.token;
  const username = req.body.username;
  checkToken(username, token, (err, user) =>{
    if(err) return next(new Error('ログインしてください'));
    const sql = "UPDATE usersongs SET clearLamp = ? WHERE userId = ? AND songId = ?";
    con.query(sql,[clearLamp, userId, songId],function (err, result, fields) {
    if (err) return next(new Error('クリアランプの更新に失敗しました'));
    res.json(result);
    });
  })
})

/* ⑤ユーザー削除用api */
app.post('/DeleteUser/',(req, res, next)=>{
  checkConnection();
  const token = req.body.token;
  const username = req.body.username;
  const userId = req.body.userId
  console.log(token, username, userId)
	const sql1 = "DELETE FROM usersongs WHERE userId = ? ";
  const sql2 = "DELETE FROM users WHERE id = ? ";
  checkToken(username, token, (err, user) =>{
    if(err) return next(new Error('ログインしてください'));
    con.query(sql1 ,userId ,function (err) {
      if (err) return next(new Error('DBエラー'));
      con.query(sql2 ,userId ,function (err, result) {
        if (err) return next(new Error('DBエラー'));
        res.json(result);
      });
    });
  })
})

/* ⑥曲追加用api */
app.post('/AddSong/',(req, res, next)=>{
  checkConnection();
  const songname = req.body.songname;
  const difficulty = req.body.difficulty;
	const sql1 = "INSERT INTO songs(name,difficulty) VALUES (? ,?) ";
  const sql2 = "INSERT INTO usersongs(songId,userId,clearLamp) SELECT ? ,users.id, 7 FROM users "
  con.beginTransaction(function(err) {
    if (err) return next(new Error('DBエラー'));
    con.query(sql1 ,[songname ,difficulty] ,function (err, result1) {
      if (err) {
        return con.rollback(function() {
          return next(new Error('DBエラー'));
        });
      };
      const songid = result1.insertId;
      con.query(sql2 ,songid ,function(err, result2) {
        if (err){ 
          return con.rollback(function() {
            return next(new Error('DBエラー'));
          });
        }
        con.commit(function(err) {
          if (err) {
            return con.rollback(function() {
              return next(new Error('DBエラー'));
            });
          }
        res.json(result2);
        });
      });
    });
  });
});

/* ⑥曲データCSV読み込みapi(test) */
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
