class polygon{
    constructor(vertices){
        if(vertices.length>=3){
            this.verts = vertices;
            this.planeNormal = this.calcNormal();
            this.calcAxis();
        } else {
            throw "vertices must be greater than 3"
        }
    }
    calcNormal(){
        let u = this.verts[1].getSubtract(this.verts[0]);
        let v = this.verts[2].getSubtract(this.verts[1]);
        return new v3((u.v[1]*v.v[2])-(u.v[2]*v.v[1]),(u.v[2]*v.v[0])-(u.v[0]*v.v[2]),(u.v[0]*v.v[1])-(u.v[1]*v.v[0])).getNormalized();
    }
    calcAxis(){
        this.normals = [];
        for(let i = 0;i<this.verts.length;i++){
            if(i<this.verts.length-1){
                this.normals.push(this.planeNormal.getPerpendicular(new v3(this.verts[i+1].getSubtract(this.verts[i]))));
            } else {
                this.normals.push(this.planeNormal.getPerpendicular(new v3(this.verts[0].getSubtract(this.verts[i]))));
            }
        }
        this.normals.push(this.planeNormal);
    }
}
class polyhedron{
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
            polyhedron.removeDuplicates(axes);
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
                let bufOver = polyhedron.getOverlap(tmin,tmax,omin,omax)
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
        /*for(let i=0; i<axes.length;i++){
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
        }*/
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
class circle extends polyhedron{
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
    isClockwiseOf(vect){
        let vectAngle = Math.atan2(vect.v[1],vect.v[0]);
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
        if(!vect){
            return new v3(this.v[1]*vect.v[2]-this.v[2]*vect.v[1],this.v[2]*vect.v[0]-this.v[0]*vect[2],this.v[0]*vect.v[1]-this.v[1]*this.vect[0]);
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
        return new v3(this.v[0]-vect.v[0],this.v[1]-vect.v[1],this.v[2]-vect.v[2]);;
    }
    get2D(){
        return new v2(this.v[0],this.v[2]);
    }
}