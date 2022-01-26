function changeimg(){
    let input = document.getElementById("inp100");
    let fileReader = new FileReader();
    let imagedisplay = document.getElementById("img100");
    let ob = document.getElementById("opt100"); //output box
    let ld = document.getElementById("ld100"); //loading gif
    ld.hidden = false; //show the 3 dot loading gif
    
    fileReader.onload = (e) => {
      imagedisplay.onload = ()=>{
         let w = imagedisplay.naturalWidth;
         let h = imagedisplay.naturalHeight;
         
         imagedisplay.width = 800;
         imagedisplay.height = 800 * h/w;
         
         //Get image data
         let cvs = document.createElement('canvas');
         cvs.width = w;
         cvs.height = h;
         let cnt = cvs.getContext('2d');
         cnt.drawImage(imagedisplay,0,0);
         imgdata = cnt.getImageData(0,0,w,h).data;
         
         function afterEncode(lvldata){
             //clear existing level data in the page if there's any
             ob.innerHTML = '';
         
             //display image data
             let df = document.createDocumentFragment(); //document fragment
             for(let i = 0; i < Math.min(lvldata.length,256); i++){ //only display the first 256 lines of the list so the browser doesn't choke
                 let num = document.createTextNode(lvldata[i]);
                 let br = document.createElement('br');
                 df.appendChild(num);
                 df.appendChild(br);
             }
             ob.appendChild(df); //append everything at once
         
             //create a downloadable textfile
             let fls = "data:text/plain;charset=\'utf-8\',";
             for(let i = 0; i < lvldata.length - 1; i++){
                 fls += String(lvldata[i]);
                 fls += '%0D%0A';
             }
             fls += String(lvldata[lvldata.length - 1]);
         
             //show the download button
             let dwl = document.getElementById('dwl100');
             dwl.href = fls;
             dwl.hidden = false; //show download button
             ld.hidden = true; //hide to loading gif 
             console.log('done');
         }
         
         let lvldata = encodeLevelData(imgdata,w,h,afterEncode);
      };
      imagedisplay.src = e.target.result;
    };
    
    fileReader.readAsDataURL(input.files[0]);
}