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
        var ambLight = new THREE.AmbientLight(0x606060);
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
        OBJLoader.load(
            // resource URL
            'res/player/body.obj',
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
        );
        new boxPlatform(-20,-1,-20,100,1,100,0xffffff,0);
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
        this.mesh = new THREE.Mesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshLambertMaterial({color: 0x00ff00}));
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
        this.wallJumpBuffer = 5;
        this.wallJumpTrack = 0;
        this.debugSpeed = 0.5;
        this.buildVerts=[];
        this.buildStep=0;
        this.groudNormal = new v3(0,0,0);
        this.buildColor=0x808080;
        this.grounded = false;
        this.polygon = new polyhedron([new polygon([new v3(0,0,0),new v3(0,0,1),new v3(1,0,1),new v3(1,0,0)]),
        new polygon([new v3(0,1,0),new v3(1,1,0),new v3(1,1,1),new v3(0,1,1)]),
        new polygon([new v3(1,1,1),new v3(1,1,0),new v3(1,0,0),new v3(1,0,1)]),
        new polygon([new v3(0,0,1),new v3(0,0,0),new v3(0,1,0),new v3(0,1,1)]),
        new polygon([new v3(1,0,1),new v3(0,0,1),new v3(0,1,1),new v3(1,1,1)]),
        new polygon([new v3(1,1,0),new v3(0,1,0),new v3(0,0,0),new v3(1,0,0)])]);
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
        this.mesh.translateX(-this.pos.v[0]);
        this.mesh.translateY(-this.pos.v[1]);
        this.mesh.translateZ(-this.pos.v[2]);
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
        if(this.grounded){
            this.rotateAddMov(new v2(((kbrd.getKey(65))?-this.acceleration:0)+((kbrd.getKey(68))?this.acceleration:0),((kbrd.getKey(87))?-this.acceleration:0)+((kbrd.getKey(83))?this.acceleration:0)));
        } else {
            this.rotateAddMov(new v2(((kbrd.getKey(65))?-this.airAcceleration:0)+((kbrd.getKey(68))?this.airAcceleration:0),((kbrd.getKey(87))?-this.airAcceleration:0)+((kbrd.getKey(83))?this.airAcceleration:0)));
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
        /*this.grounded = false;
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
                        let bufEject = eject.getPerpendicular().getNormalized();
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
            if(this.wallJumpTrack>0){
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
    rotateAddMov(vect){
        let bufV = vect.getRotate(this.dir.v[0]);
        if(this.grounded){
            this.mov.add(bufV.getPerpendicularOf(this.groudNormal));
        } else {
            this.mov.v[0]+=bufV.v[0];
            this.mov.v[2]+=bufV.v[1];
        }
        /*if(this.grounded){
            this.mov.v[1]+=(1-this.groudNormal.v[1])*Math.sqrt((x*x)+(z*z));
        }
        this.mov.v[0]+=Math.cos(this.dir.v[0])*x+Math.sin(this.dir.v[0])*z;
        this.mov.v[2]+=-Math.sin(this.dir.v[0])*x+Math.cos(this.dir.v[0])*z;*/
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
class testPlat extends platform{
    constructor(){
        super();
        let verts = new Float32Array([
            0,0.5,0,
            10,0.5,0,
            0,0.5,10,
            0,0.5,0,
            0,3.5,0,
            10,0.5,0,
            0,0.5,0,
            0,0.5,10,
            0,3.5,0,
            10,0.5,0,
            0,3.5,0,
            0,0.5,10
        ]);
        let uvs = new Float32Array([
            0,0,
            1,0,
            0,1,
            0,0,
            0,0,
            1,0,
            0,0,
            0,1,
            0,0,
            1,0,
            0,0,
            0,1
        ]);
        
        let geometry = new THREE.BufferGeometry();
        
        // itemSize = 3 because there are 3 values (components) per vertex
        geometry.addAttribute( 'position', new THREE.BufferAttribute( verts, 3 ) );
        geometry.addAttribute( 'uv', new THREE.BufferAttribute( uvs, 2 ) );
        geometry.computeVertexNormals();
        let material = new THREE.MeshLambertMaterial({map: texture});
        this.mesh = new THREE.Mesh( geometry, material );
        scene.add(this.mesh);
        this.polyhedron = polyhedron.fromArray(verts);
        collisionPolys.push(this.polyhedron);
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
        this.mesh = new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:colour,map:texture}));
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