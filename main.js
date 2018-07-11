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
        light.position.set( 10, 10, 10 );
        scene.add( light );
        camCont = new cameraControl(camera);
        p1 = new player(0,0.5,5);
        animate();
        main.cycle();
        camCont.setDir([0,0,0]);
        let pla  = new platform(0,0,0,1,1,2,{color:0x505050});
        let pla1 = new platform(0.5,0.5,0.5,1,1,1,{color:0x880000});
        let floor = new platform(-20,-1,-20,40,1,40,{color:0x505050});
        console.log(pla.polygon.intersects(pla1.polygon));
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
        this.mesh = new THREE.Mesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshBasicMaterial({color: 0x000000}));
        scene.add(this.mesh);
        this.pos = [x,y,z];
        this.dir = [camera.getWorldDirection().x,camera.getWorldDirection().y];
        this.mov = [0,0,0];
        camera.rotation.z=0;
        this.polygon = new polygon([new THREE.Vector3(this.pos[0]-0.5,this.pos[1],this.pos[2]-0.5),new THREE.Vector3(this.pos[0]+0.5,this.pos[1],this.pos[2]-0.5),new THREE.Vector3(this.pos[0]+0.5,this.pos[1],this.pos[2]+0.5),new THREE.Vector3(this.pos[0]-0.5,this.pos[1],this.pos[2]+0.5)],1);
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
        camCont.setPos([this.pos[0],this.pos[1]+3,this.pos[2]]);
        camCont.setPos([this.pos[0]+Math.sin(this.dir[0])*5*Math.cos(this.dir[1]),this.pos[1]+Math.sin(this.dir[1])*-5,this.pos[2]+Math.cos(this.dir[0])*5*Math.cos(this.dir[1])]);
        if(mouseLocked){
            //this.dir[0]-=kbrd.mouseMov[0]/400;
            //this.dir[1]-=kbrd.mouseMov[1]/400;
            this.dir[0]+=(((kbrd.getKey(37))?-0.05:0)+((kbrd.getKey(39))?0.05:0))
            this.dir[1]+=(((kbrd.getKey(38))?-0.05:0)+((kbrd.getKey(40))?0.05:0))
            this.dir[1]=Math.min(Math.max(this.dir[1],-PI2),PI2);
        }
        camCont.setDir([this.dir[1],this.dir[0]]);
    }
    calcMov(){
        this.scaleMov(0.3,1,0.3);
        this.rotateAddMov(((kbrd.getKey(65))?-0.1:0)+((kbrd.getKey(68))?0.1:0),this.mov[1],((kbrd.getKey(87))?-0.1:0)+((kbrd.getKey(83))?0.1:0));
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
        collisionPolys.forEach(pol=>{
            if(this.polygon.intersects(pol)){
                this.pos[1]=pol.height+pol.y;
                this.mov[1]=0;
                this.polygon.translateAbsolute(this.pos[0]-0.5,this.pos[1],this.pos[2]-0.5);
            }
        });
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
    constructor(x,y,z,width,height,depth,color){
        this.mesh = new THREE.Mesh(new THREE.BoxGeometry(width,height,depth),new THREE.MeshLambertMaterial(color));
        this.mesh.position.x=x+width/2;
        this.mesh.position.y=y+height/2;
        this.mesh.position.z=z+depth/2;
        this.polygon = new polygon([new THREE.Vector3(x,y,z),new THREE.Vector3(x+width,y,z),new THREE.Vector3(x+width,y,z+depth),new THREE.Vector3(x,y,z+depth)],height);
        scene.add(this.mesh);
        collisionPolys.push(this.polygon);
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
            return false;
        } else {
            let axes = this.getAxes(poly);
            let i = 0;
            while(inter&&axes.length>i){
                let tmin = this.getMinPt(axes[i],this.verts);
                let omin = poly.getMinPt(axes[i],poly.verts);
                let tmax = this.getMaxPt(axes[i],this.verts);
                let omax = poly.getMaxPt(axes[i],poly.verts);
                inter = ((tmin<=omin&&tmax>=omin)||(tmin<=omax&&tmax>=omax)||(omin<=tmin&&omax>=tmin)||(omin<=tmax&&omax>=tmax));
                i++;
            }
            return inter;
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
    getAxes(poly){
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
            i=0;
            if(poly.verts.length>=2){
                poly.verts.forEach(vert=>{
                    if(i<poly.verts.length-1){
                        axes.push([poly.verts[i][1]-poly.verts[i+1][1],poly.verts[i+1][0]-poly.verts[i][0]])
                    } else {
                        axes.push([poly.verts[i][1]-poly.verts[0][1],poly.verts[0][0]-poly.verts[i][0]])
                    }
                    i++;
                });
            }
            polygon.removeDuplicates(axes);
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
}
class circle extends polygon{
    constructor(center,radius,height){
        super(center,height);
        this.isCircle = true;
        this.radius = radius;
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