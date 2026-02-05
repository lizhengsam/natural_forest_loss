var CanopyCover = ee.ImageCollection('projects/ee-lizhengsam/assets/Stage-B/Exp-A/myfile/CanopyCover'),
    CanopyHeight = ee.ImageCollection('projects/ee-lizhengsam/assets/Stage-B/Exp-A/myfile/CanopyHeight'),
    ForestExtent = ee.ImageCollection('projects/ee-lizhengsam/assets/Stage-B/Exp-A/myfile/ForestExtent'),
    ForestChange = ee.ImageCollection('projects/ee-lizhengsam/assets/Stage-B/Exp-A/myfile/ForestChange'),
    ESACCIAGB = ee.ImageCollection('projects/sat-io/open-datasets/ESA/ESA_CCI_AGB'),
    StableForestAgb = ee.Image('projects/ee-lizhengsam/assets/Stage-B/Exp-A/myfile/StableForestAgb_2'),
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
var isDefMask = canopyMinChgImg.eq(3);
var isDegMask = canopyMinChgImg.eq(2);

// load forest agb data
var cciAgbCol_2020 = ESACCIAGB.filterDate('2020-1-1', '2021-1-1');
var cciAgbImg_2020 = cciAgbCol_2020.mosaic()
                                   .select('AGB')
                                   .unmask(0);
var stableFrsAgbImg = StableForestAgb.select('b2').unmask(0);

// calculate total uncertainty squared (error propagation: σ_loss² = σ_stable² + σ_current²)
var cciAgbSdImg_2020 = cciAgbCol_2020.mosaic()
                                     .select('SD')
                                     .unmask(0);
var stableFrsAgbUncImg = StableForestAgb.select('b6').unmask(0);

var totalUnc = cciAgbSdImg_2020.pow(2)
                               .add(stableFrsAgbUncImg.pow(2))
                               .sqrt();

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
function getChgTypeMasks(forestTypeMasks, forestExtMask) {
  var finalMasks = [];
  
  var changeTypeItems = [
    {alias: 'los', content: isDefMask.or(isDegMask)},
    {alias: 'def', content: isDefMask},
    {alias: 'deg', content: isDegMask},
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

var changeTypeMasks = getChgTypeMasks(forestTypeMasks_2001, forestExtMask_2001);

// convert masks to agb statistics images
function getAgbStasImgs(changeTypeMasks) {
  var agbStasImgs = [];
  
  changeTypeMasks.forEach(function(mask) {
    var bandName = mask.bandNames().get(0);
    
    // area (ha)
    var areaImg = ee.Image.pixelArea()
                    .divide(10000)
                    .updateMask(mask)
                    .rename(ee.String(bandName).cat('_a'))
                    .unmask(0);
    
    // total agb in 2020 (mg)
    var agbImg_2020 = ee.Image.pixelArea()
                        .divide(10000)
                        .multiply(cciAgbImg_2020)
                        .updateMask(mask)
                        .rename(ee.String(bandName).cat('_c'))
                        .unmask(0);
    
    // total stable agb (mg)
    var stableAgbImg = ee.Image.pixelArea()
                         .divide(10000)
                         .multiply(stableFrsAgbImg)
                         .updateMask(mask)
                         .rename(ee.String(bandName).cat('_s'))
                         .unmask(0);
    
    // sum squared uncertainty
    var sumUncImg = ee.Image.pixelArea()
                        .divide(10000)
                        .multiply(totalUnc)
                        .updateMask(mask)
                        .rename(ee.String(bandName).cat('_u'))
                        .unmask(0);
    
    agbStasImgs.push(areaImg);
    agbStasImgs.push(agbImg_2020);
    agbStasImgs.push(stableAgbImg);
    agbStasImgs.push(sumUncImg);
  });
  
  return agbStasImgs;
}

var agbStasImgs = getAgbStasImgs(changeTypeMasks);

// combine all images into a multi-band image
var reduceImg = ee.Image.cat(agbStasImgs);

// define reducers for agb calculations
var bandNames = reduceImg.bandNames();
var sumRdc = ee.Reducer.sum().forEachBand(reduceImg);

// divide grids and process chunks
var chunkSize = 1500;

for (var chunkIdx = 0; chunkIdx < 38632 / chunkSize; chunkIdx++) {
  var gridSubList = Grids_RECT_05_2.toList(chunkSize, chunkIdx * chunkSize);
  var gridSubCol = ee.FeatureCollection(gridSubList);
  
  var reducedRsl = reduceImg.reduceRegions({
    collection: gridSubCol, 
    reducer: sumRdc, 
    scale: 100, 
    tileScale: 4
  });
  
  Export.table.toDrive({
    collection: reducedRsl,
    description: 'loss_agb_' + chunkIdx,
    fileNamePrefix: 'loss_agb_' + chunkIdx,
    fileFormat: 'SHP',
    folder: 'LossAgb'
  });
}
