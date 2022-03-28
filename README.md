

# Data visualizer

A website to visualize data using @kitware/vtkjs , react and Nodejs.
  


# Features

 - Surface & Volume rendering.
 - Interactive widget.
 -  Clipping the volume 
 - Volume Contour
- Multi-Slice Image
- Marching Cubes
- Interactive Cropping volume widget
 ## Controls
 - Rotation.
 - Change Viewing distance.
 - Independent Actor Setup.
 - Responsive Ui.
 # Tools:
 - Vs Code.
 - Git
 - Yarn 
 ## Main points :
 - ### Main Pipeline:
   ##### Data ---> Reader ---> Filter ---> Mapper ---> Actor ---> Renderer ---> RenderWindow.
    - Marching cubes is an example of filter used for surface rendering.
    - Multiple branches can be connected to same reader.
    - Many actor can be added to renderer.
 - ##### First we have to setup the window. 
  ```javascript
    const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({background: [0, 0, 0],});
    const renderer = fullScreenRenderer.getRenderer();
    const renderWindow = fullScreenRenderer.getRenderWindow();
    const apiRenderWindow = fullScreenRenderer.getApiSpecificRenderWindow(); //get the api for the widgets
    fullScreenRenderer.addController(controlPanel); //add the controlPanel
```
 - ##### Second setup actors & link them with mapper.
   ###### There are two types, volume and surface.
  ```javascript
    const actorClip = vtkVolume.newInstance();  //This is a volume actor
    const mapperClip = vtkVolumeMapper.newInstance(); //This is a volume mapper
    actorClip.setMapper(mapperClip);
    mapperClip.setInputConnection(reader.getOutputPort());//send the data from the reader to the mapper
    -----------------------------------------------------------------------
    const actoriso = vtkActor.newInstance(); //This is surface actor
    const mapperiso = vtkMapper.newInstance(); //This is surface mapper
    actoriso.setMapper(mapperiso); //Link the mapper with actor
```
- ##### After that  we have to read the data.
```javascript
    const reader = vtkHttpDataSetReader.newInstance({ fetchGzip: true });
    reader.setUrl('Url Goes Here', { loadData: true }).then(() => {
    const data = reader.getOutputData();
    const dataRange = data.getPointData().getScalars().getRange();
    const firstIsoValue = (dataRange2[0] + dataRange2[1]) / 3;
    renderer.addActor(actoriso); //After reading the data we add the actor to be rendered
    renderer.resetCamera();
    renderWindow.render();
    });
``` 
- ##### So after adding all the actors to be rendered , which one should we display?
  - We can control that by setup a Listener for any change in combobox .
   ```javascript
    const filterSelection = document.querySelector(".filterValue");
    filterSelection.addEventListener("change", filterChanged);});
    ``` 
    - After that we Toggle the visibilty of the actors, so that only the chosen be displayed.
     ```javascript
    actorClip.setVisibility(1); //This actor will be displayed.
    actorCut.setVisibility(0); //This actor will be hidden
    actoriso.setVisibility(0); //This actor will be hidden
    ```
- ##### For volume rendering It's preferred to use Color function & Opacity.
    - Color function: Find out the voxel color.
    ```javascript
    const ctfun = vtkColorTransferFunction.newInstance();
    ctfun.addRGBPoint(0, 85 / 255.0, 0, 0);
    ctfun.addRGBPoint(95, 1.0, 1.0, 1.0);
    ctfun.addRGBPoint(225, 0.66, 0.66, 0.5);
    ctfun.addRGBPoint(255, 0.3, 1.0, 0.5);
    ```
    - Opacity function: Find out which voxel to be displayed
    ```javascript
    const ofun = vtkPiecewiseFunction.newInstance();
    ofun.addPoint(0.0, 0.0);
    ofun.addPoint(255.0, 1.0);
    ```
    - Attach them to the actor.
    ```javascript
    actorClip.getProperty().setRGBTransferFunction(0, ctfun);
    actorClip.getProperty().setScalarOpacity(0, ofun);
    ```
 
 # Problems:
 - Multiple actor displayed at the same time. 
 	- Toggle the visibilty of actors	
 - Control Panel Too crowded.
  	- Change the css style from Display:Block ---> Display:None
 - Imports were incompatible.
  	- replace vtk.js/Sources  with @kitware/vtk.js
 # Starting:
 - Choose directory my-vtkjs-app
 - Example dir: "D:\Projects\MedView\my-vtkjs-app>" .
 - Write in terminal
   ```javascript
    yarn install
    ```
 - After installing write 
    ```javascript
    yarn start
    ```
 ## Screenshots

![App Gif](https://s10.gifyu.com/images/clipGif.gif)
![App gif](https://s10.gifyu.com/images/sliceGif.gif)
![App gif](https://s10.gifyu.com/images/isoGif.gif)
![App gif](https://s10.gifyu.com/images/cropGif.gif)
							                 




  ## Names:
  | Names       | Section           | Bench Number  |
| ------------- |:-------------:| -----:|
| [@Ahmed Gamal](https://github.com/Ahmed-gamal-elmahdy)     | 1 | 3 |
| [@Ahmed Osama](https://github.com/ahmedosamaismail)     | 1     |   2 |
| [@Mostafa Ibraheem basheer](https://github.com/Mostafa-Ibraheem-basheer) | 2      |    31 |
