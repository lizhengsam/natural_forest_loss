var CanopyCover = ee.ImageCollection('projects/ee-lizhengsam/assets/Stage-B/Exp-A/myfile/CanopyCover'),
    CanopyHeight = ee.ImageCollection('projects/ee-lizhengsam/assets/Stage-B/Exp-A/myfile/CanopyHeight'),
    ForestExtent = ee.ImageCollection('projects/ee-lizhengsam/assets/Stage-B/Exp-A/myfile/ForestExtent'),
    ForestChange = ee.ImageCollection('projects/ee-lizhengsam/assets/Stage-B/Exp-A/myfile/ForestChange'),
    Grids_RECT_05_2 = ee.FeatureCollection('projects/ee-lizhengsam/assets/Stage-B/Exp-A/region/Grids_RECT_05_2');

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

// load forest change data
var canopyMinChgImg = ForestChange.filter(ee.Filter.eq('type', 'min')).first();
var canopyCvrChgImg = ForestChange.filter(ee.Filter.eq('type', 'cover')).first();
var canopyHgtChgImg = ForestChange.filter(ee.Filter.eq('type', 'height')).first();

// classify forests by canopy cover and height threshold
function getFrsTypeMasks(canopyCvrImg, canopyHgtImg, coverTrs, heightTrs, forestExtMask) {
  var isClsMask = canopyCvrImg.gt(coverTrs);
  var isHighMask = canopyHgtImg.gt(heightTrs);
  
  var forestTypeItems = [
    {alias: 'ch', content: isClsMask.and(isHighMask)},
    {alias: 'cl', content: isClsMask.and(isHighMask.not())},
    {alias: 'oh', content: isClsMask.not().and(isHighMask)},
    {alias: 'ol', content: isClsMask.not().and(isHighMask.not())}
  ];
  
  var finalMasks = forestTypeItems.map(function(item) {
    return item.content.updateMask(forestExtMask).rename(item.alias);
  });
  
  return finalMasks;
}

var forestTypeMasks_2001 = getFrsTypeMasks(canopyCvrImg_2001, canopyHgtImg_2001, 60, 15, forestExtMask_2001);
var forestTypeMasks_2020 = getFrsTypeMasks(canopyCvrImg_2020, canopyHgtImg_2020, 60, 15, forestExtMask_2020);

// create loss type images
function getChgTypeMasks_1(forestTypeMasks, forestExtMask) {
  var finalMasks = [];
  
  var changeTypeItems = [
    {alias: 'def', content: canopyMinChgImg.eq(3)},
    {alias: 'deg', content: canopyMinChgImg.eq(2)},
    {alias: 'degc', content: canopyCvrChgImg.eq(2)},
    {alias: 'degh', content: canopyHgtChgImg.eq(2)}
  ];
  
  changeTypeItems.forEach(function(item) {
    forestTypeMasks.forEach(function(mask) {
      var finalMask = item.content.and(mask).and(forestExtMask);
      finalMasks.push(finalMask.rename(ee.String(item.alias + '_').cat(mask.bandNames().get(0))).unmask(0));
    });
  });
  
  return finalMasks;
}

function getChgTypeMasks_2(forestTypeMasks, forestExtMask) {
  var finalMasks = [];
  
  var changeTypeItems = [
    {alias: 'exp', content: canopyMinChgImg.eq(4)}
  ];
  
  changeTypeItems.forEach(function(item) {
    forestTypeMasks.forEach(function(mask) {
      var finalMask = item.content.and(mask).and(forestExtMask);
      finalMasks.push(finalMask.rename(ee.String(item.alias + '_').cat(mask.bandNames().get(0))).unmask(0));
    });
  });
  
  return finalMasks;
}

var changeTypeMasks_1 = getChgTypeMasks_1(forestTypeMasks_2001, forestExtMask_2001);
var changeTypeMasks_2 = getChgTypeMasks_2(forestTypeMasks_2020, forestExtMask_2020);

// combine area images into a multi-band image
var reduceImg = ee.Image.cat(changeTypeMasks_1.concat(changeTypeMasks_2));
reduceImg = reduceImg.multiply(ee.Image.pixelArea()).unmask(0);

// define reducers for area calculations
var bandNames = reduceImg.bandNames();
var sumRdc = ee.Reducer.sum().forEachBand(reduceImg);

// define a unit constant for converting area to million hectares
var millionHa = 1e4 * 1e6;

// divide grids and process chunks
var chunkSize = 3000;

for (var chunkIdx = 0; chunkIdx < 38632 / chunkSize; chunkIdx++) {
  var gridSubList = Grids_RECT_05_2.toList(chunkSize, chunkIdx * chunkSize);
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
    var propertyDict = ee.Dictionary.fromLists(bandNames, propertyVlus);
    
    return feature.set(propertyDict);
  });
  
  Export.table.toDrive({
    collection: reducedRsl,
    description: 'loss_area_' + chunkIdx,
    fileNamePrefix: 'loss_area_' + chunkIdx,
    fileFormat: 'SHP',
    folder: 'LossArea'
  });
}
