//percent and encodeLevelData are "imported" from encoder.js
let ID = 0; //used to keep track of ongoing encoding calculations
const dwl = document.getElementById('dwl100');
const ob = document.getElementById("opt100"); //output box
const ld = document.getElementById("ld100"); //loading gif
const input = document.getElementById("inp100");
const imagedisplay = document.getElementById("img100");

function changeimg(){
    let fileReader = new FileReader();
    ld.hidden = false; //show the 3 dot loading gif
    percent.textContent = '0.00%'; //just here to ensure graphical consistency
    dwl.hidden = true; //hide download button if visible
    
    while(ob.firstChild){ //empty the output box if it has anything
        ob.removeChild(ob.lastChild);
    }
    
    ID++;
    
    fileReader.onload = function(e){
      imagedisplay.onload = function(){
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
         let imgdata = cnt.getImageData(0,0,w,h).data;
         
         function afterEncode(lvldata){             
             //clear existing level data in the page if there's any
             ob.innerHTML = '';
         
             //display image data
             let df = document.createDocumentFragment(); //document fragment
             let i = 0;
             if(lvldata.length <= 256){
                 for(let i = 0; i < lvldata.length; i++){
                     let num = document.createTextNode(lvldata[i]);
                     let br = document.createElement('br');
                     df.appendChild(num);
                     df.appendChild(br);
                 }
             }else{
                 let L = 126;
                 for(let i = 0; i < Math.floor(L); i++){
                     let num = document.createTextNode(lvldata[i]);
                     let br = document.createElement('br');
                     df.appendChild(num);
                     df.appendChild(br);
                 }
                 for(let i = 0; i < 4; i++){
                     let num = document.createTextNode('        :');
                     let br = document.createElement('br');
                     df.appendChild(num);
                     df.appendChild(br);
                 }
                 for(let i = lvldata.length - Math.ceil(L); i < lvldata.length; i++){
                     let num = document.createTextNode(lvldata[i]);
                     let br = document.createElement('br');
                     df.appendChild(num);
                     df.appendChild(br);
                 }
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
             dwl.href = fls;
             dwl.hidden = false; //show download button
             ld.hidden = true; //hide to loading gif 
             console.log('done');
         }
         
         setTimeout(encodeLevelData(imgdata,w,h,afterEncode,ID));
      };
      imagedisplay.src = e.target.result;
    };
    
    fileReader.readAsDataURL(input.files[0]);
}