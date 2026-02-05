var CanopyCover = ee.ImageCollection('projects/ee-lizhengsam/assets/Stage-B/Exp-A/myfile/CanopyCover'),
    CanopyHeight = ee.ImageCollection('projects/ee-lizhengsam/assets/Stage-B/Exp-A/myfile/CanopyHeight'),
    CanopyUse = ee.ImageCollection('projects/ee-lizhengsam/assets/Stage-B/Exp-A/myfile/CanopyUse'),
    ForestExtent = ee.ImageCollection('projects/ee-lizhengsam/assets/Stage-B/Exp-A/myfile/ForestExtent');

var canopyChgVis = {
  min: 0, 
  max: 5, 
  palette: ['f0f0f0', '32cd32', 'ffff00', 'ff00ff' ,'b22222', '0000cd']
};

var forestExtVis = {
  min: 0, 
  max: 1, 
  palette: ['f0f0f0', '32cd32']
};

// load canopy cover data and create masks
var canopyCvrImg_2001 = CanopyCover.filterDate('2001-1-1', '2002-1-1').first();
var canopyCvrImg_2020 = CanopyCover.filterDate('2020-1-1', '2021-1-1').first();

var canopyCvrMask_2001_1 = canopyCvrImg_2001.gt(10);
var canopyCvrChgVlu = canopyCvrImg_2020.subtract(canopyCvrImg_2001);
var canopyCvrMask_2001_2 = canopyCvrImg_2001.gt(2.5).and(canopyCvrChgVlu.gt(2.5));
var canopyCvrMask_2001 = canopyCvrMask_2001_1.or(canopyCvrMask_2001_2);

var canopyCvrMask_2020_1 = canopyCvrImg_2020.gt(10);
var canopyCvrMask_2020_2 = canopyCvrImg_2020.gt(5).and(canopyCvrMask_2001);
var canopyCvrMask_2020 = canopyCvrMask_2020_1.or(canopyCvrMask_2020_2);

// load canopy height data and create masks
var canopyHgtImg_2001 = CanopyHeight.filterDate('2001-1-1', '2002-1-1').first();
var canopyHgtImg_2020 = CanopyHeight.filterDate('2020-1-1', '2021-1-1').first();

var canopyHgtChgVlu = canopyHgtImg_2020.subtract(canopyHgtImg_2001);
var canopyHgtMask_2001_1 = canopyHgtImg_2001.gt(5);
var canopyHgtMask_2001_2 = canopyHgtImg_2001.gt(1.25).and(canopyHgtChgVlu.gt(1.25));
var canopyHgtMask_2001 = canopyHgtMask_2001_1.or(canopyHgtMask_2001_2);

var canopyHgtMask_2020_1 = canopyHgtImg_2020.gt(5);
var canopyHgtMask_2020_2 = canopyHgtImg_2020.gt(2.5).and(canopyHgtMask_2001);
var canopyHgtMask_2020 = canopyHgtMask_2020_1.or(canopyHgtMask_2020_2);

// create final canopy masks
var canopyMask_2001 = canopyCvrMask_2001.and(canopyHgtMask_2001);
var canopyMask_2020 = canopyCvrMask_2020.and(canopyHgtMask_2020);

// load canopy use data and create masks
var canopyUseImg_2001 = CanopyUse.filterDate('2001-1-1', '2002-1-1').first();
var canopyUseImg_2020 = CanopyUse.filterDate('2020-1-1', '2021-1-1').first();

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

// classify canopy cover and height recovery
var coverIsRcrMask_1 = canopyCvrImg_2020.gt(canopyCvrImg_2001.multiply(0.75));
var coverIsRcrMask_2 = canopyCvrImg_2020.subtract(canopyCvrImg_2001).gt(10);
var coverIsRcrMask = isStbMask.and(coverIsRcrMask_1).and(coverIsRcrMask_2);

var heightIsRcrMask_1 = canopyHgtImg_2020.gt(canopyHgtImg_2001.multiply(0.75));
var heightIsRcrMask_2 = canopyHgtImg_2020.subtract(canopyHgtImg_2001).gt(5);
var heightIsRcrMask = isStbMask.and(heightIsRcrMask_1).and(heightIsRcrMask_2);

var isDegMask_And = coverIsDegMask.and(heightIsDegMask);
var isRcrMask_And = coverIsRcrMask.and(heightIsRcrMask);

// get forest change image
function getFrsChgImg(isDegMask, isRecMask) {
   return ee.Image(0)
            .where(isStbMask, 1)  // stable forest
            .where(isDegMask, 2)  // degradation
            .where(isRecMask, 3)  // recovery
            .where(isDefMask, 4)  // deforestation
            .where(isExpMask, 5); // expansion
}

var canopyMinChgImg = getFrsChgImg(isDegMask_And, isRcrMask_And);
Map.addLayer(canopyMinChgImg, canopyChgVis, 'Canopy Min Change', false);

// changed forest extent
var changedExtMask = canopyMinChgImg.gt(1);
changedExtMask = changedExtMask.focalMax({kernel: ee.Kernel.circle({radius: 1}), iterations: 1});

var nonChgExtMask = changedExtMask.eq(0);

// load forest edge data
var allFrsExtMask = forestExtMask_2020.or(canopyUseImg_2020.lte(6)
                                                           .and(canopyUseImg_2020.gt(2))
                                                           .and(canopyMask_2020));
var coreFrsExtMask_1 = allFrsExtMask.convolve(ee.Kernel.square({radius: 1.5, units: 'pixels', normalize: true}));
coreFrsExtMask_1 = coreFrsExtMask_1.gte(0.5);

var coreFrsExtMask_2 = coreFrsExtMask_1.focalMin({kernel: ee.Kernel.circle({radius: 6}), iterations: 1});
var edgeExtMask = coreFrsExtMask_1.subtract(coreFrsExtMask_2).gt(0);

var nonEdgeExtMask = edgeExtMask.eq(0);

// get stable forest
var stableFrsExtMask = forestExtMask_2020.updateMask(nonChgExtMask).updateMask(nonEdgeExtMask);
Map.addLayer(stableFrsExtMask, forestExtVis, 'Stable Forest Extent', false);

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

exportImg(stableFrsExtMask, 'stable_forest_extent_1500', 250, 'ForestChange');
