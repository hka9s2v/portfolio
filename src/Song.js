//###############################################
//song.js    曲毎のコンポーネントを定義
//###############################################
import React, { useState } from 'react';
import FormControl from '@mui/material/FormControl';
import NativeSelect from '@mui/material/NativeSelect';
import Grid from '@material-ui/core/Grid';
import Box from '@material-ui/core/Box';
import Typography from '@mui/material/Typography';

export default function Song (props){
  //propsで受け取った背景色コードをbackgroundColorに設定
  const [stylesChangeDropdown,setStylesChangeDropdown]=useState({backgroundColor: props.color})

  //ドロップダウン選択時にランプを保存し、スタイル変更する
  const onChange=(e)=>{ 
    let JSONbody = '{"clearLamp":"' + e.target.value + '","userId":"' + props.userId + '","songId":"'+ props.songId + '","token":"'+ window.localStorage.auth_token +'","username":"'+ window.localStorage.username +'"}'

    //SaveClearlampByUser API呼び出し
    fetch('/SaveClearlampByUser/',{
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
      }
    })

    //選択値に応じて動的にスタイル変更させる
    if(e.target.value==0){setStylesChangeDropdown({backgroundColor:'#ff8c00'})}
    else if(e.target.value==1){setStylesChangeDropdown({backgroundColor:'#ffd900'})}
    else if(e.target.value==2){setStylesChangeDropdown({backgroundColor:'#afeeee'})}
    else if(e.target.value==3){setStylesChangeDropdown({backgroundColor:'#affb98'})}
    else if(e.target.value==4){setStylesChangeDropdown({backgroundColor:'#c0c0c0'})}
    else if(e.target.value==5){setStylesChangeDropdown({backgroundColor:'#c0c0c0'})}
    else if(e.target.value==6){setStylesChangeDropdown({backgroundColor:'#c0c0c0'})}
    else{setStylesChangeDropdown({backgroundColor:'#fff'})}

    //Reactコンポーネントを強制的にレンダリング
    setStylesChangeDropdown((stylesChangeDropdown)=>{
      return stylesChangeDropdown
    })
  }

  return (
    <Grid  container alignItems="center" justify="center" style={stylesChangeDropdown}>
      <Typography><Box sx={{fontSize:{xs: '11px', sm: '14px'} ,height:{xs: '35px', sm: '50px'}, textAlign: 'center'}}>{props.songName}</Box></Typography>
      <Grid  container alignItems="center" justify="center">
        <FormControl sx={{ m: 1, minWidth: 80 }}>
          <NativeSelect
            id="demo-simple-select-autowidth"
            onChange={onChange}
            autoWidth
            defaultValue={props.clearLamp}
            sx={{fontSize:{xs: '11px', sm: '14px'}}}
          >
            <option value={0}>AAA</option>
            <option value={1}>AA</option>
            <option value={2}>A</option>
            <option value={3}>B</option>
            <option value={4}>C</option>
            <option value={5}>D</option>
            <option value={6}>E</option>
            <option value={7}>F</option>
          </NativeSelect>
        </FormControl>
      </Grid>
    </Grid>
  );
}



