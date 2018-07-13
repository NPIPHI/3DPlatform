window.onclick=function(){
    renderer.domElement.requestPointerLock = renderer.domElement.requestPointerLock ||
                                            renderer.domElement.mozRequestPointerLock;
    renderer.domElement.requestPointerLock()
    mouseLocked = true;
};
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
            p1.update(main.deltatime);
            kbrd.resetToggle();
        }
        requestAnimationFrame(main.cycle);
    }
    static generatePlats(){
        camCont.setDir([0,0,0]);
        //new boxPlatform(-20,-1,-20,1,20,40,{color:0x8b0000});
        new boxPlatform(-20,-1,-20,6,5,40,{color:0x000040});
        new boxPlatform(14,-1,-20,6,5,40,{color:0x000040});
        //new boxPlatform(19,-1,-20,1,20,40,{color:0x8b0000});
        //new boxPlatform(-20,-1,-20,40,20,1,{color:0x8b0000});
        new boxPlatform(-20,-1,19,40,20,1,{color:0x8b0000});
        new boxPlatform(-20,-1,15,20,20,1,{color:0x8b0000});
        new boxPlatform(-20,-1,-20,40,1,40,{color:0x505050});
        //new circlePlatform(3,0,0,1,5,{color:0x808000});
        //new circlePlatform(3,0,2.5,1,5,{color:0x808000});
        new arbitraryPlatform([[0,0],[4,4],[0,4]],0,1,{color:0x808000});
    }
}
class cameraControl{
    constructor(camera){
        this.camera = camera;
    }
    setPos(pos){
        this.camera.position.x = pos[0];
        this.camera.position.y = pos[1];
        this.camera.position.z = pos[2];
    }
    setDir(dir){
        camera.setRotationFromAxisAngle(new THREE.Vector3(0,1,0),dir[1]);
        camera.rotateX(dir[0]);
    }
}
class gameObject{
    constructor(){

    }
    update(deltaTime){

    }
}
class player extends gameObject{
    constructor(x,y,z){
        super();
        this.mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.5,0.5,1,32),new THREE.MeshLambertMaterial({color: 0x00ff00}));
        scene.add(this.mesh);
        this.pos = [x,y,z];
        this.dir = [camera.getWorldDirection().x,camera.getWorldDirection().y];
        this.mov = [0,0,0];
        camera.rotation.z=0;
        this.acceleration= 0.05;
        this.airAcceleration=0.005;
        this.wallJumpPow = 0.2;
        this.wallJumpUp = 0.15;
        this.jump = 0.25;
        this.delayVect = [0,0];
        this.polygon = new circle(new THREE.Vector3(this.pos[0],this.pos[1],this.pos[2]),0.5,1);
        //this.polygon = new polygon([new THREE.Vector3(this.pos[0]-0.5,this.pos[1],this.pos[2]-0.5),new THREE.Vector3(this.pos[0]+0.5,this.pos[1],this.pos[2]-0.5),new THREE.Vector3(this.pos[0]+0.5,this.pos[1],this.pos[2]+0.5),new THREE.Vector3(this.pos[0]-0.5,this.pos[1],this.pos[2]+0.5)],1);
    }
    getFriction(){
        if(this.grounded){
            return 0.2;
        } else {
            return 0.001;
        }
    }
    update(deltaTime){
        this.mesh.translateX(-this.pos[0]);
        this.mesh.translateY(-this.pos[1]);
        this.mesh.translateZ(-this.pos[2]);
        this.calcMov();
        this.calcIntersect();
        this.calcBody();
        this.calcCamera();
    }
    setMov(x,y,z){
        this.mov[0]=x;
        this.mov[1]=y
        this.mov[2]=z;
    }
    calcCamera(){
        if(mouseLocked){
            this.dir[0]-=kbrd.mouseMov[0]/400;
            this.dir[1]-=kbrd.mouseMov[1]/400;
            //this.dir[0]+=(((kbrd.getKey(37))?-0.05:0)+((kbrd.getKey(39))?0.05:0))
            //this.dir[1]+=(((kbrd.getKey(38))?-0.05:0)+((kbrd.getKey(40))?0.05:0))
            this.dir[1]=Math.min(Math.max(this.dir[1],-PI2),PI2);
        }
        camCont.setPos([this.pos[0]+Math.sin(this.dir[0])*5*Math.cos(this.dir[1]),this.pos[1]+Math.sin(this.dir[1])*-5,this.pos[2]+Math.cos(this.dir[0])*5*Math.cos(this.dir[1])]);
        camCont.setDir([this.dir[1],this.dir[0]]);
    }
    calcMov(){
        this.jumping = false;
        let fric = 1-this.getFriction();
        this.scaleMov(fric,1,fric);
        if(this.grounded){
            this.rotateAddMov(((kbrd.getKey(65))?-this.acceleration:0)+((kbrd.getKey(68))?this.acceleration:0),this.mov[1],((kbrd.getKey(87))?-this.acceleration:0)+((kbrd.getKey(83))?this.acceleration:0));
        } else {
            this.rotateAddMov(((kbrd.getKey(65))?-this.airAcceleration:0)+((kbrd.getKey(68))?this.airAcceleration:0),this.mov[1],((kbrd.getKey(87))?-this.airAcceleration:0)+((kbrd.getKey(83))?this.airAcceleration:0));
        }
        if(this.grounded&&kbrd.getToggle(32)){
            this.mov[1]+=this.jump;
            this.jumping = true;
        }
        this.mov[1]-=0.01;
        this.addMov();
        this.polygon.translateAbsolute(this.pos[0]-0.5,this.pos[1],this.pos[2]-0.5);
    }
    scaleMov(dx,dy,dz){
        this.mov[0]*=dx;
        this.mov[1]*=dy;
        this.mov[2]*=dz;
    }
    addMov(){
        this.pos[0]+=this.mov[0];
        this.pos[1]+=this.mov[1];
        this.pos[2]+=this.mov[2];
    }
    calcIntersect(){
        this.grounded = false;
        let wallJumpVects = [];
        collisionPolys.forEach(pol=>{
            let inter = this.polygon.intersects(pol);
            if(inter[0]){
                if(inter[3]==1&&this.mov[1]<=0){
                    this.pos[1]+=inter[2];
                    this.mov[1]=0;
                    this.grounded=true;
                }
                if(inter[3]==2&&this.mov[1]>=0){
                    this.pos[1]-=inter[2];
                    this.mov[1]=0;
                }
                if(inter[3]==0){
                    if(inter[2]!=0){
                        let eject = polygon.getVectAtMagnitude(inter[1],inter[2]);
                        this.pos[0]+=eject[0];
                        this.pos[2]+=eject[1];
                        let bufEject = polygon.getRotatePI2(eject);
                        let newMov = polygon.getVectAtMagnitude(bufEject,polygon.putPtOn(bufEject,[this.mov[0],this.mov[2]]));
                        this.mov = [newMov[0],this.mov[1],newMov[1]];
                    }
                    wallJumpVects.push(polygon.getVectAtMagnitude(inter[1],this.wallJumpPow));
                }
            }
            this.polygon.translateAbsolute(this.pos[0]-0.5,this.pos[1],this.pos[2]-0.5);
        });
        if(wallJumpVects.length&&!this.grounded&&!this.jumping){
            let vect = polygon.getAvgVect(wallJumpVects);
            if(kbrd.getToggle(32)){
                this.mov[0]+=vect[0];
                this.mov[2]+=vect[1];
                this.mov[1]=Math.max(this.wallJumpUp,Math.min(this.mov[1]+this.wallJumpUp,this.jump),this.mov[1]);
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
        this.mesh.position.x=this.pos[0];
        this.mesh.position.y=this.pos[1]+0.5;
        this.mesh.position.z=this.pos[2];
    }
    rotateAddMov(x,y,z){
        this.mov[0]+=Math.cos(this.dir[0])*x+Math.sin(this.dir[0])*z;
        this.mov[1]=y;
        this.mov[2]+=-Math.sin(this.dir[0])*x+Math.cos(this.dir[0])*z;
    }
}
class platform{
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
            vertices.push(verts[0][0]);
            vertices.push(y);
            vertices.push(verts[0][1]);
            vertices.push(verts[i+1][0]);
            vertices.push(y);
            vertices.push(verts[i+1][1]);
            vertices.push(verts[i+2][0]);
            vertices.push(y);
            vertices.push(verts[i+2][1]);
            vertices.push(verts[i+2][0]);
            vertices.push(y+height);
            vertices.push(verts[i+2][1]);
            vertices.push(verts[i+1][0]);
            vertices.push(y+height);
            vertices.push(verts[i+1][1]);
            vertices.push(verts[0][0]);
            vertices.push(y+height);
            vertices.push(verts[0][1]);
        }
        for(let i = 0; i < verts.length; i++){
            if(i<verts.length-1){
                vertices.push(verts[i][0]);
                vertices.push(y+height);
                vertices.push(verts[i][1]);
                vertices.push(verts[i+1][0]);
                vertices.push(y);
                vertices.push(verts[i+1][1]);
                vertices.push(verts[i][0]);
                vertices.push(y);
                vertices.push(verts[i][1]);
                vertices.push(verts[i+1][0]);
                vertices.push(y+height);
                vertices.push(verts[i+1][1]);
                vertices.push(verts[i+1][0]);
                vertices.push(y);
                vertices.push(verts[i+1][1]);
                vertices.push(verts[i][0]);
                vertices.push(y+height);
                vertices.push(verts[i][1]);
            } else {
                vertices.push(verts[0][0]);
                vertices.push(y+height);
                vertices.push(verts[0][1]);
                vertices.push(verts[0][0]);
                vertices.push(y);
                vertices.push(verts[0][1]);
                vertices.push(verts[i][0]);
                vertices.push(y);   
                vertices.push(verts[i][1]);
                vertices.push(verts[i][0]);
                vertices.push(y+height);
                vertices.push(verts[i][1]);
                vertices.push(verts[0][0]);
                vertices.push(y+height);
                vertices.push(verts[0][1]);
                vertices.push(verts[i][0]);
                vertices.push(y);   
                vertices.push(verts[i][1]);
            }
        }
        for(let i = 0; i < verts.length; i ++){
            vertVectors.push(new THREE.Vector3(verts[i][0],y,verts[i][1]));
        }
        let geometry = new THREE.BufferGeometry();
        vertices = new Float32Array( vertices );
        // itemSize = 3 because there are 3 values (components) per vertex
        geometry.addAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
        let material = new THREE.MeshLambertMaterial(color);
        this.mesh = new THREE.Mesh( geometry, material );
        scene.add(this.mesh);
        this.polygon = new polygon(vertVectors,height)
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
        this.polygon = new circle(new THREE.Vector3(x,y,z),radius,height);
        scene.add(this.mesh);
        collisionPolys.push(this.polygon);
    }
}
class boxPlatform extends platform{
    constructor(x,y,z,width,height,depth,color){
        super();
        this.mesh = new THREE.Mesh(new THREE.BoxGeometry(width,height,depth),new THREE.MeshLambertMaterial(color    ));
        this.mesh.position.x=x+width/2;
        this.mesh.position.y=y+height/2;
        this.mesh.position.z=z+depth/2;
        this.polygon = new polygon([new THREE.Vector3(x,y,z),new THREE.Vector3(x+width,y,z),new THREE.Vector3(x+width,y,z+depth),new THREE.Vector3(x,y,z+depth)],height);
        scene.add(this.mesh);
        collisionPolys.push(this.polygon);
    }
}
class polygon{
    constructor(vertices,height){
        this.verts = [];
        vertices.forEach(vert=>{
            this.verts.push([vert.x,vert.z]);
        });
        this.height = height;
        this.y = vertices[0].y;
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
            let ejectAxis = [0,0];
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
                        axes[i][0]=-axes[i][0];
                        axes[i][1]=-axes[i][1];
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
    static getReflectVect(vect,reflector){
        let normal = polygon.getNormalizedVect(reflector);
        let dotp = polygon.getDotP(vect,normal);
        return [vect[0]-2*normal[0]*dotp,vect[1]-2*normal[1]*dotp];
    }
    static getScaleVect(vect,scale){
        return [vect[0]*scale,vect[1]*scale];
    }
    static getDotP(vect1,vect2){
        return vect1[0]*vect2[0]+vect1[1]*vect2[1];
    }
    static getNormalizedVect(vect){
        return polygon.getVectAtMagnitude(vect,1);
    }
    static getAvgVect(vects){
        let r=[0,0];
        vects.forEach(v=>{
            r[0]+=v[0];
            r[1]+=v[1];
        })
        r[0]/=vects.length;
        r[1]/=vects.length;
        return r;
    }
    static getWeightAvg(main,second,weight){//weight 1 means 100% main
        return [main[0]*weight+second[0]*(1-weight),main[1]*weight+second[1]*(1-weight)];
    }
    static getRotatePI2(vect){
        return [-vect[1],vect[0]];
    }
    static getVectAtMagnitude(vect,mag){
        let dMag = mag/polygon.getMag(vect);
        return [vect[0]*dMag,vect[1]*dMag];
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
        let curMin = polygon.putPtOn(axis,this.verts[0]);
        for(let i = 1; i <this.verts.length; i++){
            curMin = Math.min(polygon.putPtOn(axis,this.verts[i]),curMin);
        }
        return curMin;
    }
    getMaxPt(axis){
        let curMax = polygon.putPtOn(axis,this.verts[0]);
        for(let i = 1; i <this.verts.length; i++){
            curMax = Math.max(polygon.putPtOn(axis,this.verts[i]),curMax);
        }
        return curMax;
    }
    getAxes(){
        let axes = [];
        let i=0;
        if(this.verts.length>=2){
            this.verts.forEach(vert=>{
                if(i<this.verts.length-1){
                    axes.push([this.verts[i][1]-this.verts[i+1][1],this.verts[i+1][0]-this.verts[i][0]])
                } else {
                    axes.push([this.verts[i][1]-this.verts[0][1],this.verts[0][0]-this.verts[i][0]])
                }
                i++;
            });
        }
        return axes;
    }
    static putPtOn(axis,pt){
        let dotP = axis[0]*pt[0]+axis[1]*pt[1];
        return dotP/polygon.getMag(axis);
    }
    static getMag(vec){
        return Math.sqrt(vec[0]*vec[0]+vec[1]*vec[1]);
    }
    static removeDuplicates(axes){
        for(let i=0; i<axes.length;i++){
            if(axes[i][1]==0){
                if(axes[i][0]==0){
                    axes.splice(i,1);
                    i--;
                } else {
                    for(let i1=1; i1+i<axes.length;i1++){
                        if(axes[i1+i][1]==0){
                            axes.splice(i1+i,1);
                            i1--;
                        }
                    }
                }
            } else {
                for(let i1=1; i1+i<axes.length;i1++){
                    if(axes[i][0]/axes[i][1]==axes[i+i1][0]/axes[i+i1][1]){
                        axes.splice(i+i1,1);
                        i1--;
                    }
                }
            }
        }
    }
    static lessThanEqualDistance(p1,p2,dist){
        return ((p1[0]-p2[0])*(p1[0]-p2[0])+(p1[1]-p2[1])*(p1[1]-p2[1])<=dist*dist);
    }
    translateRelative(x,y,z){
        this.y+=y;
        this.verts.forEach(vert=>{
            vert[0]+=x;
            vert[1]+=z;
        });
    }
    translateAbsolute(x,y,z){//verts[0] is origin
        this.y=y;
        let orig=[this.verts[0][0],this.verts[0][1]];
        this.verts.forEach(vert=>{
            vert[0]+=-orig[0]+x;
            vert[1]+=-orig[1]+z;
        })
    }
    static getDistance(p1,p2){
        return Math.sqrt((p1[0]-p2[0])*(p1[0]-p2[0])+(p1[1]-p2[1])*(p1[1]-p2[1]));
    }
}
class circle extends polygon{
    constructor(center,radius,height){
        super([center],height);
        this.isCircle = true;
        this.radius = radius;
    }
    translateAbsolute(x,y,z){
        this.y = y;
        this.verts[0][0]=x+this.radius;
        this.verts[0][1]=z+this.radius;
    }
    getAxes(){
        return [];
    }
    intersects(poly){
        if(poly.y>this.height+this.y||poly.y+poly.height<this.y){
            return [false];
        } else {
            if(poly.isCircle){
                if(polygon.lessThanEqualDistance(this.verts[0],poly.verts[0],this.radius+poly.radius)){
                    let penetrate = this.radius+poly.radius-polygon.getDistance(this.verts[0],poly.verts[0]);
                    let updown = 0;//0 sidewats,1 up, 2 down
                    let axis = [this.verts[0][0]-poly.verts[0][0],this.verts[0][1]-poly.verts[0][1]];
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
        return polygon.putPtOn(axis,this.verts[0])-this.radius;
    }
    getMaxPt(axis){
        return polygon.putPtOn(axis,this.verts[0])+this.radius;
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
main.init();