var MOD44B061 = ee.ImageCollection('MODIS/061/MOD44B'),
    MOD44B006 = ee.ImageCollection('MODIS/006/MOD44B'),
    GLOBMAPFTC = ee.ImageCollection('projects/ee-lizhengsam/assets/Stage-B/Exp-A/others/GLOBMAPFTC'),
    GLCLUFH_2000 = ee.Image('projects/glad/GLCLU2020/Forest_height_2000'),
    GLCLUFH_2020 = ee.Image('projects/glad/GLCLU2020/Forest_height_2020');

var canopyCvrVis = {
  min: 0, 
  max: 100, 
  palette: ['bbe029', '0a9501', '074b03']
};

var canopyHgtVis = {
  min: 0, 
  max: 40, 
  palette: ['bbe029', '0a9501', '074b03']
};

// define target years
var targetYears = ee.List([2000, 2001, 2002, 2019, 2020, 2021]);

// reproject
function resampleImg(image, fromPrj, fromScl, toScl){
  return image.reproject({crs: fromPrj, scale: fromScl})
              .reduceResolution({reducer: ee.Reducer.mean(), maxPixels: 1024})
              .reproject({crs: 'EPSG:4326', scale: toScl})
              .rename('b1')
              .toByte();
}

// load canopy cover data from MOD44B
function getModImg(year) {
  var startDate = ee.Date.fromYMD(year, 1, 1);
  var endDate = startDate.advance(1, 'year');
  
  var mod44bImg_061 = MOD44B061.filterDate(startDate, endDate)
                               .select('Percent_Tree_Cover')
                               .mosaic();
  
  var tempYear = ee.Algorithms.If(ee.Number(year).eq(2021), 2020, year);
  startDate = ee.Date.fromYMD(tempYear, 1, 1);
  
  var mod44bImg_006 = MOD44B006.filterDate(startDate, endDate)
                               .select('Percent_Tree_Cover')
                               .mosaic();
  
  var latitudeMask = ee.Image.pixelLonLat()
                       .select('latitude')
                       .gt(57.5);
  var mod44bImg = mod44bImg_061.where(mod44bImg_061.eq(0).and(latitudeMask), mod44bImg_006);
  
  mod44bImg = resampleImg(mod44bImg, MOD44B061.first().projection(), 250, 250);
  return mod44bImg.set('year', year).unmask(0);
}

var mod44bImgs = targetYears.map(getModImg);
var mod44bCol = ee.ImageCollection.fromImages(mod44bImgs);

// load canopy cover data from GLOBMAP
function getGlbImg(year) {
  var startDate = ee.Date.fromYMD(year, 1, 1);
  var endDate = startDate.advance(1, 'year');
  
  var globmapImg = GLOBMAPFTC.filterDate(startDate, endDate)
                             .mosaic();
  
  globmapImg = resampleImg(globmapImg, GLOBMAPFTC.first().projection(), 250, 250);
  return globmapImg.set('year', year).unmask(0);
}

var globmapImgs = targetYears.map(getGlbImg);
var globmapCol = ee.ImageCollection.fromImages(globmapImgs);

// combine multi-source canopy data
var canopyCvrCol = mod44bCol.merge(globmapCol);

// get canopy cover data for special year
var canopyCvrCol_2001 = canopyCvrCol.filter(ee.Filter.inList('year', ee.List([2000, 2001, 2002])));
var canopyCvrImg_2001 = canopyCvrCol_2001.reduce(ee.Reducer.intervalMean(0, 70)).rename('b1');

var canopyCvrCol_2020 = canopyCvrCol.filter(ee.Filter.inList('year', ee.List([2019, 2020, 2021])));
var canopyCvrImg_2020 = canopyCvrCol_2020.reduce(ee.Reducer.intervalMean(0, 70)).rename('b1');

canopyCvrImg_2001 = resampleImg(canopyCvrImg_2001, GLOBMAPFTC.first().projection(), 250, 250);
Map.addLayer(canopyCvrImg_2001, canopyCvrVis, 'Canopy Cover 2001', false);

canopyCvrImg_2020 = resampleImg(canopyCvrImg_2020, GLOBMAPFTC.first().projection(), 250, 250);
Map.addLayer(canopyCvrImg_2020, canopyCvrVis, 'Canopy Cover 2020', false);

var canopyHgtImg_2001 = resampleImg(GLCLUFH_2000, GLCLUFH_2000.projection(), 30, 250);
Map.addLayer(canopyHgtImg_2001, canopyHgtVis, 'Canopy Height 2001', false);

var canopyHgtImg_2020 = resampleImg(GLCLUFH_2020, GLCLUFH_2020.projection(), 30, 250);
Map.addLayer(canopyHgtImg_2020, canopyHgtVis, 'Canopy Height 2020', false);

// export
function exportImg(image, fileName, scale, folderName) {
  Export.image.toDrive({
    image: image,
    description: fileName,
    fileNamePrefix: fileName,
    scale: scale,
    crs: 'EPSG:4326',
    folder: folderName,
    maxPixels: 1e13
  });
}

exportImg(canopyCvrImg_2001, 'canopy_cover_2001', 250, 'CanopyCover');
exportImg(canopyCvrImg_2020, 'canopy_cover_2020', 250, 'CanopyCover');

exportImg(canopyHgtImg_2001, 'canopy_height_2001', 250, 'CanopyHeight');
exportImg(canopyHgtImg_2020, 'canopy_height_2020', 250, 'CanopyHeight');
