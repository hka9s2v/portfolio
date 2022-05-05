//###############################################
//    App.js 難易度表アプリメイン画面
//###############################################
import React ,{useEffect, useState} from 'react';
import Box from '@material-ui/core/Box';
import { Link } from "react-router-dom";
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import Song from './Song';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import PropTypes from 'prop-types';
import Avatar from '@material-ui/core/Avatar';
import Grid from '@material-ui/core/Grid';
import { Navigate } from 'react-router-dom'
import Fab from '@mui/material/Fab';
import NavigationIcon from '@mui/icons-material/Navigation';

var navigateFlg = false;

//"マイアカウント"ポップアップのコンポーネント定義
function SimpleDialog(props) {
  const { onClose, selectedValue, open } = props;

  //"戻る"ボタン押下時
  const handleClose = () => {
    onClose(selectedValue);
  };

  //アカウント削除ボタン押下時
  const handleDeleteAccount = () => {
    let JSONbody = '{"token":"' + window.localStorage.auth_token + '","username":"' + window.localStorage.username + '","userId":"'+ window.localStorage.userId + '"}'
    let check = window.confirm('アカウントを削除します。よろしいですか？');
    if(!check) return onClose(selectedValue);
    fetch(`/DeleteUser/`,{
      method: 'POST',
      headers:{'Content-Type': 'application/json'},
      body: JSON.stringify(JSONbody).replace(/\\/g, "").slice(1).slice(0,-1)
    })
    .then(res=>{
      if (!res.ok) {
        res.json()
        .then(body =>{
          throw new Error(body.error)
        })
        .catch(error=>{
          window.alert(error.message);
        })
      }else{
        navigateFlg = true
        onClose(selectedValue);
        return
      }
    })
  };

  return (
    <Dialog onClose={handleClose} aria-labelledby="simple-dialog-title" open={open}  style={{margin: 30}}>
      <DialogTitle id="simple-dialog-title">ユーザー:{window.localStorage.username}</DialogTitle>
      <hr/>
      <Button variant="contained" color="error" style={{margin: 15}} onClick={handleDeleteAccount}>
        アカウント削除
      </Button>
      <Button variant="contained" style={{marginTop: 0, margin: 15}} onClick={handleClose}>
        戻る
      </Button>
    </Dialog>
  );
}

SimpleDialog.propTypes = {
  onClose: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
  selectedValue: PropTypes.string.isRequired,
};

function App() {
  //state定義
  const [songList,setSongList] = useState([{songName:'',clearLamp:'',color:'',songId:'',difficulty:''}])
  const [userId] = useState(window.localStorage.userId)
  const [jump,setjump] = useState('')
  const [open, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  //定数定義
  //クリアランプ毎の曲数を保存する配列
  const rows = [getNumOfSongsByClearLamp(songList)];

//-----------------------------------------------
//     useEffect(初回処理)
//-----------------------------------------------
  useEffect(() => {

    //ユーザー情報に応じて曲情報を取得
    fetch(`/getSongByUser`,{
      method:'POST',
      headers:{'Content-Type': 'application/json'},
      body: JSON.stringify({username: window.localStorage.username})
    })
    .then(res=>{
      if (res.ok) {
        res.json()
        .then(songdata=>setSongList(songdata))
      }else{
        res.json()
        .then(body =>{
          throw new Error(body.error)
        })
        .catch(error=>{
          window.alert(error.message);
        })
      }
    })

  },[]);//第2引数に[]を指定してマウント時に1度だけ実行させる

//-----------------------------------------------
//     関数定義
//-----------------------------------------------
//APIで取得した曲リストを難易度でフィルター
  function getSongListByDifficulty(InSongList, FilterText){
    // eslint-disable-next-line
    return InSongList.filter((item, index) => {
        if (item.difficulty === FilterText)
          return true;
      })
  }

//クリアランプ毎の曲数を取得
  function getNumOfSongsByClearLamp(InSongList){
    // eslint-disable-next-line
    let AAA = InSongList.filter(function(item, index){if(item.clearLamp ===  0) return true;}).length
    // eslint-disable-next-line
    let AA = InSongList.filter(function(item, index){if(item.clearLamp ===  1) return true;}).length
    // eslint-disable-next-line
    let A = InSongList.filter(function(item, index){if(item.clearLamp ===  2) return true;}).length
    // eslint-disable-next-line
    let B = InSongList.filter(function(item, index){if(item.clearLamp ===  3) return true;}).length
    // eslint-disable-next-line
    let C = InSongList.filter(function(item, index){if(item.clearLamp ===  4) return true;}).length
    // eslint-disable-next-line
    let D = InSongList.filter(function(item, index){if(item.clearLamp ===  5) return true;}).length
    // eslint-disable-next-line
    let E = InSongList.filter(function(item, index){if(item.clearLamp ===  6) return true;}).length
    // eslint-disable-next-line
    let F = InSongList.filter(function(item, index){if(item.clearLamp ===  7) return true;}).length
    let ALL = InSongList.length
    return { AAA, AA, A, B, C, D, E, F ,ALL};
  }

  //左上のツールバーアイコンクリック時
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  //左上のツールバーを閉じる
  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  //"マイアカウント"ポップアップを開く
  const handleOpenDialog = () => {
    setOpen(true);
    setAnchorEl(null);
  };

  //"マイアカウント"ポップアップを閉じる
  const handleCloseDialog = () => {
    setOpen(false);
    if(navigateFlg === true){
      navigateFlg = false
      setjump('/SignInSide')
      return 
    } 
  };

  //"Navigate To Top"押下時にページトップまでスクロール
  const handleClickFab = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

//-----------------------------------------------
//     JSX
//-----------------------------------------------
  return (
    <Grid className="table_parent">
      {/*  state登録されていたら当該画面にNavigateで遷移させる */}
      {jump?<Navigate to={jump} />:""}
      {/*  ヘッダー部 */}
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static" sx={{backgroundColor: '#0077c2'}}>
          <Toolbar>
            <IconButton size="large" edge="start" color="inherit" aria-label="menu" sx={{ mr: 2 }} onClick={handleClick}>
              <MenuIcon />
            </IconButton>
            <Menu
              id="simple-menu"
              anchorEl={anchorEl}
              keepMounted
              open={Boolean(anchorEl)}
              onClose={handleCloseMenu}
            >
              <MenuItem onClick={handleOpenDialog}>マイアカウント</MenuItem>
                <SimpleDialog open={open} onClose={handleCloseDialog} />
              <MenuItem onClick={handleCloseMenu}>
                {window.localStorage.username?
                <Link to="/SignInSide" sx={{ textDecoration: 'none', color: '#000' }}>ログアウト</Link>:
                <Link to="/SignInSide" sx={{ textDecoration: 'none', color: '#000' }}>ログイン</Link>}
              </MenuItem>
            </Menu>
            <Grid container justifyContent="flex-end">
              <Avatar/>
            </Grid>
          </Toolbar>
        </AppBar>
      </Box>
      {/*  タイトル  */}
      <Box style={{ marginBottom: 0, margin: 30}}>
        <Typography variant="h4" component="div" sx={{ flexGrow: 1 ,fontSize:{xs: '28px', sm: '34px'}}} align="center" fontWeight='bold'>
          Lv12スコア難易度表
        </Typography>
      </Box>
      <Box style={{ marginTop: 0, margin: 10}}>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }} align="center">
          ユーザー:{window.localStorage.username}
        </Typography>
      </Box>
      {/*  集計テーブル  */}
      <TableContainer style={{ margin:'auto', width:'80%', maxWidth: '1000px'}}>
        <Table aria-label="simple table" style={{border: '1px solid #e0e0e0'}}>
          <TableHead>
            <TableRow>
              <TableCell style={{backgroundColor:'#ff8c00',textAlign:'center'}}>AAA</TableCell>
              <TableCell style={{backgroundColor:'#ffd900',textAlign:'center'}}>AA</TableCell>
              <TableCell style={{backgroundColor:'#afeeee',textAlign:'center'}}>A</TableCell>
              <TableCell style={{backgroundColor:'#affb98',textAlign:'center'}}>B</TableCell>
              <TableCell style={{backgroundColor:'#c0c0c0',textAlign:'center'}}>C</TableCell>
              <TableCell style={{backgroundColor:'#c0c0c0',textAlign:'center'}}>D</TableCell>
              <TableCell style={{backgroundColor:'#c0c0c0',textAlign:'center'}}>E</TableCell>
              <TableCell style={{backgroundColor:'#fff',textAlign:'center'}}>F</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.name}>
                <TableCell style={{textAlign:'center'}}>{row.AAA}</TableCell>
                <TableCell style={{textAlign:'center'}}>{row.AA}</TableCell>
                <TableCell style={{textAlign:'center'}}>{row.A}</TableCell>
                <TableCell style={{textAlign:'center'}}>{row.B}</TableCell>
                <TableCell style={{textAlign:'center'}}>{row.C}</TableCell>
                <TableCell style={{textAlign:'center'}}>{row.D}</TableCell>
                <TableCell style={{textAlign:'center'}}>{row.E}</TableCell>
                <TableCell style={{textAlign:'center'}}>{row.F}</TableCell>
              </TableRow>
            ))}
            {rows.map((row) => (
              <TableRow key={row.name}>
                <TableCell style={{textAlign:'center'}}>{(row.AAA/row.ALL*100).toFixed(1)}%</TableCell>
                <TableCell style={{textAlign:'center'}}>{(row.AA/row.ALL*100).toFixed(1)}%</TableCell>
                <TableCell style={{textAlign:'center'}}>{(row.A/row.ALL*100).toFixed(1)}%</TableCell>
                <TableCell style={{textAlign:'center'}}>{(row.B/row.ALL*100).toFixed(1)}%</TableCell>
                <TableCell style={{textAlign:'center'}}>{(row.C/row.ALL*100).toFixed(1)}%</TableCell>
                <TableCell style={{textAlign:'center'}}>{(row.D/row.ALL*100).toFixed(1)}%</TableCell>
                <TableCell style={{textAlign:'center'}}>{(row.E/row.ALL*100).toFixed(1)}%</TableCell>
                <TableCell style={{textAlign:'center'}}>{(row.F/row.ALL*100).toFixed(1)}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {/*  難易度表本体を定義 */}
      <div >
        {/*  地力S+ */}
        <Box style={{margin: "8px 8px 0px 8px",padding: '5px 0px',border:"1px solid #fff", backgroundColor:'#42a5f5',textAlign:"center",fontWeight:"bold", color:"#fff"}}>
        地力S+
        </Box>    
        <Box style={{ display: 'flex', flexWrap: "wrap",alignContent: "center",padding: "0px 8px"}}>
          {getSongListByDifficulty(songList,"地力S+").map((songItem)=>{
          return(
            <Box sx={{width:{xs: '33%', sm: '25%',},border:'0.5px solid #fff', alignContent: 'center', boxSizing: 'border-box'}}>
              <Song key={songItem.songId} className="column" songName={songItem.songName} clearLamp={songItem.clearLamp}
                color={songItem.color} songId={songItem.songId} userId={userId}/>
            </Box>
          );
        })}
        </Box>
        {/*  地力S */}
        <Box sx={{margin: "0px 8px",padding: '5px 0px',border:"1px solid #fff", backgroundColor:'#42a5f5',textAlign:"center",fontWeight:"bold", color:"#fff"}}>
        地力S
        </Box>    
        <Box style={{ display: 'flex', flexWrap: "wrap",alignContent: "center",padding: "0px 8px"}}>
          {getSongListByDifficulty(songList,"地力S").map((songItem)=>{
          return(
            <Box sx={{width:{xs: '33%', sm: '25%',},border:'0.5px solid #fff', alignContent: 'center', boxSizing: 'border-box'}}>
                <Song key={songItem.songId} className="column" songName={songItem.songName} clearLamp={songItem.clearLamp}
                  color={songItem.color} songId={songItem.songId} userId={userId}/>
            </Box>
          );
        })}
        </Box>
        {/*  地力A+ */}
        <Box style={{margin: "0px 8px",padding: '5px 0px',border:"1px solid #fff", backgroundColor:'#42a5f5',textAlign:"center",fontWeight:"bold", color:"#fff"}}>
        地力A+
        </Box>    
        <Box style={{ display: 'flex', flexWrap: "wrap",alignContent: "center",padding: "0px 8px"}}>
          {getSongListByDifficulty(songList,"地力A+").map((songItem)=>{
          return(
            <Box sx={{width:{xs: '33%', sm: '25%',},border:'0.5px solid #fff', alignContent: 'center', boxSizing: 'border-box'}}>
                <Song key={songItem.songId} className="column" songName={songItem.songName} clearLamp={songItem.clearLamp}
                  color={songItem.color} songId={songItem.songId} userId={userId}/>
            </Box>
          );
        })}
        </Box>
        {/*  地力A */}
        <Box style={{margin: "0px 8px",padding: '5px 0px',border:"1px solid #fff", backgroundColor:'#42a5f5',textAlign:"center",fontWeight:"bold", color:"#fff"}}>
        地力A
        </Box>    
        <Box style={{ display: 'flex', flexWrap: "wrap",alignContent: "center",padding: "0px 8px"}}>
          {getSongListByDifficulty(songList,"地力A").map((songItem)=>{
          return(
            <Box sx={{width:{xs: '33%', sm: '25%',},border:'0.5px solid #fff', alignContent: 'center', boxSizing: 'border-box'}}>
                <Song key={songItem.songId} className="column" songName={songItem.songName} clearLamp={songItem.clearLamp}
                  color={songItem.color} songId={songItem.songId} userId={userId}/>
            </Box>
          );
        })}
        </Box>
        {/*  地力B+ */}
        <Box style={{margin: "0px 8px",padding: '5px 0px',border:"1px solid #fff", backgroundColor:'#42a5f5',textAlign:"center",fontWeight:"bold", color:"#fff"}}>
        地力B+
        </Box>    
        <Box style={{ display: 'flex', flexWrap: "wrap",alignContent: "center",padding: "0px 8px"}}>
          {getSongListByDifficulty(songList,"地力B+").map((songItem)=>{
          return(
            <Box sx={{width:{xs: '33%', sm: '25%',},border:'0.5px solid #fff', alignContent: 'center', boxSizing: 'border-box'}}>
                <Song key={songItem.songId} className="column" songName={songItem.songName} clearLamp={songItem.clearLamp}
                  color={songItem.color} songId={songItem.songId} userId={userId}/>
            </Box>
          );
        })}
        </Box>
        {/*  地力B */}
        <Box style={{margin: "0px 8px",padding: '5px 0px',border:"1px solid #fff", backgroundColor:'#42a5f5',textAlign:"center",fontWeight:"bold", color:"#fff"}}>
          地力B
        </Box>    
        <Box style={{ display: 'flex', flexWrap: "wrap",alignContent: "center",padding: "0px 8px"}}>
          {getSongListByDifficulty(songList,"地力B").map((songItem)=>{
          return(
            <Box sx={{width:{xs: '33%', sm: '25%',},border:'0.5px solid #fff', alignContent: 'center', boxSizing: 'border-box'}}>
                <Song key={songItem.songId} className="column" songName={songItem.songName} clearLamp={songItem.clearLamp}
                  color={songItem.color} songId={songItem.songId} userId={userId}/>
            </Box>
          );
        })}
        </Box>
        {/*  地力C */}
                <Box style={{margin: "0px 8px",padding: '5px 0px',border:"1px solid #fff", backgroundColor:'#42a5f5',textAlign:"center",fontWeight:"bold", color:"#fff"}}>
          地力C
        </Box>    
        <Box style={{ display: 'flex', flexWrap: "wrap",alignContent: "center",padding: "0px 8px"}}>
          {getSongListByDifficulty(songList,"地力C").map((songItem)=>{
          return(
            <Box sx={{width:{xs: '33%', sm: '25%',},border:'0.5px solid #fff', alignContent: 'center', boxSizing: 'border-box'}}>
                <Song key={songItem.songId} className="column" songName={songItem.songName} clearLamp={songItem.clearLamp}
                  color={songItem.color} songId={songItem.songId} userId={userId}/>
            </Box>
          );
        })}
        </Box>
        {/*  地力D */}
        <Box style={{margin: "0px 8px",padding: '5px 0px',border:"1px solid #fff", backgroundColor:'#42a5f5',textAlign:"center",fontWeight:"bold", color:"#fff"}}>
          地力D
        </Box>    
        <Box style={{ display: 'flex', flexWrap: "wrap",alignContent: "center",padding: "0px 8px"}}>
          {getSongListByDifficulty(songList,"地力D").map((songItem)=>{
          return(
            <Box sx={{width:{xs: '33%', sm: '25%',},border:'0.5px solid #fff', alignContent: 'center', boxSizing: 'border-box'}}>
                <Song key={songItem.songId} className="column" songName={songItem.songName} clearLamp={songItem.clearLamp}
                  color={songItem.color} songId={songItem.songId} userId={userId}/>
            </Box>
          );
        })}
        </Box>
        {/*  地力E */}
        <Box style={{margin: "0px 8px",padding: '5px 0px',border:"1px solid #fff", backgroundColor:'#42a5f5',textAlign:"center",fontWeight:"bold", color:"#fff"}}>
          地力E
        </Box> 
        <Box style={{ display: 'flex', flexWrap: "wrap",alignContent: "center",padding: "0px 8px"}}>
          {getSongListByDifficulty(songList,"地力E").map((songItem)=>{
          return(
            <Box sx={{width:{xs: '33%', sm: '25%',},border:'0.5px solid #fff', alignContent: 'center', boxSizing: 'border-box'}}>
                <Song key={songItem.songId} className="column" songName={songItem.songName} clearLamp={songItem.clearLamp}
                  color={songItem.color} songId={songItem.songId} userId={userId}/>
            </Box>
          );
        })}
        </Box>
        {/*  地力F */}
        <Box style={{margin: "0px 8px",padding: '5px 0px',border:"1px solid #fff", backgroundColor:'#42a5f5',textAlign:"center",fontWeight:"bold", color:"#fff"}}>
          地力F
        </Box> 
        <Box style={{ display: 'flex', flexWrap: "wrap",alignContent: "center",padding: "0px 8px"}}>
          {getSongListByDifficulty(songList,"地力F").map((songItem)=>{
          return(
            <Box sx={{width:{xs: '33%', sm: '25%',},border:'0.5px solid #fff', alignContent: 'center', boxSizing: 'border-box'}}>
                <Song key={songItem.songId} className="column" songName={songItem.songName} clearLamp={songItem.clearLamp}
                  color={songItem.color} songId={songItem.songId} userId={userId}/>
            </Box>
          );
        })}
        </Box>
        <Grid container alignItems="center" justify="center" style={{ paddingBottom: 0, padding: 30, backgroundColor:"#F5F5F6"}}>
          <Fab variant="extended" onClick={handleClickFab}>
            <NavigationIcon sx={{ mr: 1 }}/>
            Navigate to Top
          </Fab>
        </Grid>
      </div>
    </Grid>
  );
}

export default App;
