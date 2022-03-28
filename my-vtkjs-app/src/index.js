import "@kitware/vtk.js/favicon";
import { vec3, quat, mat4 } from "gl-matrix";
// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import "@kitware/vtk.js/Rendering/Profiles/Geometry";
import "@kitware/vtk.js/Rendering/Profiles/Volume"
import '@kitware/vtk.js/Rendering/Profiles/Glyph';
///
// Force DataAccessHelper to have access to various data source
import "@kitware/vtk.js/IO/Core/DataAccessHelper/HtmlDataAccessHelper";
import "@kitware/vtk.js/IO/Core/DataAccessHelper/HttpDataAccessHelper";
import "@kitware/vtk.js/IO/Core/DataAccessHelper/JSZipDataAccessHelper";
/////
import vtkFullScreenRenderWindow from "@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow";
import vtkHttpDataSetReader from "@kitware/vtk.js/IO/Core/HttpDataSetReader";
// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import vtkColorTransferFunction from "@kitware/vtk.js/Rendering/Core/ColorTransferFunction";
import vtkPiecewiseFunction from "@kitware/vtk.js/Common/DataModel/PiecewiseFunction";
import vtkVolume from "@kitware/vtk.js/Rendering/Core/Volume";
import vtkVolumeMapper from "@kitware/vtk.js/Rendering/Core/VolumeMapper";
import vtkPlane from "@kitware/vtk.js/Common/DataModel/Plane";
import vtkMatrixBuilder from "@kitware/vtk.js/Common/Core/MatrixBuilder";
import vtkImageMapper from "@kitware/vtk.js/Rendering/Core/ImageMapper";
import vtkImageSlice from "@kitware/vtk.js/Rendering/Core/ImageSlice";
import vtkWidgetManager from "@kitware/vtk.js/Widgets/Core/WidgetManager";
import vtkImageCroppingWidget from "@kitware/vtk.js/Widgets/Widgets3D/ImageCroppingWidget";
import vtkActor from "@kitware/vtk.js/Rendering/Core/Actor";
import vtkImageMarchingCubes from "@kitware/vtk.js/Filters/General/ImageMarchingCubes";
import vtkMapper from "@kitware/vtk.js/Rendering/Core/Mapper";


///

const controlPanel = `
<table>
<tr>
<label for="data">Choose data:</label>
<select class='dataValue'>
  <option value="chest">Chest</option>
  <option value="head">Head</option>
</select>
<div class='filters'>
<label for="filters">Choose a filter:</label>
<select class='filterValue'>
  <option value="clipping">Clipping</option>
  <option value="slicer">MultiSlice</option>
  <option value="cutter">Cropping</option>
</select>
<br><br>
</tr>
</table>
<table class='clipDiv' style="display:block">
    <tr >
        <td><b>Clip Plane 1</b></td>
        <tr>        
          <td>
            Position
            <input class='plane1Position' type="range" min="0" max="2.0" step="1" value="0" />
          </td>
          <td>
            Rotation
            <input class='plane1Rotation' type="range" min="0" max="2.0" step="1" value="0" />
          </td>
        </tr>
    </tr>
    <tr>
        <td><b>Clip Plane 2</b></td>
        <tr>        
          <td>
            Position
            <input class='plane2Position' type="range" min="0" max="2.0" step="1" value="0" />
          </td>
          <td>
            Rotation
            <input class='plane2Rotation' type="range"   min="0" max="2.0" step="1" value="0" />
          </td>
        </tr>
    </tr>
</table>
</div>
<div class='sliceDiv' style="display:none">
<table>
    <tr>
        <td>Slice I</td>
        <td>
            <input class='sliceI' type="range" min="0" max="2.0" step="1" value="1" />
        </td>
    </tr>
    <tr>
        <td>Slice J</td>
        <td>
            <input class='sliceJ' type="range" min="0" max="2.0" step="1" value="1" />
        </td>
    </tr>
    <tr>
        <td>Slice K</td>
        <td>
            <input class='sliceK' type="range" min="0" max="100" step="1" value="1" />
        </td>
    </tr>
    <tr>
        <td>Color level</td>
        <td>
            <input class='colorLevel' type="range" min="-3926" max="3926" step="1" value="1" />
        </td>
    </tr>
    <tr>
        <td>ColorWindow</td>
        <td>
            <input class='colorWindow' type="range" min="0" max="3926" step="1" value="1" />
        </td>
    </tr>
</table>
</div>
<div class='cropDiv' style="display:none">
<table>
  <tr>
    <td>pickable</td>
    <td>
      <input class='flag' data-name="pickable" type="checkbox" checked />
    </td>
  </tr>
  <tr>
    <td>visibility</td>
    <td>
      <input class='flag' data-name="visibility" type="checkbox" checked />
    </td>
  </tr>
  <tr>
    <td>contextVisibility</td>
    <td>
      <input class='flag' data-name="contextVisibility" type="checkbox" checked />
    </td>
  </tr>
  <tr>
    <td>handleVisibility</td>
    <td>
      <input class='flag' data-name="handleVisibility" type="checkbox" checked />
    </td>
  </tr>
  <tr>
    <td>faceHandlesEnabled</td>
    <td>
      <input class='flag' data-name="faceHandlesEnabled" type="checkbox" checked />
    </td>
  </tr>
  <tr>
    <td>edgeHandlesEnabled</td>
    <td>
      <input class='flag' data-name="edgeHandlesEnabled" type="checkbox" checked />
    </td>
  </tr>
  <tr>
    <td>cornerHandlesEnabled</td>
    <td>
      <input class='flag' data-name="cornerHandlesEnabled" type="checkbox" checked />
    </td>
  </tr>
  <tr>
    <td>
      <button data-action="addWidget">Add</button>
    </td>
    <td>
      <button data-action="removeWidget">Remove</button>
    </td>
  </tr>
</table>
</div>
</div>
<div class='iso' style="display:none">
<table>
  <tr>
    <td>Iso value</td>
    <td>
      <input class='isoValue' type="range" min="0.0" max="1.0" step="0.05" value="0.0" />
    </td>
  </tr>
</table>
</div>`;

/////

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
  background: [0, 0, 0],
});
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();
const apiRenderWindow = fullScreenRenderer.getApiSpecificRenderWindow(); //add api render window
fullScreenRenderer.addController(controlPanel);

// ----------------------------------------------------------------------------
const dataUrl = [
  `https://kitware.github.io/vtk-js/data/volume/LIDC2.vti/`,
  `https://kitware.github.io/vtk-js/data/volume/headsq.vti`,
];
// ----------------------------------------------------------------------------
// Setup combo box functions
// ----------------------------------------------------------------------------
const filterSelection = document.querySelector(".filterValue");
filterSelection.addEventListener("change", filterChanged);
const dataSelection = document.querySelector(".dataValue");
dataSelection.addEventListener("change", dataChanged);

function filterChanged() {
  if (filterSelection.value === "clipping") {
    document.querySelector(".clipDiv").setAttribute("style", "display:block");
    document.querySelector(".sliceDiv").setAttribute("style", "display:none");
    document.querySelector(".cropDiv").setAttribute("style", "display:none");
    document.querySelector(".iso").setAttribute("style", "display:none");

    actorClip.setVisibility(1);
    imageActorI.setVisibility(0);
    imageActorJ.setVisibility(0);
    imageActorK.setVisibility(0);
    actorCut.setVisibility(0);
    actoriso.setVisibility(0);
  } else if (filterSelection.value === "slicer") {
    document.querySelector(".clipDiv").setAttribute("style", "display:none");
    document.querySelector(".sliceDiv").setAttribute("style", "display:block");
    document.querySelector(".cropDiv").setAttribute("style", "display:none");
    document.querySelector(".iso").setAttribute("style", "display:none");

    actorClip.setVisibility(0);
    imageActorI.setVisibility(1);
    imageActorJ.setVisibility(1);
    imageActorK.setVisibility(1);
    actorCut.setVisibility(0);
    actoriso.setVisibility(0);
  } else if (filterSelection.value === "cutter") {
    document.querySelector(".clipDiv").setAttribute("style", "display:none");
    document.querySelector(".sliceDiv").setAttribute("style", "display:none");
    document.querySelector(".cropDiv").setAttribute("style", "display:block");
    document.querySelector(".iso").setAttribute("style", "display:none");
    actorClip.setVisibility(0);
    imageActorI.setVisibility(0);
    imageActorJ.setVisibility(0);
    imageActorK.setVisibility(0);
    actorCut.setVisibility(1);
    actoriso.setVisibility(0)
  } else {
    alert("Please select an option!");
  }
}
function dataChanged() {
  if (dataSelection.value === "chest") {
    alert(dataSelection.value)
    document.querySelector(".filters").setAttribute("style", "display:block");
    document.querySelector(".clipDiv").setAttribute("style", "display:block");
    document.querySelector(".iso").setAttribute("style", "display:none");
    actorClip.setVisibility(1);
    actoriso.setVisibility(0)
  } else {
    alert(dataSelection.value)
    document.querySelector(".filters").setAttribute("style", "display:none");
    document.querySelector(".clipDiv").setAttribute("style", "display:none");
    document.querySelector(".sliceDiv").setAttribute("style", "display:none");
    document.querySelector(".cropDiv").setAttribute("style", "display:none");
    document.querySelector(".iso").setAttribute("style", "display:block");
    actorClip.setVisibility(0);
    imageActorI.setVisibility(0);
    imageActorJ.setVisibility(0);
    imageActorK.setVisibility(0);
    actorCut.setVisibility(0);
    actoriso.setVisibility(1)
  }
}
/////
const reader = vtkHttpDataSetReader.newInstance({ fetchGzip: true });

const actorClip = vtkVolume.newInstance();
const mapperClip = vtkVolumeMapper.newInstance();
mapperClip.setSampleDistance(1.1);
actorClip.setMapper(mapperClip);

const clipPlane1 = vtkPlane.newInstance();
const clipPlane2 = vtkPlane.newInstance();
let clipPlane1Position = 0;
let clipPlane2Position = 0;
let clipPlane1RotationAngle = 0;
let clipPlane2RotationAngle = 0;
const clipPlane1Normal = [-1, 1, 0];
const clipPlane2Normal = [0, 0, 1];
const rotationNormal = [0, 1, 0];

// create color and opacity transfer functions
const ctfun = vtkColorTransferFunction.newInstance();
ctfun.addRGBPoint(0, 85 / 255.0, 0, 0);
ctfun.addRGBPoint(95, 1.0, 1.0, 1.0);
ctfun.addRGBPoint(225, 0.66, 0.66, 0.5);
ctfun.addRGBPoint(255, 0.3, 1.0, 0.5);
const ofun = vtkPiecewiseFunction.newInstance();
ofun.addPoint(0.0, 0.0);
ofun.addPoint(255.0, 1.0);
actorClip.getProperty().setRGBTransferFunction(0, ctfun);
actorClip.getProperty().setScalarOpacity(0, ofun);
actorClip.getProperty().setScalarOpacityUnitDistance(0, 3.0);
actorClip.getProperty().setInterpolationTypeToLinear();
actorClip.getProperty().setUseGradientOpacity(0, true);
actorClip.getProperty().setGradientOpacityMinimumValue(0, 2);
actorClip.getProperty().setGradientOpacityMinimumOpacity(0, 0.0);
actorClip.getProperty().setGradientOpacityMaximumValue(0, 20);
actorClip.getProperty().setGradientOpacityMaximumOpacity(0, 1.0);
actorClip.getProperty().setShade(true);
actorClip.getProperty().setAmbient(0.2);
actorClip.getProperty().setDiffuse(0.7);
actorClip.getProperty().setSpecular(0.3);
actorClip.getProperty().setSpecularPower(8.0);

mapperClip.setInputConnection(reader.getOutputPort());

reader.setUrl(dataUrl[0]).then(() => {
  reader.loadData().then(() => {
    const data = reader.getOutputData();
    const extent = data.getExtent();
    const spacing = data.getSpacing();
    const sizeX = extent[1] * spacing[0];
    const sizeY = extent[3] * spacing[1];

    clipPlane1Position = sizeX / 4;
    clipPlane2Position = sizeY / 2;
    const clipPlane1Origin = [
      clipPlane1Position * clipPlane1Normal[0],
      clipPlane1Position * clipPlane1Normal[1],
      clipPlane1Position * clipPlane1Normal[2],
    ];
    const clipPlane2Origin = [
      clipPlane2Position * clipPlane2Normal[0],
      clipPlane2Position * clipPlane2Normal[1],
      clipPlane2Position * clipPlane2Normal[2],
    ];

    clipPlane1.setNormal(clipPlane1Normal);
    clipPlane1.setOrigin(clipPlane1Origin);
    clipPlane2.setNormal(clipPlane2Normal);
    clipPlane2.setOrigin(clipPlane2Origin);
    mapperClip.addClippingPlane(clipPlane1);
    mapperClip.addClippingPlane(clipPlane2);

    renderer.addVolume(actorClip);
    const interactor = renderWindow.getInteractor();
    interactor.setDesiredUpdateRate(15.0);
    renderer.resetCamera();
    renderer.getActiveCamera().elevation(70);
    renderWindow.render();

    let el = document.querySelector(".plane1Position");
    el.setAttribute("min", -sizeX);
    el.setAttribute("max", sizeX);
    el.setAttribute("value", clipPlane1Position);

    el = document.querySelector(".plane2Position");
    el.setAttribute("min", -sizeY);
    el.setAttribute("max", sizeY);
    el.setAttribute("value", clipPlane2Position);

    el = document.querySelector(".plane1Rotation");
    el.setAttribute("min", 0);
    el.setAttribute("max", 180);
    el.setAttribute("value", clipPlane1RotationAngle);

    el = document.querySelector(".plane2Rotation");
    el.setAttribute("min", 0);
    el.setAttribute("max", 180);
    el.setAttribute("value", clipPlane2RotationAngle);
    ///// slicer
    const dataRange = data.getPointData().getScalars().getRange();

    const imageMapperK = vtkImageMapper.newInstance();
    imageMapperK.setInputData(data);
    imageMapperK.setKSlice(30);
    imageActorK.setMapper(imageMapperK);

    const imageMapperJ = vtkImageMapper.newInstance();
    imageMapperJ.setInputData(data);
    imageMapperJ.setJSlice(30);
    imageActorJ.setMapper(imageMapperJ);

    const imageMapperI = vtkImageMapper.newInstance();
    imageMapperI.setInputData(data);
    imageMapperI.setISlice(30);
    imageActorI.setMapper(imageMapperI);

    renderer.resetCamera();
    renderer.resetCameraClippingRange();
    renderWindow.render();

    [".sliceI", ".sliceJ", ".sliceK"].forEach((selector, idx) => {
      const el3 = document.querySelector(selector);
      el3.setAttribute("min", extent[idx * 2 + 0]);
      el3.setAttribute("max", extent[idx * 2 + 1]);
      el3.setAttribute("value", 30);
    });

    [".colorLevel", ".colorWindow"].forEach((selector) => {
      document.querySelector(selector).setAttribute("max", dataRange[1]);
      document.querySelector(selector).setAttribute("value", dataRange[1]);
    });
    document
      .querySelector(".colorLevel")
      .setAttribute("value", (dataRange[0] + dataRange[1]) / 2);
    updateColorLevel();
    updateColorWindow();
    renderer.resetCamera();
    renderer.resetCameraClippingRange();
    renderWindow.render();
  });
});

document.querySelector(".plane1Position").addEventListener("input", (e) => {
  clipPlane1Position = Number(e.target.value);
  const clipPlane1Origin = [
    clipPlane1Position * clipPlane1Normal[0],
    clipPlane1Position * clipPlane1Normal[1],
    clipPlane1Position * clipPlane1Normal[2],
  ];
  clipPlane1.setOrigin(clipPlane1Origin);
  renderWindow.render();
});

document.querySelector(".plane1Rotation").addEventListener("input", (e) => {
  const changedDegree = Number(e.target.value) - clipPlane1RotationAngle;
  clipPlane1RotationAngle = Number(e.target.value);
  vtkMatrixBuilder
    .buildFromDegree()
    .rotate(changedDegree, rotationNormal)
    .apply(clipPlane1Normal);
  clipPlane1.setNormal(clipPlane1Normal);
  renderWindow.render();
});

document.querySelector(".plane2Position").addEventListener("input", (e) => {
  clipPlane2Position = Number(e.target.value);
  const clipPlane2Origin = [
    clipPlane2Position * clipPlane2Normal[0],
    clipPlane2Position * clipPlane2Normal[1],
    clipPlane2Position * clipPlane2Normal[2],
  ];
  clipPlane2.setOrigin(clipPlane2Origin);
  renderWindow.render();
});

document.querySelector(".plane2Rotation").addEventListener("input", (e) => {
  const changedDegree = Number(e.target.value) - clipPlane2RotationAngle;
  clipPlane2RotationAngle = Number(e.target.value);
  vtkMatrixBuilder
    .buildFromDegree()
    .rotate(changedDegree, rotationNormal)
    .apply(clipPlane2Normal);
  clipPlane2.setNormal(clipPlane2Normal);
  renderWindow.render();
});

// -----------------------------------------------------------
// Make some variables global so that you can inspect and
// modify objects in your browser's developer console:
// -----------------------------------------------------------

global.source = reader;
global.mapperClip = mapperClip;
global.actorClip = actorClip;
global.ctfun = ctfun;
global.ofun = ofun;
global.renderer = renderer;
global.renderWindow = renderWindow;
global.clipPlane1 = clipPlane1;
global.clipPlane2 = clipPlane2;
///// Slicer
const imageActorI = vtkImageSlice.newInstance();
const imageActorJ = vtkImageSlice.newInstance();
const imageActorK = vtkImageSlice.newInstance();

renderer.addActor(imageActorK);
renderer.addActor(imageActorJ);
renderer.addActor(imageActorI);

function updateColorLevel(e) {
  const colorLevel = Number(
    (e ? e.target : document.querySelector(".colorLevel")).value
  );
  imageActorI.getProperty().setColorLevel(colorLevel);
  imageActorJ.getProperty().setColorLevel(colorLevel);
  imageActorK.getProperty().setColorLevel(colorLevel);
  renderWindow.render();
}

function updateColorWindow(e) {
  const colorLevel = Number(
    (e ? e.target : document.querySelector(".colorWindow")).value
  );
  imageActorI.getProperty().setColorWindow(colorLevel);
  imageActorJ.getProperty().setColorWindow(colorLevel);
  imageActorK.getProperty().setColorWindow(colorLevel);
  renderWindow.render();
}
document.querySelector(".sliceI").addEventListener("input", (e) => {
  imageActorI.getMapper().setISlice(Number(e.target.value));
  renderWindow.render();
});

document.querySelector(".sliceJ").addEventListener("input", (e) => {
  imageActorJ.getMapper().setJSlice(Number(e.target.value));
  renderWindow.render();
});

document.querySelector(".sliceK").addEventListener("input", (e) => {
  imageActorK.getMapper().setKSlice(Number(e.target.value));
  renderWindow.render();
});

document
  .querySelector(".colorLevel")
  .addEventListener("input", updateColorLevel);
document
  .querySelector(".colorWindow")
  .addEventListener("input", updateColorWindow);

global.imageActorI = imageActorI;
global.imageActorJ = imageActorJ;
global.imageActorK = imageActorK;
imageActorI.setVisibility(0);
imageActorJ.setVisibility(0);
imageActorK.setVisibility(0);

//// croping

const overlaySize = 15;
const overlayBorder = 2;
const overlay = document.createElement("div");
overlay.style.position = "absolute";
overlay.style.width = `${overlaySize}px`;
overlay.style.height = `${overlaySize}px`;
overlay.style.border = `solid ${overlayBorder}px red`;
overlay.style.borderRadius = "50%";
overlay.style.left = "-100px";
overlay.style.pointerEvents = "none";
document.querySelector("body").appendChild(overlay);
const widgetManager = vtkWidgetManager.newInstance();
widgetManager.setRenderer(renderer);

const widget = vtkImageCroppingWidget.newInstance();

function widgetRegistration(e) {
  const action = e ? e.currentTarget.dataset.action : "addWidget";
  const viewWidget = widgetManager[action](widget);
  if (viewWidget) {
    viewWidget.setDisplayCallback((coords) => {
      overlay.style.left = "-100px";
      if (coords) {
        const [w, h] = apiRenderWindow.getSize();
        overlay.style.left = `${Math.round(
          (coords[0][0] / w) * window.innerWidth -
            overlaySize * 0.5 -
            overlayBorder
        )}px`;
        overlay.style.top = `${Math.round(
          ((h - coords[0][1]) / h) * window.innerHeight -
            overlaySize * 0.5 -
            overlayBorder
        )}px`;
      }
    });

    renderer.resetCamera();
    renderer.resetCameraClippingRange();
  }
  widgetManager.enablePicking();
  renderWindow.render();
}
// Initial widget register
widgetRegistration();

// ----------------------------------------------------------------------------
// Volume rendering
// ----------------------------------------------------------------------------
const actorCut = vtkVolume.newInstance();
const mapperCut = vtkVolumeMapper.newInstance();
const reader3 = vtkHttpDataSetReader.newInstance({ fetchGzip: true });

mapperCut.setSampleDistance(1.1);
actorCut.setMapper(mapperCut);

// create color and opacity transfer functions
actorCut.getProperty().setRGBTransferFunction(0, ctfun);
actorCut.getProperty().setScalarOpacity(0, ofun);
actorCut.getProperty().setScalarOpacityUnitDistance(0, 3.0);
actorCut.getProperty().setInterpolationTypeToLinear();
actorCut.getProperty().setUseGradientOpacity(0, true);
actorCut.getProperty().setGradientOpacityMinimumValue(0, 2);
actorCut.getProperty().setGradientOpacityMinimumOpacity(0, 0.0);
actorCut.getProperty().setGradientOpacityMaximumValue(0, 20);
actorCut.getProperty().setGradientOpacityMaximumOpacity(0, 1.0);
actorCut.getProperty().setShade(true);
actorCut.getProperty().setAmbient(0.2);
actorCut.getProperty().setDiffuse(0.7);
actorCut.getProperty().setSpecular(0.3);
actorCut.getProperty().setSpecularPower(8.0);

mapperCut.setInputConnection(reader3.getOutputPort());
function getCroppingPlanes(imageData, ijkPlanes) {
  const rotation = quat.create();
  mat4.getRotation(rotation, imageData.getIndexToWorld());

  const rotateVec = (vec) => {
    const out = [0, 0, 0];
    vec3.transformQuat(out, vec, rotation);
    return out;
  };

  const [iMin, iMax, jMin, jMax, kMin, kMax] = ijkPlanes;
  const origin = imageData.indexToWorld([iMin, jMin, kMin]);
  // opposite corner from origin
  const corner = imageData.indexToWorld([iMax, jMax, kMax]);
  return [
    // X min/max
    vtkPlane.newInstance({ normal: rotateVec([1, 0, 0]), origin }),
    vtkPlane.newInstance({ normal: rotateVec([-1, 0, 0]), origin: corner }),
    // Y min/max
    vtkPlane.newInstance({ normal: rotateVec([0, 1, 0]), origin }),
    vtkPlane.newInstance({ normal: rotateVec([0, -1, 0]), origin: corner }),
    // X min/max
    vtkPlane.newInstance({ normal: rotateVec([0, 0, 1]), origin }),
    vtkPlane.newInstance({ normal: rotateVec([0, 0, -1]), origin: corner }),
  ];
}

function updateFlag(e) {
  const value = !!e.target.checked;
  const name = e.currentTarget.dataset.name;
  widget.set({ [name]: value }); // can be called on either viewWidget or parentWidget

  widgetManager.enablePicking();
  renderWindow.render();
}
reader3.setUrl(dataUrl[0]).then(() => {
  reader3.loadData().then(() => {
    const image = reader3.getOutputData();

    // update crop widget
    widget.copyImageDataDescription(image);
    const cropState = widget.getWidgetState().getCroppingPlanes();
    cropState.onModified(() => {
      const planes = getCroppingPlanes(image, cropState.getPlanes());
      mapperCut.removeAllClippingPlanes();
      planes.forEach((plane) => {
        mapperCut.addClippingPlane(plane);
      });
      mapperCut.modified();
    });

    // add volume to renderer
    renderer.addVolume(actorCut);
    renderer.resetCamera();
    renderer.resetCameraClippingRange();
    renderWindow.render();
  });
});

const elems = document.querySelectorAll(".flag");
for (let i = 0; i < elems.length; i++) {
  elems[i].addEventListener("change", updateFlag);
}

const buttons = document.querySelectorAll("button");
for (let i = 0; i < buttons.length; i++) {
  buttons[i].addEventListener("click", widgetRegistration);
}
actorCut.setVisibility(0);




///isoFile

const actoriso = vtkActor.newInstance();
const mapperiso = vtkMapper.newInstance();
const marchingCube = vtkImageMarchingCubes.newInstance({
  contourValue: 0.0,
  computeNormals: true,
  mergePoints: true,
});

actoriso.setMapper(mapperiso);
mapperiso.setInputConnection(marchingCube.getOutputPort());

function updateIsoValue(e) {
  const isoValue = Number(e.target.value);
  marchingCube.setContourValue(isoValue);
  renderWindow.render();
}

const reader2 = vtkHttpDataSetReader.newInstance({ fetchGzip: true });
marchingCube.setInputConnection(reader2.getOutputPort());

reader2.setUrl(dataUrl[1], { loadData: true }).then(() => {
  const data2 = reader2.getOutputData();
  const dataRange2 = data2.getPointData().getScalars().getRange();
  const firstIsoValue = (dataRange2[0] + dataRange2[1]) / 3;

  const el = document.querySelector(".isoValue");
  el.setAttribute("min", dataRange2[0]);
  el.setAttribute("max", dataRange2[1]);
  el.setAttribute("value", firstIsoValue);
  el.addEventListener("input", updateIsoValue);

  marchingCube.setContourValue(firstIsoValue);
  renderer.addActor(actoriso);
  renderer.resetCamera();
  renderWindow.render();
});

global.actoriso = actoriso;
global.mapperiso = mapperiso;
global.marchingCube = marchingCube;
actoriso.setVisibility(0)
