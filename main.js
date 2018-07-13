window.onclick=function(){
    renderer.domElement.requestPointerLock = renderer.domElement.requestPointerLock ||
                                            renderer.domElement.mozRequestPointerLock;
    renderer.domElement.requestPointerLock()
    mouseLocked = true;
};
window.addEventListener('resize',evt=>{
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );
});
/*function loadJSON(callback) {   

    var xobj = new XMLHttpRequest();
        xobj.overrideMimeType("application/json");
    xobj.open('GET', 'levelData.json', true); // Replace 'my_data' with the path to your file
    xobj.onreadystatechange = function () {
          if (xobj.readyState == 4 && xobj.status == "200") {
            // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
            callback(xobj.responseText);
          }
    };
    xobj.send(null);  
}*/
class main{
    static init(){
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );
        renderer = new THREE.WebGLRenderer();
        renderer.setSize( window.innerWidth, window.innerHeight );
        scene.background = new THREE.Color(0xADD8C6);
        document.body.appendChild( renderer.domElement );
        var animate = function () {
            requestAnimationFrame( animate );
            renderer.render( scene, camera );
        };
        var g1 = new THREE.BoxGeometry( 0.1, 5, 0.1 );
        var m1 = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
        var yaxis = new THREE.Mesh( g1, m1 );
        g1 = new THREE.BoxGeometry( 5, 0.1, 0.1 );
        m1 = new THREE.MeshBasicMaterial( { color: 0x0000ff } );
        var xaxis = new THREE.Mesh( g1, m1 );
        g1 = new THREE.BoxGeometry( 0.1, 0.1, 5 );
        m1 = new THREE.MeshBasicMaterial( { color: 0xff0000 } );
        var zaxis = new THREE.Mesh( g1,m1 );
        xaxis.position.y+=5;
        xaxis.position.x+=2.5;     
        zaxis.position.y+=5;
        zaxis.position.z+=2.5;
        scene.add(xaxis);
        scene.add(zaxis);
        yaxis.position.y=3;
        scene.add( yaxis );
        var light = new THREE.PointLight( 0xffffff, 1, 100 );
        var ambLight = new THREE.AmbientLight(0x404040);
        scene.add (ambLight);
        light.position.set( 0, 10, 0 );
        scene.add( light );
        camCont = new cameraControl(camera);
        p1 = new player(0,0.5,5);
        main.generatePlats();
        animate();
        main.cycle();
    }
    static draw(){
        renderer.render(scene,camera);
        requestAnimationFrame(main.draw);
    }
    static cycle(time){
        frame++;
        if(frame%fps==0){
            main.deltatime = time-main.time;
            main.time = time;   
            updateLoop.forEach(obj=>{
                obj.update(main.deltatime);
            });
            kbrd.resetToggle();
        }
        requestAnimationFrame(main.cycle);
        if(document.pointerLockElement === renderer.domElement ||
            document.mozPointerLockElement === renderer.domElement) {
              mouseLocked = true;
          } else {
              mouseLocked = false;
          }
    }
    static generatePlats(){
        //new boxPlatform(-20,-1,-20,1,20,40,{color:0x8b0000});
        new boxPlatform(-20,-1,-20,6,5,40,{color:0x000040});
        new boxPlatform(14,-1,-20,6,5,40,{color:0x000040});
        //new boxPlatform(19,-1,-20,1,20,40,{color:0x8b0000});
        //new boxPlatform(-20,-1,-20,40,20,1,{color:0x8b0000});
        new boxPlatform(-20,-1,19,40,20,1,{color:0x8b0000});
        new boxPlatform(-20,-1,15,20,20,1,{color:0x8b0000});
        new boxPlatform(-20,-1,-20,100,1,100,{color:0x505050});
        //new circlePlatform(3,0,0,1,5,{color:0x808000});
        //new circlePlatform(3,0,2.5,1,5,{color:0x808000});
        new arbitraryPlatform([new v2(-13,0),new v2(4,4),new v2(0,4)],0,1,{color:0x808000});
    }
}
class cameraControl{
    constructor(camera){
        this.camera = camera;
    }
    setPos(pos){
        this.camera.position.x=pos.v[0];
        this.camera.position.y=pos.v[1];
        this.camera.position.z=pos.v[2];

    }
    setDir(dir){
        camera.setRotationFromAxisAngle(new THREE.Vector3(0,1,0),dir.v[0]);
        camera.rotateX(dir.v[1]);
    }
}
class player{
    constructor(x,y,z){
        this.mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.5,0.5,1,32),new THREE.MeshLambertMaterial({color: 0x00ff00}));
        scene.add(this.mesh);
        this.pos = new v3(x,y,z);
        this.dir = new v2(camera.getWorldDirection().x,camera.getWorldDirection().y);
        this.mov = new v3(0,0,0);
        camera.rotation.z=0;
        this.acceleration= 0.05;
        this.airAcceleration=0.005;
        this.wallJumpPow = 0.2;
        this.wallJumpUp = 0.15;
        this.jump = 0.25;
        this.polygon = new circle(new v2(this.pos.v[0],this.pos.v[2]),this.pos.v[1],1,0.5);
        updateLoop.push(this);
    }
    getFriction(){
        if(this.grounded){
            return 0.2;
        } else {
            return 0.001;
        }
    }
    update(deltaTime){
        if(this.polygon.verts[0].v[1]!=0&&!this.polygon.verts[0].v[1]){
            console.log("asdf");
        }
        this.mesh.translateX(-this.pos.v[0]);
        this.mesh.translateY(-this.pos.v[1]);
        this.mesh.translateZ(-this.pos.v[2]);
        this.calcMov();
        this.calcIntersect();
        this.calcBody();
        this.calcCamera();
    }
    setMov(x,y,z){
        this.mov=new v3(x,y,z);
    }
    calcCamera(){
        if(mouseLocked){
            this.dir.v[0]-=kbrd.mouseMov[0]/400;
            this.dir.v[1]-=kbrd.mouseMov[1]/400;
            //this.dir.v[0]+=(((kbrd.getKey(37))?-0.05:0)+((kbrd.getKey(39))?0.05:0))
            //this.dir.v[1]+=(((kbrd.getKey(38))?-0.05:0)+((kbrd.getKey(40))?0.05:0))
            this.dir.v[1]=Math.min(Math.max(this.dir.v[1],-PI2),PI2);
        }
        camCont.setPos(new v3(this.pos.v[0]+Math.sin(this.dir.v[0])*5*Math.cos(this.dir.v[1]),this.pos.v[1]+Math.sin(this.dir.v[1])*-5,this.pos.v[2]+Math.cos(this.dir.v[0])*5*Math.cos(this.dir.v[1])));
        camCont.setDir(this.dir);
    }
    calcMov(){
        this.jumping = false;
        let fric = 1-this.getFriction();
        this.scaleMov(fric,1,fric);
        if(this.grounded){
            this.rotateAddMov(((kbrd.getKey(65))?-this.acceleration:0)+((kbrd.getKey(68))?this.acceleration:0),this.mov.v[1],((kbrd.getKey(87))?-this.acceleration:0)+((kbrd.getKey(83))?this.acceleration:0));
        } else {
            this.rotateAddMov(((kbrd.getKey(65))?-this.airAcceleration:0)+((kbrd.getKey(68))?this.airAcceleration:0),this.mov.v[1],((kbrd.getKey(87))?-this.airAcceleration:0)+((kbrd.getKey(83))?this.airAcceleration:0));
        }
        if(this.grounded&&kbrd.getToggle(32)){
            this.mov.v[1]+=this.jump;
            this.jumping = true;
        }
        this.mov.v[1]-=0.01;
        this.addMov();
        this.polygon.translateAbsolute(new v3(this.pos.v[0]-0.5,this.pos.v[1],this.pos.v[2]-0.5));
    }
    scaleMov(dx,dy,dz){
        this.mov.v[0]*=dx;
        this.mov.v[1]*=dy;
        this.mov.v[2]*=dz;
    }
    addMov(){
        this.pos.add(this.mov);
    }
    calcIntersect(){
        this.grounded = false;
        let wallJumpVects = [];
        collisionPolys.forEach(pol=>{
            let inter = this.polygon.intersects(pol);
            if(inter[0]){
                if(inter[3]==1&&this.mov.v[1]<=0){
                    this.pos.v[1]+=inter[2];
                    this.mov.v[1]=0;
                    this.grounded=true;
                }
                if(inter[3]==2&&this.mov.v[1]>=0){
                    this.pos.v[1]-=inter[2];
                    this.mov.v[1]=0;
                }
                if(inter[3]==0){
                    if(inter[2]!=0){
                        let eject = vector.getVectAtMagnitude(inter[1],inter[2]);
                        this.pos.v[0]+=eject.v[0];
                        this.pos.v[2]+=eject.v[1];
                        let bufEject = eject.getRotatePI2();
                        let newMov = vector.getVectAtMagnitude(bufEject,vector.putPtOn(bufEject,new v2(this.mov.v[0],this.mov.v[2])));
                        this.mov = new v3(newMov.v[0],this.mov.v[1],newMov.v[1]);
                    }
                    wallJumpVects.push(vector.getVectAtMagnitude(inter[1],this.wallJumpPow));
                }
            }
            this.polygon.translateAbsolute(new v3(this.pos.v[0]-0.5,this.pos.v[1],this.pos.v[2]-0.5));
        });
        if(wallJumpVects.length&&!this.grounded&&!this.jumping){
            let vect = vector.getAvgVect(wallJumpVects);
            if(kbrd.getToggle(32)){
                this.mov.v[0]+=vect.v[0];
                this.mov.v[2]+=vect.v[1];
                this.mov.v[1]=Math.max(this.wallJumpUp,Math.min(this.mov.v[1]+this.wallJumpUp,this.jump),this.mov.v[1]);
            }
        }
        /*if(wallJumpVects.length&&!this.grounded&&!this.jumping){
            if(kbrd.getToggle(32)){
                let vect = polygon.getAvgVect(wallJumpVects);
                let mag = polygon.getMag(this.delayVect)/polygon.getMag([this.mov[0],this.mov[2]]);
                mag = Math.min((mag<1)?1/mag:mag,2);
                this.mov[0]+=vect[0]*mag;
                this.mov[1]=Math.max(this.wallJumpUp,Math.min(this.mov[1]+this.wallJumpUp,this.jump),this.mov[1]);
                this.mov[2]+=vect[1]*mag;
                if(polygon.getMag([this.mov[0],this.mov[2]])>2){
                    console.log("prob");
                }
            } else {
                this.delayVect = polygon.getWeightAvg(this.delayVect,[this.mov[0],this.mov[2]],0.95);
            }
        } else {
            this.delayVect = [this.mov[0],this.mov[2]];
        }*/
    }
    calcBody(){
        this.mesh.position.x=this.pos.v[0];
        this.mesh.position.y=this.pos.v[1]+0.5;
        this.mesh.position.z=this.pos.v[2];
    }
    rotateAddMov(x,y,z){
        this.mov.v[0]+=Math.cos(this.dir.v[0])*x+Math.sin(this.dir.v[0])*z;
        this.mov.v[1]=y;
        this.mov.v[2]+=-Math.sin(this.dir.v[0])*x+Math.cos(this.dir.v[0])*z;
    }
}
class platform{
    constructor(){
        this.mov=new v3(0,0,0);
    }
    remove(){
        if(!this.removed){
            scene.remove(mesh);
            collisionPolys.splice(collisionPolys.indexOf(this.polygon),1);
        }
        this.removed = true;
    }
    translateRelative(x,y,z){
        this.mesh.translateX(x);
        this.mesh.translateY(y);
        this.mesh.translateZ(z);

    }
}
class arbitraryPlatform extends platform{
    constructor(verts,y,height,color){
        super();
        let polys = verts.length-2;
        let vertices = [];
        let vertVectors = [];
        for(let i = 0; i < polys; i ++){
            vertices.push(verts[0].v[0]);
            vertices.push(y);
            vertices.push(verts[0].v[1]);
            vertices.push(verts[i+1].v[0]);
            vertices.push(y);
            vertices.push(verts[i+1].v[1]);
            vertices.push(verts[i+2].v[0]);
            vertices.push(y);
            vertices.push(verts[i+2].v[1]);
            vertices.push(verts[i+2].v[0]);
            vertices.push(y+height);
            vertices.push(verts[i+2].v[1]);
            vertices.push(verts[i+1].v[0]);
            vertices.push(y+height);
            vertices.push(verts[i+1].v[1]);
            vertices.push(verts[0].v[0]);
            vertices.push(y+height);
            vertices.push(verts[0].v[1]);
        }
        for(let i = 0; i < verts.length; i++){
            if(i<verts.length-1){
                vertices.push(verts[i].v[0]);
                vertices.push(y+height);
                vertices.push(verts[i].v[1]);
                vertices.push(verts[i+1].v[0]);
                vertices.push(y);
                vertices.push(verts[i+1].v[1]);
                vertices.push(verts[i].v[0]);
                vertices.push(y);
                vertices.push(verts[i].v[1]);
                vertices.push(verts[i+1].v[0]);
                vertices.push(y+height);
                vertices.push(verts[i+1].v[1]);
                vertices.push(verts[i+1].v[0]);
                vertices.push(y);
                vertices.push(verts[i+1].v[1]);
                vertices.push(verts[i].v[0]);
                vertices.push(y+height);
                vertices.push(verts[i].v[1]);
            } else {
                vertices.push(verts[0].v[0]);
                vertices.push(y+height);
                vertices.push(verts[0].v[1]);
                vertices.push(verts[0].v[0]);
                vertices.push(y);
                vertices.push(verts[0].v[1]);
                vertices.push(verts[i].v[0]);
                vertices.push(y);   
                vertices.push(verts[i].v[1]);
                vertices.push(verts[i].v[0]);
                vertices.push(y+height);
                vertices.push(verts[i].v[1]);
                vertices.push(verts[0].v[0]);
                vertices.push(y+height);
                vertices.push(verts[0].v[1]);
                vertices.push(verts[i].v[0]);
                vertices.push(y);   
                vertices.push(verts[i].v[1]);
            }
        }
        let geometry = new THREE.BufferGeometry();
        vertices = new Float32Array( vertices );
        // itemSize = 3 because there are 3 values (components) per vertex
        geometry.addAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
        let material = new THREE.MeshLambertMaterial(color);
        this.mesh = new THREE.Mesh( geometry, material );
        scene.add(this.mesh);
        this.polygon = new polygon(verts,y,height)
        collisionPolys.push(this.polygon);
    }
}
class circlePlatform extends platform{
    constructor(x,y,z,radius,height,color){
        super();
        this.mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,height,Math.max(Math.floor(32*radius),3)),new THREE.MeshLambertMaterial(color));
        this.mesh.position.x=x;
        this.mesh.position.y=y+height/2;
        this.mesh.position.z=z;
        this.polygon = new circle(new v2(x,z),y,height,radius);
        scene.add(this.mesh);
        collisionPolys.push(this.polygon);
    }
}
class boxPlatform extends platform{
    constructor(x,y,z,width,height,depth,color){
        super();
        this.mesh = new THREE.Mesh(new THREE.BoxGeometry(width,height,depth),new THREE.MeshLambertMaterial(color));
        this.mesh.position.x=x+width/2;
        this.mesh.position.y=y+height/2;
        this.mesh.position.z=z+depth/2;
        this.height = height;
        this.polygon = new polygon([new v2(x,z),new v2(x+width,z),new v2(x+width,z+depth), new v2(x,z+depth)],y,height);
        scene.add(this.mesh);
        collisionPolys.push(this.polygon);
    }
}
class movingPlatform extends arbitraryPlatform{
    constructor(verts,y,height,color,start,end,speed){
        super(verts,y,height,color);
        this.mov=vector.getVectAtMagnitude(new v3(end[0]-start[0],end[1]-start[1],end[2]-start[2]),speed);
    }
}
class polygon{
    constructor(vertices,y,height){
        this.verts = vertices;
        this.height = height;
        this.y = y;
    }
    intersects(poly){
        let inter = true;
        if(poly.y>this.height+this.y||poly.y+poly.height<this.y){
            return [false];
        } else {
            let axes = this.getAxes();
            let oAxes = poly.getAxes();
            oAxes.forEach(ax=>{
                axes.push(ax);
            });
            polygon.removeDuplicates(axes);
            let minOverlap = poly.y+poly.height-this.y;
            let ejectAxis;
            let updown = 1;//0 is sideways,1 is up,2is down
            if(minOverlap>this.y+this.height-poly.y){
                updown = 2;
                minOverlap = this.y+this.height-poly.y;
            }
            let i = 0;
            while(inter&&axes.length>i){
                let tmin = this.getMinPt(axes[i],this.verts);
                let omin = poly.getMinPt(axes[i],poly.verts);
                let tmax = this.getMaxPt(axes[i],this.verts);
                let omax = poly.getMaxPt(axes[i],poly.verts);
                inter = ((tmin<=omin&&tmax>=omin)||(tmin<=omax&&tmax>=omax)||(omin<=tmin&&omax>=tmin)||(omin<=tmax&&omax>=tmax));
                let bufOver = polygon.getOverlap(tmin,tmax,omin,omax)
                if (bufOver[0]<minOverlap){
                    if(bufOver[1]){
                        axes[i] = axes[i].getScaled(-1);
                    }
                    ejectAxis = axes[i];
                    minOverlap = bufOver[0];
                    updown = 0;
                }
                i++;
            }
            return [inter,ejectAxis,minOverlap,updown];
        }
    }
    static getOverlap(start1,stop1,start2,stop2){
        let flip = start1+stop1<start2+stop2;
        if(start1<start2){
            if(stop1>stop2){
                return [stop2-start2,flip];
            } else {
                return [stop1-start2,flip];
            }
        } else {
            if(stop2>stop1){
                return [stop1-start1,flip];
            } else {
                return [stop2-start1,flip];
            }
        }
    }
    getMinPt(axis){
        let curMin = vector.putPtOn(axis,this.verts[0]);
        for(let i = 1; i <this.verts.length; i++){
            curMin = Math.min(vector.putPtOn(axis,this.verts[i]),curMin);
        }
        return curMin;
    }
    getMaxPt(axis){
        let curMax = vector.putPtOn(axis,this.verts[0]);
        for(let i = 1; i <this.verts.length; i++){
            curMax = Math.max(vector.putPtOn(axis,this.verts[i]),curMax);
        }
        return curMax;
    }
    getAxes(){
        let axes = [];
        let i=0;
        if(this.verts.length>=2){
            this.verts.forEach(vert=>{
                if(i<this.verts.length-1){
                    axes.push(new v2(this.verts[i].v[1]-this.verts[i+1].v[1],this.verts[i+1].v[0]-this.verts[i].v[0]));
                } else {
                    axes.push(new v2(this.verts[i].v[1]-this.verts[0].v[1],this.verts[0].v[0]-this.verts[i].v[0]));
                }
                i++;
            });
        }
        return axes;
    }
    static removeDuplicates(axes){
        for(let i=0; i<axes.length;i++){
            if(axes[i].v[1]==0){
                if(axes[i].v[0]==0){
                    axes.splice(i,1);
                    i--;
                } else {
                    for(let i1=1; i1+i<axes.length;i1++){
                        if(axes[i1+i].v[1]==0){
                            axes.splice(i1+i,1);
                            i1--;
                        }
                    }
                }
            } else {
                for(let i1=1; i1+i<axes.length;i1++){
                    if(axes[i].v[0]/axes[i].v[1]==axes[i+i1].v[0]/axes[i+i1].v[1]){
                        axes.splice(i+i1,1);
                        i1--;
                    }
                }
            }
        }
    }
    translateRelative(vect){
        this.y+=vect.v[1];
        let d2=new v2(vect.v[0],vect.v[2]);
        this.verts.forEach(vert=>{
            vert.add(d2);
        });
    }
    translateAbsolute(vect){//verts[0] is origin
        this.y=vect.v[1];
        let d2=new v2(vect.v[0],vect.v[2]);
        let orig=this.verts[0].clone();
        this.verts.forEach(vert=>{
            vert.add(d2);
            vert.subtract(orig);
        })
    }
}
class circle extends polygon{
    constructor(center,y,height,radius){
        super([center],y,height);
        this.isCircle = true;
        this.radius = radius;
    }
    translateAbsolute(vect){
        this.y = vect.v[1];
        this.verts[0]=new v2(vect.v[0]+this.radius,vect.v[2]+this.radius);
    }
    getAxes(){
        return [];
    }
    intersects(poly){
        if(poly.y>this.height+this.y||poly.y+poly.height<this.y){
            return [false];
        } else {
            if(poly.isCircle){
                if(vector.lessThanEqualDistance(this.verts[0],poly.verts[0],this.radius+poly.radius)){
                    let penetrate = this.radius+poly.radius-vector.getDistance(this.verts[0],poly.verts[0]);
                    let updown = 0;//0 sidewats,1 up, 2 down
                    let axis = new v2(this.verts[0].v[0]-poly.verts[0].v[0],this.verts[0].v[1]-poly.verts[0].v[1]);
                    if(penetrate>this.y+this.height-poly.y){
                        updown = 2;
                        penetrate = this.y+this.height-poly.y;
                    }
                    if(penetrate>poly.y+poly.height-this.y){
                        updown = 1;
                        penetrate = poly.y+poly.height-this.y;
                    }
                    return [true,axis,penetrate,updown];
                } else {
                    return [false]  
                }
            } else {
                return super.intersects(poly);
            }
        }
    }
    getMinPt(axis){
        return vector.putPtOn(axis,this.verts[0])-this.radius;
    }
    getMaxPt(axis){
        return vector.putPtOn(axis,this.verts[0])+this.radius;
    }
}
class vector{
    static lessThanEqualDistance(p1,p2,dist){
        let dim = Math.min(p1.v.length,p2.v.length);
        let dit=0;
        for(let i = 0; i < dim; i ++){
            dit+=(p1[i]-p2[i])*([p1[i]-p2[i]]);
        }
        return dit<=dist*dist;
    }
    static getVector(dimensions){
        switch(dimensions.length){
            case 0: return new v0();
            case 1: return new v1(dimensions[0]);
            case 2: return new v2(dimensions[0],dimensions[1]);
            case 3: return new v3(dimensions[0],dimensions[1],dimensions[2]);
        }
    }
    static getDistance(p1,p2){
        let dim = Math.min(p1.v.length,p2.v.length);
        let dit=0;
        for(let i = 0; i < dim; i ++){
            dit+=(p1[i]-p2[i])*([p1[i]-p2[i]]);
        }
        return Math.sqrt(dit);
    }
    static dot(v1,v2){
        let dim = Math.min(v1.v.length,v2.v.length);
        let r = 0;
        for(let i = 0; i < dim; i++){
            r += v1.v[i]*v2.v[i];
        }
        return r;
    }
    static putPtOn(axis,pt){
        return vector.dot(axis,pt)/axis.getMag();
    }
    static getVectAtMagnitude(vect,mag){
        let dMag = mag/vect.getMag();
        switch (vect.v.length){
            case 0:
                throw "v0 has no mag";
            case 1:
                return new v1(vect.v[0]*dMag);
            case 2:
                return new v2(vect.v[0]*dMag,vect.v[1]*dMag);
            case 3:
                return new v3(vect.v[0]*dMag,vect.v[1]*dMag,vect[2]*dMag);
        }
    }
    static getWeightAvg(main,second,weight){//weight 1 means 100% main
        if(main.v.length!=second.v.length){
            throw "vectorNotSameDimension";
        }
        switch(main.v.length){
            case 0: return new v0();
            case 1: return new v1(main.v[0]*weight+second[0]*(1-weight));
            case 2: return new v2(main.v[0]*weight+second.v[0]*(1-weight),main.v[1]*weight+second.v[1]*(1-weight));
            case 3: return new v3(main.v[0]*weight+second.v[0]*(1-weight),main.v[1]*weight+second.v[1]*(1-weight),main.v[2]*weight+second.v[2]*(1-weight))
        }
        throw "notValidVector";
    }
    static getAvgVect(vects){
        let dim = vects[0].v.length;
        let r=Array(dim);
        for(let i = 0; i < dim;i++){
            r[i]=0;
            vects.forEach(v=>{
                r[i]+=v.v[i];
            });
            r[i]/=vects.length;
        }
        return vector.getVector(r);
    }
    static clone(v){
        switch(v.v.length){
            case 0: return new v0();
            case 1: return new v1(v.v[0]);
            case 2: return new v2(v.v[0],v.v[1]);
            case 3: return new v3(v.v[0],v.v[1],v.v[2]);
        }
    }
}
class v0 extends vector{
    constructor(){
        super();
        this.v = []
    }
    getMag(){
        return 0;
    }
    getScaled(scale){
        return new v0();
    }
    getNormalized(){
        return new v0();
    }
    getTHREEEquivelent(){
        throw "shouldn not be called on v0"
    }
    getArray(){
        return this.v;
    }
    add(vect){

    }
    getAdd(vect){
        return new v0;
    }
    subtract(vect){

    }
    getSubtract(vect){
        return new v0();
    }
}
class v1 extends vector{
    constructor(x){
        super();
        this.v = [x];
    }
    getMag(){
        return this.v[0];
    }
    getRotatePI2(){
        return new v1(0);
    }
    getScaled(scale){
        return new v1(this.v[0]*scale);
    }
    getNormalized(){
        return new v1((this.v[0]>0)?1:-1);
    }
    getTHREEEquivelent(){
        throw "shouldn not be called on v1"
    }
    getArray(){
        return this.v;
    }
    add(vect){
        this.v[0]+=vect.v[0];
    }
    getAdd(vect){
        return new v1(this.v[0]+vect[0]);
    }
    subtract(vect){
        this.v[0]-=vect.v[0];
    }
    getSubtract(vect){
        return new v2(this.v[0]-vect[0]);
    }
}
class v2 extends vector{
    constructor(x,z){
        super();
        this.v = [x,z];
    }
    getMag(){
        return Math.sqrt(this.v[0]*this.v[0]+this.v[1]*this.v[1]);
    }
    getRotatePI2(){
        return new v2(-this.v[1],this.v[0]);
    }
    getScaled(scale){
        return new v2(this.v[0]*scale,this.v[1]*scale);
    }
    getNormalized(){
        return this.getScaled(1/this.getMag());
    }
    getTHREEEquivelent(){
        return new THREE.Vector2(this.v[0],this.v[1]);
    }
    getArray(){
        return this.v;
    }
    add(vect){
        this.v[0]+=vect.v[0];
        this.v[1]+=vect.v[1];
    }
    getAdd(vect){
        return new v2(this.v[0]+vect[0],this.v[1]+vect[1]);
    }
    subtract(vect){
        this.v[0]-=vect.v[0];
        this.v[1]-=vect.v[1];
    }
    getSubtract(vect){
        return new v2(this.v[0]-vect[0],this.v[1]-vect[1]);
    }
}
class v3 extends vector{
    constructor(x,y,z){
        super();
        this.v = [x,y,z];
    }
    getMag(){
        return Math.sqrt(this.v[0]*this.v[0]+this.v[1]*this.v[1]+this.v[2]*this.v[2]);
    }
    getRotatePI2(){
        throw "can only be called on 2d or 1d vectors"
    }
    getScaled(scale){
        return new v3(this.v[0]*scale,this.v[1]*scale,this.v[2]*scale);
    }
    getNormalized(){
        return this.getScaled(1/this.getMag());
    }
    getTHREEEquivelent(){
        return new THREE.Vector3(this.v[0],this.v[1],this.v[2]);
    }
    getArray(){
        return this.v;
    }
    add(vect){
        this.v[0]+=vect.v[0];
        this.v[1]+=vect.v[1];
        this.v[2]+=vect.v[2];
    }
    getAdd(vect){
        return new v3(this.v[0]+vect[0],this.v[1]+vect[1],this.v[2]+vect[2]);
    }
    subtract(vect){
        this.v[0]-=vect.v[0];
        this.v[1]-=vect.v[1];
        this.v[2]-=vect.v[2];
    }
    getSubtract(vect){
        return new v3(this.v[0]-vect[0],this.v[1]-vect[1],this.v[2]-vect[2]);;
    }
}
var fps=1;
var camera;
var asdf = PI/4;
var camCont;
var renderer;
var p1;
var collisionPolys=[];
var mouseLocked = false;
var PI2 = Math.PI/2;
var PI = Math.PI;
var scene;
var frame = 0;
var texture = new THREE.TextureLoader().load("texture.png");
var updateLoop =[];
main.init();