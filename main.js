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
function convertFromObj(vertArray){
    let str = "";
    for(let i = 0; i<vertArray.length; i++){
        if(i==vertArray.length-1){
            str = str+vertArray[i]+",";
        } else {
            if((i+1)%3==0&&i){
                str = str+vertArray[i]+",\n";
            } else {
                str = str+vertArray[i]+",";
            }
        }
    }
    console.log(str);
}
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
        var ambLight = new THREE.AmbientLight(0x909090);
        scene.add (ambLight);
        light.position.set( 0, 10, 0 );
        scene.add( light );
        camCont = new cameraControl(camera);
        p1 = new player(0,0.5,5);
        main.generatePlats();
        main.onLoad();
        
    }
    static onLoad(){
        main.draw();
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
        }
        if(kbrd.getToggle(49)){
            gameMode = 0;
            console.log("gamemode 0");
        }
        if(kbrd.getToggle(50)){
            gameMode=1;
            console.log("gamemode1");
        }
        kbrd.resetToggle();
        requestAnimationFrame(main.cycle);
        if(document.pointerLockElement === renderer.domElement ||
            document.mozPointerLockElement === renderer.domElement) {
              mouseLocked = true;
          } else {
              mouseLocked = false;
          }
    }
    static generatePlats(){
        new boxPlatform(-20,-1,-20,100,1,100,0xffffff,1);
        new boxPlatform(5,0,5,5,2,3,0xff0000,0);
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
        {this.body = new THREE.Group();
        this.chest = new THREE.Group();
        this.armL = new THREE.Group();
        this.armR = new THREE.Group();
        this.legL = new THREE.Group();
        this.legR = new THREE.Group();
        let mesh = loadModel(model.player.chest);
        mesh.position.x=-0.25;
        mesh.position.y=-0.75;
        mesh.position.z=-0.5;
        this.chest.add(mesh);
        this.chest.position.x=0;
        this.chest.position.y=0.25;
        this.chest.position.z=0;
        this.body.add(this.chest);
        mesh = loadModel(model.player.arm);
        mesh.position.x=-0.15;
        mesh.position.y=-1.2;
        mesh.position.z=-0.15;
        this.armL.add(mesh);
        this.armL.position.z=-0.65;
        this.armL.position.x=0;
        this.armL.position.y=0.9;
        this.body.add(this.armL);
        mesh = loadModel(model.player.arm);
        mesh.position.x=-0.15;
        mesh.position.y=-1.2;
        mesh.position.z=-0.15;
        this.armR.add(mesh);
        this.armR.position.z=0.65;
        this.armR.position.x=0;
        this.armR.position.y=0.9;
        this.body.add(this.armR);
        mesh = loadModel(model.player.arm);
        mesh.position.x=-0.15;
        mesh.position.y=-1.2;
        mesh.position.z=-0.15;
        this.legR.add(mesh);
        this.legR.position.z=0.25;
        this.legR.position.x=0;
        this.legR.position.y=-0.5;
        this.body.add(this.legR);
        mesh = loadModel(model.player.arm);
        mesh.position.x=-0.15;
        mesh.position.y=-1.2;
        mesh.position.z=-0.15;
        this.legL.add(mesh);
        this.legL.position.z=-0.25;
        this.legL.position.x=0;
        this.legL.position.y=-0.5;
        this.body.add(this.legL);
        scene.add(this.body);}
        //scene.add(mesh);
        this.pos = new v3(x,y,z);
        this.dir = new v2(camera.getWorldDirection().x,camera.getWorldDirection().y);
        this.mov = new v3(0,0,0);
        camera.rotation.z=0;
        this.acceleration= 0.05;
        this.airAcceleration=0.005;
        this.wallJumpPow = 0.2;
        this.wallJumpUp = 0.15;
        this.jump = 0.25;
        this.wallJumpBuffer = 5;
        this.wallJumpTrack = 0;
        this.debugSpeed = 0.5;
        this.buildVerts=[];
        this.buildStep=0;
        this.groudNormal = new v3(0,0,0);
        this.buildColor=0x808080;
        this.grounded = false;
        this.walking=false;
        this.walkDirection=0;
        this.swingTracker=0;
        this.swingDirection=true;
        this.polygon = new polyhedron([new polygon([new v3(0,-1.2,0),new v3(0,-1.2,1),new v3(0.5,-1.2,1),new v3(0.5,-1.2,0)]),
        new polygon([new v3(0,1.5,0),new v3(0.5,1.5,0),new v3(0.5,1.5,1),new v3(0,1.5,1)]),
        new polygon([new v3(0.5,1.5,1),new v3(0.5,1.5,0),new v3(0.5,-1.2,0),new v3(0.5,-1.2,1)]),
        new polygon([new v3(0,-1.2,1),new v3(0,-1.2,0),new v3(0,1.5,0),new v3(0,1.5,1)]),
        new polygon([new v3(0.5,-1.2,1),new v3(0,-1.2,1),new v3(0,1.5,1),new v3(0.5,1.5,1)]),
        new polygon([new v3(0.5,1.5,0),new v3(0,1.5,0),new v3(0,-1.2,0),new v3(0.5,-1.2,0)])]); 
        updateLoop.push(this);
    }
    getFriction(){
        if(this.wallTouch){
            return 0.2;
        } else {
            return 0.001;
        }
    }
    update(deltaTime){
        this.body.translateX(-this.pos.v[0]);
        this.body.translateY(-this.pos.v[1]);
        this.body.translateZ(-this.pos.v[2]);
        if(gameMode==0){
            this.calcMov();
            this.calcIntersect();
        }
        if(gameMode==1){
            this.creativMov();
            this.creativBuild();
        }
        this.calcBody();
        this.calcCamera();
        this.animate();
    }
    calcCamera(){
        if(mouseLocked){
            this.dir.v[0]-=kbrd.mouseMov[0]/400;
            this.dir.v[1]-=kbrd.mouseMov[1]/400;
            //this.dir.v[0]+=(((kbrd.getKey(37))?-0.05:0)+((kbrd.getKey(39))?0.05:0))
            //this.dir.v[1]+=(((kbrd.getKey(38))?-0.05:0)+((kbrd.getKey(40))?0.05:0))
            this.dir.v[1]=Math.min(Math.max(this.dir.v[1],-PI2),PI2);
            while(this.dir.v[0]>Math.PI*2){
                this.dir.v[0]-=Math.PI*2;
            }
            while(this.dir.v[0]<Math.PI*2){
                this.dir.v[0]+=Math.PI*2;
            }
        }
        camCont.setPos(new v3(this.pos.v[0]+Math.sin(this.dir.v[0])*5*Math.cos(this.dir.v[1]),this.pos.v[1]+Math.sin(this.dir.v[1])*-5,this.pos.v[2]+Math.cos(this.dir.v[0])*5*Math.cos(this.dir.v[1])));
        camCont.setDir(this.dir);
    }
    animate(){
        this.body.rotation.y=-this.walkDirection;
        if(this.walking){
            this.swingTracker+=(this.swingDirection)?0.2:-0.2;
        } else {
            if(this.swingTracker!=0){
                this.swingTracker+=(this.swingTracker>0)?(-Math.min(0.1,this.swingTracker)):(Math.min(0.1,-this.swingTracker));
            }
        }
        if(this.swingTracker>2){
            this.swingDirection=false;
        }
        if(this.swingTracker<-2){
            this.swingDirection=true;
        }
        if(this.swingTracker>0){
            this.armL.rotation.z=(Math.sqrt(this.swingTracker));
            this.armR.rotation.z=(-Math.sqrt(this.swingTracker));
            this.legL.rotation.z=(-Math.sqrt(this.swingTracker));
            this.legR.rotation.z=(Math.sqrt(this.swingTracker));
        } else {
            this.swingTracker*=-1;
            this.armL.rotation.z=(-Math.sqrt(this.swingTracker));
            this.armR.rotation.z=(Math.sqrt(this.swingTracker));
            this.legL.rotation.z=(Math.sqrt(this.swingTracker));
            this.legR.rotation.z=(-Math.sqrt(this.swingTracker));
            this.swingTracker*=-1;
        }
    }
    creativMov(){
        this.pos.add(new v3(((kbrd.getToggle(65))?-this.debugSpeed:0)+((kbrd.getToggle(68))?this.debugSpeed:0),((kbrd.getToggle(16))?this.debugSpeed:0)+((kbrd.getToggle(17))?-this.debugSpeed:0),((kbrd.getToggle(87))?-this.debugSpeed:0)+((kbrd.getToggle(83))?this.debugSpeed:0)));
    }
    creativBuild(){
        if(this.buildStep==1){
            if(kbrd.getToggle(13)){
                this.buildStep=0;
                this.buildHeight=this.pos.v[1]-this.buildY;
                if(this.buildHeight>0&&this.buildVerts.length>2){
                    new arbitraryPolygonPlatform(this.buildVerts,this.buildY,this.buildHeight,this.buildColor);
                    console.log("platform created");
                } else {
                    console.log("invalid Dimensions");
                }
                this.buildVerts = [];
            }
        }
        if(this.buildStep==0){
            if(kbrd.getToggle(32)){
                this.buildVerts.push(this.pos.get2D());
                console.log("vert at "+this.pos.v[0]+", "+this.pos.v[2]);
            }
            if(kbrd.getToggle(9)){
                this.buildStep=1;
                this.buildY=this.pos.v[1];
                console.log("y at "+ this.pos.v[1]);
            }
        } 
    }
    calcMov(){
        this.jumping = false;
        this.wallJumpTrack--;
        if(this.grounded){
            this.mov.scale(0.9);
        } else {
            this.mov.scale(0.98);
        }
        let bufWalk = new v2(((kbrd.getKey(65))?-1:0)+((kbrd.getKey(68))?1:0),((kbrd.getKey(87))?-1:0)+((kbrd.getKey(83))?1:0));
        if(this.grounded){
            this.calcWalk(bufWalk.getScaled(this.acceleration));
        } else {
            this.calcWalk(bufWalk.getScaled(this.airAcceleration));
        }
        if(kbrd.getToggle(32)){
            if(this.grounded){
                this.mov.add(this.groudNormal.getScaled(this.jump));
                this.jumping = true;
            } if(this.wallTouch&&!this.jumping){
                this.mov.add(this.groudNormal.getScaled(this.wallJumpPow));
            }
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
        this.wallTouch = false;
        this.grounded = false;
        let groundVects = [];
        let wallVects = [];
        collisionPolys.forEach(pol=>{
            let inter = this.polygon.intersects(pol);
            if(inter.intersects){
                this.pos.add(inter.axisOfColision.getScaled(inter.overlap));
                this.polygon.translateAbsolute(new v3(this.pos.v[0]-0.5,this.pos.v[1],this.pos.v[2]-0.5));
                this.mov.subtract(inter.axisOfColision.getScaled(vector.putPtOn(inter.axisOfColision,this.mov)));
                this.wallTouch = true;
                if(inter.axisOfColision.v[1]>floorAngle){
                    groundVects.push(inter.axisOfColision.clone());
                } else {
                    wallVects.push(inter.axisOfColision.clone());
                }
            }
        });
        if(groundVects.length){
            this.groudNormal = vector.getAvgVect(groundVects).getNormalized();
            this.grounded = true;
        } else {
            if(wallVects.length){
                this.groudNormal = vector.getAvgVect(wallVects).getAdd(new v3(0,this.wallJumpPow,0)).getNormalized();
            } else {
                this.groudNormal = new v3(0,1,0);
            }
        }
    }
    calcBody(){
        this.body.position.x=this.pos.v[0];
        this.body.position.y=this.pos.v[1]+0.5;
        this.body.position.z=this.pos.v[2];
    }
    calcWalk(vect){
        if(vect.getMag2()!=0){
            this.walking =true;
            let bufV = vect.getRotate(this.dir.v[0]);
            this.walkDirection = bufV.getAngle();
            if(this.grounded){
                this.mov.add(bufV.getPerpendicularOf(this.groudNormal));
            } else {
                this.mov.v[0]+=bufV.v[0];
                this.mov.v[2]+=bufV.v[1];
            }
        } else {
            this.walking = false;
        }
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
        this.body.translateX(x);
        this.body.translateY(y);
        this.body.translateZ(z);

    }
}
class testPlat extends platform{
    constructor(){
        super();
        let verts = new Float32Array(model.player.arm.mesh);
        this.mesh = loadModel(model.player.arm)
        scene.add(this.mesh);
        this.mesh.translateY(1);
        this.polyhedron = polyhedron.fromArray(verts);
        collisionPolys.push(this.polyhedron);
    }
    rotate(){
        if(kbrd.getKey(65)){
            this.mesh.position.y=1;
        } else {
            this.mesh.position.y=0.5;
        }
    }
}
class arbitraryPolygonPlatform extends platform{
    constructor(verts,y,height,color){
        super();
        let polys = verts.length-2;
        let vertices = [];
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
        this.polyhedron = polyhedron.fromArray(vertices);
        collisionPolys.push(this.polyhedron);
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
    constructor(x,y,z,width,height,depth,colour,textureType){
        super();
        let geo = new THREE.BoxGeometry(width,height,depth);
        let material
        if(textureType == 1){
            material = new THREE.MeshLambertMaterial({color:colour,map:texture})
        } else {
            material = new THREE.MeshLambertMaterial({color:colour});
        }
        this.mesh = new THREE.Mesh(geo,material);
        this.mesh.position.x=x+width/2;
        this.mesh.position.y=y+height/2;
        this.mesh.position.z=z+depth/2;
        this.height = height;
        this.polygon = new polyhedron([new polygon([new v3(x,y,z),new v3(x,y,z+depth),new v3(x+width,y,z+depth),new v3(x+width,y,z)]),
                        new polygon([new v3(x,y+height,z),new v3(x+width,y+height,z),new v3(x+width,y+height,z+depth),new v3(x,y+height,z+depth)]),
                        new polygon([new v3(x+width,y+height,z+depth),new v3(x+width,y+height,z),new v3(x+width,y,z),new v3(x+width,y,z+depth)]),
                        new polygon([new v3(x,y,z+depth),new v3(x,y,z),new v3(x,y+height,z),new v3(x,y+height,z+depth)]),
                        new polygon([new v3(x+width,y,z+depth),new v3(x,y,z+depth),new v3(x,y+height,z+depth),new v3(x+width,y+height,z+depth)]),
                        new polygon([new v3(x+width,y+height,z),new v3(x,y+height,z),new v3(x,y,z),new v3(x+width,y,z)])]);
        //this.polygon = new polyhedronLegacy([new v2(x,z),new v2(x+width,z),new v2(x+width,z+depth), new v2(x,z+depth)],y,height);
        scene.add(this.mesh);
        collisionPolys.push(this.polygon);
    }
}
class movingPlatform extends arbitraryPolygonPlatform{
    constructor(verts,y,height,color,start,end,speed){
        super(verts,y,height,color);
        this.mov=vector.getVectAtMagnitude(new v3(end[0]-start[0],end[1]-start[1],end[2]-start[2]),speed);
    }
}
var fps=1;
var camera;
var camCont;
var renderer;
var p1;
var collisionPolys=[];
var mouseLocked = false;
var PI2 = Math.PI/2;
var PI = Math.PI;
var scene;
var frame = 0;
var texture = new THREE.TextureLoader().load("res/texture.png");
var updateLoop =[];
var gameMode = 0;
var floorAngle = 0.5;
var OBJLoader = new THREE.OBJLoader();
main.init();
/*OBJLoader.load(
            // resource URL
            'res/player/arm.obj',
            // called when resource is loaded
            function ( object ) {
        
                scene.add( object );
                collisionPolys.push(polyhedron.fromArray(object.children[0].geometry.attributes.position.array));
        
            },
            // called when loading is in progresses
            function ( xhr ) {
        
                console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
        
            },
            // called when loading has errors
            function ( error ) {
        
                console.log( 'An error happened' );
        
            }
        );*/