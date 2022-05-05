//###############################################
//      SignUp.js ユーザー新規登録画面
//###############################################
import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import {Navigate} from 'react-router-dom'
import {useState} from 'react';

const theme = createTheme();

export default function SignUp() {
  //state定義
  const [jump,setjump] = useState('')

//-----------------------------------------------
//     関数定義
//-----------------------------------------------
  //新規登録ボタン押下時のイベントハンドラ定義
  const handleSubmit = (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    // eslint-disable-next-line no-console
    const params= {username:data.get('Id'),passwd:data.get('password')};
    const qs = new URLSearchParams(params);
    fetch(`/adduser?${qs}`,{
      method: 'GET'
    })
    .then(res=>{
      //ReadableStreamオブジェクトからデータを取得
      if (!res.ok) {
        res.json()
        .then(body =>{
          throw new Error(body.error)
        })
        .catch(error=>{
          window.alert(error.message);
        })
      }else{
        res.json()
        .then(body =>{
          if (body.token && body.userId) {
            // 認証トークンをlocalStorageに保存
            window.localStorage['username'] = data.get('Id')
            window.localStorage['auth_token'] = body.token
            window.localStorage['userId'] = body.userId
            setjump('/')
            return
          }
        })
      }
    })
  };

//-----------------------------------------------
//     JSX(mui利用)
//-----------------------------------------------
  return (
    <ThemeProvider theme={theme}>
      {jump?<Navigate to={jump} />:""
      }
      <Grid container component="main" sx={{ height: '100vh' }}>
        <CssBaseline />
        <Grid
          item
          xs={false}
          sm={4}
          md={7}
          sx={{
            /*backgroundImage: 'url(https://source.unsplash.com/random)',*/
            backgroundRepeat: 'no-repeat',
            backgroundColor: (t) =>
              t.palette.mode === 'light' ? t.palette.grey[50] : t.palette.grey[900],
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <Grid item xs={12} sm={8} md={5} component={Paper} elevation={6} square>
          <Box
            sx={{
              my: 8,
              mx: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
              <LockOutlinedIcon />
            </Avatar>
            <Typography component="h1" variant="h5">
              Sign Up
            </Typography>
            <Box component="form" noValidate onSubmit={handleSubmit} sx={{ mt: 1 }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="Id"
                label="Id"
                name="Id"
                autoComplete="Id"
                autoFocus
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="current-password"
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
              >
               Sign Up
              </Button>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </ThemeProvider>
  );
}