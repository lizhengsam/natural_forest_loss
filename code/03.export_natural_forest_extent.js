var CanopyCover = ee.ImageCollection('projects/ee-lizhengsam/assets/Stage-B/Exp-A/myfile/CanopyCover'),
    CanopyHeight = ee.ImageCollection('projects/ee-lizhengsam/assets/Stage-B/Exp-A/myfile/CanopyHeight'),
    CanopyUse = ee.ImageCollection('projects/ee-lizhengsam/assets/Stage-B/Exp-A/myfile/CanopyUse');

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

var canopyUseMask_2001 = canopyUseImg_2001.lt(3).and(canopyUseImg_2001.gt(0));

var canopyUseMask_2020_1 = canopyUseImg_2020.lt(3).and(canopyUseImg_2020.gt(0));
var canopyUseMask_2020_2 = canopyUseMask_2001.and(canopyUseImg_2020.eq(0).or(canopyUseImg_2020.eq(7))).and(canopyMask_2020);
var canopyUseMask_2020 = canopyUseMask_2020_1.or(canopyUseMask_2020_2);

// combine masks to define forest extent
var forestExtMask_2001 = canopyUseMask_2001.and(canopyCvrMask_2001).and(canopyHgtMask_2001);
Map.addLayer(forestExtMask_2001, forestExtVis, 'Forest Extent 2001', false);

var forestExtMask_2020 = canopyUseMask_2020.and(canopyCvrMask_2020).and(canopyHgtMask_2020);
Map.addLayer(forestExtMask_2020, forestExtVis, 'Forest Extent 2020', false);

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

exportImg(forestExtMask_2001, 'forest_extent_2001', 250, 'ForestExtent');
exportImg(forestExtMask_2020, 'forest_extent_2020', 250, 'ForestExtent');
