function createStair() {
    var shape = new THREE.Shape();
    shape.moveTo(0, -5);
    shape.lineTo(5, -5);
    shape.lineTo(3, 0);
    shape.lineTo(0, 0);

    var geometry = new THREE.ExtrudeGeometry(
        shape, 
        {
            steps: 15,
            depth: 0.2,
            bevelEnabled: true,
            bevelThickness: 0.25,
            bevelSize: 2,
            bevelOffset: 0,
            bevelSegments: 8
        });
    
    var stair = new THREE.Mesh(
        geometry, 
        new THREE.MeshLambertMaterial({ color: 0x69512a})
    );

    stair.rotation.x = Math.PI/2;
    stair.rotation.z = Math.PI;

    return stair;
}

function createSecondFloor() {
    var geometry = new THREE.BoxGeometry(20, 35, 1);
    var material = new THREE.MeshLambertMaterial({ color: 0x828282});
    var floor = new THREE.Mesh(geometry, material);
    floor.castShadow = true;
    floor.position.x = stepLength + 4;
    floor.rotation.x = 0.5 * Math.PI;

    return floor;
}

function createRailingSupportPoints() {
    var railingPoints = [
        new THREE.Vector3(0, 1.5, 3),
        new THREE.Vector3(-7, 1.5, 3),
        new THREE.Vector3(-7.5, 1.5, 3),
        new THREE.Vector3(-7.5, 1.4, 3),
        new THREE.Vector3(-7.5, 7.5, 3)
    ];

    return railingPoints;
}

function createNonRailingSupportPoints() {
    var railingPoints = [
        new THREE.Vector3(7, 1.5, 3),
        new THREE.Vector3(0, 1.5, 3),
    ]

    return railingPoints;
}

function addLightningAndShadows(scene) {
    var sl = new THREE.SpotLight( 0xfff0d9);
    sl.position.set( 50, 85, 50 );
    sl.castShadow = true;
    scene.add(sl);

    var al = new THREE.AmbientLight(0x36322d);
    scene.add(al);
}

function createRailingPathPoint() {
    var point = new THREE.Mesh(
        new THREE.BoxGeometry(0, 0, 0), 
        new THREE.MeshLambertMaterial({ color: 0xff0033 })
    );
    point.position.x = 3;
    point.position.y = 7.5;
    point.position.z = 7.5;
    point.visible = false;

    return point;
}

function createStepSupportCyllinder(material) {
    var h = 2.75;
    var r = 0.75;
    var cyllinder = new THREE.Mesh(
        new THREE.CylinderGeometry(r, r, h, 32), 
        material
    );
    cyllinder.position.x = 2;
    cyllinder.position.y = 0.6;
    cyllinder.castShadow = true;
    cyllinder.receiveShadow = true;

    return cyllinder;
}

function createStepSupporter(material) {
    var h = 1;
    var l = 5;
    var supporter = new THREE.Mesh(
        new THREE.CubeGeometry(l, h, 0.5),
        material
    );

    supporter.position.y = -0.5;
    supporter.castShadow = true;
    supporter.receiveShadow = true;

    return supporter;
}

function createStairs(scene, newStairCount, newRotation, renderer) {
    
    renderer.setClearColor(0x66c7ff, 0.8);
    renderer.setSize(window.innerWidth, window.innerHeight);

    var planeGeometry = createFirstFloor();
    scene.add(planeGeometry);

    var stairSupportMaterial = new THREE.MeshPhongMaterial({color: 0xb5a791});
    var finalRotationAngle = newRotation;
    var stairCount = newStairCount;

    stepLength = 8;
    X = 0;
    Z = 0;
    handrailPath = [];

    for (i = 0; i < stairCount; i++) {
        var rotationAngle = (Math.PI / 90) * (finalRotationAngle / (stairCount - 1) * i);
        var stair = createStair();
        if(i % 2 == 0) {
            stair.scale.y = -1;
        }

        stair.castShadow = true;
        stair.receiveShadow = true;

        var supportCyllinder = createStepSupportCyllinder(stairSupportMaterial);
        var stepSupporter = createStepSupporter(stairSupportMaterial);
        
        var levelGroup = new THREE.Group();
        if (i % 2 === 0) {
            // right-foot-stairs
            var supportPoints = createRailingSupportPoints();
            var railingHolderGeometry = new THREE.TubeGeometry(
                new THREE.CatmullRomCurve3(supportPoints), 
                150, 
                0.2, 
                18,
                false
            );
            var railingHolder = new THREE.Mesh(
                railingHolderGeometry, 
                stairSupportMaterial
            );

            railingHolder.rotation.y = Math.PI/2;
            var box = createRailingPathPoint()
            handrailPath.push(box);
            levelGroup.add(box);
            levelGroup.add(railingHolder)
        } else {
            // left-foot stairs
            var supportPoints = createNonRailingSupportPoints();
            var nonRailingGeometry = new THREE.TubeGeometry(
                new THREE.CatmullRomCurve3(supportPoints),
                150,
                0.2,
                18,
                false
            );
            var nonRailingHolder = new THREE.Mesh(
                nonRailingGeometry, 
                stairSupportMaterial
            );

            nonRailingHolder.rotation.y = Math.PI/2;
            levelGroup.add(nonRailingHolder)
        }

        levelGroup.add(stair);
        levelGroup.add(stepSupporter);

        if (i == stairCount - 1) {
            var floor = createSecondFloor();
            levelGroup.add(floor);
            
            levelGroup.remove(nonRailingHolder);
            if (railingHolder)
            levelGroup.remove(railingHolder);
        } else {
            levelGroup.add(supportCyllinder);
        }
        
        levelGroup.position.x = X;
        levelGroup.position.z = Z;
        levelGroup.position.y = 2*stepSupporter.geometry.parameters.height + 2*i;
        var rotationAngle = (Math.PI / 180) * (finalRotationAngle / (stairCount - 1) * i);
        levelGroup.rotation.y = rotationAngle;
    
        X = X + stepLength / 2 * Math.cos(rotationAngle);
        Z = Z - stepLength / 2 * Math.sin(rotationAngle);

        scene.add(levelGroup);
    }
    scene.updateMatrixWorld();
    var path = [];
    for (var i = 0; i < handrailPath.length; i++) {
        var target = new THREE.Vector3();
        handrailPath[i].getWorldPosition(target);
        path.push(target);
    }

    var handrailGeometry = new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(path), 
        80, 
        0.2, 
        8, 
        false
    );

    var handrail = new THREE.Mesh(handrailGeometry, stairSupportMaterial);
    handrail.castShadow = true;
    handrail.receiveShadow = true;
    scene.add(handrail);
    
    addLightningAndShadows(scene);   
}

function createFirstFloor() {
    var pg = new THREE.PlaneGeometry(150, 150);
    var material = new THREE.MeshLambertMaterial({color: 0x828282});
    var mesh = new THREE.Mesh(pg, material);
    mesh.receiveShadow  = true;

    mesh.rotation.x = -0.5*Math.PI;
    mesh.position.y = 1;

    return mesh;
}

function addUI(changeable, scene, renderer) {
    var gui = new dat.GUI();
    
    gui.add(changeable, 'stairs', 1, 30)
        .step(3)
        .name("Stairs")
        .onChange(() =>  { 
            if (scene.children && scene.children.length > 0)
                scene.children = [];

            createStairs(scene, changeable.stairs, changeable.angle, renderer)
        });

    gui.add(changeable, 'angle', 0, 360)
        .step(1)
        .name("Angle")
        .onChange(() => {
            if (scene.children && scene.children.length > 0)
                scene.children = [];

            createStairs(scene, changeable.stairs, changeable.angle, renderer)
        });
}

$(function() {
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(
        45, 
        window.innerWidth / window.innerHeight,
        1,
        1000);
    camera.position.x = -100;
    camera.position.y = 100;
    camera.position.z = 130;
    camera.lookAt(scene.position);

    var renderer = new THREE.WebGLRenderer();
    renderer.shadowMap.enabled = true;
    
    var changeable = new function () {
        this.stairs = 12;
        this.angle = 90;
    }

    addUI(changeable, scene, renderer);

    var firstFloor = createFirstFloor();
    scene.add(firstFloor);

    createStairs(scene, changeable.stairs, changeable.angle, renderer);


    $("#WebGL-output").append(renderer.domElement);
    var trackballControls = new THREE.TrackballControls(
        camera, 
        renderer.domElement
    );
    render();

    function render() {
        renderer.render(scene, camera);
        trackballControls.update();
        requestAnimationFrame(render);
    }
});