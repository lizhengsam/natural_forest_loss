var CanopyCover = ee.ImageCollection('projects/ee-lizhengsam/assets/Stage-B/Exp-A/myfile/CanopyCover'),
    CanopyHeight = ee.ImageCollection('projects/ee-lizhengsam/assets/Stage-B/Exp-A/myfile/CanopyHeight'),
    CanopyUse = ee.ImageCollection('projects/ee-lizhengsam/assets/Stage-B/Exp-A/myfile/CanopyUse'),
    ForestExtent = ee.ImageCollection('projects/ee-lizhengsam/assets/Stage-B/Exp-A/myfile/ForestExtent'),
    Grids_RECT_05 = ee.FeatureCollection('projects/ee-lizhengsam/assets/Stage-B/Exp-A/region/Grids_RECT_05');

// load canopy cover data and create masks
var canopyCvrImg_2001 = CanopyCover.filterDate('2001-1-1', '2002-1-1').first();
var canopyCvrImg_2020 = CanopyCover.filterDate('2020-1-1', '2021-1-1').first();

var canopyCvrMask_2001_1 = canopyCvrImg_2001.gt(10);
var canopyCvrMask_2001_2 = canopyCvrImg_2001.gt(2.5).and(canopyCvrImg_2020.subtract(canopyCvrImg_2001).gt(2.5));
var canopyCvrMask_2001 = canopyCvrMask_2001_1.or(canopyCvrMask_2001_2);

// load canopy height data and create masks
var canopyHgtImg_2001 = CanopyHeight.filterDate('2001-1-1', '2002-1-1').first();
var canopyHgtImg_2020 = CanopyHeight.filterDate('2020-1-1', '2021-1-1').first();

var canopyHgtMask_2001_1 = canopyHgtImg_2001.gt(5);
var canopyHgtMask_2001_2 = canopyHgtImg_2001.gt(1.25).and(canopyHgtImg_2020.subtract(canopyHgtImg_2001).gt(1.25));
var canopyHgtMask_2001 = canopyHgtMask_2001_1.or(canopyHgtMask_2001_2);

// load forest extent data
var forestExtMask_2001 = ForestExtent.filterDate('2001-1-1', '2002-1-1').first();
var forestExtMask_2020 = ForestExtent.filterDate('2020-1-1', '2021-1-1').first();

// process year for conservative estimate
var canopyUseImg_2004 = CanopyUse.filterDate('2004-1-1', '2005-1-1').first();
var canopyUseMask_2004 = canopyUseImg_2004.lt(3).and(canopyUseImg_2004.gt(0));
var forestExtMask_2004 = canopyUseMask_2004.and(canopyCvrMask_2001).and(canopyHgtMask_2001);

// update canopy cover and height data with forest masks
canopyCvrImg_2001 = canopyCvrImg_2001.updateMask(forestExtMask_2001).unmask(0);
canopyCvrImg_2020 = canopyCvrImg_2020.updateMask(forestExtMask_2020).unmask(0);

canopyHgtImg_2001 = canopyHgtImg_2001.updateMask(forestExtMask_2001).unmask(0);
canopyHgtImg_2020 = canopyHgtImg_2020.updateMask(forestExtMask_2020).unmask(0);

// classify forests by canopy cover and height threshold
function getFrsTypeMasks(canopyCvrImg, canopyHgtImg, coverTrs, heightTrs, forestExtMask, year) {
  var isClsMask = canopyCvrImg.gt(coverTrs);
  var isHighMask = canopyHgtImg.gt(heightTrs);
  
  var forestTypeItems = [
    {alias: 'ch', content: isClsMask.and(isHighMask)},
    {alias: 'cl', content: isClsMask.and(isHighMask.not())},
    {alias: 'oh', content: isClsMask.not().and(isHighMask)},
    {alias: 'ol', content: isClsMask.not().and(isHighMask.not())}
  ];
  
  var finalMasks = forestTypeItems.map(function(item) {
    return item.content.updateMask(forestExtMask).rename(item.alias + '_' + year).unmask(0);
  });
  
  return finalMasks;
}

var forestTypeMasks_2001 = getFrsTypeMasks(canopyCvrImg_2001, canopyHgtImg_2001, 60, 15, forestExtMask_2001, '2001');
var forestTypeMasks_2004 = getFrsTypeMasks(canopyCvrImg_2001, canopyHgtImg_2001, 60, 15, forestExtMask_2004, '2004');
var forestTypeMasks_2020 = getFrsTypeMasks(canopyCvrImg_2020, canopyHgtImg_2020, 60, 15, forestExtMask_2020, '2020');

// combine area images into a multi-band image
var reduceImg = ee.Image.cat(forestTypeMasks_2001.concat(forestTypeMasks_2004).concat(forestTypeMasks_2020));
reduceImg = reduceImg.multiply(ee.Image.pixelArea()).unmask(0);

// define reducers for area calculations
var bandNames = reduceImg.bandNames();
var sumRdc = ee.Reducer.sum().forEachBand(reduceImg);

// define a unit constant for converting area to million hectares
var millionHa = 1e4 * 1e6;

// divide grids and process chunks
var chunkSize = 3000;

for (var chunkIdx = 0; chunkIdx < 70132 / chunkSize; chunkIdx++) {
  var gridSubList = Grids_RECT_05.toList(chunkSize, chunkIdx * chunkSize);
  var gridSubCol = ee.FeatureCollection(gridSubList);
  
  var reducedRsl = reduceImg.reduceRegions({
    collection: gridSubCol, 
    reducer: sumRdc, 
    scale: 250, 
    tileScale: 4
  }).map(function(feature) {
      var propertyVlus = bandNames.map(function(bandName) {
        var propertyName = ee.String(bandName);
        var propertyVlu = ee.Number(feature.get(propertyName));
        
        return propertyVlu.divide(millionHa);
    });
    var propertyDic = ee.Dictionary.fromLists(bandNames, propertyVlus);
    
    return feature.set(propertyDic);
  });
  
  Export.table.toDrive({
    collection: reducedRsl,
    description: 'forest_area_' + chunkIdx,
    fileNamePrefix: 'forest_area_' + chunkIdx,
    fileFormat: 'SHP',
    folder: 'ForestArea'
  });
}
