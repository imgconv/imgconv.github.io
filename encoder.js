const LOOKBACK = 0xfff; //maximum lookback length, trade compression for speed
const TARGET_FRAMERATE = 15; //target frames per second, the higher the smoother slows the encoding process

function encodeLevelData(imageData,iwidth,iheight,afterEncode){
    console.log(iwidth,iheight);
    let width = [iwidth];
    let height = [iheight];
    let mip = [[]]; //images for the indiviual miplevels
    let uncompressedleveldata = [];
    let compressedleveldata = [];
    let lastmip;
    //---------------------Transform imageData from 0-255 sRGB to 0-1 linear and strip off the alpha component-----------------
    for(let i = 0;i < imageData.length/4;i++){
        mip[0][i*3 + 0] = Math.pow(imageData[i * 4 + 0] / 255, 2.2);
        mip[0][i*3 + 1] = Math.pow(imageData[i * 4 + 1] / 255, 2.2);
        mip[0][i*3 + 2] = Math.pow(imageData[i * 4 + 2] / 255, 2.2);
    }
    
    let step1;
    let step2;
    let step3;
    let step4;
    //---------------------Generate MipMaps-------------------------
    let mipi = 1; //Mip Index
    
    step1 = function(){
        if (width[mipi - 1] == 1 && height[mipi - 1] == 1) {
            setTimeout(step2);
            return;
        }
        
        if (width[mipi - 1] > 1) {
            width[mipi] = Math.floor(width[mipi - 1] / 2);
        }else {
            width[mipi] = width[mipi - 1];
        }
        
        if (height[mipi - 1] > 1) {
            height[mipi] = Math.floor(height[mipi - 1] / 2);
        }else {
            height[mipi] = height[mipi - 1];
        }
        
        console.log(width[mipi],height[mipi]);
        
        mip[mipi] = [];
        for(let i = 0;i < height[mipi];i++){
            for(let j = 0;j < width[mipi];j++){
                let r,g,b;
                let num = 1; //number of pixels sampled so far
                
                //the pow 2.2f is to transform the images from sRGB to "Linear Space"
                r = mip[mipi - 1][((j * 2) + (i * 2) * width[mipi - 1])*3 + 0];
                g = mip[mipi - 1][((j * 2) + (i * 2) * width[mipi - 1])*3 + 1];
                b = mip[mipi - 1][((j * 2) + (i * 2) * width[mipi - 1])*3 + 2];
                
                if(width[mipi] < width[mipi - 1]){
                    r += mip[mipi - 1][((j * 2 + 1) + (i * 2) * width[mipi - 1])*3 + 0];
                    g += mip[mipi - 1][((j * 2 + 1) + (i * 2) * width[mipi - 1])*3 + 1];
                    b += mip[mipi - 1][((j * 2 + 1) + (i * 2) * width[mipi - 1])*3 + 2];
                    num++;
                }

                if(height[mipi] < height[mipi - 1]){
                    r += mip[mipi - 1][((j * 2) + (i * 2 + 1) * width[mipi - 1])*3 + 0];
                    g += mip[mipi - 1][((j * 2) + (i * 2 + 1) * width[mipi - 1])*3 + 1];
                    b += mip[mipi - 1][((j * 2) + (i * 2 + 1) * width[mipi - 1])*3 + 2];
                    num++;
                }

                if(height[mipi] < height[mipi - 1] && width[mipi] < width[mipi - 1]){
                    r += mip[mipi - 1][((j * 2 + 1) + (i * 2 + 1) * width[mipi - 1])*3 + 0];
                    g += mip[mipi - 1][((j * 2 + 1) + (i * 2 + 1) * width[mipi - 1])*3 + 1];
                    b += mip[mipi - 1][((j * 2 + 1) + (i * 2 + 1) * width[mipi - 1])*3 + 2];
                    num++;
                }
                
                //divide by number of samples for averaging
                r /= num; 
                g /= num;
                b /= num;
                
                //store the computed r g b values into the list
                mip[mipi][(j + i * width[mipi])*3 + 0] = r;
                mip[mipi][(j + i * width[mipi])*3 + 1] = g;
                mip[mipi][(j + i * width[mipi])*3 + 2] = b;
            }
        }
        mipi++;
        setTimeout(step1);
        return;
    };
    
    //----------------Generate the uncompressed output------------------------
    step2 = function(){
        lastmip = mipi - 1;
        compressedleveldata.push(lastmip); //number of miplevels
        let mipline = (lastmip + 1) * 3 + 1;
        for(let i = 0; i<= lastmip;i++){
            compressedleveldata.push(mipline); //the item from which data for ith miplevel begins
            compressedleveldata.push(width[i]);
            compressedleveldata.push(height[i]);
            mipline += width[i] *  height[i];
        }
        
        //--------------------------fill uncompressedleveldata-------------------------
        { 
            let pos = 0;
            for(let j = 0;j <= lastmip;j++){
                for (i = 0; i < width[j] * height[j]; i++){
                    let r = Math.floor(Math.pow(mip[j][i*3 + 0],0.4545)*255);
                    let g = Math.floor(Math.pow(mip[j][i*3 + 1],0.4545)*255);
                    let b = Math.floor(Math.pow(mip[j][i*3 + 2],0.4545)*255);
                    let val = (r << 16) | (g << 8) | (b);
                    uncompressedleveldata[pos] = val;
                    pos++;
                }
            }
        }
        setTimeout(step3);
    }
    
    //--------------------------compress the rest of level data---------------------
    step3 = function(){
        compressedleveldata.push(0);
        compressedleveldata.push(0);
        compressedleveldata.push(uncompressedleveldata[0]);
        let rd = 1;
        let length = uncompressedleveldata.length;
        console.log("uncompressed: "+length);
        let time = Date.now();
        let loop = function(){
            if (!(rd < length)){
                setTimeout(step4)
                return;
            }
            let dist = 0;
            let rep = 0;
            for (let i = 1; (rd - i >= 0 && i < LOOKBACK);i++){
                let j = 0;
                while(uncompressedleveldata[rd - i + j] == uncompressedleveldata[rd + j] && (rd + j) < (length - 1)){
                    j++;
                }
                if(j > rep){
                    rep = j;
                    dist = i;
                }
            }
            rd += rep;
            compressedleveldata.push(dist);
            compressedleveldata.push(rep);
            compressedleveldata.push(uncompressedleveldata[rd]);
            rd++;
            if(Date.now() - time > 1000/TARGET_FRAMERATE){
                time = Date.now();
                setTimeout(loop);  
            } else{
                loop();
            } 
        }
        loop();
    }
    
    step4 = function(){
        console.log("compressed: "+compressedleveldata.length);
        afterEncode(compressedleveldata); //trigger the callback with level data as param
    }
    
    step1();
}