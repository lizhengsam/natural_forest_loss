var CanopyCover = ee.ImageCollection('projects/ee-lizhengsam/assets/Stage-B/Exp-A/myfile/CanopyCover'),
    CanopyHeight = ee.ImageCollection('projects/ee-lizhengsam/assets/Stage-B/Exp-A/myfile/CanopyHeight'),
    ForestExtent = ee.ImageCollection('projects/ee-lizhengsam/assets/Stage-B/Exp-A/myfile/ForestExtent');

var canopyChgVis = {
  min: 0, 
  max: 4, 
  palette: ['f0f0f0', '01724c', 'ffc000', 'b12223', '3429ba']
};

// load canopy cover data
var canopyCvrImg_2001 = CanopyCover.filterDate('2001-1-1', '2002-1-1').first();
var canopyCvrImg_2020 = CanopyCover.filterDate('2020-1-1', '2021-1-1').first();

// load canopy height data
var canopyHgtImg_2001 = CanopyHeight.filterDate('2001-1-1', '2002-1-1').first();
var canopyHgtImg_2020 = CanopyHeight.filterDate('2020-1-1', '2021-1-1').first();

// load forest extent data
var forestExtMask_2001 = ForestExtent.filterDate('2001-1-1', '2002-1-1').first();
var forestExtMask_2020 = ForestExtent.filterDate('2020-1-1', '2021-1-1').first();

// update canopy cover and height data with forest masks
canopyCvrImg_2001 = canopyCvrImg_2001.updateMask(forestExtMask_2001).unmask(0);
canopyCvrImg_2020 = canopyCvrImg_2020.updateMask(forestExtMask_2020).unmask(0);

canopyHgtImg_2001 = canopyHgtImg_2001.updateMask(forestExtMask_2001).unmask(0);
canopyHgtImg_2020 = canopyHgtImg_2020.updateMask(forestExtMask_2020).unmask(0);

// classify canopy use changes
var isDefMask = forestExtMask_2001.eq(1).and(forestExtMask_2020.eq(0));
var isExpMask = forestExtMask_2001.eq(0).and(forestExtMask_2020.eq(1));
var isStbMask = forestExtMask_2001.eq(1).and(forestExtMask_2020.eq(1));

// classify canopy cover and height degradation
var coverIsDegMask_1 = canopyCvrImg_2020.lt(canopyCvrImg_2001.multiply(0.75));
var coverIsDegMask_2 = canopyCvrImg_2001.subtract(canopyCvrImg_2020).gt(10);
var coverIsDegMask = isStbMask.and(coverIsDegMask_1).and(coverIsDegMask_2);

var heightIsDegMask_1 = canopyHgtImg_2020.lt(canopyHgtImg_2001.multiply(0.75));
var heightIsDegMask_2 = canopyHgtImg_2001.subtract(canopyHgtImg_2020).gt(5);
var heightIsDegMask = isStbMask.and(heightIsDegMask_1).and(heightIsDegMask_2);

var isDegMask_Or = coverIsDegMask.or(heightIsDegMask);
var isDegMask_And = coverIsDegMask.and(heightIsDegMask);

// get forest change image
function getFrsChgImg(isDegMask) {
   return ee.Image(0)
            .where(isStbMask, 1)  // stable forest
            .where(isDegMask, 2)  // degradation
            .where(isDefMask, 3)  // deforestation
            .where(isExpMask, 4); // expansion
}

var canopyUseChgImg = getFrsChgImg(ee.Image(0));
Map.addLayer(canopyUseChgImg, canopyChgVis, 'Canopy Use Change', false);

var canopyCvrChgImg = getFrsChgImg(coverIsDegMask);
Map.addLayer(canopyCvrChgImg, canopyChgVis, 'Canopy Cover Change', false);

var canopyHgtChgImg = getFrsChgImg(heightIsDegMask);
Map.addLayer(canopyHgtChgImg, canopyChgVis, 'Canopy Height Change', false);

var canopyMaxChgImg = getFrsChgImg(isDegMask_Or);
Map.addLayer(canopyMaxChgImg, canopyChgVis, 'Canopy Max Change', false);

var canopyMinChgImg = getFrsChgImg(isDegMask_And);
Map.addLayer(canopyMinChgImg, canopyChgVis, 'Canopy Min Change', false);

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

exportImg(canopyUseChgImg, 'canopy_use_change', 250, 'ForestChange');
exportImg(canopyCvrChgImg, 'canopy_cover_change', 250, 'ForestChange');
exportImg(canopyHgtChgImg, 'canopy_height_change', 250, 'ForestChange');
exportImg(canopyMaxChgImg, 'canopy_max_change', 250, 'ForestChange');
exportImg(canopyMinChgImg, 'canopy_min_change', 250, 'ForestChange');
