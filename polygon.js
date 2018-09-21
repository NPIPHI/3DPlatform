
class polygon{
    constructor(vertices){
        if(vertices.length>=3){
            this.verts = vertices;
            this.planeNormal = this.calcNormal();
            this.posAtAxis = vector.putPtOn(this.planeNormal,this.verts[0]);
            this.calcAxis();
        } else {
            throw "vertices must be greater than 3"
        }
    }
    calcNormal(){
        let v = this.verts[1].getSubtract(this.verts[0]);
        let u = this.verts[2].getSubtract(this.verts[1]);
        return new v3((u.v[1]*v.v[2])-(u.v[2]*v.v[1]),(u.v[2]*v.v[0])-(u.v[0]*v.v[2]),(u.v[0]*v.v[1])-(u.v[1]*v.v[0])).getNormalized();
    }
    calcAxis(){
        this.normals = [];
        this.posAtNormals = []
        for(let i = 0;i<this.verts.length;i++){
            if(i<this.verts.length-1){
                this.normals.push(this.planeNormal.getPerpendicular(this.verts[i].getSubtract(this.verts[i+1])).getNormalized());
            } else {
                this.normals.push(this.planeNormal.getPerpendicular(this.verts[i].getSubtract(this.verts[0])).getNormalized());
            }
        }
    }
    getEdgePts(axis){
        let buf = vector.putPtOn(axis,this.verts[0]);
        let r=[buf,buf];
        for(let i = 1; i < this.verts.length; i ++){
            buf = vector.putPtOn(axis,this.verts[i]);
            r=[Math.min(r[0],buf),Math.max(r[1],buf)];
        }   
    }
    translate(translateVect){
        this.verts.forEach(v=>{
            v.add(translateVect);
        });
        this.posAtAxis = vector.putPtOn(this.planeNormal,this.verts[0]);
    }
    intersects(poly){
        this.normals.forEach(n=>{

        });
    }
    getPolyVerts(){
        let verts = [];
        for(let i = 0; i < this.verts.length-2; i ++){
            verts.push(this.verts[0].v[0]);
            verts.push(this.verts[0].v[1]);
            verts.push(this.verts[0].v[2]);
            verts.push(this.verts[i+1].v[0]);
            verts.push(this.verts[i+1].v[1]);
            verts.push(this.verts[i+1].v[2]);
            verts.push(this.verts[i+2].v[0]);
            verts.push(this.verts[i+2].v[1]);
            verts.push(this.verts[i+2].v[2]);
        }
        return verts;
    }
}
class polyhedron{
    constructor(faces){
        this.faces = faces;
        this.calcVerts();
        this.calcAxis();
        this.calcBoundBox();
        this.translateTrack=new v3(0,0,0);
    }
    calcVerts(){//calculate an array of vertecies, removes duplicates
        this.verts = [];
        this.faces.forEach(face=>{
            face.verts.forEach(vert=>{
                let contains = false;
                for(let i = 0; i < this.verts.length&&!contains;i++){
                    if(vert.equals(this.verts[i])){
                        contains = true;
                    }
                }
                if(!contains){
                    this.verts.push(vert.clone());
                }
            })
        });
    }
    static calcNormal(p1,p2,p3){
        let v = p2.getSubtract(p1);
        let u = p3.getSubtract(p1);
        return new v3((u.v[1]*v.v[2])-(u.v[2]*v.v[1]),(u.v[2]*v.v[0])-(u.v[0]*v.v[2]),(u.v[0]*v.v[1])-(u.v[1]*v.v[0])).getNormalized();
    }
    calcAxis(){
        this.axes = [];
        this.checkAxes = []
        this.faces.forEach(f=>{
            this.axes.push(f.planeNormal);
            f.normals.forEach(n=>{
                this.checkAxes.push(n);
            })
        });
    }
    calcBoundBox(){//calculate a box used to check potential collisions
        this.boundBox = [this.verts[0],this.verts[0]];
        for(let i = 1; i < this.verts.length; i++){
            this.boundBox = [new v3(Math.min(this.boundBox[0].v[0],this.verts[i].v[0]),Math.min(this.boundBox[0].v[1],this.verts[i].v[1]),Math.min(this.boundBox[0].v[2],this.verts[i].v[2])),new v3(Math.max(this.boundBox[1].v[0],this.verts[i].v[0]),Math.max(this.boundBox[1].v[1],this.verts[i].v[1]),Math.max(this.boundBox[1].v[2],this.verts[i].v[2]))];
        }
    }
    intersects(poly){
        let inter = true;
        for(let i = 0; i < 3&&inter; i ++){
            let tmin = this.boundBox[0].v[i];
            let omin = poly.boundBox[0].v[i];
            let tmax = this.boundBox[1].v[i];
            let omax = poly.boundBox[1].v[i];
            inter = ((tmin<=omin&&tmax>=omin)||(tmin<=omax&&tmax>=omax)||(omin<=tmin&&omax>=tmin)||(omin<=tmax&&omax>=tmax));
        }
        if(inter){
            let axes = this.axes.slice(0);
            poly.axes.forEach(ax=>{axes.push(ax)});
            let minOverlap = this.faces[0].posAtAxis-poly.getMinPt(axes[0]);
            let axisCol = (!this.axes.length)?axes[0]:axes[0].getScaled(-1);
            for(let i = 1; i < axes.length&&inter;i++){
                let bufOverlap;
                if(i<this.faces.length){
                    bufOverlap = this.faces[i].posAtAxis-poly.getMinPt(axes[i]);
                } else {
                    bufOverlap = poly.faces[i-this.faces.length].posAtAxis-this.getMinPt(axes[i]);
                }
                if(minOverlap>bufOverlap){
                    minOverlap=bufOverlap;
                    axisCol = (i<this.axes.length)?axes[i].getScaled(-1):axes[i];
                    if(bufOverlap<0){inter = false;}
                }
            }
            if(inter){
                axes = [];
                this.faces.forEach(f=>{
                    f.normals.forEach(n=>{
                        axes.push(n);
                    })
                })
                poly.faces.forEach(f=>{
                    f.normals.forEach(n=>{
                        axes.push(n);
                    })
                })
                for(let i = 1; i < axes.length&&inter;i++){
                    let tPos = this.getEdgePts(axes[i]);
                    let oPos = poly.getEdgePts(axes[i]);
                    if(tPos[1]-oPos[0]<oPos[1]-tPos[0]){
                        if(tPos[1]-oPos[0]<minOverlap){
                            minOverlap = tPos[1]-oPos[0];
                            axisCol = axes[i].getScaled(-1);
                            inter = tPos[1]-oPos[0]>0;
                        }
                    } else {
                        if(oPos[1]-tPos[0]<minOverlap){
                            minOverlap = oPos[1]-tPos[0];
                            axisCol = axes[i];
                            inter = oPos[1]-tPos[0]>0;
                        }
                    }
                }
            }
            return {intersects: inter,axisOfColision: axisCol,overlap: minOverlap};
        } else {
            return {intersects: false};
        }
    }
    translate(translateVect){
        this.boundBox[0].add(translateVect);
        this.boundBox[1].add(translateVect);
        this.translateTrack.add(translateVect);
        this.verts.forEach(v=>{
            v.add(translateVect);
        });
        this.faces.forEach(f=>{
            f.translate(translateVect);
        });
    }
    translateAbsolute(translateVect){
        let relative = translateVect.getSubtract(this.translateTrack);
        this.boundBox[0].add(relative);
        this.boundBox[1].add(relative);
        this.translateTrack.add(relative);
        this.verts.forEach(v=>{
            v.add(relative);
        });
        this.faces.forEach(f=>{
            f.translate(relative);
        });
        this.translateTrack=translateVect.clone();
    }
    getEdgePts(axis){
        let buf = vector.putPtOn(axis,this.verts[0]);
        let r=[buf,buf];
        for(let i = 1; i < this.verts.length; i ++){
            buf = vector.putPtOn(axis,this.verts[i]);
            r=[Math.min(r[0],buf),Math.max(r[1],buf)];
        }
        return r;    
    }
    getMinPt(axis){
        let buf = vector.putPtOn(axis,this.verts[0]);
        for(let i = 1; i < this.verts.length; i ++){
            buf = Math.min(vector.putPtOn(axis,this.verts[i]),buf);
        }
        return buf;
    }
    getMaxPt(axis){
        let buf = vector.putPtOn(axis,this.verts[0]);
        for(let i = 1; i < this.verts.length; i ++){
            buf = Math.max(vector.putPtOn(axis,this.verts[i]),buf);
        }
        return buf;
    }
    getEdgePts(axis){
        let buf = vector.putPtOn(axis,this.verts[0]);
        buf = [buf,buf];
        for(let i = 1; i < this.verts.length; i ++){
            let pos = vector.putPtOn(axis,this.verts[i])
            buf = [Math.min(pos,buf[0]),Math.max(pos,buf[1])];
        }
        return buf;
    }
    static fromArray(verts){//takes same list of points as buffererd geometry
        let faces = []
        for(let i = 0; i<verts.length;i+=9){
            faces.push(new polygon([new v3(verts[i+6],verts[i+7],verts[i+8]),new v3(verts[i+3],verts[i+4],verts[i+5]),new v3(verts[i],verts[i+1],verts[i+2])]));
        }
        return new polyhedron(faces);
    }
    attach(group){
        this.parent = group;
    }
    getVertices(){//returns list of vertices for 3d polygon creation
        let verts = [];
        this.faces.forEach(face => {
            let fVerts = face.getPolyVerts();
            fVerts.forEach(v=>{
                verts.push(v);
            });
        });
        return verts;
    }
    static generateFromPoints(points){
        let normals = []
        for(let i1 = 0; i1 < points.length-2; i1++){
            for(let i2 = i1+1; i2 < points.length-1; i2++){
                for(let i3 = i2+1; i3 < points.length; i3++){
                    normals.push(polyhedron.calcNormal(points[i1],points[i2],points[i3]));
                }
            }
        }
        //duplicate all vectors in both directions
        let normaLen = normals.length;
        for(let i = 0; i < normaLen; i ++){
            normals.push(normals[i].getScaled(-1));
        }
        //remove duplicates for preformance
        for(let i =0; i < normals.length*2; i ++){
            for(let i2 = i+1; i2 < normals.length; i2++){
                if(normals[i].equals(normals[i2])){
                    normals.splice(i2,1);
                    i2--;
                }
            }
        }
        let bufPolyHed = [];
        //apply the possible normals to the points to see if three are coplaner
        for(let i = 0; i < normals.length; i++){
            let positionOnNormals = []
            points.forEach(pt=>{
                positionOnNormals.push(vector.putPtOn(normals[i],pt));
            });
            let min = [positionOnNormals[0]];
            let minPts = [points[0]]
            for(let i = 1; i < positionOnNormals.length; i++){
                if(positionOnNormals[i]<min[0]){
                    min=[positionOnNormals[i]]
                    minPts = [points[i]];
                } else if(positionOnNormals[i]==min[0]){
                    min.push(positionOnNormals[i]);
                    minPts.push(points[i]);
                }
            }
            if(minPts.length>=3){
                bufPolyHed.push(minPts);
            }
        }
        console.log(bufPolyHed);
        let faces  = [];
        bufPolyHed.forEach(poly => {
            faces.push(new polygon(poly));
        });
        return new polyhedron(faces);
    }
}
class polyhedronLegacy{
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
            for(let i=0; i <axes.length;i++){
                axes[i]=axes[i].getNormalized();
            }
            polyhedronLegacy.removeDuplicates(axes);
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
                let bufOver = polyhedronLegacy.getOverlap(tmin,tmax,omin,omax)
                inter = bufOver[0]>0;
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
    static getOverlap(start1,stop1,start2,stop2){//overlap number,reverseVector,partialOveclap boolean
        let flip = start1+stop1<start2+stop2;
        if(start1<start2){
            if(stop1>stop2){
                return [stop2-start2,flip,false];
            } else {
                return [stop1-start2,flip,true];
            }
        } else {
            if(stop2>stop1){
                return [stop1-start1,flip,false];
            } else {
                return [stop2-start1,flip,true];
            }
        }
    }
    getMinPt(axis){//normalised
        let curMin = vector.putPtOn(axis,this.verts[0]);
        for(let i = 1; i <this.verts.length; i++){
            curMin = Math.min(vector.putPtOn(axis,this.verts[i]),curMin);
        }
        return curMin;
    }
    getMaxPt(axis){//normalised
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
    static removeDuplicates(axes){//normalised
        for(let i = 0;i<axes.length;i++){
            for(let i1=1; i1+i<axes.length;i1++){
                if(axes[i].equals(axes[i1+i])||axes[i].equals(axes[i1+i].getScaled(-1))){
                    axes.splice(i1+i,1);
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
class circle extends polyhedronLegacy{
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
class ray {
    constructor(p1,dir){
        this.p1 = p1.clone();
        this.dir = dir.clone();
    }
    getAxes(){
        return this.normals();
    }
    getIntersect(plane){//plane is polygon
        return this.dir.getScaled(vector.dot(plane.verts[0].getSubtract(this.p1),plane.planeNormal)/vector.dot(plane.planeNormal,this.dir)).getAdd(this.p1);
    }
    intersects(poly){
        let axes = poly.axes.slice(0);
        let minOverlap = this.faces[0].posAtAxis-poly.getMinPt(axes[0]);
        let axisCol = (!this.axes.length)?axes[0]:axes[0].getScaled(-1);
        for(let i = 1; i < axes.length&&inter;i++){
            let bufOverlap;
            if(i<this.faces.length){
                bufOverlap = this.faces[i].posAtAxis-poly.getMinPt(axes[i]);
            } else {
                bufOverlap = poly.faces[i-this.faces.length].posAtAxis-this.getMinPt(axes[i]);
            }
            if(minOverlap>bufOverlap){
                minOverlap=bufOverlap;
                axisCol = (i<this.axes.length)?axes[i].getScaled(-1):axes[i];
                if(bufOverlap<0){inter = false;}
            }
            }
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
    static putPtOn(axis,pt){//axisIsNormalised
        let m = axis.getMag2();
        if(!(m<1.01&&m>0.99)){
            throw"axis must be normalized";
        }
        return vector.dot(axis,pt);
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
    static fromRadians(radians){//returns a v2 parallel to the radians 
        return new v2(Math.cos(radians),Math.sin(radians));
    }
    equals(v){
        let r=true;
        let i = 0;
        if(this.v.length!=v.v.length){
            return false;
        }
        while(r&&i<this.v.length){
            r=(this.v[i]==v.v[i]);
            i++;
        }
        return r;
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
    getMag2(){
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
    clone(){
        return new v0();
    }
    scale(scale){

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
    getMag2(){
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
        return new v1(this.v[0]-vect[0]);
    }
    clone(){
        return new v1(this.v[0]);
    }
    scale(scale){
        this.v[0]*=scale;
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
    getMag2(){
        return (this.v[0]*this.v[0]+this.v[1]*this.v[1]);
    }
    getPerpendicular(){
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
    clone(){
        return new v2(this.v[0],this.v[1]);
    }
    scale(scale){
        this.v[0]*=scale;
        this.v[1]*=scale;
    }
    getPerpendicularOf(axis){//axis should be an v3 that is normalized
        return new v3(this.v[0]*(1-Math.abs(axis.v[0])),0,this.v[1]*(1-Math.abs(axis.v[2])));
    }
    rotate(angle){//rotate in radians
        this.v[0]=Math.cos(angle)*this.v[0]+Math.sin(angle)*this.v[1];
        this.v[1]=Math.cos(angle)*this.v[1]+Math.sin(angle)*this.v[0];
    }
    getRotate(angle){//rotate in radians
        return new v2(+Math.cos(angle)*this.v[0]+Math.sin(angle)*this.v[1],-Math.sin(angle)*this.v[0]+Math.cos(angle)*this.v[1]);
    }
    getAngle(){
        let ans = Math.atan2(this.v[1],this.v[0]);
        while(ans<0){
            ans += Math.PI*2;
        }
        return ans;
    }
    isClockwiseOf(vect){
        let a1 = this.getAngle();
        let a2 = vect.getAngle();
        while(a1>a2){
            a2+=Math.PI*2;
        }
        return a1<a2+Math.PI;
    }
    isClockwiseOfRadians(angle){
        let a1 = this.getAngle();
        let a2 = angle;
        while(a1>a2){
            a2+=Math.PI*2;
        }
        return a1<a2+Math.PI;
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
    getMag2(){
        return (this.v[0]*this.v[0]+this.v[1]*this.v[1]+this.v[2]*this.v[2]);
    }
    getPerpendicular(vect){
        if(vect){
            return new v3(this.v[1]*vect.v[2]-this.v[2]*vect.v[1],this.v[2]*vect.v[0]-this.v[0]*vect.v[2],this.v[0]*vect.v[1]-this.v[1]*vect.v[0]);
        } else {
            throw "requires anorhter vector"
        }
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
        return new v3(this.v[0]+vect.v[0],this.v[1]+vect.v[1],this.v[2]+vect.v[2]);
    }
    subtract(vect){
        this.v[0]-=vect.v[0];
        this.v[1]-=vect.v[1];
        this.v[2]-=vect.v[2];
    }
    getSubtract(vect){
        return new v3(this.v[0]-vect.v[0],this.v[1]-vect.v[1],this.v[2]-vect.v[2]);
    }
    get2D(){
        return new v2(this.v[0],this.v[2]);
    }
    clone(){
        return new v3(this.v[0],this.v[1],this.v[2]);
    }
    scale(scale){
        this.v[0]*=scale;
        this.v[1]*=scale;
        this.v[2]*=scale;
    }
    equals(vect){
        return (vect.v[0]==this.v[0]&&vect.v[1]==this.v[1]&&vect.v[2]==this.v[2]);
    }
    static orderClocwise(axis,points){
        //if axis.v[1] == 0 x=pointsv[0] y= points v[1]
        //convert points to polar
        //order in ascending order
        //done
    }
    cross(vect){
        return new v3(this.v[1]*vect.v[2]-this.v[2]*vect.v[1], this.v[2]*vect.v[0]+this.v[0]*vect.v[2], this.v[0]*vect.v[1]-this.v[1]*vect.v[0]);
    }
}